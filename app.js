const DEV=['panel','detector','callpoint','card','psu','ffphone','ext','zone'],FAULT=['comm','open','dup','no24','bad','noresp'];
const $=id=>document.getElementById(id),K='tcl_rows',S='tcl_site';
let LANG=localStorage.getItem('tcl_lang')||'he';if(!I18N[LANG])LANG='he';const t=k=>I18N[LANG][k]??I18N.he[k]??k;
const dvL=c=>c?(I18N[LANG].dev[c]||c):'',ftL=c=>I18N[LANG].fault[c]||c;
// --- migration v0.1 (Hebrew strings) -> codes; unknown values kept as-is ---
(()=>{const HD=I18N.he.dev,HF=I18N.he.fault,rd={},rf={};for(const k in HD)rd[HD[k]]=k;for(const k in HF)rf[HF[k]]=k;
 const mr=r=>{if(r&&typeof r==='object'){if(r.dev&&rd[r.dev])r.dev=rd[r.dev];if(Array.isArray(r.faults))r.faults=r.faults.map(f=>rf[f]||f)}return r};
 const J=(k,f)=>{const v=localStorage.getItem(k);if(v==null)return;try{const o=JSON.parse(v);localStorage.setItem(k,JSON.stringify(f(o)))}catch(e){}};
 if(localStorage.getItem('tcl_schema')!=='2'){const bk={};['tcl_rows','tcl_history','tcl_form'].forEach(k=>{const v=localStorage.getItem(k);if(v!=null)bk[k]=v});
  if(Object.keys(bk).length&&!localStorage.getItem('tcl_backup_v01'))localStorage.setItem('tcl_backup_v01',JSON.stringify(bk));
  J('tcl_rows',o=>Array.isArray(o)?o.map(mr):o);J('tcl_history',o=>Array.isArray(o)?o.map(h=>(h&&Array.isArray(h.rows)&&h.rows.forEach(mr),h)):o);J('tcl_form',o=>mr(o));
  localStorage.setItem('tcl_schema','2')}})();
let rows=JSON.parse(localStorage.getItem(K)||'[]'),editId=null,dev=null,faults=[];
let save=()=>localStorage.setItem(K,JSON.stringify(rows));
const site=JSON.parse(localStorage.getItem(S)||'{}');$('siteName').value=site.name||'';$('siteAddr').value=site.addr||'';
['siteName','siteAddr'].forEach(i=>$(i).oninput=()=>localStorage.setItem(S,JSON.stringify({name:$('siteName').value,addr:$('siteAddr').value})));
for(let i=1;i<=8;i++)$('loop').add(new Option('L'+i,'L'+i));$('loop').add(new Option('',''),0);$('loop').value='';
for(let i=1;i<=16;i++)$('zone').add(new Option(''+i,i));

function chips(el,arr,multi){el.innerHTML='';arr.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.c=v;b.textContent=multi?ftL(v):dvL(v);b.onclick=()=>{
 if(multi){faults=faults.includes(v)?faults.filter(x=>x!==v):[...faults,v]}else{dev=dev===v?null:v;applyDev()}paint()};el.appendChild(b)})}
