/**
 * TODO: deal with expired ttl`s and capacity
 */
const rr = require('./utils/rr');

module.exports = options => {
	this.capacity = options.capacity;
	this.records = new Map();

	this.get = key => {
		const addresses = this.records.get(key);
		if (addresses) {
			const address = rr(addresses);
			return address();
		}
		return;
	};

	this.set = (key, record) => {
		this.records.set(key, record);
	};

	this.update = (key, params) => {
		this.records.set(key, Object.assign(this.records.get(key), params));
	};

	return this;
};
