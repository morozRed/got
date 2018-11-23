import test from 'ava';
import dnsCache from '../source/dns-cache';
import got from '../source';
import { hostname } from 'os';

const ADDRESSES = {
    GITHUB: 'www.github.com',
    GOOGLE: 'www.google.com',
    PLAIN_IP: '0.0.0.0',
    INVALID: '.com'
}

const defaultOptions = { family: 4 };

let dnsCacheInstance;

test.before('setup', () => {
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
    got(ADDRESSES.GOOGLE, {
        lookup: dnsCacheInstance.lookup
    }).then(() => {
        t.is(dnsCacheInstance.storage.records.size, cachedRecordsCount + 1);
        t.not(dnsCacheInstance.storage.get(`${hostname}_${defaultOptions.family}`), null)
        t.end();
    });
});