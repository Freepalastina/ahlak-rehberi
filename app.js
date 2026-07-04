let DATA = [];
let filter = "all";
let view = "search";
let deferredPrompt = null;

const els = {
  search: document.getElementById("search"),
  results: document.getElementById("results"),
  stats: document.getElementById("stats"),
  clearBtn: document.getElementById("clearBtn"),
  installBtn: document.getElementById("installBtn"),
  dialog: document.getElementById("detailDialog"),
  detail: document.getElementById("detailContent"),
  closeDialog: document.getElementById("closeDialog")
};

function norm(value){
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}
function esc(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function clean(value){ return String(value ?? "").trim(); }
function codeLabel(kod){
  const k = clean(kod).toUpperCase() || "D1";
  if(k === "A1") return "🔴 A1";
  if(k === "A2") return "🟠 A2";
  if(k === "D1") return "⚪ D1";
  return "ℹ️ " + k;
}
function normalizeItem(item, index){
  const marka = clean(item.marka || item.Marka || item.brand) || `Marka ${index + 1}`;
  const anaFirma = clean(item.anaFirma || item.anafirma || item.ana_firma || item["Ana Firma"]);
  const kod = clean(item.kod || item.Kod || item.code || "D1").toUpperCase();
  const kategori = clean(item.kategori || item.Kategori || item.category);
  const alternatif = clean(item.alternatif || item.Alternatif || item.alternative);
  const kaynak = clean(item.kaynak || item.Kaynak || item.kanyak || item.source || item.link);
  const not = clean(item.not || item.Not || item.note);
  return { id:index, marka, anaFirma, kod, kategori, alternatif, kaynak, not };
}

async function init(){
  try{
    const res = await fetch("data.json?v=20260704-3", { cache:"no-store" });
    if(!res.ok) throw new Error(`data.json yüklenemedi (${res.status})`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
    if(!list.length) throw new Error("data.json içinde liste bulunamadı");
    DATA = list.map(normalizeItem);
    render();
  }catch(err){
    els.stats.innerHTML = "";
    els.results.innerHTML = `<div class="empty"><b>Hata oluştu</b><br>${esc(err.message)}<br><br>data.json dosyasının index.html ile aynı klasörde olduğundan emin ol.</div>`;
  }
}

function matchesSearch(item){
  const q = norm(els.search.value);
  if(!q) return true;
  const text = norm([item.marka,item.anaFirma,item.kod,item.kategori,item.alternatif,item.kaynak,item.not].join(" "));
  return text.includes(q);
}
function matchesFilter(item){
  if(filter === "all") return true;
  if(filter === "hasAlt") return !!item.alternatif;
  return item.kod === filter;
}
function filteredList(){
  return DATA.filter(item => matchesSearch(item) && matchesFilter(item))
    .sort((a,b) => a.marka.localeCompare(b.marka, "tr", {sensitivity:"base"}));
}
function renderStats(){
  const total = DATA.length;
  const a1 = DATA.filter(x=>x.kod === "A1").length;
  const a2 = DATA.filter(x=>x.kod === "A2").length;
  const d1 = DATA.filter(x=>x.kod === "D1").length;
  els.stats.innerHTML = `
    <div class="stat"><b>${total}</b><small>Toplam</small></div>
    <div class="stat"><b>${a1}</b><small>A1</small></div>
    <div class="stat"><b>${a2}</b><small>A2</small></div>
    <div class="stat"><b>${d1}</b><small>D1</small></div>`;
}
function card(item){
  const alt = item.alternatif ? `<div class="alt"><b>Alternatif:</b> ${esc(item.alternatif)}</div>` : "";
  return `<article class="card" data-id="${item.id}">
    <div class="cardTop">
      <div>
        <div class="badge ${esc(item.kod)}">${esc(codeLabel(item.kod))}</div>
        <div class="brand">${esc(item.marka)}</div>
      </div>
      <div class="pill">${esc(item.kod || "-")}</div>
    </div>
    <div class="info">
      <span>Ana Firma</span><b>${esc(item.anaFirma || "-")}</b>
      <span>Kategori</span><b>${esc(item.kategori || "-")}</b>
    </div>
    ${alt}
  </article>`;
}
function renderSearch(){
  renderStats();
  const list = filteredList();
  if(!list.length){ els.results.innerHTML = `<div class="empty">Sonuç bulunamadı.</div>`; return; }
  els.results.innerHTML = list.map(card).join("");
}
function groupBy(key){
  const map = new Map();
  DATA.forEach(item => {
    const name = clean(item[key]) || "Belirtilmemiş";
    if(!map.has(name)) map.set(name, []);
    map.get(name).push(item);
  });
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],"tr",{sensitivity:"base"}));
}
function renderGroups(key, dataAttr){
  renderStats();
  const groups = groupBy(key);
  els.results.innerHTML = groups.map(([name,items]) => `
    <div class="groupItem" ${dataAttr}="${esc(name)}">
      <div><b>${esc(name)}</b><br><small>${items.length} marka</small></div><span>›</span>
    </div>`).join("");
}
function renderAlternatives(){
  renderStats();
  const list = DATA.filter(x=>x.alternatif).sort((a,b)=>a.marka.localeCompare(b.marka,"tr",{sensitivity:"base"}));
  els.results.innerHTML = list.map(card).join("") || `<div class="empty">Alternatif yazılı kayıt yok.</div>`;
}
function renderAbout(){
  els.stats.innerHTML = "";
  els.results.innerHTML = `<div class="empty" style="text-align:left">
    <h2>ℹ️ Kullanım</h2>
    <p>Bu uygulama <b>data.json</b> içindeki tüm markaları gösterir.</p>
    <p>Kullanılan alanlar: <b>marka, anaFirma, kod, kategori, alternatif, kaynak, not</b>.</p>
    <p>Listeyi güncellemek için sadece <b>data.json</b> dosyasını değiştirmen yeterlidir.</p>
    <p>Toplam kayıt: <b>${DATA.length}</b></p>
  </div>`;
}
function render(){
  if(view === "search") renderSearch();
  if(view === "companies") renderGroups("anaFirma", "data-company");
  if(view === "categories") renderGroups("kategori", "data-category");
  if(view === "alternatives") renderAlternatives();
  if(view === "about") renderAbout();
}
function setNav(v){
  document.querySelectorAll(".bottomNav button").forEach(btn => btn.classList.toggle("navActive", btn.dataset.view === v));
}

