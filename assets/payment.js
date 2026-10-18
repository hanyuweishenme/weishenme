/* ==========================================================================
   为什么中文 · ระบบสมาชิกพรีเมียม + การชำระเงิน (สแตติก ไม่มีเซิร์ฟเวอร์)
   - แผนพรีเมียม (ราคาแก้ได้จากหลังบ้าน)
   - ชำระผ่าน PromptPay QR / โอนผ่านธนาคาร / PayPal + แจ้งหลักฐาน
   - แอดมินตรวจสอบและปลดล็อกด้วยตนเอง หรือออกรหัสปลดล็อก (activation code)
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   สถานะพรีเมียม
-------------------------------------------------------------------------- */
function premiumPlans(){
  const p = (DB.settings && DB.settings.premium) || {};
  return Array.isArray(p.plans) && p.plans.length ? p.plans : [];
}
function planById(id){ return premiumPlans().find(p => p.id === id) || null; }
function isPremium(u){
  u = u || currentUser();
  if(!u || !u.premium) return false;
  if(u.premium.until === 'forever') return true;
  return +u.premium.until > Date.now();
}
function premiumUntilTxt(u){
  u = u || currentUser();
  if(!u || !u.premium) return '';
  if(u.premium.until === 'forever') return 'สมาชิกตลอดชีพ';
  const d = new Date(+u.premium.until);
  return 'หมดอายุ ' + d.getDate() + '/' + (d.getMonth()+1) + '/' + (d.getFullYear()+543);
}
function grantPremium(u, plan, source){
  if(!u || !plan) return;
  const months = +plan.months || 0;
  let until;
  if(months === 0) until = 'forever';
  else{
    const base = (u.premium && u.premium.until !== 'forever' && +u.premium.until > Date.now()) ? +u.premium.until : Date.now();
    until = base + months * 30 * 864e5;
  }
  u.premium = {plan: plan.id, until, source: source||'manual', ts: Date.now()};
  saveUsers();
  toast('ปลดล็อกพรีเมียมให้คุณ ' + u.name + ' แล้ว');
  renderUserChip();
}
function revokePremium(u){
  if(!u) return;
  u.premium = null;
  saveUsers();
  toast('ยกเลิกพรีเมียมของคุณ ' + u.name + ' แล้ว');
}

/* --------------------------------------------------------------------------
   รหัสปลดล็อก (activation code) — ผูกกับอีเมล ตรวจสอบได้ทั้งสองเครื่อง
-------------------------------------------------------------------------- */
function normEmail(e){ return String(e||'').trim().toLowerCase(); }
function premiumSecret(){ return ((DB.settings&&DB.settings.premium&&DB.settings.premium.secret) || 'why-cn-premium-2025'); }
function buildCode(email, planId){
  const raw = premiumSecret() + '|' + normEmail(email) + '|' + planId;
  const h = hashSha256(raw);
  return 'WHY-' + h.slice(0,4).toUpperCase() + '-' + h.slice(4,8).toUpperCase() + '-' + String(planId).toUpperCase();
}
function verifyCode(code, email){
  const m = String(code||'').trim().toUpperCase().match(/^WHY-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2,10})$/);
  if(!m) return null;
  const planId = m[3].toLowerCase();
  const plan = planById(planId);
  if(!plan) return null;
  const expect = buildCode(email, planId);
  return expect.toUpperCase() === m[0] ? plan : null;
}
function issueCode(email, planId){
  const code = buildCode(email, planId);
  const p = DB.settings.premium = DB.settings.premium || {};
  p.codes = Array.isArray(p.codes) ? p.codes : [];
  p.codes.unshift({code, email:normEmail(email), plan:planId, ts:Date.now(), used:false});
  saveSettings();
  return code;
}

/* --------------------------------------------------------------------------
   Glass popup / confirm (ส่วนกลางของ UI ใหม่)
-------------------------------------------------------------------------- */
function glassPop(opts){
  const mask = document.createElement('div');
  mask.className = 'glass-pop-mask open';
  mask.innerHTML = `
    <div class="glass-pop">
      <button class="gp-close">${ICON('x')}</button>
      <h3><span class="gpic">${ICON(opts.icon||'sparkles')}</span>${esc(opts.title||'')}</h3>
      ${opts.body||''}
      ${(opts.actions||[]).length?`<div class="gp-acts">${opts.actions.map(a=>
        `<button class="btn ${a.cls||'btn-ghost'} btn-sm" data-act="${a.label}">${a.label}</button>`).join('')}</div>`:''}
    </div>`;
  document.body.appendChild(mask);
  mask.addEventListener('click', e => { if(e.target === mask) closeGlassPop(); });
  mask.querySelector('.gp-close').addEventListener('click', closeGlassPop);
  (opts.actions||[]).forEach((a,i) => {
    mask.querySelectorAll('[data-act]')[i].addEventListener('click', () => { if(a.fn) a.fn(); });
  });
  return mask;
}
function closeGlassPop(){
  const m = $('.glass-pop-mask.open');
  if(m) m.remove();
}
function glassPrompt(msg, onOk, isPassword){
  const mask = glassPop({
    icon:'keyboard',
    title:'กรอกข้อมูล',
    body:`<p style="margin:0 0 12px">${msg}</p>
      <div class="field"><input id="gp-input" type="${isPassword?'password':'text'}" placeholder="${isPassword?'รหัสผ่าน':'พิมพ์ข้อความ'}" onkeydown="if(event.key==='Enter')document.querySelector('.gp-acts .btn-primary').click()"></div>`,
    actions:[
      {label:'ยกเลิก', cls:'btn-ghost', fn:closeGlassPop},
      {label:'ตกลง', cls:'btn-primary', fn:()=>{ const v = ($('#gp-input')||{}).value||''; closeGlassPop(); if(onOk) onOk(v); }}
    ]
  });
  setTimeout(()=>{ const i = $('#gp-input'); if(i) i.focus(); }, 60);
  return mask;
}
function glassConfirm(msg, onYes){
  glassPop({
    icon:'help-circle',
    title:'ยืนยัน',
    body:`<p style="margin:0">${msg}</p>`,
    actions:[
      {label:'ยกเลิก', cls:'btn-ghost', fn:closeGlassPop},
      {label:'ยืนยัน', cls:'btn-primary', fn:()=>{ closeGlassPop(); if(onYes) onYes(); }}
    ]
  });
}

