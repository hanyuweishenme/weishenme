/* ==========================================================================
   为什么中文 · ตัวต่ออักษรจีน — ส่วนประกอบ (部首/radical) แบ่งหมวดหมู่
   + เกมประกอบอักษร 5 เกม (ลากวาง/เลือกคู่/แยกอักษร) แบบตัวใหญ่ชัดเจน
   ========================================================================== */
'use strict';

function compData(){
  return (typeof WC_DATA !== 'undefined' && WC_DATA.components) ? WC_DATA.components : {comp:[], combos:[], words:[], syl:[]};
}
let CB = null;   /* session เกมตัวต่ออักษร */

/* หมวดหมู่ส่วนประกอบ */
const COMP_CATS = [
  ['👤 คนและชีวิต',  ['亻','人','女','子','心','口','力']],
  ['🌿 ธรรมชาติ',    ['氵','木','艹','日','月','火','土','山','雨','田','禾','米','竹','石']],
  ['🏠 สิ่งของและสังคม', ['宀','讠','钅','纟','门','王','贝','辶']],
  ['🐎 สัตว์',       ['马','虫','鸟']]
];

function compCatOf(c){
  for(const cat of COMP_CATS){ if(cat[1].includes(c)) return cat[0]; }
  return 'อื่น ๆ';
}