els.search.addEventListener("input", () => { view="search"; setNav(view); render(); });
els.clearBtn.addEventListener("click", () => { els.search.value=""; els.search.focus(); view="search"; setNav(view); render(); });
document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll("[data-filter]").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  filter = btn.dataset.filter;
  view = "search"; setNav(view); render();
}));
document.querySelectorAll(".bottomNav button").forEach(btn => btn.addEventListener("click", () => {
  view = btn.dataset.view; setNav(view); render();
}));
els.results.addEventListener("click", e => {
  const cardEl = e.target.closest("[data-id]");
  if(cardEl){ showDetail(DATA.find(x=>x.id === Number(cardEl.dataset.id))); return; }
  const companyEl = e.target.closest("[data-company]");
  if(companyEl){ els.search.value = companyEl.dataset.company; view="search"; setNav(view); render(); return; }
  const catEl = e.target.closest("[data-category]");
  if(catEl){ els.search.value = catEl.dataset.category; view="search"; setNav(view); render(); }
});
function showDetail(item){
  if(!item) return;
  const source = item.kaynak && /^https?:\/\//i.test(item.kaynak)
    ? `<p><a class="source" href="${esc(item.kaynak)}" target="_blank" rel="noopener">Kaynağı aç</a></p>`
    : `<p><b>Kaynak:</b> ${esc(item.kaynak || "-")}</p>`;
  els.detail.innerHTML = `<h2>${esc(item.marka)}</h2>
    <div class="detailGrid">
      <span>Kod</span><b>${esc(codeLabel(item.kod))}</b>
      <span>Ana Firma</span><b>${esc(item.anaFirma || "-")}</b>
      <span>Kategori</span><b>${esc(item.kategori || "-")}</b>
      <span>Alternatif</span><b>${esc(item.alternatif || "-")}</b>
      <span>Not</span><b>${esc(item.not || "-")}</b>
    </div>${source}`;
  els.dialog.showModal();
}
els.closeDialog.addEventListener("click", () => els.dialog.close());
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferredPrompt = e; els.installBtn.hidden = false;
  els.installBtn.onclick = async () => { els.installBtn.hidden = true; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; };
});
if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js?v=20260704-3").catch(()=>{}); }
init();
