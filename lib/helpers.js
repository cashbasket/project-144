function convertToArray(data) {
	var array = [];
	if(!Array.isArray(data)) {
		array.push(data);
	} else {
		array = data;
	}
	return array;
}

module.exports = {
	convertToArray : convertToArray
};