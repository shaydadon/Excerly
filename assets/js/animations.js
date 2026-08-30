/* =============================================================
   Excerly – ספריית אנימציות התרגילים (SVG)
   דמות אנושית: ראש+שיער+פנים, גופייה, מכנסיים קצרים, זרועות/רגליים
   בגוון עור וכפות רגליים – זכר/נקבה לפי הפרופיל, עם הדגשת האזור העובד.
   ============================================================= */
(function (global) {
  'use strict';

  let curGender = 'male';

  function scene(id, inner, opts) {
    opts = opts || {};
    const floor = opts.floor ? '<line class="floor" x1="20" y1="182" x2="200" y2="182" />' : '';
    const wall = opts.wall ? '<line class="floor" x1="188" y1="30" x2="188" y2="182" />' : '';
    const hl = opts.hl
      ? `<circle class="work-zone" cx="${opts.hl[0]}" cy="${opts.hl[1]}" r="${opts.hl[2] || 18}" />`
      : '';
    return `<svg class="ex-anim anim-${id} fig-${curGender}" viewBox="0 0 220 200" ` +
      `role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">` +
      floor + wall + hl + inner + '</svg>';
  }

  const maleHair = (cx, cy, r) =>
    `M ${cx - r} ${cy - r * 0.15} Q ${cx} ${cy - r * 1.75} ${cx + r} ${cy - r * 0.15} ` +
    `Q ${cx} ${cy - r * 0.5} ${cx - r} ${cy - r * 0.15} Z`;

  const femaleHair = (cx, cy, r) =>
    `M ${cx - r} ${cy - r * 0.1} Q ${cx} ${cy - r * 1.9} ${cx + r} ${cy - r * 0.1} ` +
    `L ${cx + r * 1.05} ${cy + r * 1.7} L ${cx + r * 0.52} ${cy + r * 1.7} ` +
    `Q ${cx + r * 0.64} ${cy + r * 0.3} ${cx + r * 0.5} ${cy - r * 0.05} ` +
    `Q ${cx} ${cy - r * 0.5} ${cx - r * 0.5} ${cy - r * 0.05} ` +
    `Q ${cx - r * 0.64} ${cy + r * 0.3} ${cx - r * 0.52} ${cy + r * 1.7} ` +
    `L ${cx - r * 1.05} ${cy + r * 1.7} Z`;

  // סימני פנים לפי כיוון: 'front' (שתי עיניים) / 'left' / 'right' (עין + אף)
  function faceMarks(cx, cy, r, dir) {
    const eye = (x, y) => `<circle class="fig-face" cx="${x}" cy="${y}" r="1.7" />`;
    if (dir === 'left')
      return eye(cx - r * 0.32, cy - r * 0.05) + `<circle class="fig-skin nose" cx="${cx - r - 1}" cy="${cy + r * 0.15}" r="3" />`;
    if (dir === 'right')
      return eye(cx + r * 0.32, cy - r * 0.05) + `<circle class="fig-skin nose" cx="${cx + r + 1}" cy="${cy + r * 0.15}" r="3" />`;
    return eye(cx - r * 0.32, cy - r * 0.05) + eye(cx + r * 0.32, cy - r * 0.05);
  }

  // ראש: שיער (זכר/נקבה) + עור + פנים
  const head = (cx, cy, r, dir) =>
    `<g class="fig-head-g">
       <path class="hair hair-female" d="${femaleHair(cx, cy, r)}" />
       <circle class="fig-skin" cx="${cx}" cy="${cy}" r="${r}" />
       <path class="hair hair-male" d="${maleHair(cx, cy, r)}" />
       ${faceMarks(cx, cy, r, dir || 'front')}
     </g>`;

  const limb = (x1, y1, x2, y2, cls) =>
    `<line class="fig-limb ${cls || ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;

  // מכנסיים קצרים – קו עבה בצורת ∧ מעל האגן וראשי הירכיים
  const shorts = (ax, ay, bx, by, cx, cy) =>
    `<polyline class="fig-shorts" points="${ax},${ay} ${bx},${by} ${cx},${cy}" />`;

  // כף רגל – אליפסה בגוון עור
  const foot = (x, y, rot) =>
    `<ellipse class="fig-skin fig-foot" cx="${x}" cy="${y}" rx="9" ry="4.5" transform="rotate(${rot || 0} ${x} ${y})" />`;

  /* ---------- הסצנות ---------- */
  const SCENES = {
    neck: () => scene('neck',
      `${limb(110, 130, 92, 172, 'leg')}
       ${limb(110, 130, 128, 172, 'leg')}
       ${foot(90, 173, -8)}${foot(130, 173, 8)}
       ${shorts(99, 150, 110, 131, 121, 150)}
       ${limb(110, 78, 110, 130, 'torso')}
       ${limb(110, 88, 78, 118, 'arm')}
       ${limb(110, 88, 142, 118, 'arm')}
       <g class="j-neck-head">${head(110, 55, 20, 'front')}${limb(110, 74, 110, 78, 'neck-stub')}</g>`,
      { floor: true, hl: [110, 74, 15] }),

    shoulders: () => scene('shoulders',
      `${limb(110, 128, 92, 172, 'leg')}
       ${limb(110, 128, 128, 172, 'leg')}
       ${foot(90, 173, -8)}${foot(130, 173, 8)}
       ${shorts(99, 149, 110, 130, 121, 149)}
       ${limb(110, 70, 110, 128, 'torso')}
       <g class="j-shoulder-l">${limb(110, 82, 80, 112, 'arm')}</g>
       <g class="j-shoulder-r">${limb(110, 82, 140, 112, 'arm')}</g>
       ${head(110, 50, 18, 'front')}`,
      { floor: true, hl: [110, 84, 22] }),

    arms: () => scene('arms',
      `${limb(110, 128, 92, 172, 'leg')}
       ${limb(110, 128, 128, 172, 'leg')}
       ${foot(90, 173, -8)}${foot(130, 173, 8)}
       ${shorts(99, 149, 110, 130, 121, 149)}
       ${limb(110, 72, 110, 128, 'torso')}
       <g class="j-arm-l">${limb(110, 84, 62, 84, 'arm')}</g>
       <g class="j-arm-r">${limb(110, 84, 158, 84, 'arm')}</g>
       ${head(110, 52, 18, 'front')}`,
      { floor: true, hl: [110, 84, 22] }),

    sidebend: () => scene('sidebend',
      `${limb(110, 120, 94, 172, 'leg')}
       ${limb(110, 120, 126, 172, 'leg')}
       ${foot(93, 173, -8)}${foot(127, 173, 8)}
       ${shorts(101, 146, 110, 130, 119, 146)}
       <g class="j-upper">
         ${limb(110, 67, 110, 120, 'torso')}
         ${limb(110, 78, 110, 34, 'arm arm-up')}
         ${limb(110, 78, 138, 108, 'arm')}
         ${head(110, 50, 17, 'front')}
       </g>`,
      { floor: true, hl: [110, 104, 17] }),

    twist: () => scene('twist',
      `${limb(110, 120, 94, 172, 'leg')}
       ${limb(110, 120, 126, 172, 'leg')}
       ${foot(93, 173, -8)}${foot(127, 173, 8)}
       ${shorts(101, 146, 110, 130, 119, 146)}
       <g class="j-twist">
         ${limb(110, 70, 110, 120, 'torso')}
         ${limb(110, 80, 74, 96, 'arm')}
         ${limb(110, 80, 146, 96, 'arm')}
         ${head(110, 52, 17, 'front')}
       </g>`,
      { floor: true, hl: [110, 100, 18] }),

    forwardfold: () => scene('forwardfold',
      `${limb(118, 120, 112, 172, 'leg')}
       ${limb(118, 122, 124, 172, 'leg leg-back')}
       ${foot(112, 174, 0)}${foot(124, 174, 0)}
       ${shorts(111, 138, 118, 122, 126, 138)}
       <g class="j-fold">
         ${limb(150, 76, 118, 120, 'torso')}
         ${limb(140, 92, 150, 128, 'arm')}
         ${head(150, 60, 16, 'left')}
       </g>`,
      { floor: true, hl: [116, 146, 16] }),

    hamstring: () => scene('hamstring',
      `${limb(70, 168, 168, 168, 'leg leg-front')}
       ${limb(70, 168, 108, 150, 'leg leg-bent')}
       ${foot(168, 165, 78)}
       ${shorts(78, 158, 74, 150, 84, 152)}
       <g class="j-hamstring">
         ${limb(74, 132, 70, 166, 'torso')}
         ${limb(78, 140, 120, 162, 'arm')}
         ${head(74, 118, 15, 'right')}
       </g>`,
      { floor: true, hl: [124, 168, 16] }),

    butterfly: () => scene('butterfly',
      `<g class="j-knee-l">${limb(110, 150, 70, 150, 'leg')}${limb(70, 150, 96, 150, 'leg')}</g>
       <g class="j-knee-r">${limb(110, 150, 150, 150, 'leg')}${limb(150, 150, 124, 150, 'leg')}</g>
       ${limb(96, 150, 124, 150, 'leg foot-join')}
       ${shorts(101, 150, 110, 134, 119, 150)}
       ${limb(110, 78, 110, 130, 'torso')}
       ${limb(110, 92, 138, 122, 'arm')}
       ${limb(110, 92, 82, 122, 'arm')}
       ${head(110, 60, 17, 'front')}`,
      { floor: true, hl: [110, 150, 22] }),

    quad: () => scene('quad',
      `${limb(110, 120, 102, 172, 'leg')}
       ${foot(102, 174, 0)}
       ${shorts(104, 138, 110, 122, 116, 138)}
       ${limb(110, 65, 110, 120, 'torso')}
       ${limb(110, 78, 96, 108, 'arm')}
       <g class="j-quad-thigh">
         ${limb(110, 120, 118, 150, 'leg')}
         <g class="j-quad-shin">${limb(118, 150, 138, 122, 'leg leg-lift')}</g>
       </g>
       ${head(110, 48, 17, 'left')}`,
      { floor: true, hl: [115, 135, 15] }),

    hipflexor: () => scene('hipflexor',
      `<g class="j-hip">
         ${limb(100, 120, 150, 150, 'leg')}
         ${limb(150, 150, 150, 172, 'leg')}
         ${limb(100, 120, 78, 150, 'leg')}
         ${limb(78, 150, 118, 172, 'leg leg-back')}
         ${foot(152, 174, 0)}${foot(120, 174, 8)}
         ${shorts(94, 138, 100, 122, 108, 136)}
         ${limb(96, 76, 100, 120, 'torso')}
         ${head(96, 60, 16, 'right')}
       </g>`,
      { floor: true, hl: [102, 124, 16] }),

    calf: () => scene('calf',
      `<g class="j-calf">
         ${limb(118, 118, 60, 172, 'leg leg-back')}
         ${limb(118, 118, 150, 148, 'leg')}
         ${limb(150, 148, 150, 172, 'leg')}
         ${foot(60, 173, -22)}${foot(152, 174, 0)}
         ${shorts(112, 134, 118, 120, 126, 134)}
         ${limb(96, 73, 118, 118, 'torso')}
         ${limb(96, 80, 176, 96, 'arm')}
         ${head(96, 58, 15, 'right')}
       </g>`,
      { floor: true, wall: true, hl: [86, 150, 15] }),

    catcow: () => scene('catcow',
      `${limb(70, 118, 70, 168, 'leg')}
       ${limb(150, 118, 150, 168, 'leg')}
       ${foot(70, 170, 0)}${foot(150, 170, 0)}
       <g class="j-spine">
         <path class="fig-spine" d="M70 118 Q110 108 150 118" />
         ${shorts(64, 124, 70, 116, 78, 124)}
       </g>
       ${limb(150, 118, 168, 96, 'torso neck-line')}
       ${head(174, 92, 13, 'right')}`,
      { floor: true, hl: [110, 114, 18] }),

    cobra: () => scene('cobra',
      `${limb(60, 170, 168, 170, 'leg leg-lie')}
       ${foot(60, 170, -84)}
       ${shorts(142, 168, 150, 164, 158, 168)}
       <g class="j-cobra">
         ${limb(150, 170, 116, 132, 'torso')}
         ${limb(150, 170, 130, 168, 'arm cobra-arm')}
         ${head(112, 118, 15, 'left')}
       </g>`,
      { floor: true, hl: [138, 152, 16] }),

    child: () => scene('child',
      `<g class="j-breath">
         ${limb(150, 150, 150, 172, 'leg')}
         ${limb(150, 172, 120, 172, 'leg leg-shin')}
         ${foot(118, 172, 0)}
         ${shorts(144, 158, 150, 150, 156, 158)}
         ${limb(150, 150, 92, 168, 'torso')}
         ${limb(92, 168, 44, 172, 'arm child-arm')}
         ${head(84, 160, 14, 'left')}
       </g>`,
      { floor: true, hl: [122, 156, 18] })
  };

  function svgFor(key, gender) {
    curGender = gender === 'female' ? 'female' : 'male';
    const fn = SCENES[key] || SCENES.neck;
    return fn();
  }

  global.ExcerlyAnim = { svgFor };
})(window);
