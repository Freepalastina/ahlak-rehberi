let DATA = [];
let filter = "all";
let view = "search";
let deferredPrompt = null;
let favorites = [];

try {
  favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!Array.isArray(favorites)) favorites = [];
} catch (e) {
  favorites = [];
}

const labels = {
  boykot: "🔴 BOYKOT",
  dikkat: "🟠 DİKKAT",
  alternatif: "🟢 ALTERNATİF",
  inceleniyor: "⚪ İNCELENİYOR"
};

const search = document.getElementById("search");
const results = document.getElementById("results");
const stats = document.getElementById("stats");

function norm(s) {
  return String(s || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function get(item, key) {
  if (!item) return "";

  const aliases = {
    marka: ["marka", "Marka", "brand"],
    anafirma: ["anafirma", "anaFirma", "ana_firma", "Ana Firma", "AnaFirma"],
    kod: ["kod", "Kod", "code"],
    kategori: ["kategori", "Kategori", "category"],
    alternatif: ["alternatif", "Alternatif", "alternative"],
    kaynak: ["kaynak", "Kaynak", "kanyak", "source", "link"],
    not: ["not", "Not", "note"],
    durum: ["durum", "Durum", "status"]
  };

  for (const k of aliases[key] || [key]) {
    if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== "") {
      return item[k];
    }
  }
  return "";
}

function normalizeItem(item) {
  const durum = norm(get(item, "durum") || "inceleniyor");
  return {
    marka: get(item, "marka") || "İsimsiz Marka",
    anafirma: get(item, "anafirma") || "",
    kod: get(item, "kod") || "",
    kategori: get(item, "kategori") || "",
    alternatif: get(item, "alternatif") || "",
    kaynak: get(item, "kaynak") || "",
    not: get(item, "not") || "",
    durum: labels[durum] ? durum : "inceleniyor"
  };
}

async function init() {
  try {
    if (!results || !stats) return;

    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("data.json bulunamadı veya yolu yanlış.");

    const json = await res.json();
    const list = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];

    DATA = list.map(normalizeItem);
    render();
  } catch (err) {
    if (stats) stats.innerHTML = "";
    if (results) {
      results.innerHTML = `<div class="empty">Hata: data.json yüklenemedi.<br>${esc(err.message)}<br><br>Kontrol et: data.json dosyası app.js ile aynı klasörde olmalı.</div>`;
    }
  }
}

function isFav(marka) {
  return favorites.includes(marka);
}

function toggleFav(marka) {
  if (isFav(marka)) favorites = favorites.filter(x => x !== marka);
  else favorites.push(marka);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  render();
}

function currentList() {
  const q = norm(search ? search.value.trim() : "");

  return DATA.filter(x => {
    const hay = norm([x.marka, x.anafirma, x.kategori, x.alternatif, x.kod, x.kaynak, x.not, x.durum].join(" "));
    const okQ = !q || hay.includes(q);
    const okF = filter === "all" || x.durum === filter;
    return okQ && okF;
  }).sort((a, b) => {
    if (isFav(a.marka) && !isFav(b.marka)) return -1;
    if (!isFav(a.marka) && isFav(b.marka)) return 1;
    return a.marka.localeCompare(b.marka, "tr");
  });
}

function renderStats() {
  if (!stats) return;

  const counts = {
    boykot: DATA.filter(x => x.durum === "boykot").length,
    dikkat: DATA.filter(x => x.durum === "dikkat").length,
    alternatif: DATA.filter(x => x.durum === "alternatif").length,
    inceleniyor: DATA.filter(x => x.durum === "inceleniyor").length
  };

  stats.innerHTML = `
    <div class="stat"><b>${counts.boykot}</b><small>Boykot</small></div>
    <div class="stat"><b>${counts.dikkat}</b><small>Dikkat</small></div>
    <div class="stat"><b>${counts.alternatif}</b><small>Alternatif</small></div>
    <div class="stat"><b>${counts.inceleniyor}</b><small>İnceleme</small></div>
    <div class="stat"><b>${favorites.length}</b><small>Favori</small></div>`;
}

function card(item) {
  const fav = isFav(item.marka) ? "★" : "☆";

  return `<article class="card ${esc(item.durum)}" data-brand="${encodeURIComponent(item.marka)}">
    <div class="cardTop">
      <div>
        <div class="status">${labels[item.durum] || labels.inceleniyor}</div>
        <h2>${esc(item.marka)}</h2>
      </div>
      <button class="favBtn" data-fav="${encodeURIComponent(item.marka)}" title="Favori">${fav}</button>
    </div>
    <div class="pill">${esc(item.kod || "-")}</div>
    <div class="info">
      <span>Ana Firma</span><b>${esc(item.anafirma || "-")}</b>
      <span>Kategori</span><b>${esc(item.kategori || "-")}</b>
      <span>Alternatif</span><b>${esc(item.alternatif || "-")}</b>
    </div>
  </article>`;
}

