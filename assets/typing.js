/* ==========================================================================
   为什么中文 · เกมพิมพ์อักษรจีน (HanZi Typer) — เทอร์มินัลย้อนยุค
   200 ด่าน เรียงง่าย→ยาก · แต่ละด่านเป็นประโยคภาษาจีน · จับเวลา (ช้า = คะแนนน้อย)
   ========================================================================== */
'use strict';

const TY_TOTAL_STAGES = 200;
const TY_STAGES_PER_LV = 33;
let TY = null;          /* สถานะเกมปัจจุบัน */
let TY_TIMER = null;

/* --------------------------------------------------------------------------
   ธีมเทอร์มินัล — เลือกตามความชอบผู้ใช้ (บันทึกใน localStorage)
-------------------------------------------------------------------------- */
const TY_THEMES = [
  {id:'green', name:'Classic Green', c1:'#0b120c', c2:'#37e57a', price:0, kind:'crt'},
  {id:'amber', name:'Amber CRT',     c1:'#1a1105', c2:'#ffb347', price:0, kind:'crt'},
  {id:'ice',   name:'Ice Cyan',      c1:'#051318', c2:'#5ee8ff', price:0, kind:'crt'},
  {id:'vapor', name:'Vapor Violet',  c1:'#140a1f', c2:'#c084fc', price:0, kind:'crt'},
  {id:'paper', name:'Old Paper',     c1:'#f4ecdb', c2:'#8a2519', price:0, kind:'light'},
  {id:'white', name:'White Light',   c1:'#ffffff', c2:'#8a2519', price:20, kind:'light', premium:true},
  {id:'cat',   name:'Pixel Cat 猫',  c1:'#1c0f14', c2:'#ff9a3c', price:20, kind:'pixel', premium:true, pet:'cat'},
  {id:'dog',   name:'Pixel Dog 狗',  c1:'#0f141c', c2:'#8ec9ff', price:20, kind:'pixel', premium:true, pet:'dog'},
  {id:'rabbit',name:'Pixel Rabbit 兔', c1:'#1a0f1c', c2:'#ffb3d1', price:20, kind:'pixel', premium:true, pet:'rabbit'}
];
function tyThemeDef(id){ return TY_THEMES.find(function(t){ return t.id === id; }); }
function tyThemeUnlocked(id){
  const t = tyThemeDef(id);
  if(!t || !t.price) return true;
  const u = currentUser();
  return !!(u && (u.tyThemes||[]).includes(id));
}
/* ปลดล็อกธีมด้วยเหรียญ為錢 */
function tyUnlockTheme(id){
  const t = tyThemeDef(id);
  if(!t || tyThemeUnlocked(id)) return;
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนปลดล็อกธีม'); go('login'); return; }
  if(weiqianOf(u) < t.price){
    glassPop({
      icon: 'coins',
      title: 'เหรียญไม่พอ',
      body: `<p style="margin:0 0 10px;text-align:center">ธีมนี้ราคา <b>${t.price} 為錢</b> — คุณมี ${coinHTML('sm')} ${weiqianOf(u).toLocaleString()} เหรียญ</p>
        <p style="text-align:center;font-size:12.5px;color:var(--text-3)">ซื้อแพ็กเหรียญเริ่มต้นเพียง ฿35 รับ 50 เหรียญ</p>`,
      actions: [
        {label:'ปิด', cls:'btn-ghost', fn: closeGlassPop},
        {label:'เติมเหรียญ', cls:'btn-gold', fn: function(){ closeGlassPop(); go('shop'); }}
      ]
    });
    return;
  }
  glassConfirm('ปลดล็อกธีม "' + t.name + '" ด้วย ' + t.price + ' 為เงิน? (ปลดล็อกถาวร)', function(){
    if(!spendWeiqian(u, t.price)){ toast('เหรียญไม่พอ'); return; }
    u.tyThemes = u.tyThemes || [];
    u.tyThemes.push(id);
    saveUsers();
    setTyTheme(id);
    toast('ปลดล็อกธีม ' + t.name + ' แล้ว! 🎉');
    reRenderTypingScreen();
  });
}
function tyPetSVG(kind){
  if(kind === 'cat') return `
    <svg viewBox="0 0 48 40" xmlns="http://www.w3.org/2000/svg">
      <g class="tail"><path d="M4 34 Q-2 26 6 20 Q10 17 8 24 Q7 29 6 33 Z" fill="#e88a2e"/></g>
      <polygon class="ear-l" points="10,6 6,20 16,14" fill="#f5a34d"/><polygon points="10,8 8.5,17 13.5,13.5" fill="#f78fb3"/>
      <polygon class="ear-r" points="38,6 42,20 32,14" fill="#f5a34d"/><polygon points="38,8 39.5,17 34.5,13.5" fill="#f78fb3"/>
      <rect x="8" y="8" width="32" height="26" rx="6" fill="#f5a34d"/>
      <g class="eyes"><rect class="eye" x="14" y="16" width="5" height="6" rx="1.5" fill="#3a2e25"/><rect class="eye" x="29" y="16" width="5" height="6" rx="1.5" fill="#3a2e25"/></g>
      <polygon points="23,22 25,22 24,24.5" fill="#f78fb3"/>
      <path d="M24 25 Q24 28 21 28 M24 25 Q24 28 27 28" stroke="#b06a2a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M13 22 L5 20 M13 25 L4 25 M35 22 L43 20 M35 25 L44 25" stroke="#b06a2a" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;
  if(kind === 'dog') return `
    <svg viewBox="0 0 48 40" xmlns="http://www.w3.org/2000/svg">
      <g class="tail"><path d="M44 30 Q50 24 44 16 Q41 13 43 20 Q44 26 42 30 Z" fill="#c98d4e"/></g>
      <rect class="ear-l" x="7" y="4" width="9" height="16" rx="4.5" fill="#8a5a2e"/>
      <rect class="ear-r" x="32" y="4" width="9" height="16" rx="4.5" fill="#8a5a2e"/>
      <rect x="8" y="10" width="32" height="24" rx="7" fill="#d9a066"/>
      <rect x="12" y="8" width="24" height="8" rx="4" fill="#e8b580"/>
      <g class="eyes"><rect class="eye" x="14" y="18" width="5" height="6" rx="1.5" fill="#3a2e25"/><rect class="eye" x="29" y="18" width="5" height="6" rx="1.5" fill="#3a2e25"/></g>
      <ellipse cx="24" cy="24" rx="3.2" ry="2.4" fill="#3a2e25"/>
      <path d="M24 26.5 Q24 30 20.5 30.5 L24 31.5 Q24 30 27.5 30.5 Z" fill="#f78fb3"/>
    </svg>`;
  return `
    <svg viewBox="0 0 48 40" xmlns="http://www.w3.org/2000/svg">
      <ellipse class="ear-l" cx="14" cy="6" rx="5" ry="15" fill="#fff4f7" transform="rotate(-12 14 6)"/>
      <ellipse class="ear-l2" cx="14" cy="8" rx="2.6" ry="11" fill="#ffc9dc" transform="rotate(-12 14 8)"/>
      <ellipse class="ear-r" cx="34" cy="6" rx="5" ry="15" fill="#fff4f7" transform="rotate(12 34 6)"/>
      <ellipse class="ear-r2" cx="34" cy="8" rx="2.6" ry="11" fill="#ffc9dc" transform="rotate(12 34 8)"/>
      <rect x="9" y="12" width="30" height="22" rx="9" fill="#fff4f7"/>
      <g class="eyes"><rect class="eye" x="14" y="20" width="4.5" height="5.5" rx="1.5" fill="#3a2e25"/><rect class="eye" x="29" y="20" width="4.5" height="5.5" rx="1.5" fill="#3a2e25"/></g>
      <ellipse cx="24" cy="25" rx="2.4" ry="1.8" fill="#ff8fb1"/>
      <path d="M24 27 Q24 29.5 21.5 29.5 M24 27 Q24 29.5 26.5 29.5" stroke="#d98aa4" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`;
}
function tyTheme(){
  try{ return localStorage.getItem('wszw_ty_theme') || 'green'; }catch(e){ return 'green'; }
}
function setTyTheme(id){
  if(!tyThemeUnlocked(id)){
    const t = tyThemeDef(id);
    if(t && t.price) tyUnlockTheme(id);
    else try{ localStorage.setItem('wszw_ty_theme', 'green'); }catch(e){}
    return;
  }
  try{ localStorage.setItem('wszw_ty_theme', id); }catch(e){}
  /* อัปเดตหน้าจอที่เปิดอยู่ทันที */
  const shell = $('.ty-shell');
  if(shell) shell.setAttribute('data-theme', id);
  const map = $('.ty-map-wrap');
  if(map) map.setAttribute('data-theme', id);
}
function tyThemeCardHTML(t){
  const unlocked = tyThemeUnlocked(t.id);
  const sel = tyTheme() === t.id;
  return `<button class="ty-theme-card ${sel?'sel':''} ${!unlocked?'locked':''}" onclick="closeGlassPop();setTyTheme('${t.id}');reRenderTypingScreen()">
    <span class="ty-theme-prev" style="background:linear-gradient(180deg,${t.c1},${t.c1});border-bottom:3px solid ${t.c2}">
      ${t.pet?`<span class="ty-prev-pet">${tyPetSVG(t.pet)}</span>`:''}
      ${!unlocked?`<span class="ty-lock">${ICON('lock')} ${coinHTML('sm')} ${t.price}</span>`:''}
    </span>
    <b>${esc(t.name)}</b>
    <span class="ty-card-sub">${t.kind==='pixel'?'8-bit แอนิเมชัน':t.kind==='light'?'ไลต์โหมด':unlocked?(sel?'ใช้อยู่':'แตะเพื่อเลือก'):'พรีเมียม'}</span>
  </button>`;
}
function renderTyThemePicker(){
  const u = currentUser();
  glassPop({
    icon: 'terminal',
    title: 'เลือกธีมเทอร์มินัล',
    body: `
      <p style="margin:0 0 14px;font-size:13px;color:var(--text-2);display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
        ${u?`${coinHTML('sm')} ยอดเหรียญของคุณ: <b style="color:var(--gold)">${weiqianOf(u).toLocaleString()} 為錢</b> · `:''}
        ธีมมี ${ICON('lock')} คือพรีเมียม — ปลดล็อกด้วยเหรียญเป็น錢 ใช้ได้ตลอดชีพ
      </p>
      <div class="ty-theme-grid">
        ${TY_THEMES.map(tyThemeCardHTML).join('')}
      </div>`,
    actions: [{label:'ปิด', cls:'btn-ghost', fn: closeGlassPop}]
  });
}
/* เรนเดอร์หน้าจอเกมใหม่ตามธีมที่เพิ่งเลือก */
function reRenderTypingScreen(){
  if(!TY){ return; }
  if(TY.finished){ renderTypingResultScreen(); }
  else{ renderTypingUI(); }
}

function typingStageOfLv(lv){
  const u = currentUser();
  const done = (u && u.typing && u.typing.stage) || 0;
  const first = (lv - 1) * TY_STAGES_PER_LV + 1;
  const last = Math.min(TY_TOTAL_STAGES, lv * TY_STAGES_PER_LV);
  const start = Math.max(first, Math.min(last, done + 1));
  return {lv, first, last, stage: start};
}
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffleSeeded(arr, rnd){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
/* คลังประโยคจริงจากข้อสอบ/บทอ่านของเว็บ (แบ่งตามระดับ) */
let TY_BANK = null;
function typingBank(){
  if(TY_BANK) return TY_BANK;
  TY_BANK = {1:[], 2:[], 3:[], 4:[], 5:[], 6:[]};
  const extra = (typeof WC_DATA !== 'undefined' && WC_DATA.testextra) ? WC_DATA.testextra : {};
  const charPy = {};
  CHARS.forEach(function(x){ charPy[x.c] = x.p; });
  const add = function(lv, zh, py, th){
    const clean = String(zh||'').replace(/[，。！？、；：·—…"'（）()「」【】《》,.?!:;'"`~\s]/g, '');
    if(clean.length < 2 || clean.length > 60) return;
    const cjk = clean.match(/[\u4e00-\u9fff]/g) || [];
    if(!cjk.length) return;
    TY_BANK[lv].push({zh: clean, py: py || cjk.map(function(c){ return charPy[c] || ''; }).join(' '), th: th || ''});
  };
  for(let lv = 1; lv <= 6; lv++){
    (TESTS[lv]||[]).forEach(function(q){
      if(q.t === 'listen') add(lv, q.zh, q.py, q.th);
      if(q.t === 'dlg') (q.dlg||[]).forEach(function(l){ add(lv, l.zh, '', l.th); });
      if(q.t === 'passage') String(q.text||'').split(/[。！？]/).forEach(function(s){ add(lv, s); });
    });
    (extra[lv]||[]).forEach(function(q){
      if(q.t === 'listen') add(lv, q.zh, q.py, q.th);
      if(q.t === 'dlg') (q.dlg||[]).forEach(function(l){ add(lv, l.zh, '', l.th); });
      if(q.t === 'passage') String(q.text||'').split(/[。！？]/).forEach(function(s){ add(lv, s); });
    });
  }
  return TY_BANK;
}
/* สร้างประโยคของด่าน (deterministic) — ยากขึ้นเรื่อย ๆ ตามเลขด่าน */
function typingStage(n){
  const lv = Math.min(6, 1 + Math.floor((n - 1) / TY_STAGES_PER_LV));
  const targetLen = Math.min(38, 3 + Math.floor(n * 0.16));
  const minLen = Math.max(2, targetLen - 3);
  const rnd = mulberry32(n * 7919 + 13);
  const bank = typingBank()[lv] || [];
  let zh = '', py = '', th = '';

  const byLen = bank.slice().sort(function(a, b){ return a.zh.length - b.zh.length; });
  const inRange = byLen.filter(function(s){ return s.zh.length >= minLen && s.zh.length <= targetLen + 3; });
  if(inRange.length){
    /* ด่านแรก ๆ เลือกประโยคสั้นที่สุดเสมอ (เช่น "你好") */
    const pool = n <= 3 ? inRange.slice(0, Math.min(4, inRange.length)) : inRange;
    const s = pool[Math.floor(rnd() * pool.length)];
    zh = s.zh; py = s.py; th = s.th;
  } else {
    /* ไม่มีประโยคยาวพอในระดับนี้ → ต่อประโยคสั้นจนครบความยาว */
    const shorts = shuffleSeeded(byLen.filter(function(s){ return s.zh.length >= 2 && s.zh.length < minLen; }), rnd);
    const parts = [];
    let len = 0;
    for(const s of shorts){
      if(len >= minLen) break;
      if(len + s.zh.length > targetLen + 6) continue;
      parts.push(s);
      len += s.zh.length;
    }
    if(len >= minLen - 1){
      zh = parts.map(function(s){ return s.zh; }).join('。');
      py = parts.map(function(s){ return s.py; }).join('  ');
      th = parts.map(function(s){ return s.th; }).join(' · ');
    }
  }
  /* fallback: ต่อด้วยคำศัพท์ตามระดับ จนครบความยาวเป้าหมาย */
  if(zh.length < minLen){
    const parts = [];
    let len = 0;
    for(let curLv = lv; curLv >= 1 && len < targetLen; curLv--){
      const words = (DB.hsk[curLv]||[]).filter(function(w){ return w && w.cn && w.py && w.th && w.cn.length >= 1 && w.cn.length <= 6; });
      const pool = shuffleSeeded(words, mulberry32(n * 31 + curLv));
      for(const w of pool){
        if(len > 0 && len + w.cn.length > targetLen + 3) continue;
        parts.push(w);
        len += w.cn.length;
        if(len >= targetLen) break;
      }
    }
    zh = parts.map(function(w){ return w.cn; }).join('');
    py = parts.map(function(w){ return w.py; }).join(' ');
    th = parts.map(function(w){ return w.th; }).join(' · ');
  }
  /* กันยาวเกิน: ตัดที่ขอบเขต */
  const finalChars = Array.from(zh);
  const trimmed = finalChars.slice(0, targetLen + 8).join('');
  return {
    n: n, lv: lv,
    sentence: trimmed,
    py: py,
    th: th,
    chars: Array.from(trimmed)
  };
}
/* ตัวลวงบนแป้น: ตัวอักษรในประโยค + ตัวอักษรอื่นจากระดับใกล้เคียง */
function typingKeys(stage, rnd){
  const need = new Set(stage.chars);
  const extra = [];
  for(let lv2 = Math.max(1, stage.lv - 1); lv2 <= Math.min(6, stage.lv + 1); lv2++){
    (DB.hsk[lv2]||[]).forEach(function(w){
      if(w && w.cn) Array.from(w.cn).forEach(function(ch){
        if(!need.has(ch) && extra.length < 12) extra.push(ch);
      });
    });
  }
  const uniq = Array.from(new Set(extra)).slice(0, 5);
  return shuffleSeeded(Array.from(need).concat(uniq), rnd);
}

