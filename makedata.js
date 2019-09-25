const constants = require('./constants.json');

const Data = require('./structures/data.js');

module.exports = (archive, uri) => {
	switch(uri.split('/').pop().split('.')[0]) {
		default:
			return new Data(archive, uri);
	}
};