/* ==========================================================================
   为什么中文 · Account: login, profile, progress, characters page
   ========================================================================== */
'use strict';

/* ==========================================================================
   LOGIN / REGISTER
   ========================================================================== */
let loginPick = '龍';
let loginMode = 'register';

function renderLogin(){
  const u = currentUser();
  if(u){
    $('#loginView').innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="logo-big" style="display:grid;place-items:center;font-size:40px;background:linear-gradient(145deg,rgba(201,162,74,.25),rgba(178,58,46,.16))">${avatarHTML(u.avatar)}</div>
          <h2>คุณ${esc(u.name)}</h2>
          <p class="sub">เข้าสู่ระบบอยู่แล้ว · Level ${levelOf(u.xp)} ${levelTitle(levelOf(u.xp))}${isPremium(u)?' · '+ICON('crown')+' พรีเมียม':''}</p>
          <div class="stat-grid" style="grid-template-columns:1fr 1fr">
            <div class="stat-card"><b>${(u.points||0).toLocaleString()}</b><span>แต้มสะสม</span></div>
            <div class="stat-card"><b>${(u.read||[]).length}</b><span>บทความที่อ่าน</span></div>
          </div>
          <div style="display:grid;gap:11px;margin-top:6px">
            <button class="btn btn-primary btn-block" onclick="go('profile')">ดูความก้าวหน้าของฉัน</button>
            ${isPremium(u)?`<button class="btn btn-gold btn-block" onclick="go('exams')">${ICON('target')} ข้อสอบพรีเมียม HSK 3–6</button>`:''}
            <button class="btn btn-ghost btn-block" onclick="go('home')">กลับหน้าแรก</button>
            <button class="btn btn-ghost btn-block" onclick="logout()">${ICON('log-out')} ออกจากระบบ</button>
          </div>
        </div>
      </div>`;
    return;
  }

  const otherUsers = USERS.length ? `
    <div class="panel" style="margin-top:20px">
      <h3>บัญชีในเครื่องนี้ (${USERS.length})</h3>
      <div class="activity-list">
        ${USERS.slice(-6).reverse().map(x=>`
          <div class="activity" style="cursor:pointer" onclick="switchUser('${x.id}')">
            <span class="ic" style="font-size:24px">${avatarHTML(x.avatar)}</span>
            <span class="txt"><b>${esc(x.name)}</b>${x.email?`<br><span style="font-size:11.5px;color:var(--text-3)">${esc(x.email)}</span>`:''}<br><span style="font-size:12px;color:var(--text-3)">Level ${levelOf(x.xp)} · ${(x.points||0).toLocaleString()} แต้ม${isPremium(x)?' · '+ICON('crown')+' พรีเมียม':''}</span></span>
            <span class="pts">${x.pwdHash?ICON('lock')+' เข้าใช้':'เข้าใช้'} →</span>
          </div>`).join('')}
      </div>
    </div>` : '';

  $('#loginView').innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="logo-big"><img src="assets/logo-why-chinese.png" alt="为什么中文"></div>
        <h2>${loginMode==='register' ? 'สร้างบัญชีผู้เรียน' : 'เข้าสู่ระบบ'}</h2>
        <p class="sub">บัญชีพร้อมอีเมลและรหัสผ่าน — เก็บแต้ม ความก้าวหน้า และสิทธิ์พรีเมียม</p>

        ${loginMode==='register'? `
        <div class="field">
          <label>ชื่อที่ใช้แสดง</label>
          <input id="lg-name" maxlength="20" placeholder="เช่น น้องไผ่, คุณสมชาย" onkeydown="if(event.key==='Enter')doRegister()">
        </div>`: `
        <div class="field">
          <label>อีเมล หรือชื่อบัญชี</label>
          <input id="lg-email" placeholder="อีเมล หรือชื่อที่ใช้สมัคร" onkeydown="if(event.key==='Enter')doLogin()">
        </div>`}

        ${loginMode==='register'? `
        <div class="field">
          <label>อีเมล (ใช้ยืนยันตัวตน และรับรหัสปลดล็อกพรีเมียม)</label>
          <input id="lg-email" type="email" placeholder="you@example.com" onkeydown="if(event.key==='Enter')doRegister()">
        </div>`:''}

        <div class="field">
          <label>รหัสผ่าน ${loginMode==='register'?'(อย่างน้อย 6 ตัว)':''}</label>
          <input id="lg-pwd" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')${loginMode==='register'?'doRegister()':'doLogin()'}">
        </div>

        ${loginMode==='register'? `
        <div class="field">
          <label>วันเกิด (ไม่บังคับ)</label>
          <input id="lg-birth" type="date" max="${todayKey()}">
        </div>
        <div class="sub-sec"><b>${ICON('sparkles')} ข้อมูลสำหรับวางแผนการเรียน (AI)</b><span>ระบบจะวิเคราะห์เป้าหมายของคุณและออกแบบหลักสูตรให้เหมาะกับคุณ</span></div>
        ${learnProfileFields('lg', {})}
        <div class="field">
          <label>เลือกรูปโปรไฟล์</label>
          <div class="emoji-picker" id="emojiPicker">
            ${AVATARS.map(e=>`<button class="emoji-opt ${e===loginPick?'sel':''}" onclick="pickAvatar('${e}')">${avatarHTML(e)}</button>`).join('')}
          </div>
        </div>`:''}

        <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="${loginMode==='register'?'doRegister()':'doLogin()'}">
          ${loginMode==='register' ? 'สมัครและเริ่มเรียน · 为什么中文' : ICON('log-out')+' เข้าสู่ระบบ'}
        </button>
        <button class="btn btn-ghost btn-block" onclick="loginMode = loginMode==='register'?'login':'register'; renderLogin()">
          ${loginMode==='register' ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครใหม่'}
        </button>

        <p class="hint" style="text-align:center;margin-top:14px">
          รหัสผ่านถูกเข้ารหัส (SHA-256) และเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น ไม่มีการส่งออกไปที่ใด
        </p>
      </div>
      ${otherUsers}
    </div>`;
}
function pickAvatar(e){
  loginPick = e;
  $$('#emojiPicker .emoji-opt').forEach(b=>b.classList.toggle('sel', b.textContent===e));
}
function doRegister(){
  const name = ($('#lg-name')?.value||'').trim();
  const email = normEmail($('#lg-email')?.value||'');
  const pwd = $('#lg-pwd')?.value||'';
  const birth = $('#lg-birth')?.value||'';
  if(!name){ toast('ใส่ชื่อก่อนนะ'); $('#lg-name')?.focus(); return; }
  if(name.length < 2){ toast('ชื่อสั้นเกินไป'); return; }
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ toast('ใส่อีเมลให้ถูกต้อง — ใช้ยืนยันตัวตนและรหัสปลดล็อก'); $('#lg-email')?.focus(); return; }
  if(pwd.length < 6){ toast('รหัสผ่านอย่างน้อย 6 ตัว'); $('#lg-pwd')?.focus(); return; }
  if(USERS.find(x=>normEmail(x.email)===email)){ toast('อีเมลนี้มีบัญชีแล้ว — ไปที่แท็บ "เข้าสู่ระบบ"'); loginMode='login'; renderLogin(); return; }
  const dup = USERS.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(dup){ toast('มีชื่อนี้แล้ว — กำลังเข้าใช้บัญชีเดิม'); switchUser(dup.id); return; }
  const profile = readLearnProfile('lg');
  if(!profile) return;
  const u = createUser(esc(name), birth, loginPick, email, hashSha256(pwd), profile);
  u.curriculum = buildCurriculum(u);
  saveUsers();
  toast('ยินดีต้อนรับ คุณ'+name+'! AI กำลังจัดแผนการเรียนให้คุณ');
  /* สมัครบัญชีคลาวด์ (Supabase) คู่กัน — sync ข้อมูลข้ามเครื่อง */
  if(typeof sbConfigured === 'function' && sbConfigured()){
    sbSignUp(email, pwd, {name: name}).then(function(){
      sbLoadProfile().then(function(p){ if(p) sbApplyProfile(u, p); });
    });
  }
  go('profile');
}
function doLogin(){
  const key = ($('#lg-email')?.value||'').trim().toLowerCase();
  const pwd = $('#lg-pwd')?.value||'';
  if(!key || !pwd){ toast('กรอกอีเมล/ชื่อ และรหัสผ่าน'); return; }
  const u = USERS.find(x => normEmail(x.email)===key || x.name.toLowerCase()===key);
  if(!u){ toast('ไม่พบบัญชีนี้ — ลองสมัครใหม่'); return; }
  if(!u.pwdHash){ toast('บัญชีนี้ยังไม่ได้ตั้งรหัสผ่าน — เลือกจากรายการบัญชีในเครื่องนี้'); return; }
  if(u.pwdHash !== hashSha256(pwd)){ toast('รหัสผ่านไม่ถูกต้อง'); return; }
  /* เข้าสู่ระบบคลาวด์คู่กัน → โหลดโปรไฟล์ล่าสุดจากคลาวด์ */
  if(typeof sbConfigured === 'function' && sbConfigured()){
    sbSignIn(email, pwd).then(function(res){
      if(res && res.error){ return; }
      sbLoadProfile().then(function(p){ if(p){ sbApplyProfile(u, p); renderUserChip(); } });
    });
  }
  session = {uid:u.id}; saveSession();
  touchStreak(u);
  toast('ยินดีต้อนรับกลับ คุณ'+u.name);
  renderUserChip();
  go('profile');
}
function switchUser(id){
  const u = USERS.find(x=>x.id===id); if(!u) return;
  if(u.pwdHash){
    if(typeof glassPrompt === 'function'){
      glassPrompt('บัญชี "'+esc(u.name)+'" มีรหัสผ่าน — กรอกรหัสผ่านเพื่อเข้าใช้', function(val){
        if(u.pwdHash !== hashSha256(val||'')){ toast('รหัสผ่านไม่ถูกต้อง'); return; }
        session = {uid:u.id}; saveSession();
        touchStreak(u);
        toast('เข้าใช้ในชื่อ '+u.name);
        renderUserChip();
        go('profile');
      }, true);
      return;
    }
  }
  session = {uid:u.id}; saveSession();
  touchStreak(u);
  toast('เข้าใช้ในชื่อ '+u.name);
  renderUserChip();
  go('profile');
}

