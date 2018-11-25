import net from 'net';
import test from 'ava';
import dnsCache from '../source/dns-cache';
import baseCacheStorage from '../source/base-cache-storage';
import got from '../source';

const ADDRESSES = {
	GITHUB: 'www.github.com',
	GOOGLE: 'www.google.com',
	EXAMPLE: 'www.example.com',
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

test.afterEach('clean dns cache', () => {
	cacheStorageInstance.clear();
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

test.cb('returns error in case of invalid address', t => {
	t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.INVALID, {family: IPv4FAMILY}, err => {
		t.not(err, null);
		t.regex(err.message, new RegExp(`EBADNAME ${ADDRESSES.INVALID}`));
		t.end();
	});
});

test.cb('saves record to cache storage', t => {
	t.plan(1);
	dnsCacheInstance.lookup(ADDRESSES.EXAMPLE, {family: IPv4FAMILY}, async () => {
		const record = await cacheStorageInstance.get(`${ADDRESSES.EXAMPLE}_${{family: IPv4FAMILY}.family}`);
		t.not(record, null);
		t.end();
	});
});

test('saves record to cache storage after got request', async t => {
	await got(ADDRESSES.EXAMPLE, {lookup: dnsCacheInstance.lookup});
	t.not(cacheStorageInstance.get(`${ADDRESSES.EXAMPLE}_${{family: IPv4FAMILY}.family}`), null);
});
