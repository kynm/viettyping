#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'config');
const REPORTS = path.join(ROOT, 'reports');
const STORAGE = path.join(ROOT, 'storage');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stripTags = (s = '') => decodeEntities(s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const decodeEntities = (s = '') => s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const textLength = (s) => [...(s || '')].length;
const normalizeText = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function attrs(tag = '') {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  return result;
}

function elements(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((m) => ({ attrs: attrs(m[1]), html: m[2], text: stripTags(m[2]) }));
}

export function parseHtml(html, pageUrl) {
  const metas = [...html.matchAll(/<meta\b([^>]*)>/gi)].map((m) => attrs(m[1]));
  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({ ...attrs(m[1]), text: stripTags(m[2]) }));
  const images = [...html.matchAll(/<img\b([^>]*)>/gi)].map((m) => attrs(m[1]));
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => ({ attrs: attrs(m[1]), body: m[2].trim() }));
  const title = elements(html, 'title')[0]?.text || '';
  const meta = (name, key = 'name') => metas.find((m) => (m[key] || '').toLowerCase() === name.toLowerCase())?.content || '';
  const linkRel = (rel) => [...html.matchAll(/<link\b([^>]*)>/gi)].map((m) => attrs(m[1])).find((a) => (a.rel || '').toLowerCase().split(/\s+/).includes(rel))?.href || '';
  const headings = { h1: elements(html, 'h1').map((x) => x.text), h2: elements(html, 'h2').map((x) => x.text), h3: elements(html, 'h3').map((x) => x.text) };
  const jsonLd = [];
  const schemaErrors = [];
  for (const script of scripts.filter((s) => (s.attrs.type || '').toLowerCase() === 'application/ld+json')) {
    try { jsonLd.push(JSON.parse(script.body)); } catch (error) { schemaErrors.push(`JSON-LD không hợp lệ: ${error.message}`); }
  }
  const visibleText = stripTags(html.replace(/<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<footer[\s\S]*?<\/footer>/gi, ' '));
  const words = visibleText.match(/[\p{L}\p{N}]+/gu) || [];
  const resolvedLinks = links.map((link) => {
    try { return { url: new URL(link.href || '', pageUrl).href, text: link.text, rel: link.rel || '' }; } catch { return null; }
  }).filter(Boolean);
  const ctaPattern = /(đăng ký|dùng thử|liên hệ|nhận tư vấn|bắt đầu|xem bảng giá|trải nghiệm|demo|mua ngay)/i;
  const faqPattern = /(câu hỏi thường gặp|faq|hỏi đáp)|(^|\s)(ai|gì|nào|không|sao|bao nhiêu)\?/i;
  return {
    title, description: meta('description'), canonical: linkRel('canonical'), headings,
    og: { title: meta('og:title', 'property'), description: meta('og:description', 'property'), image: meta('og:image', 'property') },
    twitter: { card: meta('twitter:card'), title: meta('twitter:title'), description: meta('twitter:description') },
    links: resolvedLinks, images, jsonLd, schemaErrors, visibleText, wordCount: words.length,
    hasCta: links.some((l) => ctaPattern.test(`${l.text} ${l.href || ''}`)) || ctaPattern.test(visibleText),
    hasFaq: faqPattern.test(visibleText),
    resources: {
      css: [...html.matchAll(/<link\b([^>]*)>/gi)].map((m) => attrs(m[1])).filter((a) => (a.rel || '').includes('stylesheet')).length,
      js: scripts.filter((s) => s.attrs.src).length,
      images: images.length
    }
  };
}

function schemaNodes(input) {
  if (Array.isArray(input)) return input.flatMap(schemaNodes);
  if (!input || typeof input !== 'object') return [];
  return [input, ...schemaNodes(input['@graph'] || [])];
}

function schemaTypes(page) {
  return page.parsed.jsonLd.flatMap(schemaNodes).flatMap((node) => Array.isArray(node['@type']) ? node['@type'] : [node['@type']]).filter(Boolean);
}

