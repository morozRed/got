module.exports = () => {
	const _records = new Map();

	this.get = key => {
		return new Promise(resolve => {
			const addresses = _records.get(key);
			resolve(addresses || null);
		});
	};

	this.set = (key, record) => {
		return new Promise(resolve => {
			_records.set(key, record);
			resolve();
		});
	};

	this.clear = () => {
		_records.clear();
	};

	return this;
};