/* --------------------------------------------------------------------------
   Paywall — กันเนื้อหาพรีเมียม
-------------------------------------------------------------------------- */
const PREMIUM_FEATURES = {
  exams: 'ข้อสอบจำลอง HSK ชุด 2–5 (100 ข้อต่อชุด)',
  exam: 'ข้อสอบจำลอง HSK ชุด 2–5 (100 ข้อต่อชุด)',
  write: 'ฝึกเขียนอักษรจีนครบทุกตัว พร้อมตรวจลำดับขีด',
  writing: 'ตัวอักษรพรีเมียมทั้งหมด (เกินชุดตัวฟรี)'
};
function requirePremium(feature, onUnlocked){
  const u = currentUser();
  if(isPremium(u)){ if(onUnlocked) onUnlocked(); return true; }
  const featTxt = (PREMIUM_FEATURES[feature] || 'เนื้อหาพรีเมียม');
  glassPop({
    icon:'crown',
    title:'เนื้อหาพรีเมียม',
    body: `
      <p style="margin-bottom:12px">${esc(featTxt)} — เป็นสิทธิ์ของ<b style="color:var(--red)">สมาชิกพรีเมียม</b>เท่านั้น</p>
      <div class="paywall-feats">
        <div class="paywall-feat"><span class="ic">${TILE('clipboard','red')}</span><div><b>ข้อสอบจำลอง HSK ชุด 2–5</b><span>100 ข้อต่อชุด · 5 ชุดต่อระดับ · ฟัง/อ่าน/เขียน จับเวลา เฉลยครบ</span></div></div>
        <div class="paywall-feat"><span class="ic">${TILE('pen-line','gold')}</span><div><b>เขียนอักษรครบทุกตัว</b><span>แอนิเมชันลำดับขีด + ตรวจคะแนนการเขียน</span></div></div>
        <div class="paywall-feat"><span class="ic">${TILE('crown','brown')}</span><div><b>สถานะพรีเมียม</b><span>ป้ายสมาชิกพิเศษ + อัปเดตเนื้อหาใหม่ก่อนใคร</span></div></div>
      </div>
      ${u ? `<button class="paywall-cta" onclick="closeGlassPop();go('premium')">${ICON('crown')} ดูแพ็กเกจพรีเมียม</button>`
          : `<button class="paywall-cta" onclick="closeGlassPop();go('login')">${ICON('user')} เข้าสู่ระบบก่อนเลือกแพ็กเกจ</button>`}
      <p style="text-align:center;margin:12px 0 0;font-size:12px;color:var(--text-3)">ชุดที่ 1 ของข้อสอบทุกระดับ · คอร์สพินอิน · และอักษรชุดฟรี ยังเปิดให้ใช้ฟรี</p>`
  });
  return false;
}