function paint(){[...$('devChips').children].forEach(b=>b.classList.toggle('on',b.dataset.c===dev));[...$('faultChips').children].forEach(b=>b.classList.toggle('on',faults.includes(b.dataset.c)))}
function applyDev(){const z=dev==='zone';$('zoneBox').classList.toggle('hide',!z);$('addrBox').classList.toggle('hide',z);if(z){$('loop').value='';$('addr').value='';$('addrErr').textContent=''}}
chips($('devChips'),DEV,false);chips($('faultChips'),FAULT,true);
$('addr').oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,3);validAddr()};
function validAddr(){const v=$('addr').value;let m='';if(v&&!(+v>=1&&+v<=127))m=t('errAddr');else if(v&&!$('loop').value)m=t('errLoop');$('addrErr').textContent=m;return!m}
$('loop').onchange=validAddr;
function openForm(r){editId=r?r.id:null;dev=r?r.dev:null;faults=r?[...r.faults]:[];$('loop').value=r?.loop||'';$('addr').value=r?.addr||'';$('zone').value=r?.zone||1;$('model').value=r?.model||'';$('note').value=r?.note||'';$('loc').value=r?.loc||'';$('part').value=r?.part||'';$('work').value=r?.work||'';$('formErr').textContent='';$('addrErr').textContent='';applyDev();paint();$('form').classList.remove('hide');$('form').scrollIntoView({behavior:'smooth'})}
$('newBtn').onclick=()=>openForm(null);$('cancelBtn').onclick=()=>$('form').classList.add('hide');
$('form').onsubmit=e=>{e.preventDefault();if(!validAddr())return;const z=dev==='zone';
 const r={dev,loop:z?'':$('loop').value,addr:z?'':$('addr').value,zone:z?+$('zone').value:null,model:$('model').value.trim(),faults:[...faults],note:$('note').value.trim(),loc:$('loc').value.trim(),part:$('part').value.trim(),work:$('work').value.trim()};
 if(!r.dev&&!r.addr&&!r.model&&!r.faults.length&&!r.note&&!r.loc&&!r.part&&!r.work){$('formErr').textContent=t('errEmpty');return}
 if(editId){Object.assign(rows.find(x=>x.id===editId),r,{updated:Date.now()})}else rows.unshift({id:Date.now()+''+Math.random().toString(36).slice(2,6),ts:Date.now(),fixed:false,...r});
 save();$('form').classList.add('hide');render()};
const fmt=x=>new Date(x).toLocaleString(t('loc'),{dateStyle:'short',timeStyle:'short'});
const where=r=>r.zone?t('zone')+' '+r.zone:(r.loop||r.addr)?(r.loop||'')+(r.addr?'/'+String(r.addr).padStart(3,'0'):''):'';
const line=r=>[where(r),r.loc&&t('locW')+': '+r.loc,dvL(r.dev),r.model,r.faults.map(ftL).join(', '),r.note,r.part&&t('replaced')+' '+r.part,r.work&&t('doneW')+' '+r.work].filter(Boolean).join(' | ');
function card(r){const d=document.createElement('div');d.className='card item'+(r.fixed?' fixed':'');
 const T=(c,t)=>t?`<span class="tag ${c}"></span>`:'';
 d.innerHTML=`<div class="body"><div class="tags"></div></div><div class="acts"><button class="f">${r.fixed?t('unfixBtn'):t('fixBtn')}</button><button class="e">${t('edit')}</button><button class="d">${t('del')}</button></div>`;
 const tg=d.querySelector('.tags'),add=(c,t)=>{if(!t)return;const s=document.createElement('span');s.className='tag '+c;s.textContent=t;tg.appendChild(s)};
 add('a',where(r));add('',dvL(r.dev));add('m',r.model);r.faults.forEach(f=>add('f',ftL(f)));
 const b=d.querySelector('.body'),ln=(c,h,t)=>{if(!t)return;const e=document.createElement('div');e.className=c;if(h){const x=document.createElement('b');x.textContent=h+' ';e.appendChild(x)}e.appendChild(document.createTextNode(t));b.appendChild(e)};
 ln('n','📍 ',r.loc);ln('n','',r.note);ln('w',t('doneW'),r.work);ln('w',t('replaced'),r.part);ln('ts','',fmt(r.ts));
 d.querySelector('button.f').onclick=()=>{r.fixed=!r.fixed;save();render()};d.querySelector('button.e').onclick=()=>openForm(r);
 d.querySelector('button.d').onclick=()=>{if(confirm(t('confDel'))){rows=rows.filter(x=>x!==r);save();render()}};return d}
function render(){const o=rows.filter(r=>!r.fixed),f=rows.filter(r=>r.fixed);
 $('hOpen').textContent=`${t('openH')} (${o.length})`;$('hDone').textContent=`${t('doneH')} (${f.length})`;
 $('list').innerHTML=o.length?'':'<div class="card" style="text-align:center;color:#777">'+t('noOpen')+'</div>';$('done').innerHTML='';
 o.forEach(r=>$('list').appendChild(card(r)));f.forEach(r=>$('done').appendChild(card(r)))}
