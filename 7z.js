const { spawn } = require('child_process');
const path = require('path');

const { path7za } = require('7zip-bin');

module.exports = class SevenZip {
	constructor(uri, type='', bin=path7za) {
		this.data = {
			bin,
			uri: path.resolve(uri),
			type
		}
	}

	get bin() {
		return this.data.bin;
	}

	get uri() {
		return this.data.uri;
	}

	get type() {
		return this.data.type;
	}

	list(match='*', includeDirectories=false) {
		return new Promise(resolve => {
			const child = spawn(this.bin, ['l', this.uri, '-so', match, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
			let output = Buffer.concat([]);
			child.stdout.on('data', data => {
				output = Buffer.concat([output, data]);
			});
			child.stdout.on('end', () => {
				output = output.toString().split('\n');
				const filesFolders = output[output.length - 2].trim().split(' ').filter(char => char && char !== 'files,' && char !== 'files' && char !== 'folders');
				const totalFiles = parseInt(filesFolders[4]) + (filesFolders[5] ? parseInt(filesFolders[5]) : 0);
				if (!isNaN(totalFiles)) {
					const itemLengths = output[output.length - 3].split(' ').map(item => item.length);
					const files = output.slice((-3) - totalFiles, -3).map(line => line.trim().split('')).map(item => {
						let info = {
							datetime: item.splice(0, itemLengths[0]).join('').trim(),
							attr: item.splice(0, itemLengths[1] + 1).join('').trim(),
							size: parseInt(item.splice(0, itemLengths[2] + 1).join('').trim()),
							compressedSize: parseInt(item.splice(0, itemLengths[3] + 1).join('').trim()),
							name: item.splice(0, itemLengths[5] + 2).join('').trim().replace('\\', '/')
						};
						if (isNaN(info.compressedSize))
							info.compressedSize = 0;

						return info;
					});

					if (includeDirectories)
						resolve(files);
					else
						resolve(files.filter(({attr}) => attr[0] !== 'D'));
				} else
					resolve([]);
			});
		});
	}

	extract(match='*') {
		return new Promise(resolve => {
			const child = spawn(this.bin, ['e', this.uri, '-so', match, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
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
			const child = spawn(this.bin, ['u', this.uri, `-si${fileName}`, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
			child.stdin.write(input);
			child.stdin.end();
			child.stdout.on('end', () => {
				resolve();
			});
		});
	}

	updateStream(fileName, inputStream) {
		return new Promise(resolve => {
			const child = spawn(this.bin, ['a', this.uri, `-si${fileName}`, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
			inputStream.pipe(child.stdin);
			child.stdout.on('end', () => {
				resolve();
			});
		});
	}

	delete(match) {
		return new Promise(resolve => {
			const child = spawn(this.bin, ['d', this.uri, match, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
			child.stdout.on('end', () => {
				resolve();
			});
		});
	}

	extractStream(match='*') {
		return spawn(this.bin, ['e', this.uri, '-so', match, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option)).stdout;
	}
};