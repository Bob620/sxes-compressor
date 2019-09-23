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
	let promiseList = {pass: false, length: 0};
	let promiseExtract = {pass: false, length: 0};
	let streamExtract = {pass: false, length: 0};
	let promiseAdd = {pass: false, length: 0};
	let promiseDelete = {pass: false, length: 0};

	let start;
	let end;

	start = Date.now();
	let listNames = await seven.list();
	end = Date.now();

	listNames = listNames.map(({name}) => name);
	if (listNames.length === 2 && listNames.includes('test.a') && listNames.includes('test.b'))
		promiseList = {pass: true, length: end - start};
	else
		promiseList.length = end - start;

	start = Date.now();
	let extractBuffer = await seven.extract('*.b');
	end = Date.now();

	if (extractBuffer.toString() === 'bc')
		promiseExtract = {pass: true, length: end - start};
	else
		promiseExtract.length = end - start;

	await new Promise(resolve => {
		let contents = Buffer.concat([]);

		start = Date.now();
		seven.extractStream('*.b').on('data', output => {
			contents = Buffer.concat([contents, output]);
		}).on('end', () => {
			end = Date.now();
			if (contents.toString() === 'bc')
				streamExtract = {pass: true, length: end - start};
			else
				streamExtract.length = end - start;
			resolve();
		});
	});

	start = Date.now();
	await seven.update('test.c', 'c');
	end = Date.now();

	const files = (await seven.list()).map(({name}) => name);
	if (files.includes('test.c') && (await seven.extract('*.c')).toString() === 'c') {
		promiseAdd = {pass: true, length: end - start};

		start = Date.now();
		await seven.delete('*.c');
		end = Date.now();

		const files = (await seven.list()).map(({name}) => name);
		if (!files.includes('test.c'))
			promiseDelete = {pass: true, length: end - start};
		else
			promiseDelete.length = end - start;
	} else
		promiseAdd.length = end - start;

	const endTime = Date.now();

	return {startTime, endTime, name, promiseList, promiseExtract, streamExtract, promiseAdd, promiseDelete};
})).then(output => output.map(({name, startTime, endTime, promiseList, promiseExtract, streamExtract, promiseAdd, promiseDelete}) => {
	console.log(`${name}\t| Promise List: ${promiseList.pass ? 'PASS' : 'FAIL'}\t(${promiseList.length}ms)`);
	console.log(`${name}\t| Promise Extract: ${promiseExtract.pass ? 'PASS' : 'FAIL'}\t(${promiseExtract.length}ms)`);
	console.log(`${name}\t| Promise Add: ${promiseAdd.pass ? 'PASS' : 'FAIL'}\t\t(${promiseAdd.length}ms)`);
	console.log(`${name}\t| Promise Delete: ${promiseDelete.pass ? 'PASS' : 'FAIL'}\t(${promiseDelete.length}ms)`);
	console.log(`${name}\t| Stream Extract: ${streamExtract.pass ? 'PASS' : 'FAIL'}\t(${streamExtract.length}ms)`);
	console.log();
	return {name, startTime, endTime, functionTime: streamExtract.length + promiseDelete.length + promiseAdd.length + promiseExtract.length + promiseList.length};
}).map(({name, startTime, endTime, functionTime}) => {
	console.log(name);
	console.log(`Total time to run tests:     ${endTime - startTime - functionTime}ms`);
	console.log(`Total time to run functions: ${functionTime}ms\n`)
}));
