/* ==========================================================================
   为什么中文 · ฝึกเขียนอักษรจีน (อยู่ในหน้าอักษรจีน)
   แอนิเมชันลำดับขีดตามมาตรฐาน 笔顺规范 กระทรวงศึกษาธิการจีน
   ระบบพิกัดข้อมูล: แกน Y ชี้ขึ้น (makemeahanzi, y ∈ [-124, 900]) —
   เรนเดอร์ต้อง flip ด้วย transform translate(0,900) scale(1,-1) เสมอ
   ========================================================================== */
'use strict';

const STROKES = (typeof WC_DATA !== 'undefined' && WC_DATA.strokes) || {};
const WRITE_FREE = 50;              /* จำนวนตัวแรก (ตามความถี่) ที่เรียนฟรี */
const WRITE_FREE_BONUS = ['你','我','好','爱','学','语','谢','老','师','朋','友','家','吃','喝','看','听','说','读','写'];
const CHAR_BOUNDS = {minX:0, minY:-124, maxX:1024, maxY:900};   /* ขอบเขตมาตรฐานของชุดข้อมูล */

function strokeChars(){ return CHARS.filter(c => STROKES[c.c]); }
function hasStrokeData(ch){ return !!(STROKES[ch]); }
function strokeCount(ch){ const d = STROKES[ch]; return d ? d.s.length : 0; }
function isWriteFree(ch){
  const list = strokeChars();
  const idx = list.findIndex(c => c.c === ch);
  return idx > -1 && (idx < WRITE_FREE || WRITE_FREE_BONUS.includes(ch));
}
/* flip ข้อมูล (y ชี้ขึ้น) → พิกัดหน้าจอ (y ชี้ลง) */
function flipY(y){ return 900 - y; }

/* ==========================================================================
   พื้นฐานขีด 8 ขีด (笔画) — path + เส้นมัธยฐานในพิกัดข้อมูลเดียวกัน
   ========================================================================== */
const BASIC_STROKES = [
  {id:'heng',   name:'横 · ขีดนอน',   sub:'ลากจากซ้ายไปขวา ปลายยกขึ้นเล็กน้อย', ex:'一', exPy:'yī',
   s:'M 150 500 Q 400 492 640 494 Q 790 496 870 510 L 855 545 Q 500 530 145 545 Z',
   m:[[150,512],[380,505],[640,505],[870,522]]},
  {id:'shu',    name:'竖 · ขีดตั้ง',   sub:'ลากจากบนลงล่าง น้ำหนักเสมอต้นเสมอปลาย', ex:'十', exPy:'shí',
   s:'M 470 850 L 470 180 Q 470 160 500 158 L 524 158 Q 554 160 554 180 L 554 850 Z',
   m:[[512,840],[512,560],[512,300],[512,180]]},
  {id:'pie',    name:'撇 · ขีดเฉียงซ้าย', sub:'เริ่มหนักหัวแล้วตวัดลงซ้าย ค่อย ๆ เบา', ex:'人', exPy:'rén',
   s:'M 660 860 Q 500 620 360 360 Q 320 280 260 220 L 215 195 Q 205 185 220 175 L 245 165 Q 320 200 400 320 Q 520 520 700 790 L 720 830 Q 722 845 700 850 Z',
   m:[[680,830],[520,580],[380,330],[240,180]]},
  {id:'na',     name:'捺 · ขีดเฉียงขวา', sub:'เริ่มเบาแล้วกดหนักที่ปลาย ตวัดเท้าออกขวา', ex:'八', exPy:'bā',
   s:'M 330 860 Q 480 620 620 380 Q 680 280 760 200 L 800 160 Q 815 145 830 158 L 862 182 Q 830 250 760 340 Q 620 560 400 800 L 370 845 Q 360 860 345 852 Z',
   m:[[360,830],[520,580],[660,330],[800,170]]},
  {id:'dian',   name:'点 · จุด',      sub:'กดปลายปากกาลงแล้วตวัดกลับเบา ๆ', ex:'六', exPy:'liù',
   s:'M 512 780 Q 470 660 512 590 Q 530 560 566 540 Q 590 530 590 552 Q 588 600 560 640 Q 545 668 548 700 Q 552 742 590 772 Q 610 786 590 800 Q 545 820 512 780 Z',
   m:[[512,760],[520,660],[540,590]]},
  {id:'ti',     name:'提 · ขีดตวัดขึ้น', sub:'กดลงแล้วตวัดขึ้นขวาอย่างรวดเร็ว', ex:'地', exPy:'dì',
   s:'M 180 380 L 700 560 L 710 545 Q 690 535 660 535 L 205 320 L 160 320 Q 145 322 152 340 Z',
   m:[[170,330],[420,415],[700,550]]},
  {id:'hengzhe',name:'横折 · ขีดนอนหักลง', sub:'ขีดนอนแล้วหักมุมลงตรงปลาย', ex:'口', exPy:'kǒu',
   s:'M 220 640 L 720 660 L 730 620 L 720 640 L 700 220 Q 700 195 675 195 L 660 195 L 655 300 L 700 300 L 715 645 L 245 620 L 220 640 Z',
   m:[[230,635],[480,648],[710,640],[705,420],[690,220]]},
  {id:'shugou', name:'竖钩 · ขีดตั้งตวัดซ้าย', sub:'ขีดตั้งลงมาแล้วตวัดตะขอขึ้นซ้าย', ex:'小', exPy:'xiǎo',
   s:'M 470 860 L 470 300 Q 470 190 560 190 L 590 190 Q 600 190 600 210 L 600 230 Q 600 240 585 242 L 560 245 Q 540 245 535 265 L 535 860 Z',
   m:[[517,840],[517,560],[517,330],[517,230],[540,205],[585,200]]}
];
function basicStrokeById(id){ return BASIC_STROKES.find(b => b.id === id) || null; }

/* ==========================================================================
   HUB — ตารางตัวอักษรที่ฝึกเขียนได้ (เรนเดอร์ในแท็บของหน้าอักษรจีน)
   ========================================================================== */
