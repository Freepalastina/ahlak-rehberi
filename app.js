let DATA = [];
let view = "home";
let filter = "all";
let activeGroup = "";
let favorites = [];

const $ = (id) => document.getElementById(id);
const searchInput = $("searchInput");
const results = $("results");
const stats = $("stats");
const title = $("contentTitle");
const dialog = $("detailDialog");
const detailContent = $("detailContent");

const labels = {
  boykot: "🔴 BOYKOT",
  inceleniyor: "🟠 İNCELENİYOR",
  alternatif: "🟢 ALTERNATİF"
};

function esc(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function norm(value){
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

function getField(item, key){
  if(key === "anafirma") return item.anafirma || item.anaFirma || "";
  return item[key] || "";
}

function cleanItem(item, index){
  const kod = getField(item,"kod") || "";
  let durum = item.durum || "";
  if(!durum){
    const firma = norm(getField(item,"anafirma"));
    const kaynak = norm(getField(item,"kaynak"));
    if(kod.toUpperCase().startsWith("D") || firma.includes("kontrol gerekli") || kaynak.includes("kontrol gerekli")) durum = "inceleniyor";
    else if(kod.toUpperCase().startsWith("C")) durum = "alternatif";
    else durum = "boykot";
  }
  return {
    id: index,
    marka: getField(item,"marka") || "İsimsiz Marka",
    anafirma: getField(item,"anafirma") || "Belirtilmemiş",
    kod,
    kategori: getField(item,"kategori") || "Belirtilmemiş",
    alternatif: getField(item,"alternatif") || "Alternatif manuel eklenmeli",
    kaynak: getField(item,"kaynak") || "",
    not: getField(item,"not") || "",
    durum: ["boykot","inceleniyor","alternatif"].includes(durum) ? durum : "boykot"
  };
}

function loadFavorites(){
  try{ favorites = JSON.parse(localStorage.getItem("boykotFavs") || "[]"); }
  catch{ favorites = []; }
  if(!Array.isArray(favorites)) favorites = [];
}

function saveFavorites(){ localStorage.setItem("boykotFavs", JSON.stringify(favorites)); }
function isFav(id){ return favorites.includes(id); }
function toggleFav(id){
  id = Number(id);
  favorites = isFav(id) ? favorites.filter(x => x !== id) : [...favorites, id];
  saveFavorites();
  render();
}

function setTheme(theme){
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("boykotTheme", theme);
  $("themeBtn").textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme(){
  const saved = localStorage.getItem("boykotTheme") || "light";
  setTheme(saved);
}

async function init(){
  initTheme();
  loadFavorites();
  try{
    const res = await fetch(`data.json?v=${Date.now()}`, {cache:"no-store"});
    if(!res.ok) throw new Error("data.json yüklenemedi");
    const json = await res.json();
    if(!Array.isArray(json)) throw new Error("data.json liste formatında değil");
    DATA = json.map(cleanItem);
    render();
  }catch(err){
    stats.innerHTML = "";
    title.innerHTML = "";
    results.innerHTML = `<div class="empty"><b>Hata oluştu</b><br>${esc(err.message)}<br><br>data.json dosyasının index.html ile aynı klasörde olduğundan emin ol.</div>`;
  }
}

function filteredList(){
  const q = norm(searchInput.value);
  let list = DATA;

  if(view === "favorites") list = list.filter(x => isFav(x.id));
  if(activeGroup && view === "home") list = list.filter(x => norm(x.anafirma) === norm(activeGroup) || norm(x.kategori) === norm(activeGroup));
  if(filter !== "all") list = list.filter(x => x.durum === filter);

  if(q){
    list = list.filter(x => norm([x.marka,x.anafirma,x.kategori,x.alternatif,x.kod,x.not,x.kaynak].join(" ")).includes(q));
  }

  return list.sort((a,b) => {
    if(isFav(a.id) && !isFav(b.id)) return -1;
    if(!isFav(a.id) && isFav(b.id)) return 1;
    return a.marka.localeCompare(b.marka, "tr");
  });
}

function countByStatus(status){ return DATA.filter(x => x.durum === status).length; }

function renderStats(){
  stats.innerHTML = `
    <div class="stat"><b>${DATA.length}</b><small>Toplam</small></div>
    <div class="stat"><b>${countByStatus("boykot")}</b><small>Boykot</small></div>
    <div class="stat"><b>${countByStatus("inceleniyor")}</b><small>İnceleme</small></div>
    <div class="stat"><b>${countByStatus("alternatif")}</b><small>Alternatif</small></div>
    <div class="stat"><b>${favorites.length}</b><small>Favori</small></div>`;
}

function titleText(main, sub=""){
  title.innerHTML = `<div><h2>${esc(main)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div>`;
}

function card(item){
  const fav = isFav(item.id) ? "★" : "☆";
  return `<article class="card" data-id="${item.id}">
    <div class="cardTop">
      <div>
        <div class="badgeRow">
          <span class="badge status-${item.durum}">${labels[item.durum]}</span>
          <span class="badge code">${esc(item.kod || "-")}</span>
        </div>
        <h2>${esc(item.marka)}</h2>
      </div>
      <button class="favBtn" data-fav="${item.id}" aria-label="Favori">${fav}</button>
    </div>
    <div class="infoGrid">
      <div class="infoLine"><span>🏢 Ana Firma</span><b>${esc(item.anafirma)}</b></div>
      <div class="infoLine"><span>📂 Kategori</span><b>${esc(item.kategori)}</b></div>
      <div class="infoLine alt"><span>✅ Alternatif</span><b class="alternatifText">${esc(item.alternatif)}</b></div>
    </div>
    <div class="detailsHint">Ayrıntıları Gör →</div>
  </article>`;
}

function renderHome(){
  renderStats();
  const list = filteredList();
  const sub = activeGroup ? `${activeGroup} filtresi aktif` : `${list.length} sonuç gösteriliyor`;
  titleText("Markalar", sub);
  results.className = "results";
  if(!list.length){
    results.innerHTML = `<div class="empty">Sonuç bulunamadı.<br>Arama kelimesini değiştir veya filtreleri temizle.</div>`;
    return;
  }
  results.innerHTML = list.map(card).join("");
}

function groupBy(field){
  const map = new Map();
  DATA.forEach(item => {
    const key = item[field] || "Belirtilmemiş";
    if(!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return [...map.entries()].sort((a,b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "tr"));
}

function renderGroups(field, label){
  renderStats();
  activeGroup = "";
  titleText(label, "Bir satıra basınca ilgili markalar listelenir");
  results.className = "results groups";
  const q = norm(searchInput.value);
  let groups = groupBy(field);
  if(q) groups = groups.filter(([name]) => norm(name).includes(q));
  results.innerHTML = groups.map(([name, items]) => `
    <div class="groupItem" data-group="${esc(name)}" data-field="${field}">
      <div><b>${esc(name)}</b><br><small>${items.length} marka</small></div>
      <span class="countPill">›</span>
    </div>`).join("") || `<div class="empty">Grup bulunamadı.</div>`;
}

function renderFavorites(){
  renderStats();
  const list = filteredList();
  titleText("Favoriler", `${list.length} favori marka`);
  results.className = "results";
  results.innerHTML = list.length ? list.map(card).join("") : `<div class="empty">Henüz favori yok.<br>Markaların yanındaki ⭐ işaretine basabilirsin.</div>`;
}

function renderAbout(){
  stats.innerHTML = "";
  titleText("Hakkında", "GitHub Pages uyumlu PWA");
  results.className = "results groups";
  results.innerHTML = `<div class="empty" style="text-align:left">
    <h2>Boykot Rehberi</h2>
    <p>Bu uygulama <b>data.json</b> dosyasındaki markaları arar.</p>
    <p>Kullanılan alanlar: <b>marka, anafirma, kod, kategori, alternatif, kaynak, not, durum</b>.</p>
    <p>Arama; marka, ana firma, kategori, alternatif ve not alanlarında aynı anda çalışır.</p>
    <p>Telefonda tarayıcı menüsünden <b>Ana ekrana ekle</b> seçeneğiyle uygulama gibi kullanabilirsin.</p>
  </div>`;
}

function render(){
  if(!DATA.length) return;
  document.querySelectorAll(".bottomNav button").forEach(btn => btn.classList.toggle("navActive", btn.dataset.view === view));
  if(view === "home") renderHome();
  if(view === "companies") renderGroups("anafirma", "Ana Firmalar");
  if(view === "categories") renderGroups("kategori", "Kategoriler");
  if(view === "favorites") renderFavorites();
  if(view === "about") renderAbout();
}

function openDetail(id){
  const item = DATA.find(x => x.id === Number(id));
  if(!item) return;
  const source = item.kaynak && String(item.kaynak).startsWith("http")
    ? `<a class="sourceLink" href="${esc(item.kaynak)}" target="_blank" rel="noopener">Kaynağa Git</a>`
    : item.kaynak ? `<div class="infoLine"><span>🔗 Kaynak</span><b>${esc(item.kaynak)}</b></div>` : "";
  detailContent.innerHTML = `
    <div class="detailTitle">
      <div><span class="badge status-${item.durum}">${labels[item.durum]}</span><h2>${esc(item.marka)}</h2></div>
      <button class="favBtn" data-fav="${item.id}">${isFav(item.id) ? "★" : "☆"}</button>
    </div>
    <div class="detailList">
      <div class="infoLine"><span>🏢 Ana Firma</span><b>${esc(item.anafirma)}</b></div>
      <div class="infoLine"><span>📂 Kategori</span><b>${esc(item.kategori)}</b></div>
      <div class="infoLine"><span>🏷️ Kod</span><b>${esc(item.kod || "-")}</b></div>
      <div class="infoLine"><span>✅ Alternatif</span><b>${esc(item.alternatif)}</b></div>
      <div class="infoLine"><span>📝 Not</span><b>${esc(item.not || "-")}</b></div>
      ${source}
    </div>`;
  dialog.showModal();
}

searchInput.addEventListener("input", () => render());
$("clearSearch").addEventListener("click", () => { searchInput.value = ""; activeGroup = ""; filter = "all"; document.querySelectorAll(".chip").forEach(b => b.classList.toggle("active", b.dataset.filter === "all")); render(); });
$("themeBtn").addEventListener("click", () => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark"));
$("closeDialog").addEventListener("click", () => dialog.close());

document.querySelectorAll(".chip").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  filter = btn.dataset.filter;
  view = "home";
  render();
}));

document.querySelectorAll(".bottomNav button").forEach(btn => btn.addEventListener("click", () => {
  view = btn.dataset.view;
  activeGroup = "";
  render();
}));

results.addEventListener("click", (e) => {
  const fav = e.target.closest("[data-fav]");
  if(fav){ e.stopPropagation(); toggleFav(fav.dataset.fav); return; }
  const group = e.target.closest("[data-group]");
  if(group){ activeGroup = group.dataset.group; view = "home"; searchInput.value = ""; render(); return; }
  const card = e.target.closest("[data-id]");
  if(card) openDetail(card.dataset.id);
});

detailContent.addEventListener("click", (e) => {
  const fav = e.target.closest("[data-fav]");
  if(fav){ toggleFav(fav.dataset.fav); openDetail(fav.dataset.fav); }
});

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

init();
