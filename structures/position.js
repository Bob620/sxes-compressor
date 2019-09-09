module.exports = class Position {
	constructor(uuid, info) {
		this.data = {
			uuid
		}
	}

	get uuid() {
		return this.data.uuid;
	}

	get background() {

	}

	get condition() {

	}

	get rawCondition() {

	}

	get state() {

	}

	get xes() {

	}

	get qlw() {

	}

	get qlwExtracted() {

	}

	getComment() {
		return this.data.comment;
	}

	setComment(comment) {

	}
}