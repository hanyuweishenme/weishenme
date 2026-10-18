/* ==========================================================================
   为什么中文 · Page renderers
   ========================================================================== */
'use strict';

/* ==========================================================================
   DATA NORMALISATION
   ========================================================================== */
function allArticles(){
  const extra = DB.articles || [];
  /* บทความที่ "ลบ" ไว้จะถูกเก็บเป็น tombstone — ต้องกรองออกก่อนเสมอ */
  const hidden = {};
  extra.forEach(a => { if(a && a.__deleted && a.id) hidden[a.id] = 1; });
  const seen = {};
  const out = [];
  /* การควบคุมรายบทความโดยแอดมิน: ปิด → ซ่อนจากผู้ใช้ทั่วไป (แอดมินเห็นครบ) */
  const cfg = (DB.itemCfg && DB.itemCfg.articles) || {};
  const isAdm = (typeof adminIn !== 'undefined') && adminIn;
  [...DEFAULT_ARTICLES, ...ARTS, ...extra].forEach((a,i)=>{
    if(!a || a.__deleted) return;
    const id = a.id || ('x'+i);
    if(hidden[id]) return;
    if(seen[id]) return;
    seen[id] = 1;
    /* แอดมินปิดบทความ → ผู้ใช้ทั่วไปไม่เห็น (แอดมินเห็นครบ) */
    const ic = cfg[id];
    if(ic && ic.on === false && !isAdm) return;
    out.push(Object.assign({id, level: a.level||1, words: a.words||[], min: Math.max(1, Math.round((a.zh||'').length/38)), premiumItem: !!(ic && ic.premium)}, a, {id}));
  });
  return out;
}
function hskWordCount(){
  let n = 0;
  for(let i=1;i<=6;i++) n += (DB.hsk[i]||[]).length;
  return n;
}
function allWords(){
  const out = [];
  for(let i=1;i<=6;i++) (DB.hsk[i]||[]).forEach(w => out.push(Object.assign({lv:i}, w)));
  return out;
}

/* ==========================================================================
   HOME
   ========================================================================== */
function renderHome(){
  /* hero counters */
  const wc = hskWordCount();
  const arts = allArticles().length;
  const set = (sel, v) => { const e = $(sel); if(e) e.textContent = v; };
  set('#hmWords', wc.toLocaleString());
  set('#hmArticles', arts.toLocaleString());
  const sw = $('#statWords b'), sa = $('#statArticles b');
  if(sw){ sw.dataset.count = wc; sw.dataset.done=''; sw.textContent='0'; }
  if(sa){ sa.dataset.count = arts; sa.dataset.done=''; sa.textContent='0'; }

  /* continue-learning card */
  const u = currentUser();
  const cw = $('#homeContinue');
  if(u){
    regenHp(u);
    cw.style.display = '';
    const readN = (u.read||[]).length;
    const stars = Object.values(u.gameStars||{}).reduce((a,b)=>a+b,0);
    const est = hskEstimate(u);
    $('#homeContinueBox').innerHTML = `
      <div class="continue-card reveal">
        <div class="ic">${u.avatar}</div>
        <div class="txt">
          <b>ยินดีต้อนรับกลับมา คุณ${esc(u.name)} · Lv ${levelOf(u.xp)} ${levelTitle(levelOf(u.xp))}</b>
          <span>อ่านไปแล้ว ${readN} บทความ · เก็บดาวได้ ${stars} ดวง · จุดแข็งตอนนี้ประมาณ HSK ${est||'–'} · แต้มสะสม ${(u.points||0).toLocaleString()}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="go('profile')">ดูความก้าวหน้า</button>
        <button class="btn btn-primary btn-sm" onclick="go('games')">เล่นเกมต่อ</button>
      </div>`;
  } else {
    cw.style.display = 'none';
  }

  /* แบนเนอร์แผนการเรียน (AI) */
  if(u && u.curriculum && typeof renderHomePlanBanner === 'function') renderHomePlanBanner($('#homeContinueBox'));

  /* learning-path hubs */
  const hubs = [
    {cn:'讀', ic:TILE('book-open','gold'), t:'บทความสั้น', sub:'Reading', page:'articles',
     d:'บทอ่านภาษาจีน 3 ชั้น — ตัวจีน พินอิน และคำแปลไทย เลือกหมวดที่สนใจแล้วค่อยกดเข้าไปอ่านทีละบท',
     tags:['บทสนทนา','วัฒนธรรม','เรื่องเล่า'], n: arts+' บท'},
    {cn:'音', ic:TILE('music','red'), t:'พินอิน', sub:'เริ่มจากเสียง', page:'pinyin',
     d:'คอร์สสำหรับมือใหม่ — เสียงวรรณยุกต์ 4 เสียง ตารางพินอินพร้อมตัวอักษรตัวอย่าง และแบบฝึกฟังเสียง',
     tags:['ฟังเสียงได้','มีตัวอักษรตัวอย่าง'], n:'5 บทเรียน'},
    {cn:'考', ic:TILE('layers','brown'), t:'HSK', sub:'คำศัพท์ + ข้อสอบ', page:'hsk',
     d:'คลังคำศัพท์ HSK 1–6 พร้อมความหมายไทย และข้อสอบจำลอง 100 ข้อ 5 ชุดต่อระดับ — ชุดแรกทดลองฟรี',
     tags:['คำศัพท์','ข้อสอบ 100 ข้อ'], n: wc.toLocaleString()+' คำ'},
    {cn:'玩', ic:TILE('gamepad','gold'), t:'เกมภาษา', sub:'6 เกม · 6 ด่าน', page:'games',
     d:'เกมแบบด่าน ไล่จากง่ายไปยาก ฝึกเติมคำ จับคู่คำศัพท์ วรรณยุกต์ เรียงประโยค และอ่านจับใจความ',
     tags:['มี Level','มีดาว','มีแต้ม'], n:'6 เกม'},
    {cn:'字', ic:TILE('kanji','red'), t:'อักษรจีน 3,000', sub:'ตัวอักษร + ลำดับขีด', page:'chars',
     d:'อักษรใช้บ่อย 3,000 ตัว ตาม 通用规范汉字表 พร้อมลำดับขีดมาตรฐาน แบบฝึกเขียน และบทเรียน 8 ขีดพื้นฐาน',
     tags:['ลำดับขีด','ฝึกเขียน','ขีดพื้นฐาน'], n:'3,000 ตัว'},
    {cn:'掃', ic:TILE('scan','gold'), t:'สแกนอักษรจีน', sub:'OCR Scanner', page:'scan',
     d:'ถ่ายรูปหรืออัปโหลดภาพตัวอักษรจีน — อ่านเป็นข้อความ พร้อมพินอิน ความหมาย และ PDF ฝึกเขียน (พรีเมียม · ทดลองฟรี 3 ครั้ง)',
     tags:['ถ่ายรูปได้','PDF ฝึกเขียน'], n:'พรีเมียม'},
    {cn:'店', ic:ICON('shopping-bag'), t:'ร้านค้า', sub:'Shop', page:'shop',
     d:'หนังสือ บัตรคำ และสื่อการเรียนภาษาจีนที่เรากำลังเตรียมไว้ให้',
     tags:['กำลังจะเปิด'], n:'เร็ว ๆ นี้'},
    {cn:'贵', ic:ICON('crown'), t:'สมาชิกพรีเมียม', sub:'Premium', page:'premium',
     d:'ปลดล็อกข้อสอบจำลอง HSK ครบทุกระดับ และฝึกเขียนอักษรครบ 3,000 ตัว พร้อมสิทธิ์พิเศษอีกมากมาย',
     tags:['ข้อสอบ HSK 3–6','เขียนอักษรครบ'], n: isPremium(currentUser()) ? 'เปิดใช้งานแล้ว' : 'ดูแพ็กเกจ'},
    {cn:'我', ic:TILE('user','brown'), t:'บัญชีของฉัน', sub:'Progress', page: currentUser()?'profile':'login',
     d:'สมัครสมาชิกเพื่อสะสมแต้ม บันทึกสิ่งที่เรียน และดูว่าระดับจีนของคุณก้าวหน้าไปแค่ไหน',
     tags:['สะสมแต้ม','ติดตามพัฒนาการ'], n: currentUser()? 'Lv '+levelOf(currentUser().xp) : 'สมัครฟรี'}
  ];
  $('#homeHubs').innerHTML = hubs.map(h=>`
    <div class="hub reveal" onclick="go('${h.page}')">
      <div class="hub-top">
        <div class="cn-big">${h.cn}</div>
        <div class="ic">${h.ic}</div>
        <h3>${h.t}</h3>
        <div class="sub">${h.sub} · ${h.n}</div>
      </div>
      <div class="hub-body">
        <p>${h.d}</p>
        <div class="hub-tags">${h.tags.map(t=>`<span class="tag-pill">${t}</span>`).join('')}</div>
        <div class="hub-foot">
          <span class="go">เข้าไปดู →</span>
        </div>
      </div>
    </div>`).join('');

  /* HSK roadmap strip */
  const HSK_META = hskMeta();
  $('#homeHskStrip').innerHTML = `
    <div class="level-map">
      ${[1,2,3,4,5,6].map(n=>{
        const m = HSK_META[n];
        return `<div class="level-card reveal" onclick="go('hsklevel',${n})">
          <div class="no">HSK ${n}</div>
          <h4>${m.name}</h4>
          <p>${m.desc}</p>
          <div class="hub-tags">
            <span class="tag-pill red">${(DB.hsk[n]||[]).length} คำ</span>
            <span class="tag-pill">${m.words}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;

  /* daily word (ควบคุมจากหลังบ้าน) */
  const D = DB.daily || DEFAULT_DAILY;
  const dh = $('#dailyHeading'); if(dh) dh.textContent = D.heading || 'คำศัพท์ประจำวัน';
  const ds = $('#dailySub');     if(ds) ds.textContent = D.sub || '';
  const w = getDailyWord();
  $('#homeDailyWord').innerHTML = `
    <div class="daily-word reveal">
      <div class="dw-label">${w.pinned ? 'คำศัพท์ที่ปักหมุดไว้' : 'คำศัพท์ประจำวัน'}</div>
      <div style="text-align:center">
        <div class="dw-char">${esc(w.cn)}</div>
        <div class="dw-py">${esc(w.py||'')}</div>
      </div>
      <div>
        <div class="dw-th" style="font-size:19px;color:var(--brown-3);font-weight:600">${esc(w.th||'')}</div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          ${w.lv ? `<span class="tag-pill red">HSK ${w.lv}</span>` : ''}
          ${w.cat?`<span class="tag-pill gold">${esc(catLabel(w.cat))}</span>`:''}
          ${w.pinned?`<span class="tag-pill jade">📌 ปักหมุดโดยแอดมิน</span>`:''}
        </div>
        <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="speak('${esc(w.cn)}')">🔊 ฟังเสียง</button>
          ${w.lv ? `<button class="btn btn-ghost btn-sm" onclick="go('hsklevel',${w.lv})">ดูคำอื่นใน HSK ${w.lv} →</button>` : ''}
        </div>
      </div>
    </div>`;

  /* featured articles */
  $('#homeArticles').innerHTML = allArticles().slice(0,4).map(articleCard).join('');

  /* features */
  const feats = [
    {ic:TILE('music','red'), t:'พินอิน + คำอ่านไทยทุกคำ', d:'ไม่ต้องเดาว่าอ่านว่าอะไร — ทุกคำมีพินอิน และคำอ่านภาษาไทยกำกับให้ออกเสียงตามได้ทันที'},
    {ic:TILE('bar-chart','brown'), t:'ติดตามพัฒนาการได้', d:'ระบบบันทึกสิ่งที่คุณเรียน — แต้ม บทความ ดาว คะแนนสอบ และการเขียน — แล้วประเมินระดับ HSK ให้อัตโนมัติ'},
    {ic:TILE('unlock','gold'), t:'ปลดล็อกด่านไปเรื่อย ๆ', d:'เกมจะปลดล็อกด่านถัดไปเมื่อคุณผ่านด่านก่อนหน้า ทำให้เรียนจากง่ายไปยากอย่างเป็นขั้นเป็นตอน'},
    {ic:TILE('globe','brown'), t:'อ้างอิงมาตรฐานจีน', d:'รายการอักษรจีนและลำดับขีดอ้างอิงมาตรฐานกระทรวงศึกษาธิการจีน และคำศัพท์อิงระบบ HSK 1–6'}
  ];
  $('#homeFeatures').innerHTML = feats.map(f=>`
    <div class="card reveal" style="cursor:default">
      <div class="ic">${f.ic}</div>
      <h3>${f.t}</h3>
      <p>${f.d}</p>
    </div>`).join('');

  initCounters($('#page-home'));
}

