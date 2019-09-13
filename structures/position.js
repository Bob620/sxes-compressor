const constants = require('../constants.json');

const State = require('./state.js');
const makeData = require('../makedata.js');

module.exports = class Position {
	constructor(archive, uri) {
		const uriSplit = uri.split('/');
		this.data = {
			uuid: uriSplit[1],
			uri: uriSplit.slice(0, 2).join('/'),
			archive,
			background: undefined,
			condition: undefined,
			rawCondition: undefined,
			comment: '',
			state: new State(archive, uri + '/' + constants.fileStructure.position.STATE),
			data: new Map()
		}
	}

	async initialize({rawConditions, conditions, backgrounds}) {
		const metadata = JSON.parse(await this.data.archive.extract(this.data.uri + '/' + constants.fileStructure.position.METAFILE));

		if (this.uuid !== metadata[constants.positionMeta.UUID])
			console.warn(`Expected ${this.uuid}, got ${metadata[constants.positionMeta.UUID]}`);

		await this.data.state.initialize();

		this.data.rawCondition = rawConditions.get(metadata[constants.positionMeta.RAWCONDTIONUUID]);
		this.data.condition = conditions.get(metadata[constants.positionMeta.CONDITIONUUID]);
		this.data.background = backgrounds.get(metadata[constants.positionMeta.BACKGROUNDUUID]);
		this.data.comment = metadata[constants.positionMeta.COMMENT];

		this.data.data = new Map((await this.data.archive.list(this.data.uri + '/' + constants.fileStructure.position.DATA))
			.map(({file}) => file).map(uri => makeData(this.data.archive, uri)).map(data => [data.name, data])
		);

		return this;
	}

	get uuid() {
		return this.data.uuid;
	}

	get background() {
		return this.data.background;
	}

	get condition() {
		return this.data.condition;
	}

	get rawCondition() {
		return this.data.rawCondition;
	}

	get state() {
		return this.data.state;
	}

	getTypes() {
		return this.data.data;
	}

	getType(name) {
		return this.data.data.get(type);
	}

	addType(data) {

	}

	deleteType(name) {

	}

	getComment() {
		return this.data.comment;
	}

	setComment(comment) {

	}
};