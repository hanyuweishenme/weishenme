/* ==========================================================================
   为什么中文 · คอร์สพินอินสำหรับผู้เริ่มต้น
   ตารางพินอินเต็ม + เสียงวรรณยุกต์ 4 เสียง + แบบฝึกการออกเสียง (TTS)
   ========================================================================== */
'use strict';

const PY_INITIALS = ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w'];
const PY_FINALS = ['a','o','e','i','u','ü','ai','ei','ao','ou','an','en','ang','eng','ong','er','ia','ie','iao','iu','ian','in','iang','ing','iong','ua','uo','uai','ui','uan','un','uang','ueng','üe','üan','ün'];
const TONE_CHARS = {
  'a':['ā','á','ǎ','à'], 'e':['ē','é','ě','è'], 'i':['ī','í','ǐ','ì'],
  'o':['ō','ó','ǒ','ò'], 'u':['ū','ú','ǔ','ù'], 'ü':['ǖ','ǘ','ǚ','ǜ']
};
const TONE_NAMES = {1:'เสียง 1 — สูงเสมอ (55)', 2:'เสียง 2 — ขึ้นสูง (35)', 3:'เสียง 3 — ตกแล้วขึ้น (214)', 4:'เสียง 4 — ตกลงแรง (51)', 0:'เสียงเบา — neutral'};
const TONE_EXAMPLES = ['mā','má','mǎ','mà','ma'];
const TONE_EX_TH = ['แม่','ป่าน (กัญชา)','ม้า','ด่า','(คำถาม) ไหม'];
const TONE_EX_HZ = ['妈','麻','马','骂','吗'];
/* ดึงตัวอย่างตามเลขวรรณยุกต์ (1–4, 0 = เสียงเบา) — แก้การจับคู่ผิดตำแหน่งเดิม */
function toneExample(t){
  const i = (+t === 0 || t === '0') ? 4 : Math.max(0, Math.min(3, (+t || 1) - 1));
  return {py: TONE_EXAMPLES[i], hz: TONE_EX_HZ[i], th: TONE_EX_TH[i]};
}
/* ตัวอักษรตัวอย่างของบทเรียน "วางเครื่องหมายวรรณยุกต์" (base+tone → 汉字) */
const MARK_HZ = {ma1:'妈', ma2:'麻', ma3:'马', ma4:'骂', shui3:'水', hao3:'好', xue2:'学', guo2:'国', ni3:'你', wo3:'我'};
/* ตัวอย่างตัวอักษรจีนคู่กับแต่ละเสียง/สระ */
const PY_INITIAL_EX = {
  b:'八 bā', p:'朋 péng', m:'妈 mā', f:'饭 fàn', d:'大 dà', t:'他 tā', n:'你 nǐ', l:'来 lái',
  g:'高 gāo', k:'看 kàn', h:'好 hǎo', j:'家 jiā', q:'去 qù', x:'小 xiǎo',
  zh:'中 zhōng', ch:'吃 chī', sh:'是 shì', r:'人 rén', z:'字 zì', c:'菜 cài', s:'三 sān', y:'一 yī', w:'我 wǒ'
};
/* ชื่อเรียกมาตรฐานของพยัญชนะต้นในภาษาจีน (แสดงในตารางพินอินเต็ม) */
const PY_INITIAL_TH = {
  b:'bo', p:'po', m:'mo', f:'fo',
  d:'de', t:'te', n:'ne', l:'le', g:'ge', k:'ke', h:'he',
  j:'ji', q:'qi', x:'xi', zh:'zhi', ch:'chi', sh:'shi', r:'ri',
  z:'zi', c:'ci', s:'si', y:'yi', w:'wu'
};
/* ตัวอักษรชื่อเรียกมาตรฐานของพยัญชนะต้น (ใช้ในระบบออกเสียง: b=玻 bō, p=坡 pō, …) */
const PY_INITIAL_HZ = {
  b:'玻', p:'坡', m:'摸', f:'佛',
  d:'得', t:'特', n:'讷', l:'勒', g:'哥', k:'科', h:'喝',
  j:'基', q:'欺', x:'希', zh:'知', ch:'蚩', sh:'诗', r:'日',
  z:'资', c:'雌', s:'思', y:'医', w:'乌'
};
const PY_FINAL_EX = {
  a:'妈 mā', o:'佛 fó', e:'车 chē', i:'一 yī', u:'不 bù', ü:'女 nǚ',
  ai:'爱 ài', ei:'北 běi', ao:'好 hǎo', ou:'口 kǒu', an:'山 shān', en:'门 mén',
  ang:'上 shàng', eng:'风 fēng', ong:'中 zhōng', er:'二 èr',
  ia:'家 jiā', ie:'写 xiě', iao:'小 xiǎo', iu:'九 jiǔ', ian:'天 tiān', in:'心 xīn',
  iang:'想 xiǎng', ing:'星 xīng', iong:'用 yòng',
  ua:'花 huā', uo:'国 guó', uai:'外 wài', ui:'水 shuǐ', uan:'关 guān', un:'春 chūn',
  uang:'王 wáng', ueng:'翁 wēng', üe:'月 yuè', üan:'圆 yuán', ün:'云 yún'
};
function pyExParts(ex){
  const parts = String(ex||'').trim().split(/\s+/);
  return {hz: parts[0]||'', py: parts[1]||''};
}
/* --- กราฟความถี่เสียงวรรณยุกต์ (pitch contour) -------------------------- */
const TONE_GRAPH = {
  1:{d:'M8 10 L112 10',   y0:10, y1:10,  note:'สูงเสมอ 5–5'},
  2:{d:'M8 46 L112 12',   y0:46, y1:12,  note:'ขึ้นจากกลาง 3–5'},
  3:{d:'M8 32 L55 56 L112 22', y0:32, y1:22, note:'ตกแล้วขึ้น 2–1–4'},
  4:{d:'M8 12 L112 54',   y0:12, y1:54,  note:'ตกลงแรง 5–1'},
  0:{d:'M8 50 L112 50',   y0:50, y1:50,  note:'เบา ไม่เน้นเสียง'}
};
function toneGraphSVG(t, cls){
  const g = TONE_GRAPH[t] || TONE_GRAPH[0];
  return `<svg class="tone-graph ${cls||''}" viewBox="0 0 120 60" aria-hidden="true">
    <g class="tg-grid">
      <line x1="8" y1="8" x2="112" y2="8"/><line x1="8" y1="20" x2="112" y2="20"/>
      <line x1="8" y1="32" x2="112" y2="32"/><line x1="8" y1="44" x2="112" y2="44"/>
      <line x1="8" y1="56" x2="112" y2="56"/>
    </g>
    <path class="tg-line" d="${g.d}"/>
    <circle class="tg-dot" cx="8" cy="${g.y0}" r="3.2"/>
    <circle class="tg-dot" cx="112" cy="${g.y1}" r="3.2"/>
  </svg>`;
}

