const { BlobServiceClient } = require('@azure/storage-blob');
const { envs } = require('./env-vars.js');
const fs = require('fs');

// ##############################################################################
// This script allows communication with azure storage
// ##############################################################################

class Azure {

	/**
	 * Upload files to azure storage
	 * @param {String} containerName
	 * @param {String} path
	 * @param {String} fileName
	 */
	static async uploadBlob(containerName, path, fileName) {
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
	 * @param {String} savePath
	 * @param {String} blobName
	 * @param {String} fileName
	 * @param {String} option
	 */
	static async downloadBlob(containerName, savePath, blobName, fileName = '', option = '') {
		if (fileName == '') {
			fileName = blobName;
		}
		const fullPath = savePath + fileName;
		// Prevent overwriting
		if (option != 'overwrite' && fs.existsSync(fullPath)) {
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
			await blockBlobClient.downloadToFile(fullPath);
			console.log(fullPath);
		}
		catch (error) {
			console.log(error);
		}
	}

	/**
	 * Download all files in container
	 * @param {String} containerName
	 * @param {String} path
	 * @returns {Map} List of all blobs
	 */
	static async downloadAllBlobs(containerName, path) {
		try {
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
			const containerClient = blobServiceClient.getContainerClient(containerName);
			const blobList = new Map();

			let i = 0;
			for await (const blob of containerClient.listBlobsFlat()) {
				i += 1;
				// Prevent overwriting
				if (fs.existsSync(`${path}/${blob.name}`)) {
					console.log(`Blob ${blob.name} already downloaded!`);
				}
				else {
					console.log(`Downloading blob ${i}: ${blob.name}`);
					// Create a blob client and download
					const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
					await blockBlobClient.downloadToFile(`${path}/${blob.name}`);
				}
				blobList.set(i, blob.name);
			}

			return blobList;
		}
		catch (error) {
			console.log(error);
		}
	}

	static async createContainer(containerName) {
		try {
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);

			console.log('\nCreating container...');
			console.log('\t', containerName);

			// Get a reference to a container
			const containerClient = blobServiceClient.getContainerClient(containerName);

			// Create the container
			const createContainerResponse = await containerClient.create();
			console.log('Container was created successfully. requestId: ', createContainerResponse.requestId);
		}
		catch (error) {
			console.log(error);
		}
	}

	static async listBlobs(containerName) {
		try {
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
			const containerClient = blobServiceClient.getContainerClient(containerName);
			const blobList = new Map();

			let i = 1;
			for await (const blob of containerClient.listBlobsFlat()) {
				blobList.set(i, blob.name);
				i += 1;
			}
			return blobList;
		}
		catch (error) {
			console.log(error);
		}
	}

	static async listContainers() {
		try {
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
			const containerList = [];
			for await (const container of blobServiceClient.listContainers()) {
				containerList.push(container.name);
			}

			return containerList;
		}
		catch (error) {
			console.log(error);
		}
	}
}

module.exports = Azure;