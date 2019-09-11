const { spawn } = require('child_process');
const path = require('path');

const { path7za } = require('7zip-bin');
const Seven = require('node-7z');

module.exports = class SevenZip {
	constructor(uri, bin=path7za) {
		this.data = {
			bin,
			uri: path.resolve(uri)
		}
	}

	get bin() {
		return this.data.bin;
	}

	get uri() {
		return this.data.uri;
	}

	list(match='*') {
		return new Promise(resolve => {
			const child = Seven.list(this.uri, {
				$bin: this.bin,
				$cherryPick: [match]
			});
			let output = [];
			child.on('data', data => {
				output.push(data);
			});
			child.on('end', () => {
				resolve(output);
			});
		});
	}

	extract(match='*') {
		return new Promise(resolve => {
			const child = spawn(this.bin, ['e', this.uri, '-so', match]);
			let output = Buffer.concat([]);
			child.stdout.on('data', data => {
				output = Buffer.concat([output, data]);
			});
			child.stdout.on('end', () => {
				resolve(output);
			});
		});
	}

	update(fileName, input) {
		return new Promise(resolve => {
			const child = spawn(this.bin, ['u', this.uri, `-si${fileName}`]);
			child.stdin.write(input);
			child.stdin.end();
			child.stdout.on('end', () => {
				resolve();
			});
		});
	}

	updateStream(fileName, inputStream) {
		return new Promise(resolve => {
			const child = spawn(this.bin, ['a', this.uri, `-si${fileName}`]);
			inputStream.pipe(child.stdin);
			child.stdout.on('end', () => {
				resolve();
			});
		});
	}

	delete(match) {
		return new Promise(resolve => {
			Seven.delete(this.uri, match, {
				$bin: this.bin
			}).on('end', () => {
				resolve();
			});
		});
	}

	streamList(match='*') {
		return Seven.list(this.uri, {
			$bin: this.bin,
			$cherryPick: [match]
		});
	}

	streamExtract(match='*') {
		return spawn(this.bin, ['e', this.uri, '-so', match]).stdout;
	}
};
