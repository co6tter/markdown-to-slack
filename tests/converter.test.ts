import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convertToSlack, type ConversionOptions } from '../src/lib/converter.ts';
import { getStringWidth } from '../src/lib/string-width.ts';

const codeblock: ConversionOptions = { tableStyle: 'codeblock', headerStyle: 'simple' };
const list: ConversionOptions = { ...codeblock, tableStyle: 'list' };

function table(key: string, value = 'ok'): string {
  return `| Key | Value |\n| --- | --- |\n| ${key} | ${value} |`;
}

test('empty input produces no output', () => {
  assert.equal(convertToSlack('', codeblock), '');
});

test('headings and inline formatting keep their Slack syntax', () => {
  assert.equal(convertToSlack('# Title\n\n**bold** and *italic*', codeblock), '*Title*\n*bold* and _italic_');
  assert.equal(convertToSlack('# Title', { ...codeblock, headerStyle: 'emoji' }), '*1️⃣ Title*');
});

test('codeblock tables retain labelled and reference link destinations', () => {
  for (const markdown of [
    table('[Docs](https://example.com/docs)'),
    table('[Docs][ref]') + '\n\n[ref]: https://example.com/docs',
  ]) {
    assert.ok(convertToSlack(markdown, codeblock).includes('Docs (https://example.com/docs)'));
  }
});

test('codeblock tables do not duplicate bare URLs or autolinks', () => {
  for (const link of ['https://example.com', '<https://example.com>', '[https://example.com](https://example.com)']) {
    const output = convertToSlack(table(link), codeblock);
    assert.equal(output.split('https://example.com').length - 1, 1);
  }
});

test('codeblock tables retain the destination of an empty link label', () => {
  assert.ok(convertToSlack(table('[](https://example.com)'), codeblock).includes('https://example.com'));
});

test('codeblock tables align Japanese text and multi-code-point emoji', () => {
  const markdown = '| 名前 | 家族 |\n| --- | --- |\n| 日本語 | 👨‍👩‍👧‍👦 |\n| A | 🇯🇵 |';
  assert.equal(convertToSlack(markdown, codeblock), [
    '```',
    '| 名前   | 家族 |',
    '|--------|------|',
    '| 日本語 | 👨‍👩‍👧‍👦   |',
    '| A      | 🇯🇵   |',
    '```',
  ].join('\n'));
});

test('codeblock tables apply left, center, and right column alignment', () => {
  const markdown = '| left | center | right |\n| :--- | :---: | ---: |\n| a | b | c |';
  assert.equal(convertToSlack(markdown, codeblock), [
    '```',
    '| left | center | right |',
    '|------|--------|-------|',
    '| a    |   b    |     c |',
    '```',
  ].join('\n'));
});

test('list tables use one bold wrapper for a bold key', () => {
  assert.equal(convertToSlack(table('**Key**'), list), '• *Key*: ok');
});

test('list tables omit the key separator when the key is empty', () => {
  assert.equal(convertToSlack(table(''), list), '• ok');
});

test('header-only list tables retain their column names', () => {
  assert.equal(convertToSlack('| A | B |\n| --- | --- |', list), '• A / B');
});

test('list tables preserve links and formatting in values', () => {
  assert.equal(convertToSlack(table('K', '[Docs](https://example.com) **bold**'), list), '• *K*: <https://example.com|Docs> *bold*');
});

test('multi-column list tables retain the remaining column labels', () => {
  const markdown = '| A | B | C |\n| --- | --- | --- |\n| **K** | v | w |';
  assert.equal(convertToSlack(markdown, list), '• *K*\n　• B: v\n　• C: w');
});

test('display width handles combining text, halfwidth kana, and emoji sequences', () => {
  const cases: [string, number][] = [
    ['', 0],
    ['hello', 5],
    ['日本語', 6],
    ['e\u0301', 1],
    ['ﾊﾟ', 2],
    ['\u1100\u1161', 2],
    ['\u200B', 0],
    ['👨‍👩‍👧‍👦', 2],
    ['🇯🇵', 2],
    ['👍🏽', 2],
    ['1️⃣', 2],
    ['✈️', 2],
  ];
  for (const [text, expected] of cases) {
    assert.equal(getStringWidth(text), expected, JSON.stringify(text));
  }
});
