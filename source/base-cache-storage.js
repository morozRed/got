/**
 * TODO: deal with expired ttl`s and capacity
 */
const rr = require('./utils/rr');

module.exports = options => {
	this.capacity = options.capacity;
	this.storage = new Map();

	this.get = key => {
		let addresses = this.storage.get(key);
		if (addresses) {
			address = rr(addresses)
			return address();
		}
		return null;
	};

	this.getAll = () => {
		return Object.values(this.storage);
	};

	this.set = (key, record) => {
		this.storage.set(key, record);
	};

	this.update = (key, params) => {
		this.storage.set(key, Object.assign(this.storage.get(key), params));
	};

	return this;
};