$('clearBtn').onclick=()=>{if(rows.length&&confirm(t('confClear'))){rows=[];save();render()}};
const exportText=(n,ad,rs,ts)=>['Trouble Check List',t('siteName')+': '+n,t('siteAddr')+': '+ad,t('date')+': '+dmy(ts)+' '+hm(ts),'',...[...rs.filter(r=>!r.fixed),...rs.filter(r=>r.fixed)].map((r,i)=>`${i+1}. ${r.fixed?'['+t('didX')+'] ':''}${line(r)} (${fmt(r.ts)})`)].join('\n');
async function shareText(x){if(navigator.share)try{await navigator.share({title:'Trouble Check List',text:x});return}catch(e){}
 try{await navigator.clipboard.writeText(x);alert(t('copied'))}catch(e){prompt(t('copyP'),x)}}
$('shareBtn').onclick=()=>shareText(exportText($('siteName').value,$('siteAddr').value,rows,Date.now()));
// demo data only via ?demo=1
if(new URLSearchParams(location.search).get('demo')==='1'){const n=Date.now(),m=60000;
 localStorage.setItem(S,JSON.stringify({name:'בניין משרדים "מגדל הים" (דמו)',addr:'רח׳ הנמל 12, חיפה'}));$('siteName').value='בניין משרדים "מגדל הים" (דמו)';$('siteAddr').value='רח׳ הנמל 12, חיפה';
 rows=[{id:'d1',ts:n-5*m,dev:'detector',loop:'L2',addr:'45',model:'TFO-480A',faults:['open'],note:'',loc:'קומה 3, חדר שרתים',part:'TFO-480A',work:'הוחלף גלאי ותוכנתה כתובת 45 עם PROG-4000',fixed:false},
 {id:'d2',ts:n-20*m,dev:'callpoint',loop:'L1',addr:'112',model:'ADR-801',faults:['dup'],note:'',loc:'לובי כניסה ראשית',fixed:false},
 {id:'d3',ts:n-35*m,dev:'zone',loop:'',addr:'',zone:7,model:'TFO-440',faults:['noresp'],note:'מערכת אזורית',loc:'חניון -1',part:'TFO-440',work:'הוחלף גלאי אזורי, נבדק בעשן',fixed:true},
 {id:'d4',ts:n-50*m,dev:'psu',loop:'',addr:'',model:'TPS-74A',faults:['no24'],note:'',loc:'חדר חשמל קומה 0',part:'',work:'נבדק פיוז יציאה, נמדד 0V - ממתין לחלק',fixed:false},
 {id:'d5',ts:n-70*m,dev:null,loop:'',addr:'',model:'',faults:[],note:'נורית תקלה כללית ברכזת - לבדוק סוללות',fixed:false},
 {id:'d6',ts:n-90*m,dev:'card',loop:'L3',addr:'7',model:'ADR-712',faults:['comm'],note:'',part:'ADR-712',work:'הוחלף כרטיס וחובר מחדש כבל SLC',fixed:true}];save();const D=86400000;
 localStorage.setItem('tcl_job',JSON.stringify({id:'h0',ro:false}));localStorage.setItem('tcl_history',JSON.stringify([{id:'h0',ts:n,status:'open',name:'בניין משרדים "מגדל הים" (דמו)',addr:'רח׳ הנמל 12, חיפה',rows:JSON.parse(JSON.stringify(rows))},{id:'h1',status:'done',ts:n-D-3*3600000,name:'קניון הצפון (דמו)',addr:'דרך העצמאות 40, קריית אתא',rows:[{id:'x',ts:n-D,dev:'detector',loop:'L1',addr:'12',model:'TFH-280A',faults:['noresp'],note:'',part:'TFH-280A',work:'הוחלף גלאי',fixed:true}]},{id:'h2',status:'open',ts:n-D-6*3600000,name:'בית ספר אורנים (דמו)',addr:'רח׳ האלה 5, נשר',rows:[]},{id:'h3',status:'done',ts:n-4*D,name:'מפעל פלדה (דמו)',addr:'אזור תעשייה צפוני, עכו',rows:[]}]))}
