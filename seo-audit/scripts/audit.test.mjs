import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHtml } from './audit.mjs';

test('parseHtml extracts SEO fields, links, images and schema', () => {
  const html = `<!doctype html><html><head>
    <title>Phần mềm quản lý trung tâm EasyCheck</title>
    <meta name="description" content="Mô tả EasyCheck">
    <meta property="og:title" content="EasyCheck">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="https://easycheck.io.vn/">
    <script type="application/ld+json">{"@type":"Organization","name":"EasyCheck","description":"A","url":"https://easycheck.io.vn","logo":"logo.png"}</script>
  </head><body><h1>EasyCheck là gì?</h1><h2>Tính năng</h2><a href="/bang-gia">Xem bảng giá</a><img src="a.png" alt="Giao diện"><p>Câu hỏi thường gặp?</p></body></html>`;
  const parsed = parseHtml(html, 'https://easycheck.io.vn/');
  assert.equal(parsed.title, 'Phần mềm quản lý trung tâm EasyCheck');
  assert.equal(parsed.description, 'Mô tả EasyCheck');
  assert.equal(parsed.canonical, 'https://easycheck.io.vn/');
  assert.deepEqual(parsed.headings.h1, ['EasyCheck là gì?']);
  assert.equal(parsed.links[0].url, 'https://easycheck.io.vn/bang-gia');
  assert.equal(parsed.hasCta, true);
  assert.equal(parsed.hasFaq, true);
  assert.equal(parsed.jsonLd[0]['@type'], 'Organization');
});

test('parseHtml reports invalid JSON-LD and missing image alt', () => {
  const parsed = parseHtml('<script type="application/ld+json">{bad}</script><img src="x">', 'https://easycheck.io.vn/');
  assert.equal(parsed.schemaErrors.length, 1);
  assert.equal(parsed.images[0].alt, undefined);
});
