let DATA = [];
let view = "home";
let filter = "all";
let lang = localStorage.getItem("boykot_lang") || "tr";
let theme = localStorage.getItem("boykot_theme") || "light";

const T = {
  tr: {
    title:"Boykot Rehberi", subtitle:"Marka, ana firma ve alternatif arama", search:"Marka, ana firma, kategori veya alternatif ara...",
    navHome:"Ana Sayfa", navCompanies:"Ana Firmalar", navCategories:"Kategoriler", navNotBoycotted:"Boykotta Değil", navAbout:"Hakkında",
    all:"Tümü", boycott:"Boykot", caution:"Dikkat", alternative:"Alternatif", notBoycotted:"Boykotta Değil", review:"İnceleniyor",
    parent:"Ana Firma", category:"Kategori", alternatives:"Alternatifler", note:"Not", source:"Kaynak", code:"Kod", brand:"Marka",
    details:"Ayrıntıları Gör", close:"Kapat", open:"Kaynağı Aç", brands:"marka", noResults:"Sonuç bulunamadı.",
    total:"Toplam", withAlt:"Alternatifli", aboutTitle:"📖 Boykot Rehberi", aboutSub:"Bu uygulama markalar, ana firmalar ve alternatifler hakkında hızlı bilgi sunmak için hazırlanmıştır.",
    useTitle:"🔍 Nasıl Kullanılır?", useText:"Arama kutusuna marka, ana firma, kategori, alternatif veya not yazarak arama yapabilirsiniz.",
    compTitle:"🏢 Ana Firmalar", compText:"Aynı ana firmaya bağlı markaları birlikte görmek için Ana Firmalar bölümünü kullanın.",
    catTitle:"📂 Kategoriler", catText:"Ürün gruplarına göre markaları hızlıca inceleyebilirsiniz.",
    nbTitle:"✅ Boykotta Değil", nbText:"Bu bölüm alternatif.ods dosyasından eklenen ve boykot listesinde olmayan markaları gösterir.",
    disclaimerTitle:"⚠️ Bilgilendirme", disclaimerText:"Bu liste bilgilendirme amaçlıdır. Bilgiler farklı kaynaklardan derlenmiştir; satın alma kararından önce güncel kaynaklardan kontrol etmeniz önerilir.",
    version:"Sürüm 3.1 • TR / EN / DE"
  },
  en: {
    title:"Boycott Guide", subtitle:"Search brands, parent companies and alternatives", search:"Search brand, parent company, category or alternative...",
    navHome:"Home", navCompanies:"Parent Companies", navCategories:"Categories", navNotBoycotted:"Not Boycotted", navAbout:"About",
    all:"All", boycott:"Boycott", caution:"Caution", alternative:"Alternative", notBoycotted:"Not Boycotted", review:"Under Review",
    parent:"Parent Company", category:"Category", alternatives:"Alternatives", note:"Note", source:"Source", code:"Code", brand:"Brand",
    details:"View Details", close:"Close", open:"Open Source", brands:"brands", noResults:"No results found.",
    total:"Total", withAlt:"With alternatives", aboutTitle:"📖 Boycott Guide", aboutSub:"This app helps you quickly search brands, parent companies and alternative options.",
    useTitle:"🔍 How to Use", useText:"Use the search box to look up a brand, parent company, category, alternative or note.",
    compTitle:"🏢 Parent Companies", compText:"Use the Parent Companies section to see brands grouped under the same company.",
    catTitle:"📂 Categories", catText:"Browse brands by product categories.",
    nbTitle:"✅ Not Boycotted", nbText:"This section shows brands added from the alternative.ods file that are not in the boycott list.",
    disclaimerTitle:"⚠️ Disclaimer", disclaimerText:"This list is for informational purposes only. Information is compiled from different sources; please verify current details before making purchasing decisions.",
    version:"Version 3.1 • TR / EN / DE"
  },
  de: {
    title:"Boykott-Ratgeber", subtitle:"Marken, Mutterfirmen und Alternativen suchen", search:"Marke, Mutterfirma, Kategorie oder Alternative suchen...",
    navHome:"Start", navCompanies:"Mutterfirmen", navCategories:"Kategorien", navNotBoycotted:"Nicht boykottiert", navAbout:"Info",
    all:"Alle", boycott:"Boykott", caution:"Achtung", alternative:"Alternative", notBoycotted:"Nicht boykottiert", review:"In Prüfung",
    parent:"Mutterfirma", category:"Kategorie", alternatives:"Alternativen", note:"Notiz", source:"Quelle", code:"Code", brand:"Marke",
    details:"Details anzeigen", close:"Schließen", open:"Quelle öffnen", brands:"Marken", noResults:"Keine Ergebnisse gefunden.",
    total:"Gesamt", withAlt:"Mit Alternativen", aboutTitle:"📖 Boykott-Ratgeber", aboutSub:"Diese App hilft, Marken, Mutterfirmen und Alternativen schnell zu finden.",
    useTitle:"🔍 Nutzung", useText:"Suche nach Marke, Mutterfirma, Kategorie, Alternative oder Notiz.",
    compTitle:"🏢 Mutterfirmen", compText:"Im Bereich Mutterfirmen sehen Sie Marken, die zur gleichen Firma gehören.",
    catTitle:"📂 Kategorien", catText:"Durchsuchen Sie Marken nach Produktgruppen.",
    nbTitle:"✅ Nicht boykottiert", nbText:"Dieser Bereich zeigt Marken aus der Datei alternative.ods, die nicht in der Boykottliste enthalten sind.",
    disclaimerTitle:"⚠️ Hinweis", disclaimerText:"Diese Liste dient nur zur Information. Die Daten stammen aus verschiedenen Quellen; bitte prüfen Sie aktuelle Angaben vor Kaufentscheidungen.",
    version:"Version 3.1 • TR / EN / DE"
  }
};

