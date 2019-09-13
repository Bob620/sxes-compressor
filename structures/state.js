module.exports = class State {
	constructor(archive, uri) {
		this.data = {
			uri,
			uuid: uri.split('/').pop().split('.')[0],
			archive,
			store: undefined
		}
	}

	async initialize() {
		this.data.store = JSON.parse(await this.data.archive.extract(this.data.uri));

		return this;
	}

	getState() {
		return JSON.parse(JSON.stringify(this.data.store));
	}
};