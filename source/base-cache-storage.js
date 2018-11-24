/**
 * TODO: deal with expired ttl`s and capacity
 */

module.exports = () => {
	_records = new Map();

	this.get = async key => {
		const addresses = _records.get(key);
		return addresses || null;
	};

	this.set = (key, record) => {
		_records.set(key, record);
	};

	this.clear = () => {
		_records.clear();
	};

	return this;
};
