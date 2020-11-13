const constants = require('../constants.json');

module.exports = class Analysis {
	constructor(sxesGroup, data) {
		this.data = {
			uuid: data.uuid,
			name: data.name,
			comment: data.comment,
			operator: data.operator,
			instrument: data.instrument,
			acquisitionDate: data.acquisitionDate,
			positions: new Map(data.positionUuids.map(uuid => [uuid, sxesGroup.getPosition(uuid)])),
			images: new Map(data.imageUuids.map(uuid => [uuid, sxesGroup.getImage(uuid)])),
			sxesGroup
		};

		this.toUpdate = {
			comment: undefined,
			operator: undefined,
			name: undefined,
			acquisitionDate: undefined,
			instrument: undefined
		};
	}

	get uuid() {
		return this.data.uuid;
	}

	get operator() {
		return this.data.operator;
	}

	set operator(operator) {
		if (operator !== this.data.operator) {
			this.toUpdate.operator = operator;
			this.update();
		}
	}

	get instrument() {
		return this.data.name;
	}

	set instrument(instrument) {
		if (instrument !== this.data.instrument) {
			this.toUpdate.instrument = instrument;
			this.update();
		}
	}

	get acquisitionDate() {
		return this.data.name;
	}

	set acquisitionDate(date) {
		if (date !== this.data.acquisitionDate) {
			this.toUpdate.acquisitionDate = date;
			this.update();
		}
	}

	get name() {
		return this.data.name;
	}

	set name(name) {
		if (name !== this.data.name) {
			this.toUpdate.name = name;
			this.update();
		}
	}

	get comment() {
		return this.data.comment;
	}

	set comment(comment) {
		if (comment !== this.data.comment) {
			this.toUpdate.comment = comment;
			this.update();
		}
	}

	getPositions() {
		return this.data.positions;
	}

	getPosition(uuid) {
		return this.data.positions.get(uuid);
	}

	addPosition(position) {
		this.data.positions.set(position.uuid, position);
		this.update();
	}

	deletePosition(uuid) {
		this.data.positions.delete(uuid);
		this.update();
	}

	getImages() {
		return this.data.images;
	}

	getImage(uuid) {
		return this.data.images.get(uuid);
	}

	addImage(image) {
		this.data.images.set(image.uuid, image);
		this.update();
	}

	deleteImage(uuid) {
		this.data.images.delete(uuid);
		this.update();
	}

	serialize() {
		return {
			acquisitionDate: this.acquisitionDate,
			comment: this.comment,
			name: this.name,
			operator: this.operator,
			instrument: this.instrument,
			uuid: this.uuid,
			positionUuids: Array.from(this.getPositions().keys()),
			imageUuids: Array.from(this.getImages().keys())
		};
	}

	async update() {
		if (this.toUpdate.comment)
			this.data.comment = this.toUpdate.comment;
		if (this.toUpdate.operator)
			this.data.operator = this.toUpdate.operator;
		if (this.toUpdate.name)
			this.data.name = this.toUpdate.name;
		if (this.toUpdate.acquisitionDate)
			this.data.acquisitionDate = this.toUpdate.acquisitionDate;
		if (this.toUpdate.instrument)
			this.data.instrument = this.toUpdate.instrument;

		this.toUpdate = {
			comment: undefined,
			operator: undefined,
			name: undefined,
			acquisitionDate: undefined,
			instrument: undefined
		};

		await this.data.sxesGroup.updateAnalysis(this.uuid);
	}
};