/* --------------------------------------------------------------------------
   หน้าแท็บ "ประกอบอักษร" — คลังแบ่งหมวดหมู่ + เกม 5 เกม
-------------------------------------------------------------------------- */
function renderComponentsTab(){
  const box = $('#charsCompTab'); if(!box) return;
  const D = compData();
  /* จัดกลุ่มตามหมวดหมู่ (ไม่รู้จัก → กลุ่มท้าย) */
  const groups = {};
  COMP_CATS.forEach(function(cat){ groups[cat[0]] = []; });
  groups['อื่น ๆ'] = [];
  D.comp.forEach(function(c){
    (groups[compCatOf(c.c)] = groups[compCatOf(c.c)] || groups['อื่น ๆ']).push(c);
  });
  box.innerHTML = `
    <div class="panel reveal">
      <h3>${TILE('kanji','gold')} คลังส่วนประกอบอักษร (部首) — แบ่งหมวดหมู่</h3>
      <p style="font-size:13.5px;color:var(--text-2);margin-top:4px">
        อักษรจีนส่วนใหญ่สร้างจาก <b>ส่วนประกอบ</b> 2 ส่วน — ส่วนหนึ่งบอก<b>ความหมาย</b> อีกส่วนมักบอก<b>เสียง</b> ·
        <b style="color:var(--red)">คลิกที่ส่วนประกอบ</b> เพื่อดูอักษรทุกตัวที่ใช้มัน (จากฐานข้อมูล 3,000 ตัว)
      </p>
      ${Object.keys(groups).map(function(cat){
        const items = groups[cat];
        if(!items.length) return '';
        return `
        <div class="comp-cat">
          <div class="comp-cat-head"><b>${esc(cat)}</b><span>${items.length} ส่วนประกอบ</span></div>
          <div class="comp-grid">
            ${items.map(function(c){
              return `<div class="comp-card" onclick="openCompChars('${esc(c.c)}','${esc(c.name)}')" title="ดูอักษรทั้งหมดที่ใช้ ${esc(c.c)}">
                <span class="big">${esc(c.c)}</span>
                <b>${esc(c.name)}</b>
                <span class="mean">${esc(c.mean)}</span>
                <span class="ex" style="font-family:var(--ff-cn)">${esc(c.examples)}</span>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="sec-head reveal" style="margin:38px auto 8px;text-align:center">
      <div class="kicker">Component Builder · 组合游戏</div>
      <h2>เกมประกอบอักษร — แบบฝึกแบบโต้ตอบ</h2>
      <p>ลาก (หรือแตะ) ชิ้นส่วนลงในช่องให้ถูกตำแหน่ง — ฝึกจำส่วนประกอบผ่านการสร้างอักษรจริง</p>
    </div>

    <div class="comp-games">
      <button class="comp-game-card ${(!CB||CB.kind==='char')?'active':''}" onclick="startBuildGame('char')">
        <span class="ic">${TILE('kanji','red')}</span>
        <b>สร้างอักษรจากส่วนประกอบ</b>
        <span>ลากส่วนประกอบ 2 ชิ้นมาประกอบเป็นอักษรตามความหมายที่กำหนด</span>
      </button>
      <button class="comp-game-card ${CB&&CB.kind==='word'?'active':''}" onclick="startBuildGame('word')">
        <span class="ic">${TILE('type','gold')}</span>
        <b>สร้างคำจากอักษร</b>
        <span>ลากอักษร 2 ตัวมาประกอบเป็นคำศัพท์ตามความหมายที่กำหนด</span>
      </button>
      <button class="comp-game-card ${CB&&CB.kind==='syl'?'active':''}" onclick="startBuildGame('syl')">
        <span class="ic">${TILE('music','brown')}</span>
        <b>ประกอบพินอิน</b>
        <span>ลากพยัญชนะ + สระ + วรรณยุกต์ มาประกอบเป็นเสียงของอักษรที่กำหนด</span>
      </button>
      <button class="comp-game-card ${CB&&CB.kind==='pick'?'active':''}" onclick="startBuildGame('pick')">
        <span class="ic">${TILE('target','jade')}</span>
        <b>เลือกคู่ส่วนประกอบ</b>
        <span>เห็นส่วนประกอบหนึ่งชิ้น — เลือกชิ้นที่คู่กันจากตัวเลือกให้เป็นอักษรที่กำหนด</span>
      </button>
      <button class="comp-game-card ${CB&&CB.kind==='split'?'active':''}" onclick="startBuildGame('split')">
        <span class="ic">${TILE('layers','brown')}</span>
        <b>แยกอักษรเป็นส่วนประกอบ</b>
        <span>เห็นอักษรทั้งตัว — เลือก 2 ชิ้นส่วนที่เป็นที่มาของอักษรนั้น</span>
      </button>
    </div>
    <div id="buildGameBox" class="build-game-box"></div>`;
  if(CB) renderBuildRound();
  observeReveals();
}

/* คลิกส่วนประกอบ → อักษรที่ใช้มัน (จากรายการ curated + คู่ประกอบในคลัง + fallback ค้นข้อความ) */
function openCompChars(c, name){
  const D = compData();
  const chars = new Set();
  /* รายการที่คัดสรรไว้ในฐานข้อมูล */
  const entry = D.comp.find(function(x){ return x.c === c; });
  if(entry && entry.chars) entry.chars.split('').forEach(function(ch){ chars.add(ch); });
  /* อักษรจากการผสม (combos) ที่ใช้ส่วนประกอบนี้ */
  D.combos.forEach(function(k){
    if(k.a === c || k.b === c) chars.add(k.r);
  });
  /* fallback: อักษรที่มีส่วนประกอบนี้เป็นข้อความย่อย (กรณีอักษรซ้อน) */
  CHARS.forEach(function(x){
    if(x && x.c && x.c.indexOf(c) > -1 && x.c.length > c.length) chars.add(x.c);
  });
  /* เรียงตามฐานข้อมูล — ดึงพินอิน/ความหมายจาก DB จริง */
  const byChar = {};
  CHARS.forEach(function(x){ byChar[x.c] = x; });
  const list = Array.from(chars).map(function(ch){ return byChar[ch]; }).filter(Boolean);
  const shown = list.slice(0, 60);
  glassPop({
    icon: 'kanji',
    title: 'อักษรที่ใช้ ' + c + ' (' + name + ')',
    body: `
      <p style="margin:0 0 12px;font-size:13px;color:var(--text-2)">พบ <b>${list.length}</b> ตัวในฐานข้อมูล 3,000 ตัว${list.length>60?' — แสดง 60 ตัวแรก':''} · คลิกตัวอักษรเพื่อดูรายละเอียด</p>
      <div class="comp-pop-grid">
        ${shown.map(function(x){
          return `<button class="comp-pop-cell" onclick="closeGlassPop();openChar('${esc(x.c)}')">
            <span class="kai">${esc(x.c)}</span>
            <span class="py">${esc(x.p||'')}</span>
            <span class="th">${esc((x.th||'').slice(0,12))}</span>
          </button>`;
        }).join('')}
      </div>`,
    actions: [{label:'ปิด', cls:'btn-ghost', fn: closeGlassPop}]
  });
}

/* --------------------------------------------------------------------------
   ตัวช่วย
-------------------------------------------------------------------------- */
function seededShuffleLocal(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function stripTone(syl){
  const m = {'ā':'a','á':'a','ǎ':'a','à':'a','ē':'e','é':'e','ě':'e','è':'e','ī':'i','í':'i','ǐ':'i','ì':'i','ō':'o','ó':'o','ǒ':'o','ò':'o','ū':'u','ú':'u','ǔ':'u','ù':'u','ǖ':'ü','ǘ':'ü','ǚ':'ü','ǜ':'ü'};
  return String(syl||'').toLowerCase().split('').map(function(ch){ return m[ch] || ch; }).join('');
}
function splitSyllable(syl){
  const base = stripTone(syl);
  let initial = '';
  for(const ini of PY_INITIALS){
    if(base.startsWith(ini) && ini.length > initial.length) initial = ini;
  }
  const final = base.slice(initial.length);
  let tone = '5';
  try{ if(typeof pinyinTone === 'function') tone = String(pinyinTone(syl)||'5'); }catch(e){}
  return {initial: initial, final: final, tone: tone};
}

/* --------------------------------------------------------------------------
   เกม — เริ่มรอบ
-------------------------------------------------------------------------- */
const GAME_TOTAL = 8;
const GAME_NAMES = {char:'สร้างอักษร', word:'สร้างคำ', syl:'ประกอบพินอิน', pick:'เลือกคู่ส่วนประกอบ', split:'แยกอักษร'};
function startBuildGame(kind){
  const D = compData();
  const pool = {char:D.combos, word:D.words, syl:D.syl, pick:D.combos, split:D.combos}[kind];
  if(!pool || !pool.length){ toast('ไม่มีข้อมูลเกมนี้'); return; }
  const target = pool[Math.floor(Math.random()*pool.length)];
  CB = buildRoundState(kind, target, D);
  renderBuildRound();
  const box = $('#buildGameBox'); if(box) box.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function buildRoundState(kind, target, D){
  let slots = [], tray = [], pickOpts = [], pickSel = [];
  if(kind === 'char'){
    slots = [target.a, target.b];
    const dist = D.comp.map(function(c){ return c.c; }).filter(function(c){ return c !== target.a && c !== target.b; });
    tray = [target.a, target.b].concat(seededShuffleLocal(dist).slice(0, 4));
  } else if(kind === 'word'){
    slots = [target.a, target.b];
    const allChars = Array.from(new Set(D.words.map(function(w){ return w.a + w.b; }).join('').split('').concat(D.combos.map(function(c){ return c.r; }))));
    const dist = allChars.filter(function(c){ return c !== target.a && c !== target.b; });
    tray = [target.a, target.b].concat(seededShuffleLocal(dist).slice(0, 4));
  } else if(kind === 'syl'){
    const sp = splitSyllable(target.s);
    slots = [sp.initial, sp.final, String(sp.tone)];
    const wrongIni = seededShuffleLocal(PY_INITIALS.filter(function(i){ return i !== sp.initial; })).slice(0, 3);
    const wrongFin = seededShuffleLocal(PY_FINALS.filter(function(f){ return f !== sp.final; })).slice(0, 2);
    const wrongTone = seededShuffleLocal(['1','2','3','4'].filter(function(t){ return t !== sp.tone; })).slice(0, 1);
    tray = [sp.initial, sp.final, String(sp.tone)].concat(wrongIni, wrongFin, wrongTone);
  } else if(kind === 'pick'){
    const dist = D.comp.map(function(c){ return c.c; }).filter(function(c){ return c !== target.b; });
    pickOpts = [target.b].concat(seededShuffleLocal(dist).slice(0, 3));
  } else if(kind === 'split'){
    const dist = D.comp.map(function(c){ return c.c; }).filter(function(c){ return c !== target.a && c !== target.b; });
    tray = [target.a, target.b].concat(seededShuffleLocal(dist).slice(0, 4));
  }
  return {
    kind: kind, target: target, slots: slots,
    placed: new Array(slots.length).fill(null),
    tray: seededShuffleLocal(tray),
    pickOpts: seededShuffleLocal(pickOpts),
    pickSel: pickSel,
    round: 1, score: 0, streak: 0, total: GAME_TOTAL, firstTry: true, finished: false
  };
}

/* --------------------------------------------------------------------------
   เรนเดอร์รอบ
-------------------------------------------------------------------------- */
function renderBuildRound(){
  const box = $('#buildGameBox'); if(!box || !CB) return;
  if(CB.finished){ renderBuildResult(); return; }
  const t = CB.target;
  let hint = '', main = '';
  if(CB.kind === 'char'){
    hint = `สร้างอักษรที่แปลว่า <b>"${esc(t.th)}"</b> · พินอิน <b class="py">${esc(t.py)}</b>`;
    main = renderSlotsUI(t.layout === 'tb' ? 'tb' : 'lr') + renderTrayUI();
  } else if(CB.kind === 'word'){
    hint = `สร้างคำที่แปลว่า <b>"${esc(t.th)}"</b> · พินอิน <b class="py">${esc(t.py)}</b>`;
    main = renderSlotsUI('lr') + renderTrayUI();
  } else if(CB.kind === 'syl'){
    const sp = splitSyllable(t.s);
    hint = `ประกอบเสียง <b class="py">${esc(t.s)}</b> (วรรณยุกต์ที่ ${sp.tone}) · <b style="font-family:var(--ff-kai);font-size:34px;color:var(--red)">${esc(t.hz)}</b> ${esc(t.th)}`;
    main = renderSlotsUI('lr') + renderTrayUI();
  } else if(CB.kind === 'pick'){
    hint = `อักษร <b style="font-family:var(--ff-kai);font-size:40px;color:var(--red);margin:0 6px">${esc(t.r)}</b> (${esc(t.py)} · ${esc(t.th)}) — ส่วนประกอบ <b style="font-family:var(--ff-kai);font-size:36px;color:var(--brown-3);margin:0 6px">${esc(t.a)}</b> ต้องคู่กับชิ้นใด?`;
    main = `
      <div class="pick-opts">
        ${CB.pickOpts.map(function(c, i){
          return `<button class="pick-opt" onclick="bsPickChoose(${i})">${esc(c)}</button>`;
        }).join('')}
      </div>`;
  } else if(CB.kind === 'split'){
    hint = `อักษร <b style="font-family:var(--ff-kai);font-size:44px;color:var(--red);margin:0 6px">${esc(t.r)}</b> (${esc(t.py)} · ${esc(t.th)}) — เกิดจากส่วนประกอบ 2 ชิ้นใด? (เลือก 2 ชิ้น)`;
    main = `
      <div class="bs-tray split-tray">
        ${CB.tray.map(function(c, i){
          return `<button class="bs-chip split-chip ${CB.pickSel.includes(i)?'sel':''}" onclick="bsSplitToggle(${i})">${esc(c)}</button>`;
        }).join('')}
      </div>`;
  }
  box.innerHTML = `
    <div class="build-round">
      <div class="build-head">
        <div><b>รอบที่ ${CB.round}/${CB.total} · ${esc(GAME_NAMES[CB.kind])}</b><span>คะแนน ${CB.score} · สตรีค ${CB.streak}</span></div>
        <button class="mini-btn ghost" onclick="startBuildGame('${CB.kind}')">${ICON('refresh-cw')} เริ่มใหม่</button>
      </div>
      <p class="build-hint">${hint}
        ${CB.kind==='syl'?`<button class="mini-btn gold" style="margin-left:8px" onclick="speak('${esc(t.hz)}')">${ICON('volume-2')} ฟัง</button>`:''}
        ${(CB.kind==='char'||CB.kind==='word'||CB.kind==='pick'||CB.kind==='split')?`<button class="mini-btn gold" style="margin-left:8px" onclick="speak('${esc(t.r||(t.a+t.b))}')">${ICON('volume-2')} ฟัง</button>`:''}
      </p>
      ${main}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
        ${CB.kind==='pick'? '' : `
        <button class="btn btn-primary btn-sm" onclick="bsCheck()" ${CB.kind==='split'? (CB.pickSel.length===2?'':'disabled style="opacity:.45;cursor:not-allowed"') : (CB.placed.some(function(p){ return !p; })?'disabled style="opacity:.45;cursor:not-allowed"':'')}>${ICON('check')} ตรวจคำตอบ</button>
        <button class="btn btn-ghost btn-sm" onclick="bsClear()">${ICON('undo')} เคลียร์ช่อง</button>`}
      </div>
      <div id="bsFeedback"></div>
    </div>`;
}
function renderSlotsUI(layout){
  const slotsHTML = CB.slots.map(function(s, i){
    const placed = CB.placed[i];
    return `<div class="bs-slot ${placed?'filled':''}" data-i="${i}" onclick="bsSlotClick(${i})"
        ondragover="event.preventDefault();this.classList.add('hover')"
        ondragleave="this.classList.remove('hover')"
        ondrop="event.preventDefault();this.classList.remove('hover');bsPlace(event.dataTransfer.getData('text'),${i})">
        ${placed?`<span class="bs-chip placed" draggable="true" ondragstart="event.dataTransfer.setData('text','${i}');event.stopPropagation()" onclick="event.stopPropagation();bsSlotClick(${i})">${esc(placed)}</span>`:`<span class="ph">${CB.kind==='syl'?(i===2?'วรรณยุกต์':i===1?'สระ':'พยัญชนะ'):'?'}</span>`}
      </div>`;
  }).join('<span class="plus">+</span>');
  return `<div class="bs-slots ${layout}">${slotsHTML}</div>`;
}
function renderTrayUI(){
  const trayHTML = CB.tray.map(function(c, i){
    return `<span class="bs-chip" draggable="true" data-tray="${i}"
        ondragstart="event.dataTransfer.setData('text','t${i}')"
        onclick="bsChipClick(${i})">${esc(c)}</span>`;
  }).join('');
  return `<div class="bs-tray">${trayHTML}</div>`;
}

/* --------------------------------------------------------------------------
   วาง/ถอด/เลือก
-------------------------------------------------------------------------- */
function bsChipClick(i){
  if(!CB) return;
  const c = CB.tray[i];
  if(c === undefined) return;
  const empty = CB.placed.findIndex(function(p){ return !p; });
  if(empty < 0){ toast('ช่องเต็มแล้ว — แตะชิ้นที่วางไว้เพื่อถอดกลับ'); return; }
  CB.tray.splice(i, 1);
  CB.placed[empty] = c;
  renderBuildRound();
}
function bsSlotClick(i){
  if(!CB) return;
  if(CB.placed[i]){
    CB.tray.push(CB.placed[i]);
    CB.placed[i] = null;
    renderBuildRound();
  }
}
function bsPlace(payload, slotIdx){
  if(!CB) return;
  if(payload === '' ) return;
  if(payload[0] === 't'){
    const ti = +payload.slice(1);
    const c = CB.tray[ti];
    if(c === undefined) return;
    CB.tray.splice(ti, 1);
    if(CB.placed[slotIdx]) CB.tray.push(CB.placed[slotIdx]);
    CB.placed[slotIdx] = c;
  } else {
    const from = +payload;
    const c = CB.placed[from];
    if(c === undefined) return;
    CB.placed[from] = null;
    if(CB.placed[slotIdx]) CB.tray.push(CB.placed[slotIdx]);
    CB.placed[slotIdx] = c;
  }
  renderBuildRound();
}
function bsClear(){
  if(!CB) return;
  CB.placed.forEach(function(c, i){ if(c){ CB.tray.push(c); CB.placed[i] = null; } });
  CB.pickSel = [];
  renderBuildRound();
}
function bsSplitToggle(i){
  if(!CB) return;
  const at = CB.pickSel.indexOf(i);
  if(at > -1){ CB.pickSel.splice(at, 1); }
  else{
    if(CB.pickSel.length >= 2) CB.pickSel.shift();
    CB.pickSel.push(i);
  }
  renderBuildRound();
}
function bsPickChoose(i){
  if(!CB || CB.finished) return;
  const fb = $('#bsFeedback'); if(!fb) return;
  const chosen = CB.pickOpts[i];
  if(chosen === CB.target.b){
    const gained = CB.firstTry ? 10 + CB.streak * 2 : 5;
    CB.score += gained; CB.streak++;
    fb.innerHTML = `
      <div class="bs-right">
        ${ICON('check')} ถูกต้อง! <b style="font-family:var(--ff-kai);font-size:38px;color:var(--red);margin:0 8px">${esc(CB.target.a)} + ${esc(CB.target.b)} = ${esc(CB.target.r)}</b>
        <span>${esc(CB.target.py)} · ${esc(CB.target.th)} +${gained} คะแนน</span>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px">
          <button class="mini-btn" onclick="openWrite('${esc(CB.target.r)}')">${ICON('pen-line')} ดูวิธีเขียน</button>
          <button class="btn btn-gold btn-sm" onclick="bsNext()">${ICON('arrow-right')} ข้อถัดไป</button>
        </div>
      </div>`;
  } else {
    CB.firstTry = false;
    fb.innerHTML = '<div class="bs-wrong">' + ICON('x') + ' ยังไม่ถูก — ลองเลือกชิ้นอื่นดู</div>';
  }
}

/* --------------------------------------------------------------------------
   ตรวจคำตอบ (char/word/syl/split)
-------------------------------------------------------------------------- */
function bsCheck(){
  if(!CB || CB.finished) return;
  const fb = $('#bsFeedback'); if(!fb) return;
  let ok = false;
  if(CB.kind === 'split'){
    const chosen = CB.pickSel.map(function(i){ return CB.tray[i]; }).sort();
    const want = [CB.target.a, CB.target.b].slice().sort();
    ok = chosen.length === 2 && chosen[0] === want[0] && chosen[1] === want[1];
    if(!ok){ CB.firstTry = false; fb.innerHTML = '<div class="bs-wrong">' + ICON('x') + ' ยังไม่ถูก — ลองเปลี่ยนชิ้นส่วนที่เลือกดู</div>'; return; }
  } else {
    ok = CB.placed.every(function(c, i){ return c === CB.slots[i]; });
    if(!ok){ CB.firstTry = false; fb.innerHTML = '<div class="bs-wrong">' + ICON('x') + ' ยังไม่ถูก — ลองสลับหรือเปลี่ยนชิ้นส่วนดู (แตะชิ้นที่วางไว้เพื่อถอดกลับ)</div>'; return; }
  }
  const gained = CB.firstTry ? 10 + CB.streak * 2 : 5;
  CB.score += gained;
  CB.streak++;
  const t = CB.target;
  const answerTxt = CB.kind === 'syl' ? t.s : (t.r || (t.a + t.b));
  fb.innerHTML = `
    <div class="bs-right">
      ${ICON('check')} ถูกต้อง! <b style="font-family:var(--ff-kai);font-size:38px;color:var(--red);margin:0 8px">${esc(answerTxt)}</b>
      <span>${esc(CB.kind==='char'? t.py + ' · ' + t.th : CB.kind==='word' ? t.py + ' · ' + t.th : t.hz + ' · ' + t.th)} +${gained} คะแนน</span>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px">
        ${(CB.kind==='char'||CB.kind==='split')&&t.r?`<button class="mini-btn" onclick="openWrite('${esc(t.r)}')">${ICON('pen-line')} ดูวิธีเขียน</button>`:''}
        <button class="btn btn-gold btn-sm" onclick="bsNext()">${ICON('arrow-right')} ข้อถัดไป</button>
      </div>
    </div>`;
}
function bsNext(){
  if(!CB) return;
  if(CB.round >= CB.total){ CB.finished = true; renderBuildRound(); return; }
  const kind = CB.kind;
  const D = compData();
  const pool = kind==='char'?D.combos:kind==='word'?D.words:kind==='syl'?D.syl:D.combos;
  const target = pool[Math.floor(Math.random()*pool.length)];
  const next = buildRoundState(kind, target, D);
  next.round = CB.round + 1;
  next.score = CB.score;
  next.streak = CB.streak;
  CB = next;
  renderBuildRound();
}
function renderBuildResult(){
  const box = $('#buildGameBox'); if(!box || !CB) return;
  const total = CB.total * 12;
  const pct = Math.round(CB.score / total * 100);
  const u = currentUser();
  if(u && CB.score > 0){
    award(u, CB.score, CB.score, 'game', 'ตัวต่ออักษร ' + GAME_NAMES[CB.kind] + ' — ' + CB.score + ' คะแนน');
  }
  box.innerHTML = `
    <div class="build-round" style="text-align:center">
      <div class="kicker" style="margin-bottom:6px">จบรอบ — ${esc(GAME_NAMES[CB.kind])} · คะแนนรวม</div>
      <div style="font-family:var(--ff-num);font-size:52px;font-weight:800;color:var(--red)">${CB.score}<span style="font-size:16px;color:var(--text-3)"> / ${total}</span></div>
      <p style="color:var(--text-2);margin:6px 0 14px">${pct>=80?'ยอดเยี่ยม! จำส่วนประกอบได้แม่นมาก':pct>=50?'ดีมาก ฝึกต่ออีกนิดจะคล่องขึ้น':'ฝึกบ่อย ๆ แล้วจะจำได้เอง — ลองอีกครั้ง!'}</p>
      <div class="result-row" style="justify-content:center">
        <button class="btn btn-gold" onclick="startBuildGame('${CB.kind}')">${ICON('refresh-cw')} เล่นอีกครั้ง</button>
        <button class="btn btn-ghost" onclick="startBuildGame('char')">สร้างอักษร</button>
        <button class="btn btn-ghost" onclick="startBuildGame('word')">สร้างคำ</button>
        <button class="btn btn-ghost" onclick="startBuildGame('syl')">ประกอบพินอิน</button>
        <button class="btn btn-ghost" onclick="startBuildGame('pick')">เลือกคู่</button>
        <button class="btn btn-ghost" onclick="startBuildGame('split')">แยกอักษร</button>
      </div>
    </div>`;
}
