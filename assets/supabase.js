/* ==========================================================================
   为什么中文 · Supabase realtime layer (เปิดใช้เมื่อตั้งค่า WC_SUPABASE ครบ)
   - Auth: สมัคร/เข้าสู่ระบบด้วยอีเมล+รหัสผ่านบนคลาวด์
   - Realtime: site_config (feature toggles) → อัปเดตทุกเบราว์เซอร์ทันที
   - Profiles: โปรไฟล์/แต้ม/เหรียญ/พรีเมียม sync กับคลาวด์ (แอดมินจัดการจากไหนก็ได้)
   ========================================================================== */
'use strict';

let SB = null;
let SB_ADMIN = false;
let SB_PROFILE_ID = null;
let SB_LISTENERS = false;
let SB_PUSH_TIMER = null;

function sbConfigured(){
  return !!(window.WC_SUPABASE && window.WC_SUPABASE.url && window.WC_SUPABASE.anonKey);
}
function sbReady(){ return !!SB; }
function sbAdmin(){ return SB_ADMIN; }

/* โหลด supabase-js (ESM จาก CDN) — ครั้งเดียว */
let SB_LOADING = null;
function sbInit(){
  if(SB) return Promise.resolve(SB);
  if(!sbConfigured()) return Promise.resolve(null);
  if(SB_LOADING) return SB_LOADING;
  SB_LOADING = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    .then(function(mod){
      const c = mod.createClient(window.WC_SUPABASE.url, window.WC_SUPABASE.anonKey);
      SB = c;
      sbSetupRealtime(c);
      return c;
    })
    .catch(function(e){ console.warn('supabase load fail', e); return null; });
  return SB_LOADING;
}

/* ---- Realtime: ตั้งค่าเว็บ (feature toggles) ---- */
function sbSetupRealtime(c){
  if(SB_LISTENERS) return;
  SB_LISTENERS = true;
  c.channel('wc-config')
    .on('postgres_changes', {event:'*', schema:'public', table:'site_config'}, function(payload){
      try{
        const key = payload.new && payload.new.key;
        const value = payload.new ? payload.new.value : null;
        if(!key) return;
        if(key === 'features'){
          DB.features = value && typeof value === 'object' ? value : {};
          toast('⚡ ผู้ดูแลเว็บอัปเดตการตั้งค่าฟีเจอร์แล้ว');
        } else if(key === 'itemCfg'){
          DB.itemCfg = value && typeof value === 'object' ? value : {articles:{}, games:{}};
          toast('⚡ ผู้ดูแลเว็บอัปเดตการตั้งค่าเนื้อหาแล้ว');
        }
        /* รีเรนเดอร์หน้าปัจจุบัน */
        try{
          if(typeof renderRoute === 'function') renderRoute();
        }catch(e){}
      }catch(e){}
    })
    .subscribe();
  /* โหลดค่าเริ่มต้นจากคลาวด์ */
  c.from('site_config').select('key,value').then(function(res){
    if(res.error) return;
    (res.data||[]).forEach(function(row){
      if(row.key === 'features') DB.features = row.value && typeof row.value === 'object' ? row.value : DB.features || {};
      if(row.key === 'itemCfg') DB.itemCfg = row.value && typeof row.value === 'object' ? row.value : DB.itemCfg || {articles:{}, games:{}};
    });
  });
}

/* ---- ตั้งค่าฟีเจอร์จากแอดมิน → เขียนคลาวด์ (เรียลไทม์) + ท้องถิ่น ---- */
function sbPushConfig(key, value){
  if(!SB) return;
  SB.from('site_config').upsert({key: key, value: value, updated_at: new Date().toISOString()})
    .then(function(r){ if(r.error) console.warn('sb config push', r.error); });
}