const labels = {
  boykot:{emoji:"🔴", key:"boycott"},
  dikkat:{emoji:"🟠", key:"caution"},
  alternatif:{emoji:"🟢", key:"alternative"},
  boykottaDegil:{emoji:"✅", key:"notBoycotted"},
  inceleniyor:{emoji:"⚪", key:"review"}
};

const search = document.getElementById("search");
const results = document.getElementById("results");
const stats = document.getElementById("stats");
const chips = document.getElementById("chips");

function tr(){ return T[lang] || T.tr; }
function esc(s){ return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function norm(s){ return String(s || "").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim(); }
function get(item, key){
  if(!item) return "";
  if(key === "anaFirma") return item.anaFirma || item.anafirma || item.ana_firma || "";
  return item[key] || "";
}
function statusText(status){
  const l = labels[status] || labels.inceleniyor;
  return `${l.emoji} ${tr()[l.key]}`;
}
function normalizedItem(item){
  let status = item.durum || "boykot";
  if(!labels[status]) status = "inceleniyor";
  return {
    marka: get(item,"marka") || "—",
    anaFirma: get(item,"anaFirma") || "—",
    durum: status,
    kod: get(item,"kod") || "",
    kategori: get(item,"kategori") || "",
    alternatif: get(item,"alternatif") || "",
    kaynak: get(item,"kaynak") || "",
    not: get(item,"not") || ""
  };
}

async function init(){
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
  try{
    const res = await fetch("data.json?v=3.1", {cache:"no-store"});
    if(!res.ok) throw new Error("data.json");
    const json = await res.json();
    DATA = Array.isArray(json) ? json.map(normalizedItem) : [];
  }catch(e){
    results.innerHTML = `<div class="empty">data.json yüklenemedi. Dosyaların aynı klasörde olduğundan emin ol.</div>`;
    return;
  }
  bind();
  applyLang();
  render();
}

function bind(){
  search.addEventListener("input", () => { view="home"; setNav("home"); render(); });
  document.getElementById("clearBtn").addEventListener("click", () => { search.value=""; render(); search.focus(); });
  document.querySelectorAll(".bottomNav button").forEach(btn => btn.addEventListener("click", () => {
    view = btn.dataset.view;
    filter = view === "notBoycotted" ? "boykottaDegil" : "all";
    search.value = "";
    setNav(view);
    render();
  }));
  document.querySelectorAll(".langBtn").forEach(btn => btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    localStorage.setItem("boykot_lang", lang);
    applyLang();
    render();
  }));
  document.getElementById("themeBtn").addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("boykot_theme", theme);
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
    document.getElementById("themeBtn").textContent = theme === "dark" ? "☀️" : "🌙";
  });
  results.addEventListener("click", e => {
    const more = e.target.closest("[data-detail]");
    if(more){ showDetail(DATA[Number(more.dataset.detail)]); return; }
    const group = e.target.closest("[data-group]");
    if(group){
      search.value = group.dataset.group;
      view = "home"; filter = "all"; setNav("home"); render();
    }
  });
  document.getElementById("closeDialog").addEventListener("click", () => document.getElementById("detailDialog").close());
}

