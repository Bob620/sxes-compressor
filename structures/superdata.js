const constants = require('../constants.json');

const generateUuid = require('../generateuuid.js');

// Wrapper class for things that require extra data like positions or images (both metadata and conditions but also
//   larger data like raw and images
module.exports = class SuperData {
	constructor(sxesGroup, uri) {
		const uriSplit = uri.split('/');
		uri = uriSplit.slice(0, 2).join('/');
		this.data = {
			uuid: uriSplit[1],
			uri,
			sxesGroup,
			superData: {},
			comment: '',
			initId: undefined,
			resolves: [],
			onLoad: () => {
			},
			awaitInit: wantedItem => {
				return new Promise(resolve => {
					if (this.data.superData[wantedItem])
						resolve(this.data.superData[wantedItem]);
					else {
						this.data.resolves.push(() => resolve(this.data.superData[wantedItem]));

						if (this.data.initId)
							this.data.sxesGroup.archive.expedite(this.data.initId);
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
			this.data.sxesGroup.archive.expedite(this.data.initId);
		else {
			this.data.initId = `${this.uuid}-init`;
			const metadata = JSON.parse((await this.data.sxesGroup.archive.extract(this.data.uri + '/' + constants.fileStructure.superData.METAFILE, this.data.initId)).toString());

			await this.data.onLoad(metadata);
			this.data.initId = undefined;
		}
	}

	async initialize(backgroundLoad) {
		this.data.onLoad = async metadata => {
			if (this.uuid !== metadata[constants.superDataMeta.UUID])
				console.warn(`Expected ${this.uuid}, got ${metadata[constants.superDataMeta.UUID]}`);

			const dataFiles = await this.data.sxesGroup.archive.list(`${this.data.uri}/*`).filter(({name: path}) => !path.endsWith(constants.fileStructure.superData.METAFILE));

			await this.childInitialize(metadata, dataFiles);

			if (this.data.comment === '')
				this.data.comment = metadata[constants.superDataMeta.COMMENT];

			for (const resolve of this.data.resolves)
				resolve();

			this.data.resolves = [];
		};

		if (backgroundLoad)
			await this.loadFiles();

		return this;
	}

	async childInitialize() {
	}

	get uuid() {
		return this.data.uuid;
	}

	get comment() {
		return this.data.awaitInit('comment');
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
		return await Promise.all(await this.data.sxesGroup.archive.delete(this.data.uri));
	}

	async update() {
		let updatedData = {
			[constants.superDataMeta.UUID]: this.uuid,
			[constants.superDataMeta.COMMENT]: this.toUpdate.comment ? this.toUpdate.comment : this.data.comment
		};

		this.toUpdate.comment = undefined;
		updatedData = await this.childUpdate(updatedData);

		const metafileUri = `${this.data.uri}/${constants.fileStructure.superData.METAFILE}`;
		await this.data.sxesGroup.archive.delete(metafileUri);
		await this.data.sxesGroup.archive.update(metafileUri, JSON.stringify(updatedData));

		this.data.comment = updatedData.comment;
	}

	async childUpdate(updatedData) {
		return updatedData;
	}

	async cloneTo(sxesGroup) {
		const uuid = generateUuid.v4();

		await Promise.all(await this.data.sxesGroup.archive.list(this.data.uri).filter(({name}) => name !== constants.fileStructure.superData.METAFILE).map(async ({name}) => {
			await sxesGroup.archive.updateStream(`${constants.fileStructure.position.ROOT}/${uuid}/${name.split('/').pop()}`, this.data.sxesGroup.archive.extractStream(name));
		}));

		let newMeta = {
			[constants.superDataMeta.UUID]: uuid,
			[constants.superDataMeta.COMMENT]: await this.getComment()
		};
		newMeta = await this.childCloneToMetadata(newMeta);

		const metafileUri = `${constants.fileStructure.image.ROOT}/${uuid}/${constants.fileStructure.superData.METAFILE}`;
		await sxesGroup.archive.update(metafileUri, JSON.stringify(newMeta));

		return await this.childCloneToReturn(sxesGroup, metafileUri);
	}

	async childCloneToMetadata(newMeta) {
		return this.childUpdate(newMeta);
	}

	async childCloneToReturn(sxesGroup, metafileUri) {
		return await (new SuperData(sxesGroup.archive, metafileUri).initialize({}));
	}
};