const HK='tcl_history',JK='tcl_job';let hist=JSON.parse(localStorage.getItem(HK)||'[]'),job=JSON.parse(localStorage.getItem(JK)||'null')||{id:'j'+Date.now(),ro:false},hf='all';
const saveJob=()=>localStorage.setItem(JK,JSON.stringify(job)),saveHist=()=>localStorage.setItem(HK,JSON.stringify(hist));
const dmy=x=>{const d=new Date(x),p=n=>String(n).padStart(2,'0'),s=LANG==='ru'?'.':'/';return `${p(d.getDate())}${s}${p(d.getMonth()+1)}${s}${d.getFullYear()}`},hm=x=>{const d=new Date(x);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const empty=()=>!rows.length&&!$('siteName').value.trim()&&!$('siteAddr').value.trim();
function upsert(status){let h=hist.find(x=>x.id===job.id);const now=Date.now();
 if(!h){h={id:job.id,created:now};hist.push(h)}Object.assign(h,{ts:now,status,name:$('siteName').value.trim(),addr:$('siteAddr').value.trim(),rows:JSON.parse(JSON.stringify(rows))});saveHist();renderHist()}
function loadJob(h,ro){job={id:h?h.id:'j'+Date.now(),ro:!!ro};saveJob();rows=JSON.parse(JSON.stringify(h?h.rows:[]));save();$('siteName').value=h?h.name:'';$('siteAddr').value=h?h.addr:'';
 localStorage.setItem(S,JSON.stringify({name:$('siteName').value,addr:$('siteAddr').value}));applyRO();$('form').classList.add('hide');render();scrollTo(0,0)}
function applyRO(){document.body.classList.toggle('ro',job.ro);['siteName','siteAddr'].forEach(i=>$(i).disabled=job.ro);
 const h=hist.find(x=>x.id===job.id);$('jobStat').innerHTML='';const s=document.createElement('span');s.className='badge '+(h?.status==='done'?'done':'open');s.textContent=h?(h.status==='done'?t('stDone'):t('stOpen')):t('draft');$('jobStat').appendChild(s)}
$('saveJobBtn').onclick=()=>{if(empty()){alert(t('nothingSave'));return}upsert('open');applyRO();toast(t('savedOpen'))};
$('newJobBtn').onclick=()=>{if(!job.ro&&!empty())upsert(hist.find(x=>x.id===job.id)?.status==='done'?'done':'open');loadJob(null)};
$('doneBtn').onclick=()=>{if(empty()){alert(t('nothingDone'));return}if(!confirm(t('confDone')))return;upsert('done');loadJob(null);toast(t('closedToast'))};
$('reopenBtn').onclick=()=>{const h=hist.find(x=>x.id===job.id);if(h){h.status='open';saveHist()}job.ro=false;saveJob();applyRO();renderHist()};
function toast(m){const e=$('toast');e.textContent=m;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),1800)}
// autosave: draft persists in localStorage on every change; existing open jobs also sync to history
const _save=save;save=()=>{_save();const h=hist.find(x=>x.id===job.id);if(h&&!job.ro&&h.status==='open'){h.rows=JSON.parse(JSON.stringify(rows));h.ts=Date.now();saveHist();renderHist()}};
['siteName','siteAddr'].forEach(i=>$(i).addEventListener('input',()=>{const h=hist.find(x=>x.id===job.id);if(h&&!job.ro){h.name=$('siteName').value;h.addr=$('siteAddr').value;saveHist()}}));
$('hSearch').oninput=()=>renderHist();document.querySelectorAll('#hFilter .chip').forEach(b=>b.onclick=()=>{hf=b.dataset.f;renderHist()});
function renderHist(){const el=$('hist');el.innerHTML='';const q=($('hSearch').value||'').trim().toLowerCase(),qd=q.replace(/[.\-]/g,'/'),ds=x=>dmy(x).replace(/\./g,'/');const L=[...hist].filter(h=>(hf==='all'||h.status===hf)&&(!q||(h.name||'').toLowerCase().includes(q)||(h.addr||'').toLowerCase().includes(q)||ds(h.ts).includes(qd)||ds(h.ts).replace(/\/0/g,'/').replace(/^0/,'').includes(qd))).sort((a,b)=>b.ts-a.ts);
 document.querySelectorAll('#hFilter .chip').forEach(b=>b.classList.toggle('on',b.dataset.f===hf));
 $('hHist').textContent=`${t('histH')} (${hist.length}) · ${t('stOpen')} ${hist.filter(h=>h.status==='open').length} · ${t('stDoneP')} ${hist.filter(h=>h.status==='done').length}`;let last='';
 if(!L.length)el.innerHTML='<div class="card" style="text-align:center;color:#777">'+t('noCalls')+'</div>';
 L.forEach(h=>{const day=dmy(h.ts);
  const d=document.createElement('div');d.className='card item hist '+h.status+(h.id===job.id?' cur':'');const o=h.rows.filter(r=>!r.fixed).length;
  d.innerHTML='<div class="body"><div class="hd8"></div><div class="hn"><span class="nm"></span> <span class="badge"></span></div><div class="ha"></div><div class="ts"></div></div><div class="acts"><button class="hl"></button><button class="hs">'+t('share').split(' ')[0]+'</button><button class="hd">'+t('del')+'</button></div>';
  const bd=d.querySelector('.badge');bd.className='badge '+h.status;bd.textContent=h.status==='done'?t('stDone'):t('stOpen');
  d.querySelector('.nm').textContent=h.name||t('noName');d.querySelector('.ha').textContent=h.addr||t('noAddr');
  d.querySelector('.hd8').textContent=`${dmy(h.ts)} ${hm(h.ts)}`;d.querySelector('.ts').textContent=`${h.rows.length} ${t('faultsN')} · ${o} ${t('openN')}`;
  d.querySelector('.hl').textContent=h.status==='done'?t('view'):t('cont');
  d.querySelector('.hl').onclick=()=>{if(h.id===job.id){scrollTo(0,0);return}if(!job.ro&&!empty())upsert(hist.find(x=>x.id===job.id)?.status==='done'?'done':'open');loadJob(h,h.status==='done')};
  d.querySelector('.hs').onclick=()=>shareText(exportText(h.name,h.addr,h.rows,h.ts));
  d.querySelector('.hd').onclick=()=>{if(confirm(t('confHDel'))){hist=hist.filter(x=>x!==h);saveHist();if(h.id===job.id){job={id:'j'+Date.now(),ro:false};saveJob();applyRO()}renderHist()}};el.appendChild(d)})}
