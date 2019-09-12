module.exports = class Project {
	constructor(archive, uuid, name='', comment='', analyses=new Map()) {
		this.data = {
			uuid,
			name,
			comment,
			analyses,
			archive
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

	}

	getAnalysis(uuid) {

	}

	addAnalysis(analysis) {

	}

	delAnalysis(uuid) {

	}
};