/* ==========================================================================
   LEARN HUB
   ========================================================================== */
function renderLearn(){
  const u = currentUser();
  const wc = hskWordCount();
  const arts = allArticles().length;
  const tabs = $('#learnModeTabs');
  if(tabs){
    tabs.innerHTML = `
      <button class="hsk-mode-tab ${learnMode==='roadmap'?'active':''}" onclick="setLearnMode('roadmap');renderLearn()">${TILE('compass','brown')} เส้นทางการเรียน</button>
      <button class="hsk-mode-tab ${learnMode==='pinyin'?'active':''}" onclick="setLearnMode('pinyin');renderLearn()">${TILE('music','red')} คอร์สพินอิน</button>`;
  }
  const rw = $('#learnRoadmapWrap'), pw = $('#learnPinyinWrap');
  if(learnMode === 'pinyin'){
    if(rw) rw.style.display = 'none';
    if(pw){ pw.style.display = ''; renderPinyinHub(); }
    return;
  }
  if(rw) rw.style.display = '';
  if(pw) pw.style.display = 'none';
  $('#learnStats').innerHTML = `
    <div class="mini-stat"><b>${wc.toLocaleString()}</b><span>คำศัพท์ HSK</span></div>
    <div class="mini-stat"><b>${arts}</b><span>บทความ</span></div>
    <div class="mini-stat"><b>3,000</b><span>อักษรจีน</span></div>
    <div class="mini-stat"><b>${strokeChars().length}</b><span>อักษรพร้อมลำดับขีด</span></div>
    <div class="mini-stat"><b>${(typeof EXAM_SETS!=='undefined'?EXAM_SETS:5)}×${(typeof EXAM_TOTAL!=='undefined'?EXAM_TOTAL:100)}</b><span>ข้อสอบ HSK</span></div>`;

  /* -------- สรุปความชำนาญ + พัฒนาการ -------- */
  const est = hskEstimate(u);
  const trend = (u && u.estHistory && u.estHistory.length) ? u.estHistory : [];
  const trendHtml = trend.length ? trend.map((t,i)=>{
    return `<span class="tp ${i===trend.length-1?'cur':''}">${t.est||0}</span>`;
  }).join(' → ') : '';
  $('#learnSummary').innerHTML = u ? `
    <div class="rm-summary reveal in">
      <div class="rm-big">HSK ${est||0}</div>
      <div class="rm-txt">
        <b>ระดับความชำนาญของคุณตอนนี้</b>
        <span>ประเมินจากแต้ม บทความที่อ่าน ดาวจากเกม คะแนนสอบ และการเขียนอักษร — เรียนต่อแล้วกลับมาดูแถบด้านล่างขยับตาม</span>
        ${trendHtml?`<div style="margin-top:10px"><span style="font-size:11px;color:var(--text-3)">พัฒนาการของคุณ:&nbsp;</span><div class="rm-trend" style="display:inline-flex;vertical-align:middle">${trendHtml}</div></div>`:''}
      </div>
      <button class="btn btn-gold btn-sm" onclick="go('profile')">${ICON('user')} ดูโปรไฟล์เต็ม</button>
    </div>` : `
    <div class="rm-summary reveal in">
      <div class="rm-big">HSK 0</div>
      <div class="rm-txt">
        <b>เข้าสู่ระบบเพื่อติดตามพัฒนาการของคุณ</b>
        <span>ระบบจะบันทึกสิ่งที่คุณเรียนและประเมินระดับความชำนาญให้อัตโนมัติ — สมัครฟรี ใช้เวลาไม่ถึงนาที</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="go('login')">สมัคร / เข้าสู่ระบบ</button>
    </div>`;

  /* -------- เส้นทางการเรียน 6 ขั้น -------- */
  const pyStars = (u&&u.pinyin)?Object.values(u.pinyin.stars||{}).reduce((a,b)=>a+b,0):0;
  const writeN = u?Object.keys(u.writing||{}).length:0;
  const basicStars = u?Object.values(u.basic||{}).reduce((a,r)=>a+(r.stars||0),0):0;
  const lw = learnedWordCount(), lc = learnedCharCount();
  const readN = u?(u.read||[]).length:0;
  const stars = u?Object.values(u.gameStars||{}).reduce((a,b)=>a+b,0):0;
  const levelsPassed = u?Object.values(u.gameStars||{}).filter(v=>v>0).length:0;
  const examRecs = u&&u.exams?u.exams:null;
  let examSetsPassed = 0, examBestLv = 0;
  [1,2,3,4,5,6].forEach(n=>{
    const rec = examRecs && examRecs[n];
    if(rec && rec.sets){
      Object.values(rec.sets).forEach(s=>{ if(s && s.best>=60) examSetsPassed++; if(s && s.best>examBestLv) examBestLv = s.best; });
    }
  });

  const steps = [
    {no:1, ic:TILE('music','red'), t:'รู้จักเสียง — คอร์สพินอิน', page:'pinyin',
     d:'เสียงวรรณยุกต์ 4 เสียง ตารางพินอินพร้อมตัวอักษรตัวอย่าง และแบบฝึกฟังเสียง 5 บทเรียน',
     done: pyStars, max: 15, meta: pyStars + '/15 ดาว'},
    {no:2, ic:TILE('kanji','brown'), t:'จำอักษรจีน', page:'chars',
     d:'อักษรใช้บ่อย 3,000 ตัว พร้อมลำดับขีดและแบบฝึกเขียน — เริ่มจาก 8 ขีดพื้นฐานก่อนแล้วค่อยเขียนอักษรจริง',
     done: lc + Math.min(writeN, 100), max: 3100, meta: 'จำได้ '+lc+' ตัว · เขียน '+writeN+' ตัว · ขีดพื้นฐาน '+basicStars+'/24 ดาว'},
    {no:3, ic:TILE('layers','gold'), t:'สะสมคำศัพท์ HSK', page:'hsk',
     d:'คลังคำศัพท์ HSK 1–6 พร้อมความหมายไทย กด ✓ เมื่อจำได้เพื่อให้ระบบนับความคืบหน้าให้',
     done: lw, max: 6201, meta: lw+' / 6,201 คำ'},
    {no:4, ic:TILE('book-open','red'), t:'อ่านบทความทุกวัน', page:'articles',
     d:'บทอ่าน 3 ชั้น (จีน/พินอิน/ไทย) อ่านจบบทได้แต้ม — วันละบทก็เพียงพอ',
     done: readN, max: arts, meta: readN+' / '+arts+' บท'},
    {no:5, ic:TILE('gamepad','brown'), t:'เล่นเกมภาษาจนปลดล็อกทุกด่าน', page:'games',
     d:'6 เกม 36 ด่าน ไล่ความยากจาก HSK 1 ถึง HSK 6 เก็บดาวครบทุกด่านเพื่อความชำนาญรอบด้าน',
     done: stars, max: 108, meta: stars+'/108 ดาว · ผ่าน '+levelsPassed+'/36 ด่าน'},
    {no:6, ic:TILE('clipboard','gold'), t:'สอบจำลอง HSK 100 ข้อ', page:'hsk',
     d:'ชุดที่ 1 ทดลองฟรีทุกระดับ — สอบแล้วเฉลยทันที เก็บคะแนนสูงสุดไว้ดูพัฒนาการ',
     done: Math.min(examSetsPassed*8, 100), max: 100, meta: 'ผ่าน '+examSetsPassed+'/30 ชุด'+(examBestLv? ' · สูงสุด '+examBestLv+'%':'')}
  ];

  $('#learnRoadmap').innerHTML = steps.map(s=>{
    const pct = Math.min(100, Math.round(s.done/s.max*100));
    const isDone = pct >= 100;
    return `
    <div class="rm-step reveal ${isDone?'done':''}">
      <div class="rm-no">${isDone?'✓':s.no}</div>
      <div class="rm-body">
        <h3>${s.ic} ขั้นที่ ${s.no}: ${s.t}</h3>
        <p>${s.d}</p>
        <div class="rm-bar"><i style="width:${pct}%"></i></div>
        <div class="rm-meta"><span>${s.meta}</span><b>${pct}%</b></div>
      </div>
      <div class="rm-go"><button class="btn btn-ghost btn-sm" onclick="go('${s.page}')">เข้าไปเรียน →</button></div>
    </div>`;
  }).join('');
}

