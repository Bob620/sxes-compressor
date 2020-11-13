const constants = require('../constants.json');

const HashData = require('./hashdata.js');
const Data = require('./data.js');

module.exports = class Background extends HashData {
	constructor(archive, uri) {
		super(archive, uri, constants.fileStructure.background.ROOT);
	}

	async getData(condition) {
		return new BgData(this.data.archive, this.data.uri, await this.data.archive.extract(this.data.uri), await (await condition).getData());
	}

	async childCloneToReturn(sxesGroup, fileUri) {
		return new Background(sxesGroup.archive, fileUri);
	}
};

class BgData extends Data {
	constructor(archive, uri, rawData=Buffer.from([]), condition) {
		super(archive, uri, rawData, constants.background.DATAOFFSET, condition.ccd.bins.x, rawData.readUInt32LE(4));
	}
}