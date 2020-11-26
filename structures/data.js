module.exports = class Data {
	constructor(archive, uri, rawData = Buffer.from([]), offset = 0, bins = 0, positions = 0) {
		this.data = {
			uri,
			archive,
			name: uri.split('/').pop().split('.')[0],
			offset,
			rawData,
			bins,
			positions
		};
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

	async get(bin = 0, position = -1) {
		if (this.data.rawData.length === 0)
			this.data.rawData = await this.data.archive.extract(this.data.uri);

		if (bin >= 0 && bin < this.bins)
			if (position <= this.positions)
				if (position >= 0)
					return this.rawData.readUInt32LE(this.data.offset + (4 * (bin * this.positions + position)));
				else {
					let data = [];
					for (let i = 0; i <= this.positions; i++)
						data.push(this.rawData.readUInt32LE(this.data.offset + (4 * (bin * this.positions + i))));
					return data;
				}
			else
				throw `Out of bounds error: Wanted bin ${bin}, pos ${position}; max is bin ${this.bins}, pos ${this.positions}`;
		else
			throw `Out of bounds error: Wanted bin ${bin}, pos ${position}; max is bin ${this.bins}, pos ${this.positions}`;
	}

	async serialize() {
		let data = [];

		for (let bin = 0; bin < this.bins; bin++) {
			data[bin] = [];

			for (let pos = 0; pos < this.positions; pos++)
				data[bin][pos] = await this.get(bin, pos);
		}

		return data;
	}

	toArray() {
		return this.serialize();
	}

	clone() {
		return new Data(this.data.archive, this.data.uri, Buffer.from([]), this.data.offset, this.bins, this.positions);
	}
};