/* ==========================================================================
   ARTICLES — หน้าเดียวรวม "บทความอ่าน" + "บล็อก" (สลับด้วยแท็บ)
   ========================================================================== */
let artFilter = {cat:'ทั้งหมด', lv:0, q:''};
let currentHSK = 1;

function renderArticlesPage(){
  const tabs = $('#artModeTabs');
  if(tabs){
    tabs.innerHTML = `
      <button class="hsk-mode-tab ${artMode==='articles'?'active':''}" onclick="setArtMode('articles');renderArticlesPage()">${TILE('book-open','brown')} บทความอ่าน</button>
      <button class="hsk-mode-tab ${artMode==='dlg'?'active':''}" onclick="setArtMode('dlg');renderArticlesPage()">${TILE('users','gold')} บทสนทนา · 对话</button>
      <button class="hsk-mode-tab ${artMode==='history'?'active':''}" onclick="setArtMode('history');renderArticlesPage()">${TILE('landmark','red')} ประวัติศาสตร์ · 历史</button>
      <button class="hsk-mode-tab ${artMode==='blog'?'active':''}" onclick="setArtMode('blog');renderArticlesPage()">${TILE('pen-line','jade')} บล็อก · 博客</button>`;
  }
  const histBox = $('#historyBox');
  if(artMode === 'dlg'){
    const hub = $('#articleWrap'), blogW = $('#blogWrap'), dlgBox = $('#dlgArea');
    if(hub) hub.style.display = 'none';
    if(blogW) blogW.style.display = 'none';
    if(histBox) histBox.style.display = 'none';
    if(dlgBox) dlgBox.style.display = '';
    if(dlgBox) renderDialoguesHub();
    return;
  }
  if(artMode === 'history'){
    const hub = $('#articleWrap'), blogW = $('#blogWrap'), dlgBox = $('#dlgArea');
    if(hub) hub.style.display = 'none';
    if(blogW) blogW.style.display = 'none';
    if(dlgBox) dlgBox.style.display = 'none';
    if(histBox) histBox.style.display = '';
    renderHistoryHub();
    return;
  }
  const dlgBox2 = $('#dlgArea');
  if(dlgBox2) dlgBox2.style.display = 'none';
  if(histBox) histBox.style.display = 'none';
  const aw = $('#articleWrap'), bw = $('#blogWrap');
  if(artMode === 'blog'){
    if(aw) aw.style.display = 'none';
    const _h = $('#historyBox'), _d = $('#dlgArea');
    if(_h) _h.style.display = 'none';
    if(_d) _d.style.display = 'none';
    if(bw){ bw.style.display = ''; renderBlog(route.param); }
    return;
  }
  if(aw) aw.style.display = '';
  if(bw) bw.style.display = 'none';
  renderArticlesHub();
}

