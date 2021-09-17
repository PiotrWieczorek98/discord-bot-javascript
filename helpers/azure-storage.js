const { BlobServiceClient } = require('@azure/storage-blob');
const { envs } = require('../config.js');
const fs = require('fs');

// ##############################################################################
// This script allows upload and download from azure cloud
// ##############################################################################

// A helper function used to read a Node.js readable stream into a string
async function streamToString(readableStream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		readableStream.on('data', (data) => {
			chunks.push(data.toString());
		});
		readableStream.on('end', () => {
			resolve(chunks.join(''));
		});
		readableStream.on('error', reject);
	});
}


/**
 * Upload files to azure storage
 * @param {String} containerName
 * @param {String} path
 * @param {String} fileName
 */
async function uploadFileToAzure(containerName, path, fileName) {
	const fullPath = path.concat(fileName);
	try {
		// Check if file exists
		if (!fs.existsSync(fullPath)) {
			console.log(`File ${fullPath} does not exist!`);
			return;
		}

		console.log(`Uploading blob ${fileName}`);
		// Create the BlobServiceClient object which will be used to create a container client
		const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
		const containerClient = blobServiceClient.getContainerClient(containerName);

		// Create a blob client using the local file name as the name for the blob
		const blockBlobClient = containerClient.getBlockBlobClient(fileName);

		// Upload the created file
		await blockBlobClient.uploadFile(fullPath);
	}
	catch (error) {
		console.log('Failed uploading to azure!');
		throw 'Upload failed!';
	}
}

/**
 * Download files from azure storage
 * @param {String} containerName
 * @param {String} path
 * @param {String} blobName
 */
async function downloadFileFromAzure(containerName, path, blobName) {
	// Prevent overwriting
	if (fs.existsSync(path.concat(blobName))) {
		console.log(`Blob ${blobName} already downloaded!`);
		return;
	}

	try {
		console.log(`Downloading blob: ${blobName}`);

		// Create the BlobServiceClient object which will be used to create a container client
		const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
		const containerClient = blobServiceClient.getContainerClient(containerName);
		// Create a blob client using the local file name as the name for the blob
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		await blockBlobClient.downloadToFile(path.concat(blobName));
	}
	catch (error) {
		console.log(error);
	}
}

/**
 * Download all files in container
 * @param {String} containerName
 * @param {String} path
 */
async function downloadContainerFromAzure(containerName, path) {
	try {
		// Create the BlobServiceClient object which will be used to create a container client
		const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
		const containerClient = blobServiceClient.getContainerClient(containerName);

		let i = 1;
		for await (const blob of containerClient.listBlobsFlat()) {
			// Prevent overwriting
			if (fs.existsSync(path)) {
				console.log(`Blob ${blob.name} already downloaded!`);
			}
			else {
				console.log(`Downloading blob ${i++}: ${blob.name}`);
				// Create a blob client and download
				const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
				await blockBlobClient.downloadToFile(path.concat(blob.name));
			}
		}
	}
	catch (error) {
		console.log(error);
	}
}
