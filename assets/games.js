/* ==========================================================================
   为什么中文 · Games — level-based, 6 games × 6 levels
   ========================================================================== */
'use strict';

const GAME_DEFS = [
  {id:'fill',    ic:'pencil',  cn:'填', name:'เติมคำในช่องว่าง', sub:'Fill in the blank',
   desc:'เลือกคำที่หายไปให้ประโยคสมบูรณ์ ฝึกไวยากรณ์และคำเชื่อมที่ใช้บ่อย'},
  {id:'vocab',   ic:'layers',  cn:'詞', name:'จับคู่คำศัพท์', sub:'Vocabulary match',
   desc:'เห็นคำจีนแล้วเลือกความหมายไทยให้ถูกต้อง ฝึกความจำคำศัพท์โดยตรง'},
  {id:'pinyin',  ic:'type',    cn:'音', name:'คำนี้อ่านว่าอะไร', sub:'Pinyin reading',
   desc:'เลือกพินอินที่ถูกต้องของคำนั้น ฝึกแยกเสียงที่ใกล้เคียงกัน'},
  {id:'tone',    ic:'music',   cn:'調', name:'วรรณยุกต์จีน', sub:'Tones',
   desc:'ฟังและดูว่าพยางค์ที่ขีดเส้นใต้นั้นเป็นเสียงที่เท่าไร ฝึกหูแยกเสียง'},
  {id:'order',   ic:'shuffle', cn:'句', name:'เรียงประโยค', sub:'Sentence order',
   desc:'ลากเรียงคำให้เป็นประโยคที่ถูกต้องตามไวยากรณ์จีน ฝึกโครงสร้างประโยค'},
  {id:'reading', ic:'book-open', cn:'讀', name:'อ่านจับใจความ', sub:'Reading',
   desc:'อ่านเรื่องสั้นแล้วตอบคำถามว่าเนื้อเรื่องพูดถึงอะไร ฝึกอ่านเร็ว'},
  {id:'typing',  ic:'terminal', cn:'碼', name:'พิมพ์อักษรจีน', sub:'HanZi Typer',
   desc:'เทอร์มินัลยุคเก่า — พิมพ์/เลือกตัวอักษรจีนตามประโยค 200 ด่าน จากง่ายไปยาก พร้อมจับเวลา'}
];
/* ไอคอนของเกม: เกมในตัวใช้ชื่อไอคอน SVG · หมวดที่สร้างเองใช้ได้ทั้งอีโมจิ/อักษร */
function gIcon(def){
  return def && def.custom ? esc(def.ic || 'gamepad') : ICON((def&&def.ic) || 'gamepad');
}
const GAME_TILE_VARIANTS = {fill:'red', vocab:'gold', pinyin:'brown', tone:'red', order:'brown', reading:'gold', typing:'jade'};
function gTile(def){
  if(def && def.custom) return esc(def.ic || 'gamepad');
  return TILE((def&&def.ic) || 'gamepad', GAME_TILE_VARIANTS[def&&def.id] || 'gold');
}
const LEVEL_NAMES = ['ปฐมบท','พื้นฐาน','ก้าวหน้า','ประยุกต์','ชั้นสูง','เชี่ยวชาญ'];
const LEVEL_HSK   = [1,2,3,4,5,6];
const PASS_PCT = 70;

/* --------------------------------------------------------------------------
   CUSTOM GAME CATEGORIES + UNLIMITED LEVELS  (admin-editable)
   DB.gameCats = [ {id, name, icon, cn, desc, type: 'fill'|..., levels:[{name}], questions:[] } ]
-------------------------------------------------------------------------- */
function customCats(){ return Array.isArray(DB.gameCats) ? DB.gameCats : []; }
function gameDef(gameId){
  const builtin = GAME_DEFS.find(d=>d.id===gameId);
  if(builtin) return builtin;
  const cat = customCats().find(c=>c.id===gameId);
  if(!cat) return GAME_DEFS[0];
  return {
    id: cat.id, ic: cat.icon||'🎮', cn: (cat.cn||'遊'), name: cat.name,
    sub: cat.desc||'หมวดหมู่ที่สร้างเอง', desc: cat.desc||'',
    custom: true, type: cat.type||'vocab'
  };
}
function gameLevelNames(gameId){
  const def = gameDef(gameId);
  if(!def.custom) return LEVEL_NAMES;
  const cat = customCats().find(c=>c.id===gameId);
  return (cat && cat.levels && cat.levels.length) ? cat.levels.map(l=>l.name) : ['ด่าน 1'];
}
function gameMaxLv(gameId){
  const def = gameDef(gameId);
  if(!def.custom) return 6;
  const cat = customCats().find(c=>c.id===gameId);
  return (cat && cat.levels && cat.levels.length) ? cat.levels.length : 1;
}
function gameType(gameId){
  const def = gameDef(gameId);
  return def.custom ? (def.type||'vocab') : gameId;
}

