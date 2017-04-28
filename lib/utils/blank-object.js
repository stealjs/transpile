
module.exports = function(obj){
	Object.keys(obj).forEach(function (prop) {
	  delete obj[prop];
	});
};
