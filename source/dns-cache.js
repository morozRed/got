const dns = require("dns");
const BaseCacheStorage = require("./base-cache-storage");

module.exports = options => {
	this.ttl = options.ttl || 10000;
	this.capacity = options.capacity || 1000;

	this.storage = options.storageInstance || BaseCacheStorage({
		capacity: this.size
	});

	/**
	 * Prepare dns.lookup for extension
	 */
	dns._lookup = dns.lookup;

	dns.lookup = (hostname, options, callback) => {
		let key = hostname,
			cacheRecord;

		let family = 0,
			hints = 0,
			all = false;

		if (arguments.length === 2) {
			callback = options;
			options = family;
		} else if (typeof options === 'object') {
			if (options.family) {
				family = +options.family;
				if (family !== 4 && family !== 6) {
					callback(new Error('invalid argument: `family` must be 4 or 6'));
					return;
				}
			}
			if (options.hints) {
				hints = +options.hints;
			}
			all = (options.all === true);
			key = key + (options.family || '-') + (options.hints || '-') + (options.all || '-');
		} else if (options) {
			family = +options;
			if (family !== 4 && family !== 6) {
				callback(new Error('invalid argument: `family` must be 4 or 6'));
				return;
			}
			key = key + options;
		}

		cacheRecord = this.storage.get(key);

		if (cacheRecord && cacheRecord.ttl >= Date.now()) {
			return process.nextTick(function () {
				return callback(null, cacheRecord.address, cacheRecord.family);
			});
		} else {
			if (cacheRecord) {
				this.storage.update(key, {
					ttl: Date.now() + cacheTtl
				});
				return process.nextTick(function () {
					return callback(null, cacheRecord.address, cacheRecord.family);
				});
			}
			dns._lookup(hostname, options, (err, address, family) => {
				if (!err) {
					this.storage.set(key, {
						address: address,
						family: family,
						ttl: (Date.now() + this.ttl)
					})
				}
				return callback(null, address, family);
			});

		}
	};
	return this;
}