/* วางเครื่องหมายวรรณยุกต์ตามกฎมาตรฐาน */
function applyTone(syl, tone){
  tone = +tone || 0;
  if(tone === 0) return syl;
  let idx = -1;
  const find = ch => syl.indexOf(ch);
  ['a','e'].forEach(ch => { if(idx === -1 && find(ch) > -1) idx = find(ch); });
  if(idx === -1){
    const ou = syl.indexOf('ou');
    if(ou > -1) idx = ou;
  }
  if(idx === -1){
    const vs = ['i','u','ü'];
    for(let k = syl.length-1; k >= 0; k--){ if(vs.includes(syl[k])){ idx = k; break; } }
  }
  if(idx === -1) return syl;
  const ch = syl[idx];
  const marked = (TONE_CHARS[ch]||[])[tone-1];
  if(!marked) return syl;
  return syl.slice(0, idx) + marked + syl.slice(idx+1);
}

/* --------------------------------------------------------------------------
   คอร์ส: 5 บทเรียน
-------------------------------------------------------------------------- */
const PY_LESSONS = [
  {id:'tone4',  name:'เสียงวรรณยุกต์ทั้ง 4',       sub:'รู้จัก 4 เสียง + เสียงเบา — หัวใจของภาษาจีน', ic:'music',  kind:'tone'},
  {id:'init',   name:'พยัญชนะต้น 21 ตัว',          sub:'b p m f … ฟังและจำเสียงเริ่มต้นของพยางค์',  ic:'type',   kind:'pickpy'},
  {id:'final',  name:'สระเดี่ยวและสระประสม',       sub:'a o e i u ü … รวมสระพินอินที่ใช้บ่อย',      ic:'pen-line', kind:'pickpy'},
  {id:'mark',   name:'การวางเครื่องหมายวรรณยุกต์', sub:'กฎการวางไม้เอก–จัตวาบนสระให้ถูกตำแหน่ง',    ic:'target', kind:'mark'},
  {id:'tone2',  name:'ฟังแล้วแยกเสียง',            sub:'ฟังคำศัพท์จริงแล้วบอกว่าพยางค์แรกเสียงอะไร', ic:'volume-2', kind:'tone'}
];

