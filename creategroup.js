const SxesGroup = require('./structures/sxesgroup.js');
const SevenZip = require('./7z.js');

const constants = require('./constants.json');

module.exports = async (type, uri, name) => {
	uri = uri + '/' + name + `.pl${type}`;

	const seven = new SevenZip(uri , type);

	await seven.update(constants.fileStructure.METADATA, JSON.stringify({
		[constants.metaMeta.ANALYSES]: [],
		[constants.metaMeta.PROJECTS]: []
	}));

	return (new SxesGroup(uri)).initialize();
};