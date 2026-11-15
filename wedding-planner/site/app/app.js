/* The Wedding Planner — interactive companion app.
   Everything is saved on this device (localStorage). Backup / restore via JSON export.
   Vendors near you come from OpenStreetMap (Overpass API), © OpenStreetMap contributors. */
(() => {
  const D = window.PLANNER_DATA;
  const T = D.themes;
  const KEY = 'wedding-planner-app-v1';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const num = (v) => (Number.isFinite(+v) ? +v : 0);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  };

  // ── state ──
  function defaults() {
    const tables = [];
    for (let i = 0; i < 8; i++) tables.push({ id: uid(), name: `Table ${i + 1}`, seats: 10, shape: 'round', x: 14 + (i % 4) * 24, y: 22 + Math.floor(i / 4) * 40 });
    const budget = [];
    D.budgetLines.forEach(([cat, items]) => items.forEach((item) => budget.push({ id: uid(), cat, item, est: '', act: '', paid: '' })));
    return { v: 1, couple: { a: '', b: '', date: '', total: '', currency: '$' }, guests: [], tables, budget, done: {}, saved: [], country: '', city: '' };
  }
  let S;
  try { S = JSON.parse(store.get(KEY)) || defaults(); } catch (e) { S = defaults(); }
  let saveWarned = false;
  const save = () => { if (!store.set(KEY, JSON.stringify(S)) && !saveWarned) { saveWarned = true; toast('This browser is not saving data. Export a backup from Overview.'); } };

  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); };
  const money = (v) => (S.couple.currency || '') + Math.round(num(v)).toLocaleString();

  // ── tabs ──
  const TABS = [
    ['overview', 'Overview', T.front], ['guests', 'Guests', T.guests], ['seating', 'Seating', T.events],
    ['budget', 'Budget', T.budget], ['checklist', 'Checklist', T.plan], ['vendors', 'Vendors', T.vendors],
  ];
  let tab = (location.hash.slice(1) && TABS.find((t) => t[0] === location.hash.slice(1))) ? location.hash.slice(1) : 'overview';
  function setTheme(t) { const r = document.body.style; r.setProperty('--sec', t.accent); r.setProperty('--wash', t.wash); r.setProperty('--tint', t.tint); }
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([id, name, th]) => `<button class="tab ${id === tab ? 'on' : ''}" style="--tabc:${th.accent}" data-tab="${id}" role="tab" aria-selected="${id === tab}">${name}</button>`).join('');
    const names = [S.couple.a, S.couple.b].filter(Boolean).join(' & ');
    $('#couple-line').textContent = names || 'Your wedding';
  }
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });
  function go(id) { tab = id; history.replaceState(null, '', '#' + id); render(); window.scrollTo(0, 0); }
  function head(title, lede, art) { return `<div class="page-head"><div><h1>${title}</h1><p class="lede">${lede}</p></div>${art ? `<img class="art" src="art/${art}-sm.png" alt="">` : ''}</div>`; }

  function render() {
    const th = TABS.find((t) => t[0] === tab)[2];
    setTheme(th);
    renderTabs();
    const v = $('#view');
    ({ overview, guests, seating, budget, checklist, vendors })[tab](v, th);
  }

  // ── derived ──
  const attending = () => S.guests.filter((g) => g.rsvp === 'Attending');
  const seatable = () => S.guests.filter((g) => g.rsvp !== 'Declined');
  const allTasks = () => D.checklist.flatMap((g, gi) => g.items.map((t, i) => ({ id: `${gi}-${i}`, when: g.when, t })));
  const daysTo = () => { if (!S.couple.date) return null; const d = new Date(S.couple.date + 'T12:00:00'); return Math.ceil((d - new Date()) / 864e5); };

  // ══════ OVERVIEW ══════
  function overview(v) {
    const est = S.budget.reduce((a, b) => a + num(b.est), 0), act = S.budget.reduce((a, b) => a + num(b.act), 0), paid = S.budget.reduce((a, b) => a + num(b.paid), 0);
    const tasks = allTasks(), done = tasks.filter((t) => S.done[t.id]).length;
    const seated = S.guests.filter((g) => g.table && g.rsvp !== 'Declined').length;
    const days = daysTo();
    v.innerHTML = `${head('Your <em>Wedding</em>', 'Everything in one place. Changes save on this device as you go.', 'rose')}
      <div class="grid g2">
        <div class="card">
          <h2>The couple</h2>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
            <input class="f" data-c="a" placeholder="Partner one" value="${esc(S.couple.a)}">
            <input class="f" data-c="b" placeholder="Partner two" value="${esc(S.couple.b)}">
            <label class="label" style="grid-column:span 2">Wedding date<input class="f" type="date" data-c="date" value="${esc(S.couple.date)}" style="display:block;width:100%;margin-top:4px"></label>
          </div>
        </div>
        <div class="card wash stat"><div class="label">Countdown</div><div class="n">${days == null ? '—' : days > 0 ? days : days === 0 ? 'Today!' : 'Married'}</div><div class="note">${days == null ? 'Add your date to start the countdown' : days > 0 ? 'days to go' : ''}</div></div>
      </div>
      <div class="grid g4" style="margin-top:14px">
        <a class="card stat" href="#guests" data-go="guests" style="text-decoration:none"><div class="label">Attending</div><div class="n">${attending().length}</div><div class="note">of ${S.guests.length} invited</div></a>
        <a class="card stat" href="#seating" data-go="seating" style="text-decoration:none"><div class="label">Seated</div><div class="n">${seated}</div><div class="note">${seatable().length - seated} still to seat</div></a>
        <a class="card stat" href="#budget" data-go="budget" style="text-decoration:none"><div class="label">Spent</div><div class="n">${money(act)}</div><div class="note">${S.couple.total ? `of ${money(S.couple.total)} budget` : `estimated ${money(est)}`}</div><div class="bar"><i style="width:${Math.min(100, (act / (num(S.couple.total) || est || 1)) * 100)}%"></i></div></a>
        <a class="card stat" href="#checklist" data-go="checklist" style="text-decoration:none"><div class="label">Checklist</div><div class="n">${Math.round((done / tasks.length) * 100)}%</div><div class="note">${done} of ${tasks.length} done</div><div class="bar"><i style="width:${(done / tasks.length) * 100}%"></i></div></a>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h2>Still to pay</h2><div class="stat"><div class="n">${money(act - paid)}</div></div><p class="note">${S.saved.filter((x) => x.status === 'Booked').length} vendors booked · ${S.saved.length} saved</p></div>
        <div class="card"><h2>Your data</h2><p class="note">Saved privately in this browser. Export a backup to move it to another device, or to keep it safe.</p>
          <div class="row" style="margin-top:12px"><button class="btn small" data-act="export">Export backup</button><label class="btn ghost small" style="display:inline-block">Import backup<input type="file" accept="application/json" data-act="import" hidden></label><button class="btn ghost small" data-act="reset">Start over</button></div></div>
      </div>`;
    v.oninput = (e) => { const k = e.target.dataset.c; if (k) { S.couple[k] = e.target.value; save(); renderTabs(); } };
    v.onchange = (e) => { if (e.target.dataset.c === 'date') { save(); render(); } if (e.target.dataset.act === 'import') importData(e.target.files[0]); };
    v.onclick = (e) => {
      const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); return; }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'export') exportData();
      if (a === 'reset' && confirm('Delete everything in this planner on this device? Export a backup first if you might need it.')) { S = defaults(); save(); render(); toast('Started fresh'); }
    };
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `wedding-planner-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importData(file) {
    if (!file) return;
    file.text().then((t) => { const d = JSON.parse(t); if (!d || !Array.isArray(d.guests) || !Array.isArray(d.tables)) throw new Error(); S = { ...defaults(), ...d }; save(); render(); toast('Backup restored'); })
      .catch(() => toast('That file is not a planner backup'));
  }

  // ══════ GUESTS ══════
  let gFilter = '';
  function guests(v) {
    const list = S.guests.filter((g) => !gFilter || (g.name + ' ' + (g.group || '')).toLowerCase().includes(gFilter.toLowerCase()));
    const c = (r) => S.guests.filter((g) => g.rsvp === r).length;
    const opt = (vals, cur) => vals.map((x) => `<option ${x === cur ? 'selected' : ''}>${x}</option>`).join('');
    v.innerHTML = `${head('Guest <em>List</em>', 'Add guests, track replies and meals. Every guest you mark as attending appears in Seating.', 'sweet-pea')}
      <div class="grid g4">
        <div class="card stat"><div class="label">Invited</div><div class="n">${S.guests.length}</div></div>
        <div class="card stat"><div class="label">Attending</div><div class="n">${c('Attending')}</div></div>
        <div class="card stat"><div class="label">Declined</div><div class="n">${c('Declined')}</div></div>
        <div class="card stat"><div class="label">Awaiting</div><div class="n">${c('Awaiting')}</div></div>
      </div>
      <div class="card wash" style="margin:14px 0">
        <h2>Add guests</h2>
        <div class="row" style="align-items:stretch">
          <textarea class="f" id="g-new" rows="3" placeholder="One name per line, e.g.\nEmma Thompson\nLiam Thompson" style="flex:2 1 260px"></textarea>
          <div style="display:flex;flex-direction:column;gap:8px;flex:1 1 160px">
            <select class="f" id="g-side">${opt(['Partner one', 'Partner two', 'Both'], 'Both')}</select>
            <input class="f" id="g-group" placeholder="Group (family, work…)">
            <button class="btn sec" data-act="add">Add to list</button>
          </div>
        </div>
      </div>
      <div class="row" style="justify-content:space-between;margin-bottom:8px"><input class="f" id="g-find" placeholder="Search guests" value="${esc(gFilter)}" style="flex:1 1 220px;max-width:340px"><span class="note">${list.length} shown</span></div>
      <div class="card scroll" style="padding:0">
        ${S.guests.length ? `<table class="tbl"><thead><tr><th>Name</th><th>Side</th><th>Group</th><th>RSVP</th><th>Meal</th><th>Table</th><th>Notes</th><th></th></tr></thead><tbody>
          ${list.map((g) => `<tr data-id="${g.id}">
            <td><input data-k="name" value="${esc(g.name)}" style="min-width:140px"></td>
            <td><select data-k="side">${opt(['Partner one', 'Partner two', 'Both'], g.side)}</select></td>
            <td><input data-k="group" value="${esc(g.group)}" style="min-width:90px"></td>
            <td><select data-k="rsvp">${opt(['Awaiting', 'Attending', 'Declined'], g.rsvp)}</select></td>
            <td><select data-k="meal">${opt(['—', 'Meat', 'Fish', 'Vegetarian', 'Vegan', 'Child'], g.meal || '—')}</select></td>
            <td><select data-k="table"><option value="">—</option>${S.tables.map((t) => `<option value="${t.id}" ${t.id === g.table ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></td>
            <td><input data-k="notes" value="${esc(g.notes)}" placeholder="Allergies, plus-one…" style="min-width:140px"></td>
            <td><button class="icon" data-del="${g.id}" aria-label="Remove ${esc(g.name)}">×</button></td></tr>`).join('')}
        </tbody></table>` : '<div class="empty">No guests yet. Add names above, or paste a whole list at once.</div>'}
      </div>`;
    v.onclick = (e) => {
      if (e.target.closest('[data-act="add"]')) {
        const names = $('#g-new').value.split('\n').map((s) => s.trim()).filter(Boolean);
        if (!names.length) return toast('Type at least one name');
        names.forEach((name) => S.guests.push({ id: uid(), name, side: $('#g-side').value, group: $('#g-group').value.trim(), rsvp: 'Awaiting', meal: '—', table: '', notes: '' }));
        save(); render(); toast(`${names.length} guest${names.length > 1 ? 's' : ''} added`);
      }
      const d = e.target.closest('[data-del]');
      if (d) { S.guests = S.guests.filter((g) => g.id !== d.dataset.del); save(); render(); }
    };
    v.oninput = (e) => {
      if (e.target.id === 'g-find') { gFilter = e.target.value; const pos = e.target.selectionStart; render(); const f = $('#g-find'); f.focus(); f.setSelectionRange(pos, pos); return; }
      const tr = e.target.closest('tr[data-id]'); if (!tr || e.target.tagName !== 'INPUT') return;
      const g = S.guests.find((x) => x.id === tr.dataset.id); g[e.target.dataset.k] = e.target.value; save();
    };
    v.onchange = (e) => {
      const tr = e.target.closest('tr[data-id]'); if (!tr || e.target.tagName !== 'SELECT') return;
      const g = S.guests.find((x) => x.id === tr.dataset.id); g[e.target.dataset.k] = e.target.value;
      if (e.target.dataset.k === 'rsvp' && g.rsvp === 'Declined') g.table = '';
      save(); render();
    };
  }

  // ══════ SEATING (drag & drop with pointer events: mouse, touch and pen) ══════
  let selTable = null, poolFind = '';
  function seatsHTML(t, n) {
    const out = [];
    for (let i = 0; i < t.seats; i++) {
      let x, y;
      if (t.shape === 'long') { const top = i < Math.ceil(t.seats / 2); const k = top ? i : i - Math.ceil(t.seats / 2); const per = top ? Math.ceil(t.seats / 2) : Math.floor(t.seats / 2); x = 15 + (120 / Math.max(per, 1)) * (k + 0.5); y = top ? 7 : 63; }
      else { const a = (i / t.seats) * Math.PI * 2 - Math.PI / 2; x = 60 + 51 * Math.cos(a); y = 60 + 51 * Math.sin(a); }
      const g = n[i];
      out.push(`<i class="seat ${g ? 'on' : ''}" style="left:${x}px;top:${y}px" title="${g ? esc(g.name) : 'Empty seat'}">${g ? esc(initials(g.name)) : ''}</i>`);
    }
    return out.join('');
  }
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const chip = (g) => `<span class="gchip ${/Veg/.test(g.meal) ? 'meal-veg' : ''}" data-guest="${g.id}" title="${esc(g.meal && g.meal !== '—' ? g.meal : '')}">${esc(g.name)}</span>`;

  function seating(v) {
    const pool = seatable().filter((g) => !g.table && (!poolFind || g.name.toLowerCase().includes(poolFind.toLowerCase())));
    const rows = Math.max(2, Math.ceil(S.tables.length / 4));
    const sel = S.tables.find((t) => t.id === selTable);
    v.innerHTML = `${head('Seating <em>Chart</em>', 'Drag guests onto a table. Drag a table by its center to move it. On a phone, tap a table, then tap guests to seat them.', 'star-flower')}
      <div class="row no-print" style="margin-bottom:12px">
        <button class="btn small sec" data-add="round">+ Round table</button>
        <button class="btn small ghost" data-add="long">+ Long table</button>
        <button class="btn small ghost" data-add="sweet">+ Sweetheart</button>
        <button class="btn small ghost" data-act="tidy">Tidy layout</button>
        <button class="btn small ghost" data-act="print">Print</button>
        <span class="note" style="margin-left:auto">${S.guests.filter((g) => g.table && g.rsvp !== 'Declined').length} seated · ${pool.length} waiting</span>
      </div>
      <div class="seating">
        <div class="card pool">
          <h2>Not seated <span class="pill">${seatable().filter((g) => !g.table).length}</span></h2>
          <input class="f" id="pool-find" placeholder="Find a guest" value="${esc(poolFind)}" style="width:100%;margin-bottom:8px">
          <div class="chips" data-drop="pool">${pool.map(chip).join('') || `<div class="note" style="padding:6px">${S.guests.length ? 'Everyone is seated. 🎉' : 'Add guests in the Guests tab first.'}</div>`}</div>
          <p class="note" style="margin-top:10px">Declined guests are hidden. Drag a seated guest back here to unseat them.</p>
        </div>
        <div>
          <div class="floor-wrap"><div class="floor" id="floor" style="height:${rows * 240 + 40}px">
            ${S.tables.map((t) => { const n = S.guests.filter((g) => g.table === t.id && g.rsvp !== 'Declined'); return `
              <div class="table ${t.shape === 'long' ? 'long' : ''} ${t.id === selTable ? 'sel' : ''}" data-drop="${t.id}" data-table="${t.id}" style="left:${t.x}%;top:${t.y}%">
                <div class="disc">${seatsHTML(t, n)}<div class="core ${n.length === t.seats ? 'full' : ''} ${n.length > t.seats ? 'over' : ''}" data-move="${t.id}"><b>${esc(t.name)}</b><span>${n.length}/${t.seats}</span></div></div>
              </div>`; }).join('')}
          </div></div>
          <div class="card detail no-print" style="margin-top:14px">
            ${sel ? `<div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(sel.name)}</h2><button class="btn small ghost" data-act="deltable">Remove table</button></div>
              <div class="row" style="margin:10px 0"><label class="label">Name <input class="f" data-t="name" value="${esc(sel.name)}" style="width:160px"></label><label class="label">Seats <input class="f" type="number" min="1" max="30" data-t="seats" value="${sel.seats}" style="width:80px"></label></div>
              <div class="chips" data-drop="${sel.id}">${S.guests.filter((g) => g.table === sel.id && g.rsvp !== 'Declined').map(chip).join('') || '<div class="note" style="padding:8px">Drag or tap guests to seat them here.</div>'}</div>`
            : '<p class="note">Tap a table to rename it, change its seats, or see who is sitting there.</p>'}
          </div>
          <div class="print-list">${S.tables.map((t) => `<div><b>${esc(t.name)}</b>${S.guests.filter((g) => g.table === t.id && g.rsvp !== 'Declined').map((g) => esc(g.name)).join('<br>') || '—'}</div>`).join('')}</div>
        </div>
      </div>`;

    v.onclick = (e) => {
      const add = e.target.closest('[data-add]')?.dataset.add;
      if (add) {
        const i = S.tables.length;
        const t = { id: uid(), name: add === 'sweet' ? 'Sweetheart' : `Table ${S.tables.filter((x) => /^Table \d+$/.test(x.name)).length + 1}`, seats: add === 'long' ? 8 : add === 'sweet' ? 2 : 10, shape: add === 'round' ? 'round' : 'long', x: 14 + (i % 4) * 24, y: 22 + Math.floor(i / 4) * 40 };
        S.tables.push(t); tidy(false); selTable = t.id; save(); render(); return;
      }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'tidy') { tidy(true); save(); render(); }
      if (a === 'print') window.print();
      if (a === 'deltable' && sel && confirm(`Remove ${sel.name}? Its guests go back to “Not seated”.`)) { S.guests.forEach((g) => { if (g.table === sel.id) g.table = ''; }); S.tables = S.tables.filter((t) => t.id !== sel.id); selTable = null; save(); render(); }
    };
    v.oninput = (e) => {
      if (e.target.id === 'pool-find') { poolFind = e.target.value; const pos = e.target.selectionStart; render(); const f = $('#pool-find'); f.focus(); f.setSelectionRange(pos, pos); }
    };
    v.onchange = (e) => { const k = e.target.dataset.t; if (k && sel) { sel[k] = k === 'seats' ? Math.max(1, Math.min(30, num(e.target.value) || 1)) : e.target.value.trim() || sel.name; save(); render(); } };
    v.onpointerdown = onPointerDown;
  }
  function tidy(all) {
    const rows = Math.max(2, Math.ceil(S.tables.length / 4));
    S.tables.forEach((t, i) => { if (all || t.x == null) { t.x = 14 + (i % 4) * 24; t.y = ((Math.floor(i / 4) + 0.5) / rows) * 100; } });
  }

  let drag = null;
  function onPointerDown(e) {
    if (e.button > 0) return;
    const g = e.target.closest('[data-guest]'), m = e.target.closest('[data-move]');
    if (!g && !m) return;
    drag = { kind: g ? 'guest' : 'table', id: g ? g.dataset.guest : m.dataset.move, el: g || m.closest('.table'), x0: e.clientX, y0: e.clientY, moved: false, pid: e.pointerId };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp, { once: true });
    document.addEventListener('pointercancel', onPointerCancel, { once: true });
  }
  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    e.preventDefault();
    if (!drag.moved) {
      drag.moved = true;
      if (drag.kind === 'guest') { drag.ghost = drag.el.cloneNode(true); drag.ghost.classList.add('drag-ghost'); document.body.appendChild(drag.ghost); drag.el.style.opacity = '.35'; }
      else { drag.floor = $('#floor').getBoundingClientRect(); }
    }
    if (drag.kind === 'guest') {
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]');
      $$('.over').forEach((x) => x !== over && x.classList.remove('over'));
      if (over) over.classList.add('over');
      drag.target = over?.dataset.drop;
    } else {
      const f = drag.floor;
      const x = Math.min(95, Math.max(5, ((e.clientX - f.left) / f.width) * 100)), y = Math.min(92, Math.max(8, ((e.clientY - f.top) / f.height) * 100));
      drag.el.style.left = x + '%'; drag.el.style.top = y + '%'; drag.pos = { x, y };
    }
  }
  function onPointerUp() {
    document.removeEventListener('pointermove', onPointerMove);
    const d = drag; drag = null;
    if (!d) return;
    d.ghost?.remove(); $$('.over').forEach((x) => x.classList.remove('over'));
    if (d.kind === 'guest') {
      const g = S.guests.find((x) => x.id === d.id);
      if (d.moved) { if (d.target != null) { seat(g, d.target === 'pool' ? '' : d.target); } else render(); }
      else if (selTable && g.table !== selTable) seat(g, selTable); // tap-to-seat
      else if (g.table) { selTable = g.table; render(); }
    } else {
      const t = S.tables.find((x) => x.id === d.id);
      if (d.moved && d.pos) { t.x = Math.round(d.pos.x * 10) / 10; t.y = Math.round(d.pos.y * 10) / 10; save(); }
      else { selTable = selTable === t.id ? null : t.id; render(); }
    }
  }
  function onPointerCancel() { document.removeEventListener('pointermove', onPointerMove); drag?.ghost?.remove(); drag = null; render(); }
  function seat(g, tableId) {
    const t = S.tables.find((x) => x.id === tableId);
    if (t) { const n = S.guests.filter((x) => x.table === t.id && x.rsvp !== 'Declined' && x.id !== g.id).length; if (n >= t.seats) { toast(`${t.name} is full`); render(); return; } }
    g.table = tableId; save(); render();
    toast(t ? `${g.name} → ${t.name}` : `${g.name} unseated`);
  }

  // ══════ BUDGET ══════
  function budget(v) {
    const cats = [...new Set(S.budget.map((b) => b.cat))];
    const tot = (k) => S.budget.reduce((a, b) => a + num(b[k]), 0);
    const total = num(S.couple.total);
    v.innerHTML = `${head('The <em>Budget</em>', 'Estimate first, then fill in actual costs and payments. Totals update as you type.', 'crown-imperial')}
      <div class="grid g4">
        <div class="card wash"><div class="label">Total budget</div><div class="row" style="margin-top:6px"><input class="f" data-c="currency" value="${esc(S.couple.currency)}" style="width:52px" aria-label="Currency symbol"><input class="f" data-c="total" type="number" inputmode="decimal" value="${esc(S.couple.total)}" placeholder="0" style="flex:1;width:100px"></div></div>
        <div class="card stat"><div class="label">Estimated</div><div class="n" id="b-est">${money(tot('est'))}</div></div>
        <div class="card stat"><div class="label">Actual</div><div class="n" id="b-act">${money(tot('act'))}</div><div class="bar"><i id="b-bar" style="width:${Math.min(100, (tot('act') / (total || tot('est') || 1)) * 100)}%"></i></div></div>
        <div class="card stat"><div class="label">Left to pay</div><div class="n" id="b-left">${money(tot('act') - tot('paid'))}</div></div>
      </div>
      <p class="note" id="b-over" style="margin:10px 0;color:var(--danger)">${total && tot('est') > total ? `Estimates are ${money(tot('est') - total)} over budget.` : ''}</p>
      <div class="card scroll" style="padding:0">
        <table class="tbl"><thead><tr><th>Item</th><th class="num">Estimated</th><th class="num">Actual</th><th class="num">Paid</th><th class="num">Balance</th><th></th></tr></thead>
        ${cats.map((c) => `<tbody><tr><td colspan="6" style="background:var(--wash);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--sec);font-weight:400;padding:8px">${esc(c)} <button class="icon" style="font-size:12px;letter-spacing:.1em;color:var(--sec)" data-addrow="${esc(c)}">+ add</button></td></tr>
          ${S.budget.filter((b) => b.cat === c).map((b) => `<tr data-id="${b.id}"><td><input data-k="item" value="${esc(b.item)}" style="min-width:150px"></td>${['est', 'act', 'paid'].map((k) => `<td><input class="num" data-k="${k}" type="number" inputmode="decimal" value="${esc(b[k])}" placeholder="0" style="min-width:80px"></td>`).join('')}<td class="num" data-bal>${b.act !== '' ? money(num(b.act) - num(b.paid)) : ''}</td><td><button class="icon" data-del="${b.id}" aria-label="Remove">×</button></td></tr>`).join('')}</tbody>`).join('')}
        <tfoot><tr><td>Total</td><td class="num" id="t-est">${money(tot('est'))}</td><td class="num" id="t-act">${money(tot('act'))}</td><td class="num" id="t-paid">${money(tot('paid'))}</td><td class="num" id="t-bal">${money(tot('act') - tot('paid'))}</td><td></td></tr></tfoot></table>
      </div>`;
    const refresh = () => {
      const est = tot('est'), act = tot('act'), paid = tot('paid'), t = num(S.couple.total);
      $('#b-est').textContent = $('#t-est').textContent = money(est); $('#b-act').textContent = $('#t-act').textContent = money(act);
      $('#t-paid').textContent = money(paid); $('#b-left').textContent = $('#t-bal').textContent = money(act - paid);
      $('#b-bar').style.width = Math.min(100, (act / (t || est || 1)) * 100) + '%';
      $('#b-over').textContent = t && est > t ? `Estimates are ${money(est - t)} over budget.` : '';
    };
    v.oninput = (e) => {
      const c = e.target.dataset.c; if (c) { S.couple[c] = e.target.value; save(); refresh(); return; }
      const tr = e.target.closest('tr[data-id]'); if (!tr) return;
      const b = S.budget.find((x) => x.id === tr.dataset.id); b[e.target.dataset.k] = e.target.value; save();
      $('[data-bal]', tr).textContent = b.act !== '' ? money(num(b.act) - num(b.paid)) : ''; refresh();
    };
    v.onclick = (e) => {
      const a = e.target.closest('[data-addrow]'); if (a) { S.budget.push({ id: uid(), cat: a.dataset.addrow, item: 'New item', est: '', act: '', paid: '' }); save(); render(); }
      const d = e.target.closest('[data-del]'); if (d) { S.budget = S.budget.filter((b) => b.id !== d.dataset.del); save(); render(); }
    };
    v.onchange = null;
  }

  // ══════ CHECKLIST ══════
  function checklist(v) {
    const tasks = allTasks(), done = tasks.filter((t) => S.done[t.id]).length;
    v.innerHTML = `${head('Wedding <em>Checklist</em>', 'From twelve months out to the thank-you notes. Tick things off as you go.', 'columbine')}
      <div class="card wash" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><div class="label">${done} of ${tasks.length} done</div><div class="label">${Math.round((done / tasks.length) * 100)}%</div></div><div class="bar"><i style="width:${(done / tasks.length) * 100}%"></i></div></div>
      <div class="grid g2">${D.checklist.map((g, gi) => `<div class="card"><h2>${esc(g.when)}</h2><ul class="ck">${g.items.map((t, i) => { const id = `${gi}-${i}`; return `<li class="${S.done[id] ? 'done' : ''}"><input type="checkbox" id="c${id}" data-id="${id}" ${S.done[id] ? 'checked' : ''}><label for="c${id}"><span>${esc(t)}</span></label></li>`; }).join('')}</ul></div>`).join('')}</div>`;
    v.onchange = (e) => { const id = e.target.dataset.id; if (!id) return; if (e.target.checked) S.done[id] = true; else delete S.done[id]; save(); render(); };
    v.onclick = null; v.oninput = null;
  }

  // ══════ VENDORS ══════
  // OpenStreetMap tags for categories that have shops or premises. Service-only vendors
  // (DJs, active bars, officiants…) rarely appear in maps data, so those use search links.
  const OSM = {
    'Venues': ['"amenity"="events_venue"'],
    'Catering': ['"craft"="caterer"'],
    'Photographers': ['"craft"="photographer"', '"shop"="photo"'],
    'Bars & Alcohol': ['"shop"="alcohol"', '"shop"="wine"', '"shop"="beverages"'],
    'Florists & Designers': ['"shop"="florist"'],
    'Hair & Makeup': ['"shop"="beauty"', '"shop"="hairdresser"'],
    'Cakes & Desserts': ['"shop"="pastry"', '"shop"="confectionery"'],
    'Stationery': ['"shop"="stationery"', '"shop"="copyshop"', '"craft"="printer"'],
    'Transportation': ['"amenity"="car_rental"'],
    'Rentals & Lighting': ['"shop"="party"'],
  };
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
  let vCat = 'Photographers', loc = null, results = {}, curated = null, busy = false;

  function detectCountry() {
    if (S.country && COUNTRIES[S.country]) return S.country;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    for (const [code, c] of Object.entries(COUNTRIES)) if (c.tz.some((t) => (t.endsWith('/') ? tz.startsWith(t) : tz === t))) return code;
    for (const l of navigator.languages || []) { const r = (l.split('-')[1] || '').toUpperCase(); if (COUNTRIES[r]) return r; if (l.startsWith('he')) return 'IL'; }
    return 'OTHER';
  }
  const dist = (a, b) => { const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLon = ((b.lon - a.lon) * Math.PI) / 180; const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

  async function overpass(q) {
    for (const url of OVERPASS) {
      try {
        const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        if (r.ok) return await r.json();
      } catch (e) { /* try the next server */ }
    }
    throw new Error('Map servers are busy');
  }
  async function findNear() {
    if (!loc || !OSM[vCat]) return;
    const key = `${vCat}|${loc.lat.toFixed(3)}|${loc.lon.toFixed(3)}`;
    if (results[key]) return;
    busy = true; render();
    const R = 15000;
    const q = `[out:json][timeout:25];(${OSM[vCat].map((t) => `nwr[${t}][name](around:${R},${loc.lat},${loc.lon});`).join('')});out center tags 120;`;
    try {
      const d = await overpass(q);
      results[key] = d.elements.map((e) => {
        const t = e.tags || {}, p = { lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon };
        return {
          id: `${e.type}/${e.id}`, name: t.name, km: p.lat ? dist(loc, p) : null, lat: p.lat, lon: p.lon,
          address: [[t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '), t['addr:city']].filter(Boolean).join(', '),
          phone: t.phone || t['contact:phone'] || '', website: t.website || t['contact:website'] || '', instagram: t['contact:instagram'] || '',
        };
      }).sort((a, b) => (a.km ?? 99) - (b.km ?? 99)).slice(0, 40);
    } catch (e) { results[key] = { error: true }; }
    busy = false; render();
  }
  async function locateByCity(city, country) {
    const cc = country !== 'OTHER' ? `&countrycodes=${country.toLowerCase()}` : '';
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1${cc}&q=${encodeURIComponent(city)}`, { headers: { 'Accept-Language': 'en' } });
    const d = await r.json();
    if (!d[0]) throw new Error('not found');
    return { lat: +d[0].lat, lon: +d[0].lon, label: d[0].display_name.split(',').slice(0, 2).join(',') };
  }

  function vendors(v) {
    const country = detectCountry(), C = COUNTRIES[country];
    const terms = TERMS[C.lang] || TERMS.en;
    const term = terms[CATEGORIES.indexOf(vCat)] || vCat;
    const q = S.city ? `${term} ${S.city}` : term;
    if (curated === null) { curated = []; fetch('../vendors.json', { cache: 'no-store' }).then((r) => r.json()).then((d) => { curated = d.vendors || []; if (tab === 'vendors') render(); }).catch(() => {}); }
    const cur = curated.filter((x) => x.country === country && x.category === vCat);
    const key = loc && `${vCat}|${loc.lat.toFixed(3)}|${loc.lon.toFixed(3)}`;
    const res = key ? results[key] : null;
    const savedIds = new Set(S.saved.map((s) => s.id));
    const card = (x, src) => `<div class="card vcard">
      <div class="label" style="color:var(--sec)">${esc(vCat)}${x.km != null ? ` · ${x.km < 1 ? Math.round(x.km * 1000) + ' m' : x.km.toFixed(1) + ' km'}` : ''}${x.sample ? ' · sample listing' : ''}</div>
      <h3 dir="auto">${esc(x.name)}</h3>
      <div class="meta" dir="auto">${esc(x.address || x.city || '')}${x.phone ? ` · <a href="tel:${esc(x.phone.replace(/[^+\d]/g, ''))}">${esc(x.phone)}</a>` : ''}</div>
      ${x.description ? `<p class="note">${esc(x.description)}</p>` : ''}
      <div class="links">
        ${/^https?:/.test(x.website) ? `<a href="${esc(x.website)}" target="_blank" rel="noopener">Website</a>` : ''}
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.lat ? `${x.name} ${x.lat},${x.lon}` : `${x.name} ${x.city || ''}`)}" target="_blank" rel="noopener">Map & reviews</a>
        <button data-save='${esc(JSON.stringify({ id: x.id || x.name, name: x.name, cat: vCat, phone: x.phone || '', website: x.website || '', src }))}' ${savedIds.has(x.id || x.name) ? 'disabled' : ''}>${savedIds.has(x.id || x.name) ? 'Saved ✓' : 'Save'}</button>
      </div></div>`;

    v.innerHTML = `${head('Vendors <em>Near You</em>', 'Pick a category to see real businesses around you, plus searches in your language and your country’s wedding marketplaces.', 'gloriosa')}
      <div class="card wash"><div class="row">
        <label class="label">Country <select class="f" id="v-country" style="display:block;margin-top:4px">${Object.entries(COUNTRIES).sort((a, b) => (a[0] === 'OTHER') - (b[0] === 'OTHER') || a[1].name.localeCompare(b[1].name)).map(([k, c]) => `<option value="${k}" ${k === country ? 'selected' : ''}>${c.flag} ${esc(c.name)}</option>`).join('')}</select></label>
        <label class="label" style="flex:1 1 180px">City <input class="f" id="v-city" value="${esc(S.city)}" placeholder="e.g. Tel Aviv" style="display:block;width:100%;margin-top:4px"></label>
        <div style="display:flex;gap:8px;align-self:flex-end"><button class="btn small sec" data-act="city">Search this city</button><button class="btn small ghost" data-act="gps">Use my location</button></div>
      </div>${loc ? `<p class="note" style="margin-top:8px">Searching around <b style="font-weight:400">${esc(loc.label)}</b> (15 km).</p>` : ''}</div>
      <div class="cats">${CATEGORIES.map((c) => `<button class="cat ${c === vCat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}${OSM[c] ? '<span class="auto" title="Automatic results"></span>' : ''}</button>`).join('')}</div>
      <p class="note" style="margin:-8px 0 14px"><span class="cat" style="pointer-events:none;padding:0;border:0"><span class="auto" style="margin:0 4px 0 0"></span></span>Green dot: real businesses are listed automatically for your area.</p>

      ${cur.length ? `<h2>Recommended</h2><div class="grid g2" style="margin-bottom:18px">${cur.map((x) => card(x, 'curated')).join('')}</div>` : ''}

      ${OSM[vCat] ? `<h2>Near you <em>· automatic</em></h2>
        ${!loc ? '<div class="empty">Type your city and tap “Search this city”, or use your location, to list real businesses around you.</div>'
        : busy ? '<div class="empty">Finding vendors near you…</div>'
        : res?.error ? '<div class="empty">The map servers are busy right now. Please try again in a minute.</div>'
        : res && !res.length ? '<div class="empty">No listings found nearby in the map data. Try the searches below.</div>'
        : res ? `<div class="grid g2">${res.map((x) => card(x, 'osm')).join('')}</div><p class="note" style="margin-top:8px">Listings © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors. Check details with each vendor.</p>` : ''}`
        : `<div class="empty">${esc(vCat)} usually work from home or on the road, so map data rarely lists them. Use the searches below for current results in your area.</div>`}

      <h2 style="margin-top:22px">Search <em dir="auto">${esc(term)}</em></h2>
      <div class="card"><div class="links" style="border:0;margin:0;padding:0">
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}" target="_blank" rel="noopener">Google Maps</a>
        <a href="https://www.google.com/search?q=${encodeURIComponent(q + ' reviews')}" target="_blank" rel="noopener">Reviews</a>
        <a href="https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(term)}" target="_blank" rel="noopener">Instagram</a>
        ${C.sites.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join('')}
      </div></div>

      <h2 style="margin-top:22px">My vendors <span class="pill">${S.saved.length}</span></h2>
      ${S.saved.length ? `<div class="card scroll" style="padding:0"><table class="tbl"><thead><tr><th>Vendor</th><th>Category</th><th>Phone</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody>
        ${S.saved.map((s) => `<tr data-sid="${esc(s.id)}"><td dir="auto">${/^https?:/.test(s.website) ? `<a href="${esc(s.website)}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(s.name)}</td><td>${esc(s.cat)}</td><td>${s.phone ? `<a href="tel:${esc(s.phone.replace(/[^+\d]/g, ''))}">${esc(s.phone)}</a>` : ''}</td>
          <td><select data-sk="status">${['Researching', 'Contacted', 'Quoted', 'Booked', 'Not chosen'].map((o) => `<option ${o === s.status ? 'selected' : ''}>${o}</option>`).join('')}</select></td>
          <td><input data-sk="notes" value="${esc(s.notes)}" placeholder="Price, date, contact…" style="min-width:160px"></td><td><button class="icon" data-unsave="${esc(s.id)}">×</button></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">Tap “Save” on any vendor to keep it here and track quotes and bookings.</div>'}`;

    v.onclick = async (e) => {
      const c = e.target.closest('[data-cat]'); if (c) { vCat = c.dataset.cat; render(); findNear(); return; }
      const sv = e.target.closest('[data-save]'); if (sv) { const x = JSON.parse(sv.dataset.save); S.saved.push({ ...x, status: 'Researching', notes: '' }); save(); render(); toast(`${x.name} saved`); return; }
      const un = e.target.closest('[data-unsave]'); if (un) { S.saved = S.saved.filter((s) => s.id !== un.dataset.unsave); save(); render(); return; }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'city') {
        const city = $('#v-city').value.trim(); if (!city) return toast('Type a city first');
        S.city = city; save();
        try { loc = await locateByCity(city, country); render(); findNear(); } catch (err) { toast('City not found. Check the spelling.'); }
      }
      if (a === 'gps') {
        if (!navigator.geolocation) return toast('Location is not available on this device');
        navigator.geolocation.getCurrentPosition((p) => { loc = { lat: p.coords.latitude, lon: p.coords.longitude, label: 'your location' }; render(); findNear(); }, () => toast('Location permission was not given'), { timeout: 10000 });
      }
    };
    v.onchange = (e) => {
      if (e.target.id === 'v-country') { S.country = e.target.value; save(); render(); return; }
      const tr = e.target.closest('tr[data-sid]'); if (!tr) return;
      const s = S.saved.find((x) => x.id === tr.dataset.sid); s[e.target.dataset.sk] = e.target.value; save();
    };
    v.oninput = (e) => { const tr = e.target.closest('tr[data-sid]'); if (tr && e.target.dataset.sk === 'notes') { S.saved.find((x) => x.id === tr.dataset.sid).notes = e.target.value; save(); } };
  }

  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