let wrState = {shown:120, q:''};
function renderWriteTab(){
  const box = $('#charsWriteTab'); if(!box) return;
  const u = currentUser();
  const list = strokeChars();
  const done = u && u.writing ? Object.keys(u.writing).length : 0;
  const pct = Math.round(done/list.length*100);
  box.innerHTML = `
    <div class="panel reveal in" style="margin-bottom:20px">
      <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
        <span style="font-family:var(--ff-kai);font-size:64px;color:var(--brown-3);line-height:1">永</span>
        <div style="flex:1;min-width:240px">
          <h3 style="margin-bottom:6px">ฝึกลำดับขีดและเขียนอักษรจีน</h3>
          <p style="font-size:13.8px;color:var(--text-2)">
            แอนิเมชันลำดับขีดตามมาตรฐาน <b>笔顺规范</b> ของกระทรวงศึกษาธิการจีน —
            เขียนตามลำดับในช่อง 米字格 แล้วระบบจะตรวจ<b>ลำดับขีด ทิศทาง และความแม่นยำ</b>ให้คะแนน
            ${u? '· ฝึกไปแล้ว <b style="color:var(--red)">'+done+'</b> ตัว':'· เริ่มจากแท็บ "พื้นฐานขีด" ได้เลย'}
          </p>
          ${u?`<div class="wr-progress" style="margin:10px 0 0;max-width:420px"><i style="width:${pct}%"></i></div>`:''}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="setCharTab('basic')">${ICON('brush')} เริ่มจากพื้นฐานขีด</button>
      </div>
    </div>
    <div class="char-toolbar" style="position:static;margin-bottom:18px">
      <input class="search-in" id="wrSearch" placeholder="ค้นหาตัวอักษร หรือพินอิน" oninput="wrState.q=this.value;wrState.shown=120;renderWriteGrid()">
      <button class="chip" onclick="wrState.q='';wrState.shown=120;var i=document.getElementById('wrSearch');if(i)i.value='';renderWriteGrid()">รีเซ็ต</button>
    </div>
    <div class="char-count" id="wrCount"></div>
    <div class="char-grid" id="wrGrid"></div>
    <div class="load-more"><button class="btn btn-ghost" id="wrMoreBtn" onclick="wrState.shown+=120;renderWriteGrid()">แสดงเพิ่มอีก 120 ตัว</button></div>`;
  renderWriteGrid();
}
function renderWriteGrid(){
  const box = $('#wrGrid'); if(!box) return;
  const u = currentUser();
  const q = (wrState.q||'').trim().toLowerCase();
  let list = strokeChars();
  if(q) list = list.filter(c => c.c===q || (c.p||'').includes(q) || (c.th||'').includes(q));
  const show = list.slice(0, wrState.shown);
  const cnt = $('#wrCount');
  if(cnt) cnt.innerHTML = `แสดง <b>${show.length}</b> จาก <b>${list.length}</b> ตัว — ลำดับขีดอ้างอิงมาตรฐาน 笔顺规范 กระทรวงศึกษาธิการจีน`;
  box.innerHTML = show.map(c=>{
    const rec = u && u.writing ? u.writing[c.c] : null;
    const free = isWriteFree(c.c);
    const locked = !free && !isPremium(u);
    return `
    <div class="char-cell ${rec?'learned':''}" onclick="${locked?'showWritePaywall(\''+c.c+'\')':'openWrite(\''+c.c+'\')'}" title="${esc(c.p)} — ${esc(c.th)} · ${strokeCount(c.c)} ขีด">
      <span class="n">${list.indexOf(c)+1}</span>
      <span class="c" style="font-family:var(--ff-kai);font-weight:700">${c.c}</span>
      <span class="p">${rec? '★'+rec.stars+' · '+rec.score+'%' : esc(c.p||'')}</span>
      ${rec?`<span style="font-size:8px;color:var(--jade);position:absolute;bottom:3px;left:5px;font-weight:800">✓</span>`:''}
      ${locked?`<span style="position:absolute;bottom:3px;right:5px;color:var(--gold)">${ICON('lock')}</span>`:''}
    </div>`;
  }).join('') || '<div class="empty" style="grid-column:1/-1">ไม่พบตัวอักษรที่ตรงกับเงื่อนไข</div>';
  const more = $('#wrMoreBtn');
  if(more) more.style.display = show.length < list.length ? '' : 'none';
}
function showWritePaywall(ch){
  if(typeof requirePremium === 'function') requirePremium('write', function(){ openWrite(ch); });
  else openWrite(ch);
}

/* ==========================================================================
   พื้นฐานขีด — บทเรียนเริ่มต้นก่อนเขียนอักษร
   ========================================================================== */
function renderBasicTab(){
  const box = $('#charsBasicTab'); if(!box) return;
  const u = currentUser();
  const recs = (u && u.basic) || {};
  box.innerHTML = `
    <div class="panel reveal in">
      <h3>${ICON('brush')} เริ่มจากพื้นฐาน: 8 ขีดหลักของอักษรจีน</h3>
      <p style="font-size:13.8px;color:var(--text-2);margin-bottom:16px">
        อักษรจีนทุกตัวเกิดจากขีดพื้นฐาน 8 ชนิด — ดูวิธีเขียนแต่ละขีด
        (ลูกศรบอกทิศทาง) แล้วลองเขียนตามในช่องฝึก เก็บดาวให้ครบก่อนไปเขียนอักษรจริง
      </p>
      <div class="bs-grid">
        ${BASIC_STROKES.map(b=>{
          const rec = recs[b.id];
          return `<div class="bs-card" onclick="openBasicStroke('${b.id}')">
            <svg class="bs-svg" viewBox="0 0 1024 1024"><g transform="translate(0,900) scale(1,-1)"><path d="${b.s}" fill="rgba(90,70,50,.35)"/></g></svg>
            <b>${esc(b.name)}</b>
            <span>${esc(b.sub)}</span>
            <div class="bs-ex">ตัวอย่าง ${b.ex} · ${esc(b.exPy)}</div>
            <div class="stars">${rec?starsStr(rec.stars):'☆ ☆ ☆'}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}
