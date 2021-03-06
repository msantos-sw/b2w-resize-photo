const axios = require("axios");
const mongoose = require('mongoose');
const Image = mongoose.model('images');

const downloadService = require('./download-service');
const resizeService = require('./resize-service');

/**
 * First it will consume external service and retrieve the images URL, then
 * it will starts download and resize service.
 */
function start() {
	// request image list
	axios.get("http://54.152.221.29/images.json")
	.then( response => {

		// After requesting the list, download and resize images
		downloadAndResize(response).then( processedImages => {
			// Finally, persist in db
			for (var i = 0; i < processedImages.length; i++) {
				persistImage(processedImages[i]);
			}
		})
		.catch( err => {
			// error while downloading or resizing images
			console.log(err);
			console.log('Error in download-and-resize-service');
		});
	})
	.catch( err => {
		// error while requesting external service
		console.log(err);
		console.log('Error in image-service');
	});
}

/**
 * Starts download and resize service.
 * @param  {Object} extServiceRes external service response
 * @return {Promise} that will resolve when donwload ans resize finished.
 */
function downloadAndResize(extServiceRes) {
	return new Promise((resolve, reject) => {
		downloadService.start(extServiceRes.data.images)
		.then(downloadRes => {
			resizeService.start(downloadRes.success)
			.then(importRes => {
				resolve(importRes);
			})
			.catch( err => {
				// internal error in resize service
				console.log('Error in resize-service');
				reject(err);
			});
		})
		.catch( err => {
			// no image was downloaded
			console.log('Error in download-service');
			reject(err);
		});
	});

}

/**
 * Saves image data in database
 * @param  {Object} imageData Image data containing all file size names
 */
function persistImage(imageData) {
	var newImage = new Image(imageData);

	newImage.save(
		(err, dbResult) => {
			if (err) {
				console.log(err);
			}
		}
	);
}

exports.start = start;
