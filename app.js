'use strict';

let DATA = [];
let filter = 'all';
let view = 'search';
let deferredPrompt = null;

const labels = {
  boykot: '🔴 BOYKOT',
  dikkat: '🟠 DİKKAT',
  alternatif: '🟢 ALTERNATİF',
  inceleniyor: '⚪ İNCELENİYOR'
};

const search = document.getElementById('search');
const results = document.getElementById('results');
const stats = document.getElementById('stats');
const clearBtn = document.getElementById('clearBtn');
const detailDialog = document.getElementById('detailDialog');
const detailContent = document.getElementById('detailContent');
const closeDialog = document.getElementById('closeDialog');

function norm(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function pick(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function cleanStatus(value) {
  const s = norm(value || 'inceleniyor');
  if (s.includes('boykot')) return 'boykot';
  if (s.includes('dikkat')) return 'dikkat';
  if (s.includes('alternatif')) return 'alternatif';
  if (s.includes('ince')) return 'inceleniyor';
  return labels[s] ? s : 'inceleniyor';
}

function normalizeItem(item) {
  return {
    marka: String(pick(item, ['marka', 'Marka', 'brand', 'Brand']) || 'İsimsiz Marka').trim(),
    anaFirma: String(pick(item, ['anaFirma', 'anafirma', 'ana_firma', 'Ana Firma', 'AnaFirma', 'company', 'firma']) || '').trim(),
    kod: String(pick(item, ['kod', 'Kod', 'code']) || '').trim(),
    kategori: String(pick(item, ['kategori', 'Kategori', 'category']) || '').trim(),
    alternatif: String(pick(item, ['alternatif', 'Alternatif', 'alternative']) || '').trim(),
    kaynak: String(pick(item, ['kaynak', 'Kaynak', 'kanyak', 'source', 'link']) || '').trim(),
    not: String(pick(item, ['not', 'Not', 'note', 'aciklama']) || '').trim(),
    durum: cleanStatus(pick(item, ['durum', 'Durum', 'status']))
  };
}

async function init() {
  try {
    if (!results || !stats) throw new Error('index.html içinde results veya stats alanı eksik.');

    results.innerHTML = '<div class="empty">Yükleniyor...</div>';

    const url = 'data.json?v=' + Date.now();
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('data.json bulunamadı. Dosya adı küçük harfle data.json olmalı.');

    const json = await response.json();
    const rawList = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
    DATA = rawList.map(normalizeItem).filter(x => x.marka && x.marka !== 'İsimsiz Marka');

    if (!DATA.length) throw new Error('data.json içinde marka listesi bulunamadı.');

    render();
  } catch (err) {
    if (stats) stats.innerHTML = '';
    if (results) {
      results.innerHTML = `<div class="empty"><b>Hata oluştu.</b><br>${esc(err.message)}<br><br>Kontrol: index.html, app.js ve data.json aynı klasörde olmalı.</div>`;
    }
    console.error(err);
  }
}

function currentList() {
  const q = norm(search?.value || '');

  return DATA.filter(item => {
    const text = norm([
      item.marka,
      item.anaFirma,
      item.kod,
      item.kategori,
      item.alternatif,
      item.kaynak,
      item.not,
      item.durum
    ].join(' '));

    const okSearch = !q || text.includes(q);
    const okFilter = filter === 'all' || item.durum === filter;
    return okSearch && okFilter;
  }).sort((a, b) => a.marka.localeCompare(b.marka, 'tr'));
}

function renderStats() {
  const counts = {
    boykot: DATA.filter(x => x.durum === 'boykot').length,
    dikkat: DATA.filter(x => x.durum === 'dikkat').length,
    alternatif: DATA.filter(x => x.durum === 'alternatif').length,
    inceleniyor: DATA.filter(x => x.durum === 'inceleniyor').length
  };

  stats.innerHTML = `
    <div class="stat"><b>${counts.boykot}</b><small>Boykot</small></div>
    <div class="stat"><b>${counts.dikkat}</b><small>Dikkat</small></div>
    <div class="stat"><b>${counts.alternatif}</b><small>Alternatif</small></div>
    <div class="stat"><b>${counts.inceleniyor}</b><small>İnceleme</small></div>`;
}

function card(item) {
  return `<article class="card ${esc(item.durum)}" data-brand="${encodeURIComponent(item.marka)}">
    <div class="cardTop">
      <div>
        <div class="status">${labels[item.durum] || labels.inceleniyor}</div>
        <h2>${esc(item.marka)}</h2>
      </div>
      <div class="pill">${esc(item.kod || '-')}</div>
    </div>
    <div class="info">
      <span>Ana Firma</span><b>${esc(item.anaFirma || '-')}</b>
      <span>Kategori</span><b>${esc(item.kategori || '-')}</b>
      <span>Alternatif</span><b>${esc(item.alternatif || '-')}</b>
    </div>
  </article>`;
}

function renderSearch() {
  const list = currentList();
  renderStats();

  if (!list.length) {
    results.innerHTML = '<div class="empty">Sonuç bulunamadı.</div>';
    return;
  }

  results.innerHTML = list.map(card).join('');
}

function groupBy(key) {
  const map = new Map();
  DATA.forEach(item => {
    const name = item[key] || 'Belirtilmemiş';
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(item);
  });
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'tr'));
}

