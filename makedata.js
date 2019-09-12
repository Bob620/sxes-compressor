const constants = require('./constants.json');

const Data = require('./structures/data.js');

module.exports = (archive, uri) => {
	switch(uri.split('/').pop().split('.')[0]) {
		case [constants.dataTypes.XES]:
		case [constants.dataTypes.QLW]:
		case [constants.dataTypes.QLWEXTRACTED]:
		default:
			return new Data(archive, uri);
	}
};