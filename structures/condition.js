module.exports = class Condition {
	constructor(archive, uri) {
		this.data = {
			uri,
			uuid: uri.split('/').pop().split('.')[0],
			archive
		}
	}

	async getCondition() {
		return JSON.parse(await this.data.archive.extract(this.data.uri));
	}
};