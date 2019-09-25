module.exports = class State {
	constructor(archive, uri) {
		this.data = {
			uri,
			uuid: uri.split('/').pop().split('.')[0],
			archive,
			store: undefined
		}
	}

	getState() {
		return JSON.parse(JSON.stringify(this.data.store).toString());
	}
};