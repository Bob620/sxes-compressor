module.exports = class Background {
	constructor(archive, uri) {
		this.data = {
			uri,
			uuid: uri.split('/').pop().split('.')[0],
			archive
		}
	}

	getBackground() {
		return this.data.archive.extract(this.data.uri);
	}
};