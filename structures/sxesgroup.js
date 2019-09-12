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
	}

	async initialize() {
		const rawMeta = await this.archive.extract(constants.fileStructure.METADATA);
		if (rawMeta.length !== 0)
			this.data.metadata = JSON.parse(rawMeta);
		else
			this.data.metadata = {};

		this.data.rawConditions = new Map((await this.archive.list(constants.fileStructure.RAWCONDITIONINLET)).map(({file}) => new RawCondition(file)).map(boi => [boi.uuid, boi]));
		this.data.conditions = new Map((await this.archive.list(constants.fileStructure.CONDITIONINLET)).map(({file}) => new Condition(file)).map(boi => [boi.uuid, boi]));
		this.data.backgrounds = new Map((await this.archive.list(constants.fileStructure.BACKGROUNDINLET)).map(({file}) => new Background(file)).map(boi => [boi.uuid, boi]));

		this.data.positions = new Map(await Promise.all((await this.archive.list(constants.fileStructure.POSITIONINLET))
			.map(({file}) => new Position(this.archive, file)).map(async pos => [pos.uuid, await pos.initialize({
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

		return this;
	}

	async save() {

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

	addProject(project) {
		this.data.projects.set(project.uuid, project);
	}

	deleteProject(uuid) {
		this.data.projects.delete(uuid);
	}

	getAnalyses() {
		return this.data.analyses;
	}

	getAnalysis(uuid) {
		return this.data.analyses.get(uuid);
	}

	addAnalysis(analysis) {
		this.data.analyses.set(analysis.uuid, analysis);
	}

	deleteAnalysis(uuid) {
		this.data.analyses.delete(uuid);
	}

	getPositions() {
		return this.data.positions;
	}

	getPosition(uuid) {
		return this.data.positions.get(uuid);
	}

	addPosition(position) {
		this.data.positions.set(position.uuid, position);
	}

	deletePosition(uuid) {
		this.data.positions.delete(uuid);
	}

	getBackgrounds() {
		return this.data.backgrounds;
	}

	getBackground(uuid) {
		return this.data.backgrounds.get(uuid);
	}

	addBackground(background) {
		this.data.backgrounds.set(background.uuid, background);
	}

	deleteBackground(uuid) {
		this.data.backgrounds.delete(uuid);
	}

	getConditions() {
		return this.data.conditions;
	}

	getCondition(uuid) {
		return this.data.conditions.get(uuid);
	}

	addCondition(condition) {
		this.data.conditions.set(condition.uuid, condition);
	}

	deleteCondition(uuid) {
		this.data.conditions.delete(uuid);
	}

	getRawConditions() {
		return this.data.rawConditions;
	}

	getRawCondition(uuid) {
		return this.data.rawConditions.get(uuid);
	}

	addRawCondition(rawCondition) {
		this.data.rawConditions.set(rawCondition.uuid, rawCondition);
	}

	deleteRawCondition(uuid) {
		this.data.rawConditions.delete(uuid);
	}
};