function renderArticlesHub(){
  const arts = allArticles();
  const cats = ['ทั้งหมด', ...Array.from(new Set(arts.map(a=>a.tag).filter(Boolean)))];
  $('#articleCats').innerHTML = `
    <div class="sec-head reveal" style="margin-bottom:26px">
      <div class="kicker">Choose a topic</div>
      <h2>เลือกหมวดที่อยากอ่าน</h2>
      <p>มีทั้งหมด ${arts.length} บท ใน ${cats.length-1} หมวด — แต่ละบทอ่านจบได้ใน 2–4 นาที</p>
    </div>
    <div class="hub-grid g3" style="margin-bottom:34px">
      ${cats.filter(c=>c!=='ทั้งหมด').map(c=>{
        const list = arts.filter(a=>a.tag===c);
        const ic = ({'บทสนทนาพื้นฐาน':'💬','ชีวิตประจำวัน':'🏠','วัฒนธรรม':'🏮','อาหาร':'🍜','การเดินทาง':'🚄','ธรรมชาติ':'🌿','อารมณ์':'💗','การเรียน':'📚','การทำงาน':'💼','เทคโนโลยี':'📱'})[c] || '📄';
        return `<div class="hub reveal" onclick="setArtCat('${c.replace(/'/g,"\\'")}')">
          <div class="hub-top" style="padding:20px 22px 16px">
            <div class="cn-big">${ic}</div>
            <h3 style="font-size:17px">${esc(c)}</h3>
            <div class="sub">${list.length} บท</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;

  $('#artLevelFilter').innerHTML =
    `<button class="chip ${!artFilter.lv?'active':''}" onclick="setArtLevel(0)">ทุกระดับ</button>` +
    [1,2,3,4,5,6].map(n=>`<button class="chip ${artFilter.lv===n?'active':''}" onclick="setArtLevel(${n})">HSK ${n}</button>`).join('');

  renderArticleList();
}
function setArtCat(c){ artFilter.cat = (artFilter.cat===c ? 'ทั้งหมด' : c); renderArticleList(); toast('หมวด: '+artFilter.cat); }
function setArtLevel(n){ artFilter.lv = n; $$('#artLevelFilter .chip').forEach((c,i)=>c.classList.toggle('active', i===(n?n:0))); renderArticleList(); }
function renderArticleList(){
  const box = $('#articleList'); if(!box) return;
  const q = ($('#artSearch')?.value || '').trim().toLowerCase();
  let list = allArticles();
  if(artFilter.cat !== 'ทั้งหมด') list = list.filter(a=>a.tag===artFilter.cat);
  if(artFilter.lv) list = list.filter(a=>(a.level||1)===artFilter.lv);
  if(q) list = list.filter(a => ((a.title||'')+(a.zh||'')+(a.th||'')+(a.tag||'')).toLowerCase().includes(q));
  box.innerHTML = list.map(articleCard).join('');
  const emp = $('#articleEmpty'); if(emp) emp.style.display = list.length? 'none':'';
  observeReveals();
}
function articleCard(a){
  if(a.premiumItem && !isPremium(currentUser())) return `
    <div class="article-card locked" onclick="showArticlePaywall('${esc(a.id)}')">
      <div class="ac-top"><span class="tag-pill">${esc(a.tag||'')}</span><span class="tag-pill gold">${ICON('crown')} พรีเมียม</span></div>
      <h3>${esc(a.title)}</h3>
      <p>${esc((a.th||'').slice(0,80))}…</p>
      <span class="go">🔒 ปลดล็อกด้วยพรีเมียม →</span>
    </div>`;
  const read = (currentUser()?.read||[]).includes(a.id);
  return `<article class="article reveal" onclick="go('article','${a.id}')">
    <span class="tag">${esc(a.tag||'บทความ')}</span>
    ${read?'<span class="tag" style="background:rgba(74,124,111,.14);color:var(--jade)">✓ อ่านแล้ว</span>':''}
    <h3>${esc(a.title)}</h3>
    <div class="zh">${esc((a.zh||'').split('\n')[0])}</div>
    <div class="th">${esc((a.th||'').split('\n')[0])}</div>
    <div class="meta">
      <span>📖 ${a.min||2} นาที</span>
      <span>🀄 HSK ${a.level||1}</span>
      <span>${(a.zh||'').length} ตัวอักษร</span>
      <span class="read">อ่านต่อ →</span>
    </div>
  </article>`;
}

