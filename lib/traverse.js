var traverse;
var KEEP_KEY = 'keep key';

module.exports = traverse = function(object, visitor, key, parent) {
    var key, child;

	var ret = visitor.call(null, object, key, parent);
    if (ret === false) {
        return;
    } else if(ret === KEEP_KEY) {
		return KEEP_KEY;
	}
	var offset = 0;
    for (key in object) {
		if(Array.isArray(object)) {
			key = Number(key) - offset;
		}

        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
            	if(traverse(child, visitor, key, object) === KEEP_KEY) {
					offset++;
				}
            }
        }
    }
};

traverse.KEEP_KEY = KEEP_KEY;
