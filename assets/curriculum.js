/* ==========================================================================
   为什么中文 · แผนการเรียนเฉพาะบุคคล (AI วิเคราะห์จากเป้าหมาย)
   วิเคราะห์: เป้าหมายการเรียน + ระดับปัจจุบัน (HSK) + เมืองที่อยากไป + กรอบเวลาสอบ
   → แนะนำระดับ HSK เป้าหมาย + แผนการเรียนรายสัปดาห์ เชื่อมโยงทุกโมดูลของเว็บ
   ========================================================================== */
'use strict';

/* ตัวเลือกเป้าหมายการเรียน (ใช้ในฟอร์มสมัครด้วย) */
const LEARN_GOALS = [
  ['hsk-exam','สอบ HSK / วัดระดับภาษาจีน'],
  ['life','ใช้ชีวิตประจำวันในจีน'],
  ['travel','ท่องเที่ยวประเทศจีน'],
  ['work','ทำงานกับบริษัทจีน / ใช้ภาษาในงาน'],
  ['business','ธุรกิจ / ค้าขายกับจีน'],
  ['uni','เรียนต่อมหาวิทยาลัยในจีน'],
  ['media','ดูซีรีส์ ฟังเพลง อ่านนิยายจีน'],
  ['family','สื่อสารกับครอบครัว / แฟน / เพื่อนชาวจีน'],
  ['culture','สนใจวัฒนธรรมและประวัติศาสตร์จีน'],
  ['hobby','งานอดิเรก / พัฒนาตนเอง'],
  ['teach','ติวเตอร์ / สอนภาษาจีน']
];
const LEARN_LEVELS = [
  ['none','ยังไม่เคยเรียน (เริ่มจากศูนย์)'],
  ['basic','เรียนมาบ้าง ยังไม่เคยสอบ HSK'],
  ['hsk1','ผ่าน HSK 1 แล้ว'],
  ['hsk2','ผ่าน HSK 2 แล้ว'],
  ['hsk3','ผ่าน HSK 3 แล้ว'],
  ['hsk4','ผ่าน HSK 4 แล้ว'],
  ['hsk5','ผ่าน HSK 5 แล้ว'],
  ['hsk6','ผ่าน HSK 6 แล้ว']
];
const LEARN_TIMELINES = [
  ['t3','ภายใน 3 เดือน'],
  ['t6','ภายใน 6 เดือน'],
  ['t12','ภายใน 1 ปี'],
  ['t24','1–2 ปี'],
  ['flex','ยังไม่แน่ใจ / ไม่เร่งรีบ']
];
const CHINA_CITIES = ['ปักกิ่ง 北京','เซี่ยงไฮ้ 上海','กว่างโจว 广州','เซินเจิ้น 深圳','เฉิงตู 成都','ฉงชิ่ง 重庆',
  'หางโจว 杭州','ซีอาน 西安','คุนหมิง 昆明','หนานจิง 南京','ซูโจว 苏州','ชิงเต่า 青岛','ต้าเหลียน 大连',
  'เซียะเหมิน 厦门','เทียนจิน 天津','อู่ฮั่น 武汉','ฉางชา 长沙','ฮาร์บิน 哈尔滨','ฮ่องกง 香港','ไทเป 台北'];

function goalName(id){ const g = LEARN_GOALS.find(x => x[0] === id); return g ? g[1] : (id || '—'); }
function levelName(id){ const g = LEARN_LEVELS.find(x => x[0] === id); return g ? g[1] : (id || '—'); }
function levelNum(id){
  if(!id || id === 'none' || id === 'basic') return 0;
  const m = String(id).match(/\d+/);
  return m ? Math.min(6, Math.max(1, +m[0])) : 0;
}