function renderCompanies() {
  renderStats();
  const groups = groupBy('anaFirma');
  results.innerHTML = groups.map(([name, items]) => `
    <div class="groupItem" data-company="${esc(name)}">
      <div><b>${esc(name)}</b><br><small>${items.length} marka</small></div>
      <span>›</span>
    </div>`).join('');
}

function renderCategories() {
  renderStats();
  const groups = groupBy('kategori');
  results.innerHTML = groups.map(([name, items]) => `
    <div class="groupItem" data-category="${esc(name)}">
      <div><b>${esc(name)}</b><br><small>${items.length} marka</small></div>
      <span>›</span>
    </div>`).join('');
}

function renderAbout() {
  stats.innerHTML = '';
  results.innerHTML = `
    <div class="empty" style="text-align:left">
      <h2>ℹ️ Kullanım</h2>
      <p>Bu uygulama <b>data.json</b> dosyasındaki markaları arar.</p>
      <p>Gerekli alanlar: <b>marka, anaFirma, durum, kod, kategori, alternatif, kaynak, not</b>.</p>
      <p>Durumlar: <b>boykot</b>, <b>dikkat</b>, <b>alternatif</b>, <b>inceleniyor</b>.</p>
      <p>GitHub’da yeni marka eklemek için sadece <b>data.json</b> dosyasını güncellemen yeterli.</p>
    </div>`;
}

function render() {
  if (view === 'companies') return renderCompanies();
  if (view === 'categories') return renderCategories();
  if (view === 'about') return renderAbout();
  renderSearch();
}

function setNav(nextView) {
  document.querySelectorAll('.bottomNav button').forEach(button => {
    button.classList.toggle('navActive', button.dataset.view === nextView);
  });
}

search?.addEventListener('input', () => {
  view = 'search';
  setNav(view);
  render();
});

clearBtn?.addEventListener('click', () => {
  if (!search) return;
  search.value = '';
  search.focus();
  view = 'search';
  setNav(view);
  render();
});

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    filter = button.dataset.filter || 'all';
    view = 'search';
    setNav(view);
    render();
  });
});

document.querySelectorAll('.bottomNav button').forEach(button => {
  button.addEventListener('click', () => {
    view = button.dataset.view || 'search';
    setNav(view);
    render();
  });
});

results?.addEventListener('click', event => {
  const cardEl = event.target.closest('[data-brand]');
  if (cardEl) {
    const name = decodeURIComponent(cardEl.dataset.brand || '');
    const item = DATA.find(x => x.marka === name);
    showDetail(item);
    return;
  }

  const companyEl = event.target.closest('[data-company]');
  if (companyEl && search) {
    search.value = companyEl.dataset.company || '';
    view = 'search';
    setNav(view);
    render();
    return;
  }

  const categoryEl = event.target.closest('[data-category]');
  if (categoryEl && search) {
    search.value = categoryEl.dataset.category || '';
    view = 'search';
    setNav(view);
    render();
  }
});

function showDetail(item) {
  if (!item || !detailContent || !detailDialog) return;

  const kaynak = item.kaynak
    ? `<p><a href="${esc(item.kaynak)}" target="_blank" rel="noopener noreferrer">Kaynağı aç</a></p>`
    : '';

  detailContent.innerHTML = `
    <h2>${labels[item.durum] || labels.inceleniyor}<br>${esc(item.marka)}</h2>
    <p><b>Ana Firma:</b> ${esc(item.anaFirma || '-')}</p>
    <p><b>Kategori:</b> ${esc(item.kategori || '-')}</p>
    <p><b>Kod:</b> ${esc(item.kod || '-')}</p>
    <p><b>Alternatif:</b> ${esc(item.alternatif || '-')}</p>
    <p><b>Not:</b> ${esc(item.not || '-')}</p>
    ${kaynak}`;

  if (typeof detailDialog.showModal === 'function') detailDialog.showModal();
  else detailDialog.setAttribute('open', '');
}

closeDialog?.addEventListener('click', () => {
  if (!detailDialog) return;
  if (typeof detailDialog.close === 'function') detailDialog.close();
  else detailDialog.removeAttribute('open');
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  const installBtn = document.getElementById('installBtn');
  if (!installBtn) return;

  installBtn.hidden = false;
  installBtn.onclick = async () => {
    installBtn.hidden = true;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js?v=3').catch(console.error);
}

init();
