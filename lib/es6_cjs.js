var traceur = require("traceur");


module.exports = function(load){
	return traceur.compile(load.source.toString(), {filename: load.address}).js;
};
