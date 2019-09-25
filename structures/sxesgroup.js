const path = require('path');

const constants = require('../constants.json');

const Position = require('./position.js');
const Analysis = require('./analysis.js');
const Project = require('./project.js');
const Background = require('./background.js');
const Condition = require('./condition.js');
const RawCondition = require('./rawcondition.js');
const Seven = require('../7z.js');

module.exports = class SxesGroup {
	constructor(uri) {
		const fileType = constants.fileTypes[uri.split('.').pop()];
		let type = fileType ? fileType : constants.fileTypes.DEFAULT;
		uri = path.resolve(uri);

		this.data = {
			uri,
			archive: new Seven(uri, type),
			metadata: {},
			projects: new Map(),
			analyses: new Map(),
			positions: new Map(),
			backgrounds: new Map(),
			conditions: new Map(),
			rawConditions: new Map()
		};

		this.toUpdate = {
			metadata: false,
			positions: [],
			backgrounds: [],
			conditions: [],
			rawConditions: []
		}

	}

	async initialize() {
		const rawMeta = await this.archive.extract(constants.fileStructure.METADATA);
		if (rawMeta.length !== 0)
			this.data.metadata = JSON.parse(rawMeta.toString());
		else
			throw "No metadata file found within the archive, are you sure this is a sxesgroup file?";

		this.data.rawConditions = new Map((await this.archive.list(constants.fileStructure.RAWCONDITIONINLET)).map(({name}) => new RawCondition(this.archive, name)).map(boi => [boi.uuid, boi]));
		this.data.conditions = new Map((await this.archive.list(constants.fileStructure.CONDITIONINLET)).map(({name}) => new Condition(this.archive, name)).map(boi => [boi.uuid, boi]));
		this.data.backgrounds = new Map((await this.archive.list(constants.fileStructure.BACKGROUNDINLET)).map(({name}) => new Background(this.archive, name)).map(boi => [boi.uuid, boi]));

		this.data.positions = new Map(await Promise.all((await this.archive.list(constants.fileStructure.POSITIONINLET))
			.map(({name}) => new Position(this.archive, name)).map(async pos => [pos.uuid, await pos.initialize({
				rawConditions: this.getRawConditions(),
				conditions: this.getConditions(),
				backgrounds: this.getBackgrounds()
			})]))
		);

		this.data.analyses = new Map(this.data.metadata[constants.metaMeta.ANALYSES].map(
			({uuid, name, comment, positionUuids}) => new Analysis(this.archive, uuid, name, comment, new Map(positionUuids.map(uuid => [uuid, this.getPosition(uuid)])))
		).map(analysis => [analysis.uuid, analysis]));
		this.data.projects = new Map(this.data.metadata[constants.metaMeta.PROJECTS].map(
			({uuid, name, comment, analysisUuids}) => new Project(this.archive, uuid, name, comment, new Map(analysisUuids.map(uuid => [uuid, this.getAnalysis(uuid)])))
		).map(project => [project.uuid, project]));

		this.data.metadata.analyses = [];
		this.data.metadata.projects = [];

		return this;
	}

	async save() {
		// Metadata
		if (this.toUpdate.metadata) {
			this.toUpdate.metadata = false;

			this.data.metadata.analyses = Array.from(this.getAnalyses().values());
			this.data.metadata.projects = Array.from(this.getProjects().values());

			await this.archive.update(constants.fileStructure.METADATA, JSON.stringify(this.data.metadata));
			this.data.metadata.analyses = [];
			this.data.metadata.projects = [];
		}

		// Save the components of the group
		await Promise.all(['positions', 'backgrounds', 'conditions', 'rawConditions'].map(async type => {
			let failed = await Promise.all(this.toUpdate[type].filter(async uuid => !!(await this.getPosition(uuid).save())));
			let toUpdate = new Set(this.toUpdate.positions);

			for (const uuid of failed)
				toUpdate.add(uuid);

			this.toUpdate.positions = Array.from(toUpdate.values());
		}));
	}

	get archive() {
		return this.data.archive;
	}

	get uri() {
		return this.data.uri;
	}

	getProjects() {
		return this.data.projects;
	}

	getProject(uuid) {
		return this.data.projects.get(uuid);
	}

	async addProject(project) {
		this.data.projects.set(project.uuid, project);
		this.toUpdate.metadata = true;
		await this.save();
		return project;
	}

	async deleteProject(uuid) {
		this.data.projects.delete(uuid);
		this.toUpdate.metadata = true;
		await this.save();
	}

	getAnalyses() {
		return this.data.analyses;
	}

	getAnalysis(uuid) {
		return this.data.analyses.get(uuid);
	}

	async addAnalysis(analysis) {
		this.data.analyses.set(analysis.uuid, analysis);
		this.toUpdate.metadata = true;
		await this.save();
		return analysis;
	}

	async deleteAnalysis(uuid) {
		this.data.analyses.delete(uuid);
		this.toUpdate.metadata = true;
		await this.save();
	}

	getPositions() {
		return this.data.positions;
	}

	getPosition(uuid) {
		return this.data.positions.get(uuid);
	}

	async addPosition(position) {
		position = await position.cloneTo(this.archive);
		this.data.positions.set(position.uuid, position);
		return position;
	}

	async deletePosition(uuid) {
		const position = this.getPosition(uuid);
		this.data.positions.delete(uuid);
		await position.permDelete();
	}

	getBackgrounds() {
		return this.data.backgrounds;
	}

	getBackground(uuid) {
		return this.data.backgrounds.get(uuid);
	}

	async addBackground(background) {
		background = background.cloneTo(this.archive);
		this.data.backgrounds.set(background.uuid, background);
		return background;
	}

	async deleteBackground(uuid) {
		const background = this.getBackground(uuid);
		this.data.backgrounds.delete(uuid);
		await background.permDelete();
	}

	getConditions() {
		return this.data.conditions;
	}

	getCondition(uuid) {
		return this.data.conditions.get(uuid);
	}

	async addCondition(condition) {
		condition = condition.cloneTo(this.archive);
		this.data.conditions.set(condition.uuid, condition);
		return condition;
	}

	async deleteCondition(uuid) {
		const condition = this.getCondition(uuid);
		this.data.conditions.delete(uuid);
		await condition.permDelete();
	}

	getRawConditions() {
		return this.data.rawConditions;
	}

	getRawCondition(uuid) {
		return this.data.rawConditions.get(uuid);
	}

	async addRawCondition(rawCondition) {
		rawCondition = rawCondition.cloneTo(this.archive);
		this.data.rawConditions.set(rawCondition.uuid, rawCondition);
		return rawCondition;
	}

	async deleteRawCondition(uuid) {
		const rawCondition = this.getRawCondition(uuid);
		this.data.rawConditions.delete(uuid);
		await rawCondition.permDelete();
	}
};