function gameBanks(){
  const out = {};
  const live = DB.games || {};
  GAME_DEFS.forEach(d => {
    const arr = live[d.id] || (D.games || {})[d.id] || [];
    out[d.id] = Array.isArray(arr) ? arr : [];
  });
  customCats().forEach(c => {
    out[c.id] = Array.isArray(c.questions) ? c.questions : [];
  });
  return out;
}
/* which levels of a game hold at least one question */
function activeLevels(gameId){
  const bank = gameBanks()[gameId] || [];
  const max = gameMaxLv(gameId);
  const lv = [];
  for(let i=1;i<=max;i++) if(bank.some(q => (q.lv||1) === i)) lv.push(i);
  return lv.length ? lv : [1];
}
function gameCfg(){
  const g = (DB.settings && DB.settings.game) || {};
  return {
    perLevel: Math.max(4, Math.min(30, +g.perLevel || 10)),
    passPct:  Math.max(30, Math.min(100, +g.passPct || 70)),
    star3Pct: Math.max(50, Math.min(100, +g.star3Pct || 90)),
    hp:       Math.max(1, Math.min(20, +g.hp || 5)),
    regen:    Math.max(1, Math.min(180, +g.hpRegenMin || 12))
  };
}
function levelKey(gameId, lv){ return gameId+':'+lv; }
function starsFor(u, gameId, lv){
  if(gameId === 'typing') return u ? ((u.typingStars||{})[lv]||0) : 0;
  return u ? ((u.gameStars||{})[levelKey(gameId,lv)]||0) : 0;
}
function isLevelUnlocked(u, gameId, lv){
  if(lv === 1) return true;
  if(!u) return false;
  if(gameId === 'typing'){
    const done = (u.typing && u.typing.stage) || 0;
    return done >= (lv - 1) * 33;
  }
  return starsFor(u, gameId, lv-1) >= 1 || ((u.gameStars||{})[levelKey(gameId,lv)]||0) >= 1;
}
function questionsFor(gameId, lv){
  const bank = gameBanks()[gameId] || [];
  /* the difficulty of a level must stay honest: never pull in much harder items */
  const same = bank.filter(q => (q.lv||1) === lv);
  const near = bank.filter(q => Math.abs((q.lv||1) - lv) === 1);
  const far  = bank.filter(q => Math.abs((q.lv||1) - lv) >= 2);
  return shuffle(same).concat(shuffle(near)).concat(shuffle(far)).slice(0, gameCfg().perLevel);
}

/* ==========================================================================
   GAMES HUB
   ========================================================================== */
function renderGamesHub(){
  const u = currentUser();
  const banks = gameBanks();
  const cats = customCats();
  let totalStars = 0, maxStars = GAME_DEFS.length*6*3;
  GAME_DEFS.forEach(d => { for(let i=1;i<=6;i++) totalStars += starsFor(u,d.id,i); });
  cats.forEach(c => {
    const m = (c.levels||[]).length || 1;
    maxStars += m*3;
    for(let i=1;i<=m;i++) totalStars += starsFor(u,c.id,i);
  });

  const box = $('#gamesProgressBox');
  if(box){
    box.innerHTML = `
      <div class="continue-card reveal" style="margin-bottom:28px">
        <div class="ic">${u?u.avatar:'🎮'}</div>
        <div class="txt">
          <b>${u? `${esc(u.name)} · เก็บดาวได้ ${totalStars} / ${maxStars} ดวง` : 'เข้าสู่ระบบเพื่อเก็บดาวและปลดล็อกด่าน'}</b>
          <span>${u? `หัวใจเหลือ ${u.hp}/${MAX_HP} ดวง · ระดับผู้เล่น Lv ${levelOf(u.xp)} ${levelTitle(levelOf(u.xp))}`
                : 'ผู้เล่นที่เข้าสู่ระบบจะเล่นได้ทุกด่าน เก็บดาว และไต่ระดับจากด่านง่ายไปด่านยากได้ต่อเนื่อง'}</span>
        </div>
        ${u? '<button class="btn btn-ghost btn-sm" onclick="go(\'profile\')">ดูความก้าวหน้า</button>'
           : '<button class="btn btn-primary btn-sm" onclick="go(\'login\')">สมัคร / เข้าสู่ระบบ</button>'}
      </div>`;
  }

  const typeName = {fill:'เติมคำ', vocab:'จับคู่คำศัพท์', pinyin:'คำนี้อ่านว่าอะไร', tone:'วรรณยุกต์', order:'เรียงประโยค', reading:'อ่านจับใจความ'};
  renderGamesChart();

  $('#gameHubs').innerHTML = GAME_DEFS.filter(function(d){
    /* แอดมินปิดเกม → ผู้ใช้ทั่วไปไม่เห็น (แอดมินเห็นครบ) */
    const gc = (DB.itemCfg && DB.itemCfg.games && DB.itemCfg.games[d.id]) || {};
    if(gc.on === false && !adminIn) return false;
    return true;
  }).map(d=>{
    const n = (banks[d.id]||[]).length;
    let st = 0; for(let i=1;i<=6;i++) st += starsFor(u,d.id,i);
    const isTy = d.id === 'typing';
    const gc2 = (DB.itemCfg && DB.itemCfg.games && DB.itemCfg.games[d.id]) || {};
    const lockTag = (gc2.premium && !isPremium(u) && !adminIn) ? '<span class="tag-pill gold">' + ICON('crown') + ' พรีเมียม</span>' : '';
    return `<div class="hub reveal" onclick="go('gamelevels','${d.id}')">
      <div class="hub-top">
        <div class="cn-big">${d.cn}</div>
        <div class="ic">${gTile(d)}</div>
        <h3>${d.name}</h3>
        <div class="sub">${d.sub} · ${isTy ? '200 ด่าน' : n + ' ข้อ'}</div>
      </div>
      <div class="hub-body">
        <p>${d.desc}</p>
        <div class="hub-tags"><span class="tag-pill red">${isTy?'200 ด่าน':'6 ด่าน'}</span><span class="tag-pill gold">${st}/${isTy?18:18} ดาว</span>${lockTag}</div>
        <div class="hub-foot"><span class="go">${isTy?'เล่นเลย →':'เลือกด่าน →'}</span></div>
      </div>
    </div>`;
  }).join('') + cats.map(c=>{
    const n = (banks[c.id]||[]).length;
    const m = (c.levels||[]).length || 1;
    let st = 0; for(let i=1;i<=m;i++) st += starsFor(u,c.id,i);
    return `<div class="hub reveal" onclick="go('gamelevels','${esc(c.id)}')">
      <div class="hub-top">
        <div class="cn-big">${esc(c.cn||'玩')}</div>
        <div class="ic">${esc(c.icon||'🎮')}</div>
        <h3>${esc(c.name)}</h3>
        <div class="sub">${esc(typeName[c.type]||'')} · ${n} ข้อ</div>
      </div>
      <div class="hub-body">
        <p>${esc(c.desc||'')}</p>
        <div class="hub-tags"><span class="tag-pill red">${m} ด่าน</span><span class="tag-pill gold">${st}/${m*3} ดาว</span><span class="tag-pill jade">สร้างเอง</span></div>
        <div class="hub-foot"><span class="go">เลือกด่าน →</span></div>
      </div>
    </div>`;
  }).join('');
}

