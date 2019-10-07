const constants = require('../constants.json');

module.exports = class RawCondition {
	constructor(archive, uri) {
		this.data = {
			uri,
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
		await sxesGroup.archive.updateStream(`${constants.fileStructure.rawCondition.ROOT}/${this.hash}.json`, this.data.archive.extractStream(this.data.uri));
		return new RawCondition(sxesGroup.archive, `${constants.fileStructure.rawCondition.ROOT}/${this.hash}.json`);
	}
};