module.exports = class Project {
	constructor(uuid, name, comment, analyses) {
		this.data = {
			uuid,
			name,
			comment
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
}