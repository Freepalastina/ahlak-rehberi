const els = {
  search: document.getElementById('search'), clear: document.getElementById('clearBtn'), results: document.getElementById('results'),
  stats: document.getElementById('stats'), header: document.getElementById('sectionHeader'), subtitle: document.getElementById('subtitle'),
  dialog: document.getElementById('detailDialog'), detail: document.getElementById('detailContent'), close: document.getElementById('closeDialog'), theme: document.getElementById('themeBtn')
};
let DATA = []; let view = 'home'; let activeQuery = ''; let favorites = readStore('boykot_favorites', []);
const VERSION = 'olive-2026-07-05-1';
function readStore(key, fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(v)?v:fallback}catch{return fallback}}
function saveStore(key, value){localStorage.setItem(key, JSON.stringify(value))}
function norm(s){return String(s ?? '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
function esc(s){return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function field(x, ...keys){for(const k of keys){if(x && x[k] !== undefined && x[k] !== null && String(x[k]).trim() !== '') return String(x[k]).trim()} return ''}
function codeStatus(code){const c=norm(code); if(c.startsWith('c')) return 'alternatif'; if(c.startsWith('d')) return 'inceleme'; return 'boykot'}
function label(item){const s=item.status; if(s==='alternatif') return '🟢 ALTERNATİF'; if(s==='inceleme') return '⚪ İNCELENİYOR'; return '🔴 BOYKOT'}
function initials(name){return (name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2)}
function prepare(raw){return raw.map((x,i)=>{const item={id:i, marka:field(x,'marka','Marka'), anafirma:field(x,'anaFirma','anafirma','Ana Firma','ana_firma'), kod:field(x,'kod','Kod'), kategori:field(x,'kategori','Kategori'), alternatif:field(x,'alternatif','Alternatif'), kaynak:field(x,'kaynak','Kaynak','kanyak'), not:field(x,'not','Not')}; item.status=codeStatus(item.kod); item.search=norm([item.marka,item.anafirma,item.kod,item.kategori,item.alternatif,item.kaynak,item.not].join(' ')); return item}).sort((a,b)=>a.marka.localeCompare(b.marka,'tr'))}
async function init(){applyTheme(); try{const res=await fetch(`data.json?v=${VERSION}`,{cache:'no-store'}); if(!res.ok) throw new Error('data.json bulunamadı'); const json=await res.json(); DATA=prepare(Array.isArray(json)?json:[]); render()}catch(e){els.stats.innerHTML=''; els.header.innerHTML='<h2>Hata</h2>'; els.results.innerHTML=`<div class="empty">data.json yüklenemedi.<br>${esc(e.message)}</div>`}}
function currentList(){const q=norm(activeQuery || els.search.value); let list=DATA; if(q) list=list.filter(x=>x.search.includes(q)); if(view==='favorites') list=list.filter(x=>favorites.includes(x.marka)); return list}
function renderStats(){const total=DATA.length, boy=DATA.filter(x=>x.status==='boykot').length, altStatus=DATA.filter(x=>x.status==='alternatif').length, altFilled=DATA.filter(x=>x.alternatif && x.alternatif.trim()).length, inc=DATA.filter(x=>x.status==='inceleme').length; els.stats.innerHTML=`<div class="stat"><b>${total}</b><small>Toplam</small></div><div class="stat"><b>${boy}</b><small>Boykot</small></div><div class="stat"><b>${altFilled}</b><small>Alternatifli</small></div><div class="stat"><b>${inc}</b><small>İnceleme</small></div><div class="stat"><b>${altStatus}</b><small>Yeşil Kod</small></div>`; els.subtitle.textContent=`${total} marka içinde ara`}
function setHeader(title, desc, back=false){els.header.innerHTML=`<div><h2>${esc(title)}</h2><p>${esc(desc||'')}</p></div>${back?'<button id="backHome" type="button">Temizle</button>':''}`; const b=document.getElementById('backHome'); if(b)b.onclick=()=>{activeQuery=''; els.search.value=''; view='home'; setNav(); render()}}
function card(item){const isFav=favorites.includes(item.marka); return `<article class="card status-${item.status}" data-id="${item.id}"><div class="cardTop"><div class="logoCircle">${esc(initials(item.marka))}</div><div style="min-width:0;flex:1"><h3>${esc(item.marka)}</h3><div class="sub">🏢 ${esc(item.anafirma || 'Ana firma belirtilmemiş')}</div></div><button class="favBtn" data-fav="${item.id}" type="button">${isFav?'★':'☆'}</button></div><div class="tagRow"><span class="tag ${item.status==='boykot'?'danger':item.status==='alternatif'?'ok':'warn'}">${label(item)}</span><span class="tag blue">${esc(item.kod || 'Kod yok')}</span>${item.kategori?`<span class="tag">${esc(item.kategori)}</span>`:''}</div>${item.alternatif?`<div class="altBox"><span>Önerilen alternatif</span><b>${esc(item.alternatif)}</b></div>`:''}<div class="cardActions"><span class="sub">Detay ve kaynak</span><button class="detailBtn" data-detail="${item.id}" type="button">Aç →</button></div></article>`}
function renderHome(){const list=currentList(); const q=norm(activeQuery || els.search.value); setHeader(q?'Arama sonuçları':'Markalar', q?`${list.length} sonuç bulundu`:`${DATA.length} kayıt listeleniyor`, !!q); els.results.className='results cards'; els.results.innerHTML=list.length?list.slice(0,350).map(card).join('')+(list.length>350?`<div class="empty">İlk 350 sonuç gösteriliyor. Daha özel arama yaz.</div>`:''):`<div class="empty">Sonuç bulunamadı.</div>`}
function groupBy(key){const m=new Map(); for(const item of DATA){const k=item[key]||'Belirtilmemiş'; if(!m.has(k))m.set(k,[]); m.get(k).push(item)} return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0],'tr'))}
function renderGroups(kind){const key=kind==='companies'?'anafirma':'kategori'; const title=kind==='companies'?'Ana Firmalar':'Kategoriler'; const groups=groupBy(key); setHeader(title, `${groups.length} başlık`); els.results.className='results'; els.results.innerHTML=groups.map(([name,items])=>`<div class="listItem" data-query="${esc(name)}"><div><b>${esc(name)}</b><br><small>${items.length} marka</small></div><span class="chev">›</span></div>`).join('')}
function renderFavorites(){const list=currentList(); setHeader('Favoriler', `${list.length} marka`); els.results.className='results cards'; els.results.innerHTML=list.length?list.map(card).join(''):`<div class="empty">Henüz favori eklemedin. Marka kartındaki yıldız işaretine bas.</div>`}
function renderAbout(){
  setHeader('Hakkında','Kullanım bilgisi ve açıklamalar');
  const total=DATA.length;
  const altFilled=DATA.filter(x=>x.alternatif && x.alternatif.trim()).length;
  const companies=groupBy('anafirma').length;
  const categories=groupBy('kategori').length;
  els.results.className='results aboutPage';
  els.results.innerHTML=`
    <section class="aboutHero card">
      <div class="aboutIcon">BR</div>
      <div>
        <h3>📖 Boykot Rehberi</h3>
        <p>Markalar hakkında hızlı bilgi edinmek, ana firmaları görmek ve alternatif ürünleri kolayca bulmak için hazırlanmıştır.</p>
      </div>
    </section>

    <section class="aboutStats">
      <div class="miniStat"><b>${total}</b><span>Marka</span></div>
      <div class="miniStat"><b>${companies}</b><span>Ana Firma</span></div>
      <div class="miniStat"><b>${categories}</b><span>Kategori</span></div>
      <div class="miniStat"><b>${altFilled}</b><span>Alternatifli</span></div>
    </section>

    <section class="infoCard">
      <h3>🔍 Nasıl kullanılır?</h3>
      <p>Arama kutusuna marka adı, ana firma, kategori veya alternatif ürün yazarak hızlıca sonuç bulabilirsin.</p>
    </section>

    <section class="infoGrid">
      <div class="infoCard"><h3>🏢 Ana Firmalar</h3><p>Aynı şirkete bağlı markaları tek ekranda görmek için Ana Firma bölümünü kullan.</p></div>
      <div class="infoCard"><h3>📂 Kategoriler</h3><p>Temizlik, gıda, kozmetik, sağlık gibi alanlara göre markaları listeleyebilirsin.</p></div>
      <div class="infoCard"><h3>⭐ Favoriler</h3><p>Sık baktığın markaları yıldızla favorilerine ekleyebilirsin.</p></div>
      <div class="infoCard"><h3>📋 Detaylar</h3><p>Marka kartına dokunarak ana firma, kod, kategori, alternatif, not ve kaynak bilgisini görebilirsin.</p></div>
    </section>

    <section class="infoCard warningCard">
      <h3>⚠️ Bilgilendirme</h3>
      <p>Bu uygulama yalnızca bilgilendirme amacıyla hazırlanmıştır. Listede yer alan bilgiler farklı kaynaklardan derlenmiştir. Satın alma kararı vermeden önce güncel bilgileri bağımsız kaynaklardan doğrulaman tavsiye edilir.</p>
    </section>

    <section class="infoCard">
      <h3>🔄 Güncelleme</h3>
      <p>Listeyi güncellemek için GitHub’da sadece <b>data.json</b> dosyasını değiştirmen yeterlidir. Uygulama <b>anaFirma</b> ve <b>anafirma</b> alanlarını birlikte okuyabilir.</p>
      <div class="tagRow"><span class="tag green">Sürüm 1.1</span><span class="tag">Zeytin yeşili tema</span><span class="tag">Tam liste</span></div>
    </section>`;
}
function render(){renderStats(); if(view==='companies')return renderGroups('companies'); if(view==='categories')return renderGroups('categories'); if(view==='favorites')return renderFavorites(); if(view==='about')return renderAbout(); return renderHome()}
function setNav(){document.querySelectorAll('.bottomNav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view))}
function toggleFav(item){const name=item.marka; favorites=favorites.includes(name)?favorites.filter(x=>x!==name):[...favorites,name]; saveStore('boykot_favorites',favorites); render()}
function showDetail(item){els.detail.innerHTML=`<div class="detailInner"><h2>${esc(item.marka)}</h2><div class="tagRow"><span class="tag ${item.status==='boykot'?'danger':item.status==='alternatif'?'ok':'warn'}">${label(item)}</span><span class="tag blue">${esc(item.kod||'Kod yok')}</span></div><div class="detailGrid"><div class="detailRow"><span>Ana Firma</span><b>${esc(item.anafirma||'-')}</b></div><div class="detailRow"><span>Kategori</span><b>${esc(item.kategori||'-')}</b></div><div class="detailRow"><span>Alternatif</span><b>${esc(item.alternatif||'-')}</b></div><div class="detailRow"><span>Not</span><b>${esc(item.not||'-')}</b></div></div>${item.kaynak?`<a class="sourceLink" target="_blank" rel="noopener" href="${esc(item.kaynak)}">Kaynağı aç</a>`:''}</div>`; els.dialog.showModal()}
function applyTheme(){const t=localStorage.getItem('theme')||'light'; document.documentElement.dataset.theme=t; els.theme.textContent=t==='dark'?'☀':'☾'}
els.theme.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark'; localStorage.setItem('theme',next); applyTheme()};
els.search.addEventListener('input',()=>{activeQuery=''; view='home'; setNav(); render()}); els.clear.onclick=()=>{els.search.value=''; activeQuery=''; view='home'; setNav(); render()}; els.close.onclick=()=>els.dialog.close();
document.querySelectorAll('.bottomNav button').forEach(btn=>btn.onclick=()=>{view=btn.dataset.view; activeQuery=''; els.search.value=''; setNav(); render(); window.scrollTo({top:0,behavior:'smooth'})});
els.results.addEventListener('click',e=>{const fav=e.target.closest('[data-fav]'); if(fav){e.stopPropagation(); return toggleFav(DATA[Number(fav.dataset.fav)])} const det=e.target.closest('[data-detail], .card[data-id]'); if(det){const id=Number(det.dataset.detail ?? det.dataset.id); return showDetail(DATA[id])} const li=e.target.closest('[data-query]'); if(li){activeQuery=li.dataset.query; els.search.value=activeQuery; view='home'; setNav(); render(); window.scrollTo({top:0,behavior:'smooth'})}});
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}
init();