function validateSchemas(page) {
  const issues = [...page.parsed.schemaErrors];
  const nodes = page.parsed.jsonLd.flatMap(schemaNodes).filter((n) => n['@type']);
  if (!nodes.length) return ['Thiếu JSON-LD'];
  for (const node of nodes) {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    for (const field of ['name', 'description', 'url']) if (!node[field] && !['BreadcrumbList', 'FAQPage'].some((t) => types.includes(t))) issues.push(`${types.join('/')} thiếu ${field}`);
    if (types.includes('Organization') && !node.logo) issues.push('Organization thiếu logo');
    if (types.includes('SoftwareApplication')) for (const field of ['applicationCategory', 'operatingSystem']) if (!node[field]) issues.push(`SoftwareApplication thiếu ${field}`);
    if (types.includes('FAQPage') && !node.mainEntity) issues.push('FAQPage thiếu mainEntity');
  }
  return [...new Set(issues)];
}

function safeUrl(raw, base, config) {
  try {
    const url = new URL(raw, base);
    url.hash = '';
    if (!['http:', 'https:'].includes(url.protocol) || !config.allowedHosts.includes(url.hostname.toLowerCase())) return null;
    const dangerous = `${url.pathname}${url.search}`.toLowerCase();
    if (config.excludePathPatterns.some((p) => dangerous.includes(p.toLowerCase()))) return null;
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    return url.href.replace(/\/$/, url.pathname === '/' ? '/' : '');
  } catch { return null; }
}

class Fetcher {
  constructor(config) { this.config = config; this.lastRequestAt = 0; }
  async get(url, method = 'GET') {
    const wait = Math.max(0, this.config.requestDelayMs - (Date.now() - this.lastRequestAt));
    if (wait) await sleep(wait);
    this.lastRequestAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const start = performance.now();
    try {
      const response = await fetch(url, { method, redirect: 'follow', signal: controller.signal, headers: { 'user-agent': this.config.userAgent, accept: 'text/html,application/xml;q=0.9,*/*;q=0.5' } });
      const body = method === 'HEAD' ? '' : await response.text();
      return { url, finalUrl: response.url, status: response.status, ok: response.ok, headers: Object.fromEntries(response.headers), body, responseMs: Math.round(performance.now() - start), bytes: Buffer.byteLength(body) };
    } catch (error) {
      return { url, finalUrl: url, status: 0, ok: false, headers: {}, body: '', responseMs: Math.round(performance.now() - start), bytes: 0, error: error.name === 'AbortError' ? 'Timeout' : error.message };
    } finally { clearTimeout(timer); }
  }
}

async function sitemapUrls(fetcher, baseUrl, config) {
  const candidates = [new URL('/sitemap.xml', baseUrl).href];
  const robots = await fetcher.get(new URL('/robots.txt', baseUrl).href);
  for (const match of robots.body.matchAll(/^\s*Sitemap:\s*(\S+)/gim)) candidates.push(match[1]);
  const found = new Set();
  const visited = new Set();
  while (candidates.length && visited.size < 20) {
    const sitemap = candidates.shift();
    if (visited.has(sitemap)) continue;
    visited.add(sitemap);
    const response = await fetcher.get(sitemap);
    if (!response.ok || !/(xml|text)/i.test(response.headers['content-type'] || '')) continue;
    for (const match of response.body.matchAll(/<loc[^>]*>([\s\S]*?)<\/loc>/gi)) {
      const value = decodeEntities(match[1].trim());
      if (/\.xml(?:\.gz)?(?:$|\?)/i.test(value)) candidates.push(value);
      else { const url = safeUrl(value, baseUrl, config); if (url) found.add(url); }
    }
  }
  return { urls: [...found], robots, sitemapFound: visited.size > 0 && found.size > 0 };
}

