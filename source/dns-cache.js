/**
 * Update later to independent 
 * native promisified resolver
 */

 /**
  * Lookup can be used in @method {http.request} call!
  *	just pass it as a @param {lookup}
  */
const dns = require("dns");
const BaseCacheStorage = require("./base-cache-storage");

module.exports = options => {
	this.ttl = options.ttl;
	this.capacity = options.capacity;

	this.storage = options.storageInstance || BaseCacheStorage({
		capacity: this.capacity
	});

	this.lookup = (hostname, options, cb) => {
		let key,
			cacheRecord,
			_resolver;

		options = options || {}
		options.all = true
		options.ttl = true

		key = hostname + '_' + (options.family || 4);
		cacheRecord = this.storage.get(key);
		if (cacheRecord && cacheRecord.ttl >= Date.now()) {
			cb(null, cacheRecord.address, cacheRecord.family);
			return;
		}

		if (cacheRecord) {
			this.storage.update(key, {
				ttl: Date.now() + cacheRecord.ttl
			});
			cb(null, cacheRecord.address, cacheRecord.family);
			return;
		}

		/**
		 * TODO: change address family parser
		 * 		 use resolverAll in case of 
		 * 		 undefined family
		 */
		switch (options.family) {
			case '4':
				_resolver = dns.resolve4
				break;
			case '6':
				_resolver = dns.resolve6
				break;
			default:
				options.family = 4;
				_resolver = dns.resolve4
				break;
		}
		/**
		 * Use resolve instead of lookup because it
		 * supports ttl and not blocking thread
		 */
		_resolver(hostname, {ttl: true}, (err, results) => {
			if (err) return cb(_modifyDnsError(err))

			const records = results.map(result => {
				return {
					address: result.address,
					ttl: Date.now() + result.ttl + 100000,
					family: options.family
				}
			})
			this.storage.set(key, records);
			let record = this.storage.get(key);
			cb(null, record.address, record.family)
		})
	}

	/**
	 * Temporary error modifier
	 */
	_modifyDnsError = (err, hostname) => {
		err.message = `getaddrinfo ${dns.NOTFOUND} : ${hostname}`
		return err;
	}

	return this;
}
