const constants = require('../constants.json');

const generateUuid = require('../generateuuid.js');
const State = require('./state.js');
const makeData = require('../makedata.js');

module.exports = class Position {
	constructor(archive, uri, dataFiles=[]) {
		const uriSplit = uri.split('/');
		uri = uriSplit.slice(0, 2).join('/');
		this.data = {
			uuid: uriSplit[1],
			uri,
			archive,
			background: undefined,
			condition: undefined,
			rawCondition: undefined,
			dataFiles,
			comment: '',
			state: new State(archive, `${uri}/${constants.fileStructure.position.STATE}`),
			data: undefined,
			initId: undefined,
			resolves: [],
			onLoad: () => {},
			awaitInit: wantedItem => {
				return new Promise(resolve => {
					if (this.data[wantedItem])
						resolve(this.data[wantedItem]);
					else {
						this.data.resolves.push(() => resolve(this.data[wantedItem]));

						if (this.data.initId)
							this.data.archive.expedite(this.data.initId);
						else
							this.loadFiles();
					}
				});
			}
		};

		this.toUpdate = {
			comment: undefined
		};
	}

	async loadFiles() {
		if (this.data.initId)
			this.data.archive.expedite(this.data.initId);
		else {
			this.data.initId = `${this.uuid}-init`;
			const metadata = JSON.parse((await this.data.archive.extract(this.data.uri + '/' + constants.fileStructure.position.METAFILE, this.data.initId)).toString());

			await this.data.onLoad(metadata);
			this.data.initId = undefined;
		}
	}

	async initialize({rawConditions, conditions, backgrounds}, backgroundLoad) {
		this.data.onLoad = async metadata => {
			if (this.uuid !== metadata[constants.positionMeta.UUID])
				console.warn(`Expected ${this.uuid}, got ${metadata[constants.positionMeta.UUID]}`);

			this.data.rawCondition = rawConditions.get(metadata[constants.positionMeta.RAWCONDTIONUUID]);
			this.data.condition = conditions.get(metadata[constants.positionMeta.CONDITIONUUID]);

			const background = backgrounds.get(metadata[constants.positionMeta.BACKGROUNDUUID]);
			if (background)
				this.data.background = {
					uuid: background.uuid,
					hash: background.hash,
					getData: background.getData.bind(background, this.condition),
					permDelete: background.permDelete,
					cloneTo: background.cloneTo
				};
			if (this.data.comment === '')
				this.data.comment = metadata[constants.positionMeta.COMMENT];

			const cond = await (await this.condition).getData();
			this.data.data = new Map((await Promise.all(this.data.dataFiles.map(async uri => makeData(this.data.archive, uri, cond)))).map(data => [data.name, data]));

			for (const resolve of this.data.resolves)
				resolve();

			this.data.resolves = [];
		};

		if (backgroundLoad)
			await this.loadFiles();

		return this;
	}

	get uuid() {
		return this.data.uuid;
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
		return this.data.data.has(type);
	}

	async getTypes() {
		return Array.from((await this.data.awaitInit('data')).keys());
	}

	async getType(type) {
		if (this.data.data)
			return this.data.data.get(type).clone();
		else
			return (await this.getTypes()).get(type).clone();
	}

	addType(data) {

	}

	deleteType(name) {

	}

	getComment() {
		return this.data.awaitInit('comment');
	}

	async setComment(comment) {
		if (comment !== await this.getComment()) {
			this.toUpdate.comment = comment;
			await this.update();
		}
	}

	async permDelete() {
		return await Promise.all(await this.data.archive.delete(this.data.uri));
	}

	async update() {
		const updatedData = {
			[constants.positionMeta.UUID]: this.uuid,
			[constants.positionMeta.BACKGROUNDUUID]: (await this.background).uuid,
			[constants.positionMeta.CONDITIONUUID]: (await this.condition).uuid,
			[constants.positionMeta.RAWCONDTIONUUID]: (await this.rawCondition).uuid,
			[constants.positionMeta.COMMENT]: this.toUpdate.comment ? this.toUpdate.comment : this.data.comment
		};

		this.toUpdate.comment = undefined;

		await this.data.archive.delete(this.data.uri + '/' + constants.fileStructure.position.METAFILE);
		await this.data.archive.update(this.data.uri + '/' + constants.fileStructure.position.METAFILE, JSON.stringify(updatedData));

		this.data.comment = updatedData.comment;
	}

	async cloneTo(sxesGroup) {
		const uuid = generateUuid.v4();

		await Promise.all(await this.data.archive.list(this.data.uri).filter(({name}) => name !== constants.fileStructure.position.METAFILE).map(async ({name}) => {
			await sxesGroup.archive.updateStream(`${constants.fileStructure.position.ROOT}/${uuid}/${name.split('/').pop()}`, this.data.archive.extractStream(name));
		}));

		let newMeta = {
			[constants.positionMeta.UUID]: uuid,
			[constants.positionMeta.COMMENT]: await this.getComment(),
			[constants.positionMeta.BACKGROUNDUUID]: (await this.background).uuid,
			[constants.positionMeta.CONDITIONUUID]: (await this.condition).uuid,
			[constants.positionMeta.RAWCONDTIONUUID]: (await this.rawCondition).uuid
		};

		await sxesGroup.archive.update(`${constants.fileStructure.position.ROOT}/${uuid}/${constants.fileStructure.position.METAFILE}`, JSON.stringify(newMeta));

		await sxesGroup.addBackground(await this.background);
		await sxesGroup.addCondition(await this.condition);
		await sxesGroup.addRawCondition(await this.rawCondition);

		return await (new Position(sxesGroup.archive, `${constants.fileStructure.position.ROOT}/${uuid}/${constants.fileStructure.position.METAFILE}`)).initialize({
			rawConditions: sxesGroup.getRawConditions(),
			conditions: sxesGroup.getConditions(),
			backgrounds: sxesGroup.getBackgrounds()
		});
	}
};