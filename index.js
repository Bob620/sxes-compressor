const SxesGroup = require('./structures/sxesgroup.js');

const test = new SxesGroup('./test/test.zip');
test.initialize().then(group => {
	console.log('test');
});