async function crawl(config) {
  const fetcher = new Fetcher(config);
  const discovery = await sitemapUrls(fetcher, config.baseUrl, config);
  const queue = discovery.urls.length ? [...discovery.urls] : [config.baseUrl];
  if (!queue.includes(config.baseUrl)) queue.unshift(config.baseUrl);
  const queued = new Set(queue);
  const pages = [];
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length && pages.length < config.maxUrls) {
      const index = cursor++;
      const url = queue[index];
      if (!url || pages.length >= config.maxUrls) continue;
      const response = await fetcher.get(url);
      const contentType = response.headers['content-type'] || '';
      const parsed = /text\/html|application\/xhtml/i.test(contentType) || /^\s*<!doctype html|^\s*<html/i.test(response.body) ? parseHtml(response.body, response.finalUrl) : parseHtml('', response.finalUrl);
      pages.push({ url, ...response, parsed });
      for (const link of parsed.links) {
        const normalized = safeUrl(link.url, config.baseUrl, config);
        if (normalized && !queued.has(normalized) && queued.size < config.maxUrls * 3) { queued.add(normalized); queue.push(normalized); }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, config.concurrency) }, worker));
  return { pages: pages.slice(0, config.maxUrls), discovery, fetcher };
}

const makeIssue = (severity, group, url, message, suggestion) => ({ severity, group, url, message, suggestion });

