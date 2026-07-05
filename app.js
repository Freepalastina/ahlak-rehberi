const VERSION = "20260705-olive-real-no-old-cache";
let DATA = [];
let view = "home";
let filter = "all";
let favorites = loadFavorites();
let currentTitle = "Tüm Markalar";

const $ = id => document.getElementById(id);
const search = $("search"), clearBtn = $("clearBtn"), stats = $("stats"), filters = $("filters"), sectionTitle = $("sectionTitle"), results = $("results"), themeBtn = $("themeBtn");

const codeLabels = {A1:"🔴 Boykot",A2:"🔴 Boykot",A3:"🔴 Boykot",B1:"🟠 Dikkat",B2:"🟠 Dikkat",C1:"🟢 Alternatif",C2:"🟢 Alternatif",D1:"⚪ İnceleniyor",D2:"⚪ İnceleniyor"};
function esc(s){return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function norm(s){return String(s||"").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()}
function get(obj, names){for(const n of names){if(obj && obj[n]!==undefined && obj[n]!==null && String(obj[n]).trim()!=="") return String(obj[n]).trim()} return ""}
function favKey(marka){return norm(marka)}
function loadFavorites(){try{return JSON.parse(localStorage.getItem("boykot_favorites_v2")||"[]")}catch{return []}}
function saveFavorites(){localStorage.setItem("boykot_favorites_v2", JSON.stringify(favorites))}
function isFav(marka){return favorites.includes(favKey(marka))}
function toggleFav(marka){const k=favKey(marka); favorites=isFav(marka)?favorites.filter(x=>x!==k):[...favorites,k]; saveFavorites(); render()}
function hasAlternative(x){const a=norm(x.alternatif); return !!a && !a.includes("alternatif manuel eklenmeli")}

function normalizeItem(raw, i){
  const marka = get(raw,["marka","Marka","brand"]) || `Marka ${i+1}`;
  const anaFirma = get(raw,["anaFirma","anafirma","Ana Firma","AnaFirma","ana_firma"]);
  const kod = get(raw,["kod","Kod","code"]) || "D1";
  const kategori = get(raw,["kategori","Kategori","category"]);
  const alternatif = get(raw,["alternatif","Alternatif","alternative"]);
  const kaynak = get(raw,["kaynak","Kaynak","kanyak","source","link"]);
  const not = get(raw,["not","Not","note"]);
  const hay = norm([marka, anaFirma, kod, kategori, alternatif, kaynak, not].join(" "));
  return {marka, anaFirma, kod, kategori, alternatif, kaynak, not, hay};
}

async function clearOldCaches(){
  try{
    if("caches" in window){const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k)));}
  }catch(e){}
}
async function init(){
  applyTheme();
  await clearOldCaches();
  try{
    const res = await fetch(`data.json?v=${VERSION}`, {cache:"reload"});
    if(!res.ok) throw new Error(`data.json yüklenemedi: ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
    DATA = list.map(normalizeItem).sort((a,b)=>a.marka.localeCompare(b.marka,"tr"));
    render();
  }catch(err){
    stats.innerHTML=""; filters.innerHTML=""; sectionTitle.innerHTML="";
    results.innerHTML=`<div class="empty"><b>Veri yüklenemedi.</b><br>${esc(err.message)}<br><br>data.json dosyası index.html ile aynı klasörde olmalı.</div>`;
  }
}

function counts(){return {total:DATA.length,boykot:DATA.filter(x=>/^A/i.test(x.kod)).length,dikkat:DATA.filter(x=>/^B/i.test(x.kod)).length,alternatifli:DATA.filter(hasAlternative).length,inceleme:DATA.filter(x=>/^D/i.test(x.kod)).length,firmalar:new Set(DATA.map(x=>x.anaFirma||"Belirtilmemiş")).size}}
function renderStats(){const c=counts();stats.innerHTML=`<div class="stat"><b>${c.total}</b><small>Toplam</small></div><div class="stat"><b>${c.boykot}</b><small>Boykot</small></div><div class="stat"><b>${c.alternatifli}</b><small>Alternatifli</small></div><div class="stat"><b>${c.inceleme}</b><small>İnceleniyor</small></div>`}
function renderFilters(){const arr=[["all","Tümü"],["A","🔴 Boykot"],["D","⚪ İnceleniyor"],["alt","🟢 Alternatifli"],["fav","⭐ Favoriler"]];filters.innerHTML=arr.map(([k,l])=>`<button class="chip ${filter===k?'active':''}" data-filter="${k}" type="button">${l}</button>`).join("")}
function filteredList(){const q=norm(search.value);return DATA.filter(x=>{const okQ=!q||x.hay.includes(q);const okF=filter==="all"||(filter==="A"&&/^A/i.test(x.kod))||(filter==="D"&&/^D/i.test(x.kod))||(filter==="alt"&&hasAlternative(x))||(filter==="fav"&&isFav(x.marka));return okQ&&okF}).sort((a,b)=>isFav(b.marka)-isFav(a.marka)||a.marka.localeCompare(b.marka,"tr"))}
function badge(kod){const cls=norm(kod).replace(/[^a-z0-9]/g,"");return `<span class="badge ${cls}">${esc(codeLabels[kod]||"Kod")} <b>${esc(kod)}</b></span>`}
function tagHtml(alt){if(!hasAlternative({alternatif:alt}))return `<div class="box alt"><span>Alternatif</span><b>-</b></div>`;const tags=alt.split(/[;,•]/).map(x=>x.trim()).filter(Boolean).slice(0,9);return `<div class="box alt"><span>Alternatif</span><div class="tags">${tags.map(t=>`<em>${esc(t)}</em>`).join("")}</div></div>`}
function card(x){return `<article class="card" data-brand="${encodeURIComponent(x.marka)}"><div class="cardTop"><div><div class="badgeLine">${badge(x.kod)}${hasAlternative(x)?'<span class="badge c2">🟢 Alternatif var</span>':''}</div><h3>${esc(x.marka)}</h3><div class="company">🏢 ${esc(x.anaFirma||"Belirtilmemiş")}</div></div><button class="fav" data-fav="${encodeURIComponent(x.marka)}" type="button">${isFav(x.marka)?"★":"☆"}</button></div><div class="meta"><div class="box"><span>Kategori</span><b>${esc(x.kategori||"Belirtilmemiş")}</b></div><div class="box"><span>Kod</span><b>${esc(x.kod||"D1")}</b></div></div>${tagHtml(x.alternatif)}<button class="more" type="button">Ayrıntıları Gör →</button></article>`}
function renderHome(list=filteredList(), title=currentTitle){renderStats();renderFilters();sectionTitle.innerHTML=`<h2>${esc(title)}</h2><span>${list.length} sonuç</span>`;results.innerHTML=list.length?list.slice(0,600).map(card).join("")+(list.length>600?'<div class="empty">İlk 600 sonuç gösteriliyor. Daha dar arama yap.</div>':''):'<div class="empty">Sonuç bulunamadı.</div>'}
function groupBy(key){const m=new Map();for(const x of DATA){const name=x[key]||"Belirtilmemiş";if(!m.has(name))m.set(name,[]);m.get(name).push(x)}return [...m.entries()].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],"tr"))}
function renderGroups(key,title,attr){renderStats();filters.innerHTML="";search.value="";const g=groupBy(key);sectionTitle.innerHTML=`<h2>${title}</h2><span>${g.length} liste</span>`;results.innerHTML=g.map(([name,items])=>`<div class="group" ${attr}="${encodeURIComponent(name)}"><div><b>${esc(name)}</b><br><small>${items.slice(0,3).map(x=>esc(x.marka)).join(", ")}${items.length>3?"...":""}</small></div><div class="count">${items.length}</div></div>`).join("")}
function renderAbout(){const c=counts();stats.innerHTML="";filters.innerHTML="";sectionTitle.innerHTML="";search.value="";results.innerHTML=`<section class="aboutHero"><h2>📖 Boykot Rehberi</h2><p>Markaları, ana firmaları, kategorileri ve alternatifleri hızlıca bulmak için hazırlanmış mobil uyumlu rehber.</p></section><div class="aboutGrid"><div class="aboutCard"><h3>📊 Liste Durumu</h3><p><b>${c.total}</b> marka, <b>${c.firmalar}</b> ana firma ve <b>${c.alternatifli}</b> alternatifli kayıt bulunmaktadır.</p></div><div class="aboutCard"><h3>🔍 Marka Arama</h3><p>Arama kutusuna marka adı, ana firma, kategori veya alternatif ürün yazabilirsin. Örneğin: P&G, Temizlik, Peros.</p></div><div class="aboutCard"><h3>🏢 Ana Firmalar</h3><p>Aynı şirkete ait markaları görmek için alt menüden Ana Firmalar bölümünü aç.</p></div><div class="aboutCard"><h3>📂 Kategoriler</h3><p>Markaları gıda, temizlik, kozmetik, sağlık ve diğer kategorilere göre listeleyebilirsin.</p></div><div class="aboutCard"><h3>⭐ Favoriler</h3><p>Yıldız işaretine basarak markaları favorilere ekleyebilir, sonra Favoriler bölümünden hızlıca bulabilirsin.</p></div><div class="aboutCard"><h3>🟢 Alternatif Ürünler</h3><p>Alternatif olarak gösterilen ürünler aynı ürün grubunda değerlendirilebilecek seçeneklerdir. Satın almadan önce kendi araştırmanı yapman tavsiye edilir.</p></div><div class="aboutCard"><h3>⚠️ Bilgilendirme</h3><p>Bu uygulama yalnızca bilgilendirme amacıyla hazırlanmıştır. Bilgiler farklı kaynaklardan derlenmiştir ve zamanla değişebilir. Kullanıcıların güncel bilgileri bağımsız kaynaklardan doğrulaması önerilir.</p></div><div class="aboutCard"><h3>🔄 Güncelleme</h3><p>Yeni marka eklemek veya bilgileri değiştirmek için sadece data.json dosyasını güncellemen yeterlidir.</p></div></div>`}
function render(){document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));if(view==="home")return renderHome();if(view==="companies")return renderGroups("anaFirma","🏢 Ana Firmalar","data-company");if(view==="categories")return renderGroups("kategori","📂 Kategoriler","data-category");if(view==="favorites"){filter="fav";currentTitle="⭐ Favoriler";return renderHome(DATA.filter(x=>isFav(x.marka)),currentTitle)}if(view==="about")return renderAbout()}
function detail(x){const d=$("detailDialog"), c=$("detailContent");c.innerHTML=`<div class="detailHead"><h2>${esc(x.marka)}</h2><p>${esc(x.anaFirma||"Belirtilmemiş")}</p></div><div class="detailBody"><div class="detailLine"><span>Ana Firma</span><b>${esc(x.anaFirma||"Belirtilmemiş")}</b></div><div class="detailLine"><span>Kategori</span><b>${esc(x.kategori||"Belirtilmemiş")}</b></div><div class="detailLine"><span>Kod</span><b>${esc(x.kod||"D1")} — ${esc(codeLabels[x.kod]||"")}</b></div><div class="detailLine"><span>Alternatif</span><b>${esc(x.alternatif||"-")}</b></div><div class="detailLine"><span>Not</span><b>${esc(x.not||"-")}</b></div><div class="detailLine"><span>Kaynak</span><b>${/^https?:\/\//.test(x.kaynak)?`<a href="${esc(x.kaynak)}" target="_blank" rel="noopener">Kaynağı aç</a>`:esc(x.kaynak||"-")}</b></div></div>`;d.showModal()}
search.addEventListener("input",()=>{view="home";currentTitle="Arama Sonuçları";render()});clearBtn.addEventListener("click",()=>{search.value="";filter="all";view="home";currentTitle="Tüm Markalar";render();search.focus()});filters.addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;filter=b.dataset.filter;view="home";currentTitle=b.textContent.trim();render()});document.querySelectorAll(".nav button").forEach(b=>b.addEventListener("click",()=>{view=b.dataset.view;if(view==="home"){filter="all";currentTitle="Tüm Markalar"}render();scrollTo({top:0,behavior:"smooth"})}));results.addEventListener("click",e=>{const f=e.target.closest("[data-fav]");if(f){e.stopPropagation();toggleFav(decodeURIComponent(f.dataset.fav));return}const co=e.target.closest("[data-company]");if(co){const n=decodeURIComponent(co.dataset.company);view="home";currentTitle=`🏢 ${n}`;renderHome(DATA.filter(x=>(x.anaFirma||"Belirtilmemiş")===n),currentTitle);return}const ca=e.target.closest("[data-category]");if(ca){const n=decodeURIComponent(ca.dataset.category);view="home";currentTitle=`📂 ${n}`;renderHome(DATA.filter(x=>(x.kategori||"Belirtilmemiş")===n),currentTitle);return}const card=e.target.closest("[data-brand]");if(card){const n=decodeURIComponent(card.dataset.brand);const x=DATA.find(i=>i.marka===n);if(x)detail(x)}});$("closeDialog").addEventListener("click",()=>$("detailDialog").close());themeBtn.addEventListener("click",()=>{localStorage.setItem("boykot_theme",document.body.classList.contains("dark")?"light":"dark");applyTheme()});function applyTheme(){const dark=localStorage.getItem("boykot_theme")==="dark";document.body.classList.toggle("dark",dark);if(themeBtn)themeBtn.textContent=dark?"☀️":"🌙"}
if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{})}
init();
