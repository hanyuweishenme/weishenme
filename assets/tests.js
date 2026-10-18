/* ==========================================================================
   为什么中文 · ข้อสอบจำลอง HSK (100 ข้อ × 5 ชุด × 6 ระดับ)
   ส่วน 1 การฟัง (40) · ส่วน 2 การอ่าน (40) · ส่วน 3 การเขียน (20)
   ชุดที่ 1 ของแต่ละระดับเรียนฟรี (ชุดทดลอง) — ชุด 2–5 เป็นสิทธิ์พรีเมียม
   ชุดข้อสอบสร้างแบบ deterministic (seeded) — ชุดเดิมออกคำถามเดิมทุกครั้ง
   ========================================================================== */
'use strict';

const TESTS = (typeof WC_DATA !== 'undefined' && WC_DATA.tests) || {};
const EXAM_TOTAL = 100;          /* ข้อต่อชุด */

/* --------------------------------------------------------------------------
   โครงสร้างข้อสอบเสมือนจริง ตามแบบ 新汉语水平考试 (HSK 真题)
   听力: ส่วน 1 บทสนทนาสั้น · ส่วน 2 บทพูดยาว  |  阅读: ส่วน 1 เลือกคำเติมช่องว่าง
   ส่วน 2 เลือกข้อความที่ตรงกับเนื้อหา · ส่วน 3 บทอ่านยาว  |  书写: ส่วน 1 เรียงคำ
   เป็นประโยค · ส่วน 2 เขียน短文 80 ตัวอักษรจากคำที่กำหนด
-------------------------------------------------------------------------- */
const EXAM_LAYOUT = {
  1: [['L1',20],['L2',20],['R1',20],['R2',20],['W1',20]],
  2: [['L1',20],['L2',20],['R1',20],['R2',20],['W1',20]],
  3: [['L1',20],['L2',20],['R1',10],['R2',10],['R3',20],['W1',16],['W2',4]],
  4: [['L1',20],['L2',20],['R1',10],['R2',10],['R3',20],['W1',16],['W2',4]],
  5: [['L1',20],['L2',20],['R1',10],['R2',10],['R3',20],['W1',14],['W2',6]],
  6: [['L1',20],['L2',20],['R1',10],['R2',10],['R3',30],['W2',10]]
};
const EXAM_PARTS = {
  L1: {sec:1, name:'第一部分', instr:'第 1–20 题：请选出正确答案。'},
  L1b: {sec:1, name:'第一部分', instr:'第 1–20 题：请选出与所听内容一致的一项。'},
  W2b: {sec:3, name:'第二部分', instr:'缩写：请阅读下面的文章，用 80 字左右概括其主要内容。'},
  L2: {sec:1, name:'第二部分', instr:'第 21–40 题：请选出正确答案。'},
  R1: {sec:2, name:'第一部分', instr:'选词填空：请选出正确答案。'},
  R2: {sec:2, name:'第二部分', instr:'请选出与试题内容一致的一项。'},
  R3: {sec:2, name:'第三部分', instr:'请选出正确答案。'},
  W1: {sec:3, name:'第一部分', instr:'完成句子。'},
  W2: {sec:3, name:'第二部分', instr:'写短文：请结合下列词语，写一篇 80 字左右的短文。'}
};
const EXAM_SEC_NAMES = {1:['การฟัง · 听力','ฟังแล้วเลือกคำตอบที่ถูกต้อง'], 2:['การอ่าน · 阅读','อ่านเนื้อเรื่องแล้วเลือกคำตอบที่ถูกต้อง'], 3:['การเขียน · 书写','เขียนและเรียงประโยคให้ถูกต้อง']};
const EXAM_SETS = 5;             /* ชุดต่อระดับ */
const EXAM_LISTEN = 40;
const EXAM_READ = 40;
const EXAM_WRITE = 20;
const EXAM_PASS = 60;

