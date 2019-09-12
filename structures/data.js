module.exports = class Data {
	constructor(archive, uri) {
		this.data = {
			uri,
			archive,
			name: uri.split('/').pop().split('.')[0]
		}
	}

	get name() {
		return this.data.name;
	}
};