let pyState = {tab:'course', played:''};

/* --------------------------------------------------------------------------
   หน้า HUB พินอิน
-------------------------------------------------------------------------- */
function renderPinyinHub(){
  const box = $('#pinyinHub'); if(!box) return;
  const play = $('#pinyinPlay');
  if(play) play.innerHTML = '';
  box.style.display = '';
  const u = currentUser();
  const stars = (u&&u.pinyin) ? (u.pinyin.stars||{}) : {};
  box.innerHTML = `
    <div class="page-hero" style="padding:30px 0 24px">
      <div class="cn-watermark">音</div>
      <h1 class="cn-title">พินอิน · 拼音</h1>
      <p class="sub">คอร์สสำหรับผู้เริ่มต้น — เริ่มจากเสียงวรรณยุกต์ พยัญชนะ สระ แล้วค่อยฝึกแยกเสียงด้วยหูจริง
        ทุกเสียงมี<b>ตัวอักษรจีนตัวอย่าง</b>กำกับ คลิกที่ช่องใดก็ได้เพื่อฟังเสียงอ่าน</p>
    </div>

    <div class="wr-hero" style="margin-bottom:30px">
      <div class="kai-big">音</div>
      <div>
        <h2>ทำไมต้องเริ่มจากพินอิน</h2>
        <p>ภาษาจีนเขียนด้วยอักษรภาพ แต่ออกเสียงด้วยระบบพินอิน (อักษรละติน + เครื่องหมายวรรณยุกต์)
           ถ้าจับเสียงทั้ง 4 ได้ตั้งแต่แรก การเรียนคำศัพท์และประโยคจะเร็วขึ้นหลายเท่า —
           เริ่มจาก <b style="color:var(--red)">เสียงวรรณยุกต์</b> ก่อนเลย</p>
        <div class="wr-meta">
          <span class="tag-pill red">4 เสียง + เสียงเบา</span>
          <span class="tag-pill gold">23 พยัญชนะต้น</span>
          <span class="tag-pill jade">35 สระ</span>
        </div>
      </div>
    </div>

    <div class="hsk-tabs" style="margin-bottom:28px">
      <button class="hsk-tab ${pyState.tab==='course'?'active':''}" onclick="pyState.tab='course';renderPinyinHub()">${ICON('graduation-cap')} บทเรียน</button>
      <button class="hsk-tab ${pyState.tab==='tones'?'active':''}" onclick="pyState.tab='tones';renderPinyinHub()">${ICON('music')} ตารางเสียงวรรณยุกต์</button>
      <button class="hsk-tab ${pyState.tab==='chart'?'active':''}" onclick="pyState.tab='chart';renderPinyinHub()">${ICON('layout-grid')} ตารางพินอินเต็ม</button>
    </div>
    <div id="pyTabBody"></div>`;
  const body = $('#pyTabBody');
  if(pyState.tab === 'tones'){
    body.innerHTML = `
      <div class="panel reveal in">
        <h3>เสียงวรรณยุกต์ 4 เสียง + เสียงเบา</h3>
        <p style="font-size:13.5px;color:var(--text-2);margin-bottom:18px">คลิกแต่ละช่องเพื่อฟัง — ลองพูดตามหลาย ๆ รอบ</p>
        <div class="py-tone-row">
          ${[1,2,3,4,0].map(t=>{
            const ex = toneExample(t);
            return `
            <div class="py-tone t${t}" onclick="speak('${ex.hz}')" title="${TONE_NAMES[t]}">
              <span class="hz">${ex.hz}</span>
              <b>${ex.py}</b>
              ${toneGraphSVG(t)}
              <span>${t===0?'เสียงเบา':'เสียง '+t}<br>${esc(ex.th)}</span>
            </div>`;
          }).join('')}
        </div>
        <p style="font-size:11.5px;color:var(--text-3);text-align:center;margin:14px 0 0">
          กราฟแสดงระดับเสียงของแต่ละวรรณยุกต์ (5 = สูงสุด · 1 = ต่ำสุด) — เส้นแดงคือทิศทางเสียง
        </p>
        <div style="display:grid;gap:8px;margin-top:20px">
          ${Object.keys(TONE_NAMES).map(k=>{
            const ex = toneExample(k);
            return `
            <div class="paywall-feat tone-row t${k}"><span class="ic">${TILE('music','red')}</span>
              <div><b onclick="speak('${ex.hz}')" style="cursor:pointer">${esc(TONE_NAMES[k])}</b>
              <span>ตัวอย่าง <b style="font-family:var(--ff-kai);font-size:17px;color:var(--red)">${ex.hz}</b> <b class="py-txt">${ex.py}</b> — ${esc(ex.th)}</span></div>
              ${toneGraphSVG(k, 'lg')}</div>`;
          }).join('')}
        </div>
        <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="startPyLesson('tone4')">${ICON('play')} ฝึกแยกเสียงวรรณยุกต์</button>
        </div>
      </div>`;
  } else if(pyState.tab === 'chart'){
    body.innerHTML = `
      <div class="panel reveal in">
        <h3>ตารางพินอินเต็ม — คลิกเพื่อฟัง</h3>
        <p style="font-size:13.5px;color:var(--text-2);margin-bottom:18px">
          <b style="color:var(--brown-3)">พยัญชนะต้น (23 ตัว)</b> — ตัวอักษรจีนตัวอย่าง + พินอิน + ชื่อเรียกมาตรฐาน คลิกเพื่อฟังชื่อเรียก (b → bo, p → po, zh → zhi, …)
        </p>
        <div class="py-grid">
          ${PY_INITIALS.map(p=>{
            const ex = pyExParts(PY_INITIAL_EX[p]||'');
            const hzName = PY_INITIAL_HZ[p]||'';
            return `<div class="py-cell" onclick="pyPlay('${hzName}')" title="ชื่อเรียก ${esc(PY_INITIAL_TH[p]||'')} · ตัวอย่าง ${ex.hz} ${esc(ex.py)}"><span class="hz">${ex.hz}</span><b>${p}</b><span>${esc(ex.py)}</span><span class="th">${esc(PY_INITIAL_TH[p]||'')}</span></div>`;
          }).join('')}
        </div>
        <p style="font-size:13.5px;color:var(--text-2);margin:24px 0 18px">
          <b style="color:var(--brown-3)">สระ (35 ตัว)</b> — ตัวอักษรตัวอย่างที่ใช้สระนั้น ๆ คลิกฟังเสียงอ่านมาตรฐานของพยางค์นั้น
        </p>
        <div class="py-grid">
          ${PY_FINALS.map(f=>{
            const ex = pyExParts(PY_FINAL_EX[f]||'');
            return `<div class="py-cell" onclick="pyPlay('${ex.hz}')" title="ตัวอย่าง ${ex.hz} · ${esc(ex.py)}"><span class="hz">${ex.hz}</span><b>${f}</b><span>${esc(ex.py)}</span></div>`;
          }).join('')}
        </div>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="article-list">
        ${PY_LESSONS.map((l,i)=>`
          <div class="py-lesson reveal" onclick="startPyLesson('${l.id}')">
            <div class="no">${i+1}</div>
            <div class="txt">
              <b>${ICON(l.ic)} ${esc(l.name)}</b>
              <span>${esc(l.sub)}</span>
            </div>
            <div class="stars">${starsStr(stars[l.id]||0)}</div>
          </div>`).join('')}
      </div>`;
  }
  observeReveals();
}
function pyPlay(syl){
  pyState.played = syl;
  speak(syl);
}


