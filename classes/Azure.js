const { BlobServiceClient } = require('@azure/storage-blob');
const { envs } = require('../helpers/env-vars');
const fs = require('fs');
const path = require('path');

/**
 * This Class allows communication with azure storage
 */
class Azure {

	/**
	 * Upload files to azure storage
	 * @param {String} containerName
	 * @param {String} path
	 * @param {String} fileName
	 * @param {boolean} overwrite
	 * @param {String} uploadAs change blob name
	 */
	static async uploadBlobAs(containerName, filePath, uploadAs, overwrite = false) {
		const fileName = path.parse(filePath).base;
		try {
			// Check if file exists
			if (!fs.existsSync(filePath)) {
				console.log(`File ${filePath} does not exist!`);
				return new Promise((resolve) => {
					resolve('❌');
				});
			}

			console.log(`Uploading blob ${fileName} as  ${uploadAs}`);
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
			const containerClient = blobServiceClient.getContainerClient(containerName);

			// Prevent overwrite
			if (!overwrite) {
				for await (const blob of containerClient.listBlobsFlat()) {
					if (blob.name == uploadAs) {
						console.log('File already exists in azure!');
						return new Promise((resolve) => {
							resolve('⚠️');
						});
					}
				}
			}

			// Create a blob client using the local file name as the name for the blob
			const blockBlobClient = containerClient.getBlockBlobClient(uploadAs);

			// Upload the created file
			await blockBlobClient.uploadFile(filePath);
			return new Promise((resolve) => {
				resolve('👍');
			});
		}
		catch (error) {
			console.log('Failed uploading to azure!');
			return new Promise((reject) => {
				reject('❌');
			});
		}
	}

	/**
	 * Upload files to azure storage
	 * @param {String} containerName
	 * @param {String} path
	 * @param {String} fileName
	 * @param {boolean} overwrite
	 */
	static async uploadBlob(containerName, filePath, overwrite = false) {
		const fileName = path.parse(filePath).base;
		try {
			// Check if file exists
			if (!fs.existsSync(filePath)) {
				console.log(`File ${filePath} does not exist!`);
				return new Promise((resolve) => {
					resolve('❌');
				});
			}

			console.log(`Uploading blob ${fileName}`);
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
			const containerClient = blobServiceClient.getContainerClient(containerName);

			// Prevent overwrite
			if (!overwrite) {
				for await (const blob of containerClient.listBlobsFlat()) {
					if (blob.name == filePath) {
						console.log('File already exists in azure!');
						return new Promise((resolve) => {
							resolve('⚠️');
						});
					}
				}
			}

			// Create a blob client using the local file name as the name for the blob
			const blockBlobClient = containerClient.getBlockBlobClient(fileName);

			// Upload the created file
			await blockBlobClient.uploadFile(filePath);
			return new Promise((resolve) => {
				resolve('👍');
			});
		}
		catch (error) {
			console.log('Failed uploading to azure!');
			return new Promise((reject) => {
				reject('❌');
			});
		}
	}

	/**
	 * Delete blob from container
	 * @param {*} containerName
	 * @param {*} blobName
	 */
	static async deleteBlob(containerName, blobName) {
		try {
		// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
			const containerClient = blobServiceClient.getContainerClient(containerName);

			await containerClient.deleteBlob(blobName);
		}
		catch (error) {
			console.log('Failed uploading to azure!');
			throw 'Deleting blob failed!';
		}
	}

	/**
	 * Download blob from azure storage
	 * @param {String} containerName
	 * @param {String} directory
	 * @param {String} blobName
	 * @param {String} saveAs set blob name
	 * @param {String} option
	 * @param {boolean} overwrite
	 */
	static async downloadBlob(containerName, directory, blobName, saveAs = null, overwrite = false) {
		if (saveAs == null) {
			saveAs = blobName;
		}

		const fullPath = directory + saveAs;
		// Prevent overwriting
		if (fs.existsSync(fullPath) && !overwrite) {
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
	 * @param {String} directory
	 * @param {Boolean} overwrite
	 * @returns {Promise<Map>} List of all blobs
	 */
	static async downloadAllBlobs(containerName, directory, overwrite = false) {
		try {
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);
			const containerClient = blobServiceClient.getContainerClient(containerName);
			const blobList = new Map();

			let i = 0;
			for await (const blob of containerClient.listBlobsFlat()) {
				i += 1;
				// Prevent overwriting
				if (fs.existsSync(`${directory}/${blob.name}`) && !overwrite) {
					console.log(`Blob ${blob.name} already downloaded!`);
				}
				else {
					console.log(`Downloading blob ${i}: ${blob.name}`);
					// Create a blob client and download
					const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
					await blockBlobClient.downloadToFile(`${directory}/${blob.name}`);
				}
				blobList.set(i, blob.name);
			}
			return new Promise((resolve) => {
				resolve(blobList);
			});
		}
		catch (error) {
			console.log(error);
			return new Promise((reject) => {
				reject(error);
			});
		}
	}

	static async createContainer(containerName) {
		try {
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);

			console.log(`\nCreating container: ${containerName}`);

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

	static async deleteContainer(containerName) {
		try {
			// Create the BlobServiceClient object which will be used to create a container client
			const blobServiceClient = BlobServiceClient.fromConnectionString(envs.AZURE_STORAGE_CONNECTION_STRING);

			console.log(`\nDeleting container: ${containerName}`);

			// Get a reference to a container
			const containerClient = blobServiceClient.getContainerClient(containerName);

			// Delete the container
			const deleteContainerResponse = await containerClient.delete();
			console.log('Container was deleted successfully. requestId: ', deleteContainerResponse.requestId);
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