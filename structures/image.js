const constants = require('../constants.json');

const SuperData = require('./superdata.js');
const State = require('./state.js');

module.exports = class Image extends SuperData {
	constructor(sxesGroup, uri) {
		super(sxesGroup, uri, constants.fileStructure.image.ROOT);

		this.data.superData = {
			condition: undefined,
			rawCondition: undefined,
			imageType: '',
			state: new State(sxesGroup.archive, `${this.data.uri}/${constants.fileStructure.image.STATE}`)
		};
	}

	async childInitialize(metadata, dataFiles) {
		this.data.superData.rawCondition = this.data.sxesGroup.getRawCondition(metadata[constants.imageMeta.RAWCONDTIONUUID]);
		this.data.superData.condition = this.data.sxesGroup.getCondition(metadata[constants.imageMeta.CONDITIONUUID]);

		if (this.data.superData.imageType === '')
			this.data.superData.imageType = metadata[constants.imageMeta.IMAGETYPE];
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

	get imageType() {
		return this.awaitSuperData('imageType');
	}

	async getImage() {
		return await this.data.sxesGroup.archive.extract(`${this.data.uri}/${constants.fileStructure.image.IMAGENAME}.${await this.imageType}`);
	}

	async childUpdate(updatedData) {
		updatedData[constants.imageMeta.CONDITIONUUID] = (await this.condition).uuid;
		updatedData[constants.imageMeta.RAWCONDTIONUUID] = (await this.rawCondition).uuid;
		updatedData[constants.imageMeta.IMAGETYPE] = this.toUpdate.imageType ? this.toUpdate.imageType : this.data.imageType;

		return updatedData;
	}

	async childCloneToMetadata(newMeta) {
		newMeta[constants.imageMeta.CONDITIONUUID] = (await this.condition).uuid;
		newMeta[constants.imageMeta.RAWCONDTIONUUID] = (await this.rawCondition).uuid;
		newMeta[constants.imageMeta.IMAGETYPE] = await this.imageType;

		return newMeta;
	}

	async childCloneToReturn(sxesGroup, metafileUri) {
		await sxesGroup.addCondition(await this.condition);
		await sxesGroup.addRawCondition(await this.rawCondition);

		return new Image(sxesGroup, metafileUri);
	}
};