/* ==========================================================================
   LEVEL SELECT
   ========================================================================== */
function renderGameLevels(gameId){
  const def = gameDef(gameId);
  const u = currentUser();
  if(def.id === 'typing'){
    /* เกตฟีเจอร์พิมพ์อักษรจีน (แอดมินเปิด/ปิด + พรีเมียม) */
    if(!adminIn && typeof featureGate === 'function'){
      const st = featureGate('typing');
      if(st !== 'ok'){
        $('#gameLevelsView').innerHTML = featureGateHTML('typing');
        return;
      }
    }
    renderTypingLevels(def, u); return;
  }
  const banks = gameBanks();
  const bank = banks[def.id] || [];
  if(!bank.length){
    $('#gameLevelsView').innerHTML = `<div class="empty"><span class="ic">🚧</span>คลังคำถามของเกมนี้ยังว่างอยู่</div>`;
    return;
  }
  const lvls = activeLevels(def.id);
  const maxLv = gameMaxLv(def.id);
  const names = gameLevelNames(def.id);
  let total = 0; for(let i=1;i<=maxLv;i++) total += starsFor(u,def.id,i);

  $('#gameLevelsView').innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('games')">เกมภาษา</a> <span class="sep">›</span> <span>${esc(def.name)}</span></div>

    <div class="page-hero" style="padding:8px 0 24px">
      <div class="cn-watermark">${esc(def.cn)}</div>
      <h1 class="cn-title">${gIcon(def)} ${esc(def.name)}</h1>
      <p class="sub">${esc(def.desc)}</p>
      <div class="pill-row" style="margin-top:14px">
        <span class="tag-pill red">${bank.length} คำถามในคลัง</span>
        <span class="tag-pill gold">เก็บได้ ${total}/${maxLv*3} ดาว</span>
        ${def.custom ? '<span class="tag-pill jade">หมวดหมู่ที่สร้างเอง · ' + maxLv + ' ด่าน</span>' : '<span class="tag-pill">HSK 1–6</span>'}
      </div>
    </div>

    <div class="panel">
      <h3>วิธีเล่น</h3>
      <p style="font-size:14.5px;color:var(--text-2)">
        ${def.custom
          ? `หมวดนี้มี <b>${maxLv} ด่าน</b> ตามที่ตั้งไว้ — ผ่านด่านที่ 70% จะได้ดาวและปลดล็อกด่านถัดไป`
          : 'แต่ละด่านมี 10 ข้อ ระดับความยากไต่จาก <b>ด่าน 1 (HSK 1)</b> ไปจนถึง <b>ด่าน 6 (HSK 6)</b> ตอบถูกตั้งแต่ 70% จะได้ดาวและปลดล็อกด่านถัดไป — ดาว 3 ดวงคือตอบถูก 90% ขึ้นไป'}
      </p>
    </div>

    <div class="level-map" style="margin-top:24px">
      ${Array.from({length:maxLv}, (_,k)=>k+1).map(lv=>{
        const hasQ = lvls.includes(lv);
        const lvName = names[lv-1] || ('ด่าน ' + lv);
        if(!hasQ) return `<div class="level-card locked reveal">
            <div class="hsk-chip">${def.custom? ('LEVEL '+lv) : 'HSK '+LEVEL_HSK[lv-1]}</div>
            <div class="no">LEVEL ${lv}</div>
            <h4>${esc(lvName)}</h4>
            <p>ยังไม่มีคำถามในด่านนี้ — เพิ่มได้ที่หลังบ้าน</p>
            <div class="stars">${starsStr(0)}</div>
            <div class="lock-badge">🚧</div>
          </div>`;
        const unlocked = isLevelUnlocked(u, def.id, lv);
        const st = starsFor(u, def.id, lv);
        const best = u ? ((u.gameBest||{})[levelKey(def.id,lv)]||0) : 0;
        const count = bank.filter(q=>(q.lv||1)===lv).length;
        return `<div class="level-card ${unlocked?'':'locked'} reveal" ${unlocked?`onclick="go('gameplay','${def.id}:${lv}')"`:''}>
          <div class="hsk-chip">${def.custom? ('LEVEL '+lv) : 'HSK '+LEVEL_HSK[lv-1]}</div>
          <div class="no">LEVEL ${lv}</div>
          <h4>${esc(lvName)}</h4>
          <p>${unlocked? `มี ${count} คำถามในด่านนี้${best?` · สถิติสูงสุด ${best}%`:''}` : 'ผ่านด่านก่อนหน้าเพื่อปลดล็อก'}</p>
          <div class="stars">${starsStr(st)}</div>
          ${unlocked?'':'<div class="lock-badge">🔒</div>'}
        </div>`;
      }).join('')}
    </div>`;
  observeReveals();
}

/* ==========================================================================
   GAMEPLAY
   ========================================================================== */
let G = null;   /* active game session */

function gameItemCfg(id){
  const c = (DB.itemCfg && DB.itemCfg.games && DB.itemCfg.games[id]) || {};
  return {on: c.on !== false, premium: !!c.premium};
}
function renderGamePlay(param){
  const parts = String(param||'fill:1').split(':');
  const gameId = parts[0];
  const lvStr = parts[1];
  const def = gameDef(gameId);
  const lv = Math.max(1, Math.min(gameMaxLv(gameId), +lvStr||1));
  const u = currentUser();
  /* เกตฟีเจอร์พิมพ์อักษรจีน */
  if(gameId === 'typing' && !adminIn && typeof featureGate === 'function'){
    const ts = featureGate('typing');
    if(ts !== 'ok'){
      $('#gamePlayView').innerHTML = featureGateHTML('typing');
      return;
    }
  }
  /* เกตต่อเกม: ปิด/พรีเมียม */
  if(gameId !== 'typing'){
    const gc = gameItemCfg(gameId);
    if(!gc.on && !adminIn){
      $('#gamePlayView').innerHTML = '<div class="empty"><span class="ic">' + ICON('lock') + '</span>เกมนี้ถูกปิดใช้งานชั่วคราวโดยผู้ดูแลเว็บ</div>';
      return;
    }
    if(gc.premium && !isPremium(u) && !adminIn){
      $('#gamePlayView').innerHTML = '<div class="empty"><span class="ic">' + ICON('crown') + '</span>เกมนี้สำหรับสมาชิกพรีเมียม<br><br><button class="btn btn-gold btn-sm" onclick="go(&quot;premium&quot;)">ดูแพ็กเกจพรีเมียม</button></div>';
      return;
    }
  }

  if(!isLevelUnlocked(u, def.id, lv)){
    $('#gamePlayView').innerHTML = `<div class="empty"><span class="ic">🔒</span>ด่านนี้ยังล็อกอยู่ — ผ่านด่าน ${lv-1} ก่อนนะ<br><br>
      <button class="btn btn-ghost btn-sm" onclick="go('gamelevels','${def.id}')">← กลับไปเลือกด่าน</button></div>`;
    return;
  }

  if(gameId === 'typing'){
    renderTypingTerminal(lv);
    return;
  }

  const qs = questionsFor(def.id, lv);
  if(!qs.length){
    $('#gamePlayView').innerHTML = `<div class="empty"><span class="ic">🚧</span>ด่านนี้ยังไม่มีคำถาม</div>`;
    return;
  }

  G = {gameId:def.id, type:gameType(def.id), lv, def, qs, idx:0, score:0, wrong:0, answered:false, orderPick:[], errors:[]};
  renderGameHeader();
  renderQuestion();
}
function renderTypingLevels(def, u){
  const done = (u && u.typing && u.typing.stage) || 0;
  const curLv = Math.min(6, 1 + Math.floor(Math.max(0, done) / 33));
  let total = 0; for(let i=1;i<=6;i++) total += starsFor(u, 'typing', i);
  const lvNames = ['ปฐมบท','พื้นฐาน','ก้าวหน้า','ประยุกต์','ชั้นสูง','เชี่ยวชาญ'];
  $('#gameLevelsView').innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('games')">เกมภาษา</a> <span class="sep">›</span> <span>${esc(def.name)}</span></div>

    <div class="page-hero" style="padding:8px 0 24px">
      <div class="cn-watermark">${esc(def.cn)}</div>
      <h1 class="cn-title">${gIcon(def)} ${esc(def.name)}</h1>
      <p class="sub">${esc(def.desc)}</p>
      <div class="pill-row" style="margin-top:14px">
        <span class="tag-pill red">200 ด่าน · เรียงจากง่ายไปยาก</span>
        <span class="tag-pill gold">เก็บได้ ${total}/18 ดาว</span>
        <span class="tag-pill jade">ผ่านแล้ว ${done}/200 ด่าน</span>
      </div>
      <button class="btn btn-gold" style="margin-top:18px" onclick="go('gameplay','typing:${curLv}')">${ICON('play')} ${done>0? 'เล่นต่อ ด่าน ' + (done+1) : 'เริ่มเล่นเลย'}</button>
    </div>

    <div class="panel">
      <h3>วิธีเล่น</h3>
      <p style="font-size:14.5px;color:var(--text-2)">
        เทอร์มินัลย้อนยุค — แต่ละด่านมี<b>ประโยคภาษาจีน</b>ให้พิมพ์ให้ครบ (คีย์บอร์ดจีน หรือแตะแป้นบนจอ)
        ระดับความยากไต่จาก <b>ประโยค 3 ตัวอักษร</b> (ด่าน 1) ไปจนถึง <b>ประโยคยาว 30+ ตัวอักษร</b> (ด่าน 200) ·
        <b style="color:var(--red)">จับเวลา</b> — ยิ่งช้ายิ่งได้คะแนนน้อย · ผ่านด่านจึงปลดล็อกด่านถัดไป
      </p>
    </div>

    <div class="panel" style="margin-top:18px">
      <h3>${ICON('terminal')} เลือกธีมเทอร์มินัล (ก่อนเริ่มเกม)</h3>
      <p style="font-size:12.5px;color:var(--text-3);margin:0 0 14px">ธีมที่เลือกจะใช้กับจอเทอร์มินัลทุกด่าน — เปลี่ยนได้ตลอดเวลา</p>
      <p style="font-size:12.5px;color:var(--text-3);margin:0 0 14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${u ? `${coinHTML('sm')} ยอดเหรียญ: <b style="color:var(--gold)">${weiqianOf(u).toLocaleString()} 為錢</b> · ` : ''}
        ธีมมี ${ICON('lock')} คือพรีเมียม — ปลดล็อกด้วยเหรียญเป็นเงิน
      </p>
      <div class="ty-theme-grid">
        ${(typeof tyThemeCardHTML === 'function' ? TY_THEMES : []).map(function(t){
          return tyThemeCardHTML(t);
        }).join('')}
      </div>
    </div>

    <div class="level-map" style="margin-top:24px">
      ${[1,2,3,4,5,6].map(function(lv){
        const first = (lv-1)*33 + 1;
        const last = Math.min(200, lv*33);
        const unlocked = isLevelUnlocked(u, 'typing', lv);
        const st = starsFor(u, 'typing', lv);
        const doneIn = Math.max(0, Math.min(33, done - (lv-1)*33));
        return `<div class="level-card ${unlocked?'':'locked'} reveal" ${unlocked?`onclick="go('gameplay','typing:${lv}')"`:''}>
          <span class="lv-num">${String(first).padStart(3,'0')}–${String(last).padStart(3,'0')}</span>
          <h3>LEVEL ${lv} · ${esc(lvNames[lv-1])}</h3>
          <p>ด่าน ${first}–${last} · ${doneIn}/33 ผ่าน</p>
          <div class="lv-stars">${'★'.repeat(st)}${'☆'.repeat(3-st)}</div>
          <div class="lv-bar"><i style="width:${Math.round(doneIn/33*100)}%"></i></div>
          <span class="go">${unlocked? 'เล่น →' : '🔒 ล็อกอยู่'}</span>
        </div>`;
      }).join('')}
    </div>`;
}
function renderGameHeader(){
  const u = currentUser();
  $('#gamePlayView').innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('games')">เกมภาษา</a> <span class="sep">›</span>
      <a onclick="go('gamelevels','${G.gameId}')">${G.def.name}</a> <span class="sep">›</span>
      <span>ด่าน ${G.lv}</span></div>
    <div style="max-width:760px;margin:0 auto 14px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
      <div style="font-size:13.5px;color:var(--text-2)">
        <b style="color:var(--brown-3);font-family:var(--ff-cn)">${gIcon(G.def)} ${esc(G.def.name)}</b>
        · ด่าน ${G.lv} ${G.def.custom ? '· ' + esc(gameLevelNames(G.gameId)[G.lv-1]||'') : '(HSK ' + LEVEL_HSK[G.lv-1] + ')'}
      </div>
      <div style="display:flex;gap:12px;align-items:center;font-size:13px;color:var(--text-2)">
        ${u?`<span>❤️ ${u.hp}/${gameCfg().hp}</span>`:''}
        <span>⭐ ${G.score} คะแนน</span>
      </div>
    </div>
    <div class="game-box" id="gameBox"></div>`;
  renderQuestion();
}
function renderQuestion(){
  const box = $('#gameBox'); if(!box) return;
  if(G.idx >= G.qs.length) return renderGameResult();

  const q = G.qs[G.idx];
  const total = G.qs.length;
  const pct = (G.idx/total)*100;
  const type = G.type || G.gameId;
  let body = '', sub = '';

  if(type === 'fill'){
    body = `<div class="q-text">${esc(q.q||'').replace(/___/g,'<span class="blank">＿＿</span>')}</div>`;
    if(q.py) sub += `<div class="py">${esc(q.py)}</div>`;
    if(q.th) sub += `<div>${esc(q.th)}</div>`;
  } else if(type === 'vocab'){
    body = `<div class="q-text">${esc(q.q||q.cn||'')}</div>`;
    if(q.py) sub += `<div class="py">${esc(q.py)}</div>`;
    sub += '<div>คำนี้หมายถึงอะไร</div>';
  } else if(type === 'pinyin'){
    body = `<div class="q-text">${esc(q.q||'')}</div>`;
    if(q.th) sub += `<div>${esc(q.th)}</div>`;
    sub += '<div>คำนี้อ่านว่าอะไร</div>';
  } else if(type === 'tone'){
    const t = esc(q.target||'');
    body = `<div class="q-text">${esc(q.q||'').replace(t, `<span class="blank">${t}</span>`)}</div>`;
    sub += `<div>พยางค์ <b style="color:var(--red)">${t}</b> เป็นเสียงวรรณยุกต์ที่เท่าไร</div>`;
    if(q.th) sub += `<div class="py">${esc(q.th)}</div>`;
  } else if(type === 'reading'){
    body = `<div class="q-text" style="font-size:20px;line-height:2.1">${esc(q.zh||'')}</div>`;
    if(q.py) sub += `<div class="py" style="line-height:1.9">${esc(q.py)}</div>`;
    sub += `<div style="margin-top:8px;color:var(--brown-3);font-weight:600">${esc(q.q||'')}</div>`;
  } else if(type === 'order'){
    body = `<div class="q-text" style="font-size:19px">${esc(q.q||'')}</div>`;
    sub += '<div>เรียงคำให้เป็นประโยคภาษาจีนที่ถูกต้อง (คลิกคำตามลำดับ)</div>';
  }

  if(type === 'order'){
    if(!G.orderPool){
      if(Array.isArray(q.w0) && q.w0.length === (q.a||[]).length) G.orderPool = q.w0.slice();
      else G.orderPool = shuffle(q.a||[]);
    }
    const pool = G.orderPool;
    const used = (G.orderUsed = G.orderUsed || []);
    const remaining = pool.map((w,i)=>i).filter(i=>!used.includes(i));
    box.innerHTML = `
      <div class="q-progress"><span>ข้อ ${G.idx+1} / ${total}</span><span>คะแนน ${G.score}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      ${body}
      <div class="q-sub">${sub}</div>
      <div style="min-height:62px;padding:14px;border-radius:13px;border:1.5px dashed var(--line);background:var(--bg);display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:16px" id="orderSlot">
        ${orderChosen().length? orderChosen().map(w=>`<span class="tag-pill red" style="font-family:var(--ff-cn);font-size:17px;padding:7px 14px">${esc(w)}</span>`).join('')
          : '<span style="color:var(--text-3);font-size:13.5px">ประโยคที่เรียงแล้วจะปรากฏที่นี่…</span>'}
      </div>
      <div class="opts" style="grid-template-columns:repeat(auto-fit,minmax(86px,1fr));display:grid">
        ${remaining.map(i=>`<button class="opt" style="justify-content:center;font-family:var(--ff-cn);font-size:19px" onclick="orderPick(${i})">${esc(pool[i])}</button>`).join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">
        <button class="mini-btn ghost" onclick="orderUndo()">↩ ย้อนกลับ</button>
        <button class="mini-btn" onclick="orderCheck()" ${orderChosen().length===q.a.length?'':'disabled style="opacity:.45;cursor:not-allowed"'}>ตรวจคำตอบ</button>
      </div>`;
    return;
  }

  const opts = G.opts || (G.opts = buildOpts(q, type));
  box.innerHTML = `
    <div class="q-progress"><span>ข้อ ${G.idx+1} / ${total}</span><span>คะแนน ${G.score}</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    ${body}
    ${sub?`<div class="q-sub">${sub}</div>`:''}
    <div class="opts" id="opts">
      ${opts.map((o,i)=>`<button class="opt" data-val="${esc(o.value)}" onclick="answerQ(${i},this)">
        <span class="key">${String.fromCharCode(65+i)}</span><span>${esc(o.label)}</span>
      </button>`).join('')}
    </div>`;
}
function buildOpts(q, type){
  let correct, wrongs;
  if(type === 'tone'){
    correct = String(q.a); wrongs = (q.w||[]).map(String);
  } else if(type === 'reading' || type === 'vocab'){
    correct = q.a; wrongs = q.w||[];
  } else {
    correct = q.a; wrongs = q.w||[];
  }
  const all = shuffle([correct, ...wrongs.slice(0,2)]);
  return all.map(v => ({value:v, label:v}));
}
function answerQ(i, btn){
  if(G.answered || btn.disabled) return;
  G.answered = true;
  const q = G.qs[G.idx];
  const chosen = G.opts[i].value;
  let correct = ((G.type||G.gameId) === 'tone') ? String(q.a) : q.a;
  const ok = String(chosen) === String(correct);

  if(ok){ G.score++; btn.classList.add('correct'); }
  else{
    G.wrong++;
    G.errors.push(q);
    btn.classList.add('wrong');
    $$('#opts .opt').forEach(b=>{
      if(String(b.dataset.val) === String(correct)) b.classList.add('correct');
    });
    if(currentUser()) spendHp();
  }
  $$('#opts .opt').forEach(b=>b.disabled = true);

  const ex = explainFor(q, G.type||G.gameId, correct);
  if(ex){
    const div = document.createElement('div');
    div.className = 'answer-explain';
    div.innerHTML = ex;
    $('#gameBox').appendChild(div);
  }
  setTimeout(()=>{ G.idx++; G.answered = false; G.opts = null; G.orderPool = null; G.orderUsed = []; renderQuestion(); }, ok?900:1900);
}
function explainFor(q, type, correct){
  if(type === 'fill') return `คำตอบที่ถูกต้องคือ <b>${esc(String(correct))}</b>${q.th?` — ${esc(q.th)}`:''}`;
  if(type === 'vocab') return `<b>${esc(q.q||q.cn||'')}</b> (${esc(q.py||'')}) แปลว่า <b>${esc(String(correct))}</b>`;
  if(type === 'pinyin') return `<b>${esc(q.q||'')}</b> อ่านว่า <b>${esc(String(correct))}</b>${q.th?` — แปลว่า ${esc(q.th)}`:''}`;
  if(type === 'tone') return `พยางค์ <b>${esc(q.target||'')}</b> เป็นเสียงที่ <b>${esc(String(correct))}</b>${q.th?` (${esc(q.th)})`:''}`;
  if(type === 'reading') return `คำตอบคือ <b>${esc(String(correct))}</b>${q.th?`<br><span style="color:var(--text-3)">เรื่องย่อ: ${esc(q.th)}</span>`:''}`;
  return '';
}
function spendHp(){
  const u = currentUser(); if(!u) return;
  regenHp(u);
  if(u.hp > 0){ u.hp--; if(u.hp === gameCfg().hp - 1) u.hpTs = Date.now(); }
  saveUsers();
}

/* --- sentence ordering --- */
function orderChosen(){ return (G.orderUsed||[]).map(i => (G.orderPool||[])[i]); }
function orderPick(i){
  if(G.answered) return;
  G.orderUsed = G.orderUsed || [];
  if(G.orderUsed.includes(i)) return;
  G.orderUsed.push(i);
  renderQuestion();
}
function orderUndo(){ (G.orderUsed||[]).pop(); renderQuestion(); }
function orderCheck(){
  if(G.answered) return;
  const q = G.qs[G.idx];
  const attempt = orderChosen().join('');
  const target = q.a.join('');
  const ok = attempt === target;
  G.answered = true;
  const slot = $('#orderSlot');
  if(ok){
    G.score++;
    slot.style.borderColor = '#4caf50';
    slot.style.background = 'rgba(76,175,80,.12)';
    toast('ถูกต้อง! 🎉');
  } else {
    G.wrong++;
    G.errors.push(q);
    slot.style.borderColor = 'var(--red)';
    slot.style.background = 'rgba(178,58,46,.1)';
    const div = document.createElement('div');
    div.className = 'answer-explain';
    div.innerHTML = `ประโยคที่ถูกต้องคือ <b style="font-family:var(--ff-cn);font-size:17px">${esc(target)}</b>${q.th?`<br>${esc(q.th)}`:''}`;
    $('#gameBox').appendChild(div);
    if(currentUser()) spendHp();
  }
  setTimeout(()=>{ G.idx++; G.answered = false; G.orderPick = []; G.orderUsed = []; G.orderPool = null; renderQuestion(); }, ok?1000:2100);
}

/* ==========================================================================
   RESULT
   ========================================================================== */
function renderGameResult(){
  const total = G.qs.length;
  const pct = Math.round((G.score/total)*100);
  const cfg = gameCfg();
  const stars = pct >= cfg.star3Pct ? 3 : pct >= cfg.passPct ? 2 : pct >= 50 ? 1 : 0;
  const passed = pct >= cfg.passPct;
  const u = currentUser();
  const msg = pct >= cfg.star3Pct ? '太棒了! เยี่ยมมาก!' : pct >= cfg.passPct ? '不错! ผ่านแล้ว' : pct >= 50 ? '加油! เกือบแล้ว' : '再来一次! ลองอีกครั้ง';

  let gainTxt = '';
  if(u){
    const key = levelKey(G.gameId, G.lv);
    u.gameStars = u.gameStars || {}; u.gameBest = u.gameBest || {};
    const oldStars = u.gameStars[key]||0;
    const oldBest = u.gameBest[key]||0;
    if(stars > oldStars) u.gameStars[key] = stars;
    if(pct > oldBest) u.gameBest[key] = pct;
    const pts = G.score*5 + (passed?20:0) + (stars>oldStars? stars*15 : 0);
    const xp  = G.score*10 + (passed?40:0);
    award(u, pts, xp, 'game', `${G.def.name} ด่าน ${G.lv} — ${pct}%`);
    checkBadges(u);
    saveUsers();
    gainTxt = `+${pts} แต้ม · +${xp} XP${stars>oldStars?' · ⭐ ใหม่!':''}`;
  }

  $('#gameBox').innerHTML = `
    <div class="game-result">
      <div class="result-stars">${starsStr(stars)}</div>
      <div class="score">${G.score}/${total}</div>
      <h3>${msg}</h3>
      <p>คุณตอบถูก ${pct}% ${passed? '· ผ่านด่านนี้แล้ว!' : `· ต้องได้ ${cfg.passPct}% ขึ้นไปจึงจะผ่าน`}</p>
      ${gainTxt?`<p style="color:var(--red);font-weight:700;margin-bottom:18px">${gainTxt}</p>`:''}
      ${!u?`<p style="font-size:13.5px">💡 <a onclick="go('login')" style="color:var(--red);font-weight:600;cursor:pointer">เข้าสู่ระบบ</a> เพื่อบันทึกดาวและปลดล็อกด่านถัดไป</p>`:''}
      <div class="result-row">
        <button class="btn btn-primary" onclick="go('gameplay','${G.gameId}:${G.lv}')">↻ เล่นด่านนี้อีกครั้ง</button>
        ${passed && G.lv < gameMaxLv(G.gameId) ? `<button class="btn btn-gold" onclick="go('gameplay','${G.gameId}:${G.lv+1}')">ด่านถัดไป →</button>` : ''}
        <button class="btn btn-ghost" onclick="go('gamelevels','${G.gameId}')">เลือกด่านอื่น</button>
        <button class="btn btn-ghost" onclick="go('games')">เกมอื่น</button>
      </div>
    </div>`;

  if(G.errors.length){
    const box = $('#gameBox');
    const div = document.createElement('div');
    div.className = 'answer-explain';
    div.style.marginTop = '22px';
    div.innerHTML = '<b>ทบทวนข้อที่ตอบผิด ('+G.errors.length+' ข้อ)</b><br>' +
      G.errors.slice(0,8).map(q=>{
        if((G.type||G.gameId)==='fill') return `• ${esc(q.q||'')} → <b>${esc(q.a)}</b>${q.th?` (${esc(q.th)})`:''}`;
        if((G.type||G.gameId)==='vocab') return `• ${esc(q.q||q.cn||'')} (${esc(q.py||'')}) = <b>${esc(q.a)}</b>`;
        if((G.type||G.gameId)==='pinyin') return `• ${esc(q.q||'')} = <b>${esc(q.a)}</b>`;
        if((G.type||G.gameId)==='tone') return `• ${esc(q.q||'')} · ${esc(q.target||'')} = เสียงที่ <b>${esc(String(q.a))}</b>`;
        if((G.type||G.gameId)==='order') return `• ${esc(q.q||'')} → <b style="font-family:var(--ff-cn)">${esc((q.a||[]).join(''))}</b>`;
        return `• ${esc(q.q||'')} → <b>${esc(q.a)}</b>`;
      }).join('<br>');
    box.appendChild(div);
  }
}

/* quick quiz straight from an HSK level page */
function startVocabQuiz(lv){
  const pool = (DB.hsk[lv]||[]).filter(w => w.cn && w.th);
  if(pool.length < 3){ toast('ยังไม่มีคำศัพท์พอสำหรับทำแบบทดสอบ'); return; }
  const bank = [];
  shuffle(pool).slice(0, gameCfg().perLevel).forEach(w=>{
    const others = shuffle(pool.filter(x => x.cn !== w.cn && x.th !== w.th)).slice(0,2).map(x => x.th);
    if(others.length === 2) bank.push({q:w.cn, py:w.py, a:w.th, w:others, lv});
  });
  if(!bank.length){ toast('ยังไม่มีคำศัพท์พอสำหรับทำแบบทดสอบ'); return; }
  const backup = DB.games.vocab;
  DB.games.vocab = bank;
  go('gameplay', 'vocab:'+lv);
  setTimeout(()=>{ DB.games.vocab = backup; }, 400);
}

/* ==========================================================================
   BADGES
   ========================================================================== */
const BADGES = [
  {id:'first',  ic:'sprout',   name:'ก้าวแรก',          test:u=>u.xp>0},
  {id:'read3',  ic:'book-open',name:'นักอ่านมือใหม่',    test:u=>(u.read||[]).length>=3},
  {id:'read10', ic:'library',  name:'หนอนหนังสือจีน',    test:u=>(u.read||[]).length>=10},
  {id:'star6',  ic:'star',     name:'เก็บดาวได้ 6 ดวง',  test:u=>Object.values(u.gameStars||{}).reduce((a,b)=>a+b,0)>=6},
  {id:'star18', ic:'sparkles', name:'นักล่าดาว',         test:u=>Object.values(u.gameStars||{}).reduce((a,b)=>a+b,0)>=18},
  {id:'pass6',  ic:'trophy',   name:'ผ่านครบ 6 ด่าน',    test:u=>Object.values(u.gameStars||{}).filter(v=>v>0).length>=6},
  {id:'streak3',ic:'flame',    name:'มาเรียน 3 วันติด',   test:u=>(u.streak||0)>=3},
  {id:'streak7',ic:'gem',      name:'มาเรียน 7 วันติด',   test:u=>(u.streak||0)>=7},
  {id:'lv5',    ic:'medal',    name:'ถึง Level 5',       test:u=>levelOf(u.xp)>=5},
  {id:'lv10',   ic:'medal',    name:'ถึง Level 10',      test:u=>levelOf(u.xp)>=10},
  {id:'lv15',   ic:'trophy',   name:'ถึง Level 15',      test:u=>levelOf(u.xp)>=15},
  {id:'hsk5',   ic:'dragon',   name:'ประเมินได้ HSK 5',   test:u=>hskEstimate(u)>=5},
  {id:'exam5',  ic:'target',   name:'สอบ HSK ได้ 80%+',   test:u=>Object.values(u.exams||{}).some(r=>r&&r.best>=80)},
  {id:'write10',ic:'pen-line', name:'เขียนได้ 10 ตัว',    test:u=>Object.keys(u.writing||{}).length>=10},
  {id:'premium',ic:'crown',    name:'สมาชิกพรีเมียม',     test:u=>isPremium(u)}
];
function earnedBadges(u){ return BADGES.filter(b=>{ try{ return b.test(u); }catch(e){ return false; } }); }
function checkBadges(u){
  const before = (u.badges||[]).length;
  u.badges = earnedBadges(u).map(b=>b.id);
  if(u.badges.length > before) setTimeout(()=>toast('ได้เหรียญใหม่! 🏅'), 1400);
}

/* ==========================================================================
   📊 CHARTS — ภาพรวมความก้าวหน้าแบบกราฟ
   ========================================================================== */
function renderGamesChart(){
  const box = $('#gamesChartBox'); if(!box) return;
  const u = currentUser();
  if(!u){ box.innerHTML = ''; return; }

  /* bars: ดาวสะสมของแต่ละเกม */
  const bars = [];
  GAME_DEFS.forEach(d => {
    let st = 0; for(let i=1;i<=6;i++) st += starsFor(u,d.id,i);
    bars.push({label:d.name, val:st, max:18});
  });
  customCats().forEach(c => {
    const m = (c.levels||[]).length || 1;
    let st = 0; for(let i=1;i<=m;i++) st += starsFor(u,c.id,i);
    bars.push({label:c.name, val:st, max:m*3});
  });
  const maxVal = Math.max.apply(null, bars.map(function(b){return b.max;}).concat([1]));
  const W = 620, LH = 26, top = 14, bottom = 30;
  const H = top + bars.length*LH + bottom;
  const bw = 360;

  const barsSvg = bars.map(function(b, i){
    const y = top + i*LH;
    const w = Math.max(3, Math.round(b.val / b.max * bw));
    return '<rect x="220" y="' + (y+2) + '" width="' + w + '" height="14" rx="7" fill="url(#gradBar)"/>'
      + '<text x="210" y="' + (y+13) + '" text-anchor="end" font-size="12" fill="var(--text-2)">' + esc(b.label) + '</text>'
      + '<text x="' + (224+w) + '" y="' + (y+13) + '" font-size="11" fill="var(--red)" font-weight="700">' + b.val + '/' + b.max + '</text>';
  }).join('');

  box.innerHTML = `
    <div class="panel reveal">
      <h3>📊 กราฟความก้าวหน้าของฉัน</h3>
      <p style="font-size:13.5px;color:var(--text-2);margin-bottom:14px">
        ดาวที่สะสมได้ในแต่ละเกม — ยิ่งแถบยาวเท่าไร ยิ่งใกล้เชี่ยวชาญเกมนั้น
      </p>
      <div style="overflow-x:auto">
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:680px;min-width:420px" role="img" aria-label="กราฟดาวแต่ละเกม">
        <defs>
          <linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="var(--red)"/>
            <stop offset="1" stop-color="var(--gold)"/>
          </linearGradient>
        </defs>
        ${barsSvg}
      </svg>
      </div>
      ${bars.length ? '' : '<div class="empty">ยังไม่มีข้อมูล — เล่นเกมก่อนแล้วกลับมาดูกราฟได้เลย</div>'}
    </div>`;
}
