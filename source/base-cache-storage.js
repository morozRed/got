/**
 * TODO: deal with expired ttl`s and capacity
 */

module.exports = () => {
	const _records = new Map();

	this.get = key => {
		return new Promise(resolve => {
			const addresses = _records.get(key);
			resolve(addresses || null);
		});
	};

	this.set = (key, record) => {
		_records.set(key, record);
	};

	this.clear = () => {
		_records.clear();
	};

	return this;
};
