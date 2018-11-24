import test from 'ava';
import dnsCache from '../source/dns-cache';
import baseCacheStorage from '../source/base-cache-storage';
import got from '../source';
import { hostname } from 'os';

const ADDRESSES = {
    GITHUB: 'www.github.com',
    GOOGLE: 'www.google.com',
    EXAMPLE: 'www.example.com',
    PLAIN_IPv4: '0.0.0.0',
    PLAIN_IPv6: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    INVALID: '.com'
}

const defaultOptions = { family: 4 };

let dnsCacheInstance;
let cacheStorageInstance;

test.before('setup', async () => {
    cacheStorageInstance = baseCacheStorage();
    dnsCacheInstance = dnsCache({storage: cacheStorageInstance});
});

test.afterEach('clean dns cache', async () => {
    cacheStorageInstance.clear();
})

test.cb('resolves address to ip', t => {
    t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.GITHUB, defaultOptions, (err, address, family) => {
        t.true(address.length > 0);
        t.true(family === 4);
        t.end();
    });
});

test.cb('resolves ipv4 wihtout lookup', t => {
    t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.PLAIN_IPv4, defaultOptions, (err, address, family) => {
        t.true(address === ADDRESSES.PLAIN_IPv4);
        t.true(family === 4);
        t.end();
    });
});

test.cb('resolves ipv6 wihtout lookup', t => {
    t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.PLAIN_IPv6, defaultOptions, (err, address, family) => {
        t.true(address === ADDRESSES.PLAIN_IPv6);
        t.true(family === 6);
        t.end();
    });
});

test.cb('returns error in case of invalid address', t => {
    t.plan(2);
	dnsCacheInstance.lookup(ADDRESSES.INVALID, defaultOptions, (err, address, family) => {
        t.not(err, null);
        t.regex(err.message, new RegExp(`EBADNAME ${ADDRESSES.INVALID}`));
        t.end();
    });
});

test.cb('saves record to cache storage', t => {
    t.plan(1);
    dnsCacheInstance.lookup(ADDRESSES.EXAMPLE, defaultOptions, async (err, address, family) => {
        let record = await cacheStorageInstance.get(`${ADDRESSES.EXAMPLE}_${defaultOptions.family}`);
        t.not(record, null)
        t.end();
    });
});

test('saves record to cache storage after got request', async t => {
    await got(ADDRESSES.EXAMPLE, {lookup: dnsCacheInstance.lookup});
    dnsCacheInstance.lookup(ADDRESSES.EXAMPLE, defaultOptions, (err, address, family) => {
        t.not(cacheStorageInstance.get(`${ADDRESSES.EXAMPLE}_${defaultOptions.family}`), null)
    });
});
