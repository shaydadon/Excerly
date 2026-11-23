/* Install-banner decisions. The legacy dismiss value "1" is treated as expired. */
(function (global) {
  'use strict';
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  function dismissActive(raw, now) {
    if (raw == null || raw === '' || raw === '1') return false;
    const ts = Number(raw);
    if (!isFinite(ts)) return false;
    return (now - ts) < WEEK;
  }

  function inApp(ua) {
    return /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|Line\/|Telegram|;\s*wv\)|\bwv\b/i.test(String(ua || ''));
  }

  function isIos(ua) {
    return /iphone|ipad|ipod/i.test(String(ua || ''));
  }

  function isAndroidChrome(ua) {
    const s = String(ua || '');
    if (isIos(s) || inApp(s)) return false;
    if (/android/i.test(s)) return true;
    return /chrome|crios|edg\/|opr\/|samsungbrowser/i.test(s);
  }

  function bannerKind(opts) {
    opts = opts || {};
    if (opts.standalone) return 'hidden';
    if (opts.inApp) return 'inapp';
    if (opts.ios) return 'ios';
    if (opts.hasPrompt) return 'prompt';
    if (opts.androidChrome && opts.promptTimedOut) return 'android-manual';
    return 'wait';
  }

  function shouldReloadForController(flag) {
    return flag !== '1';
  }

  global.ExcerlyInstall = {
    WEEK: WEEK,
    dismissActive: dismissActive,
    inApp: inApp,
    isIos: isIos,
    isAndroidChrome: isAndroidChrome,
    bannerKind: bannerKind,
    shouldReloadForController: shouldReloadForController
  };
})(typeof window !== 'undefined' ? window : globalThis);
