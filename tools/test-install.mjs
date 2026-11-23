#!/usr/bin/env node
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { isNonFood } from '../worker/portions.mjs';

const ctx = { window: {} };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../assets/js/install.js', import.meta.url), 'utf8'), ctx);
const I = ctx.ExcerlyInstall;
const WEEK = I.WEEK;
const now = 1_700_000_000_000;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.stack); }
}

test('legacy dismiss "1" is expired so the banner can show again', () => {
  assert.equal(I.dismissActive('1', now), false);
  assert.equal(I.dismissActive(null, now), false);
});

test('a timestamp hides the banner for 7 days and then expires', () => {
  assert.equal(I.dismissActive(String(now - 1000), now), true);
  assert.equal(I.dismissActive(String(now - WEEK + 1000), now), true);
  assert.equal(I.dismissActive(String(now - WEEK - 1), now), false);
});

test('in-app browsers and Android/Chrome are classified', () => {
  assert.equal(I.inApp('Mozilla WhatsApp/2.1'), true);
  assert.equal(I.inApp('Instagram 100.0'), true);
  assert.equal(I.inApp('FBAN/FB4A'), true);
  assert.equal(I.inApp('FBAV/1'), true);
  assert.equal(I.inApp('Line/12'), true);
  assert.equal(I.inApp('Telegram 9'), true);
  assert.equal(I.inApp('Linux; Android 14; wv)'), true);
  assert.equal(I.inApp('Chrome/120'), false);
  assert.equal(I.isIos('iPhone'), true);
  assert.equal(I.isAndroidChrome('Linux; Android 14; Chrome/120'), true);
  assert.equal(I.isAndroidChrome('iPhone'), false);
  assert.equal(I.isAndroidChrome('WhatsApp Android'), false);
});

test('banner kind: standalone hidden, in-app, iOS, prompt, then Android manual', () => {
  assert.equal(I.bannerKind({ standalone: true, inApp: true }), 'hidden');
  assert.equal(I.bannerKind({ inApp: true }), 'inapp');
  assert.equal(I.bannerKind({ ios: true }), 'ios');
  assert.equal(I.bannerKind({ hasPrompt: true, androidChrome: true }), 'prompt');
  assert.equal(I.bannerKind({ androidChrome: true, promptTimedOut: false }), 'wait');
  assert.equal(I.bannerKind({ androidChrome: true, promptTimedOut: true }), 'android-manual');
});

test('controllerchange reloads once', () => {
  assert.equal(I.shouldReloadForController(''), true);
  assert.equal(I.shouldReloadForController('1'), false);
});

test('nikud, bidi marks, thanks-for-watching and תודה רבה לך are non-food', () => {
  assert.equal(isNonFood('\u200fתודה רבה'), true);
  assert.equal(isNonFood('תודה רבה\u200f'), true);
  assert.equal(isNonFood('תּוֹדָה רַבָּה'), true);
  assert.equal(isNonFood('תודה רבה לך'), true);
  assert.equal(isNonFood('Thanks for watching.'), true);
  assert.equal(isNonFood('חביתה'), false);
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('all install tests passed');
