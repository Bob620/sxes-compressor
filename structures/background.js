const constants = require('../constants.json');

const Data = require('./data.js');

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

	async getData(condition) {
		return new BgData(this.data.archive, this.data.uri, await this.data.archive.extract(this.data.uri), await (await condition).getData());
	}

	async permDelete() {
		return await Promise.all(await this.data.archive.delete(this.data.uri));
	}

	async cloneTo(sxesGroup) {
		await sxesGroup.archive.updateStream(`${constants.fileStructure.background.ROOT}/${this.hash}.json`, this.data.archive.extractStream(this.data.uri));
		return new Background(sxesGroup.archive, `${constants.fileStructure.background.ROOT}/${this.hash}.json`);
	}
};

class BgData extends Data {
	constructor(archive, uri, rawData=Buffer.from([]), condition) {
		super(archive, uri, rawData, constants.background.DATAOFFSET, condition.ccd.bins.x, rawData.readUInt32LE(4));
	}
}