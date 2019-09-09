const { spawn } = require('child_process');

const { path7za } = require('7zip-bin');
const Seven = require('node-7z');

const input = 'C:\\Users\\EPMA_Castaing\\WebstormProjects\\sxes-compressor\\tests\\test.7z';

const files = Seven.list(input, {
	$bin: path7za,
});

files.on('data', data => {
	console.log(data);
});

files.on('end', () => {
	console.log('Finished Listing');

	const extraction = spawn(path7za, ['e', input, '-so', 'fe_stuff_0010_QLW/*']);

	let final;

	extraction.stdout.on('data', data => {
		final = final + data;
	});

	extraction.stdout.on('end', () => {
//		console.log(final.toString());
		console.log('Finished Extracting Data');
	});
});