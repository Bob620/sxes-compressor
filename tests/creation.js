const createGroup = require('../creategroup.js');

const creationZip = createGroup('zip', './', 'test');
const creation7z = createGroup('7z', './', 'test');

creationZip.then(async sxesGroup => {
	console.log(sxesGroup);
});

creation7z.then(async sxesGroup => {
	console.log(sxesGroup);
});