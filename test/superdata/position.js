const assert = require('assert');
const {describe, it} = require('mocha');

const Data = require('../../structures/data.js');
const State = require('../../structures/state.js');
const Position = require('../../structures/position.js');
const constants = require('../../constants.json');

const types = [
	'test'
];
const comment = 'test comment';
const operator = 'some operator';

const uuid = 'testuuid';
const condUuid = 'cond';
const rawCondUuid = 'raw';
const bgUuid = 'background';
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
const background = {
	uuid: bgUuid,
	hash: '',
	getData: async () => {
	},
	permDelete: async () => {
	},
	cloneTo: async () => {
	}
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
				`"${constants.positionMeta.RAWCONDTIONUUID}":"${rawCondUuid}"`,
				`"${constants.positionMeta.BACKGROUNDUUID}":"${bgUuid}"`,
				`"${constants.positionMeta.OPERATOR}":"${operator}"}`
			].join(','),
			list: async () => types.map(name => ({name: name + '.' + constants.fileStructure.position.DATAEXTENTION})),
			update: async () => undefined,
			updateStream: async () => undefined,
			extractStream: async () => undefined
		},
		addCondition: () => undefined,
		addRawCondition: () => undefined,
		addBackground: () => undefined,
		getCondition: () => condition,
		getRawCondition: () => rawCondition,
		getBackground: () => background
	};
}

describe('Position', () => {
	const group = createGroup();

	it('Should static initialize Position', () => {
		assert.doesNotThrow(() => new Position(group, uri));
	});

	it('Should async initialize Position', () => {
		assert.doesNotThrow(() => (new Position(group, uri)).initialize());
	});

	it('Should return types', async () => {
		const position = new Position(group, uri);

		assert.deepStrictEqual(await position.getTypes(), types);
	});

	it('Should check for a specific type', async () => {
		const position = new Position(group, uri);

		assert.deepStrictEqual(await position.hasType(types[0]), true);
		assert.deepStrictEqual(await position.hasType(''), false);
	});

	it('Should get a specific type', async () => {
		const position = new Position(group, uri);
		let type = await position.getType(types[0]);
		type.data.archive = {};

		assert.deepEqual(type, new Data({}, `${types[0]}.${constants.fileStructure.position.DATAEXTENTION}`, undefined, 0, 1, 2048));
	});

	it('Should return state', async () => {
		const position = new Position(group, uri);
		let state = position.state;
		state.data.archive = {};

		assert.deepEqual(position.state, new State({}, `${uri.split('/').slice(0, 2).join('/')}/${constants.fileStructure.position.STATE}`));
	});

	it('Should await return condition', async () => {
		let hits = 0;

		const newGroup = createGroup();
		newGroup.getCondition = uuid => {
			if (uuid === condUuid)
				hits++;
			return condition;
		};

		const position = new Position(newGroup, uri);
		await position.initialize();

		assert.deepStrictEqual(await position.condition, condition);
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

		const position = new Position(newGroup, uri);

		assert.deepStrictEqual(await position.rawCondition, rawCondition);
		assert.deepStrictEqual(hits, 1);
	});

	it('Should await return default background', async () => {
		let hits = 0;

		const newGroup = createGroup();
		newGroup.getBackground = uuid => {
			if (uuid === bgUuid)
				hits++;
			return undefined;
		};

		const position = new Position(newGroup, uri);
		assert(await position.background, {
			uuid: '',
			hash: '',
			getData: () => {
			},
			permDelete: () => {
			},
			cloneTo: () => {
			}
		});
		assert.deepStrictEqual(hits, 1);
	});

	it('Should await return background', async () => {
		let hits = 0;

		const newGroup = createGroup();
		newGroup.getBackground = uuid => {
			if (uuid === bgUuid)
				hits++;
			return background;
		};

		const position = new Position(newGroup, uri);

		assert(await position.background, background);
		assert.deepStrictEqual(hits, 1);
	});

	it('Should serialize correctly', async () => {
		const position = new Position(group, uri);

		assert.deepStrictEqual(await position.serialize(), {
			background: bgUuid,
			comment: comment,
			condition: condUuid,
			operator: operator,
			rawCondition: rawCondUuid,
			types,
			uuid
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

		const position = new Position(group, uri);
		const newImage = await position.cloneTo(newGroup);
		newGroup.archive.extract = async () => [
			`{"${constants.superDataMeta.COMMENT}":"${comment}"`,
			`"${constants.superDataMeta.UUID}":"${newImage.uuid}"`,
			`"${constants.positionMeta.CONDITIONUUID}":"${condUuid}"`,
			`"${constants.positionMeta.RAWCONDTIONUUID}":"${rawCondUuid}"`,
			`"${constants.positionMeta.BACKGROUNDUUID}":"${bgUuid}"`,
			`"${constants.positionMeta.OPERATOR}":"${operator}"}`
		].join(',');

		assert.notDeepStrictEqual(newImage.uuid, uuid);
		assert.deepStrictEqual(await position.serialize(), {
			background: bgUuid,
			comment: comment,
			condition: condUuid,
			operator: operator,
			rawCondition: rawCondUuid,
			types,
			uuid
		});
		assert.deepStrictEqual(await newImage.serialize(), {
			background: bgUuid,
			comment: comment,
			condition: condUuid,
			operator: operator,
			rawCondition: rawCondUuid,
			types,
			uuid: newImage.uuid
		});
		assert.deepStrictEqual(hits, 2);
	});
});