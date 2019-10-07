const constants = require('./constants.json');

const Data = require('./structures/data.js');

module.exports = (archive, uri, condition) => {
	switch(uri.split('/').pop().split('.')[0]) {
		default:
			return new Data(archive, uri, 0, condition.ccd.bins.x, condition.ccd.bins.y);
		case 'xes':
			return new XesData(archive, uri, condition);
		case 'qlw':
			return new QlwData(archive, uri);
	}
};

class XesData extends Data {
	constructor(archive, uri, condition, rawData=Buffer.from([])) {
		super(archive, uri, rawData, 0, condition.ccd.bins.x, condition.ccd.bins.y);
	}
}

class QlwData extends Data {
	constructor(archive, uri, rawData=Buffer.from([])) {
		super(archive, uri, rawData, 0, 1, 4098);
	}

	async get(bin=0, position=0) {
		if (bin < this.bins && position <= this.positions)
			if (this.data.rawData.length !== 0)
				return this.rawData.readDoubleLE(this.data.offset + (8 * (bin * this.positions + position)));
			else {
				this.data.rawData = await this.data.archive.extract(this.data.uri);
				return this.rawData.readDoubleLE(this.data.offset + (8 * (bin * this.positions + position)));
			}
		else
			throw `Out of bounds error: Wanted bin ${bin}, pos ${position}; max is bin ${this.bins}, pos ${this.positions}`;
	}

	clone() {
		return new QlwData(this.data.archive, this.data.uri);
	}
}