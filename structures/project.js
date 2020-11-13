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

	getName() {
		return this.data.name;
	}

	setName(name) {

	}

	getComment() {
		return this.data.comment;
	}

	setComment(comment) {

	}

	getAnalyses() {
		return this.data.analyses;
	}

	getAnalysis(uuid) {
		return this.data.analyses.get(uuid);
	}

	addAnalysis(analysis) {

	}

	deleteAnalysis(uuid) {

	}
};