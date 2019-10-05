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
			onLoad: () => {}
		}
	}

	async loadFiles() {
		this.data.initId = `${this.uuid}-init`;
		const metadata = JSON.parse((await this.data.archive.extract(this.data.uri + '/' + constants.fileStructure.position.METAFILE, this.data.initId)).toString());

		this.data.onLoad(metadata);
	}

	async initialize({rawConditions, conditions, backgrounds}, backgroundLoad) {
		this.data.onLoad = metadata => {
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
			this.data.comment = metadata[constants.positionMeta.COMMENT];

			for (const resolve of this.data.resolves)
				resolve();
		};

		if (backgroundLoad)
			await this.loadFiles();

		return this;
	}

	get uuid() {
		return this.data.uuid;
	}

	get background() {
		return new Promise(resolve => {
			if (this.data.background)
				resolve(this.data.background);
			else {
				this.data.resolves.push(() => resolve(this.data.background));

				if (this.data.initId)
					this.data.archive.expedite(this.data.initId);
				else
					this.loadFiles();
			}
		});
	}

	get condition() {
		return new Promise(resolve => {
			if (this.data.condition)
				resolve(this.data.condition);
			else {
				this.data.resolves.push(() => resolve(this.data.condition));

				if (this.data.initId)
					this.data.archive.expedite(this.data.initId);
				else
					this.loadFiles();
			}
		});
	}

	get rawCondition() {
		return new Promise(resolve => {
			if (this.data.rawCondition)
				resolve(this.data.rawCondition);
			else {
				this.data.resolves.push(() => resolve(this.data.rawCondition));

				if (this.data.initId)
					this.data.archive.expedite(this.data.initId);
				else
					this.loadFiles();
			}
		});
	}

	get state() {
		return this.data.state;
	}

	getTypes() {
		return new Promise(async resolve => {
			if (this.data.data)
				resolve(this.data.data);
			else {
				const test = await Promise.all(this.data.dataFiles.map(async uri => makeData(this.data.archive, uri, await (await this.condition).getData())));
				this.data.data = new Map(test.map(data => [data.name, data]));
				resolve(this.data.data);
			}
		});
	}

	getType(type) {
		return new Promise(async resolve => {
			if (this.data.data)
				resolve(this.data.data.get(type));
			else {
				resolve((await this.getTypes()).get(type));
			}
		});
	}

	addType(data) {

	}

	deleteType(name) {

	}

	getComment() {
		return new Promise((resolve, reject) => {
			if (this.data.comment)
				resolve(this.data.comment);
			else {
				this.data.resolves.push(() => resolve(this.data.comment));

				if (this.data.initId)
					this.data.archive.expedite(this.data.initId);
				else
					this.loadFiles();
			}
		});
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