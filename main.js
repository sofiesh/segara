(() => {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_DEPTH = 300; // meter längst ner på sidan

  /* ---------- Djup: bakgrund + mätare följer scroll ---------- */
  const top = [15, 107, 122];  // #0f6b7a (ytan)
  const deep = [2, 11, 20];    // #020b14 (botten)
  const depthEl = document.getElementById('depth');
  const fill = document.getElementById('gaugeFill');
  const diver = document.getElementById('diver');
  let lastY = 0, settle;

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    const c = top.map((v, i) => Math.round(v + (deep[i] - v) * p));
    document.documentElement.style.setProperty('--bg', `rgb(${c})`);
    depthEl.textContent = Math.round(p * MAX_DEPTH);
    fill.style.height = (p * 100) + '%';
    diver.style.top = (p * 100) + '%';
    if (!reduceMotion) {
      const dir = scrollY - lastY; lastY = scrollY;
      diver.style.transform = `rotate(${Math.max(-25, Math.min(25, dir * 1.5))}deg)`;
      clearTimeout(settle);
      settle = setTimeout(() => { diver.style.transform = 'rotate(0deg)'; }, 150);
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Vågor i hero ---------- */
  const canvas = document.getElementById('waves');
  const ctx = canvas.getContext('2d');
  let w, h, t = 0;

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width = r.width * dpr;
    h = canvas.height = r.height * dpr;
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 12) {
        const y = h * (0.35 + i * 0.16) + Math.sin(x / (160 + i * 60) + t * (1 + i * .3)) * (14 + i * 6);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = `rgba(2, 11, 20, ${0.10 + i * 0.07})`;
      ctx.fill();
    }
  }
  function loop() { t += 0.012; draw(); if (!reduceMotion) requestAnimationFrame(loop); }
  size(); addEventListener('resize', () => { size(); draw(); });
  loop();

  /* ---------- Språk ---------- */
  const DICT = window.I18N;
  let lang = 'sv';
  let current = null; // vald kurs
  try { lang = localStorage.getItem('lang'); } catch (e) {}
  if (!DICT[lang]) lang = (navigator.language || '').toLowerCase().startsWith('sv') ? 'sv' : 'en';
  const tr = k => DICT[lang][k];

  const answer = document.getElementById('answer');
  const chips = document.querySelectorAll('.chip');

  function renderAnswer() {
    if (!current) { answer.innerHTML = `<p class="muted">${tr('c.none')}</p>`; return; }
    answer.innerHTML = `<h3>${tr(`r.${current}.t`)}</h3><ul>${tr(`r.${current}.p`).map(x => `<li>${x}</li>`).join('')}</ul>
      <p><a href="#flaskpost">${tr('c.talk')}</a></p>`;
  }

  // Loggbok: lägg till inlägg här, med text per språk
  const posts = [
    // { date: '2026-11-11', href: '#', sv: { title: '', text: '' }, en: { title: '', text: '' } },
  ];
  function renderLog() {
    document.getElementById('log').innerHTML = posts.length
      ? posts.map(p => `<li><time datetime="${p.date}">${p.date}</time><h3><a href="${p.href}">${p[lang].title}</a></h3><p>${p[lang].text}</p></li>`).join('')
      : `<li><h3>${tr('log.empty.t')}</h3><p class="muted">${tr('log.empty.p')}</p></li>`;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = tr('meta.title');
    document.querySelector('meta[name=description]').content = tr('meta.desc');
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = tr(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', tr(el.dataset.i18nAria)));
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    renderAnswer();
    renderLog();
  }

  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    try { localStorage.setItem('lang', lang); } catch (e) {}
    applyLang();
  }));

  chips.forEach(btn => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      current = btn.dataset.key;
      chips.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      renderAnswer();
    });
  });

  /* ---------- Flaskpost (tills ett riktigt backend finns) ---------- */
  const TO = 'hej@segara.se'; // TODO: byt till riktig adress
  document.getElementById('contact').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `${f.get('msg')}\n\n/ ${f.get('name')} (${f.get('email')})`;
    location.href = `mailto:${TO}?subject=${encodeURIComponent(tr('f.subject') + f.get('name'))}&body=${encodeURIComponent(body)}`;
    document.getElementById('formNote').textContent = tr('f.opening');
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  applyLang();
})();
