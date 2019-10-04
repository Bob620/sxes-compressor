module.exports = class Data {
	constructor(archive, uri, rawData, offset=0, bins=0, positions=0) {
		this.data = {
			uri,
			archive,
			name: uri.split('/').pop().split('.')[0],
			offset,
			rawData,
			bins,
			positions
		}
	}

	get name() {
		return this.data.name;
	}

	get rawData() {
		return this.data.rawData;
	}

	get bins() {
		return this.data.bins;
	}

	get positions() {
		return this.data.positions;
	}

	get(bin=0, position=0) {
		if (bin < this.bins && position <= this.positions)
			return this.rawData.readUInt32LE(this.data.offset + (4 * (bin * this.positions + position)));
		else
			throw `Out of bounds error: Wanted bin ${bin}, pos ${position}; max is bin ${this.bins}, pos ${this.positions}`;
	}

	serialize() {

	}
};