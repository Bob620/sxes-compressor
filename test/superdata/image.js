const assert = require('assert');
const {describe, it} = require('mocha');

const State = require('../../structures/state.js');
const Image = require('../../structures/image.js');
const constants = require('../../constants.json');

const comment = 'test comment';

const uuid = 'testuuid';
const condUuid = 'cond';
const rawCondUuid = 'raw';
const uri = `data/${uuid}/init.json`;
const condition = {
	uuid: condUuid,
	hash: '',
	getData: async () => {
		return {};
	},
	permDelete: async () => {
	},
	cloneTo: async () => {
	}
};
const rawCondition = {
	uuid: rawCondUuid
};

function createGroup() {
	return {
		archive: {
			delete: async () => undefined,
			expedite: async () => undefined,
			extract: async () => [
				`{"${constants.superDataMeta.COMMENT}":"${comment}"`,
				`"${constants.superDataMeta.UUID}":"${uuid}"`,
				`"${constants.positionMeta.CONDITIONUUID}":"${condUuid}"`,
				`"${constants.positionMeta.RAWCONDTIONUUID}":"${rawCondUuid}"}`
			].join(','),
			list: async () => [],
			update: async () => undefined,
			updateStream: async () => undefined,
			extractStream: async () => undefined
		},
		addCondition: () => undefined,
		addRawCondition: () => undefined,
		getCondition: () => condition,
		getRawCondition: () => rawCondition
	};
}

describe('Image', () => {
	const group = createGroup();

	it('Should static initialize Image', () => {
		assert.doesNotThrow(() => new Image(group, uri));
	});

	it('Should async initialize Image', () => {
		assert.doesNotThrow(() => (new Image(group, uri)).initialize());
	});

	it('Should return state', async () => {
		const image = new Image(group, uri);
		let state = image.state;
		state.data.archive = {};

		assert.deepEqual(image.state, new State({}, `${uri.split('/').slice(0, 2).join('/')}/${constants.fileStructure.image.STATE}`));
	});

	it('Should await return condition', async () => {
		let hits = 0;

		const newGroup = createGroup();
		newGroup.getCondition = uuid => {
			if (uuid === condUuid)
				hits++;
			return condition;
		};

		const image = new Image(newGroup, uri);
		await image.initialize();

		assert.deepStrictEqual(await image.condition, condition);
		assert.deepStrictEqual(hits, 1);
	});

	it('Should await return rawCondition', async () => {
		let hits = 0;

		const newGroup = createGroup();
		newGroup.getRawCondition = uuid => {
			if (uuid === rawCondUuid)
				hits++;
			return rawCondition;
		};

		const image = new Image(newGroup, uri);

		assert.deepStrictEqual(await image.rawCondition, rawCondition);
		assert.deepStrictEqual(hits, 1);
	});

	it('Should await return imageType', async () => {
		const image = new Image(group, uri);

		assert.deepStrictEqual(await image.rawCondition, rawCondition);
	});

	it('Should serialize correctly', async () => {
		const image = new Image(group, uri);

		assert.deepStrictEqual(await image.serialize(), {
			uuid,
			comment
		});
	});

	it('Should async cloneTo a new group', async () => {
		let hits = 0;
		const newGroup = createGroup();
		newGroup.archive.update = () => {
			hits++;
		};
		newGroup.archive.updateStream = () => {
			hits++;
		};

		const image = new Image(group, uri);
		const newImage = await image.cloneTo(newGroup);
		newGroup.archive.extract = async () => [
			`{"${constants.superDataMeta.COMMENT}":"${comment}"`,
			`"${constants.superDataMeta.UUID}":"${newImage.uuid}"`,
			`"${constants.positionMeta.CONDITIONUUID}":"${condUuid}"`,
			`"${constants.positionMeta.RAWCONDTIONUUID}":"${rawCondUuid}"}`
		].join(',');

		assert.notDeepStrictEqual(newImage.uuid, uuid);
		assert.deepStrictEqual(await image.serialize(), {
			uuid,
			comment
		});
		assert.deepStrictEqual(await newImage.serialize(), {
			uuid: newImage.uuid,
			comment
		});
		assert.deepStrictEqual(hits, 1);
	});
});