function showArticlePaywall(id){
  glassPop({
    icon: 'crown',
    title: 'บทความพรีเมียม',
    body: '<p style="margin:0">บทความนี้ถูกกำหนดเป็นเนื้อหาพรีเมียมโดยผู้ดูแลเว็บ — สมัครสมาชิกเพื่ออ่านได้ทุกบทความ</p>',
    actions: [
      {label:'ปิด', cls:'btn-ghost', fn: closeGlassPop},
      {label:'ดูแพ็กเกจพรีเมียม', cls:'btn-gold', fn: function(){ closeGlassPop(); go('premium'); }}
    ]
  });
}
function renderArticleReader(id){
  const a = allArticles().find(x=>x.id===String(id)) || allArticles()[0];
  const box = $('#articleReader'); if(!a){ box.innerHTML = '<div class="empty">ไม่พบบทความ</div>'; return; }
  /* บทความพรีเมียม → ต้องเป็นสมาชิก */
  if(a.premiumItem && !isPremium(currentUser()) && !adminIn){
    box.innerHTML = `
      <a class="back-link" onclick="go('articles')">← กลับไปหน้าบทความ</a>
      <div class="empty" style="padding:70px 20px">
        <span class="ic">${ICON('crown')}</span>
        <h3 style="margin:10px 0 4px">บทความพรีเมียม</h3>
        <p style="font-size:13px;color:var(--text-3)">ผู้ดูแลเว็บกำหนดให้บทความนี้สำหรับสมาชิกพรีเมียมเท่านั้น</p>
        <button class="btn btn-gold btn-sm" style="margin-top:10px" onclick="go('premium')">ดูแพ็กเกจพรีเมียม</button>
      </div>`;
    return;
  }
  const u = currentUser();
  const isRead = u && (u.read||[]).includes(a.id);
  const idx = allArticles().findIndex(x=>x.id===a.id);
  const list = allArticles();
  const next = list[idx+1], prev = list[idx-1];

  box.innerHTML = `
    <a class="back-link" onclick="go('articles')">← กลับไปหน้าบทความ</a>
    <div class="reader">
      <span class="tag" style="display:inline-block;font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;background:rgba(178,58,46,.1);color:var(--red);margin-bottom:12px">${esc(a.tag||'บทความ')}</span>
      <h1>${esc(a.title)}</h1>
      <div class="reader-meta">
        <span>🀄 HSK ${a.level||1}</span><span>📖 ${a.min||2} นาที</span>
        <span>${(a.zh||'').length} ตัวอักษร</span>
        ${isRead?'<span style="color:var(--jade);font-weight:600">✓ อ่านแล้ว</span>':''}
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px">
        <button class="btn btn-ghost btn-sm" onclick="speak(${JSON.stringify(a.zh||'')})">🔊 ฟังเสียงอ่าน</button>
        <button class="btn btn-ghost btn-sm" onclick="toggleVoice()">🔈 เปิด/ปิดเสียงทั้งเว็บ</button>
        ${u?`<button class="btn btn-primary btn-sm" onclick="markRead('${a.id}')">${isRead?'✓ อ่านแล้ว':'ทำเครื่องหมายว่าอ่านจบ (+แต้ม)'}</button>`
            :`<button class="btn btn-primary btn-sm" onclick="go('login')">เข้าสู่ระบบเพื่อเก็บแต้ม</button>`}
      </div>

      <h4>ตัวจีน · 汉字</h4>
      <div class="cn-body">${(a.zh||'').split('\n').map(l=>`<div>${esc(l)}</div>`).join('')}</div>

      ${a.py?`<h4>พินอิน · 拼音</h4><div class="py-body">${(a.py||'').split('\n').map(l=>`<div>${esc(l)}</div>`).join('')}</div>`:''}

      ${a.th?`<h4>คำแปลไทย · 泰文</h4><div class="th-body">${(a.th||'').split('\n').map(l=>`<div>${esc(l)}</div>`).join('')}</div>`:''}

      ${(a.words&&a.words.length)?`<h4>คำศัพท์น่ารู้ในบทนี้</h4>
        <div class="word-chips">
          ${a.words.map(w=>Array.isArray(w)
            ? `<div class="word-chip" onclick="speak('${w[0]}')"><b>${esc(w[0])}</b><i>${esc(w[1]||'')}</i>${esc(w[2]||'')}</div>`
            : `<div class="word-chip"><b>${esc(w.cn)}</b><i>${esc(w.py||'')}</i>${esc(w.th||'')}</div>`).join('')}
        </div>`:''}

      <hr>
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        ${prev?`<button class="btn btn-ghost btn-sm" onclick="go('article','${prev.id}')">← ${esc(prev.title)}</button>`:'<span></span>'}
        ${next?`<button class="btn btn-ghost btn-sm" onclick="go('article','${next.id}')">${esc(next.title)} →</button>`:''}
      </div>
    </div>`;
  if(u && !isRead && (a.min||2) <= 1) markRead(a.id, true);
}
function markRead(id, silent){
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนเพื่อเก็บแต้ม'); return; }
  u.read = u.read || [];
  if(u.read.includes(id)){ if(!silent) toast('บทนี้บันทึกไว้แล้ว'); return; }
  u.read.push(id);
  award(u, 15, 30, 'read', 'อ่านบทความ: ' + (allArticles().find(a=>a.id===id)?.title||''));
  checkBadges(u);
  saveUsers();
  toast('+15 แต้ม · +30 XP 🎉');
  renderRoute();
}

/* ==========================================================================
   HSK
   ========================================================================== */
