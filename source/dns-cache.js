const dns = require('dns');
const net = require('net');
const util = require('util');
const rr = require('rr');

dns.resolve4 = util.promisify(dns.resolve4);
dns.resolve6 = util.promisify(dns.resolve6);

const IPv4 = 4;
const IPv6 = 6;

module.exports = options => {
	this.ttl = options.ttl || false;

	const _storage = options.storage;
	
	this.lookup = (hostname, options, callback) => {
		const matchedFamily = net.isIP(hostname);

		if (matchedFamily) {
			return callback(null, hostname, matchedFamily);
		}

		options = options || {};
		options = {...options, ttl: true};

		const key = hostname + '_' + (options.family || '0');

		const _resolve = (hostname, options, cb) => {
			const _resolver = options.family === IPv4 ? dns.resolve4 : dns.resolve6;
			_resolver(hostname, options)
				.then(addresses => {
					return cb(null, addresses);
				}).catch(error => {
					return cb(error);
				});
		};

		/**
		 * Some hostnames are not resolvable
		 * with IPv6 addresses so we should
		 * return only IPv4
		 */
		const _resolveBoth = (hostname, options, cb) => {
			dns.resolve4(hostname, options)
				.then(ipv4records => {
					dns.resolve6(hostname, options)
						.then(ipv6records => {
							const records = ipv4records.concat(ipv6records);
							return cb(null, records);
						})
						.catch(ipv6err => {
							if (ipv6err.code === dns.NODATA) {
								return cb(null, ipv4records);
							}
							return cb(ipv6err);
						});
				})
				.catch(ipv4err => {
					return cb(ipv4err);
				});
		};

		const _onResolve = (err, results) => {
			if (err || results.length === 0) {
				return callback(err);
			}
			const records = results.map(result => {
				const family = net.isIP(result.address);
				return {
					address: result.address,
					ttl: Date.now() + ((this.ttl || result.ttl) * 1000),
					family
				};
			});
			_storage.set(key, records).then(() => {
				return callback(null, records[0].address, records[0].family);
			});
		};

		_storage.get(key)
			.then(cachedRecords => {
				const cachedRecord = cachedRecords ?
					rr(cachedRecords) :
					null;
				if (cachedRecord && cachedRecord.ttl >= Date.now()) {
					return callback(null, cachedRecord.address, cachedRecord.family);
				}
				switch (options.family) {
					case IPv4:
					case IPv6:
						_resolve(hostname, options, _onResolve);
						break;
					default:
						_resolveBoth(hostname, options, _onResolve);
						break;
				}
			});
	};

	return this;
};