function applyLang(){
  const tt = tr();
  document.documentElement.lang = lang;
  document.getElementById("appTitle").textContent = tt.title;
  document.getElementById("appSubtitle").textContent = tt.subtitle;
  search.placeholder = tt.search;
  document.getElementById("closeDialog").textContent = tt.close;
  document.getElementById("themeBtn").textContent = theme === "dark" ? "☀️" : "🌙";
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if(tt[key]) el.textContent = tt[key];
  });
  document.querySelectorAll(".langBtn").forEach(btn => btn.classList.toggle("active", btn.dataset.lang === lang));
}

function setNav(v){
  document.querySelectorAll(".bottomNav button").forEach(b => b.classList.toggle("navActive", b.dataset.view === v));
}

function counts(){
  return {
    total: DATA.length,
    boykot: DATA.filter(x=>x.durum==="boykot").length,
    dikkat: DATA.filter(x=>x.durum==="dikkat").length,
    alternatif: DATA.filter(x=>x.durum==="alternatif").length,
    boykottaDegil: DATA.filter(x=>x.durum==="boykottaDegil").length,
    inceleniyor: DATA.filter(x=>x.durum==="inceleniyor").length,
    withAlt: DATA.filter(x=>String(x.alternatif || "").trim()).length
  };
}

function renderStats(){
  const c = counts(), tt = tr();
  const items = [
    [tt.total,c.total,"📦"],
    [tt.boycott,c.boykot,"🔴"],
    [tt.notBoycotted,c.boykottaDegil,"✅"],
    [tt.review,c.inceleniyor,"⚪"],
    [tt.withAlt,c.withAlt,"🟢"]
  ];
  stats.innerHTML = items.map(([label,val,emoji]) => `<div class="stat"><b>${emoji} ${val}</b><span>${esc(label)}</span></div>`).join("");
}

function renderChips(){
  const tt=tr();
  const defs = [
    ["all", tt.all],
    ["boykot", "🔴 " + tt.boycott],
    ["boykottaDegil", "✅ " + tt.notBoycotted],
    ["inceleniyor", "⚪ " + tt.review]
  ];
  chips.innerHTML = defs.map(([f,label]) => `<button class="chip ${filter===f?'active':''}" data-filter="${f}">${esc(label)}</button>`).join("");
  chips.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    view = "home"; setNav("home"); render();
  }));
}

function currentList(){
  const q = norm(search.value);
  return DATA.map((x,i)=>({x,i})).filter(({x}) => {
    const hay = norm([x.marka,x.anaFirma,x.kategori,x.alternatif,x.not,x.kod,x.kaynak].join(" "));
    const okQ = !q || hay.includes(q);
    const okF = filter === "all" || x.durum === filter;
    return okQ && okF;
  }).sort((a,b) => a.x.marka.localeCompare(b.x.marka, "tr"));
}

function renderHome(){
  renderStats(); renderChips();
  const list = currentList();
  if(!list.length){ results.className="results"; results.innerHTML = `<div class="empty">${tr().noResults}</div>`; return; }
  results.className = "results";
  results.innerHTML = list.slice(0,300).map(({x,i}) => card(x,i)).join("");
}