function hskMeta(){
  /* อัปเดตตามมาตรฐานใหม่ 国际中文教育中文水平等级标准 (HSK 3.0) */
  return {
    1:{name:'ระดับเริ่มต้น', desc:'คำทักทาย ตัวเลข ครอบครัว และคำพื้นฐานในชีวิตประจำวัน', words:'500 คำ'},
    2:{name:'ระดับพื้นฐาน', desc:'ประโยคสั้นในชีวิตประจำวัน เวลา ทิศทาง และคำบอกความรู้สึกง่าย ๆ', words:'772 คำ'},
    3:{name:'ระดับกลางต้น', desc:'การสนทนาทั่วไปในชีวิต การเดินทาง โรงเรียน และการทำงาน', words:'973 คำ'},
    4:{name:'ระดับกลาง', desc:'การอธิบายเหตุผล แสดงความคิดเห็น และเล่าเรื่องต่อเนื่อง', words:'1,000 คำ'},
    5:{name:'ระดับกลางสูง', desc:'ภาษาข่าว บทความ และการอภิปรายเชิงนามธรรม', words:'1,071 คำ'},
    6:{name:'ระดับสูง', desc:'ภาษาเชิงวิชาการ สำนวน สำคัญ และภาษาระดับเจ้าของภาษา', words:'1,140 คำ'}
  };
}
function renderHSK(){
  const meta = hskMeta();
  const u = currentUser();
  const est = hskEstimate(u);
  const modeBox = $('#hskModeTabs');
  if(modeBox){
    modeBox.innerHTML = `
      <button class="hsk-mode-tab ${hskMode==='vocab'?'active':''}" onclick="setHskMode('vocab');renderHSK()">${TILE('layers','brown')} คลังคำศัพท์ HSK 1–6</button>
      <button class="hsk-mode-tab ${hskMode==='exam'?'active':''}" onclick="setHskMode('exam');renderHSK()">${TILE('clipboard','red')} ข้อสอบจำลอง 100 ข้อ</button>`;
  }
  const vocabWrap = $('#hskVocabWrap'), examWrap = $('#hskExamWrap');
  if(hskMode === 'exam'){
    if(vocabWrap) vocabWrap.style.display = 'none';
    if(examWrap) examWrap.style.display = '';
    renderExamsHub();
    return;
  }
  if(vocabWrap) vocabWrap.style.display = '';
  if(examWrap){ examWrap.style.display = 'none'; const ep = $('#examPlay'); if(ep) ep.innerHTML = ''; }
  const box = $('#hskProgressBox');
  if(box){
    box.innerHTML = `
      <div class="continue-card reveal" style="margin-bottom:30px">
        <div class="ic">${u?u.avatar:'🎯'}</div>
        <div class="txt">
          <b>${u? 'ระดับประเมินของคุณตอนนี้: HSK '+(est||'–') : 'ยังไม่ได้เข้าสู่ระบบ'}</b>
          <span>${u? 'ประเมินจากแต้มสะสม บทความที่อ่าน และดาวจากเกม — เรียนต่ออีกนิดระดับจะขยับขึ้นเอง'
                 : 'เข้าสู่ระบบเพื่อให้ระบบประเมินระดับภาษาจีนของคุณ และบันทึกความก้าวหน้าไว้ดูได้ตลอด'}</span>
        </div>
        ${u? `<button class="btn btn-ghost btn-sm" onclick="go('profile')">ดูรายละเอียด</button>`
            : `<button class="btn btn-primary btn-sm" onclick="go('login')">เข้าสู่ระบบ</button>`}
      </div>`;
  }

  $('#hskTabs').innerHTML = [1,2,3,4,5,6].map(n=>{
    const c = (DB.hsk[n]||[]).length;
    return `<button class="hsk-tab ${n===currentHSK?'active':''}" onclick="setHSK(${n})">HSK ${n} <span style="opacity:.7;font-size:12px">(${c})</span></button>`;
  }).join('');

  $('#hskPanels').innerHTML = [1,2,3,4,5,6].map(n=>`
    <div class="hsk-panel ${n===currentHSK?'active':''}" id="hsk-panel-${n}">
      <div class="hsk-info">
        <div class="badge">${n}</div>
        <div class="txt">
          <b>HSK ${n} · ${meta[n].name}</b>
          <p>${meta[n].desc} · มีคำศัพท์ในระบบ ${(DB.hsk[n]||[]).length} คำ</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="go('hsklevel',${n})">เปิดหน้าหลัก HSK ${n} →</button>
      </div>
      <div class="vocab-grid">
        ${(DB.hsk[n]||[]).slice(0,60).map(vocabCard).join('') || '<p style="grid-column:1/-1;text-align:center;color:var(--text-2)">ยังไม่มีคำศัพท์</p>'}
      </div>
      ${(DB.hsk[n]||[]).length>60?`<div style="text-align:center;margin-top:24px">
        <button class="btn btn-ghost" onclick="go('hsklevel',${n})">ดูทั้งหมด ${(DB.hsk[n]||[]).length} คำ →</button></div>`:''}
    </div>`).join('');
}
function vocabCard(v){
  const on = isWordLearned(v.cn);
  return `<div class="vocab ${on?'learned':''}" onclick="speak('${v.cn}')">
    <div class="speak">${ICON('volume-2')}</div>
    <button class="char-learn ${on?'on':''}" title="${on?'กดเพื่อเลิกจำ':'กดเมื่อจำได้แล้ว'}" onclick="toggleWordLearned('${v.cn.replace(/'/g,"\\'")}',event)">${on?'✓':'+'}</button>
    <div class="cn">${esc(v.cn)}</div>
    <div class="py">${esc(v.py||'')}</div>
    <div class="th">${esc(v.th||'')}</div>
    ${v.cat?`<div style="font-size:9.5px;color:var(--brown-2);margin-top:4px;font-weight:600"># ${esc(v.cat)}</div>`:''}
    ${v.v3?'<div style="font-size:9.5px;color:var(--jade);margin-top:2px;font-weight:700">新标准</div>':''}
  </div>`;
}
function setHSK(n){
  currentHSK = n;
  $$('#hskTabs .hsk-tab').forEach((t,i)=>t.classList.toggle('active', i===n-1));
  $$('.hsk-panel').forEach(p=>p.classList.remove('active'));
  $('#hsk-panel-'+n)?.classList.add('active');
}

let hskLevelPage = {n:1, page:1, per:120, cat:'ทั้งหมด'};
function renderHskLevelPage(n){
  n = n || 1;
  hskLevelPage.n = n; hskLevelPage.page = 1;
  const meta = hskMeta();
  const list = DB.hsk[n] || [];
  const cats = ['ทั้งหมด', ...Array.from(new Set(list.map(w=>w.cat).filter(Boolean)))];
  const u = currentUser();
  const est = hskEstimate(u);

  $('#hskLevelDetail').innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('hsk')">HSK</a> <span class="sep">›</span> <span>HSK ${n}</span></div>

    <div class="page-hero" style="padding:10px 0 26px">
      <div class="cn-watermark">${['一','二','三','四','五','六'][n-1]}</div>
      <h1 class="cn-title">HSK ${n} · ${meta[n].name}</h1>
      <p class="sub">${meta[n].desc}</p>
      <div class="pill-row" style="margin-top:16px">
        <span class="tag-pill red">${list.length} คำในระบบ</span>
        <span class="tag-pill gold">ทั้งหลักสูตรประมาณ ${meta[n].words}</span>
        ${u?`<span class="tag-pill jade" id="hskLearnedPill">✓ จำได้แล้ว ${learnedWordCount()} คำ</span>`:''}
        ${u?`<span class="tag-pill jade">ระดับประเมินของคุณ: HSK ${est||'–'}</span>`:''}
      </div>
    </div>

    <div class="panel">
      <h3>หน้านี้คืออะไร</h3>
      <p style="font-size:14.5px;color:var(--text-2)">
        หน้านี้รวบรวมคำศัพท์ของระดับ <b>HSK ${n}</b> ทั้งหมดที่เรามีในระบบ
        แต่ละคำมีพินอิน คำอ่านไทย และความหมาย — <b>คลิกที่การ์ดคำศัพท์เพื่อฟังเสียงอ่าน</b>
        ถ้ายังไม่แน่ใจว่าจะเริ่มตรงไหน ลองทำ <a onclick="go('games')" style="color:var(--red);font-weight:600;cursor:pointer">แบบทดสอบในเกมภาษา</a>
        เพื่อวัดระดับก่อนก็ได้
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
        <button class="btn btn-primary btn-sm" onclick="startVocabQuiz(${n})">${ICON('target')} ทดสอบคำศัพท์ระดับนี้</button>
        <button class="btn btn-gold btn-sm" onclick="go('exams')">${ICON('clipboard')} ข้อสอบจำลอง HSK ${n}</button>
        <button class="btn btn-ghost btn-sm" onclick="go('games')">ไปหน้าเกมภาษา</button>
        ${n<6?`<button class="btn btn-ghost btn-sm" onclick="go('hsklevel',${n+1})">ระดับถัดไป HSK ${n+1} →</button>`:''}
      </div>
    </div>

    <div class="char-toolbar" style="position:static;margin:24px 0 18px">
      <input class="search-in" id="hskSearch" placeholder="🔍 ค้นหาคำศัพท์ พินอิน หรือความหมาย" oninput="filterHskLevel()">
      <div class="char-filters" id="hskCatFilter">
        ${cats.map(c=>`<button class="chip ${c===hskLevelPage.cat?'active':''}" onclick="hskLevelPage.cat='${c.replace(/'/g,"\\'")}';renderHskLevelGrid()">${esc(c)}</button>`).join('')}
      </div>
    </div>
    <div class="char-count" id="hskLevelCount"></div>
    <div class="vocab-grid" id="hskLevelGrid"></div>
    <div class="load-more" id="hskLevelMore"></div>`;
  renderHskLevelGrid();
}
function filterHskLevel(){ hskLevelPage.page = 1; renderHskLevelGrid(); }
function hskFiltered(){
  const list = DB.hsk[hskLevelPage.n] || [];
  const q = ($('#hskSearch')?.value || '').trim().toLowerCase();
  return list.filter(w=>{
    if(hskLevelPage.cat !== 'ทั้งหมด' && w.cat !== hskLevelPage.cat) return false;
    if(!q) return true;
    return ((w.cn||'')+(w.py||'')+(w.th||'')+(w.cat||'')).toLowerCase().includes(q);
  });
}
function renderHskLevelGrid(){
  const all = hskFiltered();
  const show = all.slice(0, hskLevelPage.page * hskLevelPage.per);
  $('#hskLevelCount').textContent = `แสดง ${show.length} จาก ${all.length} คำ`;
  $('#hskLevelGrid').innerHTML = show.map(vocabCard).join('') || '<div class="empty" style="grid-column:1/-1"><span class="ic">🔍</span>ไม่พบคำศัพท์ที่ตรงกับเงื่อนไข</div>';
  $('#hskLevelMore').innerHTML = show.length < all.length
    ? `<button class="btn btn-ghost" onclick="hskLevelPage.page++;renderHskLevelGrid()">แสดงเพิ่ม (เหลืออีก ${all.length-show.length} คำ)</button>` : '';
  $$('#hskCatFilter .chip').forEach(c=>c.classList.toggle('active', c.textContent===hskLevelPage.cat));
}

/* ==========================================================================
   SHOP — luxury boutique
   ========================================================================== */
function renderShop(){
  const S = DB.settings;

  /* ร้านเหรียญ為錢 (ก่อนส่วนสินค้า) */
  const coinBox = $('#coinShopBox');
  if(coinBox && typeof renderCoinShop === 'function') coinBox.innerHTML = renderCoinShop();

  /* hero */
  const hero = $('#shopHero');
  if(hero){
    const n = (DB.products||[]).length;
    hero.innerHTML = `
      <div class="in">
        <div class="kicker">精选商店 · Boutique</div>
        <h2>${esc(S.shopTitle || 'ร้านค้า · 商店')}</h2>
        <div class="gold-line"></div>
        <p>${esc(S.shopSubtitle || 'คัดสรรสื่อการเรียนภาษาจีนคุณภาพ — หนังสือ บัตรคำ และของสะสมสไตล์จีน สำหรับคนที่อยากเรียนจีนอย่างจริงจัง')}</p>
        <div style="display:flex;gap:22px;flex-wrap:wrap;margin-top:22px">
          <div><b style="font-family:var(--ff-num);font-size:28px;color:var(--gold-2)">${n}</b>
            <div style="font-size:11.5px;color:rgba(246,236,216,.62);letter-spacing:1px">รายการสินค้า</div></div>
          <div><b style="font-family:var(--ff-num);font-size:28px;color:var(--gold-2)">${(S.contact||[]).filter(c=>c.value).length}</b>
            <div style="font-size:11.5px;color:rgba(246,236,216,.62);letter-spacing:1px">ช่องทางติดต่อ</div></div>
          <div><b style="font-family:var(--ff-num);font-size:28px;color:var(--gold-2)">24/7</b>
            <div style="font-size:11.5px;color:rgba(246,236,216,.62);letter-spacing:1px">สอบถามได้ตลอด</div></div>
        </div>
      </div>`;
  }

  /* products */
  const grid = $('#shopGrid');
  const list = DB.products || [];
  if(grid){
    grid.innerHTML = list.length ? list.map((p,i)=>`
      <div class="product reveal ${p.soldOut?'shop-sold-out':''}">
        ${p.tag?`<span class="badge-lux">${esc(p.tag)}</span>`:''}
        <div class="thumb">${p.img
          ? `<img src="${p.img}" alt="${esc(p.name)}">`
          : `<span class="ph">${esc((p.name||'商')[0])}</span>`}</div>
        <div class="body">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.desc||'')}</p>
          <div class="price">฿${(+p.price||0).toLocaleString()}<small>${p.unit?esc(p.unit):''}</small></div>
          <button class="buy" onclick="buyProduct(${i})">${p.soldOut?'สินค้าหมด':'สนใจ · ติดต่อสอบถาม'}</button>
          <div class="meta-line">
            ${p.stock!=null&&p.stock!==''?`<span>📦 คงเหลือ ${esc(String(p.stock))}</span>`:''}
            ${p.sku?`<span>🔖 ${esc(p.sku)}</span>`:''}
          </div>
        </div>
      </div>`).join('')
      : `<div class="empty" style="grid-column:1/-1"><span class="ic">🛍️</span>ยังไม่มีสินค้า — เพิ่มได้ที่หน้า ⚙ หลังบ้าน</div>`;
  }

  renderContact();
  renderSocial();
  observeReveals();
}
function buyProduct(i){
  const p = (DB.products||[])[i]; if(!p) return;
  const S = DB.settings;
  const contact = (S.contact||[]).filter(c=>c.value);
  if(!contact.length){ toast('สนใจสินค้านี้ — แจ้งช่องทางติดต่อได้ที่หลังบ้าน'); go('shop'); return; }
  const c = contact[0];
  toast('สนใจ “'+p.name+'” — ติดต่อ '+c.label+': '+c.value);
}


/* ==========================================================================
   CUSTOM PAGE RENDERER  (page builder)
   ========================================================================== */
function blockStyle(b){
  let st = '';
  if(b.bg)        st += 'background:' + b.bg + ';';
  if(b.color)     st += 'color:' + b.color + ';';
  if(b.pad != null)   st += 'padding:' + (+b.pad) + 'px;';
  if(b.radius != null) st += 'border-radius:' + (+b.radius) + 'px;';
  if(b.align)     st += 'text-align:' + b.align + ';';
  return st ? (' style="' + st + '"') : '';
}
function inlineTextStyle(b){
  let st = '';
  if(b.color)    st += 'color:' + b.color + ';';
  if(b.size)     st += 'font-size:' + (+b.size) + 'px;';
  if(b.weight)   st += 'font-weight:' + (+b.weight) + ';';
  if(b.lh)       st += 'line-height:' + (+b.lh) + ';';
  if(b.align)    st += 'text-align:' + b.align + ';';
  if(b.font && b.font !== 'th') st += 'font-family:var(--ff-' + b.font + ');';
  return st ? (' style="' + st + '"') : '';
}
function renderBlock(b){
  if(!b || b.hidden) return '';
  const st = blockStyle(b);
  const its = inlineTextStyle(b);
  const multiline = t => String(t||'').split('\n').map(l => `<div>${esc(l) || '&nbsp;'}</div>`).join('');

  switch(b.type){
    case 'heading':
      return `<div class="pb-wrap"${st}><h2 class="pb-heading"${its}>${esc(b.text||'')}</h2></div>`;
    case 'text':
      return `<div class="pb-wrap"${st}><div class="pb-text"${its}>${multiline(b.text)}</div></div>`;
    case 'quote':
      return `<div class="pb-wrap"${st}><div class="pb-quote"${its}>${multiline(b.text)}</div></div>`;
    case 'button': {
      const link = b.link || '';
      const onclick = link ? (link.indexOf('http') === 0
          ? `window.open('${esc(link)}','_blank')`
          : `go('${esc(basePage(link))}'${link.indexOf('=') > -1 ? `,'${esc(link.split('=').slice(1).join('='))}'` : ''})`)
        : `toast('ยังไม่ได้ตั้งลิงก์')`;
      const cls = {primary:'btn-primary', ghost:'btn-ghost', gold:'btn-gold'}[b.style] || 'btn-primary';
      return `<div class="pb-wrap"${st}><button class="btn ${cls} ${b.full?'btn-block':''}" onclick="${onclick}">${esc(b.label||'ปุ่ม')}</button></div>`;
    }
    case 'buttons':
      return `<div class="pb-wrap"${st}><div class="btn-row" style="justify-content:${b.align==='center'?'center':(b.align==='right'?'flex-end':'flex-start')}">`
        + (b.items||[]).map(it => {
            const link = it.link || '';
            const onclick = link ? (link.indexOf('http') === 0
                ? `window.open('${esc(link)}','_blank')`
                : `go('${esc(basePage(link))}'${link.indexOf('=') > -1 ? `,'${esc(link.split('=').slice(1).join('='))}'` : ''})`)
              : `toast('ยังไม่ได้ตั้งลิงก์')`;
            const cls = {primary:'btn-primary', ghost:'btn-ghost', gold:'btn-gold'}[it.style] || 'btn-primary';
            return `<button class="btn ${cls}" onclick="${onclick}">${esc(it.label||'ปุ่ม')}</button>`;
          }).join('')
        + `</div></div>`;
    case 'image': {
      if(!b.src) return `<div class="pb-wrap"${st}><div class="pb-img-empty">🖼️ ยังไม่ได้เลือกรูป</div></div>`;
      const h = b.height ? ('height:' + (+b.height) + 'px;object-fit:' + (b.fit||'cover') + ';') : '';
      const wide = b.full ? 'width:100%;' : ('max-width:' + (+b.width||900) + 'px;');
      return `<div class="pb-wrap"${st}>`
        + (b.link ? `<a href="${esc(b.link)}" target="_blank" rel="noopener">` : '')
        + `<img class="pb-img" src="${b.src}" alt="${esc(b.alt||'')}" style="${wide}${h}${b.radius!=null?('border-radius:'+(+b.radius)+'px;'):''}display:block;margin:${b.align==='center'?'0 auto':(b.align==='right'?'0 0 0 auto':'0')}">`
        + (b.caption ? `<div class="pb-caption"${its}>${esc(b.caption)}</div>` : '')
        + (b.link ? `</a>` : '')
        + `</div>`;
    }
    case 'columns': {
      const cols = (b.items && b.items.length) ? b.items : [{text:''},{text:''}];
      const ratio = b.ratio || '1-1';
      const fr = ratio === '1-2' ? '1fr 2fr' : ratio === '2-1' ? '2fr 1fr' : '1fr 1fr';
      return `<div class="pb-wrap"${st}><div class="pb-cols" style="grid-template-columns:${fr};gap:${(+b.gap||22)}px">`
        + cols.map(c => `<div class="pb-col" style="background:${c.bg||'transparent'};padding:${c.pad!=null?(+c.pad):18}px;border-radius:${c.radius!=null?(+c.radius):14}px;text-align:${c.align||'left'}">`
            + (c.img ? `<img src="${c.img}" style="width:100%;border-radius:10px;margin-bottom:12px">` : '')
            + (c.title ? `<h3 class="pb-heading" style="font-size:18px;margin-bottom:8px;color:${c.color||'var(--brown-3)'}">${esc(c.title)}</h3>` : '')
            + `<div class="pb-text" style="color:${c.color||'inherit'}">${multiline(c.text)}</div>`
          + `</div>`).join('')
        + `</div></div>`;
    }
    case 'cards': {
      const items = b.items || [];
      return `<div class="pb-wrap"${st}><div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(${b.colWidth||230}px,1fr))">`
        + items.map(c => `<div class="card" style="cursor:default${c.bg?(';background:'+c.bg):''}${c.color?(';color:'+c.color):''}">`
            + (c.icon ? `<div class="ic">${esc(c.icon)}</div>` : '')
            + (c.img ? `<img src="${c.img}" style="width:100%;border-radius:12px;margin-bottom:14px">` : '')
            + (c.title ? `<h3>${esc(c.title)}</h3>` : '')
            + `<p${c.color?` style="color:${c.color}"`:''}>${esc(c.desc||'')}</p>`
            + (c.link ? `<span class="go" onclick="go('${esc(basePage(c.link))}')">เปิดดู →</span>` : '')
          + `</div>`).join('')
        + `</div></div>`;
    }
    case 'spacer': {
      const h = {sm:16, md:40, lg:72, xl:110}[b.size] || 40;
      return `<div style="height:${h}px"></div>`;
    }
    case 'divider':
      return `<div class="pb-wrap"${st}><div class="pb-divider"></div></div>`;
    case 'html':
      return `<div class="pb-wrap"${st}>${b.text||''}</div>`;
    default:
      return '';
  }
}
function renderCustomPage(id){
  const pg = findPage(id);
  const box = $('#customPageView');
  const isAdmin = adminIn === true;
  /* หน้าที่ซ่อนไว้: ผู้ดูแลยังเห็นได้ (ตอนกำลังทำ) แต่ผู้เยี่ยมชมเห็นว่าไม่พบ */
  if(!pg || (pg.show === false && !isAdmin)){ if(box) box.innerHTML = '<div class="empty"><span class="ic">🚧</span>ไม่พบหน้านี้</div>'; return; }
  const blocks = (pg.blocks||[]).filter(b => !b.hidden);
  const body = pg.fullWidth ? blocks.map(renderBlock).join('')
    : `<div class="wrap">${blocks.map(renderBlock).join('')}</div>`;
  box.innerHTML = `
    <div class="page-hero">
      <div class="cn-watermark">${esc(pg.watermark || (pg.title||'頁')[0] || '頁')}</div>
      <div class="wrap">
        <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span> <span>${esc(pg.title||'')}</span></div>
        <h1 class="cn-title">${esc(pg.heading || pg.title || '')}</h1>
        ${pg.sub ? `<p class="sub">${esc(pg.sub)}</p>` : ''}
      </div>
    </div>
    ${body}
    <div style="height:60px"></div>`;
  observeReveals();
  initCounters(box);
}
function blockLabel(b){
  const t = BLOCK_TYPES.filter(x => x.id === b.type)[0];
  const label = t ? (t.ic + ' ' + t.name) : b.type;
  const preview = b.text || b.label || (b.items ? (b.items.length + ' รายการ') : (b.src ? 'มีรูป' : ''));
  return { label, preview: String(preview).replace(/\n/g,' ').slice(0,42) };
}