applyRO();
const FK='tcl_form';let ft;
function formState(){return{open:!$('form').classList.contains('hide'),editId,dev,faults:[...faults],loop:$('loop').value,addr:$('addr').value,zone:$('zone').value,model:$('model').value,note:$('note').value,loc:$('loc').value,part:$('part').value,work:$('work').value}}
function saveDraft(){clearTimeout(ft);const f=formState();if(f.open)localStorage.setItem(FK,JSON.stringify(f));else localStorage.removeItem(FK);localStorage.setItem(S,JSON.stringify({name:$('siteName').value,addr:$('siteAddr').value}))}
const deb=()=>{clearTimeout(ft);ft=setTimeout(saveDraft,300)};
document.addEventListener('input',deb);document.addEventListener('change',deb);document.addEventListener('click',e=>{if(e.target.closest('#form,.chip'))deb()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveDraft()});addEventListener('pagehide',saveDraft);
$('form').addEventListener('submit',()=>setTimeout(saveDraft,0));$('cancelBtn').addEventListener('click',()=>localStorage.removeItem(FK));
(()=>{if(new URLSearchParams(location.search).get('demo')==='1')return;const f=JSON.parse(localStorage.getItem(FK)||'null');
 if(f&&f.open){openForm(f.editId?rows.find(x=>x.id===f.editId)||null:null);editId=f.editId;dev=f.dev;faults=f.faults||[];['loop','addr','zone','model','note','loc','part','work'].forEach(k=>$(k).value=f[k]??'');applyDev();if(dev!=='zone'){$('loop').value=f.loop;$('addr').value=f.addr}validAddr();paint()}
 if((f&&f.open)||!empty())setTimeout(()=>toast(t('restored')),300)})();
