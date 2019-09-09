module.exports = class Analysis {
	constructor(uuid, name, comment, positions) {
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

	setComment() {

	}

	getPositions() {

	}

	getPosition(uuid) {

	}

	addPosition(position) {

	}

	delPosition(uuid) {

	}
}