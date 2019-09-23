const createGroup = require('./creategroup.js');
const constants = require('./constants.json');

module.exports = {
	SxesGroup: require('./structures/sxesgroup.js'),
	createPLZip: createGroup.bind(undefined, constants.fileTypes.plzip),
	createPL7z: createGroup.bind(undefined, constants.fileTypes.pl7z),
	constants: constants
};