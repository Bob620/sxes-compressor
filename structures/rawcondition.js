const constants = require('../constants.json');

const HashData = require('./hashdata.js');

module.exports = class RawCondition extends HashData {
	constructor(archive, uri) {
		super(archive, uri, constants.fileStructure.rawCondition.ROOT);
	}

	async childCloneToReturn(sxesGroup, fileUri) {
		return new RawCondition(sxesGroup.archive, fileUri);
	}
};