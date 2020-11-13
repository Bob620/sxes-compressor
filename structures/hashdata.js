const constants = require('../constants.json');

module.exports = class HashData {
	constructor(archive, uri, rootDir) {
		this.data = {
			uri,
			rootDir,
			uuid: uri.split('/').pop().split('.')[0],
			archive
		}
	}

	get uuid() {
		return this.data.uuid;
	}

	get hash() {
		return this.data.uuid;
	}

	async getData() {
		return JSON.parse((await this.data.archive.extract(this.data.uri)).toString());
	}

	async permDelete() {
		return await Promise.all(await this.data.archive.delete(this.data.uri));
	}

	async cloneTo(sxesGroup) {
		const fileUri = `${this.data.rootDir}/${this.hash}.json`;
		await sxesGroup.archive.updateStream(fileUri, this.data.archive.extractStream(this.data.uri));

		return await this.childCloneToReturn(sxesGroup, fileUri);
	}

	async childCloneToReturn(sxesGroup, fileUri) {
		return new HashData(sxesGroup.archive, fileUri);
	}
};