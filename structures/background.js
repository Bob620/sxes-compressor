const constants = require('../constants.json');

module.exports = class Background {
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

	getBackground() {
		return this.data.archive.extract(this.data.uri);
	}

	async permDelete() {
		return await Promise.all(await this.data.archive.delete(this.data.uri));
	}

	async cloneTo(sxesGroup) {
		await sxesGroup.archive.updateStream(`${constants.fileStructure.background.ROOT}/${this.hash}.json`, this.data.archive.extractStream(this.data.uri));
		return new Background(sxesGroup.archive, `${constants.fileStructure.background.ROOT}/${this.hash}.json`);
	}
};