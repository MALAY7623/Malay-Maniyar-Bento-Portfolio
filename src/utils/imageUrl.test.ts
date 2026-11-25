import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractGoogleDriveFileId,
  normalizeImageUrl,
  resolveImageCandidates,
} from './imageUrl';

test('extractGoogleDriveFileId parses share, download, thumbnail, lh3, and malformed query URLs', () => {
  const id = '1TNHf881kvCehLJe6yqZWiRTVq7bGSHRv';

  assert.equal(
    extractGoogleDriveFileId(`https://drive.google.com/uc?export=download&id=${id}?v=3`),
    id,
  );
  assert.equal(
    extractGoogleDriveFileId(`https://drive.google.com/file/d/${id}/view?usp=sharing`),
    id,
  );
  assert.equal(
    extractGoogleDriveFileId(`https://drive.google.com/open?id=${id}`),
    id,
  );
  assert.equal(
    extractGoogleDriveFileId(`https://drive.google.com/thumbnail?id=${id}&sz=w1000`),
    id,
  );
  assert.equal(
    extractGoogleDriveFileId(`https://lh3.googleusercontent.com/d/${id}=w1000`),
    id,
  );
  assert.equal(extractGoogleDriveFileId('/src/assets/images/portrait.jpg'), null);
  assert.equal(extractGoogleDriveFileId('data:image/jpeg;base64,abc123'), null);
});

test('normalizeImageUrl converts Google Drive links and preserves data URLs and local paths', () => {
  const id = '1TNHf881kvCehLJe6yqZWiRTVq7bGSHRv';

  assert.equal(
    normalizeImageUrl(`https://drive.google.com/uc?export=download&id=${id}?v=3`),
    `https://lh3.googleusercontent.com/d/${id}=w1000`,
  );
  assert.equal(
    normalizeImageUrl('https://cdn.example.com/photo.jpg?size=lg?v=2'),
    'https://cdn.example.com/photo.jpg?size=lg&v=2',
  );
  assert.equal(
    normalizeImageUrl('data:image/png;base64,iVBORw0KGgo='),
    'data:image/png;base64,iVBORw0KGgo=',
  );
  assert.equal(
    normalizeImageUrl('/src/assets/images/malay_portrait_bw_1795170070075.jpg'),
    '/src/assets/images/malay_portrait_bw_1795170070075.jpg',
  );
});

test('resolveImageCandidates builds ordered Drive + local fallback chain without duplicates', () => {
  const id = '1TNHf881kvCehLJe6yqZWiRTVq7bGSHRv';
  const fallback = '/src/assets/images/malay_portrait_bw_1795170070075.jpg';

  assert.deepEqual(
    resolveImageCandidates(`https://drive.google.com/uc?export=download&id=${id}?v=3`, fallback),
    [
      `https://lh3.googleusercontent.com/d/${id}=w1000`,
      `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
      fallback,
    ],
  );

  assert.deepEqual(resolveImageCandidates('', fallback), [fallback]);
});
