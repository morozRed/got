import test from 'ava';
import got from '../source';

test('dns cached after request', async t => {
    let storageSizeBefore = got.dnscache.storage.getAll().length;
    await got("https://www.google.com");
    let storageSizeAfter = got.dnscache.storage.getAll().length;
    t.truthy(storageSizeAfter > storageSizeBefore)
});
