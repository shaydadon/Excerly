/* =============================================================
   Excerly – ספריית דמויות התרגילים (SVG, סגנון איור שטוח מוצלל)
   דמות אנושית מלאה: איברים ממולאים עם הצללה רכה (גרדיאנט), גופייה,
   מכנסיים קצרים, ראש+שיער+פנים וכפות רגליים – זכר/נקבה לפי הפרופיל,
   עם הדגשת האזור העובד בכל תרגיל.
   ניתן להחליף כל תרגיל באנימציית Lottie חיצונית (ראו assets/js/data.js).
   ============================================================= */
(function (global) {
  'use strict';

  let curGender = 'male';
  let uidSeq = 0;
  const R = (n) => Math.round(n * 10) / 10;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* הצללות רכות (גרדיאנט) לכל חומר – מעניקות נפח לצורות השטוחות */
  function defs(uid) {
    const lg = (id, c0, c1, horiz) =>
      `<linearGradient id="${id}${uid}" x1="0" y1="0" x2="${horiz ? 1 : 0}" y2="1">` +
      `<stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>`;
    return `<defs>${lg('sk', '#f6c892', '#db9c60', true)}${lg('sh', '#54e6be', '#1eae83')}` +
      `${lg('sr', '#43578d', '#273858')}${lg('hr', '#5b4636', '#2c2118')}</defs>`;
  }

  /* איבר ממולא בין שני מפרקים, רוחב מתחדד וקצוות מעוגלים */
  function seg(x1, y1, r1, x2, y2, r2, fill) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    const a1x = R(x1 + px * r1), a1y = R(y1 + py * r1);
    const a2x = R(x1 - px * r1), a2y = R(y1 - py * r1);
    const b1x = R(x2 + px * r2), b1y = R(y2 + py * r2);
    const b2x = R(x2 - px * r2), b2y = R(y2 - py * r2);
    return `<path fill="${fill}" d="M${a1x} ${a1y} L${b1x} ${b1y} L${b2x} ${b2y} L${a2x} ${a2y} Z"/>` +
      `<circle fill="${fill}" cx="${R(x1)}" cy="${R(y1)}" r="${r1}"/>` +
      `<circle fill="${fill}" cx="${R(x2)}" cy="${R(y2)}" r="${r2}"/>`;
  }

  const maleHair = (cx, cy, r) =>
    `M ${cx - r} ${cy - r * 0.15} Q ${cx} ${cy - r * 1.75} ${cx + r} ${cy - r * 0.15} ` +
    `Q ${cx} ${cy - r * 0.55} ${cx - r} ${cy - r * 0.15} Z`;

  const femaleHair = (cx, cy, r) =>
    `M ${cx - r} ${cy - r * 0.1} Q ${cx} ${cy - r * 1.95} ${cx + r} ${cy - r * 0.1} ` +
    `L ${cx + r * 1.08} ${cy + r * 1.75} L ${cx + r * 0.5} ${cy + r * 1.75} ` +
    `Q ${cx + r * 0.66} ${cy + r * 0.3} ${cx + r * 0.5} ${cy - r * 0.05} ` +
    `Q ${cx} ${cy - r * 0.55} ${cx - r * 0.5} ${cy - r * 0.05} ` +
    `Q ${cx - r * 0.66} ${cy + r * 0.3} ${cx - r * 0.5} ${cy + r * 1.75} ` +
    `L ${cx - r * 1.08} ${cy + r * 1.75} Z`;

  // סימני פנים לפי כיוון: 'front' (שתי עיניים) / 'left' / 'right' (עין + אף)
  function faceMarks(cx, cy, r, dir, skin) {
    const eye = (x, y) => `<circle fill="#2b2118" cx="${R(x)}" cy="${R(y)}" r="1.8"/>`;
    const brow = (x, y, w) => `<rect fill="#2b2118" x="${R(x - w)}" y="${R(y)}" width="${R(w * 2)}" height="1.4" rx="0.7"/>`;
    if (dir === 'left')
      return eye(cx - r * 0.34, cy - r * 0.05) +
        `<circle fill="${skin}" cx="${R(cx - r - 1)}" cy="${R(cy + r * 0.18)}" r="3"/>`;
    if (dir === 'right')
      return eye(cx + r * 0.34, cy - r * 0.05) +
        `<circle fill="${skin}" cx="${R(cx + r + 1)}" cy="${R(cy + r * 0.18)}" r="3"/>`;
    return eye(cx - r * 0.32, cy - r * 0.03) + eye(cx + r * 0.32, cy - r * 0.03) +
      brow(cx - r * 0.32, cy - r * 0.34, 2.4) + brow(cx + r * 0.32, cy - r * 0.34, 2.4);
  }

  // ראש מלא: שיער נקבה + עור + שיער זכר + פנים
  const head = (cx, cy, r, dir, skin, hair) =>
    `<g class="fig-head">
       <path class="hair hair-female" fill="${hair}" d="${femaleHair(cx, cy, r)}"/>
       <circle fill="${skin}" cx="${R(cx)}" cy="${R(cy)}" r="${r}"/>
       <path class="hair hair-male" fill="${hair}" d="${maleHair(cx, cy, r)}"/>
       ${faceMarks(cx, cy, r, dir || 'front', skin)}
     </g>`;

  const foot = (x, y, rot, skin) =>
    `<ellipse fill="${skin}" cx="${R(x)}" cy="${R(y)}" rx="9.5" ry="4.8" ` +
    `transform="rotate(${rot || 0} ${R(x)} ${R(y)})"/>`;

  /* בונה דמות אנושית מלאה מתוך מפרט מפרקים */
  function person(s, uid) {
    const skin = `url(#sk${uid})`, shirt = `url(#sh${uid})`, shorts = `url(#sr${uid})`, hair = `url(#hr${uid})`;
    let out = '';
    const legs = s.legs || [];
    const arms = s.arms || [];

    // 1) רגליים (מהאחורית לקדמית) + כפות רגליים
    legs.forEach((lg) => {
      const [hip, knee, ank, frot] = lg;
      out += seg(hip[0], hip[1], 12, knee[0], knee[1], 9.5, skin);
      out += seg(knee[0], knee[1], 9.5, ank[0], ank[1], 6.8, skin);
      out += foot(ank[0], ank[1], frot || 0, skin);
    });

    // 2) מכנסיים קצרים – חלק עליון של כל רגל + חגורת מותן
    legs.forEach((lg) => {
      const [hip, knee] = lg;
      const mx = hip[0] + (knee[0] - hip[0]) * 0.5;
      const my = hip[1] + (knee[1] - hip[1]) * 0.5;
      out += seg(hip[0], hip[1], 14, mx, my, 12, shorts);
    });
    if (legs.length > 1) {
      const h0 = legs[0][0], h1 = legs[legs.length - 1][0];
      out += seg(h0[0], h0[1], 13.5, h1[0], h1[1], 13.5, shorts);
    }

    // 3) גו (גופייה) – שרשרת מקטעים מהאגן אל הכתפיים (מאפשר קימור גב)
    const t = s.torso, n = t.length;
    for (let i = 0; i < n - 1; i++) {
      const r1 = lerp(14, 16.5, i / (n - 1));
      const r2 = lerp(14, 16.5, (i + 1) / (n - 1));
      out += seg(t[i][0], t[i][1], r1, t[i + 1][0], t[i + 1][1], r2, shirt);
    }

    // 4) זרועות (מהאחורית לקדמית) + כפות ידיים
    arms.forEach((ar) => {
      const [sh, el, wr] = ar;
      out += seg(sh[0], sh[1], 8, el[0], el[1], 6.6, skin);
      out += seg(el[0], el[1], 6.6, wr[0], wr[1], 5.2, skin);
      out += `<circle fill="${skin}" cx="${R(wr[0])}" cy="${R(wr[1])}" r="5"/>`;
    });

    // 5) צוואר + ראש
    const hd = s.head, hr = s.hr || 16, top = t[n - 1];
    out += seg(top[0], top[1], 7, hd[0], hd[1] + hr * 0.75, 6, skin);
    out += head(hd[0], hd[1], hr, s.face, skin, hair);

    // 6) הדגשת האזור העובד – מעל הדמות (חצי-שקוף, פועם)
    if (s.hl) out += `<circle class="work-zone" cx="${s.hl[0]}" cy="${s.hl[1]}" r="${s.hl[2] || 18}"/>`;
    return out;
  }

  function scene(id, spec, opts) {
    opts = opts || {};
    const uid = uidSeq++;
    const floor = opts.floor ? '<line class="floor" x1="18" y1="181" x2="202" y2="181"/>' : '';
    const wall = opts.wall ? '<line class="floor" x1="190" y1="34" x2="190" y2="181"/>' : '';
    const shadow = opts.floor ? `<ellipse class="fig-shadow" cx="${opts.sh || 110}" cy="183" rx="46" ry="5"/>` : '';
    return `<svg class="ex-anim anim-${id} fig-${curGender}" viewBox="0 0 220 200" ` +
      `role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">` +
      defs(uid) + floor + wall + shadow + person(spec, uid) + '</svg>';
  }

  /* ---------- הסצנות (14 תרגילים) ---------- */
  const SCENES = {
    // מתיחת צוואר – עמידה, יד מובילה את הראש הצידה
    neck: () => scene('neck', {
      legs: [[[103, 121], [100, 150], [98, 177], -8], [[117, 121], [120, 150], [122, 177], 8]],
      torso: [[110, 121], [110, 72]],
      arms: [[[97, 78], [86, 104], [90, 122]], [[123, 78], [134, 92], [118, 56]]],
      head: [116, 45], hr: 16, face: 'front', hl: [111, 62, 13]
    }, { floor: true }),

    // מתיחת כתפיים – יד נמתחת לרוחב החזה
    shoulders: () => scene('shoulders', {
      legs: [[[103, 121], [100, 150], [98, 177], -8], [[117, 121], [120, 150], [122, 177], 8]],
      torso: [[110, 121], [110, 72]],
      arms: [[[97, 78], [96, 100], [110, 90]], [[123, 78], [98, 90], [80, 92]]],
      head: [110, 46], hr: 16, face: 'front', hl: [120, 82, 16]
    }, { floor: true }),

    // מתיחת זרועות – ידיים מעל הראש (ברכת השמש)
    arms: () => scene('arms', {
      legs: [[[103, 121], [100, 150], [98, 177], -8], [[117, 121], [120, 150], [122, 177], 8]],
      torso: [[110, 122], [110, 74]],
      arms: [[[98, 78], [90, 50], [100, 30]], [[122, 78], [130, 50], [120, 30]]],
      head: [110, 50], hr: 15, face: 'front', hl: [110, 44, 16]
    }, { floor: true }),

    // כפיפה צידית – הטיה עם יד מעל הראש
    sidebend: () => scene('sidebend', {
      legs: [[[104, 121], [102, 150], [100, 177], -8], [[118, 121], [120, 150], [122, 177], 8]],
      torso: [[111, 121], [124, 74]],
      arms: [[[122, 78], [128, 50], [122, 30]], [[126, 82], [138, 104], [142, 122]]],
      head: [130, 52], hr: 15, face: 'front', hl: [120, 100, 15]
    }, { floor: true }),

    // סיבוב גו – פיתול הפלג העליון, מבט צד, זרוע חוצה קדימה
    twist: () => scene('twist', {
      legs: [[[104, 121], [102, 150], [100, 177], -8], [[118, 121], [120, 150], [122, 177], 8]],
      torso: [[110, 121], [108, 74]],
      arms: [[[112, 80], [98, 92], [84, 96]], [[106, 80], [124, 86], [146, 82]]],
      head: [102, 52], hr: 15, face: 'left', hl: [112, 100, 17]
    }, { floor: true }),

    // כפיפה קדימה – מבט צד, ידיים יורדות לרגליים
    forwardfold: () => scene('forwardfold', {
      legs: [[[118, 120], [116, 150], [114, 177], -4], [[122, 121], [124, 150], [126, 177], -4]],
      torso: [[120, 120], [138, 104], [150, 96]],
      arms: [[[150, 100], [150, 128], [150, 156]]],
      head: [157, 78], hr: 15, face: 'left', hl: [128, 150, 16]
    }, { floor: true, sh: 122 }),

    // מתיחת שרירי ירך אחוריים – ישיבה עם רגל מושטת, גו נשען קדימה
    hamstring: () => scene('hamstring', {
      legs: [[[82, 160], [122, 160], [166, 161], 80]],
      torso: [[80, 160], [86, 122]],
      arms: [[[86, 128], [114, 146], [140, 156]]],
      head: [90, 106], hr: 14, face: 'right', hl: [124, 165, 16]
    }, { floor: true, sh: 120 }),

    // פרפר – ישיבה, כפות רגליים צמודות, ברכיים לצדדים
    butterfly: () => scene('butterfly', {
      legs: [[[104, 150], [74, 150], [100, 150], 0], [[116, 150], [146, 150], [120, 150], 0]],
      torso: [[110, 150], [110, 108]],
      arms: [[[98, 112], [86, 138], [100, 150]], [[122, 112], [134, 138], [120, 150]]],
      head: [110, 86], hr: 15, face: 'front', hl: [110, 150, 20]
    }, { floor: true }),

    // מתיחת ארבע ראשי – עמידה, אחיזת כף הרגל מאחור
    quad: () => scene('quad', {
      legs: [[[110, 120], [108, 150], [106, 177], -6], [[112, 121], [122, 150], [140, 126], 60]],
      torso: [[110, 120], [108, 74]],
      arms: [[[96, 78], [88, 100], [92, 116]], [[120, 78], [128, 104], [140, 126]]],
      head: [107, 50], hr: 15, face: 'left', hl: [123, 140, 15]
    }, { floor: true, sh: 112 }),

    // מתיחת מכופפי ירך – פריקה נמוכה (lunge), מבט צד
    hipflexor: () => scene('hipflexor', {
      legs: [[[100, 122], [78, 150], [116, 174], 6], [[100, 120], [150, 148], [150, 177], 0]],
      torso: [[100, 120], [96, 76]],
      arms: [[[96, 82], [120, 104], [148, 120]]],
      head: [96, 54], hr: 15, face: 'right', hl: [104, 128, 16]
    }, { floor: true, sh: 114 }),

    // מתיחת שוק – דחיפה מול קיר, רגל אחורית מושטת
    calf: () => scene('calf', {
      legs: [[[118, 118], [88, 150], [60, 176], -22], [[118, 118], [150, 146], [150, 176], 0]],
      torso: [[118, 118], [122, 76]],
      arms: [[[122, 82], [150, 88], [178, 92]]],
      head: [127, 54], hr: 14, face: 'right', hl: [76, 160, 15]
    }, { floor: true, wall: true, sh: 108 }),

    // חתול-פרה – שש-עשרה, גב מקושת כלפי מעלה
    catcow: () => scene('catcow', {
      legs: [[[70, 120], [70, 150], [58, 152], -20]],
      torso: [[70, 118], [110, 102], [150, 118]],
      arms: [[[150, 122], [150, 138], [150, 152]]],
      head: [168, 116], hr: 13, face: 'right', hl: [110, 104, 18]
    }, { floor: true }),

    // קוברה – שכיבה על הבטן, פלג עליון מורם
    cobra: () => scene('cobra', {
      legs: [[[152, 168], [178, 170], [200, 171], 84]],
      torso: [[152, 168], [136, 152], [122, 138]],
      arms: [[[124, 142], [130, 162], [136, 174]]],
      head: [114, 122], hr: 14, face: 'left', hl: [146, 158, 16]
    }, { floor: true, sh: 150 }),

    // תנוחת הילד – כריעה, גו מקופל קדימה, ידיים מושטות
    child: () => scene('child', {
      legs: [[[150, 150], [150, 170], [122, 172], 0]],
      torso: [[150, 150], [124, 160], [100, 166]],
      arms: [[[100, 166], [72, 170], [46, 173]]],
      head: [88, 162], hr: 13, face: 'left', hl: [140, 152, 18]
    }, { floor: true, sh: 120 })
  };

  function svgFor(key, gender) {
    curGender = gender === 'female' ? 'female' : 'male';
    const fn = SCENES[key] || SCENES.neck;
    return fn();
  }

  global.ExcerlyAnim = { svgFor };
})(window);
