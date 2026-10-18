/* ==========================================================================
   为什么中文 · บทสนทนา (对话) — ตัวละคร SVG ต้นฉบับ · สลับพินอิน · คำศัพท์+HSK
   ========================================================================== */
'use strict';

function dlgList(){ return (typeof WC_DATA !== 'undefined' && WC_DATA.dialogues) || []; }
function dlgTopics(){
  const m = {};
  dlgList().forEach(function(d){ if(!m[d.topic]) m[d.topic] = d.topicName || d.topic; });
  return m;
}
/* ---- อวตารตัวละคร SVG ต้นฉบับ (ไม่ใช้อีโมจิ) ---- */
function dlgAvatar(kind){
  const face = '<rect x="22" y="24" width="20" height="17" rx="6" fill="#f2d8b0"/><circle cx="29" cy="32" r="1.5" fill="#3a2e25"/><circle cx="35" cy="32" r="1.5" fill="#3a2e25"/><path d="M29 38 Q32 40 35 38" stroke="#b0664a" stroke-width="1.2" fill="none"/>';
  const tops = {
    ming: '<path d="M20 26 Q24 8 34 6 Q44 8 44 26 Z" fill="#3a2e25"/>',
    li:   '<rect x="20" y="8" width="24" height="20" rx="6" fill="#2f2a3a"/><path d="M22 10 L22 26 M28 10 L28 26 M34 10 L34 26 M40 10 L40 26" stroke="#4a445c" stroke-width="1.4"/>',
    anna: '<path d="M16 28 Q14 10 22 6 L30 6 Q24 12 24 24 Q24 30 22 34 L20 30 Z" fill="#d9a441"/><path d="M48 28 Q50 10 42 6 L34 6 Q40 12 40 24 Q40 30 42 34 L44 30 Z" fill="#d9a441"/><path d="M20 26 Q32 8 44 26 Z" fill="#8a5a2e"/>',
    laoshi:'<path d="M20 26 Q32 10 44 26 Z" fill="#5a5248"/><rect x="22" y="26" width="20" height="4" rx="2" fill="#3a3a3a"/><rect x="26" y="34" width="12" height="3.4" rx="1.6" fill="#3a3a3a"/>',
    ayi:  '<path d="M18 28 Q16 10 24 6 L30 6 Q24 12 24 24 Q24 30 22 34 L20 30 Z" fill="#6a6a66"/><path d="M46 28 Q48 10 40 6 L34 6 Q40 12 40 24 Q40 30 42 34 L44 30 Z" fill="#6a6a66"/><path d="M20 26 Q32 8 44 26 Z" fill="#4a4a44"/>'
  };
  const body = '<rect x="18" y="41" width="28" height="22" rx="5" fill="#8a5a3a"/>';
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + (tops[kind] || tops.ming) + face + body + '</svg>';
}
/* พินอินอัตโนมัติต่อบรรทัด (คำ → พินอินจากคลัง HSK; ที่เหลือจากฐานข้อมูลอักษร) */
let DLG_WORDS = null, DLG_CHARS = null;
function dlgWordMap(){
  if(DLG_WORDS) return DLG_WORDS;
  DLG_WORDS = {};
  for(let lv=1; lv<=6; lv++){
    (DB.hsk[lv]||[]).forEach(function(w){ if(w && w.cn && w.py && !DLG_WORDS[w.cn]) DLG_WORDS[w.cn] = w.py; });
  }
  return DLG_WORDS;
}
function dlgLinePinyin(zh){
  const words = dlgWordMap();
  const charPy = {};
  CHARS.forEach(function(x){ charPy[x.c] = x.p; });
  const clean = String(zh||'').replace(/[，。！？、；：]/g, '');
  const out = [];
  let i = 0;
  while(i < clean.length){
    let best = null;
    for(let len = 4; len >= 2; len--){
      if(i + len > clean.length) continue;
      const seg = clean.slice(i, i + len);
      if(words[seg]){ best = {t: seg, py: words[seg]}; break; }
    }
    if(best){ out.push(best.py); i += best.t.length; }
    else{ out.push(charPy[clean[i]] || clean[i]); i++; }
  }
  return out.join(' ');
}
/* ---- หน้า hub: หมวดหัวข้อ + การ์ดบทสนทนา ---- */
function renderDialoguesHub(){
  const view = $('#dlgView');
  if(view){ view.style.display = 'none'; view.innerHTML = ''; }
  const hub = $('#dlgHub'); if(hub) hub.style.display = '';
  const box = $('#dlgHub'); if(!box) return;
  const topics = dlgTopics();
  const all = dlgList();
  box.innerHTML = `
    <div class="sec-head reveal" style="margin:28px auto 16px;text-align:center">
      <div class="kicker">Dialogues · 对话</div>
      <h2>ฝึกบทสนทนากับตัวละคร</h2>
      <p>เลือกหมวดหัวข้อที่สนใจ — ทุกบทมี 4+ ผลัดบทสนทนา เปิด/ปิดพินอินได้ มีคำศัพท์ใหม่พร้อมระดับ HSK และฟังเสียงอ่านสองเสียง</p>
    </div>
    <div class="dlg-topics" id="dlgTopics">
      <button class="chip ${!sessionStorage.wszw_dlg_topic?'sel':''}" onclick="sessionStorage.removeItem('wszw_dlg_topic');renderDialoguesHub()">ทั้งหมด</button>
      ${Object.keys(topics).map(function(t){
        return `<button class="chip ${sessionStorage.wszw_dlg_topic===t?'sel':''}" onclick="sessionStorage.setItem('wszw_dlg_topic','${t}');renderDialoguesHub()">${esc(topics[t])}</button>`;
      }).join('')}
    </div>
    <div class="dlg-grid">
      ${all.filter(function(d){ return !sessionStorage.wszw_dlg_topic || d.topic === sessionStorage.wszw_dlg_topic; }).map(function(d){
        return `
        <div class="dlg-card reveal" onclick="openDialogue('${d.id}')">
          <div class="dlg-avas">
            <span class="dlg-ava">${dlgAvatar(d.chars.a.av)}</span>
            <span class="dlg-ava">${dlgAvatar(d.chars.b.av)}</span>
          </div>
          <h3>${esc(d.title)}</h3>
          <p>${esc(d.chars.a.n)} & ${esc(d.chars.b.n)} — ${esc(d.chars.a.role)} · ${esc(d.chars.b.role)}</p>
          <div class="hub-tags">
            <span class="tag-pill red">${esc(d.topicName)}</span>
            <span class="tag-pill gold">HSK ${d.level}</span>
            <span class="tag-pill">${(d.lines.length/2)|0}+ ผลัด</span>
          </div>
          <span class="go">เปิดบทสนทนา →</span>
        </div>`;
      }).join('')}
    </div>`;
  observeReveals();
}
/* ---- หน้าอ่านบทสนทนา (เต็มจอ) ---- */
let DLG = {id:'', pinyin:true};
/* เพศของตัวละครสำหรับเสียงอ่าน (ชาย/หญิง) */
const DLG_GENDER = {ming:'m', li:'m', laoshi:'m', ayi:'f', anna:'f'};
let DLG_PLAY = {idx:0, playing:false, token:0};
function openDialogue(id){
  const d = dlgList().find(function(x){ return x.id === id; });
  if(!d) return;
  DLG = {id: id, pinyin: true};
  DLG_PLAY = {idx:0, playing:false, token:0};
  const hub = $('#dlgHub'); if(hub) hub.style.display = 'none';
  const view = $('#dlgView'); if(view) view.style.display = '';
  renderDialogueView();
}
function backToDialogueHub(){
  dlgStopPlay();
  const hub = $('#dlgHub'); if(hub) hub.style.display = '';
  const view = $('#dlgView'); if(view){ view.style.display = 'none'; view.innerHTML = ''; }
  renderDialoguesHub();
}
/* หยุดทั้งหมด (หยุดถาวร กลับจุดเริ่มต้น) */
function dlgStopPlay(){
  DLG_PLAY.token++;
  DLG_PLAY.playing = false;
  DLG_PLAY.idx = 0;
  try{ speechSynthesis.cancel(); }catch(e){}
  renderDlgPlayButtons();
}
/* หยุดชั่วคราว — ค้างไว้ที่ประโยคปัจจุบัน */
function dlgPausePlay(){
  DLG_PLAY.token++;
  DLG_PLAY.playing = false;
  try{ speechSynthesis.cancel(); }catch(e){}
  renderDlgPlayButtons();
}
/* เล่น/เล่นต่อ — อ่านทีละประโยค พร้อมชื่อผู้พูด (เช่น 小明说。) */
function dlgPlayAll(){
  const d = dlgList().find(function(x){ return x.id === DLG.id; });
  if(!d) return;
  const my = ++DLG_PLAY.token;
  DLG_PLAY.playing = true;
  renderDlgPlayButtons();
  const vF = (typeof pickGenderVoice === 'function') ? pickGenderVoice('f') : null;
  const vM = (typeof pickGenderVoice === 'function') ? pickGenderVoice('m') : null;
  const next = function(){
    if(my !== DLG_PLAY.token || !DLG_PLAY.playing) return;
    if(DLG_PLAY.idx >= d.lines.length){
      DLG_PLAY.playing = false;
      DLG_PLAY.idx = 0;
      renderDlgPlayButtons();
      return;
    }
    const line = d.lines[DLG_PLAY.idx];
    const ch = line.sp === 'a' ? d.chars.a : d.chars.b;
    const female = DLG_GENDER[ch.av] === 'f';
    const u = new SpeechSynthesisUtterance(ch.n + '说。' + (line.zh || ''));
    u.lang = 'zh-CN';
    u.pitch = female ? 1.25 : .85;
    u.rate = female ? .9 : .82;
    if(female && vF) u.voice = vF;
    else if(!female && vM) u.voice = vM;
    else if(vF) u.voice = vF;
    u.onerror = function(){};
    u.onend = function(){
      if(my !== DLG_PLAY.token) return;
      DLG_PLAY.idx++;
      /* ไฮไลต์ประโยคที่กำลังอ่าน */
      highlightDlgLine(DLG_PLAY.idx);
      next();
    };
    try{ speechSynthesis.speak(u); }catch(e){ DLG_PLAY.idx++; next(); }
  };
  highlightDlgLine(0);
  next();
}
function highlightDlgLine(i){
  const rows = $$('#dlgView .dlg-row');
  rows.forEach(function(r, k){ r.classList.toggle('reading', k === i); });
  const el = $('#dlgView .dlg-row.reading');
  if(el && el.scrollIntoView) el.scrollIntoView({behavior:'smooth', block:'center'});
}
function renderDlgPlayButtons(){
  const b1 = $('#dlgPlayBtn'), b2 = $('#dlgPauseBtn'), b3 = $('#dlgStopBtn');
  if(b1) b1.textContent = DLG_PLAY.playing ? 'กำลังเล่น…' : (DLG_PLAY.idx > 0 ? 'เล่นต่อ ▶' : 'เล่น ▶');
  if(b1) b1.disabled = DLG_PLAY.playing;
  if(b2) b2.disabled = !DLG_PLAY.playing;
  if(b3) b3.disabled = !DLG_PLAY.playing && DLG_PLAY.idx === 0;
}
function toggleDlgPinyin(){
  DLG.pinyin = !DLG.pinyin;
  renderDialogueView();
}
function renderDialogueView(){
  const box = $('#dlgView'); if(!box) return;
  const d = dlgList().find(function(x){ return x.id === DLG.id; });
  if(!d){ box.innerHTML = ''; return; }
  box.innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('articles')">บทความ & บทสนทนา</a> <span class="sep">›</span>
      <a onclick="backToDialogueHub()">บทสนทนา</a> <span class="sep">›</span>
      <span>${esc(d.title)}</span></div>
    <div class="panel" style="max-width:1000px;margin:0 auto">
      <div class="dlg-view-head">
        <div class="dlg-avas big">
          <span class="dlg-ava"><div>${dlgAvatar(d.chars.a.av)}</div><b>${esc(d.chars.a.n)}</b><i>${esc(d.chars.a.role)}</i></span>
          <span class="dlg-ava"><div>${dlgAvatar(d.chars.b.av)}</div><b>${esc(d.chars.b.n)}</b><i>${esc(d.chars.b.role)}</i></span>
        </div>
        <h3>${esc(d.title)}</h3>
        <div class="hub-tags" style="justify-content:center">
          <span class="tag-pill red">${esc(d.topicName)}</span>
          <span class="tag-pill gold">HSK ${d.level}</span>
        </div>
        <div class="dlg-controls">
          <button class="btn btn-gold btn-sm" id="dlgPlayBtn" onclick="dlgPlayAll()">${ICON('play')} เล่น ▶</button>
          <button class="btn btn-ghost btn-sm" id="dlgPauseBtn" onclick="dlgPausePlay()" disabled>${ICON('pause')} หยุดชั่วคราว</button>
          <button class="btn btn-ghost btn-sm" id="dlgStopBtn" onclick="dlgStopPlay()" disabled>${ICON('x')} หยุด</button>
          <button class="btn btn-ghost btn-sm" onclick="toggleDlgPinyin()">${ICON('type')} พินอิน ${DLG.pinyin?'เปิดอยู่':'ปิดอยู่'}</button>
        </div>
      </div>
      <div class="dlg-lines-view">
        ${d.lines.map(function(l, i){
          const ch = l.sp === 'a' ? d.chars.a : d.chars.b;
          return `
          <div class="dlg-row ${l.sp}">
            <span class="dlg-mini-ava">${dlgAvatar(ch.av)}</span>
            <div class="dlg-bubble">
              <b>${esc(ch.n)}</b>
              <p class="zh" style="font-family:var(--ff-cn)">${esc(l.zh)}</p>
              ${DLG.pinyin?`<p class="py">${esc(dlgLinePinyin(l.zh))}</p>`:''}
              <button class="dlg-say" onclick="speak(${esc(JSON.stringify(l.zh))})" title="ฟังประโยคนี้">${ICON('volume-2')}</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="dlg-vocab">
        <h3>${ICON('book-open')} คำศัพท์ใหม่ในบทนี้</h3>
        <div class="dlg-vocab-grid">
          ${(d.vocab||[]).map(function(v){
            const lv = v[3] || '';
            return `<div class="dlg-vocab-cell">
              <span class="cn" style="font-family:var(--ff-cn)">${esc(v[0])}</span>
              <span class="py">${esc(v[1])}</span>
              <span class="th">${esc(v[2])}</span>
              ${lv?`<span class="tag-pill gold" style="font-size:9.5px;padding:2px 8px">HSK ${lv}</span>`:''}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  observeReveals();
}
