module.exports = class Project {
	constructor(sxesGroup, uuid, name='', comment='', analysisUuids = []) {
		this.data = {
			uuid,
			name,
			comment,
			analyses: new Map(analysisUuids.map(uuid => [uuid, sxesGroup.getAnalysis(uuid)])),
			sxesGroup
		}
	}

	get uuid() {
		return this.data.uuid;
	}

	get name() {
		return this.data.name;
	}

	setName(name) {

	}

	get comment() {
		return this.data.comment;
	}

	setComment(comment) {

	}

	get analyses() {
		return this.data.analyses;
	}

	getAnalysis(uuid) {
		return this.data.analyses.get(uuid);
	}

	addAnalysis(analysis) {

	}

	deleteAnalysis(uuid) {

	}

	serialize() {
		return {
			uuid: this.uuid,
			name: this.name,
			comment: this.comment,
			analyses: Array.from(this.analyses.keys())
		};
	}
};