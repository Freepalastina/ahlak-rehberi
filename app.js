let DATA=[];
let filter="all";
let view="search";
let deferredPrompt=null;
let favorites=[];

const search=document.getElementById("search");
const results=document.getElementById("results");
const stats=document.getElementById("stats");

try{favorites=JSON.parse(localStorage.getItem("boykot_favorites")||"[]");if(!Array.isArray(favorites))favorites=[];}catch(e){favorites=[];}

function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function norm(v){return String(v??"").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();}
function val(x,k){return String(x?.[k]??"").trim();}
function statusFromKod(kod){const k=String(kod||"").toUpperCase(); if(k==="A1")return "🔴 A1"; if(k==="A2")return "🔴 A2"; if(k==="D1")return "⚪ D1"; return k||"-";}

async function init(){
  try{
    const res=await fetch("data.json?v=20260704-anafirma-dogru",{cache:"no-store"});
    if(!res.ok)throw new Error("data.json bulunamadı");
    const json=await res.json();
    DATA=(Array.isArray(json)?json:[]).map((x,i)=>({
      id:i,
      marka:val(x,"marka")||"İsimsiz Marka",
      anafirma:val(x,"anafirma"),
      kod:val(x,"kod"),
      kategori:val(x,"kategori"),
      alternatif:val(x,"alternatif"),
      kaynak:val(x,"kaynak"),
      not:val(x,"not")
    }));
    render();
  }catch(e){
    stats.innerHTML="";
    results.innerHTML=`<div class="empty"><b>Hata:</b> data.json yüklenemedi.<br>${esc(e.message)}</div>`;
  }
}

function isFav(id){return favorites.includes(id);}
function saveFav(){localStorage.setItem("boykot_favorites",JSON.stringify(favorites));}
function toggleFav(id){id=Number(id);favorites=isFav(id)?favorites.filter(x=>x!==id):[...favorites,id];saveFav();render();}

function currentList(){
  const q=norm(search.value);
  return DATA.filter(x=>{
    const allText=norm([x.marka,x.anafirma,x.kod,x.kategori,x.alternatif,x.kaynak,x.not].join(" "));
    const okQ=!q||allText.includes(q);
    const okF=filter==="all"||(filter==="fav"&&isFav(x.id))||x.kod===filter;
    return okQ&&okF;
  }).sort((a,b)=>a.marka.localeCompare(b.marka,"tr"));
}

function renderStats(){
  const count=k=>DATA.filter(x=>x.kod===k).length;
  stats.innerHTML=`<div class="stat"><b>${DATA.length}</b><small>Toplam</small></div><div class="stat"><b>${count("A1")}</b><small>A1</small></div><div class="stat"><b>${count("A2")}</b><small>A2</small></div><div class="stat"><b>${count("D1")}</b><small>D1</small></div>`;
}

function card(x){return `<article class="card" data-id="${x.id}"><div class="cardTop"><div><div class="status">${statusFromKod(x.kod)}</div><h2>${esc(x.marka)}</h2></div><button class="favBtn" data-fav="${x.id}">${isFav(x.id)?"★":"☆"}</button></div><div class="pill">${esc(x.kod||"-")}</div><div class="info"><span>Ana Firma</span><b>${esc(x.anafirma||"-")}</b><span>Kategori</span><b>${esc(x.kategori||"-")}</b><span>Alternatif</span><b>${esc(x.alternatif||"-")}</b></div></article>`;}

function renderSearch(){renderStats();const list=currentList();results.innerHTML=list.length?list.slice(0,500).map(card).join(""):`<div class="empty">Sonuç bulunamadı.</div>`;}
function groupBy(key){const m=new Map();DATA.forEach(x=>{const k=x[key]||"Belirtilmemiş";if(!m.has(k))m.set(k,[]);m.get(k).push(x);});return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0],"tr"));}
function renderGroups(key,attr){renderStats();results.innerHTML=groupBy(key).map(([name,items])=>`<div class="groupItem" ${attr}="${esc(name)}"><div><b>${esc(name)}</b><br><small>${items.length} marka</small></div><span>›</span></div>`).join("");}
function renderAbout(){stats.innerHTML="";results.innerHTML=`<div class="empty" style="text-align:left"><h2>Kullanım</h2><p>Bu uygulama <b>data.json</b> dosyasındaki tam listeyi arar.</p><p>Doğru alan adı: <b>anafirma</b></p><p>Toplam kayıt: <b>${DATA.length}</b></p></div>`;}
function render(){if(view==="search")renderSearch(); if(view==="companies")renderGroups("anafirma","data-company"); if(view==="categories")renderGroups("kategori","data-category"); if(view==="about")renderAbout();}
function setNav(v){document.querySelectorAll(".bottomNav button").forEach(b=>b.classList.toggle("navActive",b.dataset.view===v));}

search.addEventListener("input",()=>{view="search";setNav("search");render();});
document.getElementById("clearBtn").addEventListener("click",()=>{search.value="";filter="all";document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));render();});
document.querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");filter=btn.dataset.filter;view="search";setNav("search");render();}));
document.querySelectorAll(".bottomNav button").forEach(btn=>btn.addEventListener("click",()=>{view=btn.dataset.view;setNav(view);render();}));
results.addEventListener("click",e=>{const fav=e.target.closest("[data-fav]");if(fav){e.stopPropagation();toggleFav(fav.dataset.fav);return;}const card=e.target.closest("[data-id]");if(card){showDetail(DATA[Number(card.dataset.id)]);return;}const c=e.target.closest("[data-company]");if(c){search.value=c.getAttribute("data-company");view="search";setNav("search");render();return;}const cat=e.target.closest("[data-category]");if(cat){search.value=cat.getAttribute("data-category");view="search";setNav("search");render();}});
function showDetail(x){if(!x)return;const link=x.kaynak&&x.kaynak.startsWith("http")?`<p><a target="_blank" rel="noopener" href="${esc(x.kaynak)}">Kaynağı aç</a></p>`:"";document.getElementById("detailContent").innerHTML=`<h2>${esc(x.marka)}</h2><p><b>Ana Firma:</b> ${esc(x.anafirma||"-")}</p><p><b>Kod:</b> ${esc(x.kod||"-")}</p><p><b>Kategori:</b> ${esc(x.kategori||"-")}</p><p><b>Alternatif:</b> ${esc(x.alternatif||"-")}</p><p><b>Kaynak:</b> ${esc(x.kaynak||"-")}</p><p><b>Not:</b> ${esc(x.not||"-")}</p>${link}`;document.getElementById("detailDialog").showModal();}
document.getElementById("closeDialog").addEventListener("click",()=>document.getElementById("detailDialog").close());
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;const b=document.getElementById("installBtn");b.hidden=false;b.onclick=async()=>{b.hidden=true;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;};});
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
init();