/* --------------------------------------------------------------------------
   เริ่มเกม
-------------------------------------------------------------------------- */
function renderTypingTerminal(lv){
  const box = $('#gamePlayView'); if(!box) return;
  const u = currentUser();
  const L = typingStageOfLv(lv);
  startTypingStage(L.stage);
  renderTypingUI(u);
}
function startTypingStage(n){
  const stage = typingStage(n);
  TY = {
    stage: stage,
    idx: 0,
    typed: new Array(stage.chars.length).fill(null),
    mistakes: 0,
    t0: Date.now(),
    elapsed: 0,
    finished: false,
    keys: typingKeys(stage, mulberry32(n * 17 + 5)),
    lv: stage.lv
  };
  if(TY_TIMER){ clearInterval(TY_TIMER); TY_TIMER = null; }
  TY_TIMER = setInterval(function(){
    if(!TY || TY.finished) return;
    TY.elapsed = (Date.now() - TY.t0) / 1000;
    const t = $('#tyTime');
    if(t) t.textContent = tyTimeStr(TY.elapsed);
  }, 200);
}
function tyTimeStr(s){
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return (m > 0 ? m + ':' : '') + String(sec).padStart(2, '0');
}

/* --------------------------------------------------------------------------
   UI เทอร์มินัล
-------------------------------------------------------------------------- */
function renderTypingUI(u){
  const box = $('#gamePlayView'); if(!box || !TY) return;
  const st = TY.stage;
  const done = (u && u.typing && u.typing.stage) || 0;
  const themeDef = tyThemeDef(tyTheme()) || {};
  box.innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('games')">เกมภาษา</a> <span class="sep">›</span>
      <span>พิมพ์อักษรจีน · HanZi Typer</span></div>

    <div class="ty-shell" id="tyShell" data-theme="${tyTheme()}">
      ${themeDef.pet?`<div class="ty-pet pet-${themeDef.pet}">${tyPetSVG(themeDef.pet)}</div>`:''}
      <div class="ty-scanlines"></div>
      <div class="ty-screen">
        <div class="ty-boot">
          <p class="l1">&gt; BOOT HANZI-TERMINAL v2.0 [OK]</p>
          <p class="l2">&gt; LOADING 字库 DATABASE ......... ${done + 1}/200 STAGES [OK]</p>
          <p class="l3">&gt; MISSION: TYPE THE SENTENCE. CLOCK IS TICKING.</p>
        </div>

        <div class="ty-status">
          <span>STAGE <b id="tyStage">${String(st.n).padStart(3,'0')}</b>/200</span>
          <span>LEVEL ${st.lv} · ${tyLevelName(st.lv)}</span>
          <span class="ty-clock" id="tyTime">${tyTimeStr(0)}</span>
          <span>ERR <b id="tyErr">0</b></span>
        </div>
        <div class="ty-bar"><i id="tyBar" style="width:0%"></i></div>

        <div class="ty-sentence" id="tySentence">${renderTypedChars()}</div>
        <div class="ty-hints">
          <span class="py" style="font-family:var(--ff-py)">${esc(st.py)}</span>
          <span class="th">${esc(st.th)}</span>
        </div>

        <div class="ty-prompt">
          <span class="prompt">&gt;</span>
          <input id="tyInput" class="ty-input" autocomplete="off" autocapitalize="off" spellcheck="false"
            placeholder="พิมพ์อักษรจีนด้วยคีย์บอร์ดของคุณ…" oninput="tyInputEvent(this)" onkeydown="tyKeyEvent(event)">
          <span class="ty-caret"></span>
        </div>

        <div class="ty-keys" id="tyKeys">${renderTypedKeys()}</div>

        <div class="ty-foot">
          <span id="tyMsg">&gt; ${st.n <= 3 ? 'TIP: แตะตัวอักษรบนแป้น หรือพิมพ์ด้วยคีย์บอร์ดจีน' : 'TIP: พิมพ์ให้ครบก่อนเวลา — ช้ายิ่งนาน คะแนนยิ่งน้อย'}</span>
          <span class="ty-foot-acts">
            <button class="ty-btn" onclick="renderTypingThemePicker ? renderTypingThemePicker() : renderTypingMap()">THEME</button>
            <button class="ty-btn" onclick="renderTypingMap()">MAP</button>
            <button class="ty-btn" onclick="restartTyping()">RESET</button>
            <button class="ty-btn" onclick="go('games')">EXIT</button>
          </span>
        </div>
      </div>
    </div>`;
  const inp = $('#tyInput');
  if(inp) setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 80);
}
function tyLevelName(lv){ return ['ปฐมบท','พื้นฐาน','ก้าวหน้า','ประยุกต์','ชั้นสูง','เชี่ยวชาญ'][lv-1] || ''; }
function renderTypedChars(){
  const st = TY.stage;
  return st.chars.map(function(c, i){
    if(TY.typed[i]) return '<span class="ty-char done">' + esc(c) + '</span>';
    if(i === TY.idx) return '<span class="ty-char cur">' + esc(c) + '</span>';
    return '<span class="ty-char todo">' + esc(c) + '</span>';
  }).join('');
}
function renderTypedKeys(){
  return TY.keys.map(function(c, i){
    return '<button class="ty-key" onclick="tyClickKey(' + i + ')">' + esc(c) + '</button>';
  }).join('');
}

/* --------------------------------------------------------------------------
   อินพุต
-------------------------------------------------------------------------- */
function tyInputEvent(inp){
  const v = inp.value || '';
  if(!v) return;
  const ch = Array.from(v)[v.length - 1];
  inp.value = '';
  if(/^[\u4e00-\u9fff]$/.test(ch)) tyHandleChar(ch);
}
function tyKeyEvent(e){
  if(e.key && /^[\u4e00-\u9fff]$/.test(e.key)){
    e.preventDefault();
    tyHandleChar(e.key);
  }
}
function tyClickKey(i){
  tyHandleChar(TY.keys[i]);
}
function tyHandleChar(ch){
  if(!TY || TY.finished) return;
  const expect = TY.stage.chars[TY.idx];
  const msg = $('#tyMsg');
  if(ch === expect){
    TY.typed[TY.idx] = ch;
    TY.idx++;
    if(msg) msg.innerHTML = '&gt; OK [' + ch + ']';
    if(TY.idx >= TY.stage.chars.length){
      tyFinishStage();
      return;
    }
    renderTypedLive();
  } else {
    TY.mistakes++;
    if(msg) msg.innerHTML = '&gt; WRONG [' + ch + '] — EXPECT [' + expect + ']';
    const err = $('#tyErr'); if(err) err.textContent = TY.mistakes;
    const shell = $('#tyShell');
    if(shell){ shell.classList.remove('shake'); void shell.offsetWidth; shell.classList.add('shake'); }
  }
}
function renderTypedLive(){
  const box = $('#tySentence'); if(box) box.innerHTML = renderTypedChars();
  const bar = $('#tyBar'); if(bar) bar.style.width = Math.round(TY.idx / TY.stage.chars.length * 100) + '%';
  const inp = $('#tyInput'); if(inp) inp.focus();
}

/* --------------------------------------------------------------------------
   จบด่าน — คะแนนตามเวลา (ช้า = คะแนนน้อย)
-------------------------------------------------------------------------- */
function tyFinishStage(){
  TY.finished = true;
  if(TY_TIMER){ clearInterval(TY_TIMER); TY_TIMER = null; }
  const chars = TY.stage.chars.length;
  const limit = 12 + chars * 2.0;                 /* เวลาเป้าหมาย */
  let score = chars * 10;
  if(TY.elapsed <= limit) score += Math.round((limit - TY.elapsed) * 2);
  else score -= Math.round((TY.elapsed - limit) * 2);
  score -= TY.mistakes * 5;
  score = Math.max(5, score);
  const maxScore = chars * 10 + Math.round(limit * 2);
  const stars = score >= maxScore * .85 ? 3 : score >= maxScore * .55 ? 2 : 1;
  TY.score = score; TY.stars = stars;

  /* บันทึกความคืบหน้า */
  const u = currentUser();
  if(u){
    u.typing = u.typing || {stage: 0, best: {}};
    u.typing.stage = Math.max(u.typing.stage || 0, TY.stage.n);
    u.typing.best[TY.stage.n] = Math.max(u.typing.best[TY.stage.n] || 0, score);
    u.typingStars = u.typingStars || {};
    u.typingStars[TY.lv] = Math.max(u.typingStars[TY.lv] || 0, stars);
    saveUsers();
    award(u, score, score, 'game', 'พิมพ์อักษรจีน ด่าน ' + TY.stage.n + ' — ' + score + ' คะแนน');
  }

  renderTypingResultScreen();
}
function renderTypingResultScreen(){
  const box = $('#gamePlayView');
  if(!box || !TY) return;
  const stars = TY.stars, chars = TY.stage.chars.length, limit = 12 + chars * 2.0;
  const next = TY.stage.n + 1;
  box.innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('games')">เกมภาษา</a> <span class="sep">›</span>
      <span>พิมพ์อักษรจีน</span></div>
    <div class="ty-shell" data-theme="${tyTheme()}">${tyThemeDef(tyTheme())&&tyThemeDef(tyTheme()).pet?`<div class="ty-pet pet-${tyThemeDef(tyTheme()).pet}">${tyPetSVG(tyThemeDef(tyTheme()).pet)}</div>`:''}<div class="ty-scanlines"></div>
      <div class="ty-screen" style="text-align:center">
        <p class="ty-clear">▓▓ STAGE ${String(TY.stage.n).padStart(3,'0')} CLEAR ▓▓</p>
        <div class="ty-sentence" style="justify-content:center">${renderTypedChars()}</div>
        <div class="ty-result-grid">
          <div><b>${TY.score}</b><span>SCORE</span></div>
          <div><b>${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</b><span>RATING</span></div>
          <div><b>${tyTimeStr(TY.elapsed)}</b><span>TIME</span></div>
          <div><b>${TY.mistakes}</b><span>ERRORS</span></div>
        </div>
        <p class="ty-note">เวลาช้า = คะแนนน้อย · ความเร็ว <b>${Math.round(chars/Math.max(1,TY.elapsed)*60)}</b> ตัว/นาที${TY.elapsed>limit? ' · เกินเวลาเป้าหมาย +' + Math.round(TY.elapsed-limit) + 's':''}</p>
        <div class="ty-result-acts">
          ${next <= TY_TOTAL_STAGES ? `<button class="ty-btn big" onclick="startTypingStage(${next});renderTypingUI()">NEXT STAGE ${String(next).padStart(3,'0')} →</button>` : '<span class="ty-note">จบครบ 200 ด่านแล้ว — เก่งมาก!</span>'}
          <button class="ty-btn" onclick="renderTypingMap()">STAGE MAP</button>
          <button class="ty-btn" onclick="restartTyping()">RETRY</button>
          <button class="ty-btn" onclick="renderTyThemePicker()">THEME</button>
          <button class="ty-btn" onclick="go('games')">EXIT</button>
        </div>
      </div>
    </div>`;
}
function restartTyping(){
  const n = TY ? TY.stage.n : 1;
  startTypingStage(n);
  renderTypingUI();
}

