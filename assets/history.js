/* ==========================================================================
   为什么中文 · ส่วนประวัติศาสตร์จีน — เส้นเวลาราชวงศ์ + จักรพรรดิ SVG ต้นฉบับ
   เครื่องทรงอ้างอิงตามจริง: 秦漢 玄色冕服 · 唐宋 赭黄常服+幞头 · 明 红龙袍+乌纱
   折角巾 · 清 明黄朝服+朝珠+暖帽
   ========================================================================== */
'use strict';

/* ---- ภาพจักรพรรดิ SVG ต้นฉบับ (วาดด้วยเวกเตอร์ ตามเครื่องทรงแต่ละราชวงศ์) ---- */
function emperorSVG(robe){
  const palettes = {
    bronze:{robe:'#8a6d3b', trim:'#5a4426', crown:'bronze'},
    zhou:{robe:'#9a6a44', trim:'#6a4526', crown:'mian'},
    qin:{robe:'#2e2e34', trim:'#c9a24a', crown:'mian', black:true},
    han:{robe:'#4a2420', trim:'#c9a24a', crown:'mian'},
    tang:{robe:'#d8a53a', trim:'#8a2a1e', crown:'futou', collar:'#8a2a1e'},
    song:{robe:'#e0c07a', trim:'#7a2a1e', crown:'futou', wide:true},
    yuan:{robe:'#5a6a8a', trim:'#c9a24a', crown:'yuan'},
    ming:{robe:'#b0261e', trim:'#f5c542', crown:'ming', dragon:true},
    qing:{robe:'#e8c81e', trim:'#2a4a8a', crown:'qing', qing:true}
  };
  const p = palettes[robe] || palettes.zhou;
  let crown = '';
  if(p.crown === 'mian'){
    crown = `<rect x="21" y="14" width="22" height="7" rx="1" fill="#1f1b16"/>
      <rect x="21" y="21" width="22" height="5" fill="#1f1b16"/>
      ${[0,1,2,3,4,5,6,7].map(i=>`<circle cx="${21+i*3.14}" cy="33" r="1.4" fill="#e8c81e"/>`).join('')}`;
  } else if(p.crown === 'futou'){
    crown = `<rect x="20" y="13" width="24" height="9" rx="2" fill="#1f1b16"/>
      <rect x="8" y="15" width="7" height="4" rx="1.5" fill="#1f1b16"/>
      <rect x="49" y="15" width="7" height="4" rx="1.5" fill="#1f1b16"/>`;
  } else if(p.crown === 'ming'){
    crown = `<path d="M20 14 Q32 8 44 14 L44 20 L20 20 Z" fill="#1f1b16"/>
      <rect x="8" y="15" width="12" height="3.4" rx="1.4" fill="#1f1b16"/>
      <rect x="44" y="15" width="12" height="3.4" rx="1.4" fill="#1f1b16"/>`;
  } else if(p.crown === 'yuan'){
    crown = `<path d="M20 15 Q32 9 44 15 L42 19 L22 19 Z" fill="#3a2e25"/>
      <circle cx="32" cy="12" r="2" fill="#e8c81e"/>`;
  } else if(p.crown === 'qing'){
    crown = `<path d="M18 18 Q32 7 46 18 L46 24 L18 24 Z" fill="#8a1e1e"/>
      <rect x="16" y="23" width="32" height="4" rx="2" fill="#3a2e25"/>
      <circle cx="32" cy="10" r="2.2" fill="#e8c81e"/>
      <circle cx="27" cy="12.5" r="1.4" fill="#c9a24a"/><circle cx="37" cy="12.5" r="1.4" fill="#c9a24a"/>`;
  } else {
    crown = `<rect x="21" y="14" width="22" height="8" rx="1" fill="#1f1b16"/>`;
  }
  const dragon = p.dragon ? `<path d="M26 38 q2 -6 6 -8 q-1 5 1 8 q-3 -1 -7 0z" fill="#f5c542"/>
    <path d="M32 40 q2 -4 4 -6 q0 4 0 6z" fill="#f5c542" opacity=".8"/>` : '';
  const qingBeads = p.qing ? `<path d="M25 34 q7 10 14 0 q-7 6 -14 0z" fill="none" stroke="#f5f5f0" stroke-width="2"/>
    ${[0,1,2,3].map(i=>`<circle cx="${25+i*4.6}" cy="${35+i*0}" r="1.6" fill="#d8e8ff"/>`).join('')}` : '';
  return `<svg viewBox="0 0 64 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${crown}
    <rect x="22" y="27" width="20" height="15" rx="3" fill="#f0d9b5"/>
    <rect x="20" y="42" width="24" height="40" rx="6" fill="${p.robe}"/>
    <rect x="20" y="42" width="24" height="5" fill="${p.trim}" opacity=".55"/>
    ${p.collar?`<path d="M20 42 L32 50 L44 42 L44 47 L32 56 L20 47 Z" fill="${p.collar}"/>`:''}
    ${dragon}${qingBeads}
    <rect x="30" y="40" width="4" height="10" rx="1.5" fill="#f0d9b5"/>
    <rect x="24" y="44" width="3.4" height="22" rx="1.6" fill="${p.trim}" opacity=".5"/>
    <rect x="36.6" y="44" width="3.4" height="22" rx="1.6" fill="${p.trim}" opacity=".5"/>
    <circle cx="29" cy="36" r="1.3" fill="#2a2018"/><circle cx="35" cy="36" r="1.3" fill="#2a2018"/>
    <path d="M28 40.5 Q32 42 36 40.5" stroke="#a05a3a" stroke-width="1" fill="none"/>
    <rect x="17" y="80" width="30" height="5" rx="2" fill="#1f1b16"/>
  </svg>`;
}