/* ---- Auth ---- */
async function sbSignUp(email, pwd, meta){
  await sbInit(); if(!SB) return {error:{message:'supabase ยังไม่ถูกตั้งค่า'}};
  return SB.auth.signUp({email: email, password: pwd, options:{data: meta||{}}});
}
async function sbSignIn(email, pwd){
  await sbInit(); if(!SB) return {error:{message:'supabase ยังไม่ถูกตั้งค่า'}};
  return SB.auth.signInWithPassword({email: email, password: pwd});
}
async function sbSignOut(){ if(SB) await SB.auth.signOut(); SB_PROFILE_ID = null; }
async function sbSession(){
  await sbInit(); if(!SB) return null;
  const r = await SB.auth.getSession();
  return r && r.data ? r.data.session : null;
}
async function sbLoadProfile(){
  if(!SB) return null;
  const s = await SB.auth.getSession();
  if(!s || !s.data.session) return null;
  const uid = s.data.session.user.id;
  SB_PROFILE_ID = uid;
  const r = await SB.from('profiles').select('*').eq('id', uid).maybeSingle();
  if(r.error){ console.warn('sb profile', r.error); return null; }
  if(!r.data){
    /* สร้างโปรไฟล์ให้ */
    const u = currentUser();
    await SB.from('profiles').insert({id: uid, email: s.data.session.user.email, name: (u&&u.name)||'ผู้เรียน'});
    const r2 = await SB.from('profiles').select('*').eq('id', uid).maybeSingle();
    return r2.data;
  }
  SB_ADMIN = !!(r.data && r.data.is_admin);
  return r.data;
}
async function sbPushProfile(u){
  if(!SB || !SB_PROFILE_ID || !u) return;
  const row = {
    name: u.name, avatar: u.avatar, xp: +u.xp||0, points: +u.points||0, hp: +u.hp||5,
    streak: +u.streak||0, weiqian: +u.weiqian||0, tythemes: u.tyThemes||[],
    typing_stage: (u.typing&&u.typing.stage)||0, typing_stars: u.typingStars||{},
    premium_plan: u.premium ? u.premium.plan : null,
    premium_until: u.premium ? String(u.premium.until) : null,
    progress: {read: u.read||[], gameStars: u.gameStars||{}, exams: u.exams||{}, curriculum: u.curriculum||null, plan: u.profile||null, planDone: null},
    updated_at: new Date().toISOString()
  };
  const r = await SB.from('profiles').update(row).eq('id', SB_PROFILE_ID);
  if(r.error) console.warn('sb push profile', r.error);
}
/* ดีบาวน์ push โปรไฟล์ (ทุกครั้งที่บันทึกผู้ใช้) */
function sbScheduleProfilePush(){
  if(!SB || !SB_PROFILE_ID) return;
  if(SB_PUSH_TIMER) clearTimeout(SB_PUSH_TIMER);
  SB_PUSH_TIMER = setTimeout(function(){
    try{ sbPushProfile(currentUser()); }catch(e){}
  }, 1200);
}
/* ตั้งค่าผู้ใช้จากคลาวด์ (พรีเมียม/เหรียญ/ความคืบหน้า) */
function sbApplyProfile(u, p){
  if(!u || !p) return;
  u.name = p.name || u.name;
  u.avatar = p.avatar || u.avatar;
  u.xp = +p.xp||0; u.points = +p.points||0; u.hp = +p.hp||5; u.streak = +p.streak||0;
  u.weiqian = +p.weiqian||0;
  u.tyThemes = Array.isArray(p.tythemes) ? p.tythemes : u.tyThemes;
  u.typing = u.typing || {stage:0, best:{}};
  u.typing.stage = +p.typing_stage||0;
  u.typingStars = (p.typing_stars && typeof p.typing_stars === 'object') ? p.typing_stars : {};
  if(p.premium_plan){ u.premium = {plan: p.premium_plan, until: p.premium_until === 'forever' ? 'forever' : +p.premium_until, source:'cloud', ts: Date.now()}; }
  else u.premium = null;
  if(p.progress && typeof p.progress === 'object'){
    if(Array.isArray(p.progress.read)) u.read = p.progress.read;
    if(p.progress.gameStars && typeof p.progress.gameStars === 'object') u.gameStars = p.progress.gameStars;
    if(p.progress.exams && typeof p.progress.exams === 'object') u.exams = p.progress.exams;
    if(p.progress.curriculum) u.curriculum = p.progress.curriculum;
    if(p.progress.plan) u.profile = p.progress.plan;
  }
  saveUsers();
}
/* ---- แอดมิน: รายชื่อผู้ใช้บนคลาวด์ (ผู้ใช้ในเครื่องนี้ทั้งหมด) ---- */
async function sbListProfiles(){
  await sbInit(); if(!SB) return [];
  const r = await SB.from('profiles').select('*').order('created_at', {ascending:false}).limit(200);
  return r.error ? [] : (r.data||[]);
}
async function sbGrantPremium(email, plan, months){
  await sbInit(); if(!SB) return false;
  const r = await SB.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if(r.error || !r.data) return false;
  const until = String(Date.now() + months*30*864e5);
  await SB.from('profiles').update({premium_plan: plan, premium_until: until}).eq('id', r.data.id);
  return true;
}
async function sbGrantCoins(email, n){
  await sbInit(); if(!SB) return false;
  const r = await SB.from('profiles').select('id, weiqian').eq('email', email.toLowerCase()).maybeSingle();
  if(r.error || !r.data) return false;
  await SB.from('profiles').update({weiqian: (+r.data.weiqian||0) + n}).eq('id', r.data.id);
  return true;
}
/* ตรวจแอดมิน (หลังล็อกอินคลาวด์) */
async function sbCheckAdmin(){
  if(!SB) return false;
  const s = await SB.auth.getSession();
  if(!s || !s.data.session) return false;
  const r = await SB.from('profiles').select('is_admin').eq('id', s.data.session.user.id).maybeSingle();
  SB_ADMIN = !!(r.data && r.data.is_admin);
  return SB_ADMIN;
}
