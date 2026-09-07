# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hebrew- and English-speaking people doing light fitness and stretching **at home**,
primarily on a phone. They want a quick, guided daily stretching habit plus simple
self-tracking (calendar, reminders, BMI/calories, food log) without signing up for
anything. _[Inferred audience detail — intent (personal use vs. public product vs.
portfolio) not yet confirmed by the user; the AI proxy "works for everyone who
enters the site" suggests a publicly usable app.]_

## Product Purpose

Excerly ("יומן כושר ביתי" — home fitness journal) is an installable PWA that makes a
**daily stretching habit** easy: animated per-exercise guidance, a monthly workout
calendar, a weekly focus plan, daily reminders, and lightweight nutrition/BMI tools.
Success = the user builds and sustains a consistent workout streak, with tracking
that stays entirely on their device.

## Positioning

A combination a neighboring app could not truthfully copy wholesale:
- **An SVG animation for every exercise** showing the actual movement, reps, hold
  time, step-by-step instructions and a tip.
- **Free-text AI nutrition** — the user types what they ate in plain language and
  Claude computes calories and can build a daily menu — served through a
  **server-side Cloudflare Worker proxy** so it works for every visitor without
  exposing an API key, with a **local offline estimator** as fallback.
- **Fully bilingual he/en (RTL/LTR)** across all content, exercises, and AI replies,
  with everything stored **on-device**.

_[Inferred which of these to "lead with"; the animated exercises read as the core
hook in the code, but the user has not confirmed a single headline claim.]_

## Operating Context

- Mobile-first, portrait, installable to the home screen; works offline (service
  worker + manifest).
- Daily ritual: open the day's workout from the calendar; tap an exercise to see its
  animation; optionally log food and check the calorie target.
- Network needed only for the AI nutrition call; offline it falls back to the local
  estimator. Web Notifications and the service worker require serving over
  `http(s)://` or `localhost` (not `file://`).

## Capabilities and Constraints

- **Static app, no build step** — served from any static host; PWA via
  `manifest.webmanifest` and `sw.js`.
- **All user data in `localStorage`** — no accounts and no server-side user store.
- **AI nutrition** via a Cloudflare Worker (`worker/excerly-proxy.js`, deployed as
  `excerly`) that holds `ANTHROPIC_API_KEY` as a server secret; rate-limited to
  **12 requests / 60s per IP** via a Durable Object; model set by the Worker
  (`MODEL = "claude-opus-5"` in `wrangler.toml`).
- **Local offline nutrition estimator** as a graceful fallback when the proxy is
  unavailable.
- **Language switch he/en** with full RTL↔LTR flip; the AI responds in the active UI
  language; the choice persists on-device.
- **BMI & calories** from age, weight, height, sex, and activity level
  (Mifflin-St Jeor), with macro split and nutrition recommendations. Height is
  required for BMI.
- **Health outputs are informational only** and do not replace professional medical
  advice (stated in README).

## Brand Commitments

- Name: **Excerly**; short name **Excerly**.
- **Bilingual he/en with full RTL** support is a core, non-negotiable trait.
- **Dark theme** — background / theme color `#0e1116` (from the manifest).
- Icon assets exist: `assets/icon.svg`, `assets/icon-192.png`, `assets/icon-512.png`.
- _[Inferred] Friendly, approachable, emoji-forward tone (as seen in README/manifest
  copy) — not yet confirmed as a binding voice._

## Evidence on Hand

Real, working codebase and assets (exercises, weekly plan, animations, BMI/nutrition
logic, Worker proxy). **No** testimonials, customers, benchmarks, pricing, or
partnership claims exist — future work must not fabricate any.

## Product Principles

1. **On-device by default.** Privacy through `localStorage`; never require accounts,
   and send user content off-device only for the explicit AI nutrition request.
2. **Bilingual parity.** Every feature works equally in Hebrew (RTL) and English (LTR).
3. **Graceful degradation.** Core features work offline; AI enhances but never blocks.
4. **Low-friction daily habit.** The day's workout and logging are one tap away.
5. **Informational, not medical.** Health outputs are guidance, with a clear disclaimer.

## Accessibility & Inclusion

Full **RTL/LTR** support is a product requirement, not an option. The app is
mobile-first and touch-driven; future work should preserve legible contrast on the
dark theme and correct bidirectional layout in both languages.
