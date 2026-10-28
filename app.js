const DEV=['רכזת גילוי','גלאי','לחצן','כרטיס','ספק כוח','ממשק טלפון כבאים','ממשק ניטרול אזורים - כיבוי','אזור'];
const FAULT=['תקשורת','נתק','כתובת זהה','חוסר 24','אביזר פגום','לא מגיב'];
const CAT={panel:'רכזת',detector:'גלאי',detector_base:'בסיס',call_point:'לחצן',module_card:'כרטיס/מודול',extinguishing_interface:'כיבוי',power_supply:'ספק כוח',firefighter_phone:'טלפון כבאים',tool:'כלי'};
const $=id=>document.getElementById(id),K='tcl_rows',S='tcl_site';
let rows=JSON.parse(localStorage.getItem(K)||'[]'),editId=null,dev=null,faults=[];
const save=()=>localStorage.setItem(K,JSON.stringify(rows));
const site=JSON.parse(localStorage.getItem(S)||'{}');$('siteName').value=site.name||'';$('siteAddr').value=site.addr||'';
['siteName','siteAddr'].forEach(i=>$(i).oninput=()=>localStorage.setItem(S,JSON.stringify({name:$('siteName').value,addr:$('siteAddr').value})));
for(let i=1;i<=8;i++)$('loop').add(new Option('L'+i,'L'+i));$('loop').add(new Option('ללא לופ',''),0);$('loop').value='';
for(let i=1;i<=16;i++)$('zone').add(new Option('אזור '+i,i));
TF_MODELS.forEach(m=>{const o=document.createElement('option');o.value=m.model;o.label=CAT[m.category]||'';$('models').appendChild(o)});
function chips(el,arr,multi){el.innerHTML='';arr.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=v;b.onclick=()=>{
 if(multi){faults=faults.includes(v)?faults.filter(x=>x!==v):[...faults,v]}else{dev=dev===v?null:v;applyDev()}paint()};el.appendChild(b)})}
function paint(){[...$('devChips').children].forEach(b=>b.classList.toggle('on',b.textContent===dev));[...$('faultChips').children].forEach(b=>b.classList.toggle('on',faults.includes(b.textContent)))}
function applyDev(){const z=dev==='אזור';$('zoneBox').classList.toggle('hide',!z);$('addrBox').classList.toggle('hide',z);if(z){$('loop').value='';$('addr').value='';$('addrErr').textContent=''}}
chips($('devChips'),DEV,false);chips($('faultChips'),FAULT,true);
$('addr').oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,3);validAddr()};
function validAddr(){const v=$('addr').value;let m='';if(v&&!(+v>=1&&+v<=127))m='כתובת חייבת להיות מספר שלם 1 עד 127';else if(v&&!$('loop').value)m='יש לבחור לופ L1-L8';$('addrErr').textContent=m;return!m}
$('loop').onchange=validAddr;
function openForm(r){editId=r?r.id:null;dev=r?r.dev:null;faults=r?[...r.faults]:[];$('loop').value=r?.loop||'';$('addr').value=r?.addr||'';$('zone').value=r?.zone||1;$('model').value=r?.model||'';$('note').value=r?.note||'';$('part').value=r?.part||'';$('work').value=r?.work||'';$('formErr').textContent='';$('addrErr').textContent='';applyDev();paint();$('form').classList.remove('hide');$('form').scrollIntoView({behavior:'smooth'})}
$('newBtn').onclick=()=>openForm(null);$('cancelBtn').onclick=()=>$('form').classList.add('hide');
$('form').onsubmit=e=>{e.preventDefault();if(!validAddr())return;const z=dev==='אזור';
 const r={dev,loop:z?'':$('loop').value,addr:z?'':$('addr').value,zone:z?+$('zone').value:null,model:$('model').value.trim(),faults:[...faults],note:$('note').value.trim(),part:$('part').value.trim(),work:$('work').value.trim()};
 if(!r.dev&&!r.addr&&!r.model&&!r.faults.length&&!r.note&&!r.part&&!r.work){$('formErr').textContent='יש למלא לפחות שדה אחד או תיאור חופשי';return}
 if(editId){Object.assign(rows.find(x=>x.id===editId),r,{updated:Date.now()})}else rows.unshift({id:Date.now()+''+Math.random().toString(36).slice(2,6),ts:Date.now(),fixed:false,...r});
 save();$('form').classList.add('hide');render()};