/* --------------------------------------------------------------------------
   เล่นบทเรียน — ชุดคำถามตามชนิดบทเรียน
-------------------------------------------------------------------------- */
let PY = null;
function startPyLesson(id){
  const lesson = PY_LESSONS.find(l => l.id === id) || PY_LESSONS[0];
  const qs = buildPyQuestions(lesson);
  if(!qs.length){ toast('ยังไม่มีคำถามสำหรับบทเรียนนี้'); return; }
  PY = {lesson, qs, idx:0, score:0, errors:[], answered:false, opts:null};
  renderPyPlay();
}
function buildPyQuestions(lesson){
  const out = [];
  if(lesson.kind === 'tone'){
    /* เสียงจากพยางค์ตัวอย่าง + คำศัพท์จริง */
    if(lesson.id === 'tone4'){
      [1,2,3,4,1,2,3,4,0].forEach(t=>{
        const ex = toneExample(t);
        out.push({kind:'tone', syl: ex.py, hz: ex.hz, a:String(t||'0')});
      });
    } else {
      shuffle((DB.hsk[1]||[]).concat(DB.hsk[2]||[])).filter(w=>w&&w.cn&&w.py).slice(0,10).forEach(w=>{
        const syl = firstSyllable(w.py);
        const tone = pinyinTone(syl);
        if(tone !== '0') out.push({kind:'tone', syl, py:w.py, word:w.cn, th:w.th, a:tone});
      });
    }
  } else if(lesson.kind === 'pickpy'){
    const lv = lesson.id === 'init' ? [1,2] : [1];
    const pool = [];
    lv.forEach(n => (DB.hsk[n]||[]).forEach(w => { if(w&&w.cn&&w.py) pool.push(w); }));
    if(!pool.length) return [];
    shuffle(pool).slice(0,10).forEach(w=>{
      const others = pool.filter(x => x.py !== w.py && x.cn !== w.cn);
      if(others.length < 3) return;
      out.push({kind:'pickpy', word:w.cn, py:w.py, th:w.th, a:w.py, w:pick(others,3).map(x=>x.py)});
    });
  } else if(lesson.kind === 'mark'){
    /* เลือกพินอินที่วางเครื่องหมายถูกตำแหน่ง */
    const bases = shuffle([['ma',1],['ma',2],['ma',3],['ma',4],['shui',3],['hao',3],['xue',2],['guo',2],['ni',3],['wo',3]]);
    bases.forEach(([b,t])=>{
      const correct = applyTone(b,t);
      const opts = [1,2,3,4].map(x=>applyTone(b,x));
      if(!opts.includes(correct)) opts.push(correct);
      out.push({kind:'mark', base:b, tone:t, hz: MARK_HZ[b+t] || '', a:correct, w:shuffle(opts).slice(0,4)});
    });
  }
  return shuffle(out).slice(0,12);
}
function renderPyPlay(){
  const hub = $('#pinyinHub'); if(hub) hub.style.display = 'none';
  const box = $('#pinyinPlay'); if(!box) return;
  if(PY.idx >= PY.qs.length) return renderPyResult();
  const q = PY.qs[PY.idx];
  const total = PY.qs.length;
  const pct = (PY.idx/total)*100;

  let body = '', sub = '';
  if(q.kind === 'tone'){
    if(q.word){
      body = `<div class="q-text" style="font-family:var(--ff-cn)">${esc(q.word)}</div>
        <div class="py">${esc(q.py||'')}</div>`;
      sub = `<div>พยางค์แรก <b style="color:var(--red)">${esc(q.syl)}</b> เป็นเสียงวรรณยุกต์ที่เท่าไร — ${esc(q.th||'')}</div>`;
    } else {
      body = `<div class="q-text" style="font-size:34px">${esc(q.syl)}</div>`;
      sub = '<div>เสียงนี้เป็นเสียงวรรณยุกต์ที่เท่าไร</div>';
    }
  } else if(q.kind === 'pickpy'){
    body = `<div class="q-text" style="font-family:var(--ff-cn)">${esc(q.word)}</div>`;
    sub = `<div>${esc(q.th||'')} — คำนี้เขียนพินอินว่าอย่างไร</div>`;
  } else if(q.kind === 'mark'){
    body = `<div class="q-text" style="font-size:34px;font-family:var(--ff-py)">${esc(q.base)} <span style="font-size:15px;color:var(--red)">(เสียง ${q.tone})</span></div>`;
    sub = '<div>เลือกพินอินที่วางเครื่องหมายวรรณยุกต์ถูกตำแหน่ง</div>';
  }

  PY.opts = PY.opts || (q.kind === 'tone'
    ? shuffle(['1','2','3','4','0'].filter(t => t === q.a || true).slice(0,4).map(t=>String(t)))
    : (q.kind === 'pickpy' ? shuffle([q.a, ...(q.w||[]).slice(0,3)]) : q.w));
  if(q.kind === 'tone'){
    const withA = ['1','2','3','4'].includes(q.a) ? q.a : '0';
    PY.opts = shuffle([withA, ...shuffle(['1','2','3','4'].filter(t=>t!==withA)).slice(0,2)]);
  }

  box.innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('pinyin')">พินอิน</a> <span class="sep">›</span> <span>${esc(PY.lesson.name)}</span></div>
    <div style="max-width:760px;margin:0 auto">
      <div class="game-box">
        <div class="q-progress"><span>ข้อ ${PY.idx+1} / ${total}</span><span>คะแนน ${PY.score}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div style="text-align:center;margin-bottom:14px">
          <button class="wr-tool gold" onclick="pyHear()">${ICON('volume-2')} ฟังเสียงอ่าน</button>
        </div>
        ${body}
        ${sub?`<div class="q-sub">${sub}</div>`:''}
        <div class="opts" id="opts">
          ${PY.opts.map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerPy(${i},this)">
            <span class="key">${String.fromCharCode(65+i)}</span>
            <span>${q.kind==='tone'?('เสียงที่ '+esc(o)):esc(o)}</span></button>`).join('')}
        </div>
      </div>
    </div>`;
  pyHear(true);
}
function pyHear(auto){
  const q = PY && PY.qs[PY.idx]; if(!q) return;
  if(q.kind === 'tone') speak(q.hz || q.word || q.syl);
  else if(q.kind === 'pickpy') speak(q.word);
  else speak(q.hz || applyTone(q.base, q.tone));
}
function answerPy(i, btn){
  if(PY.answered || btn.disabled) return;
  PY.answered = true;
  const q = PY.qs[PY.idx];
  const chosen = PY.opts[i];
  const ok = String(chosen) === String(q.a);
  if(ok){ PY.score++; btn.classList.add('correct'); }
  else{
    PY.errors.push(q);
    btn.classList.add('wrong');
    $$('#opts .opt').forEach(b=>{ if(String(b.dataset.val) === String(q.a)) b.classList.add('correct'); });
  }
  $$('#opts .opt').forEach(b=>b.disabled = true);
  setTimeout(()=>{ PY.idx++; PY.answered = false; PY.opts = null; renderPyPlay(); }, ok?900:1900);
}
function renderPyResult(){
  const total = PY.qs.length;
  const pct = Math.round((PY.score/total)*100);
  const stars = pct >= 90 ? 3 : pct >= 75 ? 2 : pct >= 60 ? 1 : 0;
  const u = currentUser();
  let gainTxt = '';
  if(u){
    u.pinyin = u.pinyin || {stars:{}, best:{}};
    const old = (u.pinyin.stars[PY.lesson.id]||0);
    if(stars > old) u.pinyin.stars[PY.lesson.id] = stars;
    u.pinyin.best[PY.lesson.id] = Math.max(u.pinyin.best[PY.lesson.id]||0, pct);
    const pts = PY.score*3 + stars*10;
    const xp  = PY.score*6 + stars*15;
    award(u, pts, xp, 'pinyin', 'บทเรียนพินอิน: '+PY.lesson.name+' — '+pct+'%');
    checkBadges(u);
    saveUsers();
    gainTxt = `+${pts} แต้ม · +${xp} XP${stars>old?' · ดาวใหม่!':''}`;
  }
  $('#pinyinPlay').innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('pinyin')">พินอิน</a> <span class="sep">›</span> <span>${esc(PY.lesson.name)}</span></div>
    <div style="max-width:760px;margin:0 auto">
      <div class="exam-cert">
        <div class="seal">音</div>
        <h3>${esc(PY.lesson.name)}</h3>
        <div class="score">${pct}%</div>
        <p>${pct>=90?'太棒了! หูทองคำมาก!':pct>=75?'很好! ทำได้ดีมาก':pct>=60?'不错! ผ่านแล้ว':'加油! ลองอีกครั้ง'} — ตอบถูก ${PY.score} จาก ${total} ข้อ</p>
        <div class="result-stars">${starsStr(stars)}</div>
        ${gainTxt?`<p style="color:var(--red);font-weight:700;margin-top:8px">${gainTxt}</p>`:''}
        <div class="result-row" style="margin-top:20px">
          <button class="btn btn-primary" onclick="startPyLesson('${PY.lesson.id}')">${ICON('refresh-cw')} ฝึกอีกครั้ง</button>
          <button class="btn btn-ghost" onclick="go('pinyin')">กลับหน้าพินอิน</button>
        </div>
      </div>
      ${PY.errors.length?`
        <div class="answer-explain" style="margin-top:22px">
          <b>ทบทวนข้อที่ตอบผิด</b><br>
          ${PY.errors.slice(0,8).map(q=>{
            if(q.kind==='tone') return `• ${esc(q.word||q.syl)} → เสียงที่ <b>${esc(String(q.a))}</b>`;
            if(q.kind==='pickpy') return `• ${esc(q.word)} → <b>${esc(q.a)}</b>`;
            return `• ${esc(q.base)} (เสียง ${q.tone}) → <b>${esc(q.a)}</b>`;
          }).join('<br>')}
        </div>`:''}
    </div>`;
}