function openBasicStroke(id){
  const b = basicStrokeById(id);
  if(!b) return;
  if(typeof glassPop !== 'function'){ toast('เปิดตัวฝึกไม่สำเร็จ'); return; }
  glassPop({
    icon:'brush',
    title:b.name,
    body:`
      <p style="margin:0">${esc(b.sub)} — ตัวอย่างตัวอักษร <b style="font-family:var(--ff-kai);font-size:20px;color:var(--red)">${b.ex}</b> (${esc(b.exPy)})</p>
      <svg viewBox="0 0 1024 1024" style="width:150px;display:block;margin:10px auto">
        <g transform="translate(0,900) scale(1,-1)"><path d="${b.s}" fill="var(--red)" opacity=".22"/></g>
      </svg>
      <div class="wr-canvas-wrap" style="max-width:300px;margin:0 auto">
        <canvas id="bsCanvas" class="wr-canvas" width="600" height="600"></canvas>
      </div>
      <div class="wr-tools">
        <button class="wr-tool" onclick="bsClear()">${ICON('trash')} ล้าง</button>
        <button class="wr-tool gold" onclick="bsCheck()">${ICON('check')} ตรวจขีดนี้</button>
      </div>
      <p style="font-size:11.5px;color:var(--text-3);text-align:center;margin:10px 0 0">เขียนขีดเดียวตามทิศทางที่แสดง แล้วกดตรวจ</p>`,
    actions:[{label:'ปิด', cls:'btn-ghost', fn:closeGlassPop}]
  });
  /* ตั้งค่า canvas สำหรับขีดเดียว */
  setTimeout(()=>{
    const cv = $('#bsCanvas'); if(!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const cssSize = 300;
    cv.style.width = cssSize + 'px';
    cv.style.height = cssSize + 'px';
    cv.width = Math.round(cssSize*dpr);
    cv.height = Math.round(cssSize*dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    window.__bs = {b, ctx, cssSize, strokes:[]};
    wireBasicPointer(cv);
    drawBasicCanvas();
  }, 80);
}
function wireBasicPointer(cv){
  if(cv.dataset.wired) return;
  cv.dataset.wired = '1';
  let cur = null;
  const pos = e => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.addEventListener('pointerdown', e => {
    if(!window.__bs || !window.__bs.cssSize) return;
    e.preventDefault();
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    cur = [];
    const p = pos(e);
    cur.push(canvasToNorm(p[0], p[1], __bs.cssSize));
    __bs.strokes = [cur];
    scheduleInkDraw2();
  });
  cv.addEventListener('pointermove', e => {
    if(!cur) return;
    const p = pos(e);
    const np = canvasToNorm(p[0], p[1], __bs.cssSize);
    const last = cur[cur.length-1];
    if(Math.hypot(np[0]-last[0], np[1]-last[1]) > 10) cur.push(np);
    scheduleInkDraw2();
  });
  const up = () => { cur = null; };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
}
let bsRafPending = false;
function scheduleInkDraw2(){
  if(bsRafPending) return;
  bsRafPending = true;
  requestAnimationFrame(()=>{ bsRafPending = false; drawBasicCanvas(); });
}
function drawBasicCanvas(){
  if(!window.__bs) return;
  const {ctx, cssSize, b, strokes} = window.__bs;
  const s = cssSize;
  ctx.clearRect(0, 0, s, s);
  /* เส้นมิ่จื้อเก๋อ */
  ctx.strokeStyle = 'rgba(178,58,46,.3)';
  ctx.lineWidth = 1.2;
  const m = s*0.08, inner = s - m*2;
  ctx.strokeRect(m, m, inner, inner);
  ctx.beginPath();
  ctx.moveTo(m, s/2); ctx.lineTo(s-m, s/2);
  ctx.moveTo(s/2, m); ctx.lineTo(s/2, s-m);
  ctx.moveTo(m, m); ctx.lineTo(s-m, s-m);
  ctx.moveTo(s-m, m); ctx.lineTo(m, s-m);
  ctx.stroke();
  /* ตัวช่วยลายเส้น */
  ctx.lineWidth = Math.max(6, s*0.026);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(178,58,46,.15)';
  const pts = b.m;
  ctx.beginPath();
  pts.forEach((p,i)=>{ const np = normToCanvas(p, s); if(i===0) ctx.moveTo(np.x,np.y); else ctx.lineTo(np.x,np.y); });
  ctx.stroke();
  /* หมึกผู้ใช้ */
  strokes.forEach(st=>{
    if(st.length < 2) return;
    ctx.strokeStyle = 'rgba(138,37,25,.9)';
    ctx.beginPath();
    st.forEach((p,i)=>{ const np = normToCanvas(p, s); if(i===0) ctx.moveTo(np.x,np.y); else ctx.lineTo(np.x,np.y); });
    ctx.stroke();
  });
}
function bsClear(){
  if(window.__bs){ window.__bs.strokes = []; drawBasicCanvas(); }
}
function bsCheck(){
  const S = window.__bs; if(!S) return;
  const user = S.strokes[0] || [];
  if(user.length < 2){ toast('เขียนขีดก่อนตรวจ'); return; }
  const b = S.b;
  const uStart = user[0], uEnd = user[user.length-1];
  const eStart = b.m[0], eEnd = b.m[b.m.length-1];
  const uDir = [uEnd[0]-uStart[0], uEnd[1]-uStart[1]];
  const eDir = [eEnd[0]-eStart[0], eEnd[1]-eStart[1]];
  const dot = uDir[0]*eDir[0] + uDir[1]*eDir[1];
  const dirOk = dot >= 0;
  const samples = samplePoly(b.m, 10);
  const covered = samples.filter(p => {
    for(let k=0;k<user.length-1;k++){ if(distPtSeg(p, user[k], user[k+1]) <= 62) return true; }
    return false;
  }).length;
  const coverage = covered/samples.length;
  const sc = Math.round(100 * (0.55*coverage + 0.45*(dirOk?1:0.3)));
  const stars = sc >= 85 ? 3 : sc >= 70 ? 2 : sc >= 50 ? 1 : 0;
  const u = currentUser();
  let gainTxt = '';
  if(u){
    u.basic = u.basic || {};
    const prev = u.basic[b.id] || {score:0, stars:0};
    if(sc > prev.score || stars > prev.stars){
      u.basic[b.id] = {score:Math.max(sc, prev.score), stars:Math.max(stars, prev.stars), ts:Date.now()};
      award(u, stars*4 + Math.round(sc/25), stars*8, 'write', 'พื้นฐานขีด: '+b.name+' — '+sc+'%');
      checkBadges(u);
      saveUsers();
      gainTxt = 'บันทึกคะแนนแล้ว';
    }
  }
  closeGlassPop();
  glassPop({
    icon: stars >= 2 ? 'trophy' : 'brush',
    title:'ผลการฝึก “' + b.name + '”',
    body:`
      <div style="text-align:center;margin:6px 0 12px">
        <div style="font-family:var(--ff-num);font-size:42px;font-weight:800;color:var(--red);line-height:1">${sc}%</div>
        <div style="font-size:20px;letter-spacing:5px;color:var(--gold);margin-top:4px">${starsStr(stars)}</div>
      </div>
      <div class="stroke-report">
        <div class="sr-row ${dirOk?'ok':'bad'}"><span class="no">1</span><span class="dot"></span>
          <span class="lbl">${dirOk?'ทิศทางถูกต้อง':'ทิศทางกลับด้าน — เขียนตามแนวที่แสดง'}</span><span class="pts">${dirOk?'✓':'✗'}</span></div>
        <div class="sr-row ${coverage>=0.55?'ok':'mid'}"><span class="no">2</span><span class="dot"></span>
          <span class="lbl">${coverage>=0.55?'รูปร่างตรงตามแบบ':'รูปร่างยังเบี่ยง — ลองลากตามเส้นช่วย'}</span><span class="pts">${Math.round(coverage*100)}%</span></div>
      </div>
      ${gainTxt?`<p style="text-align:center;margin:8px 0 0;color:var(--red);font-weight:700;font-size:12.5px">${gainTxt}</p>`:''}`,
    actions:[
      {label:'ฝึกอีกครั้ง', cls:'btn-ghost', fn:()=>openBasicStroke(b.id)},
      {label:'กลับพื้นฐานขีด', cls:'btn-primary', fn:()=>{ setCharTab('basic'); }}
    ]
  });
}

/* ==========================================================================
   หน้าเขียนตัวอักษร — แอนิเมชัน + กระดานฝึก
   ========================================================================== */
/* สีขีดตามลำดับ: 1 แดง, 2 ม่วง, 3 น้ำเงิน, 4 เขียว, … */
const STROKE_COLORS = ['#d32f2f','#8e24aa','#1e6fd9','#0b8a4f','#e07b00','#00838f','#c2185b','#5d4037','#455a64','#7cb342','#ff8f00','#3949ab','#6a1b9a','#0097a7','#d84315','#2e7d32','#ad1457','#1565c0','#827717','#4e342e'];
function strokeColor(i){ return STROKE_COLORS[(i % STROKE_COLORS.length)]; }
function colorAlpha(hex, a){
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
}
/* เส้นมัธยฐาน → spline โค้งนุ่ม (Catmull-Rom → cubic Bézier) */
function smoothPath(pts){
  if(!pts || pts.length < 2) return '';
  if(pts.length === 2) return 'M ' + pts[0][0] + ' ' + pts[0][1] + ' L ' + pts[1][0] + ' ' + pts[1][1];
  let d = 'M ' + pts[0][0] + ' ' + pts[0][1];
  for(let i = 0; i < pts.length - 1; i++){
    const p0 = pts[Math.max(0, i-1)], p1 = pts[i], p2 = pts[i+1], p3 = pts[Math.min(pts.length-1, i+2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' + p2[0] + ' ' + p2[1];
  }
  return d;
}
/* หัวลูกศรชี้ทิศทางปลายขีด */
function arrowPath(m){
  if(!m || m.length < 2) return '';
  const a = m[m.length-2], b = m[m.length-1];
  const dx = b[0]-a[0], dy = b[1]-a[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx/len, uy = dy/len, px = -uy, py = ux;
  const s = 64, w = 30;
  const tipx = b[0] + ux*26, tipy = b[1] + uy*26;
  const bx1 = b[0] - ux*s + px*w, by1 = b[1] - uy*s + py*w;
  const bx2 = b[0] - ux*s - px*w, by2 = b[1] - uy*s - py*w;
  return 'M ' + tipx.toFixed(1) + ' ' + tipy.toFixed(1) + ' L ' + bx1.toFixed(1) + ' ' + by1.toFixed(1) + ' L ' + bx2.toFixed(1) + ' ' + by2.toFixed(1) + ' Z';
}
/* ตำแหน่งตัวเลขลำดับขีด (เยื้องจากจุดเริ่มขีด) */
function numPos(m){
  if(!m || m.length < 1) return {x:512, y:512};
  if(m.length < 2) return {x:m[0][0], y:m[0][1]};
  const a = m[0], b = m[1];
  const dx = b[0]-a[0], dy = b[1]-a[1];
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy/len, py = dx/len;
  return {x: a[0] + px*70, y: a[1] + py*70};
}
let W = null;   /* session ฝึกเขียน */
let wrAnim = null;
/* ตัวเลือกแสดงผล — สลับเปิด/ปิดได้ */
let wrOpts = {arrows:true, numbers:true, pen:true};
function toggleWrOpt(key){
  wrOpts[key] = !wrOpts[key];
  const svg = $('#strokeAnim');
  if(svg) svg.classList.toggle('no-' + key, !wrOpts[key]);
  const btn = $('#wrTog-' + key);
  if(btn) btn.classList.toggle('on', wrOpts[key]);
}

function openWrite(ch){
  const data = STROKES[ch];
  if(!data){ toast('ยังไม่มีข้อมูลลำดับขีดของตัวอักษรนี้'); return; }
  if(!isWriteFree(ch) && !isPremium(currentUser())){
    showWritePaywall(ch);
    return;
  }
  stopWriteAnim();
  go('write', ch);
}
function renderWritePage(ch){
  const box = $('#writeView'); if(!box) return;
  const u = currentUser();
  const rec = u && u.writing ? u.writing[ch] : null;
  const c = CHARS.find(x=>x.c===ch);
  const n = strokeCount(ch);
  const idx = strokeChars().findIndex(x=>x.c===ch);
  W = {ch, data:STROKES[ch], strokes:[], drawing:false, undone:[]};
  stopWriteAnim();

  box.innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('chars')">อักษรจีน</a> <span class="sep">›</span>
      <a onclick="go('chars');setTimeout(function(){setCharTab('write')},30)">ลำดับขีด</a> <span class="sep">›</span> <span>${ch}</span></div>

    <div class="wr-hero">
      <div class="kai-big">${ch}</div>
      <div>
        <h2>${ch} · ${esc(c?c.p:'')} <span style="font-size:15px;color:var(--red)">— ${esc(c?c.th:'')}</span></h2>
        <p>ตัวอักษรที่ใช้บ่อยลำดับที่ <b>${idx+1}</b> · มีทั้งหมด <b style="font-family:var(--ff-num);color:var(--red)">${n}</b> ขีด
           ${rec? ` · คะแนนสูงสุดของคุณ <b style="font-family:var(--ff-num);color:var(--red)">${rec.score}%</b> (${'★'.repeat(rec.stars)}${'☆'.repeat(Math.max(0,3-rec.stars))})`:' — ยังไม่เคยฝึกเขียน'}</p>
        <div class="wr-meta">
          <button class="btn btn-primary btn-sm" onclick="speak('${ch}')">${ICON('volume-2')} ฟังเสียงอ่าน</button>
          ${n>1?`<button class="btn btn-ghost btn-sm" onclick="startWriteAnim()">${ICON('play')} ดูแอนิเมชันลำดับขีด</button>`:''}
          <button class="btn btn-ghost btn-sm" onclick="go('chars')">ตัวอักษรทั้งหมด</button>
          ${(typeof scanActive === 'function' && scanActive()) ? `<button class="btn btn-gold btn-sm" onclick="go('scan')">${ICON('arrow-left')} กลับไปสแกน</button>` : ''}
        </div>
      </div>
    </div>

    <div class="wr-cols" style="margin-top:26px">
      <div>
        <div class="panel wr-static" style="text-align:center">
          <h3 style="justify-content:center">ลำดับขีด · ${n} ขีด</h3>
          <svg id="strokeAnim" class="stroke-svg ${!wrOpts.arrows?'no-arrows':''} ${!wrOpts.numbers?'no-numbers':''} ${!wrOpts.pen?'no-pen':''}" viewBox="0 0 1024 1024">
            <g transform="translate(0,900) scale(1,-1)">${writeSvgPaths(ch)}</g>
          </svg>
          <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap;margin-top:12px">
            <button class="wr-tool" onclick="startWriteAnim()">${ICON('play')} เล่น</button>
            <button class="wr-tool" onclick="stopWriteAnim()">${ICON('x')} หยุด</button>
            <button class="wr-tool" onclick="setAnimSpeed(0)">ช้า</button>
            <button class="wr-tool" onclick="setAnimSpeed(1)">ปกติ</button>
          </div>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px">
            <button id="wrTog-arrows" class="wr-tool wr-tog ${wrOpts.arrows?'on':''}" onclick="toggleWrOpt('arrows')">${ICON('arrow-up-right')} ลูกศรทิศทาง</button>
            <button id="wrTog-numbers" class="wr-tool wr-tog ${wrOpts.numbers?'on':''}" onclick="toggleWrOpt('numbers')">${ICON('hash')} ตัวเลขขีด</button>
            <button id="wrTog-pen" class="wr-tool wr-tog ${wrOpts.pen?'on':''}" onclick="toggleWrOpt('pen')">${ICON('pen-line')} เส้นปากกา</button>
          </div>
          <p style="font-size:12px;color:var(--text-3);margin-top:12px">เส้นโค้งนุ่มลากตามทิศทางจริง · ลูกศรชี้ปลายขีด · ตัวเลขคือลำดับขีด · สีเปลี่ยนตามลำดับ (1 แดง → 2 ม่วง → …) — เปิด/ปิดได้จากปุ่มด้านบน</p>
        </div>
        <div class="panel">
          <h3>วิธีฝึก</h3>
          <p style="font-size:13.5px;color:var(--text-2)">
            1. ดูแอนิเมชันลำดับขีดจนจำได้<br>
            2. เขียนลงในช่องมิ่จื้อเก๋อทีละขีด ตามลำดับ<br>
            3. กด "ตรวจ" — ระบบให้คะแนนลำดับขีด ทิศทาง และความแม่นยำ<br>
            4. เก็บ 3 ดาว (85%+) แล้วค่อยไปตัวถัดไป
          </p>
        </div>
      </div>
      <div>
        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
            <h3 style="margin-bottom:0">กระดานฝึกเขียน · 米字格</h3>
            <span class="lock-chip">${ICON('pen-line')} เขียนตามตัวช่วยลายเส้นด้านใน</span>
          </div>
          <div class="wr-canvas-wrap" id="wrCanvasWrap">
            <canvas id="wrCanvas" class="wr-canvas" width="600" height="600"></canvas>
          </div>
          <div class="wr-tools">
            <button class="wr-tool" id="wrGuideBtn" onclick="toggleWriteGuide()">${ICON('eye')} ซ่อนตัวช่วยลายเส้น</button>
            <button class="wr-tool" onclick="undoWriteStroke()">${ICON('undo')} ลบขีดล่าสุด</button>
            <button class="wr-tool" onclick="clearWriteCanvas()">${ICON('trash')} ล้างกระดาน</button>
            <button class="wr-tool gold" onclick="checkWriting()">${ICON('check')} ตรวจลำดับขีด</button>
          </div>
        </div>
      </div>
    </div>`;
  /* ตั้งค่ากระดานทันที (กัน race ก่อน layout) แล้วปรับขนาดจริงอีกทีหลัง layout */
  initWriteCanvas(ch);
  wireWritePointer($('#wrCanvas'));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    initWriteCanvas(ch);
  }));
  /* เล่นตัวอย่างทิศทางการเขียนอัตโนมัติ (ใช้ timer ตรง ไม่พึ่ง rAF) */
  if(n > 1) setTimeout(()=>{ try{ startWriteAnim(); }catch(e){} }, 320);
  observeReveals();
}
function writeSvgPaths(ch){
  const d = STROKES[ch];
  let out = '';
  (d.s||[]).forEach(function(p, i){
    out += `<path id="ws${i}" d="${p}" class="ghost" data-i="${i}"/>`;
    const m = (d.m||[])[i];
    if(m && m.length){
      out += `<path id="wmed${i}" class="med" d="${smoothPath(m)}" data-i="${i}"/>`;
      out += `<path id="warr${i}" class="arrow" d="${arrowPath(m)}" data-i="${i}"/>`;
    }
    const np = numPos(m);
    out += `<text id="wnum${i}" class="num" data-i="${i}" x="${np.x.toFixed(0)}" y="${np.y.toFixed(0)}" text-anchor="middle" dominant-baseline="central">${i+1}</text>`;
  });
  return out;
}

/* --------------------------------------------------------------------------
   แอนิเมชันลำดับขีด
-------------------------------------------------------------------------- */
let animSpeed = 1;
let wrAnimTimer = null;
function setAnimSpeed(s){ animSpeed = s; }
function stopWriteAnim(){
  if(wrAnimTimer){ clearTimeout(wrAnimTimer); wrAnimTimer = null; }
  const svg = $('#strokeAnim');
  if(svg){
    $$('#strokeAnim path:not(.med):not(.arrow)').forEach(p => { p.classList.remove('hot','painted'); p.classList.add('ghost'); p.style.fill = ''; });
    $$('#strokeAnim path.med').forEach(m => {
      m.style.stroke = 'none';
      m.style.strokeDasharray = 'none';
      m.style.strokeDashoffset = '0';
      m.style.transition = 'none';
    });
  }
}
/* แอนิเมชันการเขียน: ลาก "ปลายปากกา" (สีตามลำดับขีด) ไปตามเส้นมัธยฐานโค้งนุ่ม
   จากจุดเริ่ม→จุดจบจริง พร้อมลูกศรบอกทิศทางและตัวเลขลำดับขีด */
function startWriteAnim(){
  if(!W) return;
  stopWriteAnim();
  const svg = $('#strokeAnim'); if(!svg) return;
  const outlines = $$('#strokeAnim path:not(.med):not(.arrow)');
  const meds = $$('#strokeAnim path.med');
  const arrows = $$('#strokeAnim path.arrow');
  const nums = $$('#strokeAnim text.num');
  if(!outlines.length) return;
  /* เตรียมสี: โครงขีดจาง + ลูกศร/ตัวเลข สีตามลำดับขีด */
  outlines.forEach(function(p, i){
    p.classList.remove('hot','painted'); p.classList.add('ghost');
    p.style.fill = colorAlpha(strokeColor(i), .12);
  });
  arrows.forEach(function(a, i){ a.style.fill = strokeColor(i); });
  nums.forEach(function(t, i){ t.style.fill = strokeColor(i); });
  const slow = animSpeed === 0;
  let i = 0;
  const animStroke = () => {
    if(!svg.isConnected){ wrAnimTimer = null; return; }           /* หน้าเปลี่ยน → หยุด */
    if(i > 0 && outlines[i-1]){
      outlines[i-1].classList.remove('hot');
      outlines[i-1].classList.add('painted');                    /* ขีดก่อนหน้า → สีเต็มตามลำดับ */
    }
    if(i >= outlines.length){ wrAnimTimer = null; return; }      /* จบ — ไม่มี timer ค้าง */
    const out = outlines[i], med = meds[i];
    const color = strokeColor(i);
    out.classList.remove('ghost');
    out.classList.add('hot');
    out.style.fill = colorAlpha(color, .28);
    const dur = Math.max(420, Math.min(980, 340 + ((med && med.getTotalLength ? Math.max(60, med.getTotalLength()) : 500)/1024*330))) * (slow ? 1.9 : 1);
    if(med && med.getTotalLength && wrOpts.pen){
      const len = Math.max(60, med.getTotalLength());
      med.style.stroke = color;
      med.style.strokeWidth = '64';
      med.style.transition = 'none';
      med.style.strokeDasharray = len;
      med.style.strokeDashoffset = len;
      void med.getBoundingClientRect();                          /* บังคับ reflow ก่อน transition */
      med.style.transition = 'stroke-dashoffset ' + dur + 'ms linear';
      med.style.strokeDashoffset = '0';                          /* ลากปากกาจากต้น→ปลายขีด */
    }
    i++;
    wrAnimTimer = setTimeout(function(){
      if(out.classList.contains('hot')){
        out.classList.remove('hot');
        out.classList.add('painted');
        out.style.fill = colorAlpha(color, .72);
      }
      animStroke();
    }, dur + 150);
  };
  animStroke();
}

/* --------------------------------------------------------------------------
   กระดานฝึกเขียน (canvas) — ขนาดคงที่จาก wrapper, รองรับ resize
-------------------------------------------------------------------------- */
let wrGuideOn = true;
let wrCtx = null;

function initWriteCanvas(ch, first){
  const cv = $('#wrCanvas'); if(!cv) return;
  const wrap = cv.parentElement;
  if(!wrap) return;
  const dpr = window.devicePixelRatio || 1;
  const cssSize = Math.max(260, Math.min(wrap.clientWidth || 420, 460));
  W.cssSize = cssSize;
  cv.style.width = cssSize + 'px';
  cv.style.height = cssSize + 'px';
  cv.width = Math.round(cssSize * dpr);
  cv.height = Math.round(cssSize * dpr);
  wrCtx = cv.getContext('2d');
  wrCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWriteCanvas();
  if(!window.__wrResizeHooked){
    window.__wrResizeHooked = true;
    let t;
    window.addEventListener('resize', ()=>{
      clearTimeout(t);
      t = setTimeout(()=>{ if($('#wrCanvas')) initWriteCanvas(); }, 150);
    });
  }
}
function toggleWriteGuide(){
  wrGuideOn = !wrGuideOn;
  const btn = $('#wrGuideBtn');
  if(btn) btn.innerHTML = wrGuideOn ? ICON('eye')+' ซ่อนตัวช่วยลายเส้น' : ICON('eye-off')+' แสดงตัวช่วยลายเส้น';
  drawWriteCanvas();
}
function drawWriteCanvas(){
  if(!wrCtx || !W) return;
  const s = W.cssSize || 420;
  const ctx = wrCtx;
  ctx.clearRect(0, 0, s, s);
  const m = s*0.06, inner = s - m*2;
  ctx.strokeStyle = 'rgba(178,58,46,.32)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(m, m, inner, inner);
  ctx.beginPath();
  ctx.moveTo(m, s/2); ctx.lineTo(s-m, s/2);
  ctx.moveTo(s/2, m); ctx.lineTo(s/2, s-m);
  ctx.moveTo(m, m); ctx.lineTo(s-m, s-m);
  ctx.moveTo(s-m, m); ctx.lineTo(m, s-m);
  ctx.stroke();
  /* ตัวช่วยลายเส้น (อักษรจางทั้งตัว) */
  if(wrGuideOn){
    ctx.fillStyle = 'rgba(178,58,46,.13)';
    ctx.font = '400 ' + Math.round(s*0.72) + 'px ' + "'KaiTi','STKaiti','Kaiti SC','LXGW WenKai TC','Ma Shan Zheng','Noto Serif SC',serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(W.ch, s/2, s/2 + s*0.02);
  }
  ctx.strokeStyle = 'rgba(138,37,25,.88)';
  ctx.lineWidth = Math.max(7, s*0.028);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  W.strokes.forEach(st => {
    if(st.length < 2) return;
    ctx.beginPath();
    st.forEach((p,i) => {
      const np = normToCanvas(p, s);
      if(i===0) ctx.moveTo(np.x, np.y);
      else ctx.lineTo(np.x, np.y);
    });
    ctx.stroke();
  });
}
/* แปลงจุดจากพิกัดข้อมูล (y ชี้ขึ้น) → canvas (y ชี้ลง) ด้วยขอบเขตมาตรฐาน */
function normToCanvas(p, size){
  const pad = size*0.10;
  const w = CHAR_BOUNDS.maxX - CHAR_BOUNDS.minX;
  const h = CHAR_BOUNDS.maxY - CHAR_BOUNDS.minY;
  const x = pad + (p[0]-CHAR_BOUNDS.minX)/w * (size - pad*2);
  const y = pad + (flipY(p[1])-CHAR_BOUNDS.minY)/h * (size - pad*2);
  return {x, y};
}
function canvasToNorm(x, y, size){
  const pad = size*0.10;
  const w = CHAR_BOUNDS.maxX - CHAR_BOUNDS.minX;
  const h = CHAR_BOUNDS.maxY - CHAR_BOUNDS.minY;
  return [
    CHAR_BOUNDS.minX + (x - pad) / (size - pad*2) * w,
    flipY(CHAR_BOUNDS.minY + (y - pad) / (size - pad*2) * h)
  ];
}

/* pointer input — วาดผ่าน requestAnimationFrame (เฟรมละครั้ง ไม่กระตุก) */
let wrRafPending = false;
function scheduleInkDraw(){
  if(wrRafPending) return;
  wrRafPending = true;
  requestAnimationFrame(()=>{ wrRafPending = false; drawWriteCanvas(); });
}
function wireWritePointer(cv){
  if(!cv || cv.dataset.wired) return;
  cv.dataset.wired = '1';
  let cur = null;
  const pos = e => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.addEventListener('pointerdown', e => {
    if(!W || !W.cssSize) return;
    e.preventDefault();
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    W.drawing = true;
    cur = [];
    const p = pos(e);
    cur.push(canvasToNorm(p[0], p[1], W.cssSize));
    W.strokes.push(cur);
    W.undone = [];
    scheduleInkDraw();
  });
  cv.addEventListener('pointermove', e => {
    if(!W || !W.drawing) return;
    const p = pos(e);
    const np = canvasToNorm(p[0], p[1], W.cssSize);
    const last = cur[cur.length-1];
    const d = Math.hypot(np[0]-last[0], np[1]-last[1]);
    if(d > 10) cur.push(np);
    scheduleInkDraw();
  });
  const up = () => { W.drawing = false; cur = null; scheduleInkDraw(); };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
}
function undoWriteStroke(){
  if(!W) return;
  if(W.strokes.length){ W.undone.push(W.strokes.pop()); drawWriteCanvas(); }
  else if(W.undone.length){ W.strokes.push(W.undone.pop()); drawWriteCanvas(); }
}
function clearWriteCanvas(){
  if(!W) return;
  W.strokes = [];
  drawWriteCanvas();
}

/* --------------------------------------------------------------------------
   การตรวจให้คะแนน — ลำดับขีด + ทิศทาง + ความแม่นยำ
-------------------------------------------------------------------------- */
function distPtSeg(p, a, b){
  const dx = b[0]-a[0], dy = b[1]-a[1];
  if(dx === 0 && dy === 0) return Math.hypot(p[0]-a[0], p[1]-a[1]);
  let t = ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / (dx*dx + dy*dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0]-(a[0]+t*dx), p[1]-(a[1]+t*dy));
}
function samplePoly(poly, n){
  if(poly.length < 2) return poly;
  const out = [];
  let total = 0;
  const segs = [];
  for(let i=0;i<poly.length-1;i++){
    const d = Math.hypot(poly[i+1][0]-poly[i][0], poly[i+1][1]-poly[i][1]);
    segs.push([poly[i], poly[i+1], d]);
    total += d;
  }
  if(total === 0) return poly;
  const step = total/n;
  let acc = 0, si = 0;
  out.push(poly[0]);
  while(si < segs.length){
    const [a,b,d] = segs[si];
    if(acc + d >= step){
      const t = (step - acc)/d;
      out.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]);
      acc = 0; si++;
    } else { acc += d; si++; }
  }
  out.push(poly[poly.length-1]);
  return out;
}
function checkWriting(){
  if(!W) return;
  if(!W.cssSize){ toast('กระดานฝึกยังไม่พร้อม — ลองอีกครั้ง'); return; }
  const data = W.data;
  const medians = data.m || [];
  const user = W.strokes.filter(s => s.length >= 2);
  if(!user.length){
    toast('ยังไม่ได้เขียนอะไรเลย — ลองเขียนตัวอักษรลงในช่องมิ่จื้อเก๋อก่อน');
    return;
  }
  const n = medians.length;
  const TH = 62;
  const report = [];
  const scores = [];

  for(let i=0;i<n;i++){
    const expected = medians[i];
    if(!expected || expected.length < 2){ report.push({label:'ขีดที่ '+(i+1), ok:'bad', pts:'—', msg:'ไม่มีข้อมูล'}); continue; }
    if(i >= user.length){
      report.push({label:'ขีดที่ '+(i+1), ok:'bad', pts:'0', msg:'ยังไม่ได้เขียนขีดนี้'});
      scores.push(0);
      continue;
    }
    const u = user[i];
    const uStart = u[0], uEnd = u[u.length-1];
    const eStart = expected[0], eEnd = expected[expected.length-1];
    const distAt = j => {
      const m = medians[j]; if(!m) return 1e9;
      return Math.hypot(uStart[0]-m[0][0], uStart[1]-m[0][1]) + Math.hypot(uEnd[0]-m[m.length-1][0], uEnd[1]-m[m.length-1][1]);
    };
    let bestJ = i, bestD = distAt(i);
    for(let j=Math.max(0,i-2); j<=Math.min(n-1,i+2); j++){
      const d = distAt(j);
      if(d < bestD){ bestD = d; bestJ = j; }
    }
    const orderOk = bestJ === i;
    const uDir = [uEnd[0]-uStart[0], uEnd[1]-uStart[1]];
    const eDir = [eEnd[0]-eStart[0], eEnd[1]-eStart[1]];
    const dot = uDir[0]*eDir[0] + uDir[1]*eDir[1];
    const dirOk = dot >= 0;
    const samples = samplePoly(expected, 14);
    const covered = samples.filter(p => {
      for(let k=0;k<u.length-1;k++){
        if(distPtSeg(p, u[k], u[k+1]) <= TH) return true;
      }
      return false;
    }).length;
    const coverage = covered/samples.length;
    const sc = Math.round(100 * (0.5*coverage + 0.25*(dirOk?1:0.35) + 0.25*(orderOk?1:0.4)));
    scores.push(sc);
    let msg = '', ok = 'ok';
    if(!orderOk) { msg = 'ลำดับขีดไม่ตรง — ควรเขียนขีดที่ '+(bestJ+1)+' ก่อน'; ok = 'mid'; }
    if(!dirOk) { msg += (msg?' · ':'') + 'ทิศทางกลับด้าน'; ok = 'bad'; }
    if(coverage < 0.55) { msg += (msg?' · ':'') + 'เส้นยังไม่ตรงแนว'; if(ok==='ok') ok='mid'; }
    if(ok === 'ok') msg = 'ถูกต้อง — ลำดับและทิศทางดี';
    report.push({label:'ขีดที่ '+(i+1), ok, pts:String(sc), msg});
  }
  if(user.length > n) report.push({label:'ขีดเกิน', ok:'bad', pts:'—', msg:'เขียนเกินมาอีก '+(user.length-n)+' ขีด'});

  let total = Math.round(scores.reduce((a,b)=>a+b,0) / Math.max(1, scores.length));
  if(user.length !== n) total = Math.round(total * 0.88);
  total = Math.max(0, Math.min(100, total));
  const stars = total >= 85 ? 3 : total >= 70 ? 2 : total >= 50 ? 1 : 0;
  showWriteResult(total, stars, report);
}
function showWriteResult(total, stars, report){
  const u = currentUser();
  let gainTxt = '';
  if(u){
    u.writing = u.writing || {};
    const old = u.writing[W.ch] ? (u.writing[W.ch].score||0) : 0;
    if(total > old){
      u.writing[W.ch] = {score:total, stars, ts:Date.now()};
      const pts = stars*8 + Math.round(total/10);
      const xp  = stars*12 + Math.round(total/5);
      award(u, pts, xp, 'write', 'เขียนอักษร '+W.ch+' — '+total+'%');
      checkBadges(u);
      if(!isCharLearned(W.ch)) u.learnedChars = Object.assign(u.learnedChars||{}, {[W.ch]: Date.now()});
      saveUsers();
      gainTxt = `+${pts} แต้ม · +${xp} XP · บันทึกเป็นตัวอักษรที่จำได้แล้ว`;
    } else {
      gainTxt = 'คะแนนยังไม่เกินสถิติเดิม — ลองฝึกให้แม่นขึ้น';
    }
  }
  if(typeof glassPop === 'function'){
    glassPop({
      icon: stars >= 2 ? 'trophy' : 'pen-line',
      title: 'ผลการเขียน “' + W.ch + '”',
      body: `
        <div style="text-align:center;margin:6px 0 14px">
          <div style="font-family:var(--ff-num);font-size:46px;font-weight:800;color:var(--red);line-height:1">${total}%</div>
          <div style="font-size:22px;letter-spacing:6px;color:var(--gold);margin-top:4px">${starsStr(stars)}</div>
        </div>
        <div class="stroke-report">
          ${report.map(r=>`
            <div class="sr-row ${r.ok}">
              <span class="no">${esc(r.label)}</span>
              <span class="dot"></span>
              <span class="lbl">${esc(r.msg)}</span>
              <span class="pts">${r.pts}</span>
            </div>`).join('')}
        </div>
        ${gainTxt?`<p style="text-align:center;margin:10px 0 0;color:var(--red);font-weight:700;font-size:13px">${gainTxt}</p>`:''}`,
      actions: [
        {label:'ฝึกอีกครั้ง', cls:'btn-ghost', fn:()=>{ clearWriteCanvas(); closeGlassPop(); }},
        {label: stars>=2 ? 'กลับรายการอักษร' : 'ฝึกต่อให้ได้ 2 ดาว', cls:'btn-primary', fn:()=>{ closeGlassPop(); go('chars'); setTimeout(function(){ setCharTab('write'); },30); }}
      ]
    });
  } else {
    toast('คะแนนการเขียน: '+total+'% ('+stars+' ดาว)');
  }
}

/* ==========================================================================
   legacy routes — หน้าเดิม redirect ไปยังหน้าอักษรจีน (แท็บในตัว)
   ========================================================================== */
function renderWritingHub(){
  if(typeof setCharTab === 'function'){ go('chars'); setTimeout(function(){ setCharTab('write'); }, 30); }
  else go('chars');
}