const fmt=t=>new Date(t).toLocaleString('he-IL',{dateStyle:'short',timeStyle:'short'});
const where=r=>r.zone?'אזור '+r.zone:(r.loop||r.addr)?(r.loop||'')+(r.addr?'/'+String(r.addr).padStart(3,'0'):''):'';
const line=r=>[where(r),r.dev,r.model,r.faults.join(', '),r.note,r.part&&'הוחלף: '+r.part,r.work&&'בוצע: '+r.work].filter(Boolean).join(' | ');
function card(r){const d=document.createElement('div');d.className='card item'+(r.fixed?' fixed':'');
 const T=(c,t)=>t?`<span class="tag ${c}"></span>`:'';
 d.innerHTML=`<div class="body"><div class="tags"></div></div><div class="acts"><button class="f">${r.fixed?'↺ פתוח':'✓ תוקן'}</button><button class="e">עריכה</button><button class="d">מחיקה</button></div>`;
 const tg=d.querySelector('.tags'),add=(c,t)=>{if(!t)return;const s=document.createElement('span');s.className='tag '+c;s.textContent=t;tg.appendChild(s)};
 add('a',where(r));add('',r.dev);add('m',r.model);r.faults.forEach(f=>add('f',f));
 const b=d.querySelector('.body'),ln=(c,h,t)=>{if(!t)return;const e=document.createElement('div');e.className=c;if(h){const x=document.createElement('b');x.textContent=h+' ';e.appendChild(x)}e.appendChild(document.createTextNode(t));b.appendChild(e)};
 ln('n','',r.note);ln('w','מה בוצע:',r.work);ln('w','הוחלף:',r.part);ln('ts','',fmt(r.ts));
 d.querySelector('button.f').onclick=()=>{r.fixed=!r.fixed;save();render()};d.querySelector('button.e').onclick=()=>openForm(r);
 d.querySelector('button.d').onclick=()=>{if(confirm('למחוק את התקלה?')){rows=rows.filter(x=>x!==r);save();render()}};return d}
function render(){const o=rows.filter(r=>!r.fixed),f=rows.filter(r=>r.fixed);
 $('hOpen').textContent=`תקלות פתוחות (${o.length})`;$('hDone').textContent=`בוצע (${f.length})`;
 $('list').innerHTML=o.length?'':'<div class="card" style="text-align:center;color:#777">אין תקלות פתוחות</div>';$('done').innerHTML='';
 o.forEach(r=>$('list').appendChild(card(r)));f.forEach(r=>$('done').appendChild(card(r)))}
$('clearBtn').onclick=()=>{if(rows.length&&confirm('למחוק את כל התקלות?')){rows=[];save();render()}};
$('shareBtn').onclick=async()=>{const t=['Trouble Check List','שם אתר: '+$('siteName').value,'כתובת אתר: '+$('siteAddr').value,'תאריך: '+fmt(Date.now()),'',...[...rows.filter(r=>!r.fixed),...rows.filter(r=>r.fixed)].map((r,i)=>`${i+1}. ${r.fixed?'[בוצע] ':''}${line(r)} (${fmt(r.ts)})`)].join('\n');
 if(navigator.share)try{await navigator.share({title:'Trouble Check List',text:t});return}catch(e){}
 try{await navigator.clipboard.writeText(t);alert('הרשימה הועתקה')}catch(e){prompt('העתק:',t)}};
// demo data only via ?demo=1
if(new URLSearchParams(location.search).get('demo')==='1'){const n=Date.now(),m=60000;
 localStorage.setItem(S,JSON.stringify({name:'בניין משרדים "מגדל הים" (דמו)',addr:'רח׳ הנמל 12, חיפה'}));$('siteName').value='בניין משרדים "מגדל הים" (דמו)';$('siteAddr').value='רח׳ הנמל 12, חיפה';
 rows=[{id:'d1',ts:n-5*m,dev:'גלאי',loop:'L2',addr:'45',model:'TFO-480A',faults:['נתק'],note:'קומה 3, חדר שרתים',part:'TFO-480A',work:'הוחלף גלאי ותוכנתה כתובת 45 עם PROG-4000',fixed:false},
 {id:'d2',ts:n-20*m,dev:'לחצן',loop:'L1',addr:'112',model:'ADR-801',faults:['כתובת זהה'],note:'',fixed:false},
 {id:'d3',ts:n-35*m,dev:'אזור',loop:'',addr:'',zone:7,model:'TFO-440',faults:['לא מגיב'],note:'מערכת אזורית בחניון',part:'TFO-440',work:'הוחלף גלאי אזורי, נבדק בעשן',fixed:true},
 {id:'d4',ts:n-50*m,dev:'ספק כוח',loop:'',addr:'',model:'TPS-74A',faults:['חוסר 24'],note:'',part:'',work:'נבדק פיוז יציאה, נמדד 0V - ממתין לחלק',fixed:false},
 {id:'d5',ts:n-70*m,dev:null,loop:'',addr:'',model:'',faults:[],note:'נורית תקלה כללית ברכזת - לבדוק סוללות',fixed:false},
 {id:'d6',ts:n-90*m,dev:'כרטיס',loop:'L3',addr:'7',model:'ADR-712',faults:['תקשורת'],note:'',part:'ADR-712',work:'הוחלף כרטיס וחובר מחדש כבל SLC',fixed:true}];save()}
render();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