/* --------------------------------------------------------------------------
   แผนที่ด่าน 200 ด่าน
-------------------------------------------------------------------------- */
function renderTypingMap(){
  const u = currentUser();
  const done = (u && u.typing && u.typing.stage) || 0;
  const cells = [];
  for(let n = 1; n <= TY_TOTAL_STAGES; n++){
    const state = n <= done ? 'done' : n === done + 1 ? 'cur' : 'locked';
    const best = (u && u.typing && u.typing.best && u.typing.best[n]) || 0;
    cells.push(`<button class="ty-map-cell ${state}" ${state!=='locked'?`onclick="closeGlassPop();startTypingStage(${n});renderTypingUI()"`:''}>
      ${String(n).padStart(3,'0')}${best?`<i>${best}</i>`:''}</button>`);
  }
  glassPop({
    icon: 'terminal',
    title: 'STAGE MAP — พิมพ์อักษรจีน (200 ด่าน)',
    body: `
      <div class="ty-map-wrap" data-theme="${tyTheme()}">
        <p class="ty-map-head">ผ่านแล้ว <b>${done}</b>/200 ด่าน — <span class="ty-leg done">ผ่าน</span> <span class="ty-leg cur">ด่านปัจจุบัน</span> <span class="ty-leg locked">ล็อก</span>
          <button class="ty-btn" style="float:right;margin-top:-2px" onclick="event.stopPropagation();closeGlassPop();renderTyThemePicker()">THEME</button></p>
        <div class="ty-map-grid">${cells.join('')}</div>
      </div>`,
    actions: [{label:'ปิด', cls:'btn-ghost', fn: closeGlassPop}]
  });
}