function card(x,i){
  const tt=tr();
  const alt = x.alternatif ? `<div class="altBox"><small>${esc(tt.alternatives)}</small>${esc(x.alternatif)}</div>` : "";
  return `<article class="card ${esc(x.durum)}">
    <div class="cardTop">
      <div class="status">${statusText(x.durum)}</div>
      <div class="code">${esc(x.kod || "—")}</div>
    </div>
    <h2>${esc(x.marka)}</h2>
    <div class="meta">
      <span>🏢 ${esc(tt.parent)}</span><b>${esc(x.anaFirma || "—")}</b>
      <span>📂 ${esc(tt.category)}</span><b>${esc(x.kategori || "—")}</b>
    </div>
    ${alt}
    <button class="moreBtn" data-detail="${i}">${esc(tt.details)} →</button>
  </article>`;
}

function groupBy(field){
  const map = new Map();
  DATA.forEach(x => {
    const key = field === "anaFirma" ? (x.anaFirma || "—") : (x[field] || "—");
    if(!map.has(key)) map.set(key, []);
    map.get(key).push(x);
  });
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],"tr"));
}

function renderGroups(field){
  renderStats(); chips.innerHTML = "";
  const groups = groupBy(field);
  results.className = "results";
  results.innerHTML = groups.map(([name,items]) => `
    <article class="groupCard" data-group="${esc(name)}">
      <div><h3>${esc(name)}</h3><p>${items.length} ${esc(tr().brands)}</p></div>
      <div class="arrow">›</div>
    </article>`).join("");
}

function renderAbout(){
  stats.innerHTML = ""; chips.innerHTML = "";
  const tt=tr();
  results.className = "results";
  results.innerHTML = `
    <section class="aboutHero">
      <h2>${esc(tt.aboutTitle)}</h2>
      <p>${esc(tt.aboutSub)}</p>
      <p><b>${esc(tt.version)}</b></p>
    </section>
    <section class="aboutGrid">
      <article class="aboutCard"><h3>${esc(tt.useTitle)}</h3><p>${esc(tt.useText)}</p></article>
      <article class="aboutCard"><h3>${esc(tt.compTitle)}</h3><p>${esc(tt.compText)}</p></article>
      <article class="aboutCard"><h3>${esc(tt.catTitle)}</h3><p>${esc(tt.catText)}</p></article>
      <article class="aboutCard"><h3>${esc(tt.nbTitle)}</h3><p>${esc(tt.nbText)}</p></article>
      <article class="aboutCard"><h3>${esc(tt.disclaimerTitle)}</h3><p>${esc(tt.disclaimerText)}</p></article>
    </section>`;
}

function render(){
  if(view === "companies") return renderGroups("anaFirma");
  if(view === "categories") return renderGroups("kategori");
  if(view === "about") return renderAbout();
  return renderHome();
}

function showDetail(x){
  if(!x) return;
  const tt=tr();
  const source = x.kaynak && /^https?:\/\//i.test(x.kaynak) ? `<a class="sourceLink" href="${esc(x.kaynak)}" target="_blank" rel="noopener">${esc(tt.open)}</a>` : esc(x.kaynak || "—");
  document.getElementById("detailContent").innerHTML = `
    <h2>${statusText(x.durum)}<br>${esc(x.marka)}</h2>
    <div class="detailRow"><span>${esc(tt.parent)}</span><b>${esc(x.anaFirma || "—")}</b></div>
    <div class="detailRow"><span>${esc(tt.category)}</span><b>${esc(x.kategori || "—")}</b></div>
    <div class="detailRow"><span>${esc(tt.code)}</span><b>${esc(x.kod || "—")}</b></div>
    <div class="detailRow"><span>${esc(tt.alternatives)}</span><b>${esc(x.alternatif || "—")}</b></div>
    <div class="detailRow"><span>${esc(tt.note)}</span><b>${esc(x.not || "—")}</b></div>
    <div class="detailRow"><span>${esc(tt.source)}</span><b>${source}</b></div>`;
  document.getElementById("detailDialog").showModal();
}

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}

init();
