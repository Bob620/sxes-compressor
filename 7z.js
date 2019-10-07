const { spawn } = require('child_process');
const path = require('path');

const constants = require('./constants.json');
const generateUuid = require('./generateuuid.js');

const { path7za } = require('7zip-bin');

module.exports = class SevenZip {
	constructor(uri, type='', bin=path7za) {
		this.data = {
			bin,
			uri: path.resolve(uri),
			type,
			maxProcesses: constants['7zMaxChildren'],
			children: 0,
			queueFuncs: new Map(),
			queue: new Set(),
			manualQueue: new Set()
		};

		this.data.next = () => {
			if (this.data.children < this.data.maxProcesses)
				try {
					const manualValue = this.data.manualQueue.entries().next().value;
					if (manualValue) {
						const nextId = manualValue[0];
						this.data.queue.delete(nextId);
						this.data.manualQueue.delete(nextId);

						const nextFunc = this.data.queueFuncs.get(nextId);
						this.data.queueFuncs.delete(nextId);
						nextFunc();
					} else {
						const nextId = this.data.queue.entries().next().value[0];
						this.data.queue.delete(nextId);

						const nextFunc = this.data.queueFuncs.get(nextId);
						this.data.queueFuncs.delete(nextId);

						nextFunc();
					}
				} catch(err) {
					return undefined;
				}
			return undefined;
		}
	}

	has(processId) {
		return this.data.queueFuncs.has(processId);
	}

	expedite(processId) {
		this.data.manualQueue.add(processId);
	}

	queue(func, processId=generateUuid.v4()) {
		return new Promise(resolve => {
			this.data.queueFuncs.set(processId, async () => {
				resolve(await func());
				this.data.next();
			});

			this.data.queue.add(processId);
		});
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

	list(match='*', includeDirectories=false, processId=false) {
		return new Promise(async resolve => {
			if (this.data.children < this.data.maxProcesses) {
				this.data.children++;
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
								name: item.join('').trim().replace(/\\/g, '/')
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

					this.data.children--;
					this.data.next();
				});
			} else
				resolve(await this.queue(this.list.bind(this, match, includeDirectories), processId));
		});
	}

	extract(match='*', processId=false) {
		return new Promise(async resolve => {
			if (this.data.children < this.data.maxProcesses) {
				this.data.children++;
				const child = spawn(this.bin, ['e', this.uri, '-so', match, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
				let output = Buffer.concat([]);
				child.stdout.on('data', data => {
					output = Buffer.concat([output, data]);
				});
				child.stdout.on('end', () => {
					resolve(output);
					this.data.children--;
					this.data.next();
				});
			} else
				resolve(await this.queue(this.extract.bind(this, match), processId));
		});
	}

	update(fileName, input, processId=false) {
		return new Promise(async resolve => {
			if (this.data.children < this.data.maxProcesses) {
				this.data.children++;
				const child = spawn(this.bin, ['u', this.uri, `-si${fileName}`, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
				child.stdin.write(input);
				child.stdin.end();
				child.stdout.on('end', () => {
					resolve();
					this.data.children--;
					this.data.next();
				});
			} else
				resolve(await this.queue(this.update.bind(this, fileName, input), processId));
		});
	}

	updateStream(fileName, inputStream, processId=false) {
		return new Promise(async resolve => {
			if (this.data.children < this.data.maxProcesses) {
				this.data.children++;
				const child = spawn(this.bin, ['u', this.uri, `-si${fileName}`, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
				inputStream.pipe(child.stdin);
				child.stdout.on('end', () => {
					resolve();
					this.data.children--;
					this.data.next();
				});
			} else
				resolve(this.queue(this.updateStream.bind(this, fileName, inputStream), processId));
		});
	}

	addFrom(uri, deleteOnceDone, processId=false) {
		return new Promise(async resolve => {
			if (this.data.children < this.data.maxProcesses) {
				this.data.children++;
				const child = spawn(this.bin, ['a', this.uri, uri, `${this.type !== '' ? `-t${this.type}` : ''}`, deleteOnceDone ? '-sdel' : ''].filter(option => option));
				child.stdout.on('end', () => {
					resolve();
					this.data.children--;
					this.data.next();
				});
			} else
				resolve(this.queue(this.addFrom.bind(this, uri, deleteOnceDone), processId));
		});
	}

	delete(match, processId=false) {
		return new Promise(async resolve => {
			if (this.data.children < this.data.maxProcesses) {
				this.data.children++;
				const child = spawn(this.bin, ['d', this.uri, match, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option));
				child.stdout.on('end', () => {
					resolve();
					this.data.children--;
					this.data.next();
				});
			} else
				resolve(this.queue(this.delete.bind(this, match), processId));
		});
	}

	extractStream(match='*') {
		return spawn(this.bin, ['e', this.uri, '-so', match, `${this.type !== '' ? `-t${this.type}` : ''}`].filter(option => option)).stdout;
	}
};