function dynasties(){ return (typeof WC_DATA !== 'undefined' && WC_DATA.dynasties) || []; }
let HIST = {sel: null};
function renderHistoryHub(){
  const box = $('#historyBox'); if(!box) return;
  const list = dynasties();
  box.innerHTML = `
    <div class="sec-head reveal" style="margin:30px auto 18px;text-align:center">
      <div class="kicker">Chinese History · 中国历史</div>
      <h2>ประวัติศาสตร์จีน — จากเซี่ย (夏) ถึงชิง (清)</h2>
      <p>คลิกที่ราชวงศ์บนเส้นเวลาเพื่อดูช่วงเวลา เหตุการณ์สำคัญ และความรุ่งเรืองของแต่ละยุค
         พร้อมภาพจักรพรรดิในเครื่องทรงตามแบบจริงของแต่ละราชวงศ์</p>
    </div>
    <div class="hist-timeline">
      <div class="ht-line"></div>
      ${list.map((d,i)=>`
        <button class="ht-node ${HIST.sel===i?'active':''}" style="--c:${d.color}" onclick="HIST.sel=${i};renderHistoryDetail();this.parentElement.querySelectorAll('.ht-node').forEach(n=>n.classList.remove('active'));this.classList.add('active')">
          <span class="ht-dot"></span>
          <span class="ht-name">${esc(d.n)}</span>
          <span class="ht-years">${esc(d.years.split('–')[0].replace('约',''))}</span>
        </button>`).join('')}
    </div>
    <div id="histDetail"></div>`;
  if(HIST.sel !== null && list[HIST.sel]){
    setTimeout(function(){
      renderHistoryDetail();
      const node = document.querySelectorAll('.ht-node')[HIST.sel];
      if(node) node.classList.add('active');
    }, 60);
  }
  observeReveals();
}
function renderHistoryDetail(){
  const box = $('#histDetail'); if(!box) return;
  const d = dynasties()[HIST.sel];
  if(!d){ box.innerHTML = ''; return; }
  box.innerHTML = `
    <div class="hist-card reveal in" style="--c:${d.color}">
      <div class="hist-figure">${emperorSVG(d.robe)}</div>
      <div class="hist-body">
        <div class="hist-head">
          <h3>${esc(d.cn)} <span>${esc(d.years)}</span></h3>
          <div class="hist-facts">
            <span class="tag-pill">ผู้สถาปนา: ${esc(d.founder)}</span>
            <span class="tag-pill">เมืองหลวง: ${esc(d.capital)}</span>
          </div>
        </div>
        <div class="hist-cols">
          <div class="hist-col">
            <b>${ICON('flag')} เหตุการณ์สำคัญ</b>
            ${d.events.map(e=>`<p>${esc(e)}</p>`).join('')}
          </div>
          <div class="hist-col">
            <b>${ICON('sparkles')} ความรุ่งเรืองของยุค</b>
            ${d.devs.map(e=>`<p>${esc(e)}</p>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  const el = box.firstElementChild;
  if(el){ el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
}
