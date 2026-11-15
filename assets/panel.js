/* Panele demo: wspólne narzędzia (bez zewnętrznych bibliotek).
   Każdy panel używa obiektu P: formatowanie, daty, zakładki, tabele, okna, powiadomienia. */
(function () {
  'use strict';
  var P = window.P = {};

  /* ---------- Tekst i liczby ---------- */
  P.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  P.num = function (n, d) {
    d = d || 0;
    return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  };
  P.zl = function (n, d) { return P.num(n, d || 0) + ' zł'; };
  /* odmiana: 1 faktura, 2 faktury, 5 faktur */
  P.plural = function (n, one, few, many) {
    n = Math.abs(Math.round(n));
    if (n === 1) return one;
    var d = n % 10, h = n % 100;
    return (d >= 2 && d <= 4 && (h < 12 || h > 14)) ? few : many;
  };
  P.n = function (n, one, few, many) { return P.num(n) + ' ' + P.plural(n, one, few, many); };
  P.pct = function (n, d) { return P.num(n, d || 0) + ' %'; };

  /* ---------- Daty (zawsze względem dzisiejszego dnia, żeby demo nie starzało się) ---------- */
  var DOW = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
  var DOW_S = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
  var MON_G = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  var MON = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
  P.MON = MON;
  P.today = function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  P.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  P.days = function (a, b) { return Math.round((b - a) / 86400000); };
  P.isWeekend = function (d) { var w = d.getDay(); return w === 0 || w === 6; };
  /* dzień roboczy: dziś, a w weekend ostatni piątek */
  P.workday = function (d) { d = new Date(d || P.today()); while (P.isWeekend(d)) d = P.addDays(d, -1); return d; };
  P.monday = function (d) { var x = new Date(d); var w = (x.getDay() + 6) % 7; return P.addDays(x, -w); };
  P.addWorkdays = function (d, n) { var x = new Date(d), s = n < 0 ? -1 : 1, k = Math.abs(n); while (k > 0) { x = P.addDays(x, s); if (!P.isWeekend(x)) k--; } return x; };
  P.workdaysInMonth = function (y, m) { var n = 0, d = new Date(y, m, 1); while (d.getMonth() === m) { if (!P.isWeekend(d)) n++; d = P.addDays(d, 1); } return n; };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  P.d = function (d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1); };
  P.dy = function (d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); };
  P.dLong = function (d) { return d.getDate() + ' ' + MON_G[d.getMonth()]; };
  P.dow = function (d) { return DOW[d.getDay()]; };
  P.dowS = function (d) { return DOW_S[d.getDay()]; };
  P.dayTitle = function (d) { var s = P.dow(d); return s.charAt(0).toUpperCase() + s.slice(1) + ', ' + P.dLong(d) + ' ' + d.getFullYear(); };
  P.hm = function (min) { return Math.floor(min / 60) + ':' + pad(min % 60); };
  P.iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  P.fromIso = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  /* „za 3 dni”, „2 dni temu”, „dziś” */
  P.rel = function (d) {
    var n = P.days(P.today(), d);
    if (n === 0) return 'dziś';
    if (n === 1) return 'jutro';
    if (n === -1) return 'wczoraj';
    return n > 0 ? 'za ' + n + ' dni' : (-n) + ' dni temu';
  };

  /* ---------- Losowanie powtarzalne (te same dane przy każdym otwarciu) ---------- */
  P.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  P.pick = function (r, arr) { return arr[Math.floor(r() * arr.length)]; };
  P.int = function (r, a, b) { return a + Math.floor(r() * (b - a + 1)); };

  /* ---------- Elementy ---------- */
  P.$ = function (sel, root) { return (root || document).querySelector(sel); };
  P.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  P.chip = function (text, tone) { return '<span class="chip ' + (tone || '') + '">' + P.esc(text) + '</span>'; };
  P.prog = function (pct, tone, label) {
    var w = Math.max(0, Math.min(100, pct));
    return '<div class="prog"><div class="prog-t"><div class="prog-f ' + (tone || '') + '" style="width:' + w + '%"></div></div><span class="prog-v">' + (label != null ? label : P.num(pct) + '%') + '</span></div>';
  };

  /* pasek podsumowania: [{label, value, note, tone}] */
  P.strip = function (el, items) {
    el.className = 'strip';
    el.innerHTML = items.map(function (it) {
      return '<div class="stat ' + (it.tone || '') + '"><div class="stat-l">' + P.esc(it.label) + '</div>' +
        '<div class="stat-v">' + it.value + '</div>' +
        (it.note ? '<div class="stat-n">' + it.note + '</div>' : '') + '</div>';
    }).join('');
  };

  /* paski poziome: [{label, value (liczba), text, tone, mark (0–100)}], opts.max */
  P.bars = function (el, items, opts) {
    opts = opts || {};
    var max = opts.max || Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    el.className = 'bars';
    el.innerHTML = items.map(function (it) {
      var w = Math.max(0, Math.min(100, it.value / max * 100));
      return '<div class="bar-row"><span class="bar-l" title="' + P.esc(it.label) + '">' + P.esc(it.label) + '</span>' +
        '<span class="bar-t"><span class="bar-f ' + (it.tone || '') + '" style="display:block;width:' + w + '%"></span>' +
        (it.mark != null ? '<span class="bar-mark" style="left:' + Math.min(100, it.mark) + '%" title="' + P.esc(it.markTitle || '') + '"></span>' : '') +
        '</span><span class="bar-v">' + (it.text != null ? it.text : P.num(it.value)) + '</span></div>';
    }).join('');
  };

  /* tabela z sortowaniem
     cols: [{key, label, num, html(row), val(row), sort:false}]
     opts: {rows, onRow(row), empty, rowClass(row), foot (html <tr>…</tr>)} */
  P.table = function (el, cols, opts) {
    var st = el._sort || (el._sort = { key: opts.sortKey || null, dir: opts.sortDir || 1 });
    var rows = opts.rows.slice();
    if (st.key) {
      var c = cols.filter(function (x) { return x.key === st.key; })[0];
      if (c) {
        var v = c.val || function (r) { return r[c.key]; };
        rows.sort(function (a, b) {
          var x = v(a), y = v(b);
          if (x == null) return 1; if (y == null) return -1;
          return (typeof x === 'string' ? x.localeCompare(y, 'pl') : x - y) * st.dir;
        });
      }
    }
    var head = '<tr>' + cols.map(function (c) {
      var s = c.sort !== false && (c.val || c.key);
      var arr = st.key === c.key ? '<span class="arr">' + (st.dir > 0 ? '▲' : '▼') + '</span>' : '';
      return '<th class="' + (c.num ? 'num ' : '') + (s ? 'sortable' : '') + '" data-k="' + (s ? c.key : '') + '"' +
        (s ? ' tabindex="0" aria-sort="' + (st.key === c.key ? (st.dir > 0 ? 'ascending' : 'descending') : 'none') + '"' : '') + '>' + c.label + arr + '</th>';
    }).join('') + '</tr>';
    var body = rows.length ? rows.map(function (r, i) {
      return '<tr data-i="' + i + '" class="' + (opts.onRow ? 'click ' : '') + (opts.rowClass ? opts.rowClass(r) : '') + '">' + cols.map(function (c) {
        var h = c.html ? c.html(r) : P.esc(r[c.key]);
        return '<td class="' + (c.num ? 'num' : '') + '">' + h + '</td>';
      }).join('') + '</tr>';
    }).join('') : '<tr><td class="empty" colspan="' + cols.length + '">' + (opts.empty || 'Brak pozycji.') + '</td></tr>';
    el.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead>' + head + '</thead><tbody>' + body + '</tbody>' + (opts.foot ? '<tfoot>' + opts.foot + '</tfoot>' : '') + '</table></div>';
    P.$$('th.sortable', el).forEach(function (th) {
      function go() {
        var k = th.getAttribute('data-k');
        if (st.key === k) st.dir = -st.dir; else { st.key = k; st.dir = 1; }
        P.table(el, cols, opts);
      }
      th.addEventListener('click', go);
      th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    if (opts.onRow) P.$$('tbody tr[data-i]', el).forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('button, a, input, select')) return;
        opts.onRow(rows[+tr.getAttribute('data-i')]);
      });
    });
    return rows;
  };

  /* przełącznik: [{v, l}], wartość bieżąca, funkcja(v) */
  P.seg = function (el, items, cur, cb) {
    el.className = 'seg';
    el.setAttribute('role', 'group');
    el.innerHTML = items.map(function (it) {
      return '<button type="button" data-v="' + P.esc(it.v) + '" aria-pressed="' + (String(it.v) === String(cur)) + '">' + P.esc(it.l) + '</button>';
    }).join('');
    P.$$('button', el).forEach(function (b) { b.addEventListener('click', function () { cb(b.getAttribute('data-v')); }); });
  };
  /* lista rozwijana: [{v, l}] */
  P.options = function (items, cur) {
    return items.map(function (it) { return '<option value="' + P.esc(it.v) + '"' + (String(it.v) === String(cur) ? ' selected' : '') + '>' + P.esc(it.l) + '</option>'; }).join('');
  };

  /* ---------- Okno ---------- */
  /* P.modal({title, sub, body (html), wide, actions:[{label, primary, ghost, onClick(close, dlg)}]}) */
  P.modal = function (o) {
    var d = document.createElement('dialog');
    d.className = 'modal' + (o.wide ? ' wide' : '');
    d.innerHTML = '<div class="modal-h"><div><h2>' + P.esc(o.title) + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' +
      '<button class="modal-x" aria-label="Zamknij">×</button></div>' +
      '<div class="modal-b">' + (o.body || '') + '</div>' +
      ((o.actions && o.actions.length) ? '<div class="modal-f"></div>' : '');
    document.body.appendChild(d);
    function close() { d.close(); }
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    P.$('.modal-x', d).addEventListener('click', close);
    var f = P.$('.modal-f', d);
    (o.actions || []).forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'btn' + (a.primary ? ' primary' : '') + (a.ghost ? ' ghost' : '');
      b.textContent = a.label;
      b.addEventListener('click', function () { if (a.onClick) a.onClick(close, d); else close(); });
      f.appendChild(b);
    });
    d.showModal();
    if (o.onOpen) o.onOpen(d);
    return d;
  };

  /* ---------- Powiadomienie ---------- */
  var toastEl, toastT;
  P.toast = function (msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  };

  /* ---------- Zakładki ----------
     <button class="tab" data-tab="oplaty"> + <section data-panel="oplaty">; adres #oplaty otwiera zakładkę.
     P.views[nazwa] = funkcja rysująca zakładkę (wywoływana przy każdym otwarciu). */
  P.views = {};
  P.show = function (name) {
    var tabs = P.$$('.tab[data-tab]');
    if (!tabs.some(function (t) { return t.getAttribute('data-tab') === name; })) name = tabs[0].getAttribute('data-tab');
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === name)); });
    P.$$('section[data-panel]').forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-panel') === name); });
    if (P.views[name]) P.views[name]();
    P.current = name;
  };
  P.refresh = function () { if (P.current && P.views[P.current]) P.views[P.current](); };
  P.initTabs = function () {
    P.$$('.tab[data-tab]').forEach(function (t) {
      t.setAttribute('role', 'tab');
      t.addEventListener('click', function () {
        var n = t.getAttribute('data-tab');
        if (location.hash !== '#' + n) history.replaceState(null, '', '#' + n);
        P.show(n);
      });
    });
    window.addEventListener('hashchange', function () { P.show(location.hash.slice(1)); });
    P.show(location.hash.slice(1));
  };
})();