/* ==========================================================================
   PROFILE
   ========================================================================== */
function renderProfile(){
  const u = currentUser();
  if(!u){
    $('#profileView').innerHTML = `
      <div class="empty" style="padding:70px 20px">
        <span class="ic">${ICON('lock')}</span>
        ยังไม่ได้เข้าสู่ระบบ — สมัครฟรีเพื่อเก็บแต้มและความก้าวหน้า<br><br>
        <button class="btn btn-primary" onclick="go('login')">สมัคร / เข้าสู่ระบบ</button>
      </div>`;
    return;
  }
  regenHp(u);
  const lv = levelOf(u.xp);
  const inLv = xpInLevel(u.xp);
  const pctLv = Math.round(inLv/XP_PER_LEVEL*100);
  const est = hskEstimate(u);
  const readN = (u.read||[]).length;
  const stars = Object.values(u.gameStars||{}).reduce((a,b)=>a+b,0);
  const badges = BADGES.map(b=>Object.assign({}, b, {on: u.badges?.includes(b.id) || (()=>{try{return b.test(u);}catch(e){return false;}})()}));
  const age = u.birthday ? Math.floor((Date.now()-new Date(u.birthday).getTime())/31557600000) : null;
  const prem = isPremium(u);
  const writeN = Object.keys(u.writing||{}).length;
  const writeStars = Object.values(u.writing||{}).reduce((a,r)=>a+(r.stars||0),0);
  const examBest = [1,2,3,4,5,6].map(n=>{ const r=(u.exams||{})[n]; return r?r.best:null; });
  const pyStars = Object.values((u.pinyin||{}).stars||{}).reduce((a,b)=>a+b,0);

  /* HSK progression bars */
  const hskBars = [1,2,3,4,5,6].map(n=>{
    const wordsN = (DB.hsk[n]||[]).length;
    const starN = GAME_DEFS.reduce((a,d)=>a+starsFor(u,d.id,n), 0);
    const v = Math.min(100, Math.round(starN/(GAME_DEFS.length*3)*100));
    return `<div class="progress-row">
      <div class="lbl"><span>HSK ${n} · ${hskMeta()[n].name}</span>
        <b>${v}% ${v>=100?ICON('circle-check'):''}</b></div>
      <div class="pbar"><i style="width:${v}%"></i></div>
      <div style="font-size:11.5px;color:var(--text-3);margin-top:3px">${wordsN} คำในระบบ · ดาวที่เก็บได้ ${starN}/${GAME_DEFS.length*3}${examBest[n-1]!=null?' · สอบได้ '+examBest[n-1]+'%':''}</div>
    </div>`;
  }).join('');

  /* per-game star summary */
  const gameRows = GAME_DEFS.map(d=>{
    let s = 0; for(let i=1;i<=6;i++) s += starsFor(u,d.id,i);
    return `<div class="activity">
      <span class="ic">${ICON(d.ic)}</span>
      <span class="txt"><b>${d.name}</b></span>
      <span class="pts" style="letter-spacing:1px;color:var(--gold)">${'★'.repeat(s)}<span style="color:rgba(139,111,71,.25)">${'★'.repeat(Math.max(0,18-s))}</span></span>
      <span style="font-size:11.5px;color:var(--text-3);flex:0 0 auto">${s}/18</span>
    </div>`;
  }).join('');

  const history = (u.history||[]).slice(0,12).map(h=>{
    const ic = h.type==='read'?'book-open':h.type==='game'?'gamepad':h.type==='exam'?'target':h.type==='write'?'pen-line':h.type==='pinyin'?'music':'sparkles';
    return `
    <div class="activity">
      <span class="ic">${ICON(ic)}</span>
      <span class="txt">${esc(h.txt||'')}</span>
      <span class="when">${fmtDate(h.ts)}</span>
      <span class="pts">+${h.pts}</span>
    </div>`;
  }).join('') || '<div class="empty">ยังไม่มีกิจกรรม — เริ่มอ่านบทความหรือเล่นเกมเลย!</div>';

  $('#profileView').innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span> <span>โปรไฟล์ของฉัน</span></div>
    <div id="planPanel"></div>

    <div class="profile-head">
      <div class="ava-big">${avatarHTML(u.avatar, 88)}</div>
      <div class="who">
        <h2>${esc(u.name)} ${prem?'<span class="premium-chip" style="vertical-align:middle">'+ICON('crown')+' พรีเมียม</span>':''}</h2>
        <div class="meta">
          <span>เริ่มเรียนเมื่อ ${fmtDate(u.createdAt)}</span>
          ${age?`<span>อายุ ${age} ปี</span>`:''}
          <span>มาเรียนติดต่อกัน <b>${u.streak||0}</b> วัน</span>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <span class="tag-pill red">${levelTitle(lv)}</span>
          <span class="tag-pill gold">ประเมินได้ HSK ${est||'–'}</span>
          <span class="tag-pill jade">${ICON('heart')} ${u.hp}/${maxHp()}</span>
          ${prem?`<span class="tag-pill gold">${ICON('crown')} ${esc(premiumUntilTxt(u))}</span>`:''}
        </div>
      </div>
      <div class="lvl-badge"><b>${lv}</b><span>Level</span></div>
      <div style="flex:1;min-width:220px">
        <div class="progress-row" style="margin:0">
          <div class="lbl"><span>ความคืบหน้าสู่ Level ${lv+1}</span><b>${inLv}/${XP_PER_LEVEL} XP</b></div>
          <div class="pbar"><i style="width:${pctLv}%"></i></div>
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="ic">${ICON('gem')}</div><b>${(u.points||0).toLocaleString()}</b><span>แต้มสะสม</span></div>
      <div class="stat-card"><div class="ic">${ICON('zap')}</div><b>${(u.xp||0).toLocaleString()}</b><span>XP ทั้งหมด</span></div>
      <div class="stat-card"><div class="ic">${ICON('book-open')}</div><b>${readN}</b><span>บทความที่อ่าน</span></div>
      <div class="stat-card"><div class="ic">${ICON('gamepad')}</div><b>${stars}</b><span>ดาวจากเกม</span></div>
      <div class="stat-card"><div class="ic">${ICON('flame')}</div><b>${u.streak||0}</b><span>วันติดต่อกัน</span></div>
      <div class="stat-card"><div class="ic">${ICON('kanji')}</div><b>${est||'–'}</b><span>ระดับ HSK ประเมิน</span></div>
    </div>

    ${prem? `
    <div class="continue-card reveal" style="margin-bottom:22px">
      <div class="ic" style="font-size:26px">${ICON('crown')}</div>
      <div class="txt">
        <b>สมาชิกพรีเมียม · ${esc(premiumUntilTxt(u))}</b>
        <span>ข้อสอบจำลอง HSK 3–6 และเขียนอักษรครบ 3,000 ตัว พร้อมใช้งานแล้ว</span>
      </div>
      <button class="btn btn-gold btn-sm" onclick="go('exams')">${ICON('target')} ทำข้อสอบ HSK</button>
      <button class="btn btn-ghost btn-sm" onclick="go('writing')">${ICON('pen-line')} ฝึกเขียนอักษร</button>
    </div>` : `
    <div class="continue-card reveal" style="margin-bottom:22px">
      <div class="ic" style="font-size:26px">${ICON('crown')}</div>
      <div class="txt">
        <b>อัปเกรดเป็นสมาชิกพรีเมียม</b>
        <span>ปลดล็อกข้อสอบจำลอง HSK ครบทุกระดับ และฝึกเขียนอักษรครบ 3,000 ตัว</span>
      </div>
      <button class="btn btn-gold btn-sm" onclick="go('premium')">${ICON('crown')} ดูแพ็กเกจพรีเมียม</button>
    </div>`}

    <div class="panel">
      <h3>${ICON('kanji')} การเรียนอักษรและคำศัพท์ของฉัน</h3>
      <p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">
        ระบบจำสิ่งที่คุณกด "✓ จำได้แล้ว" ไว้ในบัญชีนี้ — เรียนอักษร 3,000 ตัวและคำศัพท์ HSK
        แล้วไม่ต้องเริ่มใหม่ในเครื่องเดิมหรือเครื่องใหม่ (ถ้า login บัญชีเดียวกัน)
      </p>
      <div class="grid2">
        <div class="mini-stat" style="border:1px solid var(--line);border-radius:12px;padding:14px 16px">
          <b style="font-family:var(--ff-num);font-size:22px;color:var(--brown-3)">${learnedCharCount()}<span style="font-size:13px"> / 3,000</span></b>
          <span style="display:block;font-size:12px;color:var(--text-3);margin-top:4px">ตัวอักษรที่จำได้แล้ว</span>
          <div class="pbar" style="margin-top:8px"><i style="width:${Math.round(learnedCharCount()/30)}%"></i></div>
        </div>
        <div class="mini-stat" style="border:1px solid var(--line);border-radius:12px;padding:14px 16px">
          <b style="font-family:var(--ff-num);font-size:22px;color:var(--brown-3)">${learnedWordCount()}</b>
          <span style="display:block;font-size:12px;color:var(--text-3);margin-top:4px">คำศัพท์ที่จำได้แล้ว</span>
          <div style="margin-top:14px;font-size:12px;color:var(--text-3)">จากทั้งหมด 6,201 คำในระบบ</div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="go('chars')">${ICON('kanji')} ไปเรียนอักษรจีน</button>
        <button class="btn btn-ghost btn-sm" onclick="go('hsk')">${ICON('book')} ทบทวนคำศัพท์ HSK</button>
        <button class="btn btn-ghost btn-sm" onclick="resetCharProgress()">${ICON('trash')} รีเซ็ตอักษรที่จำได้</button>
        <button class="btn btn-ghost btn-sm" onclick="resetWordProgress()">${ICON('trash')} รีเซ็ตคำศัพท์ที่จำได้</button>
      </div>
    </div>

    <div class="panel">
      <h3>${ICON('target')} คะแนนข้อสอบจำลอง HSK</h3>
      <p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">ชุดที่ 1 ทุกระดับฟรี · ชุด 2–5 เป็นสิทธิ์พรีเมียม — แสดงคะแนนสูงสุดของแต่ละระดับ</p>
      <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        ${[1,2,3,4,5,6].map(n=>{
          const rec = (u.exams||{})[n];
          let best = null, setsDone = 0;
          if(rec && rec.sets){
            Object.values(rec.sets).forEach(s => { if(s && s.best != null){ if(best==null || s.best>best) best = s.best; if(s.best>=60) setsDone++; } });
          }
          return `
          <div class="stat-card">
            <b>${best!=null?best+'%':'—'}</b>
            <span>HSK ${n}${best!=null?(best>=60?' · ผ่าน':' · ยังไม่ผ่าน'):''} · ${setsDone}/${(typeof EXAM_SETS!=='undefined'?EXAM_SETS:5)} ชุดผ่าน</span>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="go('exams')">${ICON('clipboard')} ไปทำข้อสอบ</button>
      </div>
    </div>

    <div class="panel">
      <h3>${ICON('pen-line')} การฝึกเขียนอักษร</h3>
      <p style="font-size:13.5px;color:var(--text-2);margin-bottom:14px">
        ฝึกไปแล้ว <b style="font-family:var(--ff-num)">${writeN}</b> ตัว · เก็บดาวได้ <b style="font-family:var(--ff-num);color:var(--gold)">${writeStars}</b> ดวง
        · พื้นฐานขีด <b style="font-family:var(--ff-num);color:var(--gold)">${Object.values(u.basic||{}).reduce((a,r)=>a+(r.stars||0),0)}</b> ดาว
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="go('chars');setTimeout(function(){setCharTab('write')},30)">${ICON('pen-line')} ไปฝึกเขียนอักษร</button>
        <button class="btn btn-ghost btn-sm" onclick="go('chars');setTimeout(function(){setCharTab('basic')},30)">${ICON('brush')} ทบทวนพื้นฐานขีด</button>
      </div>
    </div>

    <div class="panel">
      <h3>${ICON('music')} คอร์สพินอิน</h3>
      <p style="font-size:13.5px;color:var(--text-2);margin-bottom:14px">
        เก็บดาวได้ <b style="font-family:var(--ff-num);color:var(--gold)">${pyStars}</b> จาก 15 ดวง (5 บทเรียน × 3 ดาว)
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="go('pinyin')">${ICON('music')} ไปเรียนพินอิน</button>
      </div>
    </div>

    <div class="panel">
      <h3>ระดับภาษาจีนของฉัน</h3>
      <p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">
        แถบนี้คำนวณจากแต้มที่ได้ บทความที่อ่าน และดาวจากเกมในแต่ละระดับ
        ยิ่งแถบสูงขึ้น แปลว่าคุณกำลังเข้าใกล้ระดับนั้นจริง ๆ
      </p>
      ${hskBars}
      <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="go('games')">${ICON('gamepad')} เล่นเกมเพื่อไต่ระดับ</button>
        <button class="btn btn-ghost btn-sm" onclick="go('articles')">${ICON('book-open')} อ่านบทความเพิ่ม</button>
        <button class="btn btn-ghost btn-sm" onclick="go('hsk')">${ICON('book')} ทบทวนคำศัพท์</button>
      </div>
    </div>

    <div class="panel">
      <h3>เหรียญที่ได้รับ (${badges.filter(b=>b.on).length}/${badges.length})</h3>
      <div class="badge-grid">
        ${badges.map(b=>`<div class="badge ${b.on?'on':''}"><span class="ic">${ICON(b.ic)}</span><b>${b.name}</b></div>`).join('')}
      </div>
    </div>

    <div class="panel">
      <h3>ความคืบหน้าแต่ละเกม</h3>
      <div class="activity-list">${gameRows}</div>
    </div>

    <div class="panel">
      <h3>กิจกรรมล่าสุด</h3>
      <div class="activity-list">${history}</div>
    </div>

    <div class="panel">
      <h3>ตั้งค่าบัญชี</h3>
      <div class="grid2">
        <div class="field"><label>ชื่อที่ใช้แสดง</label><input id="pf-name" value="${esc(u.name)}" maxlength="20"></div>
        <div class="field"><label>วันเกิด</label><input id="pf-birth" type="date" value="${u.birthday||''}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>อีเมล (ผูกกับรหัสปลดล็อกพรีเมียม)</label><input id="pf-email" type="email" value="${esc(u.email||'')}" placeholder="you@example.com"></div>
        <div class="field"><label>รหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)</label><input id="pf-pwd" type="password" placeholder="••••••••"></div>
      </div>
      <div class="field"><label>รูปโปรไฟล์</label>
        <div class="emoji-picker">
          ${AVATARS.map(e=>`<button class="emoji-opt ${e===u.avatar?'sel':''}" onclick="updateAvatar('${e}')">${avatarHTML(e)}</button>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        <button class="btn btn-primary btn-sm" onclick="updateProfile()">บันทึกการเปลี่ยนแปลง</button>
        <button class="btn btn-ghost btn-sm" onclick="logout()">${ICON('log-out')} ออกจากระบบ</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteAccount()" style="color:var(--red)">ลบบัญชีนี้</button>
      </div>
    </div>`;
  if(typeof renderCurriculumPanel === 'function') renderCurriculumPanel();
}
function updateAvatar(e){
  const u = currentUser(); if(!u) return;
  u.avatar = e; saveUsers(); renderProfile(); renderUserChip();
}
function updateProfile(){
  const u = currentUser(); if(!u) return;
  const n = ($('#pf-name')?.value||'').trim();
  const b = $('#pf-birth')?.value||'';
  const email = normEmail($('#pf-email')?.value||'');
  const pwd = $('#pf-pwd')?.value||'';
  if(n.length < 2){ toast('ชื่อสั้นเกินไป'); return; }
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ toast('รูปแบบอีเมลไม่ถูกต้อง'); return; }
  if(email && USERS.find(x=>x.id!==u.id && normEmail(x.email)===email)){ toast('อีเมลนี้ถูกใช้ในบัญชีอื่นแล้ว'); return; }
  if(pwd && pwd.length < 6){ toast('รหัสผ่านใหม่อย่างน้อย 6 ตัว'); return; }
  u.name = esc(n); u.birthday = b;
  if(email) u.email = email;
  if(pwd) u.pwdHash = hashSha256(pwd);
  saveUsers(); renderUserChip(); renderProfile();
  toast('บันทึกแล้ว');
}
function deleteAccount(){
  const u = currentUser(); if(!u) return;
  if(typeof glassConfirm === 'function'){
    glassConfirm('ลบบัญชี "'+esc(u.name)+'" และข้อมูลทั้งหมด? ลบแล้วกู้คืนไม่ได้', function(){
      USERS = USERS.filter(x=>x.id!==u.id);
      saveUsers(); logout();
    });
    return;
  }
  if(!confirm('ลบบัญชี "'+u.name+'" และข้อมูลทั้งหมด? ลบแล้วกู้คืนไม่ได้')) return;
  USERS = USERS.filter(x=>x.id!==u.id);
  saveUsers(); logout();
}

/* ==========================================================================
   CHARACTERS (3,000 常用字)
   ========================================================================== */
let charState = {q:'', mode:'all', shown:300, learnedOnly:false};
function renderCharsPage(){
  const total = CHARS.length;
  const intro = $('#charsIntro');
  if(intro && !intro.dataset.done){
    intro.dataset.done = '1';
    intro.innerHTML = `
      <div class="panel reveal">
        <h3>หน้านี้คืออะไร</h3>
        <p style="font-size:14.5px;color:var(--text-2)">
          นี่คือศูนย์รวมอักษรจีนครบวงจร — รายการ <b>อักษรจีนที่ใช้บ่อย 3,000 ตัว</b> เรียงตาม <b>通用规范汉字表</b>
          (ตารางอักษรจีนมาตรฐานทั่วไป) <b>一级字表</b> ของกระทรวงศึกษาธิการจีน
          พร้อม<b>ลำดับขีดและแบบฝึกเขียน</b>สำหรับตัวอักษรที่ใช้บ่อยที่สุด —
          สลับแท็บด้านล่างเพื่อเลือกโหมดที่ต้องการ
        </p>
        <div class="mini-stat-row" style="margin:20px 0 4px">
          <div class="mini-stat"><b>3,000</b><span>อักษร</span></div>
          <div class="mini-stat"><b>${hasStrokeData('一')?strokeChars().length:'440'}</b><span>มีลำดับขีด + ฝึกเขียน</span></div>
          <div class="mini-stat"><b>8</b><span>ขีดพื้นฐาน</span></div>
          <div class="mini-stat"><b>6</b><span>ระดับ HSK</span></div>
        </div>
        <p style="font-size:13.5px;color:var(--text-3);margin-top:14px">
          ${ICON('lightbulb')} เคล็ดลับ: รู้จัก 1,000 ตัวแรกก่อน แล้วจะอ่านประโยคง่าย ๆ ได้เกือบทั้งหมด —
          กดที่ตัวอักษรเพื่อดูพินอิน ความหมาย จำนวนขีด และปุ่มฝึกเขียน
        </p>
      </div>`;
  }

  /* แถบสลับโหมด */
  const tabs = $('#charModeTabs');
  if(tabs){
    tabs.innerHTML = `
      <button class="hsk-mode-tab ${charTab==='list'?'active':''}" onclick="setCharTab('list');renderCharsPage()">${TILE('kanji','brown')} อักษร 3,000 ตัว</button>
      <button class="hsk-mode-tab ${charTab==='write'?'active':''}" onclick="setCharTab('write');renderCharsPage()">${TILE('pen-line','red')} ลำดับขีด & ฝึกเขียน</button>
      <button class="hsk-mode-tab ${charTab==='basic'?'active':''}" onclick="setCharTab('basic');renderCharsPage()">${TILE('brush','gold')} เริ่มจากพื้นฐานขีด</button>
      <button class="hsk-mode-tab ${charTab==='comp'?'active':''}" onclick="setCharTab('comp');renderCharsPage()">${TILE('kanji','gold')} ส่วนประกอบอักษร & เกมประกอบ</button>`;
  }

  const listWrap = $('#charListWrap'), writeBox = $('#charsWriteTab'), basicBox = $('#charsBasicTab'), compBox = $('#charsCompTab');
  const clearComp = () => { if(compBox) compBox.innerHTML = ''; };
  if(charTab === 'write'){
    if(listWrap) listWrap.style.display = 'none';
    if(basicBox) basicBox.innerHTML = '';
    clearComp();
    renderWriteTab();
    return;
  }
  if(charTab === 'basic'){
    if(listWrap) listWrap.style.display = 'none';
    if(writeBox) writeBox.innerHTML = '';
    clearComp();
    renderBasicTab();
    return;
  }
  if(charTab === 'comp'){
    if(listWrap) listWrap.style.display = 'none';
    if(writeBox) writeBox.innerHTML = '';
    if(basicBox) basicBox.innerHTML = '';
    renderComponentsTab();
    return;
  }
  if(listWrap) listWrap.style.display = '';
  if(writeBox) writeBox.innerHTML = '';
  if(basicBox) basicBox.innerHTML = '';
  clearComp();
  if(!$('#charGrid').dataset.built){
    $('#charGrid').dataset.built = '1';
    renderCharProgress();
    renderCharGrid();
  } else {
    renderCharProgress();
  }
}

/* ==========================================================================
   LEARNING PROGRESS — จำตัวอักษร/คำศัพท์ที่เรียนแล้ว ต่อบัญชีผู้ใช้
   ========================================================================== */
function ensureLearned(u){
  if(!u) return null;
  if(!u.learnedChars || typeof u.learnedChars !== 'object') u.learnedChars = {};
  if(!u.learnedWords || typeof u.learnedWords !== 'object') u.learnedWords = {};
  return u;
}
function isCharLearned(c){
  const u = currentUser();
  return !!(u && u.learnedChars && u.learnedChars[c]);
}
function learnedCharCount(){
  const u = currentUser();
  return (u && u.learnedChars) ? Object.keys(u.learnedChars).length : 0;
}
function isWordLearned(cn){
  const u = currentUser();
  return !!(u && u.learnedWords && u.learnedWords[cn]);
}
function learnedWordCount(){
  const u = currentUser();
  return (u && u.learnedWords) ? Object.keys(u.learnedWords).length : 0;
}
function toggleCharLearned(c, ev){
  if(ev) ev.stopPropagation();
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนนะ — ความคืบหน้าจะบันทึกในบัญชีของคุณ'); go('login'); return; }
  ensureLearned(u);
  if(u.learnedChars[c]) delete u.learnedChars[c];
  else u.learnedChars[c] = Date.now();
  saveUsers();
  renderCharGrid();
  renderCharProgress();
}
function toggleWordLearned(cn, ev){
  if(ev) ev.stopPropagation();
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนนะ — ความคืบหน้าจะบันทึกในบัญชีของคุณ'); go('login'); return; }
  ensureLearned(u);
  if(u.learnedWords[cn]) delete u.learnedWords[cn];
  else u.learnedWords[cn] = Date.now();
  saveUsers();
  /* อัปเดตเฉพาะการ์ด/ตัวนับที่แสดงอยู่ โดยไม่ต้องวาดใหม่ทั้งหน้า */
  if($('#hskLevelGrid')) renderHskLevelGrid();
  renderCharProgress();
  if(typeof renderHskLevelPage === 'function' && $('#hskLevelDetail')) {
    /* อัปเดตตัวนับใน header แบบเบา ๆ */
    const el = $('#hskLearnedPill');
    if(el) el.textContent = '✓ จำได้แล้ว ' + learnedWordCount() + ' คำ';
  }
}
function resetCharProgress(){
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนนะ'); return; }
  if(!confirm('ล้างความคืบหน้าการเรียนอักษรทั้งหมดของบัญชีนี้?')) return;
  u.learnedChars = {};
  saveUsers();
  renderCharGrid();
  renderCharProgress();
  toast('รีเซ็ตความคืบหน้าอักษรแล้ว');
}
function resetWordProgress(){
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนนะ'); return; }
  if(!confirm('ล้างความคืบหน้าการจำคำศัพท์ทั้งหมดของบัญชีนี้?')) return;
  u.learnedWords = {};
  saveUsers();
  if($('#hskLevelGrid')) renderHskLevelGrid();
  renderCharProgress();
  toast('รีเซ็ตความคืบหน้าคำศัพท์แล้ว');
}
function toggleLearnedOnly(){
  charState.learnedOnly = !charState.learnedOnly;
  const btn = $('#charLearnedBtn');
  if(btn) btn.textContent = charState.learnedOnly ? '✓ กำลังซ่อนตัวที่จำได้ — กดเพื่อแสดงทั้งหมด' : '✓ ซ่อนตัวที่จำได้แล้ว';
  toast(charState.learnedOnly ? 'ซ่อนตัวอักษรที่จำได้แล้ว — เหลือตัวที่ยังไม่ได้เรียน' : 'แสดงตัวอักษรทั้งหมด');
  renderCharGrid();
}
function renderCharProgress(){
  const box = $('#charProgress');
  if(!box) return;
  const u = currentUser();
  const total = CHARS.length;
  const done = learnedCharCount();
  const pct = Math.round(done/total*100);
  box.innerHTML = u ? `
    <div class="panel reveal" style="padding:16px 20px">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
        <div>
          <b style="font-size:15.5px;color:var(--brown-3)">${ICON('trending-up')} ความคืบหน้าการเรียนอักษรของฉัน</b>
          <div style="font-size:13px;color:var(--text-2);margin-top:4px">
            จำได้แล้ว <b style="font-family:var(--ff-num)">${done}</b> จาก <b style="font-family:var(--ff-num)">${total}</b> ตัวอักษร (${pct}%)
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="toggleLearnedOnly()">${charState.learnedOnly?'👁 แสดงทั้งหมด':'✓ ซ่อนตัวที่จำได้แล้ว'}</button>
          <button class="btn btn-ghost btn-sm" onclick="resetCharProgress()">🗑 รีเซ็ตความคืบหน้า</button>
        </div>
      </div>
      <div class="progress-row" style="margin:12px 0 0"><div class="pbar"><i style="width:${pct}%"></i></div></div>
    </div>` : `
    <div class="panel reveal" style="padding:14px 20px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-size:13.5px;color:var(--text-2)">${ICON('trending-up')} <b>เข้าสู่ระบบ</b> เพื่อให้ระบบจำว่าคุณเรียนตัวอักษรตัวไหนไปแล้ว — จะได้ไม่ต้องเรียนซ้ำ</span>
        <button class="btn btn-primary btn-sm" onclick="go('login')">สมัคร / เข้าสู่ระบบ</button>
      </div>
    </div>`;
}

function toggleCharMode(){
  charState.mode = charState.mode === 'all' ? 'stroke' : 'all';
  $('#charModeBtn').textContent = charState.mode === 'all' ? '⇄ สลับโหมดค้นหา' : '⇄ โหมดค้นหาปกติ';
  const inp = $('#charSearch');
  if(inp) inp.placeholder = charState.mode === 'all'
    ? '🔍 พิมพ์ตัวอักษรจีน พินอิน หรือความหมายไทย'
    : '🔍 พิมพ์จำนวนขีด เช่น 8 เพื่อดูอักษร 8 ขีดทั้งหมด';
  toast(charState.mode === 'all' ? 'ค้นหาจากตัวอักษร/พินอิน/ความหมาย' : 'โหมดค้นหา: พิมพ์จำนวนขีด เช่น 8');
  onCharSearch();
}
function onCharSearch(){
  charState.q = ($('#charSearch')?.value||'').trim().toLowerCase();
  charState.shown = 300;
  renderCharGrid();
}
function filteredChars(){
  const q = charState.q;
  let list = CHARS;
  if(charState.mode === 'stroke' && /^\d+$/.test(q)) list = list.filter(c=>c.s === +q);
  else if(q) list = list.filter(c =>
    c.c === q || (c.p||'').toLowerCase().includes(q) || (c.th||'').includes(q));
  if(charState.learnedOnly) list = list.filter(c=>!isCharLearned(c.c));
  return list;
}
function renderCharGrid(){
  const list = filteredChars();
  const show = list.slice(0, charState.shown);
  const u = currentUser();
  const done = learnedCharCount();
  $('#charCount').innerHTML = `แสดง <b>${show.length}</b> จาก <b>${list.length}</b> ตัว` +
    (list.length===CHARS.length ? ` · ทั้งหมด ${CHARS.length} ตัว (通用规范汉字表 一级字表)` : '') +
    (u ? ` · ✓ จำได้แล้ว <b>${done}</b> ตัว` : '');
  $('#charGrid').innerHTML = show.map(c=>{
    const on = isCharLearned(c.c);
    return `
    <div class="char-cell ${on?'learned':''}" onclick="openChar('${c.c}')" title="${esc(c.p)} — ${esc(c.th)}">
      <span class="n">${c.n}</span>
      <span class="c">${c.c}</span>
      <span class="p">${esc(c.p||'')}</span>
      <button class="char-learn ${on?'on':''}" onclick="toggleCharLearned('${c.c}',event)" title="${on?'กดเพื่อเลิกจำ':'กดเมื่อจำได้แล้ว'}">${on?'✓':'+'}</button>
    </div>`;
  }).join('') || '<div class="empty" style="grid-column:1/-1"><span class="ic">🔍</span>ไม่พบอักษรที่ตรงกับเงื่อนไข</div>';
  const more = $('#charMoreBtn');
  if(more) more.style.display = show.length < list.length ? '' : 'none';
}
function loadMoreChars(){ charState.shown += 300; renderCharGrid(); }
function openChar(ch){
  const c = CHARS.find(x=>x.c===ch); if(!c) return;
  const u = currentUser();
  if(u){ u.seenChars = u.seenChars||[]; if(!u.seenChars.includes(ch)){ u.seenChars.push(ch); if(u.seenChars.length>400) u.seenChars.shift(); saveUsers(); } }
  $('#charModalBody').innerHTML = `
    <button class="close" onclick="closeCharModal()">✕</button>
    <div class="char-hero">
      <div class="big-cn">${c.c}</div>
      <div class="py">${esc(c.p||'')}</div>
    </div>
    <div class="char-rows">
      <div class="char-row"><span>ความหมาย</span><b>${esc(c.th||'—')}</b></div>
      <div class="char-row"><span>จำนวนขีด</span><b>${c.s||'—'} ขีด</b></div>
      <div class="char-row"><span>ลำดับความถี่</span><b>ที่ ${c.n} จาก 3,000</b></div>
      <div class="char-row"><span>หมวดใน HSK</span><b>HSK ${c.n<=200?1:c.n<=450?2:c.n<=900?3:c.n<=1500?4:c.n<=2200?5:6}</b></div>
    </div>
    <div style="display:grid;gap:10px;margin-top:18px">
      <button class="btn btn-primary btn-block btn-sm" onclick="speak('${c.c}')">${ICON('volume-2')} ฟังเสียงอ่าน</button>
      ${hasStrokeData(c.c)?`<button class="btn btn-gold btn-block btn-sm" onclick="closeCharModal();openWrite('${c.c}')">${ICON('pen-line')} ฝึกลำดับขีด + เขียนอักษรนี้</button>`:''}
      <button class="btn ${isCharLearned(c.c)?'btn-ghost':'btn-ghost'} btn-block btn-sm" onclick="toggleCharLearned('${c.c}');closeCharModal()">${isCharLearned(c.c)?'✓ จำได้แล้ว — กดเพื่อเลิกจำ':ICON('check')+' จำได้แล้ว'}</button>
      <button class="btn btn-ghost btn-block btn-sm" onclick="findWordsWith('${c.c}')">ดูคำศัพท์ที่มีอักษรนี้</button>
    </div>`;
  $('#charModal').classList.add('open');
}
function closeCharModal(){ $('#charModal').classList.remove('open'); }
function findWordsWith(ch){
  const words = allWords().filter(w => (w.cn||'').includes(ch)).slice(0, 30);
  closeCharModal();
  if(!words.length){ toast('ยังไม่พบคำศัพท์ที่มีอักษรนี้ในระบบ'); return; }
  go('hsk');
  setTimeout(()=>{
    $('#hskPanels').innerHTML = `
      <div class="hsk-panel active">
        <div class="hsk-info">
          <div class="badge" style="font-family:var(--ff-cn);font-size:30px">${ch}</div>
          <div class="txt"><b>คำศัพท์ที่มีอักษร “${ch}”</b><p>พบ ${words.length} คำในคลัง HSK ของเรา</p></div>
          <button class="btn btn-ghost btn-sm" onclick="go('chars')">← กลับไปหน้าอักษรจีน</button>
        </div>
        <div class="vocab-grid">${words.map(vocabCard).join('')}</div>
      </div>`;
    $$('#hskTabs .hsk-tab').forEach(t=>t.classList.remove('active'));
  }, 60);
}