/* ==========================================================================
   BLOG — public reading view
   ========================================================================== */
function renderBlog(postId){
  const box = $('#blogView'); if(!box) return;
  if(postId){
    const p = findBlogPost(postId);
    if(!p){ box.innerHTML = '<div class="empty">ไม่พบบทความนี้</div>'; return; }
    const body = (p.body||'').split('\n').map(function(l){
      const t = l.trim();
      if(!t) return '';
      if(t.slice(0,2) === '# ') return '<h2 class="pb-heading" style="margin:22px 0 10px">' + esc(t.slice(2)) + '</h2>';
      if(t.slice(0,2) === '- ') return '<div class="pb-text" style="padding-left:18px">• ' + esc(t.slice(2)) + '</div>';
      let out = t;
      out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      return '<p class="pb-text" style="margin:0 0 12px">' + out + '</p>';
    }).join('');
    box.innerHTML = `
      <div style="padding-top:10px">
        <a class="back-link" onclick="go('articles')">← กลับไปหน้าบทความ</a>
        <div class="reader">
          ${p.cover ? `<img src="${p.cover}" style="width:100%;max-height:320px;object-fit:cover;border-radius:var(--radius-s);margin-bottom:20px">` : ''}
          <h1>${esc(p.title)}</h1>
          <div class="reader-meta">
            <span>✍️ ${fmtDate(p.ts)}</span>
            ${(p.tags||[]).map(function(t){ return '<span class="tag-pill gold">#' + esc(t) + '</span>'; }).join('')}
          </div>
          <hr style="border:none;border-top:1px solid var(--line);margin:18px 0">
          <div style="font-size:16.5px;color:var(--text);line-height:2.05">${body}</div>
          <hr>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center">
            <button class="btn btn-ghost btn-sm" onclick="go('blog')">← บทความทั้งหมด</button>
            <button class="btn btn-primary btn-sm" onclick="speak(${JSON.stringify(p.title)})">🔊 ฟังหัวข้อ</button>
          </div>
        </div>
      </div>`;
    return;
  }
  const posts = allBlogPosts().filter(function(p){ return p.status === 'published' || adminIn; });
  box.innerHTML = `
    <div class="sec-head reveal" style="margin-bottom:24px">
      <div class="kicker">Blog · 博客</div>
      <h2>บทความและเคล็ดลับ <em>จากทีม</em></h2>
      <p>เคล็ดลับการเรียนภาษาจีน เรื่องน่ารู้ และอัปเดตจากทีม 为什么中文 — เขียนโดยทีมงาน หลังบ้าน → เมนู บล็อก</p>
    </div>
    <div class="article-list">
      ${posts.map(function(p){
        return `<article class="article reveal" onclick="go('blog','${esc(p.id)}')">
          ${p.pinned ? '<span class="tag" style="background:rgba(201,162,74,.15);color:#8a6d24">📌 ปักหมุด</span>' : ''}
          <h3>${esc(p.title)}</h3>
          ${p.cover ? `<img src="${p.cover}" style="height:160px;width:100%;object-fit:cover;border-radius:10px;margin:10px 0">` : ''}
          <div class="th">${esc(blogExcerpt(p))}</div>
          <div class="meta">
            <span>✍️ ${fmtDate(p.ts)}</span>
            <span>${(p.tags||[]).map(function(t){return '#'+esc(t);}).join(' ')}</span>
            <span class="read">อ่านต่อ →</span>
          </div>
        </article>`;
      }).join('') || '<div class="empty"><span class="ic">✍️</span>ยังไม่มีบทความในบล็อก — เขียนได้ที่หลังบ้าน → เมนู ✍️ บล็อก</div>'}
    </div>`;
  observeReveals();
}
