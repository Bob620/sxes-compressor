const constants = require('../constants.json');

const SuperData = require('./superdata.js');
const State = require('./state.js');
const makeData = require('../makedata.js');

module.exports = class Position extends SuperData {
	constructor(sxesGroup, uri, dataFiles=[]) {
		super(sxesGroup, uri);

		this.data.superData = {
			background: undefined,
			condition: undefined,
			rawCondition: undefined,
			dataFiles,
			state: new State(sxesGroup.archive, `${uri}/${constants.fileStructure.position.STATE}`),
		};
	}

	async childInitialize(metadata, dataFiles) {
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

		const cond = await this.data.superData.condition.getData();
		this.data.superData.data = new Map(
			(await Promise.all(
				dataFiles
					.filter(({name: path}) => path.endsWith(constants.fileStructure.position.DATAEXTENTION))
					.map(async uri => makeData(this.data.sxesGroup.archive, uri, cond))
			)).map(data => [data.name, data])
		);
	}

	get background() {
		return this.data.awaitInit('background');
	}

	get condition() {
		return this.data.awaitInit('condition');
	}

	get rawCondition() {
		return this.data.awaitInit('rawCondition');
	}

	get state() {
		return this.data.state;
	}

	hasType(type) {
		return this.data.superData.data.has(type);
	}

	async getTypes() {
		return Array.from((await this.data.awaitInit('data')).keys());
	}

	async getType(type) {
		if (this.data.superData.data)
			return this.data.superData.data.get(type).clone();
		else
			return (await this.getTypes()).get(type).clone();
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

		return await (new Position(sxesGroup, metafileUri)).initialize({
			rawConditions: sxesGroup.getRawConditions(),
			conditions: sxesGroup.getConditions(),
			backgrounds: sxesGroup.getBackgrounds()
		});
	}
};