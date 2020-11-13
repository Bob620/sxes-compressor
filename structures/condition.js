const constants = require('../constants.json');

const HashData = require('./hashdata.js');

module.exports = class Condition extends HashData {
	constructor(archive, uri) {
		super(archive, uri, constants.fileStructure.condition.ROOT);
	}

	async childCloneToReturn(sxesGroup, fileUri) {
		return new Condition(sxesGroup.archive, fileUri);
	}
};