function renderSearch() {
  if (!results) return;
  const list = currentList();
  renderStats();

  if (!list.length) {
    results.innerHTML = `<div class="empty">Sonuç bulunamadı.<br>Bu markayı “⚪ İnceleniyor” olarak ekleyebilirsin.</div>`;
    return;
  }

  results.innerHTML = list.slice(0, 250).map(card).join("");
}

function groupBy(key) {
  const map = new Map();
  DATA.forEach(item => {
    const k = item[key] || "Belirtilmemiş";
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  });
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "tr"));
}

function renderCompanies() {
  if (!results) return;
  renderStats();
  results.innerHTML = groupBy("anafirma").map(([name, items]) => `
    <div class="groupItem" data-company="${esc(name)}">
      <div><b>${esc(name)}</b><br><small>${items.length} marka</small></div>
      <span>›</span>
    </div>`).join("");
}

function renderCategories() {
  if (!results) return;
  renderStats();
  results.innerHTML = groupBy("kategori").map(([name, items]) => `
    <div class="groupItem" data-category="${esc(name)}">
      <div><b>${esc(name)}</b><br><small>${items.length} marka</small></div>
      <span>›</span>
    </div>`).join("");
}

function renderAbout() {
  if (stats) stats.innerHTML = "";
  if (!results) return;

  results.innerHTML = `
    <div class="empty" style="text-align:left">
      <h2>ℹ️ Kullanım</h2>
      <p>Bu uygulama <b>data.json</b> dosyasındaki markaları arar.</p>
      <p>JSON alanları: <b>marka, anafirma, kod, kategori, alternatif, kaynak, not, durum</b>.</p>
      <p>Durumlar: 🔴 boykot, 🟠 dikkat, 🟢 alternatif, ⚪ inceleniyor.</p>
      <p>Yıldız işaretine basarak favorilere ekleyebilirsin.</p>
    </div>`;
}

function render() {
  if (view === "search") renderSearch();
  if (view === "companies") renderCompanies();
  if (view === "categories") renderCategories();
  if (view === "about") renderAbout();
}

function setNav(v) {
  document.querySelectorAll(".bottomNav button").forEach(b => {
    b.classList.toggle("navActive", b.dataset.view === v);
  });
}

if (search) {
  search.addEventListener("input", () => {
    view = "search";
    setNav("search");
    render();
  });
}

const clearBtn = document.getElementById("clearBtn");
if (clearBtn && search) {
  clearBtn.addEventListener("click", () => {
    search.value = "";
    search.focus();
    render();
  });
}

document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter || "all";
    view = "search";
    setNav("search");
    render();
  });
});

document.querySelectorAll(".bottomNav button").forEach(btn => {
  btn.addEventListener("click", () => {
    view = btn.dataset.view || "search";
    setNav(view);
    render();
  });
});

if (results) {
  results.addEventListener("click", e => {
    const favEl = e.target.closest("[data-fav]");
    if (favEl) {
      e.stopPropagation();
      toggleFav(decodeURIComponent(favEl.dataset.fav));
      return;
    }

    const cardEl = e.target.closest("[data-brand]");
    if (cardEl) {
      const name = decodeURIComponent(cardEl.dataset.brand);
      const item = DATA.find(x => x.marka === name);
      showDetail(item);
      return;
    }

    const companyEl = e.target.closest("[data-company]");
    if (companyEl && search) {
      search.value = companyEl.dataset.company;
      view = "search";
      setNav("search");
      render();
      return;
    }

    const catEl = e.target.closest("[data-category]");
    if (catEl && search) {
      search.value = catEl.dataset.category;
      view = "search";
      setNav("search");
      render();
    }
  });
}

function showDetail(item) {
  if (!item) return;

  const detailContent = document.getElementById("detailContent");
  const detailDialog = document.getElementById("detailDialog");
  if (!detailContent || !detailDialog) return;

  const sourceLink = item.kaynak
    ? `<p><a href="${esc(item.kaynak)}" target="_blank" rel="noopener">Kaynağı aç</a></p>`
    : "";

  detailContent.innerHTML = `
    <h2>${labels[item.durum] || labels.inceleniyor}<br>${esc(item.marka)}</h2>
    <p><b>Ana Firma:</b> ${esc(item.anafirma || "-")}</p>
    <p><b>Kategori:</b> ${esc(item.kategori || "-")}</p>
    <p><b>Kod:</b> ${esc(item.kod || "-")}</p>
    <p><b>Alternatif:</b> ${esc(item.alternatif || "-")}</p>
    <p><b>Not:</b> ${esc(item.not || "-")}</p>
    ${sourceLink}`;

  detailDialog.showModal();
}

const closeDialog = document.getElementById("closeDialog");
if (closeDialog) {
  closeDialog.addEventListener("click", () => {
    const detailDialog = document.getElementById("detailDialog");
    if (detailDialog) detailDialog.close();
  });
}

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("installBtn");
  if (!btn) return;

  btn.hidden = false;
  btn.onclick = async () => {
    btn.hidden = true;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

init();
```

