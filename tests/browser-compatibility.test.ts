import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { build } from 'vite';
import type { convertToSlack } from '../src/lib/converter.ts';

test('the browser bundle converts tables without native Segmenter or RegExp v support', async () => {
  const result = await build({
    configFile: false,
    publicDir: false,
    logLevel: 'silent',
    build: {
      target: ['firefox114', 'safari16.4'],
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('../src/lib/converter.ts', import.meta.url)),
        name: 'Converter',
        formats: ['iife'],
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunk = outputs.flatMap(output => 'output' in output ? output.output : [])
    .find(output => output.type === 'chunk');
  assert.ok(chunk, 'the build must produce a JavaScript chunk');

  const legacyIntl = {};
  for (const name of Object.getOwnPropertyNames(Intl)) {
    if (name !== 'Segmenter') {
      const descriptor = Object.getOwnPropertyDescriptor(Intl, name);
      assert.ok(descriptor);
      Object.defineProperty(legacyIntl, name, descriptor);
    }
  }
  const legacyRegExp = new Proxy(RegExp, {
    apply(target, thisArg, args) {
      assert.ok(!String(args[1] ?? '').includes('v'), 'RegExp v requires a newer browser');
      return Reflect.apply(target, thisArg, args);
    },
    construct(target, args, newTarget) {
      assert.ok(!String(args[1] ?? '').includes('v'), 'RegExp v requires a newer browser');
      return Reflect.construct(target, args, newTarget);
    },
  });
  // No Node Buffer: also exercise the dependency's browser decoding path.
  const context = vm.createContext({ Intl: legacyIntl, RegExp: legacyRegExp, atob, TextDecoder });
  assert.equal(vm.runInContext('typeof Intl.Segmenter', context), 'undefined');
  assert.throws(() => vm.runInContext('RegExp(".", "v")', context), /RegExp v requires a newer browser/);
  vm.runInContext(chunk.code, context, { timeout: 5_000 });
  const convert: typeof convertToSlack = vm.runInContext('Converter.convertToSlack', context);

  const markdown = '| 名前 | 家族 |\n| --- | --- |\n| 日本語 | 👨‍👩‍👧‍👦 |\n| A | 🇯🇵 |';
  assert.equal(convert(markdown, { tableStyle: 'codeblock', headerStyle: 'simple' }), [
    '```',
    '| 名前   | 家族 |',
    '|--------|------|',
    '| 日本語 | 👨‍👩‍👧‍👦   |',
    '| A      | 🇯🇵   |',
    '```',
  ].join('\n'));
});
