/* ==========================================================================
   为什么中文 · สแกนอักษรจีน (OCR) → ตัวอักษร + พินอิน + ความหมาย + PDF ฝึกเขียน
   OCR ใช้ Tesseract.js (โหลดจาก CDN เมื่อใช้ครั้งแรก — ต้องออนไลน์ครั้งแรก)
   ข้อมูลตัวอักษร/คำศัพท์ดึงจากฐานข้อมูลในเว็บ (CHARS + HSK)
   ========================================================================== */
'use strict';

let scanState = {imgDataUrl:'', lines:[], busy:false};
let examScanState = {imgDataUrl:'', lines:[], busy:false};
let scanMode = 'text';   /* 'text' = สแกนอักษรจีน · 'exam' = สแกนข้อสอบให้ AI ช่วยทำ */

/* -------- สิทธิ์การใช้สแกน (พรีเมียม) ------------------------------------- */
const SCAN_TRIAL_LIMIT = 3;     /* ทดลองใช้ฟรี 3 ครั้ง */
const SCAN_MONTH_CAP = 20;      /* แพ็กเกจรายเดือน: 20 สแกน/เดือน */
function scanMonthKey(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1); }
function scanTrialUsed(){
  try{ return Math.max(0, +localStorage.getItem('wszw_scan_trial') || 0); }catch(e){ return 0; }
}
function scanMonthUsed(){
  try{
    const s = JSON.parse(localStorage.getItem('wszw_scan_month') || 'null');
    return (s && s.m === scanMonthKey()) ? Math.max(0, +s.used || 0) : 0;
  }catch(e){ return 0; }
}
/* ผลสิทธิ์: ok / need: 'premium' | 'cap' */
function scanAllow(){
  const u = currentUser();
  if(u && isPremium(u)){
    const plan = planById(u.premium.plan);
    if(plan && (plan.months === 0 || plan.months >= 6)) return {ok:true, tier:'unlimited'};
    if(plan && plan.months === 1){
      const used = scanMonthUsed();
      return used < SCAN_MONTH_CAP ? {ok:true, tier:'monthly', remain: SCAN_MONTH_CAP - used}
                                  : {ok:false, need:'cap', used, cap: SCAN_MONTH_CAP};
    }
  }
  const used = scanTrialUsed();
  return used < SCAN_TRIAL_LIMIT ? {ok:true, tier:'trial', remain: SCAN_TRIAL_LIMIT - used}
                                 : {ok:false, need:'premium', used};
}
function scanConsume(){
  const gate = scanAllow();
  try{
    if(gate.tier === 'monthly'){
      localStorage.setItem('wszw_scan_month', JSON.stringify({m: scanMonthKey(), used: scanMonthUsed() + 1}));
    } else if(gate.tier === 'trial'){
      localStorage.setItem('wszw_scan_trial', String(scanTrialUsed() + 1));
    }
  }catch(e){}
}
function scanGateTxt(){
  const g = scanAllow();
  const u = currentUser();
  if(g.ok){
    if(g.tier === 'unlimited') return 'พรีเมียม — สแกนได้ไม่จำกัด';
    if(g.tier === 'monthly') return 'พรีเมียมรายเดือน — เหลือ <b>' + g.remain + '</b> สแกนในเดือนนี้ (สูงสุด ' + SCAN_MONTH_CAP + ')';
    return 'ทดลองใช้ฟรี — เหลือ <b>' + g.remain + '</b> ครั้ง (จาก ' + SCAN_TRIAL_LIMIT + ')';
  }
  if(g.need === 'cap') return 'ครบ ' + SCAN_MONTH_CAP + ' สแกนของเดือนนี้แล้ว — อัปเกรดแพ็กเกจ 6 เดือน+ เพื่อสแกนไม่จำกัด';
  return 'ใช้ครบ ' + SCAN_TRIAL_LIMIT + ' ครั้งฟรีแล้ว — สมัครพรีเมียมเพื่อสแกนต่อ';
}
/* AI แก้โจทย์ข้อสอบ — สิทธิ์เฉพาะแพ็กเกจ 6 เดือนขึ้นไป */
function scanSolverAllow(){
  const u = currentUser();
  if(!u || !isPremium(u)) return false;
  const plan = planById(u.premium.plan);
  return !!(plan && (plan.months === 0 || plan.months >= 6));
}
function showSolverGate(){
  glassPop({
    icon: 'sparkles',
    title: 'AI แก้โจทย์ข้อสอบ',
    body: '<p style="margin:0">สแกนโจทย์ข้อสอบพร้อมตัวเลือก แล้ว AI จะวิเคราะห์หาคำตอบที่ถูกต้องพร้อมคำอธิบาย<br><b>สิทธิ์นี้สำหรับสมาชิกแพ็กเกจ 6 เดือนขึ้นไปเท่านั้น</b></p>',
    actions: [
      {label:'ปิด', cls:'btn-ghost', fn: closeGlassPop},
      {label:'ดูแพ็กเกจ 6 เดือน', cls:'btn-gold', fn: function(){ closeGlassPop(); go('premium'); }}
    ]
  });
}
/* --------------------------------------------------------------------------
   โหมดข้อสอบ: OCR แล้วให้ AI ออนไลน์วิเคราะห์คำตอบ (fallback เป็นฐานข้อมูลในเว็บ)
-------------------------------------------------------------------------- */
function onExamFile(input){
  const f = input.files && input.files[0];
  if(!f) return;
  if(typeof readImageFile !== 'function'){ toast('ฟังก์ชันอัปโหลดยังไม่พร้อม'); return; }
  readImageFile(input, function(data){
    downscaleScanImage(data, function(down){
      examScanState.imgDataUrl = down;
      const pv = $('#examPreview');
      if(pv) pv.innerHTML = '<img class="img-prev" src="' + down + '" style="max-height:220px;border-radius:12px;border:1px solid var(--line);margin-top:14px">';
      toast('ภาพพร้อมแล้ว — กด "สแกนแล้วให้ AI วิเคราะห์"');
    });
  }, 2400);
}
function renderExamBusy(msg, pct){
  const el = $('#examBusy'); if(!el) return;
  if(!msg){ el.innerHTML = ''; return; }
  el.innerHTML = '<div class="scan-busy">' + ICON('refresh-cw') + ' ' + esc(msg) + (pct!=null?' '+pct+'%':'') + '<div class="wr-progress" style="margin:8px 0 0"><i style="width:' + (pct||8) + '%"></i></div></div>';
}
function runExamScan(){
  if(!scanSolverAllow()){ showSolverGate(); return; }
  if(examScanState.busy) return;
  if(!examScanState.imgDataUrl){ toast('เลือกภาพโจทย์ข้อสอบก่อน'); return; }
  examScanState.busy = true;
  const btn = $('#examScanBtn'); if(btn) btn.disabled = true;
  renderExamBusy('กำลังโหลดโมเดล OCR…', 5);
  loadTesseract()
    .then(function(){
      renderExamBusy('กำลังปรับภาพให้คมชัด…', 8);
      return preprocessForOCR(examScanState.imgDataUrl);
    })
    .then(function(png){
      renderExamBusy('กำลังอ่านข้อความจากภาพ…', 14);
      return ocrWithTesseract(png, 'chi_sim+eng+tha', {tessedit_pageseg_mode: '6', preserve_interword_spaces: '1'}, function(m){
        if(m.status === 'recognizing text') renderExamBusy('กำลังอ่านข้อความจากภาพ…', 14 + Math.round((m.progress||0)*56));
      });
    })
    .then(function(data){
      let text = (data && data.text) || '';
      const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
      if(cjk < 4){
        /* ภาพอ่านไม่ชัด → retry ด้วยภาพขาว-ดำ (Otsu) + PSM อัตโนมัติ */
        renderExamBusy('ข้อความยังไม่ชัด — กำลังอ่านซ้ำด้วยภาพขาว-ดำ…', 72);
        return preprocessForOCR(examScanState.imgDataUrl, {binarize: true})
          .then(function(png2){
            return ocrWithTesseract(png2, 'chi_sim+eng+tha', {tessedit_pageseg_mode: '3', preserve_interword_spaces: '1'}, function(m){
              if(m.status === 'recognizing text') renderExamBusy('กำลังอ่านซ้ำ…', 72 + Math.round((m.progress||0)*24));
            });
          })
          .then(function(data2){
            text = (data2 && data2.text) || '';
            return {text: text, retried: true};
          });
      }
      return {text: text, retried: false};
    })
    .then(function(out){
      examScanState.lines = out.text.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
      renderExamTextPreview();
      if(!examScanState.lines.length){ toast('อ่านข้อความจากภาพไม่ได้ — ถ่ายให้ชัด ตรง แสงพอ แล้วลองใหม่'); return null; }
      if(out.retried) toast('อ่านซ้ำด้วยภาพขาว-ดำแล้ว');
      return aiSolveExam();
    })
    .catch(function(){
      toast('ใช้ OCR ไม่ได้ — ต้องเชื่อมต่ออินเทอร์เน็ตครั้งแรกเพื่อโหลดโมเดล');
    })
    .finally(function(){
      examScanState.busy = false;
      if(btn) btn.disabled = false;
      renderExamBusy('');
    });
}
function renderExamTextPreview(){
  const el = $('#examRawText'); if(!el) return;
  if(!examScanState.lines.length){ el.innerHTML = ''; return; }
  el.innerHTML = '<b>ข้อความที่อ่านได้จากภาพ:</b><pre style="white-space:pre-wrap;font-family:var(--ff-cn);font-size:14px;margin:6px 0 0">' + esc(examScanState.lines.join('\n')) + '</pre>';
}
/* ถาม AI ออนไลน์ (Pollinations — ไม่ต้องใช้ API key) */
function askAIExam(scannedText){
  const system = 'คุณคือติวเตอร์ข้อสอบภาษาจีน HSK ผู้ใช้สแกนโจทย์ข้อสอบพร้อมตัวเลือกมาให้ (ข้อความจาก OCR อาจมีตัวอักษรเพี้ยนเล็กน้อย) จงวิเคราะห์และระบุคำตอบที่ถูกต้องเพียงข้อเดียว พร้อมอธิบายสั้น ๆ เป็นภาษาไทยว่าทำไมข้อนั้นถูก ตอบเป็น JSON เท่านั้น รูปแบบ {"answer":"...","explanation":"..."} ห้ามตอบอย่างอื่น';
  const body = JSON.stringify({
    model: 'openai',
    messages: [
      {role: 'system', content: system},
      {role: 'user', content: 'เนื้อหาที่สแกนได้:\n' + scannedText}
    ]
  });
  const callOpenAI = function(){
    return fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: body
    }).then(function(r){
      if(!r.ok) throw new Error('api-' + r.status);
      return r.json();
    }).then(function(j){
      const c = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if(!c) throw new Error('empty');
      return c;
    });
  };
  const callSimple = function(){
    const prompt = system + '\n\n' + scannedText;
    return fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt))
      .then(function(r){ if(!r.ok) throw new Error('api-' + r.status); return r.text(); });
  };
  return callOpenAI().catch(callSimple);
}
function parseAIAnswer(raw){
  let s = String(raw || '').trim();
  s = s.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try{
    const j = JSON.parse(s);
    if(j && j.answer) return {answer: String(j.answer), explanation: String(j.explanation || ''), source: 'ai'};
  }catch(e){}
  return null;
}
/* ถ้า AI ตอบเป็นตัวอักษรตัวเลือก (A–D) → เติมข้อความตัวเลือกจริงจากการสแกน */
function enrichAnswer(ans){
  const m = String(ans||'').trim().match(/^([A-Da-d])$/);
  if(!m) return ans;
  const letter = m[1].toUpperCase();
  const line = examScanState.lines.find(function(l){
    return new RegExp('^\\s*' + letter + '\\s*[\\.、\\)]').test(l);
  });
  if(line) return letter + '. ' + line.replace(/^\s*[A-Da-d]\s*[\.、\)]?\s*/, '');
  return ans;
}
function renderExamSolveCard(res){
  const el = $('#examSolve'); if(!el) return;
  el.innerHTML = `
    <div class="solve-card yes">
      <div class="kicker">${res.source === 'ai' ? 'AI ออนไลน์วิเคราะห์แล้ว' : 'วิเคราะห์จากฐานข้อมูลข้อสอบของเว็บ (โหมดออฟไลน์)'}</div>
      <h3>${ICON('check')} คำตอบที่ถูกต้อง: <b style="color:var(--red)">${esc(res.answer)}</b></h3>
      ${res.explanation?`<p>${esc(res.explanation)}</p>`:''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
        <button class="mini-btn ghost" onclick="go('hsk')">ไปทำข้อสอบในระบบ</button>
      </div>
    </div>`;
}
function aiSolveExam(){
  const box = $('#examSolve');
  if(box) box.innerHTML = '<div class="scan-busy">' + ICON('sparkles') + ' AI ออนไลน์กำลังวิเคราะห์โจทย์และตัวเลือก… (อาจใช้เวลา 10–30 วินาที)</div>';
  const text = examScanState.lines.join('\n');
  return askAIExam(text)
    .then(function(raw){
      const parsed = parseAIAnswer(raw);
      if(parsed){
        parsed.answer = enrichAnswer(parsed.answer);
        renderExamSolveCard(parsed);
        return;
      }
      return localSolveFallback();
    })
    .catch(function(){
      return localSolveFallback();
    });
}
function localSolveFallback(){
  const res = solveExamQuestion(examScanState.lines);
  const el = $('#examSolve');
  if(!el) return;
  if(!res){
    el.innerHTML = `
      <div class="solve-card no">
        <div class="kicker">วิเคราะห์ไม่สำเร็จ</div>
        <h3>ยังหาคำตอบไม่ได้</h3>
        <p>ถ่ายภาพใหม่ให้เห็นโจทย์และตัวเลือกครบทุกข้อ พื้นหลังเรียบ แสงเพียงพอ แล้วลองอีกครั้ง — ระบบจะถาม AI ออนไลน์ก่อน และเทียบฐานข้อมูลข้อสอบของเว็บเป็นตัวสำรอง</p>
      </div>`;
    return;
  }
  renderExamSolveCard({answer: res.q.a, explanation: res.explanation, source: 'local'});
}
function showScanGate(){
  const g = scanAllow();
  const msg = g.need === 'cap'
    ? 'แพ็กเกจรายเดือนของคุณจำกัด ' + SCAN_MONTH_CAP + ' สแกน/เดือน และเดือนนี้ใช้ครบแล้ว<br>อัปเกรดเป็นแพ็กเกจ 6 เดือนหรือตลอดชีพเพื่อสแกนได้ไม่จำกัด'
    : 'ฟีเจอร์สแกนอักษรจีนเป็นสิทธิ์พรีเมียม — ทดลองใช้ฟรี ' + SCAN_TRIAL_LIMIT + ' ครั้งเท่านั้น<br>สมัครสมาชิกเพื่อสแกนได้ต่อ (รายเดือน ' + SCAN_MONTH_CAP + ' สแกน/เดือน · 6 เดือนขึ้นไปไม่จำกัด)';
  glassPop({
    icon: 'scan',
    title: 'สิทธิ์สแกนอักษรจีน',
    body: '<p style="margin:0">' + msg + '</p>',
    actions: [
      {label:'ปิด', cls:'btn-ghost', fn: closeGlassPop},
      {label:'ดูแพ็กเกจพรีเมียม', cls:'btn-gold', fn: function(){ closeGlassPop(); go('premium'); }}
    ]
  });
}

