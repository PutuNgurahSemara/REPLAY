// Jalankan: node src/lib/lrc.test.mjs
import assert from 'node:assert/strict';
import { parseLrc, currentLine, cleanTitle, lrclibQueries, bestMatch } from './lrc.js';

assert.deepEqual(parseLrc('[00:01.00]halo\n[00:02.50]halo\n[00:03.00][01:00.00]dunia\n[00:04.00]'),
  [[1, 'halo'], [3, 'dunia'], [4, ''], [60, 'dunia']]);
assert.deepEqual(parseLrc('[00:01.20]a b\n[00:01.20]c'), [[1.2, 'a b c']]);
assert.equal(currentLine([[1, 'a'], [3, 'b']], 0.5), -1);
assert.equal(currentLine([[1, 'a'], [3, 'b']], 3.2), 1);
assert.equal(cleanTitle('Artis - Lagu (Official Music Video) [4K]'), 'Artis - Lagu');
assert.deepEqual(lrclibQueries('Arknights EP - Undertopia').at(-1), { q: 'Undertopia' });
const rs = [{ syncedLyrics: 'a', duration: 236 }, { syncedLyrics: 'b', duration: 244 }, { syncedLyrics: null, duration: 243 }];
assert.equal(bestMatch(rs, 243.5).syncedLyrics, 'b');
assert.equal(bestMatch(rs, 300), null);
console.log('lrc test OK');
