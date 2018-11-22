/**
 * Update later to independent
 * native promisified resolver
 */

/**
  * Lookup can be used in @method {http.request} call!
  *	just pass it as a @param {lookup}
  */
const dns = require('dns');
const baseCacheStorage = require('./base-cache-storage');

module.exports = options => {
	this.ttl = options.ttl;
	this.capacity = options.capacity;

	this.storage = options.storageInstance || baseCacheStorage({
		capacity: this.capacity
	});

	this.lookup = (hostname, options, callback) => {
		let _resolver;

		options = options || {};
		options.ttl = true;

		const key = hostname + '_' + (options.family || 4);
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
			case '4':
				_resolver = dns.resolve4;
				break;
			case '6':
				_resolver = dns.resolve6;
				break;
			default:
				options.family = 4;
				_resolver = dns.resolve4;
				break;
		}
		/**
		 * Use resolve instead of lookup because it
		 * supports ttl and not blocking thread
		 */
		_resolver(hostname, {ttl: true}, (err, results) => {
			if (err) {
				return callback(err);
			}

			const records = results.map(result => {
				return {
					address: result.address,
					ttl: Date.now() + result.ttl,
					family: options.family
				};
			});
			this.storage.set(key, records);
			const record = this.storage.get(key);
			callback(null, record.address, record.family);
		});
	};

	return this;
};