async function analyse(crawlResult, config, scoring, keywords, prompts) {
  const { pages, discovery, fetcher } = crawlResult;
  const issues = [];
  const titles = new Map(), descriptions = new Map();
  const pageUrls = new Set(pages.map((p) => p.url));
  const inbound = new Map(pages.map((p) => [p.url, 0]));
  const linkChecks = new Map();
  for (const page of pages) {
    for (const link of page.parsed.links) {
      const target = safeUrl(link.url, config.baseUrl, config);
      if (target && inbound.has(target)) inbound.set(target, inbound.get(target) + 1);
      if (target && !pageUrls.has(target)) linkChecks.set(target, linkChecks.get(target) || []);
      if (target && !pageUrls.has(target)) linkChecks.get(target).push(page.url);
    }
    if (page.parsed.title) (titles.get(page.parsed.title) || titles.set(page.parsed.title, []).get(page.parsed.title)).push(page.url);
    if (page.parsed.description) (descriptions.get(page.parsed.description) || descriptions.set(page.parsed.description, []).get(page.parsed.description)).push(page.url);
  }
  const brokenLinks = [];
  for (const [url, sources] of [...linkChecks].slice(0, 100)) {
    const checked = await fetcher.get(url, 'HEAD');
    if (!checked.ok) { brokenLinks.push({ url, status: checked.status, sources }); issues.push(makeIssue('critical', 'technical', sources[0], `Broken link ${checked.status || checked.error}: ${url}`, 'Sửa hoặc xóa liên kết hỏng.')); }
  }
  for (const page of pages) {
    const p = page.parsed;
    if (page.status !== 200) issues.push(makeIssue('critical', 'technical', page.url, `HTTP status ${page.status || page.error}`, 'Khôi phục URL hoặc chuyển hướng hợp lệ.'));
    if (!p.title) issues.push(makeIssue('critical', 'onpage', page.url, 'Thiếu title', 'Thêm title duy nhất dài 30–60 ký tự.'));
    else if (textLength(p.title) < scoring.thresholds.titleMin || textLength(p.title) > scoring.thresholds.titleMax) issues.push(makeIssue('warning', 'onpage', page.url, `Title dài ${textLength(p.title)} ký tự`, 'Điều chỉnh title về 30–60 ký tự.'));
    if (!p.description) issues.push(makeIssue('critical', 'onpage', page.url, 'Thiếu meta description', 'Thêm description duy nhất dài 120–160 ký tự.'));
    else if (textLength(p.description) < scoring.thresholds.descriptionMin || textLength(p.description) > scoring.thresholds.descriptionMax) issues.push(makeIssue('warning', 'onpage', page.url, `Description dài ${textLength(p.description)} ký tự`, 'Điều chỉnh description về 120–160 ký tự.'));
    if (p.headings.h1.length !== 1) issues.push(makeIssue('warning', 'onpage', page.url, `Có ${p.headings.h1.length} thẻ H1`, 'Mỗi trang nên có đúng một H1.'));
    if (p.headings.h1.length && !p.headings.h2.length) issues.push(makeIssue('notice', 'onpage', page.url, 'Không có H2', 'Chia nội dung thành các mục H2/H3 rõ ràng.'));
    if (!p.canonical) issues.push(makeIssue('warning', 'technical', page.url, 'Thiếu canonical', 'Thêm canonical tự tham chiếu hợp lệ.'));
    if (!p.og.title || !p.og.description || !p.og.image) issues.push(makeIssue('notice', 'onpage', page.url, 'OpenGraph chưa đầy đủ', 'Bổ sung og:title, og:description và og:image.'));
    if (!p.twitter.card) issues.push(makeIssue('notice', 'onpage', page.url, 'Thiếu Twitter Card', 'Bổ sung twitter:card và metadata liên quan.'));
    const missingAlt = p.images.filter((img) => !String(img.alt || '').trim()).length;
    if (missingAlt) issues.push(makeIssue('warning', 'onpage', page.url, `${missingAlt} ảnh thiếu alt`, 'Thêm alt mô tả đúng ngữ cảnh.'));
    if (p.wordCount < scoring.thresholds.thinContentWords && config.mainLandingPaths.includes(new URL(page.url).pathname.replace(/\/$/, '') || '/')) issues.push(makeIssue('warning', 'content', page.url, `Nội dung mỏng: ${p.wordCount} từ`, 'Mở rộng nội dung landing page lên khoảng 800 từ hữu ích.'));
    if (!p.hasCta) issues.push(makeIssue('warning', 'content', page.url, 'Thiếu CTA rõ ràng', 'Thêm CTA phù hợp như dùng thử, liên hệ hoặc xem bảng giá.'));
    for (const message of validateSchemas(page)) issues.push(makeIssue(message.includes('không hợp lệ') ? 'critical' : 'warning', 'schema', page.url, message, 'Sửa JSON-LD và các trường bắt buộc theo loại trang.'));
    if (page.responseMs > scoring.thresholds.goodResponseMs) issues.push(makeIssue('warning', 'technical', page.url, `Phản hồi chậm: ${page.responseMs} ms`, 'Tối ưu cache, máy chủ và tài nguyên chặn hiển thị.'));
    if (page.headers['content-encoding'] === undefined && page.bytes > 50_000) issues.push(makeIssue('notice', 'performance', page.url, 'HTML lớn chưa thấy gzip/brotli', 'Bật nén gzip hoặc Brotli trên máy chủ.'));
    if (page.url !== config.baseUrl && (inbound.get(page.url) || 0) === 0) issues.push(makeIssue('warning', 'content', page.url, 'Trang orphan trong phạm vi crawl', 'Thêm internal link từ trang liên quan.'));
  }
  for (const [title, urls] of titles) if (urls.length > 1) for (const url of urls) issues.push(makeIssue('warning', 'onpage', url, `Title trùng trên ${urls.length} trang: ${title}`, 'Viết title riêng cho từng ý định tìm kiếm.'));
  for (const [description, urls] of descriptions) if (urls.length > 1) for (const url of urls) issues.push(makeIssue('warning', 'onpage', url, `Description trùng trên ${urls.length} trang`, 'Viết description riêng cho từng trang.'));

  const keywordResults = keywords.map((keyword) => {
    const needle = normalizeText(keyword);
    const ranked = pages.map((page) => {
      const p = page.parsed; const title = normalizeText(p.title), desc = normalizeText(p.description), h1 = normalizeText(p.headings.h1.join(' ')), body = normalizeText(p.visibleText);
      const occurrences = body.split(needle).length - 1;
      const score = (title.includes(needle) ? 4 : 0) + (h1.includes(needle) ? 3 : 0) + (desc.includes(needle) ? 2 : 0) + Math.min(2, occurrences);
      return { page, score, title: title.includes(needle), meta: desc.includes(needle), h1: h1.includes(needle), occurrences };
    }).sort((a, b) => b.score - a.score)[0];
    const matched = ranked && ranked.score >= 3;
    return { keyword, landingPage: matched ? ranked.page.url : null, title: matched && ranked.title, meta: matched && ranked.meta, h1: matched && ranked.h1, occurrences: matched ? ranked.occurrences : 0, status: matched ? 'covered' : 'content-gap' };
  });
  for (const gap of keywordResults.filter((k) => k.status === 'content-gap')) issues.push(makeIssue('notice', 'content', config.baseUrl, `Content Gap: ${gap.keyword}`, 'Tạo hoặc tối ưu landing page đúng ý định tìm kiếm.'));
  const allText = normalizeText(pages.map((p) => p.parsed.visibleText).join(' '));
  const urlText = normalizeText(pages.map((p) => p.url).join(' '));
  const allTypes = new Set(pages.flatMap(schemaTypes));
  const aiChecks = {
    directDefinition: /easycheck (la|giup|cung cap)/.test(allText),
    faq: pages.some((p) => p.parsed.hasFaq), faqSchema: allTypes.has('FAQPage'),
    pricing: /(bang gia|pricing|chi phi)/.test(`${allText} ${urlText}`),
    services: /(dich vu|tinh nang|feature)/.test(`${allText} ${urlText}`),
    comparison: /(excel|google sheet)/.test(allText),
    brandConsistency: pages.filter((p) => /easycheck/i.test(`${p.parsed.title} ${p.parsed.visibleText}`)).length >= Math.max(1, Math.ceil(pages.length * 0.7)),
    contact: /(lien he|contact|tu van)/.test(`${allText} ${urlText}`), structuredData: allTypes.size > 0
  };
  const aiPromptResults = prompts.map((prompt) => ({ prompt, ready: normalizeText(prompt).split(' ').filter((w) => w.length > 3).filter((w) => allText.includes(w)).length >= 2 }));
  const checks = {
    technical: [config.baseUrl.startsWith('https://'), discovery.robots.ok, discovery.sitemapFound, pages.every((p) => !!p.parsed.canonical), pages.every((p) => p.status === 200), brokenLinks.length === 0, pages.every((p) => p.responseMs <= scoring.thresholds.goodResponseMs)],
    onpage: [pages.every((p) => textLength(p.parsed.title) >= 30 && textLength(p.parsed.title) <= 60), pages.every((p) => textLength(p.parsed.description) >= 120 && textLength(p.parsed.description) <= 160), [...titles.values()].every((v) => v.length === 1), [...descriptions.values()].every((v) => v.length === 1), pages.every((p) => p.parsed.headings.h1.length === 1), pages.every((p) => p.parsed.headings.h2.length > 0), pages.every((p) => p.parsed.images.every((i) => String(i.alt || '').trim()))],
    content: [pages.filter((p) => config.mainLandingPaths.includes(new URL(p.url).pathname.replace(/\/$/, '') || '/')).every((p) => p.parsed.wordCount >= scoring.thresholds.thinContentWords), keywordResults.some((k) => k.status === 'covered'), keywordResults.filter((k) => k.status === 'covered').length >= 3, pages.some((p) => p.parsed.hasFaq), pages.every((p) => p.parsed.hasCta), pages.every((p) => p.parsed.links.some((l) => safeUrl(l.url, config.baseUrl, config)))],
    schema: [allTypes.has('Organization'), allTypes.has('SoftwareApplication'), allTypes.has('FAQPage'), allTypes.has('BreadcrumbList'), allTypes.has('Article') || !pages.some((p) => /blog|tin-tuc|bai-viet/.test(p.url)), allTypes.has('Product') || allTypes.has('Offer') || !aiChecks.pricing],
    aiReadiness: Object.values(aiChecks)
  };
  const groupScores = Object.fromEntries(Object.entries(checks).map(([group, values]) => [group, Math.round(scoring[group] * values.filter(Boolean).length / values.length * 10) / 10]));
  const totalScore = Math.round(Object.values(groupScores).reduce((a, b) => a + b, 0));
  const pageScores = pages.map((page) => ({
    url: page.url,
    score: Math.max(0, 100 - issues.filter((i) => i.url === page.url).reduce((n, i) => n + ({ critical: 12, warning: 5, notice: 2 }[i.severity] || 0), 0)),
    status: page.status,
    responseMs: page.responseMs,
    htmlBytes: page.bytes,
    compressed: !!page.headers['content-encoding'],
    estimatedRequests: page.parsed.resources.css + page.parsed.resources.js + page.parsed.resources.images + 1,
    resources: page.parsed.resources,
    words: page.parsed.wordCount
  }));
  return { totalScore, groupScores, checks, pages, pageScores, issues, brokenLinks, keywordResults, aiChecks, aiPromptResults, schemaTypes: [...allTypes], robots: { found: discovery.robots.ok, status: discovery.robots.status }, sitemapFound: discovery.sitemapFound };
}