/* --------------------------------------------------------------------------
   PromptPay — สร้าง payload EMVCo + QR ผ่าน API (fallback เป็นข้อความคัดลอก)
-------------------------------------------------------------------------- */
function crc16(data){
  let crc = 0xFFFF;
  for(let i=0;i<data.length;i++){
    crc ^= data.charCodeAt(i) << 8;
    for(let j=0;j<8;j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    crc &= 0xFFFF;
  }
  return crc;
}
function tlv(id, val){ return String(id) + String(String(val).length).padStart(2,'0') + String(val); }
function promptpayPayload(target, amount, name){
  const t = String(target||'').replace(/[^\d]/g,'');
  if(!t) return '';
  let sub = tlv('00','A000000677010111');
  if(t.length === 13 && !(t.startsWith('0') || t.startsWith('6'))){
    /* เลขบัตรประชาชน 13 หลัก (ไม่ใช่เบอร์โทร) → tag 02 */
    sub += tlv('02', t);
  } else if(t.length === 10 && t.startsWith('0')){
    sub += tlv('01', '66' + t.slice(1));
  } else if(t.length === 13 && (t.startsWith('0') || t.startsWith('6'))){
    sub += tlv('01', '66' + t.slice(1));
  } else {
    sub += tlv('01', '66' + t.padStart(9,'0').slice(-9));
  }
  let payload = '000201010211';
  payload += tlv('30', sub);
  payload += tlv('53','764');
  if(amount) payload += tlv('54', Number(amount).toFixed(2));
  payload += tlv('58','TH');
  payload += tlv('59', String(name||'为什么中文').slice(0,40));
  payload += tlv('60','BKK');
  payload += '6304';
  const crc = crc16(payload).toString(16).toUpperCase().padStart(4,'0');
  return payload + crc;
}

/* --------------------------------------------------------------------------
   หน้าพรีเมียม
-------------------------------------------------------------------------- */
let payState = {planId:null, method:'pp', ref:'', slip:''};
/* ฟีเจอร์แยกตามแพ็กเกจ — รายเดือนมีโควตาสแกน, 6 เดือน+/ตลอดชีพไม่จำกัด */
const PLAN_FEATURES = {
  m1: [
    ['target','ข้อสอบจำลอง HSK ชุด 2–5 (100 ข้อ × 5 ชุด)'],
    ['scan','สแกนอักษรจีน 20 ครั้ง/เดือน'],
    ['pen-line','เขียนอักษรครบทุกตัว + ตรวจลำดับขีด'],
    ['music','คอร์สพินอินและแบบฝึกครบทุกบท'],
    ['sparkles','แผนการเรียนเฉพาะบุคคล (AI วิเคราะห์เป้าหมาย)'],
    ['crown','ป้ายสมาชิกพรีเมียมในโปรไฟล์']
  ],
  m6: [
    ['target','ข้อสอบจำลอง HSK ชุด 2–5 (100 ข้อ × 5 ชุด)'],
    ['scan','สแกนอักษรจีนไม่จำกัด'],
    ['pen-line','เขียนอักษรครบทุกตัว + ตรวจลำดับขีด'],
    ['music','คอร์สพินอินและแบบฝึกครบทุกบท'],
    ['sparkles','แผนการเรียนเฉพาะบุคคล (AI วิเคราะห์เป้าหมาย)'],
    ['crown','ป้ายสมาชิกพรีเมียมในโปรไฟล์']
  ],
  life: [
    ['target','ข้อสอบจำลอง HSK ชุด 2–5 (100 ข้อ × 5 ชุด)'],
    ['scan','สแกนอักษรจีนไม่จำกัด ตลอดชีพ'],
    ['pen-line','เขียนอักษรครบทุกตัว + ตรวจลำดับขีด'],
    ['music','คอร์สพินอินและแบบฝึกครบทุกบท'],
    ['sparkles','แผนการเรียนเฉพาะบุคคล (AI วิเคราะห์เป้าหมาย)'],
    ['crown','ป้ายสมาชิกพรีเมียมตลอดชีพ']
  ]
};
function planFeatures(id){ return PLAN_FEATURES[id] || PLAN_FEATURES.m1; }

function renderPremiumPage(){
  const box = $('#premiumView'); if(!box) return;
  const u = currentUser();
  const plans = premiumPlans();
  const prem = isPremium(u);
  const S = (DB.settings && DB.settings.premium) || {};
  box.innerHTML = `
    <div class="prem-hero">
      <div class="crown">${ICON('crown')}</div>
      <div class="in">
        <div class="kicker">Premium Membership · 会员</div>
        <h2>ปลดล็อกทุกเนื้อหา เรียนจีนได้ไม่จำกัด</h2>
        <p>ข้อสอบจำลอง HSK 100 ข้อ ครบ 5 ชุดต่อระดับ · ฝึกเขียนอักษรจีนพร้อมตรวจลำดับขีด ·
           <b>สแกนอักษรจีน (OCR)</b> และแผนการเรียนเฉพาะบุคคลจาก AI — แต่ละแพ็กเกจมีสิทธิ์ต่างกัน</p>
      </div>
    </div>

    ${prem? `
    <div class="continue-card reveal" style="margin-bottom:30px">
      <div class="ic" style="font-size:26px">${ICON('crown')}</div>
      <div class="txt">
        <b>คุณเป็นสมาชิกพรีเมียมแล้ว · ${esc(premiumUntilTxt(u))}</b>
        <span>แพ็กเกจ ${esc((planById(u.premium.plan)||{}).name || u.premium.plan || '')} — เข้าใช้เนื้อหาพรีเมียมได้ทั้งหมดทันที</span>
      </div>
      <button class="btn btn-gold btn-sm" onclick="go('exams')">${ICON('target')} เริ่มทำข้อสอบ HSK</button>
    </div>` : ''}

    <div class="sec-head reveal" style="margin-bottom:26px">
      <div class="kicker">Choose your plan</div>
      <h2>เลือกแพ็กเกจที่เหมาะกับคุณ</h2>
      <p>แพ็กเกจที่ยาวกว่าให้สิทธิ์มากกว่า — รายเดือนจำกัดสแกน ${'20'} ครั้ง/เดือน · 6 เดือนขึ้นไปสแกนไม่จำกัด</p>
    </div>
    <div class="plan-grid">
      ${plans.map(p=>`
        <div class="plan ${p.popular?'pop':''} reveal" onclick="payState.planId='${p.id}';renderPremiumPage()">
          ${p.popular?'<span class="pop-tag">คุ้มที่สุด</span>':''}
          <span class="p-ic">${ICON(p.months===0?'gem':p.months>=6?'crown':'star')}</span>
          <h3>${esc(p.name)}</h3>
          <div class="p-sub">${p.months===0?'Lifetime':p.months+' เดือน'}</div>
          <div class="price">฿${(+p.price||0).toLocaleString()}</div>
          <div class="per">${p.months===0?'จ่ายครั้งเดียว ใช้ตลอดไป':p.months===1?'ต่อเดือน':'เฉลี่ยเดือนละ ฿'+Math.round((+p.price||0)/p.months)}</div>
          <ul>
            ${planFeatures(p.id).map(f=>`<li>${ICON('check')} ${esc(f[1])}</li>`).join('')}
          </ul>
          <button class="btn ${p.popular?'btn-gold':'btn-ghost'} btn-block" onclick="event.stopPropagation();choosePlan('${p.id}')">
            ${ICON('credit-card')} ${payState.planId===p.id?'เลือกแล้ว ✓':'เลือกแพ็กเกจนี้'}
          </button>
        </div>`).join('')}
    </div>
    <div id="payArea"></div>

    <div class="sec-head reveal" style="margin:46px auto 24px">
      <div class="kicker">Already paid?</div>
      <h2>มีรหัสปลดล็อกแล้ว</h2>
      <p>กรอกรหัสที่ได้รับจากแอดมิน (เช่น WHY-XXXX-XXXX-PLAN) เพื่อเปิดใช้งานทันที</p>
    </div>
    <div class="panel" style="max-width:560px;margin:0 auto">
      <div class="grid2">
        <div class="field"><label>รหัสปลดล็อก</label><input id="pc-code" placeholder="WHY-XXXX-XXXX-PLAN" onkeydown="if(event.key==='Enter')redeemCode()"></div>
        <div class="field" style="align-self:end"><button class="btn btn-primary btn-block" onclick="redeemCode()">${ICON('unlock')} เปิดใช้งาน</button></div>
      </div>
    </div>`;
  renderPayArea();
  observeReveals();
}
function choosePlan(id){
  payState.planId = id;
  payState.method = 'pp';
  renderPremiumPage();
  const area = $('#payArea');
  if(area) area.scrollIntoView({behavior:'smooth', block:'center'});
}
function renderPayArea(){
  const box = $('#payArea'); if(!box) return;
  const plan = planById(payState.planId);
  const u = currentUser();
  if(!plan){ box.innerHTML = ''; return; }
  const S = (DB.settings && DB.settings.premium) || {};
  const amount = +plan.price || 0;
  const pp = promptpayPayload(S.ppId, amount, S.ppName);
  const ref = payState.ref;
  box.innerHTML = `
    <div class="exam-hero" style="margin-top:34px;background:linear-gradient(135deg,rgba(90,70,50,.92),rgba(138,37,25,.88))">
      <div class="in">
        <div class="kicker">Checkout · ชำระเงิน</div>
        <h2>${esc(plan.name)} — ฿${amount.toLocaleString()}</h2>
        <p>${u? 'บัญชี: '+esc(u.name)+' ('+esc(u.email||'ยังไม่มีอีเมล')+')' : 'กรุณาเข้าสู่ระบบก่อนชำระเงิน เพื่อให้แอดมินระบุบัญชีของคุณได้'}</p>
        <div class="exam-stats">
          <div><b>฿${amount.toLocaleString()}</b><span>ยอดชำระ</span></div>
          <div><b>${plan.months===0?'∞':plan.months+' เดือน'}</b><span>ระยะเวลา</span></div>
        </div>
      </div>
    </div>

    <div class="hsk-tabs" style="margin:22px 0">
      ${[['pp','PromptPay / สแกนจ่าย'],['bank','โอนผ่านธนาคาร'],['paypal','PayPal']].map(([id,label])=>`
        <button class="hsk-tab ${payState.method===id?'active':''}" onclick="payState.method='${id}';renderPayArea()">${label}</button>`).join('')}
    </div>

    ${payState.method==='pp'? `
      <div class="panel" style="max-width:520px;margin:0 auto;text-align:center">
        <h3 style="justify-content:center">สแกนจ่ายด้วยแอปธนาคาร</h3>
        <p style="font-size:13.5px;color:var(--text-2)">ยอดชำระ <b style="font-family:var(--ff-num);color:var(--red);font-size:18px">฿${amount.toLocaleString()}</b> — สแกนด้วยแอปธนาคารใดก็ได้ (PromptPay)</p>
        ${S.ppId? `
          <div class="qr-box" style="margin:16px auto">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(pp)}"
                 alt="PromptPay QR" onerror="this.parentElement.innerHTML='<div style=\\'padding:20px\\'><b>โหลด QR ไม่สำเร็จ</b><br><span>คัดลอกโค้ดด้านล่างไปวางในแอปธนาคารแทน</span></div>'">
            <span>พร้อมเพย์ · ${esc(S.ppName||'')}</span>
          </div>
          <div class="field" style="text-align:left;margin-top:14px">
            <label>โค้ดชำระเงิน (ใช้คัดลอกลงแอปธนาคารได้)</label>
            <input readonly value="${esc(pp)}" onclick="this.select()">
          </div>`
        : `<div class="empty"><span class="ic">${ICON('settings')}</span>แอดมินยังไม่ได้ตั้งเลขพร้อมเพย์ — ติดต่อแอดมินหรือใช้วิธีโอนผ่านธนาคาร</div>`}
      </div>` : ''}

    ${payState.method==='bank'? `
      <div class="panel" style="max-width:520px;margin:0 auto">
        <h3>โอนผ่านธนาคาร</h3>
        ${S.bank? `<div class="prem-note" style="white-space:pre-line;margin:0 0 16px">${esc(S.bank)}</div>`
                 : '<div class="empty">แอดมินยังไม่ได้ตั้งเลขบัญชี — ติดต่อแอดมินโดยตรง</div>'}
        <p style="font-size:13px;color:var(--text-2)">โอนเงิน <b style="font-family:var(--ff-num);color:var(--red)">฿${amount.toLocaleString()}</b> แล้วแนบสลิปด้านล่าง</p>
      </div>` : ''}

    ${payState.method==='paypal'? `
      <div class="panel" style="max-width:520px;margin:0 auto;text-align:center">
        <h3 style="justify-content:center">ชำระผ่าน PayPal</h3>
        ${S.paypal? `<p style="font-size:13.5px;color:var(--text-2)">กดปุ่มด้านล่างเพื่อชำระ ${S.paypal} — จำนวน ${amount} บาท (แอดมินจะยืนยันยอดอีกครั้ง)</p>
          <a class="btn btn-primary" style="margin-top:14px" href="${esc(S.paypal)}" target="_blank" rel="noopener">${ICON('wallet')} ไปที่ PayPal</a>`
        : '<div class="empty">แอดมินยังไม่ได้ตั้งลิงก์ PayPal</div>'}
      </div>` : ''}

    <div class="panel" style="max-width:520px;margin:0 auto;margin-top:20px">
      <h3>แจ้งการชำระเงิน</h3>
      <p style="font-size:13.5px;color:var(--text-2);margin-bottom:14px">หลังโอน/สแกนจ่ายแล้ว กรอกเลขรายการ (Ref) เพื่อให้แอดมินตรวจสอบ — ถ้าแอดมินอยู่คนละเครื่อง ให้ส่งหลักฐานผ่าน LINE/FB แล้วขอรหัสปลดล็อก</p>
      <div class="field"><label>เลขรายการ / เวลาโอน (เช่น ref. 20250101123456)</label>
        <input id="pay-ref" placeholder="เลขที่อ้างอิงจากสลิป" value="${esc(ref)}" oninput="payState.ref=this.value"></div>
      <div class="field"><label>แนบรูปสลิป (ไม่บังคับ)</label>
        <div class="img-drop">
          <input type="file" accept="image/*" onchange="onPaySlip(this)">
          <span class="ic">${ICON('image')}</span><b>คลิกเพื่ออัปโหลดสลิป</b><span>รูปจะถูกย่ออัตโนมัติ</span>
        </div>
        <div id="paySlipPrev"></div></div>
      <button class="btn btn-gold btn-block" style="margin-top:8px" onclick="submitPayment()">${ICON('check')} แจ้งการชำระเงิน ฿${amount.toLocaleString()}</button>
      <p style="font-size:11.5px;color:var(--text-3);text-align:center;margin-top:10px">เมื่อแอดมินยืนยันแล้ว บัญชีของคุณจะถูกปลดล็อกพรีเมียมทันที (หรือได้รับรหัสปลดล็อก)</p>
    </div>`;
  wirePaySlipPreview();
}
function onPaySlip(input){
  if(typeof readImageFile !== 'function'){ toast('ฟังก์ชันอัปโหลดยังไม่พร้อม'); return; }
  readImageFile(input, function(data){
    payState.slip = data;
    const pv = $('#paySlipPrev');
    if(pv) pv.innerHTML = '<img class="img-prev" src="'+data+'">';
    toast('แนบสลิปแล้ว ✓');
  }, 700);
}
function wirePaySlipPreview(){
  if(payState.slip){
    const pv = $('#paySlipPrev');
    if(pv) pv.innerHTML = '<img class="img-prev" src="'+payState.slip+'">';
  }
}
function submitPayment(){
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนแจ้งชำระเงิน'); go('login'); return; }
  const plan = planById(payState.planId);
  if(!plan){ toast('เลือกแพ็กเกจก่อน'); return; }
  const ref = payState.ref.trim();
  if(!ref && !payState.slip){ toast('กรอกเลขรายการหรือแนบสลิปก่อนนะ'); return; }
  let reqs = store.get('payreqs', []) || [];
  reqs.unshift({
    id: uid('pay'), uid: u.id, userName: u.name, email: u.email||'',
    plan: plan.id, planName: plan.name, amount: +plan.price||0,
    ref: ref, slip: payState.slip||'', ts: Date.now(), status:'pending', note:''
  });
  store.set('payreqs', reqs);
  payState.ref = '';
  payState.slip = '';
  toast('ส่งหลักฐานแล้ว — รอแอดมินยืนยัน (หรือขอรหัสปลดล็อก)');
  renderPremiumPage();
}
function redeemCode(){
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนใช้รหัสปลดล็อก'); go('login'); return; }
  const code = ($('#pc-code')?.value||'').trim();
  if(!code){ toast('กรอกรหัสปลดล็อกก่อน'); return; }
  if(!u.email){ toast('บัญชีของคุณยังไม่มีอีเมล — เพิ่มอีเมลในหน้าโปรไฟล์ก่อน (รหัสผูกกับอีเมล)'); go('profile'); return; }
  const plan = verifyCode(code, u.email);
  if(!plan){
    toast('รหัสไม่ถูกต้อง หรือไม่ตรงกับอีเมลของบัญชีนี้');
    return;
  }
  grantPremium(u, plan, 'code:'+code);
  toast('เปิดใช้งานพรีเมียมสำเร็จ! ยินดีต้อนรับสู่สมาชิก');
  go('profile');
}


/* ==========================================================================
   ADMIN — จัดการการชำระเงินและพรีเมียม (เมนูหลังบ้าน: การชำระเงิน)
   ========================================================================== */
function adminGrantCoins(){
  const email = normEmail(($('#wq-email')||{}).value || '');
  const n = Math.round(+($('#wq-amount')||{}).value || 0);
  if(!email || !(n > 0)){ toast('ใส่อีเมลและจำนวนเหรียญ'); return; }
  const u = USERS.find(function(x){ return normEmail(x.email) === email || x.name.toLowerCase() === email.toLowerCase(); });
  if(!u){ toast('ไม่พบผู้ใช้อีเมลนี้ในเครื่องนี้'); return; }
  addWeiqian(u, n, 'เติมโดยแอดมิน');
  toast('เติม ' + n + ' เป็นเงินให้ ' + u.name + ' แล้ว');
  renderAdmin();   /* รีเฟรชแผง */
  renderUserChip();
}
function adminPayment(){
  if(typeof ensureData === 'function') ensureData();
  const prem = DB.settings.premium || {};
  const plans = premiumPlans();
  const reqs = (store.get('payreqs', []) || []).filter(function(r){ return r && r.id; });
  const pending = reqs.filter(function(r){ return r.status === 'pending'; });
  const premUsers = USERS.filter(isPremium);
  const codes = Array.isArray(prem.codes) ? prem.codes : [];

  let html = '';
  /* -------- ภาพรวม -------- */
  html += '<div class="panel"><h3>ภาพรวมระบบพรีเมียม</h3>'
    + '<div class="stat-grid" style="margin-bottom:4px">'
    +   '<div class="stat-card"><div class="ic">' + ICON('receipt') + '</div><b>' + pending.length + '</b><span>รายการรอตรวจสอบ</span></div>'
    +   '<div class="stat-card"><div class="ic">' + ICON('crown') + '</div><b>' + premUsers.length + '</b><span>ผู้ใช้พรีเมียม (เครื่องนี้)</span></div>'
    +   '<div class="stat-card"><div class="ic">' + ICON('gem') + '</div><b>' + plans.length + '</b><span>แพ็กเกจที่เปิดขาย</span></div>'
    +   '<div class="stat-card"><div class="ic">' + ICON('qr-code') + '</div><b>' + codes.length + '</b><span>รหัสปลดล็อกที่ออก</span></div>'
    + '</div></div>';

  /* -------- เหรียญ為錢 -------- */
  html += '<div class="panel"><h3>' + (typeof coinHTML === 'function' ? coinHTML('md') : '') + ' เหรียญเป็น錢 — เติมให้ผู้ใช้</h3>'
    + '<p style="font-size:13px;color:var(--text-2);margin-bottom:14px">ผู้ใช้ชำระค่าแพ็กเหรียญแล้ว แจ้งอีเมลมา — เติมเหรียญตามแพ็กที่ซื้อ</p>'
    + '<div class="social-edit-row" style="grid-template-columns:1.4fr .7fr .7fr auto">'
    + '<input class="search-in" id="wq-email" placeholder="อีเมลหรือชื่อผู้ใช้">'
    + '<input class="search-in" id="wq-amount" type="number" min="1" value="50" title="จำนวนเหรียญ">'
    + '<select class="search-in" id="wq-pack" onchange="var p=coinPackById(this.value);if(p)document.getElementById(&quot;wq-amount&quot;).value=p.coins">'
    + COIN_PACKS.map(function(p){ return '<option value="' + p.id + '">฿' + p.baht + ' → ' + p.coins + '</option>'; }).join('')
    + '</select>'
    + '<button class="mini-btn" onclick="adminGrantCoins()">' + ICON('plus') + ' เติมเหรียญ</button>'
    + '</div>'
    + '<div class="activity-list" style="margin-top:12px">'
    + USERS.filter(function(x){ return +x.weiqian > 0; }).map(function(x){
        return '<div class="activity"><span class="ic">' + avatarHTML(x.avatar) + '</span><span class="txt"><b>' + esc(x.name) + '</b> · ' + esc(x.email||'') + '</span><span class="pts">' + (typeof coinHTML === 'function' ? coinHTML('sm') : '') + ' ' + (+x.weiqian).toLocaleString() + '</span></div>';
      }).join('')
    + '</div></div>';

  /* -------- แพ็กเกจ & ราคา -------- */
  html += '<div class="panel"><h3>แพ็กเกจพรีเมียม — ปรับราคาได้เอง</h3>'
    + '<p style="font-size:13px;color:var(--text-2);margin-bottom:14px">แก้ราคา ระยะเวลา และชื่อแพ็กเกจ แล้วกดบันทึก — หน้า ' + esc('พรีเมียม') + ' ของผู้ใช้จะอัปเดตทันที</p>';
  plans.forEach(function(p, i){
    html += '<div class="social-edit-row" style="grid-template-columns:1.2fr .8fr .8fr .8fr auto">'
      + '<input class="search-in" id="pl-name-' + i + '" value="' + esc(p.name) + '" placeholder="ชื่อแพ็กเกจ">'
      + '<input class="search-in" id="pl-months-' + i + '" type="number" min="0" value="' + (p.months||0) + '" title="0 = ตลอดชีพ">'
      + '<input class="search-in" id="pl-price-' + i + '" type="number" min="0" value="' + (+p.price||0) + '">'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2)"><input type="checkbox" id="pl-pop-' + i + '" ' + (p.popular?'checked':'') + '> ขายดี</label>'
      + '<button class="mini-btn ghost" onclick="delPlan(' + i + ')">' + ICON('trash') + '</button>'
      + '</div>';
  });
  html += '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:8px">'
    + '<button class="mini-btn" onclick="savePlanPrices()">' + ICON('save') + ' บันทึกราคา</button>'
    + '<button class="mini-btn ghost" onclick="addPlan()">' + ICON('plus') + ' เพิ่มแพ็กเกจ</button>'
    + '</div></div>';

  /* -------- ช่องทางรับเงิน -------- */
  html += '<div class="panel"><h3>ช่องทางรับเงิน</h3>'
    + '<div class="grid2">'
    + '<div class="field"><label>เลขพร้อมเพย์ (เบอร์โทร 10 หลัก / เลขบัตรประชาชน 13 หลัก)</label><input id="pm-ppid" value="' + esc(prem.ppId||'') + '" placeholder="08xxxxxxxxx"></div>'
    + '<div class="field"><label>ชื่อบัญชีพร้อมเพย์</label><input id="pm-ppname" value="' + esc(prem.ppName||'') + '"></div>'
    + '</div>'
    + '<div class="field"><label>เลขบัญชีธนาคาร (ข้อความแสดงให้ผู้ใช้โอน)</label><textarea id="pm-bank" placeholder="ธนาคารกสิกรไทย&#10;เลขบัญชี xxx-x-xxxxx-x&#10;ชื่อบัญชี ...">' + esc(prem.bank||'') + '</textarea></div>'
    + '<div class="field"><label>ลิงก์ PayPal (paypal.me/xxx หรือลิงก์ชำระ)</label><input id="pm-paypal" value="' + esc(prem.paypal||'') + '" placeholder="https://paypal.me/yourname"></div>'
    + '<button class="mini-btn" onclick="savePayChannels()">' + ICON('save') + ' บันทึกช่องทางรับเงิน</button>'
    + '</div>';

  /* -------- รายการแจ้งชำระ -------- */
  html += '<div class="panel"><h3>รายการแจ้งชำระเงิน (' + pending.length + ' รายการรอตรวจ)</h3>';
  if(!reqs.length){
    html += '<div class="empty"><span class="ic">' + ICON('receipt') + '</span>ยังไม่มีผู้ใช้แจ้งชำระเงิน — เมื่อผู้ใช้กด "แจ้งการชำระเงิน" จะปรากฏที่นี่</div>';
  } else {
    reqs.slice(0, 40).forEach(function(r){
      const u = USERS.find(function(x){ return x.id === r.uid; });
      const plan = planById(r.plan);
      const statusTxt = {pending:'รอตรวจสอบ', approved:'อนุมัติแล้ว', rejected:'ปฏิเสธ'}[r.status] || r.status;
      html += '<div class="row-card"><div class="top">'
        + (r.slip ? '<img src="' + r.slip + '" style="width:56px;height:56px;object-fit:cover;border-radius:10px;border:1px solid var(--line);cursor:zoom-in" onclick="window.open(this.src)">' : '')
        + '<div class="txt"><b>' + esc(r.userName) + (r.email? ' · ' + esc(r.email):'') + '</b>'
        + '<small>' + esc(r.planName) + ' · ฿' + (+r.amount||0).toLocaleString() + ' · ref: ' + esc(r.ref||'—') + ' · ' + fmtDate(r.ts) + ' · <b style="color:' + (r.status==='approved'?'var(--jade)':r.status==='rejected'?'var(--red)':'var(--gold)') + '">' + statusTxt + '</b></small></div>'
        + '<div class="acts">'
        + (r.status === 'pending' ? '<button class="icon-btn ok" title="อนุมัติ (ปลดล็อกพรีเมียม)" onclick="approvePayReq(\'' + r.id + '\')">' + ICON('check') + '</button>'
          + '<button class="icon-btn warn" title="ปฏิเสธ" onclick="rejectPayReq(\'' + r.id + '\')">' + ICON('x') + '</button>'
          + '<button class="icon-btn" title="ออกรหัสปลดล็อกให้ผู้ใช้นี้" onclick="issueCodeForReq(\'' + r.id + '\')">' + ICON('qr-code') + '</button>' : '')
        + (u ? '' : '<span style="font-size:11px;color:var(--text-3);align-self:center">ผู้ใช้อยู่เครื่องอื่น → ออกรหัสปลดล็อก</span>')
        + '</div></div></div>';
    });
  }
  html += '</div>';

  /* -------- ผู้ใช้พรีเมียม / ปลดล็อกเอง -------- */
  html += '<div class="panel"><h3>ผู้ใช้ & ปลดล็อกพรีเมียมด้วยตนเอง</h3>'
    + '<p style="font-size:13px;color:var(--text-2);margin-bottom:14px">ปลดล็อก/ยกเลิกพรีเมียมให้ผู้ใช้ในเครื่องนี้ได้ทันที — ใช้กรณีรับเงินสดหรือยืนยันการโอนแล้ว</p>';
  if(!USERS.length){
    html += '<div class="empty">ยังไม่มีผู้ใช้ในเครื่องนี้</div>';
  } else {
    USERS.slice().reverse().forEach(function(u){
      const prem = isPremium(u);
      html += '<div class="row-card"><div class="top"><div class="txt"><b>' + esc(u.name) + (u.email?' · '+esc(u.email):'') + '</b>'
        + '<small>Level ' + levelOf(u.xp) + ' · ' + (u.points||0).toLocaleString() + ' แต้ม · ' + (prem ? 'พรีเมียม: ' + esc(premiumUntilTxt(u)) : 'ยังไม่เป็นพรีเมียม') + '</small></div>'
        + '<div class="acts">'
        + '<select id="mu-plan-' + u.id + '" class="search-in" style="width:auto;padding:6px 10px;font-size:12.5px">' + plans.map(function(p){ return '<option value="' + p.id + '">' + esc(p.name) + ' (฿' + (+p.price||0) + ')</option>'; }).join('') + '</select>'
        + '<button class="icon-btn ok" title="ปลดล็อกตามแพ็กเกจที่เลือก" onclick="manualUnlock(\'' + u.id + '\')">' + ICON('unlock') + '</button>'
        + (prem ? '<button class="icon-btn warn" title="ยกเลิกพรีเมียม" onclick="revokePrem(\'' + u.id + '\')">' + ICON('ban') + '</button>' : '')
        + '</div></div></div>';
    });
  }
  html += '</div>';

  /* -------- รหัสปลดล็อก -------- */
  html += '<div class="panel"><h3>ออกรหัสปลดล็อก (Activation Code)</h3>'
    + '<p style="font-size:13px;color:var(--text-2);margin-bottom:14px">สำหรับผู้ใช้ที่อยู่คนละเครื่อง — ระบุอีเมลเดียวกับบัญชีผู้ใช้และแพ็กเกจ ระบบจะสร้างรหัสที่ผู้ใช้กรอกได้เองที่หน้า ' + esc('พรีเมียม') + ' → ส่งรหัสให้ผู้ใช้ทาง LINE/อีเมล</p>'
    + '<div class="toolbar">'
    + '<input class="search-in" id="code-email" placeholder="อีเมลผู้ใช้ (ต้องตรงกับบัญชี)">'
    + '<select id="code-plan" class="search-in" style="width:auto">' + plans.map(function(p){ return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</select>'
    + '<button class="mini-btn" onclick="adminIssueCode()">' + ICON('qr-code') + ' ออกรหัส</button>'
    + '</div>';
  if(codes.length){
    html += '<div class="activity-list" style="margin-top:12px">';
    codes.slice(0, 20).forEach(function(c){
      html += '<div class="activity"><span class="ic">' + ICON('qr-code') + '</span>'
        + '<span class="txt"><b style="font-family:monospace;letter-spacing:1px">' + esc(c.code) + '</b><br><span style="font-size:11.5px;color:var(--text-3)">' + esc(c.email) + ' · ' + esc((planById(c.plan)||{}).name||c.plan) + ' · ' + fmtDate(c.ts) + '</span></span>'
        + '<button class="mini-btn ghost" onclick="copyCode(\'' + esc(c.code) + '\')">' + ICON('copy') + ' คัดลอก</button></div>';
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}
function savePlanPrices(){
  const prem = DB.settings.premium || {};
  prem.plans.forEach(function(p, i){
    p.name = ($('#pl-name-' + i)?.value || p.name).trim() || p.name;
    p.months = Math.max(0, +($('#pl-months-' + i)?.value || 0));
    p.price = Math.max(0, +($('#pl-price-' + i)?.value || 0));
    p.popular = !!($('#pl-pop-' + i)?.checked);
  });
  saveSettings();
  toast('บันทึกราคาแพ็กเกจแล้ว');
  renderAdmin();
}
function addPlan(){
  const prem = DB.settings.premium || {};
  prem.plans = prem.plans || [];
  prem.plans.push({id:'p' + Date.now().toString(36), name:'แพ็กเกจใหม่', months:3, price:300, popular:false});
  saveSettings();
  renderAdmin();
}
function delPlan(i){
  const prem = DB.settings.premium || {};
  prem.plans.splice(i, 1);
  saveSettings();
  renderAdmin();
}
function savePayChannels(){
  const prem = DB.settings.premium || {};
  prem.ppId = ($('#pm-ppid')?.value || '').replace(/[^\d]/g, '').slice(0, 13);
  prem.ppName = ($('#pm-ppname')?.value || '').trim();
  prem.bank = $('#pm-bank')?.value || '';
  prem.paypal = ($('#pm-paypal')?.value || '').trim();
  saveSettings();
  toast('บันทึกช่องทางรับเงินแล้ว');
  renderAdmin();
}
function approvePayReq(id){
  const reqs = store.get('payreqs', []) || [];
  const r = reqs.find(function(x){ return x.id === id; });
  if(!r){ return; }
  r.status = 'approved';
  r.ts2 = Date.now();
  store.set('payreqs', reqs);
  const u = USERS.find(function(x){ return x.id === r.uid; });
  if(u){
    const plan = planById(r.plan) || premiumPlans()[0];
    grantPremium(u, plan, 'payment:' + (r.ref||''));
  } else {
    toast('อนุมัติแล้ว — แต่ผู้ใช้อยู่เครื่องอื่น ให้ออกรหัสปลดล็อกส่งให้ผู้ใช้');
  }
  renderAdmin();
}
function rejectPayReq(id){
  const reqs = store.get('payreqs', []) || [];
  const r = reqs.find(function(x){ return x.id === id; });
  if(!r){ return; }
  r.status = 'rejected';
  r.ts2 = Date.now();
  store.set('payreqs', reqs);
  toast('ปฏิเสธรายการแล้ว');
  renderAdmin();
}
function issueCodeForReq(id){
  const reqs = store.get('payreqs', []) || [];
  const r = reqs.find(function(x){ return x.id === id; });
  if(!r){ return; }
  const email = r.email || prompt('ผู้ใช้นี้ยังไม่มีอีเมล — พิมพ์อีเมลบัญชีของผู้ใช้');
  if(!email) return;
  const code = issueCode(email, r.plan);
  r.status = 'approved';
  r.ts2 = Date.now();
  store.set('payreqs', reqs);
  renderAdmin();
  if(typeof glassPop === 'function'){
    glassPop({
      icon:'qr-code', title:'รหัสปลดล็อกออกแล้ว',
      body:'<p style="margin:0">ส่งรหัสนี้ให้ผู้ใช้กรอกที่หน้า ' + esc('พรีเมียม') + ' (อีเมลต้องตรงกับบัญชี):</p>'
        + '<div class="prem-note" style="text-align:center;font-family:monospace;font-size:17px;letter-spacing:1px;margin-top:12px">' + esc(code) + '</div>',
      actions:[{label:'คัดลอกรหัส', cls:'btn-primary', fn:function(){ copyCode(code); }}]
    });
  }
}
function adminIssueCode(){
  const email = normEmail($('#code-email')?.value || '');
  const planId = $('#code-plan')?.value;
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ toast('ใส่อีเมลผู้ใช้ให้ถูกต้อง'); return; }
  const code = issueCode(email, planId);
  renderAdmin();
  if(typeof glassPop === 'function'){
    glassPop({
      icon:'qr-code', title:'รหัสปลดล็อกออกแล้ว',
      body:'<p style="margin:0">รหัสสำหรับ <b style="color:var(--red)">' + esc(email) + '</b> (แพ็กเกจ ' + esc((planById(planId)||{}).name||'') + '):</p>'
        + '<div class="prem-note" style="text-align:center;font-family:monospace;font-size:17px;letter-spacing:1px;margin-top:12px">' + esc(code) + '</div>'
        + '<p style="font-size:12px;margin:12px 0 0;color:var(--text-3)">ผู้ใช้กรอกรหัสที่หน้า พรีเมียม ด้วยบัญชีที่อีเมลตรงกันจึงจะเปิดใช้งานได้</p>',
      actions:[{label:'คัดลอกรหัส', cls:'btn-primary', fn:function(){ copyCode(code); }}]
    });
  }
}
function copyCode(code){
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(code); }
    else{
      const ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast('คัดลอกรหัสแล้ว: ' + code);
  }catch(e){ toast('คัดลอกเองได้เลย: ' + code); }
}
function manualUnlock(uid){
  const u = USERS.find(function(x){ return x.id === uid; });
  if(!u) return;
  const planId = $('#mu-plan-' + uid)?.value;
  const plan = planById(planId) || premiumPlans()[0];
  if(!plan){ toast('ยังไม่มีแพ็กเกจ — เพิ่มในส่วนแพ็กเกจก่อน'); return; }
  grantPremium(u, plan, 'manual');
  renderAdmin();
}
function revokePrem(uid){
  const u = USERS.find(function(x){ return x.id === uid; });
  if(!u) return;
  revokePremium(u);
  renderAdmin();
}

/* ==========================================================================
   为什么中文 · เหรียญ為錢 (Weiqian) — สกุลเงินสำหรับซื้อไอเทมพิเศษ
   แพ็กเหรียญ: ฿35 → 50 · ฿50 → 75 · ฿99 → 150 · ฿199 → 320 (ยิ่งแพ็กใหญ่ยิ่งคุ้ม)
   เหรียญสีทอง-เหลือง มีอักษร "為" ตรงกลาง
   ========================================================================== */
const COIN_PACKS = [
  {id:'c35',  baht:35,  coins:50,  label:'เริ่มต้น'},
  {id:'c50',  baht:50,  coins:75,  label:'ยอดนิยม', popular:true},
  {id:'c99',  baht:99,  coins:150, label:'คุ้มค่า'},
  {id:'c199', baht:199, coins:320, label:'คุ้มที่สุด'}
];
function coinPackById(id){ return COIN_PACKS.find(p => p.id === id) || null; }
function weiqianOf(u){ u = u || currentUser(); return u ? Math.max(0, +u.weiqian || 0) : 0; }
function coinHTML(size){
  return '<span class="wq-coin' + (size ? ' ' + size : '') + '"><i>為</i></span>';
}
function addWeiqian(u, n, note){
  u = u || currentUser();
  if(!u || !(+n > 0)) return;
  u.weiqian = Math.max(0, +u.weiqian || 0) + Math.round(+n);
  (u.wqLog = u.wqLog || []).unshift({n: Math.round(+n), note: note || '', ts: Date.now()});
  if(u.wqLog.length > 40) u.wqLog.length = 40;
  saveUsers();
}
function spendWeiqian(u, n){
  u = u || currentUser();
  if(!u) return false;
  if(weiqianOf(u) < n) return false;
  u.weiqian = weiqianOf(u) - n;
  (u.wqLog = u.wqLog || []).unshift({n: -n, note: 'ซื้อไอเทม', ts: Date.now()});
  if(u.wqLog.length > 40) u.wqLog.length = 40;
  saveUsers();
  return true;
}
/* สร้าง QR PromptPay สำหรับแพ็กเหรียญ */
function coinPayQR(pack){
  const S = (DB.settings && DB.settings.premium) || {};
  const ref = 'WEIQIAN-' + (currentUser() ? (currentUser().email || currentUser().name) : 'guest') + '-' + pack.id;
  return promptpayPayload(S.ppId, pack.baht, S.ppName, ref);
}
/* ร้านเหรียญ — แสดงในหน้าร้านค้า */
function renderCoinShop(){
  const u = currentUser();
  const S = (DB.settings && DB.settings.premium) || {};
  return `
    <div class="sec-head reveal" style="margin:36px auto 20px;text-align:center">
      <div class="kicker">Weiqian · 為錢</div>
      <h2>${coinHTML('lg')} เหรียญ為錢</h2>
      <p>สกุลเงินพิเศษสำหรับปลดล็อกไอเทมพรีเมียม เช่น ธีมเทอร์มินัล 8-bit สัตว์น่ารัก และธีมไลต์โหมด — ใช้ได้ตลอดชีพ</p>
    </div>
    ${u ? `
    <div class="wq-balance">
      ${coinHTML('lg')}
      <div><b>ยอดเหรียญของคุณ: ${weiqianOf(u).toLocaleString()} 為錢</b><span>ซื้อแพ็กเหรียญด้านล่างเพื่อเติมเงิน — เหรียญไม่มีวันหมดอายุ</span></div>
    </div>` : `
    <div class="wq-balance warn">
      <div><b>เข้าสู่ระบบก่อนซื้อเหรียญ</b><span>เหรียญจะถูกเก็บไว้ในบัญชีของคุณ</span></div>
      <button class="btn btn-primary btn-sm" onclick="go('login')">${ICON('user')} เข้าสู่ระบบ</button>
    </div>`}
    <div class="coin-packs">
      ${COIN_PACKS.map(p => `
        <div class="coin-pack ${p.popular?'pop':''} reveal" onclick="buyCoinPack('${p.id}')">
          ${p.popular?'<span class="pop-tag">คุ้มที่สุด</span>':''}
          <div class="cp-coins">${coinHTML('md')}${coinHTML('md')}${coinHTML('md')}</div>
          <b class="cp-n">${p.coins.toLocaleString()} 為錢</b>
          <span class="cp-label">${esc(p.label)}</span>
          <div class="cp-price">฿${p.baht}</div>
          <div class="cp-rate">≈ ${(p.baht/p.coins).toFixed(2)} บาท/เหรียญ</div>
        </div>`).join('')}
    </div>
    <p style="text-align:center;font-size:12px;color:var(--text-3);margin-top:14px">
      ชำระด้วย PromptPay / โอนธนาคาร แล้วส่งหลักฐานให้แอดมิน — ระบบจะเติมเหรียญให้ภายใน 24 ชั่วโมง
      (หรือติดต่อแอดมินเพื่อรับรหัสเติมเหรียญ)
    </p>`;
}
function buyCoinPack(id){
  const pack = coinPackById(id);
  if(!pack) return;
  const u = currentUser();
  if(!u){ toast('เข้าสู่ระบบก่อนซื้อเหรียญ'); go('login'); return; }
  const S = (DB.settings && DB.settings.premium) || {};
  const pp = coinPayQR(pack);
  glassPop({
    icon: 'coins',
    title: 'ซื้อแพ็ก ' + pack.coins.toLocaleString() + ' 為錢 — ฿' + pack.baht,
    body: `
      <p style="margin:0 0 12px;font-size:13.5px;color:var(--text-2);text-align:center">
        สแกนจ่ายด้วยแอปธนาคาร (PromptPay) ยอด <b style="font-family:var(--ff-num);color:var(--red);font-size:18px">฿${pack.baht}</b><br>
        หลังชำระแล้วแจ้งหลักฐานให้แอดมิน พร้อมอีเมล <b>${esc(u.email || u.name)}</b>
      </p>
      ${S.ppId ? `
        <div class="qr-box" style="margin:0 auto">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pp)}" alt="QR">
          <span>พร้อมเพย์ · ${esc(S.ppName||'')}</span>
        </div>
        <div class="field" style="text-align:left;margin-top:12px">
          <label>โค้ดชำระเงิน</label>
          <input readonly value="${esc(pp)}" onclick="this.select()">
        </div>`
      : '<div class="empty">แอดมินยังไม่ได้ตั้งเลขพร้อมเพย์ — ติดต่อแอดมินโดยตรง</div>'}
      <p style="font-size:11.5px;color:var(--text-3);margin-top:10px;text-align:center">อ้างอิง: ${esc(pack.id)} · เหรียญจะถูกเติมเข้าบัญชีหลังแอดมินยืนยัน</p>`,
    actions: [{label:'ปิด', cls:'btn-ghost', fn: closeGlassPop}]
  });
}
