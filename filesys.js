var path = require('path'),
	fs = require('fs');
const serviceOrder = require('./serviceOrder.json');

exports.currentFile = function(filenum) {


	var f = path.join(__dirname,'/data/'+serviceOrder[filenum].file)+'.txt';

	var str = fs.readFileSync(f, 'utf8');
	
	return str;
	
	
	
}