function reportHtml(report, history) {
  const data = JSON.stringify({ history: history.map((h) => ({ date: h.date, score: h.total_score })) }).replace(/</g, '\\u003c');
  const rows = report.issues.map((i) => `<tr data-severity="${esc(i.severity)}" data-group="${esc(i.group)}"><td><span class="badge ${esc(i.severity)}">${esc(i.severity)}</span></td><td>${esc(i.group)}</td><td><a href="${esc(i.url)}">${esc(i.url)}</a></td><td>${esc(i.message)}</td><td>${esc(i.suggestion)}</td></tr>`).join('');
  const scoreCards = Object.entries(report.groupScores).map(([k, v]) => `<div class="card"><span>${esc(k)}</span><strong>${v}</strong></div>`).join('');
  const urlRows = [...report.pageScores].sort((a, b) => a.score - b.score).map((p) => `<tr><td><a href="${esc(p.url)}">${esc(p.url)}</a></td><td>${p.score}</td><td>${p.status}</td><td>${p.responseMs} ms</td><td>${p.words}</td></tr>`).join('');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EasyCheck SEO Audit</title><style>
  :root{color-scheme:light;--ink:#17211b;--muted:#66736b;--line:#dfe6e1;--bg:#f4f7f5;--accent:#176b46}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 system-ui,sans-serif}.wrap{max-width:1440px;margin:auto;padding:32px}.hero{display:flex;justify-content:space-between;align-items:end;padding:32px;background:#153c2b;color:white;border-radius:16px}.score{font-size:72px;line-height:1;font-weight:800}.muted{color:#b8cbc0}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:16px 0}.card{background:white;border:1px solid var(--line);border-radius:12px;padding:18px}.card span{display:block;color:var(--muted);text-transform:capitalize}.card strong{font-size:28px}section{background:white;border:1px solid var(--line);border-radius:12px;margin:16px 0;padding:20px;overflow:auto}canvas{width:100%;height:180px}.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}button,.download{border:1px solid var(--line);background:white;color:var(--ink);padding:8px 12px;border-radius:8px;cursor:pointer;text-decoration:none}button.active{background:var(--accent);color:white}table{border-collapse:collapse;width:100%}th,td{text-align:left;vertical-align:top;border-bottom:1px solid var(--line);padding:10px}th{color:var(--muted)}a{color:var(--accent)}.badge{padding:3px 7px;border-radius:99px;font-size:11px;text-transform:uppercase}.critical{background:#fee2e2;color:#991b1b}.warning{background:#fef3c7;color:#92400e}.notice{background:#dbeafe;color:#1e40af}@media(max-width:800px){.grid{grid-template-columns:1fr 1fr}.wrap{padding:12px}.hero{align-items:start;flex-direction:column}.score{font-size:52px}}
  </style></head><body><main class="wrap"><header class="hero"><div><div class="muted">EASYCHECK · SEO HEALTH</div><div class="score">${report.totalScore}<small>/100</small></div></div><div><div>Chạy lúc ${esc(report.generatedAt)}</div><div>${report.summary.checkedUrls} URL · ${report.summary.critical} critical · ${report.summary.warning} warning</div><br><a class="download" href="latest.json" download>Tải JSON</a></div></header><div class="grid">${scoreCards}</div>
  <section><h2>Lịch sử điểm</h2><canvas id="chart" width="1200" height="180"></canvas></section>
  <section><h2>Lỗi và đề xuất</h2><div class="filters"><button class="active" data-filter="all">Tất cả</button><button data-filter="critical">Critical</button><button data-filter="warning">Warning</button><button data-filter="notice">Notice</button>${[...new Set(report.issues.map((i) => i.group))].map((g) => `<button data-filter="${esc(g)}">${esc(g)}</button>`).join('')}</div><table><thead><tr><th>Mức độ</th><th>Nhóm</th><th>URL</th><th>Vấn đề</th><th>Việc cần làm</th></tr></thead><tbody id="issues">${rows || '<tr><td colspan="5">Không phát hiện lỗi.</td></tr>'}</tbody></table></section>
  <section><h2>URL cần xử lý</h2><table><thead><tr><th>URL</th><th>Điểm</th><th>Status</th><th>TTFB</th><th>Số từ</th></tr></thead><tbody>${urlRows}</tbody></table></section>
  <section><h2>Checklist ưu tiên</h2><ol>${report.issues.slice(0,10).map((i) => `<li><strong>${esc(i.message)}</strong> — ${esc(i.suggestion)}</li>`).join('') || '<li>Tiếp tục duy trì và theo dõi định kỳ.</li>'}</ol></section>
  </main><script>const DATA=${data};document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('#issues tr').forEach(r=>r.hidden=b.dataset.filter!=='all'&&r.dataset.severity!==b.dataset.filter&&r.dataset.group!==b.dataset.filter)});const c=document.getElementById('chart'),x=c.getContext('2d'),d=DATA.history;x.clearRect(0,0,c.width,c.height);x.strokeStyle='#dfe6e1';for(let i=0;i<5;i++){x.beginPath();x.moveTo(30,10+i*38);x.lineTo(c.width-20,10+i*38);x.stroke()}if(d.length){x.strokeStyle='#176b46';x.lineWidth=3;x.beginPath();d.forEach((p,i)=>{const px=30+i*(c.width-60)/Math.max(1,d.length-1),py=170-p.score*1.55;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}</script></body></html>`;
}

async function loadJson(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
async function optionalJson(file, fallback) { try { return await loadJson(file); } catch { return fallback; } }
async function appendLog(message) { await fs.mkdir(STORAGE, { recursive: true }); await fs.appendFile(path.join(STORAGE, 'audit.log'), `${new Date().toISOString()} ${message}\n`, 'utf8'); }

async function notifyTelegram(report, previousHistory, previousReport) {
  const config = await optionalJson(path.join(CONFIG, 'telegram.json'), { enabled: false });
  if (!config.enabled || !config.botToken || !config.chatId) return false;
  const previousBroken = new Set((previousReport?.brokenLinks || []).map((item) => item.url));
  const previousGaps = new Set((previousReport?.contentGaps || []).map((item) => item.keyword));
  const previousSchemaErrors = new Set((previousReport?.issues || []).filter((item) => item.group === 'schema').map((item) => `${item.url}|${item.message}`));
  const newBroken = report.brokenLinks.filter((item) => !previousBroken.has(item.url));
  const newGaps = report.contentGaps.filter((item) => !previousGaps.has(item.keyword));
  const newSchemaErrors = report.issues.filter((item) => item.group === 'schema' && !previousSchemaErrors.has(`${item.url}|${item.message}`));
  const newCritical = report.summary.critical > (previousHistory?.critical_count || 0);
  const scoreDrop = previousHistory && previousHistory.total_score - report.totalScore >= 10;
  const shouldSend = report.totalScore < 70 || newCritical || scoreDrop || newBroken.length || newGaps.length || newSchemaErrors.length;
  if (!shouldSend) return false;
  const text = [`🚨 EasyCheck SEO Audit`, `Điểm: ${report.totalScore}/100${previousHistory ? ` (trước: ${previousHistory.total_score})` : ''}`, `Critical: ${report.summary.critical}`, `Warning: ${report.summary.warning}`, `Broken links mới: ${newBroken.length}`, `Schema lỗi mới: ${newSchemaErrors.length}`, `Content gap mới: ${newGaps.length}`].join('\n');
  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: config.chatId, text }) });
  if (!response.ok) throw new Error(`Telegram API: HTTP ${response.status}`);
  return true;
}

async function main() {
  await Promise.all([fs.mkdir(REPORTS, { recursive: true }), fs.mkdir(STORAGE, { recursive: true })]);
  const [site, scoring, keywords, prompts, history, previousReport] = await Promise.all([
    loadJson(path.join(CONFIG, 'site.json')), loadJson(path.join(CONFIG, 'scoring.json')), loadJson(path.join(CONFIG, 'keywords.json')), loadJson(path.join(CONFIG, 'ai-prompts.json')), optionalJson(path.join(STORAGE, 'history.json'), []), optionalJson(path.join(REPORTS, 'latest.json'), null)
  ]);
  const args = Object.fromEntries(process.argv.slice(2).map((arg, i, all) => arg.startsWith('--') ? [arg.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true] : null).filter(Boolean));
  if (args['max-urls']) site.maxUrls = Math.min(Number(args['max-urls']) || site.maxUrls, 1000);
  if (args['base-url']) {
    const requested = new URL(args['base-url']);
    if (!site.allowedHosts.includes(requested.hostname.toLowerCase())) throw new Error(`Domain không nằm trong whitelist: ${requested.hostname}`);
    site.baseUrl = requested.href;
  }
  site.concurrency = Math.min(3, Math.max(1, site.concurrency || 1));
  console.log(`Auditing ${site.baseUrl} (max ${site.maxUrls} URLs, concurrency ${site.concurrency})`);
  const result = await analyse(await crawl(site), site, scoring, keywords, prompts);
  const now = new Date();
  const generatedAt = now.toISOString();
  const entry = { date: generatedAt, total_score: result.totalScore, technical_score: result.groupScores.technical, onpage_score: result.groupScores.onpage, content_score: result.groupScores.content, schema_score: result.groupScores.schema, ai_readiness_score: result.groupScores.aiReadiness, checked_urls: result.pages.length, critical_count: result.issues.filter((i) => i.severity === 'critical').length, warning_count: result.issues.filter((i) => i.severity === 'warning').length, notice_count: result.issues.filter((i) => i.severity === 'notice').length };
  const updatedHistory = [...history, entry].slice(-365);
  const report = { generatedAt, target: site.baseUrl, totalScore: result.totalScore, groupScores: result.groupScores, summary: { checkedUrls: result.pages.length, critical: entry.critical_count, warning: entry.warning_count, notice: entry.notice_count }, urls: result.pages.map((p) => p.url), pageScores: result.pageScores, topUrls: [...result.pageScores].sort((a,b) => b.score-a.score).slice(0,10), priorityUrls: [...result.pageScores].sort((a,b) => a.score-b.score).slice(0,10), issues: result.issues, brokenLinks: result.brokenLinks, missingSchema: result.pages.filter((p) => !p.parsed.jsonLd.length).map((p) => p.url), missingMeta: result.pages.filter((p) => !p.parsed.title || !p.parsed.description).map((p) => p.url), thinContent: result.pages.filter((p) => p.parsed.wordCount < scoring.thresholds.thinContentWords).map((p) => ({ url: p.url, words: p.parsed.wordCount })), missingCta: result.pages.filter((p) => !p.parsed.hasCta).map((p) => p.url), contentGaps: result.keywordResults.filter((k) => k.status === 'content-gap'), keywords: result.keywordResults, aiReadiness: { checks: result.aiChecks, prompts: result.aiPromptResults }, detectedSchemaTypes: result.schemaTypes, infrastructure: { robots: result.robots, sitemapFound: result.sitemapFound }, history: updatedHistory };
  const day = generatedAt.slice(0, 10);
  const json = JSON.stringify(report, null, 2);
  const html = reportHtml(report, updatedHistory);
  await Promise.all([fs.writeFile(path.join(REPORTS, `${day}-seo-audit.json`), json), fs.writeFile(path.join(REPORTS, `${day}-seo-audit.html`), html), fs.writeFile(path.join(REPORTS, 'latest.json'), json), fs.writeFile(path.join(REPORTS, 'latest.html'), html), fs.writeFile(path.join(STORAGE, 'history.json'), JSON.stringify(updatedHistory, null, 2))]);
  let telegram = false;
  try { telegram = await notifyTelegram(report, history.at(-1), previousReport); } catch (error) { await appendLog(`Telegram error: ${error.message}`); }
  await appendLog(`Completed score=${report.totalScore} urls=${report.summary.checkedUrls} critical=${report.summary.critical} telegram=${telegram}`);
  console.log(`Completed: ${report.totalScore}/100, ${report.summary.checkedUrls} URLs. Report: ${path.join(REPORTS, 'latest.html')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(async (error) => { console.error(error.stack || error); await appendLog(`Failed: ${error.message}`).catch(() => {}); process.exitCode = 1; });
