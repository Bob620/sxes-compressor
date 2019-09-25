const constants = require('../constants.json');

const generateUuid = require('../generateuuid.js');
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
			state: new State(archive, uriSplit.slice(0, 2).join('/') + '/' + constants.fileStructure.position.STATE),
			data: new Map()
		}
	}

	async initialize({rawConditions, conditions, backgrounds}) {
		const metadata = JSON.parse((await this.data.archive.extract(this.data.uri + '/' + constants.fileStructure.position.METAFILE)).toString());

		if (this.uuid !== metadata[constants.positionMeta.UUID])
			console.warn(`Expected ${this.uuid}, got ${metadata[constants.positionMeta.UUID]}`);

		this.data.rawCondition = rawConditions.get(metadata[constants.positionMeta.RAWCONDTIONUUID]);
		this.data.condition = conditions.get(metadata[constants.positionMeta.CONDITIONUUID]);
		this.data.background = backgrounds.get(metadata[constants.positionMeta.BACKGROUNDUUID]);
		this.data.comment = metadata[constants.positionMeta.COMMENT];

		this.data.data = new Map((await this.data.archive.list(this.data.uri + '/' + constants.fileStructure.position.DATA))
			.map(({name}) => name).map(uri => makeData(this.data.archive, uri)).map(data => [data.name, data])
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

	async permDelete() {
		return await Promise.all(await this.data.archive.delete(this.data.uri));
	}

	async cloneTo(sxesGroup) {
		const uuid = generateUuid.v4();

		await Promise.all(await this.data.archive.list(this.data.uri).filter(({name}) => name !== constants.fileStructure.position.METAFILE).map(async ({name}) => {
			await sxesGroup.archive.updateStream(`${constants.fileStructure.position.ROOT}/${uuid}/${name.split('/').pop()}`, this.data.archive.extractStream(name));
		}));

		let newMeta = {
			[constants.positionMeta.UUID]: uuid,
			[constants.positionMeta.COMMENT]: this.getComment(),
			[constants.positionMeta.BACKGROUNDUUID]: this.background.uuid,
			[constants.positionMeta.CONDITIONUUID]: this.condition.uuid,
			[constants.positionMeta.RAWCONDTIONUUID]: this.rawCondition.uuid
		};

		await sxesGroup.archive.update(`${constants.fileStructure.position.ROOT}/${uuid}/${constants.fileStructure.position.METAFILE}`, JSON.stringify(newMeta));

		await sxesGroup.addBackground(this.background);
		await sxesGroup.addCondition(this.condition);
		await sxesGroup.addRawCondition(this.rawCondition);

		return await (new Position(sxesGroup.archive, `${constants.fileStructure.position.ROOT}/${uuid}/${constants.fileStructure.position.METAFILE}`)).initialize({
			rawConditions: sxesGroup.getRawConditions(),
			conditions: sxesGroup.getConditions(),
			backgrounds: sxesGroup.getBackgrounds()
		});
	}
};