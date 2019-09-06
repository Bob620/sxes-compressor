const { spawn } = require('child_process');

const SevenBin = require('7zip-bin');
const Seven = require('node-7z');

const input = '//EPMA-NAS/data/Noah/SXES_Fe/2019-08-13/fe_stuff/test.7z';

const files = Seven.list(input, {
	$bin: SevenBin.path7za,
});

files.on('data', data => {
	console.log(data);
});

files.on('end', () => {
	console.log('Finished Listing');

	const extraction = spawn(SevenBin.path7za, ['e', input, '-so', 'fe_stuff_sum_30.csv']);

	let final;

	extraction.stdout.on('data', data => {
		final = final + data;
	});

	extraction.stdout.on('end', () => {
		console.log(final.toString());
		console.log('Finished Extracting Data');
	});
});