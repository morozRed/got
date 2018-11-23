const dns = require('dns');
const net = require('net');
const baseCacheStorage = require('./base-cache-storage');

const IPv4 = 4;
const IPv6 = 6;

module.exports = options => {
	this.ttl = options.ttl;
	this.capacity = options.capacity;

	this.storage = options.storageInstance || baseCacheStorage({
		capacity: this.capacity
	});

	this.lookup = (hostname, options, callback) => {
		let _resolver;

		const matchedFamily = net.isIP(hostname);

		if (matchedFamily) {
			return callback(null, hostname, matchedFamily);
		}
		
		options = options || {};

		const key = hostname + '_' + (options.family || IPv4);
		const cacheRecord = this.storage.get(key);

		if (cacheRecord && cacheRecord.ttl >= Date.now()) {
			return callback(null, cacheRecord.address, cacheRecord.family);
		}

		if (cacheRecord) {
			this.storage.update(key, {
				ttl: Date.now() + cacheRecord.ttl
			});
			return callback(null, cacheRecord.address, cacheRecord.family);
		}

		/**
		 * TODO: change address family parser
		 * 		 use resolverAll in case of
		 * 		 undefined family
		 */
		switch (options.family) {
			case IPv4:
				_resolver = dns.resolve4;
				break;
			case IPv6:
				_resolver = dns.resolve6;
				break;
			default:
				options.family = IPv4;
				_resolver = dns.resolve4;
				break;
		}
		/**
		 * Use resolve instead of lookup because it
		 * supports ttl and not blocking thread
		 */
		_resolver(hostname, {ttl: true}, (err, results) => {
			if (err) return callback(err);
			const records = results.map(result => {
				return {
					address: result.address,
					ttl: Date.now() + (result.ttl * 1000),
					family: options.family
				};
			});
			this.storage.set(key, records);
			return callback(null, records[0].address, records[0].family);
		});
	};

	return this;
};
