#!/usr/bin/env node
/* A push that started before a delete must not clear the dirty flag, or the next open restores the meal. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const store = {};
const localStorage = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; },
  key(i) { return Object.keys(store)[i] || null; },
  get length() { return Object.keys(store).length; }
};
const session = {};
const ctx = {
  window: {},
  localStorage,
  sessionStorage: {
    getItem(k) { return session[k] || null; },
    setItem(k, v) { session[k] = String(v); },
    removeItem(k) { delete session[k]; }
  },
  document: {
    addEventListener() {},
    querySelector() { return null; }
  },
  setTimeout() { return 0; },
  clearTimeout() {}
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../assets/js/cloud.js', import.meta.url), 'utf8'), ctx);

const cloud = ctx.ExcerlyCloud;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.stack); }
}

test('a delete during an in-flight push stays dirty so startup will not restore the server copy', () => {
  localStorage.setItem('excerly.meals', JSON.stringify({ '2026-11-23': [{ id: 'm', name: 'תודה רבה', grams: 150, kcal: 270 }] }));
  const pushedRev = cloud.revision();
  localStorage.setItem('excerly.meals', JSON.stringify({}));
  assert.equal(cloud.finishPush(pushedRev), 'kept-dirty');
  assert.equal(cloud.isDirty(), true);
  assert.equal(cloud.startupAction({
    hasServer: true, sessionStamp: null, serverStamp: 'server-still-has-meal', dirty: cloud.isDirty()
  }), 'push');
});

test('a refresh in the same tab skips the pull, which is why the meal looks gone until the app is closed', () => {
  assert.equal(cloud.startupAction({
    hasServer: true, sessionStamp: 't1', serverStamp: 't1', dirty: false
  }), 'skip');
});

test('reopen with a clean dirty flag and a newer-looking server row applies that row', () => {
  assert.equal(cloud.startupAction({
    hasServer: true, sessionStamp: null, serverStamp: 't1', dirty: false
  }), 'apply-server');
});

test('a push that includes the delete clears the dirty flag', () => {
  const rev = cloud.revision();
  assert.equal(cloud.finishPush(rev), 'cleared');
  assert.equal(cloud.isDirty(), false);
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('all cloud-sync tests passed');
