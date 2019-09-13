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

	setComment(comment) {

	}

	getPositions() {
		return this.data.positions
	}

	getPosition(uuid) {
		return this.data.positions.get(uuid);
	}

	addPosition(position) {

	}

	deletePosition(uuid) {

	}
};