function applyLang(){const L=I18N[LANG];document.documentElement.lang=LANG;document.documentElement.dir=L.dir;
 document.querySelectorAll('[data-i]').forEach(e=>e.textContent=t(e.dataset.i));document.querySelectorAll('[data-ph]').forEach(e=>{e.placeholder=t(e.dataset.ph);e.setAttribute('aria-label',t(e.dataset.ph))});
 $('loop').options[0].text=t('noLoop');[...$('zone').options].forEach(o=>o.text=t('zone')+' '+o.value);
 $('models').innerHTML='';TF_MODELS.forEach(m=>{const o=document.createElement('option');o.value=m.model;o.label=L.cat[m.category]||'';$('models').appendChild(o)});
 [...$('devChips').children].forEach(b=>b.textContent=dvL(b.dataset.c));[...$('faultChips').children].forEach(b=>b.textContent=ftL(b.dataset.c));
 document.querySelectorAll('#langs button').forEach(b=>b.classList.toggle('on',b.dataset.l===LANG));if($('addrErr').textContent)validAddr();applyRO();render();renderHist()}
document.querySelectorAll('#langs button').forEach(b=>b.onclick=()=>{LANG=b.dataset.l;localStorage.setItem('tcl_lang',LANG);applyLang()});
applyLang();
if('serviceWorker'in navigator){let reloading=false,wantUpd=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(wantUpd&&!reloading){reloading=true;location.reload()}});
 const show=async w=>{let v={};try{v=await (await fetch('version.json?t='+Date.now(),{cache:'no-store'})).json()}catch(e){}
  const bn=$('upd');bn.querySelector('span').textContent=`${t('newVer')}${v.version?' (v'+v.version+')':''} – ${t('upd')}`+((v.changelogs&&v.changelogs[LANG])||v.changelog?' · '+((v.changelogs&&v.changelogs[LANG])||v.changelog):'');bn.classList.remove('hide');bn.onclick=()=>{wantUpd=true;w.postMessage('SKIP_WAITING')}};
 navigator.serviceWorker.register('sw.js').then(reg=>{const chk=()=>{if(reg.waiting&&navigator.serviceWorker.controller)show(reg.waiting)};chk();
  reg.addEventListener('updatefound',()=>{const n=reg.installing;n&&n.addEventListener('statechange',()=>{if(n.state==='installed')chk()})});
  const up=()=>reg.update().catch(()=>{});document.addEventListener('visibilitychange',()=>{if(!document.hidden)up()});setInterval(up,30*60000);window.__checkUpdate=up;
  $('chkBtn').onclick=async()=>{const cur=$('ver').textContent.trim();if(!navigator.onLine){toast(t('noConn'));return}toast(t('checking'));
   let v;try{v=await (await fetch('version.json?t='+Date.now(),{cache:'no-store'})).json()}catch(e){toast(t('noConn'));return}
   try{await reg.update()}catch(e){}
   if(reg.waiting&&navigator.serviceWorker.controller){show(reg.waiting);return}
   if(v.version&&v.version!==cur){const w=await new Promise(res=>{const n=reg.installing;if(!n)return res(reg.waiting);n.addEventListener('statechange',()=>{if(n.state==='installed'||n.state==='redundant')res(reg.waiting)});setTimeout(()=>res(reg.waiting),15000)});
    if(w){show(w);return}}
   toast(t('upToDate')+' (v'+cur+')')}})}
else $('chkBtn').onclick=()=>toast(t('upToDate')+' (v'+$('ver').textContent+')');
