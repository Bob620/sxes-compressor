const assert = require('assert');
const {describe, it} = require('mocha');

const SuperData = require('../../structures/superdata.js');
const constants = require('../../constants.json');

const uuid = 'testuuid';
const uri = `data/${uuid}/init.json`;
const comment = 'test comment';

function createGroup() {
	return {
		archive: {
			delete: async () => undefined,
			expedite: async () => undefined,
			extract: async () => `{"${constants.superDataMeta.COMMENT}":"${comment}","${constants.superDataMeta.UUID}":"${uuid}"}`,
			list: async () => [],
			update: async () => undefined,
			updateStream: async () => undefined
		}
	};
}

describe('SuperData', () => {
	const group = createGroup();

	it('Should static initialize SuperData', () => {
		assert.doesNotThrow(() => new SuperData(group, uri));
	});

	it('Should async initialize SuperData', () => {
		assert.doesNotThrow(() => (new SuperData(group, uri)).initialize());
	});

	it('Should return uuid', async () => {
		const superdata = new SuperData(group, uri);

		assert.deepStrictEqual(superdata.uuid, uuid);
	});

	it('Should async onLoad', async () => {
		const superdata = new SuperData(group, uri);

		await superdata.data.onLoad({
			[constants.superDataMeta.UUID]: uuid,
			[constants.superDataMeta.COMMENT]: comment
		});

		assert.deepStrictEqual(superdata.data.uuid, uuid);
		assert.deepStrictEqual(superdata.data.expectedData.comment, comment);
	});

	it('Should async loadFiles', async () => {
		const superdata = new SuperData(group, uri);

		assert.doesNotThrow(await superdata.loadFiles);
	});

	it('Should await expectedData', async () => {
		const superdata = new SuperData(group, uri);

		assert.deepStrictEqual(await superdata.data.awaitInit('expectedData', constants.superDataMeta.COMMENT), comment);
	});

	it('Should await return comment', async () => {
		const superdata = new SuperData(group, uri);

		assert.deepStrictEqual(await superdata.comment, comment);
	});

	it('Should serialize correctly', async () => {
		const superdata = new SuperData(group, uri);

		assert.deepStrictEqual(await superdata.serialize(), {
			uuid,
			comment
		});
	});

	it('Should async update with no new data', async () => {
		const superdata = new SuperData(group, uri);
		await superdata.update();

		assert.deepStrictEqual(await superdata.serialize(), {
			uuid,
			comment
		});
	});

	it('Should async update with new data', async () => {
		const newComment = 'some new comment';
		const superdata = new SuperData(group, uri);

		superdata.toUpdate.comment = newComment;

		assert.deepStrictEqual(await superdata.serialize(), {
			uuid,
			comment
		});

		await superdata.update();

		assert.deepStrictEqual(await superdata.serialize(), {
			uuid,
			comment: newComment
		});
	});

	it('Should async setComment and update data', async () => {
		const newComment = 'some new comment';
		const superdata = new SuperData(group, uri);

		await superdata.setComment(newComment);

		assert.deepStrictEqual(await superdata.serialize(), {
			uuid,
			comment: newComment
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

		const superdata = new SuperData(group, uri);
		const newSuperData = await superdata.cloneTo(newGroup);
		newGroup.archive.extract = async () => `{"${constants.superDataMeta.COMMENT}":"${comment}","${constants.superDataMeta.UUID}":"${newSuperData.uuid}"}`;

		assert.notDeepStrictEqual(newSuperData.uuid, uuid);
		assert.deepStrictEqual(await superdata.serialize(), {
			uuid,
			comment
		});
		assert.deepStrictEqual(await newSuperData.serialize(), {
			uuid: newSuperData.uuid,
			comment
		});
		assert.deepStrictEqual(hits, 1);
	});
});