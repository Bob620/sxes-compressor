module.exports = class Analysis {
	constructor(archive, uuid, name='', comment='', positions=new Map()) {
		this.data = {
			uuid,
			name,
			comment,
			positions,
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
};