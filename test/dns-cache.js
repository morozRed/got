import net from 'net';
import test from 'ava';
import dnsCache from '../source/dns-cache';
import baseCacheStorage from '../source/base-cache-storage';
import got from '../source';

const ADDRESSES = {
	GOOGLE: 'google.com',
	PLAINIPv4: '0.0.0.0',
	PLAINIPv6: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
	INVALID: '.com'
};

const IPv4FAMILY = 4;
const IPv6FAMILY = 6;

let dnsCacheInstance;
let cacheStorageInstance;

test.before('setup', () => {
	cacheStorageInstance = baseCacheStorage();
	dnsCacheInstance = dnsCache({storage: cacheStorageInstance});
});

test.cb('resolves address to ipv4', t => {
	t.plan(3);
	dnsCacheInstance.lookup(ADDRESSES.GOOGLE, {family: IPv4FAMILY}, (err, address, family) => {
		t.true(address.length > 0);
		t.true(net.isIPv4(address));
		t.true(family === IPv4FAMILY);
		t.end();
	});
});

test.cb('resolves address to ipv6', t => {
	t.plan(3);
	dnsCacheInstance.lookup(ADDRESSES.GOOGLE, {family: IPv6FAMILY}, (err, address, family) => {
		t.true(address.length > 0);
		t.true(net.isIPv6(address));
		t.true(family === IPv6FAMILY);
		t.end();
	});
});

test.cb('resolves ipv4 wihtout lookup', t => {
	t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.PLAINIPv4, {family: IPv4FAMILY}, (err, address, family) => {
		t.true(address === ADDRESSES.PLAINIPv4);
		t.true(family === 4);
		t.end();
	});
});

test.cb('resolves ipv6 wihtout lookup', t => {
	t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.PLAINIPv6, {family: IPv6FAMILY}, (err, address, family) => {
		t.true(address === ADDRESSES.PLAINIPv6);
		t.true(family === 6);
		t.end();
	});
});

test.cb('returns error in case of invalid address [IPv4]', t => {
	t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.INVALID, {family: IPv4FAMILY}, err => {
		t.not(err, null);
		t.regex(err.message, new RegExp(`EBADNAME ${ADDRESSES.INVALID}`));
		t.end();
	});
});

test.cb('returns error in case of invalid address [BOTH]', t => {
	t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.INVALID, null, err => {
		t.not(err, null);
		t.regex(err.message, new RegExp(`EBADNAME ${ADDRESSES.INVALID}`));
		t.end();
	});
});

test.cb('resolves both IPv4 and IPv6 for address', t => {
	t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.GOOGLE, null, (err, address) => {
		t.is(err, null);
		t.true(Boolean(net.isIP(address)));
		t.end();
	});
});

test.cb('saves record to cache storage', t => {
	cacheStorageInstance.clear();
	t.plan(1);
	dnsCacheInstance.lookup(ADDRESSES.GOOGLE, {family: IPv4FAMILY}, async () => {
		const record = await cacheStorageInstance.get(`${ADDRESSES.GOOGLE}_${IPv4FAMILY}`);
		t.not(record, null);
		t.end();
	});
});

test('saves record to cache storage after got request', async t => {
	cacheStorageInstance.clear();
	await got(ADDRESSES.GOOGLE, {storage: cacheStorageInstance});
	t.not(await cacheStorageInstance.get(`${ADDRESSES.GOOGLE}_0`), null);
});

test('returns cached record', async t => {
	cacheStorageInstance.clear();
	await got(ADDRESSES.GOOGLE, {storage: cacheStorageInstance});
	const cachedRecords = await cacheStorageInstance.get(`${ADDRESSES.GOOGLE}_0`);
	t.not(cachedRecords, null);
	dnsCacheInstance.lookup(ADDRESSES.GOOGLE, {}, (err, address) => {
		t.is(err, null);
		t.true(Boolean(cachedRecords.filter(record => record.address === address)));
	});
});

test('returns different cached records using rr', async t => {
	cacheStorageInstance.clear();
	await got(ADDRESSES.GOOGLE, {storage: cacheStorageInstance});
	dnsCacheInstance.lookup(ADDRESSES.GOOGLE, {}, (err, firstAddress) => {
		dnsCacheInstance.lookup(ADDRESSES.GOOGLE, {}, (err, secondAddress) => {
			t.true(firstAddress != secondAddress);
		});
	});
});