/* -------- คงผลสแกนไว้ข้ามการเปลี่ยนหน้า (กลับมาแล้วไม่ต้องสแกนใหม่) -------- */
const SCAN_KEY = 'wszw_scan';
function saveScanState(){
  try{
    sessionStorage.setItem(SCAN_KEY, JSON.stringify({lines: scanState.lines, img: scanState.imgDataUrl || ''}));
  }catch(e){}
}
function loadScanState(){
  try{
    const s = JSON.parse(sessionStorage.getItem(SCAN_KEY) || 'null');
    if(s && Array.isArray(s.lines) && s.lines.length){
      scanState.lines = s.lines;
      scanState.imgDataUrl = s.img || '';
      return true;
    }
  }catch(e){}
  return false;
}
function clearScanState(){
  try{ sessionStorage.removeItem(SCAN_KEY); }catch(e){}
  scanState.lines = [];
  scanState.imgDataUrl = '';
}
function scanActive(){
  try{ return !!(sessionStorage.getItem(SCAN_KEY)); }catch(e){ return false; }
}

/* --------------------------------------------------------------------------
   โหลด Tesseract.js แบบ lazy (ครั้งแรกที่กด OCR เท่านั้น)
-------------------------------------------------------------------------- */
function loadTesseract(){
  return new Promise(function(resolve, reject){
    if(typeof Tesseract !== 'undefined'){ resolve(); return; }
    if(!navigator.onLine){ reject(new Error('offline')); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = function(){ resolve(); };
    s.onerror = function(){ reject(new Error('script-fail')); };
    document.head.appendChild(s);
  });
}

/* --------------------------------------------------------------------------
   ฐานข้อมูลอักขระ/คำศัพท์ (แคชครั้งเดียว)
-------------------------------------------------------------------------- */
function scanCharDb(){
  if(!window.__scanCharDb){
    const m = {};
    CHARS.forEach(function(c){ if(c && c.c) m[c.c] = c; });
    window.__scanCharDb = m;
  }
  return window.__scanCharDb;
}
function scanWordDb(){
  if(!window.__scanWordDb){
    const m = {};
    for(let lv = 1; lv <= 6; lv++){
      (DB.hsk[lv]||[]).forEach(function(w){ if(w && w.cn && !m[w.cn]) m[w.cn] = {py: w.py||'', th: w.th||'', lv: lv}; });
    }
    window.__scanWordDb = m;
  }
  return window.__scanWordDb;
}
/* ตัดคำแบบ greedy longest-match (2–4 ตัว) จากคลัง HSK — ที่เหลือเป็นรายตัวอักษร */
function segmentLine(line){
  const words = scanWordDb(), chars = scanCharDb();
  const out = [];
  let i = 0;
  while(i < line.length){
    let best = null;
    for(let len = 4; len >= 2; len--){
      if(i + len > line.length) continue;
      const seg = line.slice(i, i + len);
      if(words[seg]){ best = {kind:'word', seg: seg, py: words[seg].py, th: words[seg].th, lv: words[seg].lv}; break; }
    }
    if(best){ out.push(best); i += best.seg.length; }
    else{
      const ch = line[i];
      const c = chars[ch];
      if(c) out.push({kind:'char', seg: ch, py: c.p, th: c.th, s: c.s});
      else if(/[\s，。！？、；：·—…""''()（）]/.test(ch)){ out.push({kind:'punct', seg: ch}); }
      else out.push({kind:'unknown', seg: ch});
      i++;
    }
  }
  return out;
}

/* --------------------------------------------------------------------------
   หน้าสแกน
-------------------------------------------------------------------------- */
function renderScanHub(){
  const box = $('#scanView'); if(!box) return;
  box.innerHTML = `
    <div class="breadcrumb"><a onclick="go('home')">หน้าแรก</a> <span class="sep">›</span> <span>สแกนอักษรจีน</span></div>

    <div class="exam-hero" style="background:linear-gradient(135deg,rgba(47,40,34,.92),rgba(178,58,46,.85))">
      <div class="in">
        <div class="kicker">Character Scanner · 扫一扫</div>
        <h2>สแกนอักษรจีน · 2 โหมดแยกชัดเจน</h2>
        <p><b style="color:#fff">โหมดเรียนอักษร</b> — สแกนตัวอักษร/คำศัพท์เพื่อดูพินอิน ความหมาย และ PDF ฝึกเขียน ·
           <b style="color:var(--gold-2)">โหมดข้อสอบ</b> — สแกนโจทย์ข้อสอบพร้อมตัวเลือก แล้ว AI ออนไลน์วิเคราะห์คำตอบให้</p>
        <div class="exam-stats">
          <div><b>OCR</b><span>อ่านจากภาพ</span></div>
          <div><b>3,000 ตัว</b><span>ฐานข้อมูลอักษร</span></div>
          <div><b>AI</b><span>วิเคราะห์ข้อสอบ</span></div>
          <div><b>PDF</b><span>แบบฝึกเขียน</span></div>
        </div>
      </div>
    </div>

    <div class="scan-mode-tabs">
      <button class="scan-mode-tab ${scanMode==='text'?'active':''}" onclick="scanMode='text';renderScanHub()">
        <span class="ic">${TILE('scan','red')}</span>
        <span class="txt"><b>โหมดเรียนอักษร</b><span>สแกนตัวอักษร/คำศัพท์ → พินอิน ความหมาย · PDF ฝึกเขียน · ทดลองฟรี 3 ครั้ง</span></span>
      </button>
      <button class="scan-mode-tab ${scanMode==='exam'?'active':''}" onclick="scanMode='exam';renderScanHub()">
        <span class="ic">${TILE('sparkles','gold')}</span>
        <span class="txt"><b>โหมดข้อสอบ · AI ช่วยทำ</b><span>สแกนโจทย์ + ตัวเลือก → AI ออนไลน์หาคำตอบพร้อมคำอธิบาย <i style="color:var(--gold)">แพ็กเกจ 6 เดือน+</i></span></span>
      </button>
    </div>

    ${scanMode === 'text' ? `
    <div class="scan-grid">
      <div class="panel">
        <h3>${ICON('image')} 1. เลือกภาพตัวอักษรจีน</h3>
        <div class="scan-drop" id="scanDrop" onclick="$('#scanFile').click()">
          <span class="ic">${TILE('scan','red')}</span>
          <b>ลากวางภาพ หรือคลิกเพื่อเลือก</b>
          <span>ภาพตัวอักษร/ข้อความภาษาจีน — รองรับ JPG / PNG</span>
          <input type="file" id="scanFile" accept="image/*" style="display:none" onchange="onScanFile(this)">
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <label class="btn btn-ghost btn-sm" style="cursor:pointer">${ICON('camera')} ถ่ายรูป (มือถือ)
            <input type="file" accept="image/*" capture="environment" style="display:none" onchange="onScanFile(this)">
          </label>
          <button class="btn btn-primary btn-sm" id="scanOcrBtn" onclick="runScanOCR()">${ICON('scan')} อ่านตัวอักษร</button>
        </div>
        <div id="scanPreview"></div>
        <div id="scanBusy"></div>
        <div class="scan-quota" id="scanQuota">${scanGateTxt()}</div>
        <p style="font-size:11.5px;color:var(--text-3);margin-top:12px">
          หมายเหตุ: การอ่านครั้งแรกต้องเชื่อมต่ออินเทอร์เน็ตเพื่อดาวน์โหลดโมเดล OCR (~15 MB) ครั้งถัดไปเร็วขึ้น
        </p>
      </div>

      <div class="panel">
        <h3>${ICON('kanji')} 2. ผลลัพธ์สำหรับการเรียน</h3>
        <div id="scanResults">
          <div class="empty"><span class="ic">${ICON('scan')}</span>ยังไม่มีผลลัพธ์ — เลือกภาพแล้วกด "อ่านตัวอักษร"</div>
        </div>
      </div>
    </div>` : `
    <div class="panel solve-panel" id="scanSolvePanel" style="margin-top:8px">
      <div class="solve-head">
        <span class="ic">${TILE('sparkles','gold')}</span>
        <div>
          <h3 style="justify-content:flex-start;margin-bottom:2px">${scanSolverAllow()? 'AI ช่วยทำข้อสอบ':'<span style="color:var(--text-3)">AI ช่วยทำข้อสอบ (แพ็กเกจ 6 เดือน+)</span>'}</h3>
          <p style="font-size:12.5px;color:var(--text-3);margin:0">ถ่ายภาพโจทย์ข้อสอบพร้อมตัวเลือก (A/B/C/D) — ระบบ OCR อ่านข้อความ แล้ว <b>AI ออนไลน์</b> วิเคราะห์คำตอบพร้อมคำอธิบาย (ออฟไลน์จะเทียบฐานข้อมูลข้อสอบของเว็บแทน)</p>
        </div>
      </div>
      <div class="scan-grid" style="margin-top:14px">
        <div>
          <div class="scan-drop" onclick="$('#examFile').click()">
            <span class="ic">${TILE('image','gold')}</span>
            <b>อัปโหลดภาพโจทย์ข้อสอบ</b>
            <span>ให้เห็นโจทย์และตัวเลือกครบทุกข้อ ภาพตรง ชัด ไม่เอียง</span>
            <input type="file" id="examFile" accept="image/*" style="display:none" onchange="onExamFile(this)">
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
            <label class="btn btn-ghost btn-sm" style="cursor:pointer">${ICON('camera')} ถ่ายรูป (มือถือ)
              <input type="file" accept="image/*" capture="environment" style="display:none" onchange="onExamFile(this)">
            </label>
            <button class="btn ${scanSolverAllow()?'btn-gold':'btn-ghost'} btn-sm" id="examScanBtn" onclick="runExamScan()">${ICON('sparkles')} สแกนแล้วให้ AI วิเคราะห์</button>
          </div>
          <div id="examPreview"></div>
          <div id="examBusy"></div>
        </div>
        <div>
          <div id="examRawText"></div>
          <div id="examSolve">
            <div class="empty"><span class="ic">${ICON('sparkles')}</span>ผลการวิเคราะห์ของ AI จะปรากฏที่นี่</div>
          </div>
        </div>
      </div>
    </div>`}`;
  /* กู้คืนผลสแกนครั้งก่อน (กลับมาจากหน้าเรียน/เขียนโดยไม่ต้องสแกนใหม่) */
  if(scanMode === 'text' && loadScanState()){
    const pv = $('#scanPreview');
    if(pv && scanState.imgDataUrl) pv.innerHTML = '<img class="img-prev" src="' + scanState.imgDataUrl + '" style="max-height:220px;border-radius:12px;border:1px solid var(--line);margin-top:14px">';
    renderScanResults();
  }
  if(scanMode === 'exam'){
    renderExamTextPreview();
    const pv = $('#examPreview');
    if(pv && examScanState.imgDataUrl) pv.innerHTML = '<img class="img-prev" src="' + examScanState.imgDataUrl + '" style="max-height:220px;border-radius:12px;border:1px solid var(--line);margin-top:14px">';
  }
}

function onScanFile(input){
  const f = input.files && input.files[0];
  if(!f) return;
  if(typeof readImageFile !== 'function'){ toast('ฟังก์ชันอัปโหลดยังไม่พร้อม'); return; }
  readImageFile(input, function(data){
    downscaleScanImage(data, function(down){
      scanState.imgDataUrl = down;
      const pv = $('#scanPreview');
      if(pv) pv.innerHTML = '<img class="img-prev" src="' + down + '" style="max-height:220px;border-radius:12px;border:1px solid var(--line);margin-top:14px">';
      toast('ภาพพร้อมแล้ว — กด "อ่านตัวอักษร"');
    });
  }, 2400);
}
/* --------------------------------------------------------------------------
   ประมวลผลภาพก่อน OCR — ปรับความละเอียด + grayscale + stretch คอนทราสต์
   (และ binarize แบบ Otsu สำหรับรอบ retry) → PNG ไม่มี artefact ของ JPEG
-------------------------------------------------------------------------- */
function otsuThreshold(hist, total){
  let sum = 0;
  for(let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, maxVar = 0, thr = 128;
  for(let t = 0; t < 256; t++){
    wB += hist[t];
    if(!wB) continue;
    const wF = total - wB;
    if(!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if(v > maxVar){ maxVar = v; thr = t; }
  }
  return thr;
}
function preprocessForOCR(dataUrl, opts){
  opts = opts || {};
  return new Promise(function(resolve, reject){
    const img = new Image();
    img.onload = function(){
      try{
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if(!w || !h){ reject(new Error('img-empty')); return; }
        /* ปรับขนาด: ด้านยาว 2400px — ภาพเล็กขยาย 2 เท่า ภาพใหญ่ย่อพอดี (เก็บรายละเอียดตัวอักษรเล็ก) */
        let scale = 1;
        if(Math.max(w, h) > 2400) scale = 2400 / Math.max(w, h);
        else if(Math.max(w, h) < 1400) scale = Math.min(2, 1400 / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const d = data.data;
        const n = w * h;
        const lum = new Float32Array(n);
        const hist = new Uint32Array(256);
        let mn = 255, mx = 0;
        for(let i = 0; i < n; i++){
          const r = d[i*4], g = d[i*4+1], b = d[i*4+2];
          const l = .299*r + .587*g + .114*b;
          lum[i] = l;
          if(l < mn) mn = l;
          if(l > mx) mx = l;
        }
        if(opts.binarize){
          /* Otsu → ขาว-ดำคมชัด */
          for(let i = 0; i < n; i++) hist[Math.round(lum[i]) & 255]++;
          const thr = otsuThreshold(hist, n);
          for(let i = 0; i < n; i++){
            const v = lum[i] > thr ? 255 : 0;
            d[i*4] = d[i*4+1] = d[i*4+2] = v;
          }
        } else {
          /* contrast stretch เต็มช่วง */
          const range = Math.max(30, mx - mn);
          const s = 255 / range;
          for(let i = 0; i < n; i++){
            let v = (lum[i] - mn) * s;
            if(v < 0) v = 0; else if(v > 255) v = 255;
            d[i*4] = d[i*4+1] = d[i*4+2] = v;
          }
        }
        ctx.putImageData(data, 0, 0);
        resolve(cv.toDataURL('image/png'));
      }catch(e){ reject(e); }
    };
    img.onerror = function(){ reject(new Error('img-decode-fail')); };
    img.src = dataUrl;
  });
}
/* เรียก Tesseract (รองรับทั้ง API เก่า recognize และ API ใหม่ createWorker) */
function ocrWithTesseract(imgDataUrl, langs, params, logger){
  if(typeof Tesseract === 'undefined') return Promise.reject(new Error('no-tesseract'));
  if(typeof Tesseract.createWorker === 'function'){
    return Tesseract.createWorker(langs, 1, {logger: logger})
      .then(function(w){
        return w.setParameters(params)
          .then(function(){ return w.recognize(imgDataUrl); })
          .then(function(res){
            return w.terminate().then(function(){ return (res && res.data) || {text: ''}; });
          })
          .catch(function(e){
            try{ w.terminate(); }catch(e2){}
            throw e;
          });
      });
  }
  const opts = Object.assign({logger: logger}, params);
  return Tesseract.recognize(imgDataUrl, langs, opts)
    .then(function(r){ return (r && r.data) || {text: ''}; });
}
/* ย่อภาพก่อน OCR (เร็วขึ้น แม่นขึ้น) */
function downscaleScanImage(dataUrl, cb){
  const img = new Image();
  img.onload = function(){
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    if(scale === 1){ cb(dataUrl); return; }
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * scale);
    cv.height = Math.round(img.height * scale);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    cb(cv.toDataURL('image/jpeg', .92));
  };
  img.onerror = function(){ cb(dataUrl); };
  img.src = dataUrl;
}

/* --------------------------------------------------------------------------
   OCR
-------------------------------------------------------------------------- */
function renderScanBusy(msg, pct){
  const el = $('#scanBusy'); if(!el) return;
  if(!msg){ el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="scan-busy">
      ${ICON('refresh-cw')} ${esc(msg)}${pct!=null? ' ' + pct + '%' : ''}
      <div class="wr-progress" style="margin:8px 0 0"><i style="width:${pct||8}%"></i></div>
    </div>`;
}
function runScanOCR(){
  if(scanState.busy) return;
  const gate = scanAllow();
  if(!gate.ok){ showScanGate(); return; }
  if(!scanState.imgDataUrl){ toast('เลือกภาพก่อน'); return; }
  scanState.busy = true;
  const btn = $('#scanOcrBtn');
  if(btn) btn.disabled = true;
  renderScanBusy('กำลังโหลดโมเดล OCR…', 5);
  loadTesseract()
    .then(function(){
      renderScanBusy('กำลังปรับภาพให้คมชัด…', 10);
      return preprocessForOCR(scanState.imgDataUrl);
    })
    .then(function(png){
      renderScanBusy('กำลังอ่านตัวอักษร…', 14);
      return ocrWithTesseract(png, 'chi_sim+eng', {tessedit_pageseg_mode: '3', preserve_interword_spaces: '1'}, function(m){
        if(m.status === 'recognizing text') renderScanBusy('กำลังอ่านตัวอักษร…', 14 + Math.round((m.progress||0)*84));
      });
    })
    .then(function(data){
      const text = (data && data.text) || '';
      scanState.lines = text.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
      scanConsume();
      saveScanState();
      renderScanResults();
      const q = $('#scanQuota'); if(q) q.innerHTML = scanGateTxt();
      if(!scanState.lines.length) toast('ไม่พบตัวอักษรในภาพ — ลองภาพที่ชัดขึ้น');
    })
    .catch(function(){
      toast('ใช้ OCR ไม่ได้ — ต้องเชื่อมต่ออินเทอร์เน็ตครั้งแรกเพื่อโหลดโมเดล');
    })
    .finally(function(){
      scanState.busy = false;
      if(btn) btn.disabled = false;
      renderScanBusy('');
    });
}

/* --------------------------------------------------------------------------
   แสดงผลลัพธ์
-------------------------------------------------------------------------- */
function renderScanResults(){
  const box = $('#scanResults'); if(!box) return;
  const lines = scanState.lines;
  if(!lines.length){ box.innerHTML = '<div class="empty">ไม่พบข้อความในภาพ</div>'; return; }
  const rows = lines.map(function(line){
    const toks = segmentLine(line);
    const chips = toks.map(function(t){
      if(t.kind === 'punct') return '<span class="scan-punct">' + esc(t.seg) + '</span>';
      if(t.kind === 'unknown') return '<span class="scan-unk" title="ไม่มีในฐานข้อมูล">' + esc(t.seg) + '</span>';
      if(t.kind === 'word') return `<span class="scan-tok word" title="${esc(t.py)} — ${esc(t.th)}">${esc(t.seg)}<i>${esc(t.py)}</i></span>`;
      return `<span class="scan-tok char" onclick="openChar('${esc(t.seg)}')" title="${esc(t.py)} — ${esc(t.th)}">${esc(t.seg)}<i>${esc(t.py)}</i></span>`;
    }).join('');
    return `
      <div class="scan-line">
        <div class="scan-line-txt">${chips}</div>
        <div class="scan-line-acts">
          <button class="mini-btn ghost" onclick="speak(${JSON.stringify(line)})">${ICON('volume-2')} ฟัง</button>
        </div>
      </div>`;
  }).join('');

  /* สรุปคำ/อักษรที่พบ (ไม่ซ้ำ) */
  const seen = {}, items = [];
  lines.forEach(function(line){
    segmentLine(line).forEach(function(t){
      if(t.kind !== 'word' && t.kind !== 'char') return;
      if(seen[t.seg]) return;
      seen[t.seg] = 1;
      items.push(t);
    });
  });

  box.innerHTML = `
    <p style="font-size:13px;color:var(--text-2);margin-bottom:12px">
      พบ <b>${items.length}</b> รายการ · คลิกตัวอักษรเพื่อดูรายละเอียด · คลิกคำเพื่อฟังเสียงอ่าน
    </p>
    <div style="max-height:300px;overflow-y:auto;padding-right:6px">
      ${rows}
    </div>
    <div class="scan-items">
      ${items.map(function(t){
        if(t.kind === 'word') return `
          <div class="scan-item word" onclick="speak('${esc(t.seg)}')" title="คลิกฟังเสียง">
            <span class="kai">${esc(t.seg)}</span>
            <div><b>${esc(t.py)}</b><span>${esc(t.th)}</span></div>
            <span class="tag-pill gold">HSK ${t.lv}</span>
          </div>`;
        return `
          <div class="scan-item char" onclick="openChar('${esc(t.seg)}')" title="คลิกดูรายละเอียด + ฝึกเขียน">
            <span class="kai">${esc(t.seg)}</span>
            <div><b>${esc(t.py)}</b><span>${esc(t.th)} · ${t.s} ขีด</span></div>
            <button class="mini-btn" onclick="event.stopPropagation();openWrite('${esc(t.seg)}')">${ICON('pen-line')} เขียน</button>
          </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
      <button class="btn btn-gold" onclick="downloadScanPDF()">${ICON('download')} ดาวน์โหลด PDF</button>
      <button class="btn btn-ghost" onclick="printScanSheet()">${ICON('file-text')} พิมพ์ / บันทึกด้วยเบราว์เซอร์</button>
      <button class="btn btn-ghost" onclick="clearScanState();renderScanHub()">${ICON('trash')} เริ่มใหม่</button>
    </div>`;
}

/* --------------------------------------------------------------------------
   ส่งออก PDF — แบบฝึกเขียน (ผ่าน print dialog ของเบราว์เซอร์)
-------------------------------------------------------------------------- */
function buildScanSheetHTML(){
  const seen = {}, items = [];
  scanState.lines.forEach(function(line){
    segmentLine(line).forEach(function(t){
      if(t.kind !== 'word' && t.kind !== 'char') return;
      if(seen[t.seg]) return;
      seen[t.seg] = 1;
      items.push(t);
    });
  });
  const today = new Date();
  const dateTxt = today.getDate() + '/' + (today.getMonth()+1) + '/' + (today.getFullYear()+543);
  /* 1 ตัวอักษรต่อ 1 หน้า — ช่องแรกเป็นตัวอย่าง ลายจาง ที่เหลือว่างให้ฝึกเขียน */
  const rows = items.map(function(t){
    let boxes = '<div class="pz-box guide">' + esc(t.seg) + '</div>';
    for(let k = 0; k < 71; k++) boxes += '<div class="pz-box"></div>';
    return `
      <div class="pz-item">
        <div class="pz-head">
          <div class="pz-kai">${esc(t.seg)}</div>
          <div class="pz-meta">
            <b>${esc(t.py)}</b>
            <span>${esc(t.th)}${t.s ? ' · ' + t.s + ' ขีด' : ''}</span>
            <em>เขียนตามลำดับขีด — ช่องแรกคือตัวอย่าง</em>
          </div>
        </div>
        <div class="pz-row">${boxes}</div>
      </div>`;
  }).join('');
  return `
    <div class="pz-sheet">
      <div class="pz-title">
        <h1>为什么中文 · แบบฝึกเขียนอักษรจีน</h1>
        <p>สแกนเมื่อ ${dateTxt} · จำนวน ${items.length} ตัวอักษร · ตัวละ 1 หน้า พร้อมช่อง 米字格 สำหรับฝึกเขียน</p>
      </div>
      ${rows || '<p>ไม่พบตัวอักษรที่รู้จักในภาพ</p>'}
      <div class="pz-foot">สู้ ๆ และเรียนภาษาจีนไปด้วยกัน · 加油！— 为什么中文</div>
    </div>`;
}
function loadJsPDF(){
  return new Promise(function(resolve, reject){
    if(window.jspdf && window.jspdf.jsPDF){ resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = function(){ resolve(); };
    s.onerror = function(){ reject(new Error('jspdf-load-fail')); };
    document.head.appendChild(s);
  });
}
/* วาดหน้ากระดาษฝึก 1 ตัวอักษรต่อ 1 หน้า ลง canvas (ฟอนต์จริงจากเบราว์เซอร์) */
function scanSheetItems(){
  const seen = {}, items = [];
  scanState.lines.forEach(function(line){
    segmentLine(line).forEach(function(t){
      if(t.kind !== 'word' && t.kind !== 'char') return;
      if(seen[t.seg]) return;
      seen[t.seg] = 1;
      items.push(t);
    });
  });
  return items;
}
function drawScanPage(t){
  const S = 2;                        /* ความละเอียด 2 เท่า → PDF คมชัด (192 DPI) */
  const W = 794 * S, H = 1123 * S, M = 30 * S;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  /* หัวกระดาษ */
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#3a2e25';
  ctx.font = 'bold ' + (22*S) + 'px "IBM Plex Sans Thai","Noto Sans Thai",sans-serif';
  ctx.fillText('为什么中文 · แบบฝึกเขียนอักษรจีน', M, 56*S);
  ctx.fillStyle = '#6f6053';
  ctx.font = (12*S) + 'px "IBM Plex Sans Thai","Noto Sans Thai",sans-serif';
  ctx.fillText('เขียนตามลำดับขีดในช่อง 米字格 — ช่องแรกคือตัวอย่างลายจาง', M, 76*S);
  /* ตัวอักษร + พินอิน + ความหมาย */
  ctx.fillStyle = '#b23a2e';
  ctx.font = (64*S) + 'px "KaiTi","LXGW WenKai TC","Noto Serif SC",serif';
  ctx.fillText(t.seg, M, 160*S);
  ctx.fillStyle = '#b23a2e';
  ctx.font = 'bold ' + (21*S) + 'px "Noto Sans SC","IBM Plex Sans Thai",sans-serif';
  ctx.fillText(t.py, M + 116*S, 122*S);
  ctx.fillStyle = '#5a4632';
  ctx.font = (15*S) + 'px "IBM Plex Sans Thai","Noto Sans Thai",sans-serif';
  ctx.fillText((t.th || '') + (t.s ? ' · ' + t.s + ' ขีด' : ''), M + 116*S, 148*S);
  ctx.strokeStyle = 'rgba(178,58,46,.4)';
  ctx.lineWidth = 1 * S;
  ctx.beginPath(); ctx.moveTo(M, 180*S); ctx.lineTo(W - M, 180*S); ctx.stroke();
  /* ตาราง 8×9 = 72 ช่อง 米字格 */
  const box = 84 * S, gap = 6 * S, x0 = M, y0 = 200 * S;
  for(let r = 0; r < 9; r++){
    for(let c = 0; c < 8; c++){
      const x = x0 + c * (box + gap), y = y0 + r * (box + gap);
      ctx.strokeStyle = 'rgba(178,58,46,.55)';
      ctx.lineWidth = 1 * S;
      ctx.strokeRect(x + S, y + S, box - 2*S, box - 2*S);
      ctx.strokeStyle = 'rgba(178,58,46,.18)';
      ctx.beginPath();
      ctx.moveTo(x + box/2, y);      ctx.lineTo(x + box/2, y + box);
      ctx.moveTo(x, y + box/2);      ctx.lineTo(x + box, y + box/2);
      ctx.moveTo(x, y);              ctx.lineTo(x + box, y + box);
      ctx.moveTo(x + box, y);        ctx.lineTo(x, y + box);
      ctx.stroke();
      if(r === 0 && c === 0){
        ctx.fillStyle = 'rgba(178,58,46,.22)';
        ctx.font = ((t.seg.length > 1 ? 30 : 46) * S) + 'px "KaiTi","LXGW WenKai TC","Noto Serif SC",serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t.seg, x + box/2, y + box/2 + 2*S);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
    }
  }
  /* ท้ายกระดาษ */
  ctx.fillStyle = '#94836f';
  ctx.font = (11*S) + 'px "IBM Plex Sans Thai","Noto Sans Thai",sans-serif';
  ctx.fillText('สู้ ๆ และเรียนภาษาจีนไปด้วยกัน · 加油！— 为什么中文', W/2 - 140*S, H - 26*S);
  return cv;
}
function buildScanPages(){
  return scanSheetItems().map(function(t){ return drawScanPage(t); });
}
function downloadScanPDF(){
  if(!scanState.lines.length){ toast('ยังไม่มีผลลัพธ์ที่จะส่งออก'); return; }
  toast('กำลังสร้างไฟล์ PDF…');
  loadJsPDF()
    .then(function(){
      if(document.fonts && document.fonts.ready){ return document.fonts.ready; }
      return Promise.resolve();
    })
    .then(function(){
      const pages = buildScanPages();
      if(!pages.length){ toast('ไม่พบตัวอักษรที่รู้จักในผลสแกน'); return; }
      const doc = new window.jspdf.jsPDF({unit: 'mm', format: 'a4', orientation: 'portrait'});
      pages.forEach(function(cv, i){
        if(i > 0) doc.addPage();
        doc.addImage(cv.toDataURL('image/jpeg', .96), 'JPEG', 0, 0, 210, 297);
      });
      doc.save('weishenme-writing-practice.pdf');
    })
    .catch(function(){
      toast('โหลดไลบรารี PDF ไม่ได้ (ต้องออนไลน์) — ใช้ปุ่ม "พิมพ์ / บันทึกด้วยเบราว์เซอร์" แทน');
    });
}
function printScanSheet(){
  if(!scanState.lines.length){ toast('ยังไม่มีผลลัพธ์ที่จะส่งออก'); return; }
  const old = document.getElementById('scanPrint');
  if(old) old.remove();
  const div = document.createElement('div');
  div.id = 'scanPrint';
  div.innerHTML = buildScanSheetHTML();
  document.body.appendChild(div);
  document.body.classList.add('scan-printing');
  const cleanup = function(){
    document.body.classList.remove('scan-printing');
    const d = document.getElementById('scanPrint');
    if(d) d.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(function(){ window.print(); }, 200);
}
