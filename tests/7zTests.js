const SevenZip = require('../7z.js');
const seven = new SevenZip('./test.7z');

seven.list().then(files => {
	const names = files.map(file => file.file);
	if (names.length === 2 && names.includes('test.a') && names.includes('test.b'))
		console.log('Promise List: PASS');
	else
		console.log('Promise List: FAIL');
});

let names = [];
seven.streamList().on('data', ({file}) => {
	names.push(file);
}).on('end', () => {
	if (names.length === 2 && names.includes('test.a') && names.includes('test.b'))
		console.log('Stream List: PASS');
	else
		console.log('Stream List: FAIL');
});

seven.extract('*.b').then(output => {
	if (output.toString() === 'bc')
		console.log('Promise Extract: PASS');
	else
		console.log('Promise Extract: FAIL');
});

let contents = Buffer.concat([]);
seven.streamExtract('*.b').on('data', output => {
	contents = Buffer.concat([contents, output]);
}).on('end', () => {
	if (contents.toString() === 'bc')
		console.log('Stream Extract: PASS');
	else
		console.log('Stream Extract: FAIL');
});