/* --------------------------------------------------------------------------
   AI วิเคราะห์ → แผนการเรียน
-------------------------------------------------------------------------- */
function targetHSK(profile){
  const p = profile || {};
  const cur = levelNum(p.level);
  const goal = p.goal;
  let target = 0;
  if(goal === 'hsk-exam')     target = Math.min(6, Math.max(cur + 1, 1));
  else if(goal === 'uni')     target = Math.min(6, Math.max(cur + 1, 4));
  else if(goal === 'business')target = Math.min(6, Math.max(cur + 1, 4));
  else if(goal === 'work')    target = Math.min(6, Math.max(cur + 1, 3));
  else if(goal === 'life')    target = Math.min(6, Math.max(cur + 1, 3));
  else if(goal === 'travel')  target = Math.min(6, Math.max(cur + 1, 2));
  else if(goal === 'media')   target = Math.min(6, Math.max(cur + 1, 3));
  else if(goal === 'family')  target = Math.min(6, Math.max(cur + 1, 2));
  else if(goal === 'culture') target = Math.min(6, Math.max(cur + 1, 3));
  else                        target = Math.min(6, Math.max(cur + 1, 2));   /* hobby, teach, อื่น ๆ */
  return target;
}
function timelineWeeks(id){
  if(id === 't3')  return 12;
  if(id === 't6')  return 26;
  if(id === 't12') return 52;
  if(id === 't24') return 104;
  return 26;   /* flex — แผนกลาง */
}
function buildCurriculum(u){
  const p = (u && u.profile) || {};
  const cur = levelNum(p.level);
  const target = targetHSK(p);
  const weeks = timelineWeeks(p.timeline);
  const plan = [];
  const tasksPerWeek = 4;
  const task = w => ({
    week: w,
    do: [
      'เรียนพินอิน/ทบทวนเสียง: บทที่ ' + (((w-1) % 5) + 1),
      'ท่องศัพท์ HSK ' + Math.max(1, Math.min(6, (target-1) + (w <= 8 ? 0 : (w-8 > 0 ? Math.floor((w-1)/10) + 1 : 0)) + (cur >= target ? 0 : 0))) + ' · 10–15 คำ/วัน',
      'ฝึกเขียนอักษร 3–5 ตัว + ตรวจลำดับขีด' + (w <= 8 ? ' (ขีดพื้นฐาน)' : ''),
      'ทำแบบฝึก/ข้อสอบจำลอง HSK ' + target + ' ชุดที่ ' + ((w % 5) + 1) + (w % 3 === 0 ? ' (จับเวลาจริง)' : '')
    ]
  });
  const levelStarts = {};   /* HSK ระดับ → สัปดาห์ที่เริ่ม */
  let wk = 1;
  for(let lv = Math.max(cur + 1, 1); lv <= target && wk <= weeks; lv++){
    levelStarts[lv] = wk;
    const span = Math.max(2, Math.round(weeks / (target - Math.max(cur, 0) || 1)));
    for(let w = 0; w < span && wk <= weeks; w++, wk++){
      plan.push(task(wk));
    }
  }
  while(wk <= weeks){ plan.push(task(wk)); wk++; }
  const city = (p.city || '').trim();
  return {
    created: Date.now(),
    target: target,
    cur: cur,
    weeks: weeks,
    goal: p.goal || '',
    level: p.level || 'none',
    city: city,
    timeline: p.timeline || 'flex',
    levelStarts: levelStarts,
    plan: plan.slice(0, weeks),
    summary: [
      'เป้าหมาย: ' + goalName(p.goal) + (target ? ' → HSK ' + target : ''),
      'ระดับปัจจุบัน: ' + levelName(p.level),
      'กรอบเวลา: ' + (p.timeline === 'flex' ? 'ยืดหยุ่น (แผนกลาง 26 สัปดาห์)' : weeks + ' สัปดาห์'),
      city ? 'เมืองเป้าหมาย: ' + city + ' — เน้นศัพท์การเดินทาง/ชีวิตประจำวันเพิ่ม' : '',
      'จังหวะเรียน: ' + tasksPerWeek + ' กิจกรรม/สัปดาห์ ท่องศัพท์วันละ 10–15 คำ'
    ].filter(Boolean)
  };
}

