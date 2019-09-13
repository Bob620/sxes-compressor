module.exports = class RawCondition {
	constructor(archive, uri) {
		this.data = {
			uri,
			uuid: uri.split('/').pop().split('.')[0],
			archive
		}
	}

	async getRawCondition() {
		return JSON.parse(await this.data.archive.extract(this.data.uri));
	}
};