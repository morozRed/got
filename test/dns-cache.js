import test from 'ava';
import dnsCache from '../source/dns-cache';
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

test.before('setup', async () => {
    dnsCacheInstance = dnsCache({});
});

test.afterEach('clean dns cache', async () => {
    dnsCacheInstance.storage.records.clear();
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
    let cachedRecordsCount = dnsCacheInstance.storage.records.size;
    dnsCacheInstance.lookup(ADDRESSES.EXAMPLE, defaultOptions, (err, address, family) => {
        t.is(dnsCacheInstance.storage.records.size, cachedRecordsCount + 1);
        t.not(dnsCacheInstance.storage.get(`${ADDRESSES.EXAMPLE}_${defaultOptions.family}`), null)
        t.end();
    });
});

test('saves record to cache storage after got request', async t => {
    await got(ADDRESSES.EXAMPLE, {lookup: dnsCacheInstance.lookup});
    let cachedRecordsCount = dnsCacheInstance.storage.records.size;
    t.true(cachedRecordsCount > 0);
    dnsCacheInstance.lookup(ADDRESSES.EXAMPLE, defaultOptions, (err, address, family) => {
        t.is(dnsCacheInstance.storage.records.size, cachedRecordsCount);
        t.not(dnsCacheInstance.storage.get(`${ADDRESSES.EXAMPLE}_${defaultOptions.family}`), null)
    });
});
