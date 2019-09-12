const SevenZip = require('../7z.js');
const sevens = [{
	name: 'zip',
	seven: new SevenZip('./test.zip')
},  {
	name: '7z',
	seven: new SevenZip('./test.7z')
}];

Promise.all(sevens.map(async ({name, seven}) => {
	const startTime = Date.now();
	let promiseList = false;
	let streamList = false;
	let promiseExtract = false;
	let streamExtract = false;
	let promiseAdd = false;
	let promiseDelete = false;

	const listNames = (await seven.list()).map(file => file.file);
	if (listNames.length === 2 && listNames.includes('test.a') && listNames.includes('test.b'))
		promiseList = true;

	await new Promise(resolve => {
		let names = [];
		seven.streamList().on('data', ({file}) => {
			names.push(file);
		}).on('end', () => {
			if (names.length === 2 && names.includes('test.a') && names.includes('test.b'))
				streamList = true;
			resolve();
		});
	});

	if ((await seven.extract('*.b')).toString() === 'bc')
		promiseExtract = true;

	await new Promise(resolve => {
		let contents = Buffer.concat([]);
		seven.streamExtract('*.b').on('data', output => {
			contents = Buffer.concat([contents, output]);
		}).on('end', () => {
			if (contents.toString() === 'bc')
				streamExtract = true;
			resolve();
		});
	});

	await seven.update('test.c', 'c');

	const files = (await seven.list()).map(({file}) => file);
	if (files.includes('test.c') && (await seven.extract('*.c')).toString() === 'c') {
		promiseAdd = true;

		await seven.delete('*.c');
		const files = (await seven.list()).map(({file}) => file);
		if (!files.includes('test.c'))
			promiseDelete = true;
	}

	const endTime = Date.now();

	return {startTime, endTime, name, promiseList, streamList, promiseExtract, streamExtract, promiseAdd, promiseDelete};
})).then(output => output.map(({name, startTime, endTime, promiseList, streamList, promiseExtract, streamExtract, promiseAdd, promiseDelete}) => {
	console.log(`${name} | Promise List: ${promiseList ? 'PASS' : 'FAIL'}`);
	console.log(`${name} | Promise Extract: ${promiseExtract ? 'PASS' : 'FAIL'}`);
	console.log(`${name} | Promise Add: ${promiseAdd ? 'PASS' : 'FAIL'}`);
	console.log(`${name} | Promise Delete: ${promiseDelete ? 'PASS' : 'FAIL'}`);
	console.log(`${name} | Stream List: ${streamList ? 'PASS' : 'FAIL'}`);
	console.log(`${name} | Stream Extract: ${streamExtract ? 'PASS' : 'FAIL'}`);
	return {name, startTime, endTime};
}).map(({name, startTime, endTime}) => {
	console.log(name);
	console.log(`Length: ${endTime - startTime}ms\n`);
}));
