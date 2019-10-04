module.exports = class State {
	constructor(archive, uri) {
		this.data = {
			uri,
			uuid: uri.split('/').pop().split('.')[0],
			archive,
			store: undefined
		}
	}

	async getData() {
		return JSON.parse((await this.data.archive.extract(this.data.uri)).toString());
	}
};