/* seeded RNG (mulberry32) — ทำให้ชุดข้อสอบ deterministic */
function seedRng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, rnd){
  const b = arr.slice();
  for(let i = b.length-1; i > 0; i--){
    const j = Math.floor(rnd() * (i+1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function seededPick(arr, n, rnd){ return seededShuffle(arr, rnd).slice(0, n); }

/* --------------------------------------------------------------------------
   ตัวช่วยอ่านเสียงวรรณยุกต์
-------------------------------------------------------------------------- */
const TONE_MAP = {'ā':'1','á':'2','ǎ':'3','à':'4','ē':'1','é':'2','ě':'3','è':'4','ī':'1','í':'2','ǐ':'3','ì':'4','ō':'1','ó':'2','ǒ':'3','ò':'4','ū':'1','ú':'2','ǔ':'3','ù':'4','ǖ':'1','ǘ':'2','ǚ':'3','ǜ':'4'};
function pinyinTone(syl){
  syl = String(syl||'').toLowerCase();
  for(const ch of syl){ if(TONE_MAP[ch]) return TONE_MAP[ch]; }
  return '0';
}
function stripToneMarks(syl){
  const m = {'ā':'a','á':'a','ǎ':'a','à':'a','ē':'e','é':'e','ě':'e','è':'e','ī':'i','í':'i','ǐ':'i','ì':'i','ō':'o','ó':'o','ǒ':'o','ò':'o','ū':'u','ú':'u','ǔ':'u','ù':'u','ǖ':'ü','ǘ':'ü','ǚ':'ü','ǜ':'ü'};
  return String(syl||'').split('').map(c => m[c] || c).join('').replace(/[1-5]/g,'');
}
function firstSyllable(py){
  return String(py||'').trim().split(/\s+/)[0] || '';
}

/* --------------------------------------------------------------------------
   คลังคำถาม: ข้อแต่งเอง + ข้อจากเกมเติมคำ + ข้อสร้างอัตโนมัติจากคำศัพท์
-------------------------------------------------------------------------- */
function fillBankFor(lv){
  const bank = (DB.games && DB.games.fill) || [];
  const same = bank.filter(q => q && (q.lv||1) === lv);
  const near = bank.filter(q => q && Math.abs((q.lv||1)-lv) === 1);
  return same.concat(near).map(q => ({t:'fill', q:q.q, py:q.py, th:q.th, a:q.a, w:(q.w||[]).slice(0,2)}));
}
function buildQuestionPool(lv){
  const extra = (typeof WC_DATA !== 'undefined' && WC_DATA.testextra) ? (WC_DATA.testextra[lv]||[]) : [];
  const authored = (TESTS[lv]||[]).slice().concat(extra);
  const fills = fillBankFor(lv);
  const vocab = (DB.hsk[lv]||[]).filter(w => w && w.cn && w.th && w.py);
  const pool = {listen:[], read:[], write:[], l1:[], l2:[], r1:[], r2:[], r3:[], w1:[], w2:[]};

  /* ---- ข้อสอบจริงแบบ: บทพูดยาว (听力 第二部分) — ขยายเป็นคำถามย่อย ---- */
  authored.filter(q => q.t === 'talk').forEach(function(tk){
    (tk.qs||[]).forEach(function(sq, i){
      pool.l2.push({t:'talkq', tid: tk.id || ('tk'+lv+'-'+tk.title), title: tk.title, text: tk.text||'', dlg: tk.dlg||null, q: sq.q, th: sq.th||'', a: sq.a, w: sq.w||[]});
    });
  });
  /* ---- cloze 选词填空 (阅读 第一部分) — ขยายเป็นข้อละช่องว่าง ---- */
  authored.filter(q => q.t === 'cloze').forEach(function(c){
    (c.blanks||[]).forEach(function(b, i){
      pool.r1.push({t:'cblank', cid: c.id || ('cl'+lv), text: c.text, py: c.py||'', q: '第 ' + b.n + ' 题', a: b.a, w: b.w||[]});
    });
  });
  /* ---- เลือกข้อความที่ตรงกับเนื้อหา (阅读 第二部分) ---- */
  authored.filter(q => q.t === 'match').forEach(function(q){ pool.r2.push(q); });
  fills.forEach(q => pool.r2.push(q));
  /* ---- เขียน短文 (书写 第二部分) ---- */
  authored.filter(q => q.t === 'compose').forEach(function(q){ pool.w2.push(q); });
  /* ---- HSK6: เลือกประโยคที่ผิดไวยากรณ์ + เลือกประโยคเติมช่องว่าง ---- */
  authored.filter(q => q.t === 'errpick').forEach(function(q){ pool.r1.push(q); });
  authored.filter(q => q.t === 'sentfill').forEach(function(q){ pool.r2.push(q); });

  /* ---- บทอ่านยาว (50–150+ ตัวอักษร) — ขยายเป็นคำถามย่อยเข้าส่วนที่ 3 ---- */
  authored.filter(q => q.t === 'passage').forEach(function(p){
    (p.qs||[]).forEach(function(sq, i){
      pool.r3.push({t:'pread', title:p.title, text:p.text, py:p.py||'', q:sq.q, th:sq.th||'', a:sq.a, w:sq.w||[]});
    });
  });

  /* ---- ฟัง: ส่วนที่ 1 บทสนทนาสั้น (ตัวเลือกภาษาจีนล้วน) ---- */
  authored.filter(q => q.t === 'dlg').forEach(q => pool.l1.push(q));
  /* ---- อ่าน: ส่วน 1-3 ---- */
  authored.filter(q => q.t === 'fill').forEach(q => { pool.r1.push(q); pool.r3.push(q); });
  authored.filter(q => q.t === 'pinyin' || q.t === 'tone').forEach(q => pool.r3.push(q));
  fills.forEach(q => { pool.r1.push(q); pool.r3.push(q); });
  vocab.forEach(w => {
    const others = vocab.filter(x => x.py !== w.py && x.cn !== w.cn);
    if(others.length >= 3) pool.r3.push({t:'pinyin', q:w.cn, th:w.th, a:w.py, w:seededPick(others,3,seedRng(hashCode('p'+w.cn))).map(x=>x.py)});
  });
  if(lv <= 5){
    vocab.forEach(w => {
      const syl = firstSyllable(w.py);
      const tone = pinyinTone(syl);
      if(tone === '0') return;
      const wrongs = seededShuffle(['1','2','3','4'].filter(t => t !== tone), seedRng(hashCode('t'+w.cn))).slice(0,2);
      pool.r3.push({t:'tone', q:w.cn, py:w.py, target:syl, th:w.th, a:tone, w:wrongs});
    });
  }

  /* ---- ฟังคำศัพท์: เลือกพินอิน (ตัวเลือกพินอิน) + เลือกคำที่ได้ยิน (ตัวเลือกจีน) ---- */
  vocab.forEach(w => {
    const others = vocab.filter(x => x.py !== w.py && x.cn !== w.cn);
    if(others.length >= 3){
      pool.l2.push({t:'lpinyin', q:'请选出你听到的词语的拼音。', zh:w.cn, py:w.py, a:w.py, w:seededPick(others,3,seedRng(hashCode(w.cn))).map(x=>x.py)});
      pool.l1.push({t:'lword', q:'请选出你听到的词语。', zh:w.cn, a:w.cn, w:seededPick(others,3,seedRng(hashCode('w'+w.cn))).map(x=>x.cn)});
    }
  });
  /* ---- ฟังประโยค: 句中提到了哪个词？ (ตัวเลือกจีนล้วน) ---- */
  const lhearSrc = [];
  authored.filter(q => q.t === 'cloze' || q.t === 'passage' || q.t === 'talk').forEach(function(q){
    const segs = String(q.text||'').split(/[，。！？；]/);
    segs.forEach(function(s){
      const clean = s.replace(/\s+/g,'');
      if(clean.length >= 8 && clean.length <= 40) lhearSrc.push({zh: clean, lv: lv});
    });
  });
  lhearSrc.forEach(function(s, i){
    const chars = vocab.map(function(w){ return w.cn; });
    const words = chars.filter(function(c){ return c.length >= 2 && c.length <= 3; });
    const target = words[Math.floor(seedRng(hashCode('lh'+i+lv))() * words.length)];
    if(!target) return;
    const others = words.filter(function(c){ return c !== target; });
    if(others.length < 3) return;
    pool.l1.push({t:'lhear', zh: s.zh, q:'这段话提到了哪个词？', a: target, w: seededPick(others, 3, seedRng(hashCode('lhq'+i+lv)))});
    pool.l2.push({t:'lhear', zh: s.zh, q:'这段话提到了哪个词？', a: target, w: seededPick(others, 3, seedRng(hashCode('lhq2'+i+lv)))});
  });

  /* ---- การเขียน (เรียงคำเป็นประโยค — ≥3 ชิ้นเสมอ ตามแบบข้อสอบจริง) ---- */
  authored.filter(q => q.t === 'order').forEach(function(q){ if((q.a||[]).length >= 3) pool.w1.push(q); });
  vocab.filter(w => w.cn.length >= 3 && w.cn.length <= 4).forEach(w => {
    const chars = Array.from(new Set(w.cn.split('')));
    if(chars.length !== w.cn.length) return;   /* ตัวซ้ำทำให้เฉลยกำกวม */
    pool.w1.push({t:'order', q:'请排列词语，组成正确的句子。', py:w.py, a:chars});
  });
  return pool;
}
function hashCode(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/* --------------------------------------------------------------------------
   สร้างชุดข้อสอบ (deterministic ต่อ lv+set)
-------------------------------------------------------------------------- */
function buildExam(lv, set){
  set = Math.max(1, Math.min(EXAM_SETS, +set||1));
  lv = Math.max(1, Math.min(6, +lv||1));
  const rnd = seedRng(hashCode('exam' + lv + '-' + set));
  const pool = buildQuestionPool(lv);
  const layout = EXAM_LAYOUT[lv] || EXAM_LAYOUT[3];
  /* ดึงข้อตามสล็อต: ชนิดสำคัญก่อน แล้วเติมด้วยที่เหลือ (fallback ข้ามสล็อตเมื่อคลังน้อย) */
  const used = [];
  const FALLBACK = {r2:'r3', l1:'l2', l2:'l1', r1:'r3', w1:'w2', w2:'w1'};
  const take = (slot, want, prefer) => {
    const out = [];
    const src = pool[slot] || [];
    prefer.forEach(function(type){
      const arr = src.filter(function(q){ return q.t === type && !out.includes(q) && !used.includes(q); });
      const n = Math.min(want - out.length, arr.length);
      seededShuffle(arr, rnd).slice(0, n).forEach(function(q){ out.push(q); used.push(q); });
    });
    const rest = seededShuffle(src.filter(function(q){ return !out.includes(q) && !used.includes(q); }), rnd);
    let i = 0;
    while(out.length < want && i < rest.length){ out.push(rest[i]); used.push(rest[i]); i++; }
    if(out.length < want && FALLBACK[slot]){
      const fb = seededShuffle((pool[FALLBACK[slot]]||[]).filter(function(q){ return !used.includes(q); }), rnd);
      let j = 0;
      while(out.length < want && j < fb.length){ out.push(fb[j]); used.push(fb[j]); j++; }
    }
    return out.slice(0, want);
  };
  const PREFER = {
    l1: ['dlg','lhear','lword','lpinyin'], l2: ['talkq','lhear','lword','lpinyin'],
    r1: ['errpick','cblank','fill'], r2: ['sentfill','match','fill'],
    r3: ['pread','pinyin','tone','fill'], w1: ['order'], w2: ['compose']
  };
  const qs = [];
  let qno = 0;
  layout.forEach(function(part){
    const slot = String(part[0]).toLowerCase(), count = part[1];
    take(slot, count, PREFER[slot] || []).forEach(function(q){
      qno++;
      q.__no = qno;
      q.__slot = slot;
      qs.push(q);
    });
  });
  return qs.slice(0, EXAM_TOTAL);
}
function examCount(lv){ return ((TESTS[lv]||[]).length || 0); }

/* --------------------------------------------------------------------------
   AI แก้โจทย์ข้อสอบ (OCR) — จับคู่โจทย์ที่สแกนกับคลังข้อสอบของเว็บ + อธิบายคำตอบ
-------------------------------------------------------------------------- */
let SOLVER_POOL = null;
function solverPool(){
  if(SOLVER_POOL) return SOLVER_POOL;
  SOLVER_POOL = [];
  for(let lv = 1; lv <= 6; lv++){
    const extra = (typeof WC_DATA !== 'undefined' && WC_DATA.testextra) ? (WC_DATA.testextra[lv]||[]) : [];
    const authored = (TESTS[lv]||[]).slice().concat(extra);
    authored.forEach(function(q){
      if(q.t === 'passage'){
        (q.qs||[]).forEach(function(sq){
          SOLVER_POOL.push({t:'pread', title:q.title, text:q.text, py:q.py, q:sq.q, th:sq.th||'', a:sq.a, w:sq.w||[]});
        });
      } else SOLVER_POOL.push(q);
    });
  }
  return SOLVER_POOL;
}
function normTxt(s){ return String(s||'').toLowerCase().replace(/[\s，。！？、；：·—…"'（）()「」【】《》,.?!:;'`~\u201c\u201d]/g, ''); }
function similarity(a, b){
  if(!a || !b) return 0;
  if(a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  let common = 0;
  const set = new Set();
  for(let i = 0; i < b.length - 1; i++) set.add(b.slice(i, i + 2));
  for(let i = 0; i < a.length - 1; i++){ if(set.has(a.slice(i, i + 2))) common++; }
  return common / Math.max(1, a.length - 1);
}
function solveExamQuestion(lines){
  const pool = solverPool();
  const joined = (lines||[]).join(' ');
  const normAll = normTxt(joined);
  let best = null, bestScore = 0;
  pool.forEach(function(q){
    let score = 0;
    const cands = [];
    if(q.q) cands.push(q.q);
    if(q.zh) cands.push(q.zh);
    if(q.cn) cands.push(q.cn);
    if(q.th) cands.push(q.th);
    if(q.t === 'dlg' && q.dlg) cands.push(q.dlg.map(function(l){ return l.zh; }).join(' '));
    if(q.t === 'pread' && q.text) cands.push(q.text);
    cands.forEach(function(c){
      const nc = normTxt(c);
      if(!nc) return;
      /* ตรงทั้งข้อความ → คะแนนสูงมาก (ยิ่งยาวยิ่งมั่นใจ) */
      if(nc.length >= 4 && normAll.indexOf(nc) > -1) score = Math.max(score, 1 + nc.length / 100);
      /* ข้อความสั้น (2–3 ตัว) ต้องไม่แซงข้อความยาว — คูณถ่วงน้ำหนักตามความยาว */
      score = Math.max(score, similarity(nc, normAll) * Math.min(1, nc.length / 12));
    });
    if(score > bestScore){ bestScore = score; best = q; }
  });
  if(!best || bestScore < .45) return null;
  return {q: best, score: Math.min(1, bestScore), explanation: explainAnswer(best)};
}
function explainAnswer(q){
  switch(q.t){
    case 'vocab': case 'lmeaning':
      return 'คำว่า "' + (q.cn||q.zh||q.q||'') + '" แปลว่า "' + q.a + '"' + (q.py ? ' (พินอิน: ' + q.py + ')' : '') + ' — ตัวเลือกที่เหลือมีความหมายอื่น';
    case 'pinyin': case 'lpinyin':
      return 'พินอินของ "' + (q.cn||q.zh||q.q||'') + '" คือ "' + q.a + '" — สะกดตามระบบพินอินมาตรฐาน' + (q.th ? ' ความหมาย: ' + q.th : '');
    case 'tone':
      return 'พยางค์ "' + (q.target||q.py||'') + '" อยู่ในวรรณยุกต์เสียงที่ ' + q.a + ' — สังเกตเครื่องหมายกำกับเสียงบนสระ';
    case 'fill':
      return 'ประโยคที่ถูกต้องคือ "' + (q.q||'') + '" โดยเติม "' + q.a + '"' + (q.py ? ' (อ่าน: ' + q.py + ')' : '') + (q.th ? ' — แปล: ' + q.th : '');
    case 'listen':
      return 'จากเสียงที่ได้ยิน "' + (q.zh||'') + '"' + (q.th ? ' (แปล: ' + q.th + ')' : '') + ' → คำตอบคือ "' + q.a + '"';
    case 'dlg':
      return 'บทสนทนาระบุว่า "' + (q.dlg||[]).map(function(l){ return l.zh; }).join(' / ') + '" → คำตอบคือ "' + q.a + '"';
    case 'pread':
      return 'จากบทอ่าน' + (q.title ? ' "' + q.title + '"' : '') + ' — เนื้อความสอดคล้องกับคำตอบ "' + q.a + '"';
    case 'order':
      return 'เรียงได้เป็น "' + (q.a||[]).join('') + '"' + (q.py ? ' (' + q.py + ')' : '') + (q.th ? ' — แปล: ' + q.th : '');
    default:
      return 'คำตอบคือ "' + q.a + '"' + (q.th ? ' (' + q.th + ')' : '');
  }
}
function examBest(u, lv, set){
  u = u || currentUser();
  if(!u || !u.exams) return null;
  const rec = u.exams[lv];
  if(rec && rec.sets && rec.sets[set]) return rec.sets[set].best;
  return null;
}
function isExamSetFree(lv, set){ return (+set||1) === 1; }

/* --------------------------------------------------------------------------
   HUB — หน้าเลือกชุดข้อสอบ (เรนเดอร์ในหน้า HSK แท็บ "ข้อสอบจำลอง")
-------------------------------------------------------------------------- */
function renderExamsHub(){
  const u = currentUser();
  const play = $('#examPlay');
  if(play) play.innerHTML = '';
  const box = $('#examsHub');
  if(box) box.style.display = '';
  const meta = hskMeta();
  box.innerHTML = `
    <div class="exam-hero">
      <div class="in">
        <div class="kicker">HSK Mock Exams · 模拟考试</div>
        <h2>ข้อสอบจำลอง HSK เสมือนจริง</h2>
        <p>จำลองรูปแบบข้อสอบ HSK จริง — ส่วนการฟัง การอ่าน และการเขียน พร้อมจับเวลาและเฉลย
           แต่ละระดับมี <b>${EXAM_SETS} ชุด × ${EXAM_TOTAL} ข้อ</b> (ฟัง ${EXAM_LISTEN} · อ่าน ${EXAM_READ} · เขียน ${EXAM_WRITE})
           <b style="color:var(--gold-2)">ชุดที่ 1 ทดลองฟรีทุกระดับ</b> — ชุด 2–5 เป็นสิทธิ์พรีเมียม</p>
        <div class="exam-stats">
          <div><b>${EXAM_TOTAL}</b><span>ข้อต่อชุด</span></div>
          <div><b>${EXAM_SETS}</b><span>ชุดต่อระดับ</span></div>
          <div><b>3</b><span>ส่วน · ฟัง/อ่าน/เขียน</span></div>
          <div><b>60%</b><span>เกณฑ์ผ่าน</span></div>
        </div>
      </div>
    </div>
    <div class="sec-head reveal" style="margin-bottom:26px">
      <div class="kicker">Choose level &amp; set</div>
      <h2>เลือกชุดข้อสอบของคุณ</h2>
      <p>ชุดที่ 1 ของทุกระดับเปิดให้ลองฟรี — ทำซ้ำได้ไม่จำกัดครั้ง ระบบเก็บคะแนนสูงสุดของแต่ละชุด</p>
    </div>
    ${[1,2,3,4,5,6].map(n=>`
      <div class="panel" style="margin-bottom:22px">
        <div class="panel-head">
          <h3 style="margin-bottom:0">${TILE('target','red')} HSK ${n} · ${meta[n].name} <span style="font-weight:400;font-size:12.5px;color:var(--text-3)">(${meta[n].words})</span></h3>
        </div>
        <div class="set-grid">
          ${Array.from({length:EXAM_SETS}, (_,k)=>k+1).map(s=>{
            const best = examBest(u, n, s);
            const free = isExamSetFree(n, s);
            const locked = !free && !isPremium(u);
            return `<div class="set-card ${locked?'locked':''}" onclick="${locked?'showExamPaywall('+n+','+s+')':'startExam('+n+','+s+')'}">
              ${free?'<span class="free-tag">ฟรี · ทดลอง</span>':(locked?`<span class="set-lock">${ICON('lock')}</span>`:'')}
              <div class="set-no">ชุด ${s}</div>
              <b>${EXAM_TOTAL} ข้อ · 3 ส่วน</b>
              <span>ฟัง ${EXAM_LISTEN} · อ่าน ${EXAM_READ} · เขียน ${EXAM_WRITE}</span>
              <div class="set-best">${best!=null? 'คะแนนสูงสุด <b>'+best+'%</b>' : (free?'ยังไม่เคยสอบ':'ยังไม่เคยสอบ')}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`).join('')}
    <div class="prem-note">
      ${ICON('info')} <b>รูปแบบข้อสอบ:</b> ส่วนที่ 1 การฟัง — ระบบจะอ่านข้อความ/คำศัพท์ภาษาจีนให้ฟัง แล้วเลือกคำตอบ ·
      ส่วนที่ 2 การอ่าน — เติมคำ จับคู่ความหมาย และพินอิน · ส่วนที่ 3 การเขียน — เรียงคำให้เป็นประโยคที่ถูกต้อง
    </div>`;
  observeReveals();
}
function showExamPaywall(lv, set){
  if(typeof requirePremium === 'function') requirePremium('exam', function(){ startExam(lv, set); });
  else startExam(lv, set);
}

/* --------------------------------------------------------------------------
   เล่นข้อสอบ
-------------------------------------------------------------------------- */
let EX = null;
function startExam(lv, set){
  lv = Math.max(1, Math.min(6, +lv||1));
  set = Math.max(1, Math.min(EXAM_SETS, +set||1));
  if(!isExamSetFree(lv, set) && !isPremium(currentUser())){
    showExamPaywall(lv, set);
    return;
  }
  EX = {lv, set, qs: buildExam(lv, set), idx:0, score:0, wrong:0, errors:[], answered:false, opts:null, orderPool:null, orderUsed:[], answers:{}, composeText:'', timer:null, timeLeft:0};
  renderExamPlay();
}
function examSectionOf(q){
  const s = q && q.__slot;
  if(s){
    const c = String(s).charAt(0).toUpperCase();
    return c === 'L' ? 1 : c === 'R' ? 2 : 3;
  }
  return (q.t === 'listen' || q.t === 'lpinyin' || q.t === 'lmeaning' || q.t === 'dlg' || q.t === 'talkq') ? 1 : (q.t === 'order' || q.t === 'compose' ? 3 : 2);
}
function sectionLabel(n){
  return EXAM_SEC_NAMES[n] || ['ข้อสอบ', ''];
}
function examPartInfo(q){
  const s = q && q.__slot;
  if(s){
    const key = String(s).toUpperCase();
    if(key === 'L1' && EX && EX.lv === 6) return EXAM_PARTS.L1b;
    if(key === 'W2' && EX && EX.lv === 6) return EXAM_PARTS.W2b;
    if(EXAM_PARTS[key]) return EXAM_PARTS[key];
  }
  const sec = examSectionOf(q);
  return {sec: sec, name: sec===1?'第一部分':sec===2?'第二部分':'第一部分', instr: ''};
}
function examTimeFor(q){ return examSectionOf(q) === 1 ? 55 : (q.t === 'compose' ? 150 : 45); }

let examSoundOn = true;
function examSoundPref(){ try{ return localStorage.getItem('wszw_exam_sound') !== '0'; }catch(e){ return true; } }
function toggleExamSound(){
  examSoundOn = !examSoundOn;
  try{ localStorage.setItem('wszw_exam_sound', examSoundOn ? '1' : '0'); }catch(e){}
  renderExamPlay();
}
function safeSpeak(txt){
  if(!examSoundOn) return;
  try{ if(document.hidden) return; speak(txt); }catch(e){}
}
function safeSpeakDlg(q){
  if(!examSoundOn) return;
  try{ if(document.hidden) return; speakDlg(q); }catch(e){}
}
function safeSpeakTalk(q){
  if(!examSoundOn) return;
  try{ if(document.hidden) return; speakTalkQ(q); }catch(e){}
}
function renderExamPlay(){
  examSoundOn = examSoundPref();
  const hub = $('#examsHub'); if(hub) hub.style.display = 'none';
  const box = $('#examPlay'); if(!box) return;
  if(EX.idx >= EX.qs.length) return renderExamResult();
  const q = EX.qs[EX.idx];
  const total = EX.qs.length;
  const pct = (EX.idx/total)*100;
  const part = examSectionOf(q);
  const sec = sectionLabel(part);
  const pinfo = examPartInfo(q);
  const slot = q.__slot || '';
  const firstOfSlot = EX.idx === 0 || (EX.qs[EX.idx-1].__slot !== slot);
  /* ช่วงข้อของส่วนนี้ (เช่น 第 21–40 题) */
  let rangeTxt = '';
  if(firstOfSlot){
    let endIdx = EX.idx;
    while(endIdx < total && EX.qs[endIdx].__slot === slot) endIdx++;
    rangeTxt = '第 ' + (EX.idx+1) + '–' + endIdx + ' 题';
  }
  const banner = firstOfSlot ? `
    <div class="exam-part-banner reveal in">
      <div class="ep-head">
        <span class="ep-sec">${part === 1 ? '一、听力' : part === 2 ? '二、阅读' : '三、书写'}</span>
        <span class="ep-part">${esc(pinfo.name)}</span>
        <span class="ep-range">${rangeTxt}</span>
      </div>
      <p class="ep-instr">${esc(pinfo.instr)}</p>
    </div>` : '';

  box.innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('hsk')">HSK</a> <span class="sep">›</span> <span>ข้อสอบ HSK ${EX.lv} · ชุด ${EX.set}</span></div>
    <div class="exam-paper" id="gameBox">
      ${EX.idx === 0 ? `
      <div class="paper-cover">
        <div class="pc-title">新汉语水平考试</div>
        <div class="pc-sub">HSK（${['一','二','三','四','五','六'][EX.lv-1]}级）· 模拟考试</div>
        <div class="pc-code">H${EX.lv}${String(EX.set).padStart(4,'0')}-MOCK</div>
        <div class="pc-note">听力 ${EXAM_LISTEN} 题 · 阅读 ${EXAM_READ} 题 · 书写 ${EXAM_WRITE} 题 · รวม ${total} ข้อ</div>
      </div>` : ''}
      <div class="paper-meta">
        <span><b style="font-family:var(--ff-cn)">HSK ${EX.lv} · ชุด ${EX.set} · 模拟考试</b> — 第 ${EX.idx+1} 题</span>
        <span class="paper-acts">
          <button class="mini-btn ghost" onclick="toggleExamSound()" title="เปิด/ปิดเสียงอ่านอัตโนมัติ">${examSoundOn ? ICON('volume-2') : ICON('volume-x')}</button>
          <button class="mini-btn ghost" onclick="renderExamSheet()">${ICON('grid')} 答题卡</button>
          <span id="examClock" style="font-family:var(--ff-num);font-weight:700;color:var(--red);display:inline-flex;gap:5px;align-items:center">${ICON('clock')} <span id="examClockSec">${examTimeFor(q)}</span>s</span>
          <span>คะแนน ${EX.score}</span>
        </span>
      </div>
      ${banner}
      <div class="q-progress"><span>ข้อ ${EX.idx+1} / ${total} · ${sec[0]}</span><span>${EX.answers[EX.idx] !== undefined ? 'ตอบแล้ว ✓' : ''}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div id="examQ">${examQuestionHTML(q, part)}</div>
    </div>`;
  observeReveals();
  if(q.t === 'dlg') setTimeout(()=>safeSpeakDlg(q), 450);
  else if(q.t === 'talkq') setTimeout(()=>safeSpeakTalk(q), 450);
  else if(examSectionOf(q) === 1) setTimeout(()=>safeSpeak(q.zh||''), 450);
  startExamTimer(q);
}
/* ฟังบทพูดยาว (听力第二部分) — อ่านข้อความ/บทสนทนายาวแล้วตามด้วยคำถาม */
function speakTalkQ(q){
  if(q.dlg && q.dlg.length){ speakDlg({dlg: q.dlg, zq: q.q}); return; }
  try{ speechSynthesis.cancel(); }catch(e){}
  const txt = (q.text || '') + '。' + (q.q || '');
  speak(txt);
}
/* กระโดดไปข้อใดก็ได้ — รีเซ็ตสถานะข้อ (ตัวเลือก/คำตอบ/เรียงคำ) ใหม่ทุกครั้ง */
function jumpExam(n){
  if(!EX) return;
  const idx = Math.max(0, Math.min(EX.qs.length - 1, +n || 0));
  clearExamTimer();
  EX.idx = idx;
  EX.opts = null;
  EX.answered = false;
  EX.orderPool = null;
  EX.orderUsed = [];
  EX.composeText = '';
  renderExamPlay();
}
/* 答题卡 — กระโดดไปข้อใดก็ได้ */
function renderExamSheet(){
  const total = EX.qs.length;
  const cells = [];
  for(let n = 1; n <= total; n++){
    const st = EX.idx + 1 === n ? 'cur' : (EX.answers[n-1] !== undefined ? 'done' : '');
    cells.push(`<button class="sheet-cell ${st}" onclick="closeGlassPop();jumpExam(${n-1})">${n}</button>`);
  }
  glassPop({
    icon: 'grid',
    title: '答题卡 · กระดาษคำตอบ',
    body: `
      <p style="margin:0 0 12px;font-size:13px;color:var(--text-2)">ตอบแล้ว <b>${Object.keys(EX.answers).length}</b>/100 ข้อ — คลิกหมายเลขเพื่อไปข้อนั้น</p>
      <div class="sheet-grid">${cells.join('')}</div>`,
    actions: [{label:'ปิด', cls:'btn-ghost', fn: closeGlassPop}]
  });
}
/* อ่านบทสนทนา (对话) — เสียงหญิง/ชายแยกชัดเจน + พูดคำถามท้ายสุด + เล่นซ้ำได้ไม่จำกัด */
let dlgToken = 0;
function zhVoices(){
  try{ return speechSynthesis.getVoices().filter(function(v){ return /^zh/i.test(v.lang); }); }catch(e){ return []; }
}
function pickGenderVoice(gender){
  const pool = zhVoices();
  const female = /xiaoxiao|huihui|yaoyao|meijia|ting-?ting|tingting|google|小晓|慧慧|婷婷/i;
  const male = /yunyang|yunjian|kangkang|yifeng|male|云扬|云健|康康/i;
  const f = pool.find(function(v){ return female.test(v.name); });
  const m = pool.find(function(v){ return male.test(v.name); });
  if(gender === 'f') return f || zhVoice || pool[0] || null;
  return m || null;   /* ไม่มีเสียงผู้ชายแยก → ใช้ pitch ต่ำแทน */
}
/* สร้างลำดับเสียงบทสนทนา — นำหน้าทุกประโยคด้วย "女说。"/"男说。" แล้วปิดท้ายด้วยคำถามจีน */
function buildDlgQueue(q){
  const lines = (q && q.dlg) || [];
  const queue = [];
  lines.forEach(function(line){
    const female = /女/.test(line.s || '');
    const cue = female ? '女说。' : '男说。';
    queue.push({txt: cue + (line.zh || ''), lang:'zh-CN', pitch: female ? 1.28 : .62, rate: female ? .9 : .78, gender: female ? 'f' : 'm'});
  });
  const ask = q.zq || q.q || '';
  if(ask) queue.push({txt: ask, lang:'zh-CN', pitch:1.05, rate:.8, gender:'q'});
  return queue;
}
function speakDlg(q){
  const my = ++dlgToken;
  try{ speechSynthesis.cancel(); }catch(e){}
  const vF = pickGenderVoice('f');
  const vM = pickGenderVoice('m');
  const queue = buildDlgQueue(q);
  let i = 0;
  const next = function(){
    if(my !== dlgToken) return;               /* กดเล่นซ้ำ → ยกเลิกสายเดิมทันที */
    if(i >= queue.length) return;
    const item = queue[i++];
    const u = new SpeechSynthesisUtterance(item.txt);
    u.lang = item.lang; u.pitch = item.pitch; u.rate = item.rate; u.onerror = function(){};
    if(item.gender === 'f' && vF) u.voice = vF;
    else if(item.gender === 'm' && vM) u.voice = vM;
    else if(vF) u.voice = vF;
    u.onend = function(){ next(); };
    try{ speechSynthesis.speak(u); }catch(e){ next(); }
  };
  next();
}
function examQuestionHTML(q, part){
  if(part === 1){
    if(q.t === 'talkq'){
      return `
        <div style="text-align:center;margin-bottom:18px">
          <button class="wr-tool gold" style="margin:0 auto 10px" onclick="speakTalkQ(${esc(JSON.stringify({text:q.text, dlg:q.dlg, q:q.q}))})">${ICON('volume-2')} ฟังข้อความยาว</button>
          ${q.title?`<div class="q-sub" style="margin-bottom:4px;color:var(--gold)">${esc(q.title)}</div>`:''}
          <div class="q-text" style="font-size:19px;margin-bottom:6px;font-family:var(--ff-cn)">${esc(q.q||'')}</div>
          <button class="mini-btn ghost" style="margin:0 auto 6px" onclick="this.nextElementSibling.classList.toggle('show')">${ICON('eye')} แสดง/ซ่อนเนื้อหาการฟัง</button>
          <div class="dlg-lines" style="text-align:left">
            ${q.dlg && q.dlg.length ? (q.dlg||[]).map(l=>`<p><b>${esc(l.s||'')}:</b> <span style="font-family:var(--ff-cn)">${esc(l.zh||'')}</span></p>`).join('') : `<p style="font-family:var(--ff-cn)">${esc(q.text||'')}</p>`}
          </div>
        </div>
        <div class="opts" id="opts">
          ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
            <span class="key">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}
        </div>`;
    }
    if(q.t === 'dlg'){
      return `
        <div style="text-align:center;margin-bottom:18px">
          <button class="wr-tool gold" style="margin:0 auto 10px" onclick="speakDlg(${esc(JSON.stringify({dlg:q.dlg, zq:q.zq||q.q}))})">${ICON('volume-2')} ฟังบทสนทนา</button>
          <div class="q-text" style="font-size:19px;margin-bottom:6px;font-family:var(--ff-cn)">${esc(q.zq||q.q||'')}</div>
          <button class="mini-btn ghost" style="margin:0 auto 6px" onclick="this.nextElementSibling.classList.toggle('show')">${ICON('eye')} แสดง/ซ่อนบทสนทนา</button>
          <div class="dlg-lines">
            ${(q.dlg||[]).map(l=>`<p><b>${esc(l.s||'')}:</b> <span style="font-family:var(--ff-cn)">${esc(l.zh||'')}</span></p>`).join('')}
          </div>
        </div>
        <div class="opts" id="opts">
          ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
            <span class="key">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}
        </div>`;
    }
    return `
      <div style="text-align:center;margin-bottom:18px">
        <button class="wr-tool gold" style="margin:0 auto 10px" onclick="speak(${JSON.stringify(q.zh||'')})">${ICON('volume-2')} 再听一遍</button>
        <div class="q-sub" style="margin-bottom:0;font-family:var(--ff-cn)">${esc(q.q||'')}</div>
      </div>
      <div class="opts" id="opts">
        ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
          <span class="key">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}
      </div>`;
  }
  if(q.t === 'cblank'){
    return `
      <div class="passage-box">
        ${esc(q.text||'').replace(/___/g, '<span class="blank">＿＿</span>')}
      </div>
      <div class="q-text" style="font-size:16px;margin-top:12px">${esc(q.q||'')}</div>
      <div class="opts" id="opts">
        ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
          <span class="key">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}
      </div>`;
  }
  if(q.t === 'match'){
    return `
      <div class="passage-box" style="border-left-color:var(--red)">
        <p class="p-text" style="font-size:16px">${esc(q.text||'')}</p>
      </div>
      <div class="q-sub" style="margin-top:12px;font-family:var(--ff-cn)">${esc(q.q||'请选出与试题内容一致的一项。')}</div>
      <div class="opts" id="opts">
        ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
          <span class="key">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}
      </div>`;
  }
  if(q.t === 'compose'){
    const words = q.words || [];
    const v = EX.composeText || '';
    return `
      ${q.text?`<div class="passage-box" style="border-left-color:var(--gold);max-height:260px;overflow-y:auto"><p class="p-text" style="font-size:15px">${esc(q.text)}</p></div>`:''}
      <div class="q-sub" style="margin-bottom:8px;font-family:var(--ff-cn)">${esc(q.q||'请结合下列词语，写一篇 80 字左右的短文。')}</div>
      ${words.length?`<div class="compose-words">
        ${words.map(w=>`<span class="tag-pill gold" style="font-family:var(--ff-cn);font-size:17px">${esc(w.cn||w)}</span>`).join('')}
      </div>`:''}
      <textarea class="compose-box" id="composeBox" rows="6" placeholder="เขียน短文ภาษาจีน 80 ตัวอักษรโดยใช้คำที่กำหนดให้ครบ…" oninput="EX.composeText=this.value;const c=$('#composeCount');if(c)c.textContent=this.value.length">${esc(v)}</textarea>
      <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:10px">
        <span style="font-size:12.5px;color:var(--text-3)">จำนวนตัวอักษร: <b id="composeCount" style="font-family:var(--ff-num)">${v.length}</b> / 80</span>
        <span style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="mini-btn ghost" onclick="composeReveal()">${ICON('eye')} ดูตัวอย่าง</button>
          <button class="btn btn-primary btn-sm" onclick="composeCheck()">${ICON('check')} ส่งคำตอบ</button>
        </span>
      </div>
      <div id="composeResult"></div>`;
  }
  if(q.t === 'pread'){
    return `
      <div class="passage-box">
        ${q.title?`<b class="p-title">${esc(q.title)}</b>`:''}
        <p class="p-text" style="font-family:var(--ff-cn)">${esc(q.text||'')}</p>
        ${q.py?`<p class="p-py">${esc(q.py)}</p>`:''}
      </div>
      <div class="q-text" style="font-size:17px;margin-top:14px;font-family:var(--ff-cn)">${esc(q.q||'')}</div>
      <div class="opts" id="opts">
        ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
          <span class="key">${String.fromCharCode(65+i)}</span><span style="font-family:var(--ff-cn)">${esc(o)}</span></button>`).join('')}
      </div>`;
  }
  /* HSK6: เลือกประโยคที่ผิดไวยากรณ์ */
  if(q.t === 'errpick'){
    return `
      <div class="q-sub" style="font-family:var(--ff-cn)">请选出有语病的一项。</div>
      <div class="opts opts-vertical" id="opts">
        ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
          <span class="key">${String.fromCharCode(65+i)}</span><span style="font-family:var(--ff-cn);white-space:normal">${esc(o)}</span></button>`).join('')}
      </div>`;
  }
  /* HSK6: เลือกประโยคเติมช่องว่างในบทความ */
  if(q.t === 'sentfill'){
    return `
      <div class="passage-box" style="border-left-color:var(--red)">
        <p class="p-text">${esc(q.text||'').replace(/___/g,'<span class="blank">＿＿＿＿＿＿＿＿</span>')}</p>
      </div>
      <div class="q-sub" style="margin-top:12px;font-family:var(--ff-cn)">请选出填入空格最恰当的句子。</div>
      <div class="opts opts-vertical" id="opts">
        ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
          <span class="key">${String.fromCharCode(65+i)}</span><span style="font-family:var(--ff-cn);white-space:normal">${esc(o)}</span></button>`).join('')}
      </div>`;
  }
  if(q.t === 'order'){
    if(!EX.orderPool){
      if(Array.isArray(q.w0) && q.w0.length === q.a.length) EX.orderPool = q.w0.slice();
      else EX.orderPool = seededShuffle(q.a, seedRng(hashCode('ord' + EX.idx + EX.lv + EX.set)));
    }
    const pool = EX.orderPool;
    const used = (EX.orderUsed = EX.orderUsed || []);
    const remaining = pool.map((w,i)=>i).filter(i=>!used.includes(i));
    return `
      <div class="q-text" style="font-size:16px;font-family:var(--ff-cn)">${esc(q.q && !/[฀-๿]/.test(q.q) ? q.q : '请排列词语，组成正确的句子。')}</div>
      <div class="q-sub">按正确的顺序排列词语，组成句子。</div>
      <div style="min-height:62px;padding:14px;border-radius:13px;border:1.5px dashed var(--line);background:var(--bg);display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:16px" id="orderSlot">
        ${examChosen().length? examChosen().map(w=>`<span class="tag-pill red" style="font-family:var(--ff-cn);font-size:17px;padding:7px 14px">${esc(w)}</span>`).join('')
          : '<span style="color:var(--text-3);font-size:13.5px">ประโยคที่เรียงแล้วจะปรากฏที่นี่…</span>'}
      </div>
      <div class="opts" style="grid-template-columns:repeat(auto-fit,minmax(86px,1fr));display:grid">
        ${remaining.map(i=>`<button class="opt" style="justify-content:center;font-family:var(--ff-cn);font-size:19px" onclick="examPick(${i})">${esc(pool[i])}</button>`).join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">
        <button class="mini-btn ghost" onclick="examUndo()">${ICON('undo')} ย้อนกลับ</button>
        <button class="mini-btn" onclick="examCheck()" ${examChosen().length===q.a.length?'':'disabled style="opacity:.45;cursor:not-allowed"'}>ตรวจคำตอบ</button>
      </div>`;
  }
  const isTone = q.t === 'tone';
  let body = '', sub = '';
  if(q.t === 'fill'){
    body = `<div class="q-text" style="font-family:var(--ff-cn)">${esc(q.q||'').replace(/___/g,'<span class="blank">＿＿</span>')}</div>`;
    sub += '<div>请选出正确答案。</div>';
  } else if(q.t === 'pinyin'){
    body = `<div class="q-text" style="font-family:var(--ff-cn)">${esc(q.q||'')}</div>`;
    sub += '<div>请选出正确的拼音。</div>';
  } else if(isTone){
    const t = esc(q.target||'');
    body = `<div class="q-text" style="font-size:23px;font-family:var(--ff-py)">${esc(q.py||'').replace(t, `<span class="blank">${t}</span>`)}</div>`;
    sub += `<div>画线的音节是第几声？</div>`;
  }
  return body + (sub?`<div class="q-sub">${sub}</div>`:'') + `
    <div class="opts" id="opts">
      ${examOpts(q).map((o,i)=>`<button class="opt" data-val="${esc(o)}" onclick="answerExam(${i},this)">
        <span class="key">${String.fromCharCode(65+i)}</span><span>${isTone?('เสียงที่ '+esc(o)):esc(o)}</span></button>`).join('')}
    </div>`;
}
function examOpts(q){
  if(!EX.opts){
    const correct = String(q.a);
    const wrongs = (q.w||[]).map(String);
    EX.opts = seededShuffle([correct, ...wrongs.slice(0,3)], seedRng(hashCode('opts' + EX.idx + EX.lv + EX.set + correct)));
  }
  return EX.opts;
}
function examChosen(){ return (EX.orderUsed||[]).map(i => (EX.orderPool||[])[i]); }
function examPick(i){
  if(EX.answered) return;
  EX.orderUsed = EX.orderUsed || [];
  if(EX.orderUsed.includes(i)) return;
  EX.orderUsed.push(i);
  renderExamPlay();
  startExamTimer(EX.qs[EX.idx]);
}
function examUndo(){ (EX.orderUsed||[]).pop(); renderExamPlay(); }
function examCheck(){
  if(EX.answered) return;
  clearExamTimer();
  const q = EX.qs[EX.idx];
  const ok = examChosen().join('') === q.a.join('');
  EX.answered = true;
  const firstTime = EX.answers[EX.idx] === undefined;
  EX.answers[EX.idx] = ok ? '✓' : '✗';
  const slot = $('#orderSlot');
  if(ok){
    if(firstTime) EX.score++;
    slot.style.borderColor = '#4caf50';
    slot.style.background = 'rgba(76,175,80,.12)';
    examAdvance(900);
  } else {
    if(firstTime){ EX.wrong++; EX.errors.push(q); }
    slot.style.borderColor = 'var(--red)';
    slot.style.background = 'rgba(178,58,46,.1)';
    const div = document.createElement('div');
    div.className = 'answer-explain';
    div.innerHTML = `正确答案：<b style="font-family:var(--ff-cn);font-size:17px">${esc(q.a.join(''))}</b>${q.py?`（${esc(q.py)}）`:''}`;
    $('#gameBox').appendChild(div);
    examAdvance(2100);
  }
}
function composeReveal(){
  const q = EX.qs[EX.idx];
  const el = $('#composeResult');
  if(!el) return;
  el.innerHTML = '<div class="answer-explain" style="margin-top:10px">ตัวอย่าง短文:<br><span style="font-family:var(--ff-cn);font-size:16px;line-height:2">' + esc(q.model||'') + '</span></div>';
}
function composeCheck(){
  if(EX.answered) return;
  clearExamTimer();
  const q = EX.qs[EX.idx];
  const text = (EX.composeText || '').trim();
  const el = $('#composeResult'); if(!el) return;
  if(text.length < 20){
    if(el) el.innerHTML = '<div class="bs-wrong">' + ICON('x') + ' 字数太少 — 请写长一些（目标 80 字）</div>';
    return;
  }
  const words = q.words || [];
  let used = 0;
  words.forEach(function(w){ if(text.indexOf(w.cn || w) > -1) used++; });
  const need = words.length;
  const ok = used >= need && text.length >= 60;
  EX.answered = true;
  const firstTime = EX.answers[EX.idx] === undefined;
  EX.answers[EX.idx] = used >= need ? '✓' : '✗';
  const gained = ok ? 1 : 0;
  if(ok){
    if(firstTime) EX.score++;
    el.innerHTML = '<div class="bs-right">' + ICON('check') + ' 已提交 — 使用了 ' + used + '/' + need + ' 个词语 · ' + text.length + ' 字</div>';
  } else {
    if(firstTime){ EX.wrong++; EX.errors.push(q); }
    el.innerHTML = '<div class="bs-wrong">' + ICON('x') + ' 词语未用完 (' + used + '/' + need + ') 或字数不足 60 字 — 修改后可重新提交</div>';
    EX.answered = false;
    return;
  }
  const ta = $('#composeBox'); if(ta) ta.disabled = true;
  examAdvance(ok ? 1200 : 1200);
}
function answerExam(i, btn){
  if(EX.answered || btn.disabled) return;
  clearExamTimer();
  EX.answered = true;
  const q = EX.qs[EX.idx];
  const chosen = EX.opts[i];
  const firstTime = EX.answers[EX.idx] === undefined;
  EX.answers[EX.idx] = String.fromCharCode(65 + i);
  const ok = String(chosen) === String(q.a);
  if(firstTime){
    if(ok) EX.score++;
    else{ EX.wrong++; EX.errors.push(q); }
  }
  if(ok) btn.classList.add('correct');
  else{
    btn.classList.add('wrong');
    $$('#opts .opt').forEach(b=>{
      if(String(b.dataset.val) === String(q.a)) b.classList.add('correct');
    });
  }
  $$('#opts .opt').forEach(b=>b.disabled = true);
  const ex = examExplain(q);
  if(ex){
    const div = document.createElement('div');
    div.className = 'answer-explain';
    div.innerHTML = ex;
    $('#gameBox').appendChild(div);
  }
  examAdvance(ok?1000:2100);
}
function examExplain(q){
  if(q.t === 'fill') return `正确答案：<b>${esc(String(q.a))}</b>`;
  if(q.t === 'vocab') return `<b style="font-family:var(--ff-cn)">${esc(q.q||'')}</b>（${esc(q.py||'')}） — ${esc(String(q.a))}`;
  if(q.t === 'pinyin') return `正确答案：<b>${esc(String(q.a))}</b>`;
  if(q.t === 'tone') return `正确答案：第 <b>${esc(String(q.a))}</b> 声`;
  if(q.t === 'lpinyin') return `正确答案：<b>${esc(String(q.a))}</b>`;
  if(q.t === 'lword') return `正确答案：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
  if(q.t === 'lhear') return `正确答案：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
  if(q.t === 'cblank') return `正确答案：<b>${esc(String(q.a))}</b>`;
  if(q.t === 'match') return `正确答案：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
  if(q.t === 'sentfill') return `正确答案：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
  if(q.t === 'errpick') return `有语病的一项：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
  if(q.t === 'talkq') return `正确答案：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
  if(q.t === 'listen') return `正确答案：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
  if(q.t === 'dlg') return `正确答案：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
  if(q.t === 'order') return `正确答案：<b style="font-family:var(--ff-cn)">${esc((q.a||[]).join(''))}</b>`;
  return `正确答案：<b style="font-family:var(--ff-cn)">${esc(String(q.a))}</b>`;
}
function startExamTimer(q){
  clearExamTimer();
  const total = examTimeFor(q) * 1000;
  const start = Date.now();
  const tick = setInterval(()=>{
    const left = Math.max(0, Math.ceil((total - (Date.now() - start))/1000));
    const el = $('#examClockSec');
    if(el) el.textContent = left;
    if(left <= 0){
      clearInterval(tick);
      if(!EX.answered){
        EX.answered = true;
        EX.wrong++; EX.errors.push(q);
        if(q.t === 'order'){
          const div = document.createElement('div');
          div.className = 'answer-explain';
          div.innerHTML = `หมดเวลา — คำตอบคือ <b style="font-family:var(--ff-cn)">${esc(q.a.join(''))}</b>`;
          $('#gameBox').appendChild(div);
        } else {
          $$('#opts .opt').forEach(b=>{ b.disabled = true; if(String(b.dataset.val) === String(q.a)) b.classList.add('correct'); });
          const div = document.createElement('div');
          div.className = 'answer-explain';
          div.innerHTML = `หมดเวลา — คำตอบคือ <b>${esc(String(q.a))}</b>`;
          $('#gameBox').appendChild(div);
        }
        examAdvance(1800);
      }
    }
  }, 500);
  EX.timer = tick;
}
function clearExamTimer(){ if(EX.timer){ clearInterval(EX.timer); EX.timer = null; } }
function examAdvance(ms){
  setTimeout(()=>{
    EX.idx++; EX.answered = false; EX.opts = null; EX.orderPool = null; EX.orderUsed = []; EX.composeText = '';
    renderExamPlay();
  }, ms);
}

/* --------------------------------------------------------------------------
   ผลสอบ
-------------------------------------------------------------------------- */
function renderExamResult(){
  clearExamTimer();
  const total = EX.qs.length;
  const pct = Math.round((EX.score/total)*100);
  const passed = pct >= EXAM_PASS;
  const stars = pct >= 90 ? 3 : pct >= 75 ? 2 : pct >= EXAM_PASS ? 1 : 0;
  const u = currentUser();
  let gainTxt = '';
  if(u){
    u.exams = u.exams || {};
    const rec = u.exams[EX.lv] = u.exams[EX.lv] || {sets:{}};
    rec.sets = rec.sets || {};
    const prev = rec.sets[EX.set] || {best:0, attempts:0};
    const old = prev.best || 0;
    rec.sets[EX.set] = {best:Math.max(old, pct), attempts:(prev.attempts||0)+1, ts:Date.now()};
    const pts = Math.round(EX.score*2) + (passed?40:0) + (pct>old?stars*25:0);
    const xp  = Math.round(EX.score*4) + (passed?80:0);
    award(u, pts, xp, 'exam', 'ข้อสอบ HSK '+EX.lv+' ชุด '+EX.set+' — '+pct+'%');
    checkBadges(u);
    saveUsers();
    gainTxt = `+${pts} แต้ม · +${xp} XP${pct>old?' · คะแนนสูงสุดใหม่!':''}`;
  }
  const msg = pct >= 90 ? '太棒了! ยอดเยี่ยมมาก!' : pct >= 75 ? '很好! ทำได้ดีมาก' : passed ? '不错! ผ่านแล้ว' : pct >= 50 ? '加油! เกือบผ่านแล้ว' : '再来一次! ลองอีกครั้ง';
  const box = $('#examPlay');
  box.innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span>
      <a onclick="go('hsk')">HSK</a> <span class="sep">›</span> <span>ผลสอบ HSK ${EX.lv} · ชุด ${EX.set}</span></div>
    <div style="max-width:760px;margin:0 auto">
      <div class="exam-cert">
        <div class="seal">${passed?'过':'练'}</div>
        <h3>ผลสอบจำลอง HSK ${EX.lv} ชุด ${EX.set} · ${hskMeta()[EX.lv].name}</h3>
        <div class="score">${pct}%</div>
        <p style="margin:6px 0 10px">${msg} — ตอบถูก ${EX.score} จาก ${total} ข้อ (${EX.score}/${total})</p>
        <div class="result-stars">${starsStr(stars)}</div>
        ${gainTxt?`<p style="color:var(--red);font-weight:700;margin-top:8px">${gainTxt}</p>`:''}
        <p style="margin-top:10px">${passed? 'ผ่านเกณฑ์ '+EXAM_PASS+'% แล้ว — ลองชุดถัดไปหรือระดับถัดไปได้เลย!' : `ต้องได้ ${EXAM_PASS}% ขึ้นไปจึงจะผ่าน — ทบทวนแล้วลองใหม่ได้ไม่จำกัดครั้ง`}</p>
        <div class="result-row" style="margin-top:20px">
          <button class="btn btn-primary" onclick="startExam(${EX.lv},${EX.set})">${ICON('refresh-cw')} สอบชุดนี้ใหม่</button>
          ${EX.set<EXAM_SETS?`<button class="btn btn-gold" onclick="startExam(${EX.lv},${EX.set+1})">ชุดถัดไป →</button>`:''}
          ${EX.lv<6?`<button class="btn btn-ghost" onclick="startExam(${EX.lv+1},1)">HSK ${EX.lv+1} →</button>`:''}
          <button class="btn btn-ghost" onclick="go('hsk')">ชุดข้อสอบทั้งหมด</button>
        </div>
      </div>
      ${EX.errors.length? `
        <div class="answer-explain" style="margin-top:22px">
          <b>ทบทวนข้อที่ตอบผิด (${EX.errors.length} ข้อ)</b><br>
          ${EX.errors.slice(0,12).map(q=>{
            if(q.t==='fill') return `• ${esc(q.q||'')} → <b>${esc(q.a)}</b>`;
            if(q.t==='pinyin'||q.t==='lpinyin') return `• ${esc(q.q||q.zh||'')} → <b>${esc(q.a)}</b>`;
            if(q.t==='lword'||q.t==='lhear') return `• ${esc(q.zh||'')} → <b style="font-family:var(--ff-cn)">${esc(q.a)}</b>`;
            if(q.t==='tone') return `• ${esc(q.py||'')} → 第 <b>${esc(String(q.a))}</b> 声`;
            if(q.t==='order') return `• → <b style="font-family:var(--ff-cn)">${esc((q.a||[]).join(''))}</b>`;
            if(q.t==='dlg') return `• ${esc((q.dlg||[]).map(l=>l.s+':'+l.zh).join(' | '))} → <b style="font-family:var(--ff-cn)">${esc(q.a)}</b>`;
            if(q.t==='talkq') return `• ${q.title?esc(q.title)+' — ':''}${esc(q.q||'')} → <b style="font-family:var(--ff-cn)">${esc(q.a)}</b>`;
            if(q.t==='cblank'||q.t==='sentfill'||q.t==='match') return `• → <b style="font-family:var(--ff-cn)">${esc(q.a)}</b>`;
            if(q.t==='errpick') return `• 有语病的一项 → <b>${esc(q.a)}</b>`;
            if(q.t==='compose') return `• 写短文 — 参考示例`;
            if(q.t==='pread') return `• ${q.title?esc(q.title)+' — ':''}${esc(q.q||'')} → <b style="font-family:var(--ff-cn)">${esc(q.a)}</b>`;
            return `• ${esc(q.q||'')} → <b>${esc(q.a)}</b>${q.zh?` (${esc(q.zh)})`:''}`;
          }).join('<br>')}
        </div>` : ''}
    </div>`;
}
