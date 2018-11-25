const dns = require('dns');
const net = require('net');
const rr = require('./utils/rr');

const IPv4 = 4;
const IPv6 = 6;

module.exports = options => {
	this.ttl = options.ttl;

	const _storage = options.storage;

	this.lookup = (hostname, options, callback) => {
		let _resolver;

		const matchedFamily = net.isIP(hostname);

		if (matchedFamily) {
			return callback(null, hostname, matchedFamily);
		}

		options = options || {};

		const key = hostname + '_' + (options.family || IPv4);

		_storage.get(key)
			.then(cachedRecords => {
				const cachedRecord = cachedRecords ?
					rr(cachedRecords)() :
					null;

				if (cachedRecord && cachedRecord.ttl >= Date.now()) {
					return callback(null, cachedRecord.address, cachedRecord.family);
				}

				/**
				* In default case resolve both
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
				_resolver(hostname, {ttl: true}, (err, results) => {
					if (err) {
						return callback(err);
					}
					if (results.length === 0) {
						return callback(null);
					}
					const records = results.map(result => {
						return {
							address: result.address,
							ttl: Date.now() + (result.ttl * 1000),
							family: options.family
						};
					});
					_storage.set(key, records);
					return callback(null, records[0].address, records[0].family);
				});
			});
	};

	return this;
};
