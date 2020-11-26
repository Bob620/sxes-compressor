const constants = require('../constants.json');

const generateUuid = require('../generateuuid.js');

// Wrapper class for things that require extra data like positions or images (both metadata and conditions but also
//   larger data like raw and images
// `position` is default superType for testing purposes
module.exports = class SuperData {
	constructor(sxesGroup, uri, typeRoot = constants.fileStructure.position.ROOT) {
		const uriSplit = uri.split('/');
		uri = uriSplit.slice(0, 2).join('/');
		this.data = {
			typeRoot,
			uuid: uriSplit[1],
			uri,
			sxesGroup,
			superData: {},
			expectedData: {
				comment: ''
			},
			initId: undefined,
			resolves: [],
			onLoad: async metadata => {
				if (this.uuid !== metadata[constants.superDataMeta.UUID])
					console.warn(`Expected ${this.uuid}, got ${metadata[constants.superDataMeta.UUID]}`);

				const dataFiles = (await this.data.sxesGroup.archive.list(`${this.data.uri}/*`)).filter(({name: path}) => !path.endsWith(constants.fileStructure.superData.METAFILE));

				await this.childInitialize(metadata, dataFiles);

				if (this.data.expectedData.comment === '')
					this.data.expectedData.comment = metadata[constants.superDataMeta.COMMENT];

				for (const resolve of this.data.resolves)
					resolve();

				this.data.resolves = [];
			},
			awaitInit: (dataType = 'superData', wantedItem) => {
				return new Promise(resolve => {
					if (this.data[dataType][wantedItem])
						resolve(this.data[dataType][wantedItem]);
					else {
						this.data.resolves.push(() => resolve(this.data[dataType][wantedItem]));

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

	awaitSuperData(wantedItem) {
		return this.data.awaitInit('superData', wantedItem);
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

	async initialize() {
		await this.loadFiles();
		return this;
	}

	async childInitialize() {
	}

	get uuid() {
		return this.data.uuid;
	}

	get comment() {
		return this.data.awaitInit('expectedData', 'comment');
	}

	async setComment(comment) {
		if (comment !== await this.comment) {
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
			[constants.superDataMeta.COMMENT]: this.toUpdate.comment ? this.toUpdate.comment : this.data.expectedData.comment
		};

		this.toUpdate.comment = undefined;
		updatedData = await this.childUpdate(updatedData);

		const metafileUri = `${this.data.uri}/${constants.fileStructure.superData.METAFILE}`;
		await this.data.sxesGroup.archive.delete(metafileUri);
		await this.data.sxesGroup.archive.update(metafileUri, JSON.stringify(updatedData));

		this.data.expectedData.comment = updatedData.comment;
	}

	async childUpdate(updatedData) {
		return updatedData;
	}

	async cloneTo(sxesGroup) {
		const uuid = generateUuid.v4();

		await Promise.all((await this.data.sxesGroup.archive.list(this.data.uri)).filter(({name}) => name !== constants.fileStructure.superData.METAFILE).map(async ({name}) => {
			await sxesGroup.archive.updateStream(`${this.data.typeRoot}/${uuid}/${name.split('/').pop()}`, this.data.sxesGroup.archive.extractStream(name));
		}));

		let newMeta = {
			[constants.superDataMeta.UUID]: uuid,
			[constants.superDataMeta.COMMENT]: await this.comment
		};
		newMeta = await this.childCloneToMetadata(newMeta);

		const metafileUri = `${this.data.typeRoot}/${uuid}/${constants.fileStructure.superData.METAFILE}`;
		await sxesGroup.archive.update(metafileUri, JSON.stringify(newMeta));

		return await this.childCloneToReturn(sxesGroup, metafileUri);
	}

	async childCloneToMetadata(newMeta) {
		return this.childUpdate(newMeta);
	}

	async childCloneToReturn(sxesGroup, metafileUri) {
		return new SuperData(sxesGroup, metafileUri);
	}

	async serialize() {
		const [comment, childData] = await Promise.all([this.comment, this.childSerialize()]);

		let data = {
			uuid: this.uuid,
			comment
		};

		for (const [key, item] of (Object.entries(childData)))
			data[key] = item;

		return data;
	}

	async childSerialize() {
		return {};
	}
};