/* --------------------------------------------------------------------------
   ความคืบหน้าแผน (checkbox รายสัปดาห์)
-------------------------------------------------------------------------- */
function planDoneMap(){
  try{ return JSON.parse(localStorage.getItem('wszw_plan_done') || '{}'); }catch(e){ return {}; }
}
function togglePlanTask(w, idx){
  const m = planDoneMap();
  const key = 'w' + w + '-' + idx;
  m[key] = !m[key];
  try{ localStorage.setItem('wszw_plan_done', JSON.stringify(m)); }catch(e){}
  renderCurriculumPanel();
}
function planWeekProgress(w, tasks){
  const m = planDoneMap();
  let done = 0;
  for(let i = 0; i < tasks; i++){ if(m['w' + w + '-' + i]) done++; }
  return done;
}

/* --------------------------------------------------------------------------
   แสดงผล: แผงในโปรไฟล์ + แบนเนอร์หน้าแรก
-------------------------------------------------------------------------- */
function renderCurriculumPanel(){
  const box = $('#planPanel'); if(!box) return;
  const u = currentUser();
  if(!u || !u.curriculum){ box.innerHTML = ''; return; }
  const c = u.curriculum;
  const phases = [];
  Object.keys(c.levelStarts).forEach(function(lv){
    const start = c.levelStarts[lv];
    phases.push('<span class="tag-pill gold">HSK ' + lv + ' เริ่มสัปดาห์ที่ ' + start + '</span>');
  });
  box.innerHTML = `
    <div class="sec-head reveal" style="margin:40px auto 22px;text-align:center">
      <div class="kicker">AI Study Plan · 学习计划</div>
      <h2>แผนการเรียนของฉัน</h2>
      <p>วิเคราะห์จากข้อมูลของคุณ — ปรับเปลี่ยนข้อมูลแล้วกดสร้างแผนใหม่ได้เสมอ</p>
    </div>
    <div class="plan-summary">
      ${c.summary.map(s=>`<div class="activity"><span class="ic" style="font-size:20px">${ICON('sparkles')}</span><span class="txt">${esc(s)}</span></div>`).join('')}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${phases.join('')}</div>
    </div>
    <div class="plan-grid2">
      ${c.plan.map(function(row){
        const done = planWeekProgress(row.week, row.do.length);
        const pct = Math.round(done / row.do.length * 100);
        return `
        <div class="plan-card">
          <div class="plan-wk">
            <b>สัปดาห์ที่ ${row.week}</b>
            <span>${done}/${row.do.length} กิจกรรม</span>
            <div class="wr-progress"><i style="width:${pct}%"></i></div>
          </div>
          ${row.do.map(function(t, idx){
            const m = planDoneMap();
            const on = m['w' + row.week + '-' + idx];
            return `<label class="plan-task ${on?'done':''}">
              <input type="checkbox" ${on?'checked':''} onchange="togglePlanTask(${row.week},${idx})">
              <span>${esc(t)}</span></label>`;
          }).join('')}
        </div>`;
      }).join('')}
    </div>
    <div style="text-align:center;margin-top:20px">
      <button class="btn btn-gold btn-sm" onclick="editLearnProfile()">${ICON('settings')} แก้ข้อมูลเป้าหมาย</button>
      <button class="btn btn-ghost btn-sm" onclick="regeneratePlan()">${ICON('refresh-cw')} สร้างแผนใหม่</button>
    </div>`;
}
function regeneratePlan(){
  const u = currentUser();
  if(!u) return;
  u.curriculum = buildCurriculum(u);
  saveUsers();
  renderCurriculumPanel();
  toast('สร้างแผนการเรียนใหม่เรียบร้อย');
}
function editLearnProfile(){
  const u = currentUser(); if(!u) return;
  glassPop({
    icon: 'settings',
    title: 'เป้าหมายการเรียนของฉัน',
    body: learnProfileFields('lp', u.profile || {}),
    actions: [
      {label:'ปิด', cls:'btn-ghost', fn: closeGlassPop},
      {label:'บันทึกและสร้างแผนใหม่', cls:'btn-gold', fn: function(){
        const p = readLearnProfile('lp');
        if(!p){ return; }
        u.profile = p;
        u.curriculum = buildCurriculum(u);
        saveUsers();
        closeGlassPop();
        renderCurriculumPanel();
        toast('บันทึกเป้าหมายและสร้างแผนการเรียนใหม่แล้ว');
      }}
    ]
  });
}
/* ฟอร์มเป้าหมาย (ใช้ทั้งสมัครสมาชิกและแก้ไข) */
function learnProfileFields(prefix, p){
  p = p || {};
  const cityList = CHINA_CITIES.map(c=>`<option value="${esc(c)}">`).join('');
  return `
    <div class="field"><label>เป้าหมายการเรียนภาษาจีน</label>
      <select id="${prefix}-goal">${LEARN_GOALS.map(g=>`<option value="${g[0]}" ${p.goal===g[0]?'selected':''}>${esc(g[1])}</option>`).join('')}</select></div>
    <div class="field"><label>ระดับภาษาจีนปัจจุบัน (จากผลสอบที่ผ่านมา)</label>
      <select id="${prefix}-level">${LEARN_LEVELS.map(g=>`<option value="${g[0]}" ${p.level===g[0]?'selected':''}>${esc(g[1])}</option>`).join('')}</select></div>
    <div class="field"><label>เมืองในจีนที่อยากไป (ถ้ามี)</label>
      <input id="${prefix}-city" list="city-list-${prefix}" placeholder="เช่น ปักกิ่ง 北京, เซี่ยงไฮ้ 上海" value="${esc(p.city||'')}">
      <datalist id="city-list-${prefix}">${cityList}</datalist></div>
    <div class="field"><label>กรอบเวลาเตรียมสอบ / เป้าหมายการเรียน</label>
      <select id="${prefix}-tl">${LEARN_TIMELINES.map(g=>`<option value="${g[0]}" ${(p.timeline||'flex')===g[0]?'selected':''}>${esc(g[1])}</option>`).join('')}</select></div>`;
}
function readLearnProfile(prefix){
  const goal = $('#' + prefix + '-goal');
  const level = $('#' + prefix + '-level');
  const city = $('#' + prefix + '-city');
  const tl = $('#' + prefix + '-tl');
  if(!goal || !level){ toast('กรุณากรอกข้อมูลให้ครบ'); return null; }
  return {goal: goal.value, level: level.value, city: (city ? city.value : '').trim(), timeline: tl ? tl.value : 'flex'};
}
/* แบนเนอร์แผนการเรียนบนหน้าแรก */
function renderHomePlanBanner(homeBox){
  const u = currentUser();
  if(!u || !u.curriculum) return;
  const c = u.curriculum;
  const doneAll = planWeekProgress(1, 4);
  homeBox.insertAdjacentHTML('afterbegin', `
    <div class="continue-card reveal" style="margin-bottom:26px;border-left:4px solid var(--gold)">
      <div class="ic" style="font-size:26px">${ICON('sparkles')}</div>
      <div class="txt">
        <b>แผนการเรียนของคุณ — เป้าหมาย HSK ${c.target} · ${c.weeks} สัปดาห์</b>
        <span>${esc(c.summary[0]||'')} — เริ่มจากสัปดาห์ที่ 1: ${esc((c.plan[0]&&c.plan[0].do[0])||'')}</span>
      </div>
      <button class="btn btn-gold btn-sm" onclick="go('profile')">ดูแผนทั้งหมด</button>
    </div>`);
}
