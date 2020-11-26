const constants = require('../constants.json');

const SuperData = require('./superdata.js');
const State = require('./state.js');
const makeData = require('../makedata.js');

module.exports = class Position extends SuperData {
	constructor(sxesGroup, uri, dataFiles = []) {
		super(sxesGroup, uri, constants.fileStructure.position.ROOT);

		this.data.superData = {
			background: undefined,
			condition: undefined,
			rawCondition: undefined,
			operator: undefined,
			dataFiles,
			state: new State(sxesGroup.archive, `${this.data.uri}/${constants.fileStructure.position.STATE}`)
		};
	}

	async childInitialize(metadata, dataFiles) {
		this.data.superData.operator = metadata[constants.positionMeta.OPERATOR];

		this.data.superData.rawCondition = this.data.sxesGroup.getRawCondition(metadata[constants.positionMeta.RAWCONDTIONUUID]);
		this.data.superData.condition = this.data.sxesGroup.getCondition(metadata[constants.positionMeta.CONDITIONUUID]);

		const background = this.data.sxesGroup.getBackground(metadata[constants.positionMeta.BACKGROUNDUUID]);
		if (background)
			this.data.superData.background = {
				uuid: background.uuid,
				hash: background.hash,
				getData: background.getData.bind(background, this.condition),
				permDelete: background.permDelete,
				cloneTo: background.cloneTo
			};
		else
			this.data.superData.background = {
				uuid: '',
				hash: '',
				getData: () => {
				},
				permDelete: () => {
				},
				cloneTo: () => {
				}
			};

		const cond = await this.data.superData.condition.getData();
		this.data.superData.data = new Map(
			dataFiles
				.filter(({name: path}) => path.endsWith(constants.fileStructure.position.DATAEXTENTION))
				.map(uri => makeData(this.data.sxesGroup.archive, uri.name, cond))
				.map(data => [data.name, data])
		);
	}

	get background() {
		return this.awaitSuperData('background');
	}

	get condition() {
		return this.awaitSuperData('condition');
	}

	get rawCondition() {
		return this.awaitSuperData('rawCondition');
	}

	get state() {
		return this.data.superData.state;
	}

	get operator() {
		return this.awaitSuperData('operator');
	}

	async hasType(type) {
		if (this.data.superData.data === undefined)
			await this.getTypes();
		return this.data.superData.data.has(type);
	}

	async getTypes() {
		return Array.from((await this.awaitSuperData('data')).keys());
	}

	async getType(type) {
		if (this.data.superData.data === undefined)
			await this.getTypes();
		return this.data.superData.data.get(type).clone();
	}

	addType(data) {

	}

	deleteType(name) {

	}

	async childUpdate(updatedData) {
		updatedData[constants.positionMeta.BACKGROUNDUUID] = (await this.background).uuid;
		updatedData[constants.positionMeta.CONDITIONUUID] = (await this.condition).uuid;
		updatedData[constants.positionMeta.RAWCONDTIONUUID] = (await this.rawCondition).uuid;

		return updatedData;
	}

	async childCloneToReturn(sxesGroup, metafileUri) {
		await sxesGroup.addBackground(await this.background);
		await sxesGroup.addCondition(await this.condition);
		await sxesGroup.addRawCondition(await this.rawCondition);

		return new Position(sxesGroup, metafileUri);
	}

	async childSerialize() {
		return {
			operator: await this.operator,
			background: (await this.background).uuid,
			condition: (await this.condition).uuid,
			rawCondition: (await this.rawCondition).uuid,
			types: (await this.getTypes())
		};
	}
};