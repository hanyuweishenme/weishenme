/* ==========================================================================
   为什么中文 · Admin v2 — full content manager
   แก้ไขได้ทุกส่วน: บทความ · คำศัพท์ HSK · หมวดคำศัพท์ · เกม 6 ชนิด
   ผู้ใช้ · สินค้า · แบรนด์/โลโก้/แบนเนอร์ · ข้อมูลติดต่อ · โซเชียล · ตั้งค่า
   ========================================================================== */
'use strict';

var adminTab = 'dash';
var adminIn = sessionStorage.getItem('wszw_admin') === '1';
var activeLv = 1;
var editState = {article:null, vocab:null, cat:null, catWord:false, game:null, gameQ:null, product:null};
var adminSearch = {art:'', vocab:'', cat:'', game:'', prod:''};
var pendingImages = {};
var pendingCatIcon = '📌';
var pendingProdIcon = '📦';
var pendingSoldOut = false;
var pendingFormLevel = null;
var catState = {id:null, lv:1, editLevel:false, newName:''};
var blogState = {id:null, filterTag:''};
var adminPickAvatar = null;

/* ปลอดภัยเสมอ: คืนอาร์เรย์คำศัพท์ของระดับนั้น ๆ (สร้างให้ถ้ายังไม่มี) */
function hskList(lv){
  lv = String(lv);
  if(!DB.hsk || typeof DB.hsk !== 'object') DB.hsk = {};
  if(!Array.isArray(DB.hsk[lv])) DB.hsk[lv] = [];
  return DB.hsk[lv];
}

var CAT_ICONS = ['📌','💬','🏠','🍜','🥢','🚄','✈️','🚌','💼','📚','🎓','🌿','☀️','💗','😊','🛒','💰','📱','💻','🏮','🎋','🐉','🎵','⚽','🏥','🧧','🀄'];

/* ==========================================================================
   AUTH
   ========================================================================== */
function renderAdmin(){
  if(typeof ensureData === 'function') ensureData();
  var root = $('#adminRoot'); if(!root) return;
  if(!adminIn){ root.innerHTML = adminLoginView(); return; }
  root.innerHTML = ''
    + '<div class="admin-shell">'
    + '  <div class="admin-head">'
    + '    <div class="t"><h2>' + ICON('settings') + ' ระบบจัดการหลังบ้าน · 管理中心</h2>'
    + '      <p>แก้ไขได้ทุกส่วนของเว็บ — บทความ คำศัพท์ หมวด เกม สินค้า แบรนด์ และช่องทางติดต่อ</p></div>'
    + '    <div class="acts">'
    + '      <button class="btn btn-ghost btn-sm" onclick="go(\'home\')">ดูหน้าเว็บ</button>'
    + '      <button class="btn btn-ghost btn-sm" onclick="adminLogout()">ออกจากหลังบ้าน</button>'
    + '    </div>'
    + '  </div>'
    + '  <div class="admin-nav">' + adminTabs().map(function(t){
          return '<button class="admin-tab ' + (adminTab===t.id?'active':'') + '" onclick="switchAdmin(\'' + t.id + '\')">'
            + ICON(t.ic) + ' ' + t.name + (t.count!=null ? '<span class="n">'+t.count+'</span>' : '') + '</button>';
        }).join('') + '</div>'
    + '  <div id="adminBody"></div>'
    + '</div>';
  renderAdminBody();
}
function adminTabs(){
  var nVocab = 0; for(var i=1;i<=6;i++) nVocab += hskList(i).length;
  var nGame = 0; Object.keys(DB.games||{}).forEach(function(k){ nGame += (DB.games[k]||[]).length; });
  var nPending = 0;
  try{ nPending = (store.get('payreqs', []) || []).filter(function(r){ return r.status === 'pending'; }).length; }catch(e){}
  return [
    {id:'dash',    ic:'bar-chart', name:'ภาพรวม'},
    {id:'article', ic:'book-open', name:'บทความ',     count:allArticles().length},
    {id:'vocab',   ic:'layers', name:'คำศัพท์ HSK', count:nVocab},
    {id:'cat',     ic:'folder', name:'หมวดคำศัพท์', count:Object.keys(DB.cats||{}).length},
    {id:'game',    ic:'gamepad', name:'เกม',         count:nGame},
    {id:'gamecats', ic:'folder', name:'หมวดหมู่เกม', count:(DB.gameCats||[]).length},
    {id:'payment', ic:'wallet', name:'การชำระเงิน', count:nPending},
    {id:'features', ic:'toggle', name:'เปิด/ปิดฟีเจอร์'},
    {id:'prod',    ic:'shopping-bag', name:'สินค้า',       count:(DB.products||[]).length},
    {id:'brand',   ic:'image', name:'แบรนด์ & โลโก้'},
    {id:'theme',   ic:'palette', name:'สี & ธีม'},
    {id:'daily',   ic:'calendar', name:'คำประจำวัน'},
    {id:'pages',   ic:'file-text', name:'หน้าเว็บ' + (allPages().length ? ' (' + allPages().length + ')' : '')},
    {id:'nav',     ic:'compass', name:'ลำดับเมนู', count:(DB.nav||[]).length},
    {id:'export',  ic:'package', name:'ส่งออกเว็บ'},
    {id:'blog',    ic:'pen-line', name:'บล็อก',      count:(DB.blog||[]).filter(function(p){return !p.__deleted;}).length},
    {id:'social',  ic:'link', name:'โซเชียล'},
    {id:'contact', ic:'phone', name:'ช่องทางติดต่อ'},
    {id:'user',    ic:'users', name:'ผู้ใช้',       count:USERS.length},
    {id:'set',     ic:'settings', name:'ตั้งค่า'}
  ];
}
function adminAuth(){
  const a = DB.auth || {};
  return {email: String(a.email || a.user || 'admin'), pwd: String(a.pwd || 'admin123')};
}
function adminLoginView(){
  return ''
    + '<div class="login-hero">'
    + '  <div class="shield">🔐</div>'
    + '  <h2>ระบบจัดการหลังบ้าน</h2>'
    + '  <p class="sub">เฉพาะผู้ดูแลเว็บเท่านั้น — เข้าสู่ระบบด้วยอีเมลและรหัสผ่านผู้ดูแล</p>'
    + '  <div class="field"><label>อีเมลผู้ดูแล</label>'
    + '    <input id="adm-user" autocomplete="off" type="email" placeholder="admin@example.com" onkeydown="if(event.key===\'Enter\')doAdminLogin()"></div>'
    + '  <div class="field"><label>รหัสผ่าน</label>'
    + '    <input type="password" id="adm-pwd" autocomplete="off" placeholder="รหัสผ่าน" onkeydown="if(event.key===\'Enter\')doAdminLogin()"></div>'
    + '  <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="doAdminLogin()">เข้าสู่ระบบผู้ดูแล</button>'
    + '  <p class="lock-note">🔒 พื้นที่หวงห้าม — เฉพาะผู้ดูแลเว็บเท่านั้น</p>'
    + '</div>';
}
function doAdminLogin(){
  var u = ($('#adm-user') && $('#adm-user').value || '').trim().toLowerCase();
  var p = ($('#adm-pwd') && $('#adm-pwd').value) || '';
  var auth = adminAuth();
  if(u === auth.email.toLowerCase() && p === auth.pwd){
    adminIn = true;
    sessionStorage.setItem('wszw_admin','1');
    toast('เข้าสู่ระบบผู้ดูแลแล้ว');
    renderAdmin();
    renderNavMenu();
  } else if(typeof sbConfigured === 'function' && sbConfigured()){
    /* ล็อกอินคลาวด์ (Supabase) — แอดมินคือผู้ใช้ที่ is_admin = true */
    sbSignIn(u, p).then(function(res){
      if(res && res.error){ toast('คลาวด์: ' + (res.error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')); return; }
      sbCheckAdmin().then(function(isAdm){
        if(isAdm){
          adminIn = true;
          sessionStorage.setItem('wszw_admin','1');
          toast('เข้าสู่ระบบผู้ดูแลแล้ว (คลาวด์)');
          renderAdmin(); renderNavMenu();
        } else {
          toast('บัญชีนี้ไม่ใช่ผู้ดูแล');
        }
      });
    });
  } else {
    toast('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    if($('#adm-pwd')) $('#adm-pwd').value = '';
  }
}
function adminLogout(){
  adminIn = false;
  sessionStorage.removeItem('wszw_admin');
  toast('ออกจากหลังบ้านแล้ว');
  renderAdmin();
  if(typeof renderNavMenu === 'function') renderNavMenu();
}
function switchAdmin(tab){
  adminTab = tab;
  editState = {article:null, vocab:null, cat:null, catWord:false, game:null, gameQ:null, product:null};
  renderAdmin();
}
function renderAdminBody(){
  var b = $('#adminBody'); if(!b) return;
  var view = {
    dash: adminDash, article: adminArticles, vocab: adminVocab, cat: adminCats,
    game: adminGames, gamecats: adminGameCats, features: adminFeatures, prod: adminProducts, brand: adminBrand,
    theme: adminTheme, daily: adminDaily, pages: adminPages, blog: adminBlog, nav: adminNav, export: adminExport,
    contact: adminContact, social: adminSocial, user: adminUsers, set: adminSettings,
    payment: adminPayment
  }[adminTab] || adminDash;
  b.innerHTML = view();
}

/* ==========================================================================
   IMAGE UPLOAD (stored as data URLs)
   ========================================================================== */
function readImageFile(input, cb, maxW){
  var f = input.files && input.files[0];
  if(!f) return;
  if(!/^image\//.test(f.type)){ toast('กรุณาเลือกไฟล์รูปภาพ'); return; }
  if(f.size > 8*1024*1024){ toast('ไฟล์ใหญ่เกิน 8MB'); return; }
  var fr = new FileReader();
  fr.onload = function(){
    var img = new Image();
    img.onload = function(){
      var W = maxW || 900;
      var scale = Math.min(1, W / img.width);
      var cv = document.createElement('canvas');
      cv.width = Math.round(img.width*scale);
      cv.height = Math.round(img.height*scale);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      var out = cv.toDataURL('image/jpeg', .86);
      if(out.length > 480000) out = cv.toDataURL('image/jpeg', .7);
      if(out.length > 480000) out = cv.toDataURL('image/jpeg', .55);
      cb(out);
    };
    img.onerror = function(){ toast('อ่านไฟล์รูปไม่ได้'); };
    img.src = fr.result;
  };
  fr.readAsDataURL(f);
}
function uploadBox(id, current, maxW, wide){
  return ''
    + '<div class="img-drop">'
    + '  <input type="file" accept="image/*" onchange="onPickImage(this,\'' + id + '\',' + (maxW||900) + ',' + (wide?1:0) + ')">'
    + '  <span class="ic">🖼️</span><b>คลิกเพื่ออัปโหลดรูป</b>'
    + '  <span>PNG / JPG — ระบบย่อขนาดให้อัตโนมัติ</span>'
    + '</div>'
    + '<div id="' + id + '_prev">' + (current ? '<img class="img-prev ' + (wide?'wide':'') + '" src="' + current + '">' : '') + '</div>'
    + (current ? '<button class="mini-btn ghost" style="margin-top:9px" onclick="clearImage(\'' + id + '\')">🗑 ลบรูปนี้</button>' : '');
}
function onPickImage(input, key, maxW, wide){
  readImageFile(input, function(data){
    /* รูปในเพจบิลเดอร์: บันทึกลงบล็อกทันที */
    if(key.indexOf('pbImg_') === 0){
      var blockId = key.slice(6);
      var page = getPage(pbState.pageId);
      if(page){
        var b = (page.blocks||[]).filter(function(x){ return x.id === blockId; })[0];
        if(b){ b.src = data; store.set('pages', DB.pages); }
      }
      var pv = $('#'+key+'_prev');
      if(pv) pv.innerHTML = '<img class="img-prev wide" src="' + data + '">';
      toast('ใส่รูปในบล็อกแล้ว ✓');
      return;
    }
    pendingImages[key] = data;
    var prev = $('#'+key+'_prev');
    if(prev) prev.innerHTML = '<img class="img-prev ' + (wide?'wide':'') + '" src="' + data + '">';
    toast('อัปโหลดรูปแล้ว — อย่าลืมกดบันทึก');
  }, maxW);
}
function clearImage(key){
  pendingImages[key] = '__CLEAR__';
  var prev = $('#'+key+'_prev'); if(prev) prev.innerHTML = '';
  toast('จะลบรูปเมื่อกดบันทึก');
}
function takeImage(key, fallback){
  var v = pendingImages[key];
  if(v === '__CLEAR__'){ delete pendingImages[key]; return ''; }
  if(v){ delete pendingImages[key]; return v; }
  return fallback;
}

/* ==========================================================================
   DASHBOARD
   ========================================================================== */
function adminDash(){
  if(typeof ensureData === 'function') ensureData();
  var nVocab = 0; for(var i=1;i<=6;i++) nVocab += hskList(i).length;
  var nCats = Object.keys(DB.cats||{}).length;
  var catWords = 0; Object.values(DB.cats||{}).forEach(function(a){ catWords += a.length; });
  var nGame = 0; var perGame = {};
  Object.keys(DB.games||{}).forEach(function(k){ perGame[k] = (DB.games[k]||[]).length; nGame += perGame[k]; });
  var size = 0;
  try{ for(var k in localStorage){ if(k.indexOf('wszw_')===0) size += (localStorage[k]||'').length; } size = Math.round(size/1024); }catch(e){}

  return ''
    + '<div class="panel"><h3>ภาพรวมเนื้อหาทั้งเว็บ</h3>'
    + '<div class="stat-grid" style="margin-bottom:6px">'
    +   '<div class="stat-card"><div class="ic">📖</div><b>' + allArticles().length + '</b><span>บทความ</span></div>'
    +   '<div class="stat-card"><div class="ic">🎯</div><b>' + nVocab.toLocaleString() + '</b><span>คำศัพท์ HSK</span></div>'
    +   '<div class="stat-card"><div class="ic">🗂️</div><b>' + nCats + '</b><span>หมวด (' + catWords + ' คำ)</span></div>'
    +   '<div class="stat-card"><div class="ic">🎮</div><b>' + nGame + '</b><span>คำถามในเกม</span></div>'
    +   '<div class="stat-card"><div class="ic">🛍️</div><b>' + (DB.products||[]).length + '</b><span>สินค้า</span></div>'
    +   '<div class="stat-card"><div class="ic">👤</div><b>' + USERS.length + '</b><span>ผู้ใช้ในเครื่องนี้</span></div>'
    + '</div>'
    + '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:18px">'
    +   '<span class="stat-pill">💾 ข้อมูลในเครื่อง <b>' + size + ' KB</b> / โควตาราว 5,000 KB</span>'
    +   '<span class="stat-pill">📄 หน้าเว็บที่สร้างเอง <b>' + allPages().length + '</b></span>'
    +   '<span class="stat-pill">🔤 อักษรจีน <b>3,000</b></span>'
    +   '<span class="stat-pill">📞 ช่องทางติดต่อ <b>' + (DB.settings.contact||[]).filter(function(c){return c.value;}).length + '</b></span>'
    +   '<span class="stat-pill">🌐 โซเชียลที่เปิด <b>' + Object.values(DB.settings.social||{}).filter(function(s){return s.on;}).length + '</b></span>'
    + '</div></div>'
    + '<div class="panel"><h3>คำถามในแต่ละเกม</h3>'
    + GAME_DEFS.map(function(d){
        var lvCount = {};
        (DB.games[d.id]||[]).forEach(function(q){ lvCount[q.lv||1] = (lvCount[q.lv||1]||0)+1; });
        var lvTxt = [1,2,3,4,5,6].map(function(i){ return 'ด่าน '+i+': '+(lvCount[i]||0); }).join(' · ');
        return '<div class="row-card"><div class="top"><div class="txt"><b>' + ICON(d.ic) + ' ' + d.name + '</b><small>' + lvTxt + '</small></div>'
          + '<div class="acts"><button class="icon-btn ok" title="จัดการ" onclick="adminTab=\'game\';editState.game=\'' + d.id + '\';editState.gameQ=null;renderAdmin()">✏️</button></div>'
          + '</div></div>';
      }).join('')
    + '</div>'
    + '<div class="panel"><h3>ทางลัด</h3><div style="display:flex;gap:10px;flex-wrap:wrap">'
    +   '<button class="mini-btn" onclick="switchAdmin(\'article\')">+ เพิ่มบทความ</button>'
    +   '<button class="mini-btn" onclick="switchAdmin(\'vocab\')">+ เพิ่มคำศัพท์</button>'
    +   '<button class="mini-btn" onclick="switchAdmin(\'cat\')">+ สร้างหมวดใหม่</button>'
    +   '<button class="mini-btn" onclick="switchAdmin(\'game\')">+ เพิ่มคำถามเกม</button>'
    +   '<button class="mini-btn" onclick="switchAdmin(\'prod\')">+ เพิ่มสินค้า</button>'
    +   '<button class="mini-btn ghost" onclick="switchAdmin(\'brand\')">🖼️ เปลี่ยนโลโก้ / แบนเนอร์</button>'
    + '</div></div>';
}

/* ==========================================================================
   ARTICLES
   ========================================================================== */
function adminArticles(){
  var list = allArticles();
  var q = adminSearch.art.toLowerCase();
  var shown = q ? list.filter(function(a){ return ((a.title||'')+(a.tag||'')+(a.zh||'')+(a.th||'')).toLowerCase().indexOf(q)>-1; }) : list;
  var tags = Array.from(new Set(list.map(function(a){return a.tag;}).filter(Boolean)));
  var e = editState.article;

  return ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>บทความทั้งหมด (' + list.length + ')</h3>'
    +   '<button class="mini-btn" onclick="newArticle()">+ เขียนบทความใหม่</button></div>'
    + (e!==null && e!==undefined ? articleForm(typeof e==='object'?e:list[+e], typeof e==='object'?null:+e) : '')
    + '<div class="toolbar">'
    +   '<input class="search-in" placeholder="🔍 ค้นหาบทความ" value="' + esc(adminSearch.art) + '" data-search="art" oninput="onAdminSearch(this,\'art\')">'
    +   '<span class="stat-pill">หมวดทั้งหมด <b>' + tags.length + '</b></span>'
    +   '<button class="mini-btn ghost" onclick="exportData(\'articles\')">⬇ สำรองข้อมูล</button>'
    + '</div><div>'
    + shown.map(function(a){
        var realIdx = list.indexOf(a);
        return '<div class="row-card" id="artrow-' + realIdx + '">'
          + '<div class="top"><div class="txt">'
          +   '<b><span class="cn">' + esc(a.title) + '</span></b>'
          +   '<small>' + esc(a.tag||'—') + ' · HSK ' + (a.level||1) + ' · ' + (a.zh||'').length + ' ตัวอักษร · ' + (a.words||[]).length + ' คำศัพท์</small>'
          + '</div><div class="acts">'
          +   '<button class="icon-btn" title="ดูเนื้อหา" onclick="toggleRow(\'artrow-' + realIdx + '\')">👁</button>'
          +   '<button class="icon-btn ok" title="แก้ไข" onclick="editArticle(' + realIdx + ')">✏️</button>'
          +   '<button class="icon-btn warn" title="ทำสำเนา" onclick="dupArticle(' + realIdx + ')">⧉</button>'
          +   '<button class="icon-btn" title="ลบ" onclick="delArticle(' + realIdx + ')">🗑</button>'
          + '</div></div>'
          + '<div class="sub"><b>จีน:</b> ' + esc((a.zh||'').split('\n').join(' / '))
          +   '<br><b>พินอิน:</b> ' + esc((a.py||'').split('\n').join(' / '))
          +   '<br><b>ไทย:</b> ' + esc((a.th||'').split('\n').join(' / ')) + '</div></div>';
      }).join('') || '<div class="empty">ไม่พบบทความ</div>'
    + '</div></div>';
}
function articleForm(a, idx){
  var isNew = idx === null;
  a = a || {id:'', title:'', tag:'', level:1, zh:'', py:'', th:'', words:[]};
  var tags = Array.from(new Set(allArticles().map(function(x){return x.tag;}).filter(Boolean)));
  return ''
    + '<div class="edit-form open">'
    + '<h4>' + (isNew?'เขียนบทความใหม่':'แก้ไขบทความ: '+esc(a.title||'')) + '</h4>'
    + '<div class="grid2">'
    +   '<div class="field"><label>หัวข้อ (ไทย)</label><input id="f-a-title" value="' + esc(a.title) + '" placeholder="เช่น การทักทายครั้งแรก"></div>'
    +   '<div class="field"><label>หมวด</label><input id="f-a-tag" value="' + esc(a.tag) + '" list="taglist" placeholder="พิมพ์หมวดใหม่ หรือเลือกจากรายการ">'
    +     '<datalist id="taglist">' + tags.map(function(t){return '<option value="'+esc(t)+'">';}).join('') + '</datalist></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ระดับ HSK</label><select id="f-a-level">'
    +     [1,2,3,4,5,6].map(function(n){ return '<option value="'+n+'" '+((+a.level||1)===n?'selected':'')+'>HSK '+n+'</option>'; }).join('')
    +   '</select></div>'
    +   '<div class="field"><label>เวลาในการอ่าน (นาที)</label><input id="f-a-min" type="number" min="1" max="30" value="' + (a.min||2) + '"></div>'
    + '</div>'
    + '<div class="field"><label>เนื้อหาภาษาจีน (ขึ้นบรรทัดใหม่ได้)</label><textarea id="f-a-zh" style="min-height:110px" placeholder="你好！我叫阿明。">' + esc(a.zh) + '</textarea></div>'
    + '<div class="field"><label>พินอิน</label><textarea id="f-a-py" placeholder="Nǐ hǎo! Wǒ jiào Āmíng.">' + esc(a.py||'') + '</textarea></div>'
    + '<div class="field"><label>คำแปลไทย</label><textarea id="f-a-th" placeholder="สวัสดี! ฉันชื่ออามิง">' + esc(a.th||'') + '</textarea></div>'
    + '<div class="field"><label>คำศัพท์น่ารู้ — บรรทัดละคำ ในรูปแบบ <code>จีน | พินอิน | ไทย</code></label>'
    +   '<textarea id="f-a-words" placeholder="你好 | nǐ hǎo | สวัสดี">'
    +   (a.words||[]).map(function(w){ return Array.isArray(w) ? w.join(' | ') : [w.cn,w.py,w.th].join(' | '); }).join('\n')
    +   '</textarea><div class="hint">เว้นว่างได้ถ้าไม่ต้องการแสดงคำศัพท์ท้ายบท</div></div>'
    + '<div class="form-acts">'
    +   '<button class="mini-btn" onclick="saveArticle(' + (isNew?'null':idx) + ')">💾 บันทึกบทความ</button>'
    +   '<button class="mini-btn ghost" onclick="editState.article=null;renderAdminBody()">ยกเลิก</button>'
    + '</div></div>';
}
function newArticle(){ editState.article = {}; renderAdminBody(); setTimeout(function(){ if($('#f-a-title')) $('#f-a-title').focus(); },60); }
function editArticle(i){
  editState.article = i; renderAdminBody();
  setTimeout(function(){ if($('#f-a-title')) $('#f-a-title').focus(); window.scrollTo({top:200,behavior:'smooth'}); },60);
}
function readArticleForm(){
  var v = function(id){ return ($('#'+id) && $('#'+id).value) || ''; };
  var words = v('f-a-words').split('\n').map(function(l){return l.trim();}).filter(Boolean).map(function(l){
    var parts = l.split('|').map(function(x){return x.trim();});
    return [parts[0]||'', parts[1]||'', parts[2]||''];
  });
  return {
    title: v('f-a-title').trim(),
    tag: v('f-a-tag').trim() || 'บทความ',
    level: +v('f-a-level') || 1,
    min: Math.max(1, +v('f-a-min') || 2),
    zh: v('f-a-zh').trim(),
    py: v('f-a-py').trim(),
    th: v('f-a-th').trim(),
    words: words
  };
}
function saveArticle(idx){
  var data = readArticleForm();
  if(!data.title || !data.zh){ toast('ใส่หัวข้อและเนื้อหาจีนก่อนนะ'); return; }
  if(idx === null || idx === undefined){
    data.id = 'u' + Date.now().toString(36);
    DB.articles = (DB.articles || []).concat([data]);
  } else {
    var target = allArticles()[idx];
    var extra = DB.articles || [];
    var k = -1;
    for(var i=0;i<extra.length;i++) if(extra[i].id === target.id) k = i;
    data.id = target.id;
    if(k > -1) DB.articles[k] = data;
    else DB.articles = extra.concat([data]);
  }
  store.set('articles', DB.articles);
  editState.article = null;
  toast('บันทึกบทความแล้ว ✓');
  renderAdmin();
}
function dupArticle(i){
  var a = allArticles()[i];
  var copy = Object.assign({}, a, {id:'u'+Date.now().toString(36), title:(a.title||'')+' (สำเนา)'});
  DB.articles = (DB.articles || []).concat([copy]);
  store.set('articles', DB.articles);
  toast('ทำสำเนาแล้ว');
  renderAdmin();
}
function delArticle(i){
  var a = allArticles()[i]; if(!a) return;
  if(!confirm('ลบบทความ "' + a.title + '" ?')) return;
  var extra = DB.articles || [];
  var k = -1;
  for(var j=0;j<extra.length;j++) if(extra[j].id === a.id) k = j;
  if(k > -1){ extra.splice(k,1); store.set('articles', DB.articles); toast('ลบแล้ว'); }
  else {
    DB.articles = extra.concat([{id:a.id, __deleted:true}]);
    store.set('articles', DB.articles);
    toast('ซ่อนบทความมาตรฐานแล้ว');
  }
  renderAdmin();
}

/* ==========================================================================
   HSK VOCABULARY
   ========================================================================== */
function adminVocab(){
  var lvl = activeLv;
  var all = DB.hsk || {};
  var list = hskList(lvl);
  var q = adminSearch.vocab.toLowerCase();
  var filtered = q ? list.map(function(w,i){return {w:w,i:i};}).filter(function(x){
        return ((x.w.cn||'')+(x.w.py||'')+(x.w.th||'')+catLabel(x.w.cat||'')).toLowerCase().indexOf(q)>-1;
      }) : list.map(function(w,i){return {w:w,i:i};});
  var shown = filtered.slice(0, 250);
  var cats = Array.from(new Set(list.map(function(w){return catLabel(w.cat);}).filter(Boolean)));
  var e = editState.vocab;

  return ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>คำศัพท์ HSK</h3><button class="mini-btn" onclick="newVocab()">+ เพิ่มคำศัพท์</button></div>'
    + '<div class="toolbar"><div class="badge-pick">'
    +   [1,2,3,4,5,6].map(function(n){
          return '<button class="' + (lvl===n?'sel':'') + '" onclick="activeLv=' + n + ';editState.vocab=null;renderAdminBody()">HSK ' + n + ' <b style="opacity:.65">' + (hskList(n).length) + '</b></button>';
        }).join('')
    + '</div></div>'
    + (e!==null && e!==undefined ? vocabForm(typeof e==='object'?e:list[+e], typeof e==='object'?null:+e, lvl) : '')
    + '<div class="toolbar">'
    +   '<input class="search-in" placeholder="🔍 ค้นหาในระดับ HSK ' + lvl + '" value="' + esc(adminSearch.vocab) + '" data-search="vocab" oninput="onAdminSearch(this,\'vocab\')">'
    +   '<span class="stat-pill">หมวดในระดับนี้ <b>' + cats.length + '</b></span>'
    +   '<button class="mini-btn ghost" onclick="toggleBox(\'bulkBox\')">📥 นำเข้าหลายคำ</button>'
    +   '<button class="mini-btn ghost" onclick="exportData(\'hsk\')">⬇ สำรองข้อมูล</button>'
    + '</div>'
    + '<div class="edit-form" id="bulkBox"><h4>นำเข้าคำศัพท์หลายคำพร้อมกัน (ระดับ HSK ' + lvl + ')</h4>'
    +   '<div class="field"><label>บรรทัดละคำ ในรูปแบบ <code>จีน | พินอิน | ไทย | หมวด</code></label>'
    +   '<textarea id="bulkText" style="min-height:130px" placeholder="你好 | nǐ hǎo | สวัสดี | ทักทาย&#10;谢谢 | xièxie | ขอบคุณ | ทักทาย"></textarea></div>'
    +   '<div class="form-acts"><button class="mini-btn" onclick="bulkImportVocab(' + lvl + ')">📥 นำเข้าทั้งหมด</button>'
    +   '<button class="mini-btn ghost" onclick="toggleBox(\'bulkBox\')">ปิด</button></div></div>'
    + '<div>'
    + shown.map(function(o){
        var w = o.w, i = o.i;
        return '<div class="row-card"><div class="top"><div class="txt">'
          + '<b><span class="cn">' + esc(w.cn) + '</span> <span style="font-weight:500;color:var(--red);font-size:13px">' + esc(w.py||'') + '</span></b>'
          + '<small>' + esc(w.th||'') + (w.cat ? ' · <span style="color:var(--brown-2)">' + esc(catLabel(w.cat)) + '</span>' : '') + '</small>'
          + '</div><div class="acts">'
          + '<button class="icon-btn ok" onclick="editVocab(' + i + ')">✏️</button>'
          + '<button class="icon-btn warn" onclick="dupVocab(' + i + ')">⧉</button>'
          + '<button class="icon-btn" onclick="delVocab(' + lvl + ',' + i + ')">🗑</button>'
          + '</div></div></div>';
      }).join('') || '<div class="empty">ไม่พบคำศัพท์</div>'
    + '</div>'
    + (filtered.length>250 ? '<p class="hint">แสดง 250 จาก ' + filtered.length + ' คำ — ใช้ช่องค้นหาเพื่อกรอง</p>' : '')
    + '</div>';
}
function vocabForm(w, idx, lvl){
  var isNew = idx === null;
  w = w || {cn:'', py:'', th:'', cat:''};
  return ''
    + '<div class="edit-form open">'
    + '<h4>' + (isNew ? 'เพิ่มคำศัพท์ใหม่ (HSK '+lvl+')' : 'แก้ไขคำศัพท์: '+esc(w.cn||'')) + '</h4>'
    + '<div class="grid2">'
    +   '<div class="field"><label>คำจีน</label><input id="f-v-cn" value="' + esc(w.cn) + '" placeholder="你好"></div>'
    +   '<div class="field"><label>พินอิน</label><input id="f-v-py" value="' + esc(w.py||'') + '" placeholder="nǐ hǎo"></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ความหมายไทย</label><input id="f-v-th" value="' + esc(w.th||'') + '" placeholder="สวัสดี"></div>'
    +   '<div class="field"><label>หมวดหมู่</label><input id="f-v-cat" value="' + esc(catLabel(w.cat||'')) + '" list="catlist" placeholder="พิมพ์หมวดใหม่ หรือเลือกจากรายการ">'
    +   '<datalist id="catlist">' + vocatOptions().map(function(c){return '<option value="'+esc(c)+'">';}).join('') + '</datalist></div>'
    + '</div>'
    + '<div class="form-acts">'
    +   '<button class="mini-btn" onclick="saveVocab(' + (isNew?'null':idx) + ',' + lvl + ')">💾 บันทึก</button>'
    +   '<button class="mini-btn ghost" onclick="editState.vocab=null;renderAdminBody()">ยกเลิก</button>'
    + '</div></div>';
}
function vocatOptions(){
  var set = {};
  for(var i=1;i<=6;i++) hskList(i).forEach(function(w){ if(w.cat) set[catLabel(w.cat)] = 1; });
  Object.keys(DB.cats||{}).forEach(function(k){ set[catLabel(k)] = 1; });
  return Object.keys(set).sort();
}
function newVocab(){ editState.vocab = {}; renderAdminBody(); setTimeout(function(){ if($('#f-v-cn')) $('#f-v-cn').focus(); },60); }
function editVocab(i){
  editState.vocab = i; renderAdminBody();
  setTimeout(function(){ if($('#f-v-cn')) $('#f-v-cn').focus(); window.scrollTo({top:200,behavior:'smooth'}); },60);
}
function saveVocab(idx, lvl){
  var v = function(id){ return (($('#'+id) && $('#'+id).value) || '').trim(); };
  var cn = v('f-v-cn');
  if(!cn){ toast('ใส่คำจีนก่อนนะ'); return; }
  var arr = hskList(lvl);
  var rec = {cn:cn, py:v('f-v-py'), th:v('f-v-th'), cat:catKey(v('f-v-cat'))};
  if(idx === null || idx === undefined) arr.push(rec);
  else arr[idx] = rec;
  store.set('hsk', DB.hsk);
  editState.vocab = null;
  toast('บันทึกคำศัพท์แล้ว ✓');
  renderAdmin();
}
function dupVocab(i){
  var arr = hskList(activeLv);
  var w = arr[i];
  arr.push(Object.assign({}, w));
  store.set('hsk', DB.hsk); toast('ทำสำเนาแล้ว'); renderAdmin();
}
function delVocab(lvl,i){
  var arr = hskList(lvl);
  var w = arr[i]; if(!w) return;
  if(!confirm('ลบคำศัพท์ "' + w.cn + '" ?')) return;
  arr.splice(i,1);
  store.set('hsk', DB.hsk);
  toast('ลบแล้ว');
  renderAdmin();
}
function bulkImportVocab(lvl){
  var raw = (($('#bulkText') && $('#bulkText').value) || '').trim();
  if(!raw){ toast('ยังไม่ได้วางข้อมูล'); return; }
  var add = 0, skip = 0;
  var arr = hskList(lvl);
  raw.split('\n').map(function(l){return l.trim();}).filter(Boolean).forEach(function(l){
    var p = l.split('|').map(function(x){return x.trim();});
    if(!p[0]) return;
    if(arr.some(function(x){return x.cn === p[0];})){ skip++; return; }
    arr.push({cn:p[0], py:p[1]||'', th:p[2]||'', cat:catKey(p[3]||'')});
    add++;
  });
  store.set('hsk', DB.hsk);
  toast('นำเข้าสำเร็จ ' + add + ' คำ' + (skip ? (' · ข้ามคำซ้ำ ' + skip) : ''));
  renderAdmin();
}

/* ==========================================================================
   THEMATIC CATEGORIES
   ========================================================================== */
function adminCats(){
  var cats = DB.cats || {};
  var keys = Object.keys(cats);
  var e = editState.cat;
  var openKey = (typeof e === 'string' && cats[e]) ? e : null;
  var words = openKey ? ((cats[openKey]||[]).filter(function(x){ return x && x.cn; })) : [];
  var q = adminSearch.cat.toLowerCase();
  var filtered = [];
  words.forEach(function(w, i){
    if(!q || ((w.cn||'')+(w.py||'')+(w.th||'')).toLowerCase().indexOf(q) > -1) filtered.push({w:w, i:i});
  });

  var parts = [];
  parts.push('<div class="panel">');
  parts.push(  '<div class="panel-head"><h3>หมวดคำศัพท์ตามหัวข้อ (' + keys.length + ' หมวด)</h3>'
             + '<button class="mini-btn" onclick="newCat()">+ สร้างหมวดใหม่</button></div>');
  parts.push(  '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">หมวดที่สร้างเองจะถูกเก็บแยกจากหมวดของระบบ ทำให้แก้ไข/ลบได้อิสระ และนำไปใช้เป็น <b>หมวดหมู่</b> ของคำศัพท์ HSK ได้ด้วย</p>');

  if(openKey){
    parts.push(catForm({name:catLabel(openKey)}, openKey));
  } else if(e && typeof e === 'object'){
    parts.push(catForm(e, null));
  }

  parts.push('<div class="toolbar"><input class="search-in" placeholder="🔍 ค้นหาหมวด" value="' + esc(adminSearch.cat) + '" data-search="cat" oninput="onAdminSearch(this,\'cat\')"></div>');
  parts.push('<div>');
  if(!keys.length){
    parts.push('<div class="empty">ยังไม่มีหมวด</div>');
  } else {
    keys.forEach(function(k){
      var n = (cats[k]||[]).filter(function(x){ return x && x.cn; }).length;
      var tag = isUserCat(k) ? '⭐' : '📦';
      var note = isUserCat(k) ? ' · หมวดที่สร้างเอง' : ' · หมวดของระบบ (แก้ชื่อได้)';
      parts.push('<div class="row-card"><div class="top"><div class="txt">'
        + '<b>' + tag + ' ' + esc(catLabel(k)) + '</b>'
        + '<small>' + n + ' คำ' + note + '</small></div>'
        + '<div class="acts">'
        +   '<button class="icon-btn ok" title="ดู/แก้คำในหมวดนี้" onclick="openCat(' + JSON.stringify(k) + ')">📂</button>'
        +   '<button class="icon-btn warn" title="เปลี่ยนชื่อ" onclick="renameCat(' + JSON.stringify(k) + ')">✏️</button>'
        +   (isUserCat(k) ? '<button class="icon-btn" title="ลบหมวด" onclick="delCat(' + JSON.stringify(k) + ')">🗑</button>' : '')
        + '</div></div></div>');
    });
  }
  parts.push('</div></div>');

  if(openKey){
    parts.push('<div class="panel">');
    parts.push(  '<div class="panel-head"><h3>คำศัพท์ในหมวด “' + esc(catLabel(openKey)) + '” (' + words.length + ')</h3>'
               + '<div style="display:flex;gap:9px;flex-wrap:wrap">'
               +   '<button class="mini-btn" onclick="newCatWord()">+ เพิ่มคำในหมวดนี้</button>'
               +   '<button class="mini-btn ghost" onclick="toggleBox(\'bulkCatBox\')">📥 นำเข้าหลายคำ</button>'
               +   '<button class="mini-btn ghost" onclick="closeCat()">ปิดหมวดนี้</button>'
               + '</div></div>');
    if(editState.catWord !== false && editState.catWord !== null && editState.catWord !== undefined){
      parts.push(catWordForm(openKey, editState.catWord));
    }
    parts.push('<div class="toolbar"><input class="search-in" placeholder="🔍 ค้นหาคำในหมวดนี้" value="' + esc(adminSearch.cat) + '" data-search="cat" oninput="onAdminSearch(this,\'cat\')"></div>');
    parts.push('<div class="edit-form" id="bulkCatBox"><h4>นำเข้าคำศัพท์เข้าหมวดนี้</h4>'
      + '<div class="field"><label>บรรทัดละคำ ในรูปแบบ <code>จีน | พินอิน | ไทย</code></label>'
      + '<textarea id="bulkCatText" style="min-height:120px" placeholder="米饭 | mǐfàn | ข้าวสวย"></textarea></div>'
      + '<div class="form-acts"><button class="mini-btn" onclick="bulkImportCat(' + JSON.stringify(openKey) + ')">📥 นำเข้า</button>'
      + '<button class="mini-btn ghost" onclick="toggleBox(\'bulkCatBox\')">ปิด</button></div></div>');
    parts.push('<div>');
    if(!filtered.length){
      parts.push('<div class="empty">ยังไม่มีคำในหมวดนี้</div>');
    } else {
      filtered.forEach(function(o){
        var w = o.w;
        parts.push('<div class="row-card"><div class="top"><div class="txt">'
          + '<b><span class="cn">' + esc(w.cn) + '</span> <span style="font-weight:500;color:var(--red);font-size:13px">' + esc(w.py||'') + '</span></b>'
          + '<small>' + esc(w.th||'') + '</small></div><div class="acts">'
          + '<button class="icon-btn ok" onclick="editCatWord(' + o.i + ')">✏️</button>'
          + '<button class="icon-btn" onclick="delCatWord(' + JSON.stringify(openKey) + ',' + o.i + ')">🗑</button>'
          + '</div></div></div>');
      });
    }
    parts.push('</div></div>');
  }
  return parts.join('');
}
function closeCat(){
  editState.cat = null; editState.catWord = false; adminSearch.cat = '';
  renderAdminBody();
}
function catForm(c, key){
  var isNew = key === null;
  c = c || {name:'', icon:'📌'};
  return ''
    + '<div class="edit-form open">'
    + '<h4>' + (isNew ? 'สร้างหมวดใหม่' : 'แก้ไขหมวด: ' + esc(c.name)) + '</h4>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ชื่อหมวด</label><input id="f-c-name" value="' + esc(c.name) + '" placeholder="เช่น อาหารจีน, คำกริยาที่ใช้บ่อย"></div>'
    +   '<div class="field"><label>ไอคอน</label><div class="badge-pick" id="iconPick">'
    +     CAT_ICONS.slice(0,15).map(function(ic){
            return '<button class="' + (ic===pendingCatIcon?'sel':'') + '" onclick="pickCatIcon(\'' + ic + '\')">' + ic + '</button>';
          }).join('')
    +   '</div></div>'
    + '</div>'
    + '<div class="form-acts">'
    +   '<button class="mini-btn" onclick="saveCat(' + (isNew ? 'null' : ("'" + esc(key) + "'")) + ')">💾 บันทึกหมวด</button>'
    +   '<button class="mini-btn ghost" onclick="editState.cat=null;renderAdminBody()">ยกเลิก</button>'
    + '</div></div>';
}
function pickCatIcon(ic){ pendingCatIcon = ic; $$('#iconPick button').forEach(function(b){ b.classList.toggle('sel', b.textContent === ic); }); }
function newCat(){ editState.cat = {name:''}; pendingCatIcon = '📌'; renderAdminBody(); setTimeout(function(){ if($('#f-c-name')) $('#f-c-name').focus(); },60); }
function openCat(k){ editState = {article:null, vocab:null, cat:k, catWord:false, game:null, gameQ:null, product:null}; adminSearch.cat = ''; renderAdminBody(); }
function renameCat(k){ editState.cat = k; editState.catWord = false; pendingCatIcon = (DB.cats[k].__icon)||'📌'; renderAdminBody(); setTimeout(function(){ if($('#f-c-name')) $('#f-c-name').focus(); },60); }
function saveCat(key){
  var name = (($('#f-c-name') && $('#f-c-name').value) || '').trim();
  if(!name){ toast('ใส่ชื่อหมวดก่อนนะ'); return; }
  DB.cats = DB.cats || {};
  if(key === null || key === undefined){
    var k = catKey(name);
    DB.cats[k] = DB.cats[k] || [];
    DB.cats[k].__icon = pendingCatIcon;
    editState.cat = k;
  } else {
    var newKey = catKey(name);
    if(newKey !== key){
      if(DB.cats[newKey]){ toast('มีหมวดชื่อนี้อยู่แล้ว'); return; }
      DB.cats[newKey] = DB.cats[key];
      delete DB.cats[key];
      for(var i=1;i<=6;i++) hskList(i).forEach(function(w){ if(w.cat === key) w.cat = newKey; });
      store.set('hsk', DB.hsk);
      editState.cat = newKey;
    }
    DB.cats[editState.cat].__icon = pendingCatIcon;
  }
  store.set('cats', DB.cats);
  editState.catWord = false;
  toast('บันทึกหมวดแล้ว ✓');
  renderAdmin();
}
function delCat(k){
  var n = (DB.cats[k]||[]).filter(function(x){return x&&x.cn;}).length;
  if(!confirm('ลบหมวด "' + catLabel(k) + '" และคำ ' + n + ' คำในหมวดนี้?')) return;
  delete DB.cats[k];
  store.set('cats', DB.cats);
  if(editState.cat === k) editState.cat = null;
  toast('ลบหมวดแล้ว');
  renderAdmin();
}
function newCatWord(){ editState.catWord = {}; adminSearch.cat = ''; renderAdminBody(); setTimeout(function(){ if($('#f-cw-cn')) $('#f-cw-cn').focus(); },60); }
function editCatWord(i){ editState.catWord = i; renderAdminBody(); setTimeout(function(){ if($('#f-cw-cn')) $('#f-cw-cn').focus(); },60); }
function catWordForm(k, idx){
  var isNew = idx === null || idx === undefined || typeof idx === 'object';
  var w = isNew ? (typeof idx === 'object' ? idx : {}) : ((DB.cats[k]||[])[idx] || {});
  return ''
    + '<div class="edit-form open">'
    + '<h4>' + (isNew ? 'เพิ่มคำในหมวดนี้' : 'แก้ไขคำ: ' + esc(w.cn||'')) + '</h4>'
    + '<div class="grid2">'
    +   '<div class="field"><label>คำจีน</label><input id="f-cw-cn" value="' + esc(w.cn||'') + '" placeholder="米饭"></div>'
    +   '<div class="field"><label>พินอิน</label><input id="f-cw-py" value="' + esc(w.py||'') + '" placeholder="mǐfàn"></div>'
    + '</div>'
    + '<div class="field"><label>ความหมายไทย</label><input id="f-cw-th" value="' + esc(w.th||'') + '" placeholder="ข้าวสวย"></div>'
    + '<div class="form-acts">'
    +   '<button class="mini-btn" onclick="saveCatWord(\'' + esc(k) + '\',' + (isNew?'null':idx) + ')">💾 บันทึก</button>'
    +   '<button class="mini-btn ghost" onclick="editState.catWord=false;renderAdminBody()">ยกเลิก</button>'
    + '</div></div>';
}
function saveCatWord(k, idx){
  var v = function(id){ return (($('#'+id) && $('#'+id).value) || '').trim(); };
  var cn = v('f-cw-cn');
  if(!cn){ toast('ใส่คำจีนก่อนนะ'); return; }
  DB.cats[k] = DB.cats[k] || [];
  var rec = {cn:cn, py:v('f-cw-py'), th:v('f-cw-th')};
  if(idx === null || idx === undefined) DB.cats[k].push(rec);
  else DB.cats[k][idx] = rec;
  store.set('cats', DB.cats);
  editState.catWord = false;
  toast('บันทึกแล้ว ✓');
  renderAdmin();
}
function delCatWord(k,i){
  if(!confirm('ลบคำนี้?')) return;
  DB.cats[k].splice(i,1);
  store.set('cats', DB.cats);
  renderAdmin();
}
function bulkImportCat(k){
  var raw = (($('#bulkCatText') && $('#bulkCatText').value) || '').trim();
  if(!raw){ toast('ยังไม่ได้วางข้อมูล'); return; }
  var add = 0;
  DB.cats[k] = DB.cats[k] || [];
  raw.split('\n').map(function(l){return l.trim();}).filter(Boolean).forEach(function(l){
    var p = l.split('|').map(function(x){return x.trim();});
    if(!p[0]) return;
    if(DB.cats[k].some(function(x){return x && x.cn === p[0];})) return;
    DB.cats[k].push({cn:p[0], py:p[1]||'', th:p[2]||''});
    add++;
  });
  store.set('cats', DB.cats);
  toast('นำเข้าสำเร็จ ' + add + ' คำ');
  renderAdmin();
}

/* ==========================================================================
   GAMES
   ========================================================================== */
function adminGames(){
  var gid = editState.game || 'fill';
  var def = GAME_DEFS.filter(function(d){return d.id===gid;})[0] || GAME_DEFS[0];
  var lv = activeLv;
  var bank = (DB.games[gid] || []);
  var q = adminSearch.game.toLowerCase();
  var rows = bank.map(function(x,i){return {x:x,i:i};}).filter(function(r){ return (r.x.lv||1) === lv; });
  if(q) rows = rows.filter(function(r){ return JSON.stringify(r.x).toLowerCase().indexOf(q)>-1; });
  var e = editState.gameQ;

  return ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>คลังคำถามเกม</h3><div style="display:flex;gap:9px;flex-wrap:wrap">'
    +   '<button class="mini-btn" onclick="newGameQ()">+ เพิ่มคำถาม</button>'
    +   '<button class="mini-btn ghost" onclick="exportData(\'games\')">⬇ สำรองข้อมูล</button></div></div>'
    + '<div class="toolbar"><div class="badge-pick">'
    +   GAME_DEFS.map(function(d){
          return '<button class="' + (gid===d.id?'sel':'') + '" onclick="editState.game=\'' + d.id + '\';editState.gameQ=null;renderAdminBody()">'
            + d.ic + ' ' + d.name + ' <b style="opacity:.65">' + ((DB.games[d.id]||[]).length) + '</b></button>';
        }).join('')
    + '</div></div>'
    + '<div class="toolbar"><div class="badge-pick">'
    +   [1,2,3,4,5,6].map(function(n){
          var c = bank.filter(function(x){return (x.lv||1)===n;}).length;
          return '<button class="' + (lv===n?'sel':'') + '" onclick="activeLv=' + n + ';editState.gameQ=null;renderAdminBody()">ด่าน ' + n + ' · HSK ' + n + ' <b style="opacity:.65">' + c + '</b></button>';
        }).join('')
    + '</div></div>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin:10px 0 16px">กำลังแก้ไข: <b>' + def.ic + ' ' + def.name + ' — ด่าน ' + lv + ' (HSK ' + lv + ')</b> · ' + rows.length + ' คำถาม</p>'
    + (e!==null && e!==undefined ? gameForm(typeof e==='object'?e:bank[+e], typeof e==='object'?null:+e, gid, lv) : '')
    + '<div class="toolbar">'
    +   '<input class="search-in" placeholder="🔍 ค้นหาในคลังของเกมนี้" value="' + esc(adminSearch.game) + '" data-search="game" oninput="onAdminSearch(this,\'game\')">'
    +   '<button class="mini-btn ghost" onclick="toggleBox(\'bulkGameBox\')">📥 นำเข้าหลายข้อ</button>'
    + '</div>'
    + '<div class="edit-form" id="bulkGameBox"><h4>นำเข้าคำถามหลายข้อ (' + def.name + ' · ด่าน ' + lv + ')</h4>'
    +   '<div class="field"><label>' + gameBulkHint(gid) + '</label>'
    +   '<textarea id="bulkGameText" style="min-height:130px" placeholder="' + gameBulkPh(gid) + '"></textarea></div>'
    +   '<div class="form-acts"><button class="mini-btn" onclick="bulkImportGame(\'' + gid + '\',' + lv + ')">📥 นำเข้า</button>'
    +   '<button class="mini-btn ghost" onclick="toggleBox(\'bulkGameBox\')">ปิด</button></div></div>'
    + '<div>'
    + rows.map(function(o){
        var x = o.x, i = o.i;
        return '<div class="row-card"><div class="top"><div class="txt">'
          + '<b>' + esc(gameQTitle(x, gid)) + '</b><small>' + esc(gameQSub(x, gid)) + '</small></div>'
          + '<div class="acts">'
          + '<button class="icon-btn warn" title="ย้ายไปด่านถัดไป" onclick="moveGameLv(\'' + gid + '\',' + i + ')">↕</button>'
          + '<button class="icon-btn ok" onclick="editGameQ(' + i + ')">✏️</button>'
          + '<button class="icon-btn" onclick="delGameQ(\'' + gid + '\',' + i + ')">🗑</button>'
          + '</div></div></div>';
      }).join('') || '<div class="empty">ยังไม่มีคำถามในด่านนี้</div>'
    + '</div></div>';
}
function gameQTitle(q, gid){
  if(gid==='reading') return (q.zh||'').slice(0,44) + ((q.zh||'').length>44?'…':'');
  if(gid==='tone') return (q.q||'') + ' → ' + (q.target||'');
  return q.q || q.cn || '';
}
function gameQSub(q, gid){
  if(gid==='fill') return 'ตอบ: ' + (q.a||'') + ' · หลอก: ' + (q.w||[]).join(', ') + (q.th ? (' · ' + q.th) : '');
  if(gid==='vocab') return (q.py||'') + ' → ' + (q.a||'') + ' · หลอก: ' + (q.w||[]).join(', ');
  if(gid==='pinyin') return 'อ่านว่า ' + (q.a||'') + ' · หลอก: ' + (q.w||[]).join(', ') + (q.th ? (' · ' + q.th) : '');
  if(gid==='tone') return 'เสียงที่ ' + (q.a||'') + ' · หลอก: ' + (q.w||[]).join(', ') + (q.th ? (' · ' + q.th) : '');
  if(gid==='order') return 'คำตอบ: ' + (q.a||[]).join(' ') + ' · สลับ: ' + (q.w0||[]).join(' ');
  if(gid==='reading') return 'ถาม: ' + (q.q||'') + ' → ' + (q.a||'');
  return '';
}
function gameBulkHint(gid){
  if(gid==='fill') return 'บรรทัดละข้อ: <code>ประโยคที่มี ___ | คำตอบ | ตัวหลอก1 | ตัวหลอก2 | คำแปลไทย</code>';
  if(gid==='vocab') return 'บรรทัดละข้อ: <code>คำจีน | พินอิน | ความหมายที่ถูก | หลอก1 | หลอก2</code>';
  if(gid==='pinyin') return 'บรรทัดละข้อ: <code>คำจีน | พินอินที่ถูก | หลอก1 | หลอก2 | ความหมายไทย</code>';
  if(gid==='tone') return 'บรรทัดละข้อ: <code>คำจีน | พยางค์เป้าหมาย | เสียงที่ถูก(1-4) | หลอก1 | หลอก2 | คำอธิบาย</code>';
  if(gid==='order') return 'บรรทัดละข้อ: <code>ประโยคไทย | คำจีน1 คำจีน2 คำจีน3 … | พินอินเต็มประโยค</code>';
  return 'บรรทัดละข้อ: <code>เนื้อเรื่องจีน | พินอิน | คำถามไทย | คำตอบถูก | หลอก1 | หลอก2 | คำแปลไทย</code>';
}
function gameBulkPh(gid){
  if(gid==='fill') return '我___中国人。 | 是 | 有 | 在 | ฉันเป็นคนจีน';
  if(gid==='vocab') return '苹果 | píngguǒ | แอปเปิล | กล้วย | ส้ม';
  if(gid==='pinyin') return '中国 | Zhōngguó | Zhōngguō | Zhòngguó | ประเทศจีน';
  if(gid==='tone') return '你好 | 你 | 3 | 1 | 2 | เสียงที่ 3 (nǐ)';
  if(gid==='order') return 'ฉันเป็นคนไทย | 我 是 泰国 人 | Wǒ shì Tàiguó rén.';
  return '我叫小明。 | Wǒ jiào Xiǎomíng. | เขาชื่ออะไร | เสี่ยวหมิง | หลี่หมิง | หวังเว่ย | ฉันชื่อเสี่ยวหมิง';
}
function newGameQ(){ editState.gameQ = {}; renderAdminBody(); setTimeout(function(){ if($('#f-g-q')) $('#f-g-q').focus(); },60); }
function editGameQ(i){
  editState.gameQ = i; renderAdminBody();
  setTimeout(function(){ if($('#f-g-q')) $('#f-g-q').focus(); window.scrollTo({top:200,behavior:'smooth'}); },60);
}
function gameForm(q, idx, gid, lv){
  var isNew = idx === null;
  q = q || {};
  var w = q.w || ['',''];
  var a = Array.isArray(q.a) ? q.a : null;
  var fields = '';

  if(gid === 'fill'){
    fields = '<div class="field"><label>ประโยค (ใช้ ___ แทนคำที่หายไป)</label><input id="f-g-q" value="' + esc(q.q||'') + '" placeholder="我___中国人。"></div>'
      + '<div class="grid2">'
      + '<div class="field"><label>คำตอบที่ถูกต้อง</label><input id="f-g-a" value="' + esc(q.a||'') + '" placeholder="是"></div>'
      + '<div class="field"><label>คำแปลไทยของประโยค</label><input id="f-g-th" value="' + esc(q.th||'') + '" placeholder="ฉันเป็นคนจีน"></div></div>'
      + '<div class="grid2">'
      + '<div class="field"><label>ตัวเลือกหลอก 1</label><input id="f-g-w1" value="' + esc(w[0]||'') + '" placeholder="有"></div>'
      + '<div class="field"><label>ตัวเลือกหลอก 2</label><input id="f-g-w2" value="' + esc(w[1]||'') + '" placeholder="在"></div></div>'
      + '<div class="field"><label>พินอินของประโยค (ไม่บังคับ)</label><input id="f-g-py" value="' + esc(q.py||'') + '" placeholder="Wǒ shì Zhōngguó rén."></div>';
  } else if(gid === 'vocab'){
    fields = '<div class="grid2">'
      + '<div class="field"><label>คำจีน</label><input id="f-g-q" value="' + esc(q.q||q.cn||'') + '" placeholder="苹果"></div>'
      + '<div class="field"><label>พินอิน</label><input id="f-g-py" value="' + esc(q.py||'') + '" placeholder="píngguǒ"></div></div>'
      + '<div class="field"><label>ความหมายที่ถูกต้อง (ไทย)</label><input id="f-g-a" value="' + esc(q.a||'') + '" placeholder="แอปเปิล"></div>'
      + '<div class="grid2">'
      + '<div class="field"><label>ตัวเลือกหลอก 1</label><input id="f-g-w1" value="' + esc(w[0]||'') + '" placeholder="กล้วย"></div>'
      + '<div class="field"><label>ตัวเลือกหลอก 2</label><input id="f-g-w2" value="' + esc(w[1]||'') + '" placeholder="ส้ม"></div></div>';
  } else if(gid === 'pinyin'){
    fields = '<div class="grid2">'
      + '<div class="field"><label>คำจีน</label><input id="f-g-q" value="' + esc(q.q||'') + '" placeholder="中国"></div>'
      + '<div class="field"><label>ความหมายไทย (ไม่บังคับ)</label><input id="f-g-th" value="' + esc(q.th||'') + '" placeholder="ประเทศจีน"></div></div>'
      + '<div class="field"><label>พินอินที่ถูกต้อง</label><input id="f-g-a" value="' + esc(q.a||'') + '" placeholder="Zhōngguó"></div>'
      + '<div class="grid2">'
      + '<div class="field"><label>พินอินหลอก 1</label><input id="f-g-w1" value="' + esc(w[0]||'') + '" placeholder="Zhōngguō"></div>'
      + '<div class="field"><label>พินอินหลอก 2</label><input id="f-g-w2" value="' + esc(w[1]||'') + '" placeholder="Zhòngguó"></div></div>';
  } else if(gid === 'tone'){
    fields = '<div class="grid2">'
      + '<div class="field"><label>คำจีน</label><input id="f-g-q" value="' + esc(q.q||'') + '" placeholder="你好"></div>'
      + '<div class="field"><label>พยางค์ที่ต้องการถามถึง</label><input id="f-g-target" value="' + esc(q.target||'') + '" placeholder="你"></div></div>'
      + '<div class="grid2">'
      + '<div class="field"><label>เสียงที่ถูกต้อง</label><select id="f-g-a">'
      + ['1','2','3','4'].map(function(n){ return '<option value="' + n + '" ' + (String(q.a)===n?'selected':'') + '>เสียงที่ ' + n + '</option>'; }).join('')
      + '</select></div>'
      + '<div class="field"><label>คำอธิบาย (เช่น เสียงที่ 3 (nǐ))</label><input id="f-g-th" value="' + esc(q.th||'') + '" placeholder="เสียงที่ 3 (nǐ)"></div></div>'
      + '<div class="grid2">'
      + '<div class="field"><label>ตัวเลือกหลอก 1</label><input id="f-g-w1" value="' + esc(w[0]||'') + '" placeholder="1"></div>'
      + '<div class="field"><label>ตัวเลือกหลอก 2</label><input id="f-g-w2" value="' + esc(w[1]||'') + '" placeholder="2"></div></div>';
  } else if(gid === 'order'){
    fields = '<div class="field"><label>ประโยคภาษาไทย (โจทย์)</label><input id="f-g-q" value="' + esc(q.q||'') + '" placeholder="ฉันเป็นคนไทย"></div>'
      + '<div class="field"><label>คำจีนในลำดับที่ถูกต้อง (คั่นด้วยช่องว่าง)</label><input id="f-g-a" value="' + esc(a?a.join(' '):'') + '" placeholder="我 是 泰国 人"></div>'
      + '<div class="field"><label>พินอินเต็มประโยค</label><input id="f-g-th" value="' + esc(q.th||'') + '" placeholder="Wǒ shì Tàiguó rén."></div>'
      + '<div class="field"><label>ลำดับที่สลับแล้ว (เว้นว่างให้ระบบสลับเอง)</label><input id="f-g-w0" value="' + esc((q.w0||[]).join(' ')) + '" placeholder="是 我 人 泰国"></div>';
  } else {
    fields = '<div class="field"><label>เนื้อเรื่องภาษาจีน</label><textarea id="f-g-zh" placeholder="我叫小明，我是泰国人。">' + esc(q.zh||'') + '</textarea></div>'
      + '<div class="field"><label>พินอินของเนื้อเรื่อง</label><textarea id="f-g-py" placeholder="Wǒ jiào Xiǎomíng, wǒ shì Tàiguó rén.">' + esc(q.py||'') + '</textarea></div>'
      + '<div class="field"><label>คำถาม (ไทย)</label><input id="f-g-q" value="' + esc(q.q||'') + '" placeholder="เสี่ยวหมิงเป็นคนประเทศอะไร"></div>'
      + '<div class="field"><label>คำตอบที่ถูกต้อง</label><input id="f-g-a" value="' + esc(q.a||'') + '" placeholder="คนไทย"></div>'
      + '<div class="grid2">'
      + '<div class="field"><label>ตัวเลือกหลอก 1</label><input id="f-g-w1" value="' + esc(w[0]||'') + '" placeholder="คนจีน"></div>'
      + '<div class="field"><label>ตัวเลือกหลอก 2</label><input id="f-g-w2" value="' + esc(w[1]||'') + '" placeholder="คนญี่ปุ่น"></div></div>'
      + '<div class="field"><label>คำแปลไทยของเนื้อเรื่อง</label><textarea id="f-g-th" placeholder="ฉันชื่อเสี่ยวหมิง ฉันเป็นคนไทย">' + esc(q.th||'') + '</textarea></div>';
  }

  return ''
    + '<div class="edit-form open">'
    + '<h4>' + (isNew?'เพิ่มคำถามใหม่':'แก้ไขคำถาม') + ' — ' + GAME_DEFS.filter(function(d){return d.id===gid;})[0].name + ' · ด่าน ' + lv + '</h4>'
    + fields
    + '<div class="field"><label>ระดับด่าน</label><div class="badge-pick">'
    +   [1,2,3,4,5,6].map(function(n){
          return '<button id="f-g-lv-' + n + '" class="' + (lv===n?'sel':'') + '" onclick="pickFormLevel(' + n + ')">ด่าน ' + n + ' · HSK ' + n + '</button>';
        }).join('')
    + '</div></div>'
    + '<div class="form-acts">'
    +   '<button class="mini-btn" onclick="saveGameQ(\'' + gid + '\',' + (isNew?'null':idx) + ')">💾 บันทึกคำถาม</button>'
    +   '<button class="mini-btn ghost" onclick="editState.gameQ=null;renderAdminBody()">ยกเลิก</button>'
    + '</div></div>';
}
function pickFormLevel(n){
  pendingFormLevel = n;
  [1,2,3,4,5,6].forEach(function(i){ var b = $('#f-g-lv-'+i); if(b) b.classList.toggle('sel', i===n); });
}
function saveGameQ(gid, idx){
  var v = function(id){ return ($('#'+id) && $('#'+id).value) || ''; };
  var lv = pendingFormLevel || activeLv || 1;
  var rec = {lv:lv}; var ok = true;

  if(gid === 'fill'){
    rec.q = v('f-g-q').trim(); rec.a = v('f-g-a').trim();
    rec.w = [v('f-g-w1').trim(), v('f-g-w2').trim()];
    rec.th = v('f-g-th').trim(); rec.py = v('f-g-py').trim();
    if(!rec.q || !rec.a || !rec.w[0] || !rec.w[1]) ok = false;
    if(rec.q.indexOf('___') < 0) rec.q = rec.q.replace(/\s*_+\s*/, '___');
  } else if(gid === 'vocab'){
    rec.q = v('f-g-q').trim(); rec.py = v('f-g-py').trim();
    rec.a = v('f-g-a').trim(); rec.w = [v('f-g-w1').trim(), v('f-g-w2').trim()];
    if(!rec.q || !rec.a || !rec.w[0] || !rec.w[1]) ok = false;
  } else if(gid === 'pinyin'){
    rec.q = v('f-g-q').trim(); rec.a = v('f-g-a').trim();
    rec.w = [v('f-g-w1').trim(), v('f-g-w2').trim()]; rec.th = v('f-g-th').trim();
    if(!rec.q || !rec.a || !rec.w[0] || !rec.w[1]) ok = false;
  } else if(gid === 'tone'){
    rec.q = v('f-g-q').trim(); rec.target = v('f-g-target').trim();
    rec.a = v('f-g-a'); rec.w = [v('f-g-w1').trim(), v('f-g-w2').trim()];
    rec.th = v('f-g-th').trim();
    if(!rec.q || !rec.target) ok = false;
    rec.w = rec.w.filter(function(x){ return x && x !== rec.a; });
    while(rec.w.length < 2) rec.w.push(String(1 + rec.w.length));
    rec.w = rec.w.slice(0,2);
  } else if(gid === 'order'){
    rec.q = v('f-g-q').trim();
    rec.a = v('f-g-a').trim().split(/\s+/).filter(Boolean);
    rec.th = v('f-g-th').trim();
    var w0 = v('f-g-w0').trim().split(/\s+/).filter(Boolean);
    rec.w0 = (w0.length === rec.a.length && w0.join('') !== rec.a.join('')) ? w0 : shuffle(rec.a);
    if(!rec.q || rec.a.length < 2) ok = false;
  } else {
    rec.zh = v('f-g-zh').trim(); rec.py = v('f-g-py').trim();
    rec.q = v('f-g-q').trim(); rec.a = v('f-g-a').trim();
    rec.w = [v('f-g-w1').trim(), v('f-g-w2').trim()]; rec.th = v('f-g-th').trim();
    if(!rec.zh || !rec.q || !rec.a || !rec.w[0] || !rec.w[1]) ok = false;
  }
  if(!ok){ toast('กรอกข้อมูลสำคัญให้ครบก่อนนะ'); return; }

  DB.games[gid] = DB.games[gid] || [];
  if(idx === null || idx === undefined) DB.games[gid].push(rec);
  else DB.games[gid][idx] = rec;
  store.set('games', DB.games);
  editState.gameQ = null;
  activeLv = lv;
  pendingFormLevel = null;
  toast('บันทึกคำถามแล้ว ✓');
  renderAdmin();
}
function delGameQ(gid,i){
  if(!confirm('ลบคำถามข้อนี้?')) return;
  DB.games[gid].splice(i,1);
  store.set('games', DB.games);
  toast('ลบแล้ว');
  renderAdmin();
}
function moveGameLv(gid,i){
  var q = DB.games[gid][i];
  var next = ((q.lv || 1) % 6) + 1;
  q.lv = next;
  store.set('games', DB.games);
  toast('ย้ายไปด่าน ' + next + ' แล้ว');
  renderAdmin();
}
function bulkImportGame(gid, lv){
  var raw = (($('#bulkGameText') && $('#bulkGameText').value) || '').trim();
  if(!raw){ toast('ยังไม่ได้วางข้อมูล'); return; }
  var add = 0;
  DB.games[gid] = DB.games[gid] || [];
  raw.split('\n').map(function(l){return l.trim();}).filter(Boolean).forEach(function(line){
    var p = line.split('|').map(function(x){return x.trim();});
    var rec = null;
    if(gid==='fill'){ if(!p[1]||!p[2]) return; rec = {lv:lv, q:p[0], a:p[1], w:[p[2], p[3]||p[2]], th:p[4]||''}; }
    else if(gid==='vocab'){ if(!p[2]||!p[3]) return; rec = {lv:lv, q:p[0], py:p[1]||'', a:p[2], w:[p[3], p[4]||p[3]]}; }
    else if(gid==='pinyin'){ if(!p[1]||!p[2]) return; rec = {lv:lv, q:p[0], a:p[1], w:[p[2], p[3]||p[2]], th:p[4]||''}; }
    else if(gid==='tone'){ if(!p[1]||!p[2]) return; rec = {lv:lv, q:p[0], target:p[1], a:p[2], w:[p[3]||'1', p[4]||'2'], th:p[5]||''}; }
    else if(gid==='order'){ var aa = (p[1]||'').split(/\s+/).filter(Boolean); if(aa.length<2) return; rec = {lv:lv, q:p[0], a:aa, w0:shuffle(aa), th:p[2]||''}; }
    else { if(!p[0]||!p[3]||!p[4]) return; rec = {lv:lv, zh:p[0], py:p[1]||'', q:p[2], a:p[3], w:[p[4], p[5]||p[4]], th:p[6]||''}; }
    if(rec){ DB.games[gid].push(rec); add++; }
  });
  store.set('games', DB.games);
  toast('นำเข้าสำเร็จ ' + add + ' ข้อ');
  renderAdmin();
}
function exportData(what){
  var payload, name;
  if(what === 'articles'){ payload = (DB.articles||[]); name = 'articles'; }
  else if(what === 'hsk'){ payload = DB.hsk; name = 'hsk'; }
  else if(what === 'cat'){ payload = DB.cats; name = 'categories'; }
  else if(what === 'games'){ payload = DB.games; name = 'games'; }
  else if(what === 'products'){ payload = DB.products; name = 'products'; }
  else if(what === 'theme'){ payload = DB.theme; name = 'theme'; }
  else if(what === 'daily'){ payload = DB.daily; name = 'daily'; }
  else if(what === 'pages'){ payload = DB.pages; name = 'pages'; }
  else if(what === 'blog'){ payload = DB.blog; name = 'blog'; }
  else if(what === 'gameCats'){ payload = DB.gameCats; name = 'gameCats'; }
  else if(what === 'nav'){ payload = DB.nav; name = 'nav'; }
  else { payload = {articles:DB.articles, hsk:DB.hsk, cats:DB.cats, games:DB.games, products:DB.products,
                    settings:DB.settings, theme:DB.theme, daily:DB.daily, pages:DB.pages, blog:DB.blog, gameCats:DB.gameCats, nav:DB.nav}; name = 'all'; }
  var blob = new Blob([JSON.stringify(payload, null, 1)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'why-chinese-' + name + '-' + todayKey() + '.json';
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  toast('ดาวน์โหลดไฟล์สำรองแล้ว');
}

/* ==========================================================================
   PRODUCTS
   ========================================================================== */
function adminProducts(){
  var list = DB.products || [];
  var e = editState.product;
  var q = adminSearch.prod.toLowerCase();
  var shown = q ? list.map(function(p,i){return {p:p,i:i};}).filter(function(x){
        return ((x.p.name||'')+(x.p.desc||'')).toLowerCase().indexOf(q)>-1;
      }) : list.map(function(p,i){return {p:p,i:i};});
  return ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>สินค้าในร้านค้า (' + list.length + ')</h3>'
    +   '<button class="mini-btn" onclick="newProduct()">+ เพิ่มสินค้า</button></div>'
    + (e!==null && e!==undefined ? productForm(typeof e==='object'?e:list[+e], typeof e==='object'?null:+e) : '')
    + '<div class="toolbar">'
    +   '<input class="search-in" placeholder="🔍 ค้นหาสินค้า" value="' + esc(adminSearch.prod) + '" data-search="prod" oninput="onAdminSearch(this,\'prod\')">'
    +   '<button class="mini-btn ghost" onclick="exportData(\'products\')">⬇ สำรองข้อมูล</button>'
    + '</div><div>'
    + shown.map(function(o){
        var p = o.p, i = o.i;
        var thumb = p.img
          ? '<img src="' + p.img + '" style="width:54px;height:54px;border-radius:10px;object-fit:cover;flex:0 0 auto">'
          : '<div style="width:54px;height:54px;border-radius:10px;background:var(--bg-2);display:grid;place-items:center;font-size:22px;flex:0 0 auto">' + (p.icon||'📦') + '</div>';
        return '<div class="row-card"><div class="top">' + thumb
          + '<div class="txt"><b>' + esc(p.name) + '</b>'
          + '<small>฿' + ((+p.price||0).toLocaleString()) + (p.tag ? (' · ' + esc(p.tag)) : '') + (p.soldOut ? ' · <span style="color:var(--red)">สินค้าหมด</span>' : '') + '</small></div>'
          + '<div class="acts">'
          + '<button class="icon-btn ok" onclick="editProduct(' + i + ')">✏️</button>'
          + '<button class="icon-btn warn" onclick="dupProduct(' + i + ')">⧉</button>'
          + '<button class="icon-btn" onclick="delProduct(' + i + ')">🗑</button>'
          + '</div></div></div>';
      }).join('') || '<div class="empty">ยังไม่มีสินค้า</div>'
    + '</div></div>';
}
function productForm(p, idx){
  var isNew = idx === null;
  p = p || {name:'', desc:'', price:'', icon:'📦', tag:'', img:'', stock:'', sku:'', unit:'', soldOut:false};
  var icons = ['📚','🃏','✍️','📜','🎧','🧧','🏮','🀄','🎋','🖌️','📖','🎁','👕','🧸'];
  return ''
    + '<div class="edit-form open">'
    + '<h4>' + (isNew ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า: ' + esc(p.name)) + '</h4>'
    + '<div class="field"><label>รูปสินค้า (อัปโหลดรูปจริง)</label>'
    +   uploadBox('prodImg', p.img, 900, false)
    +   '<div class="hint">ถ้าไม่อัปโหลดรูป ระบบจะใช้ไอคอนด้านล่างแทน</div></div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ชื่อสินค้า</label><input id="f-p-name" value="' + esc(p.name) + '" placeholder="หนังสือเรียน HSK 1"></div>'
    +   '<div class="field"><label>ป้ายกำกับ (เช่น ขายดี, ใหม่, 限量)</label><input id="f-p-tag" value="' + esc(p.tag||'') + '" placeholder="ขายดี"></div>'
    + '</div>'
    + '<div class="field"><label>คำอธิบาย</label><textarea id="f-p-desc" placeholder="หนังสือเรียนพร้อมแบบฝึกหัดและเสียงอ่าน">' + esc(p.desc||'') + '</textarea></div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ราคา (บาท)</label><input id="f-p-price" type="number" min="0" value="' + (p.price!=null?p.price:'') + '" placeholder="290"></div>'
    +   '<div class="field"><label>หน่วย (เช่น / เล่ม, / ชุด)</label><input id="f-p-unit" value="' + esc(p.unit||'') + '" placeholder="/ เล่ม"></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>จำนวนคงเหลือ</label><input id="f-p-stock" value="' + (p.stock!=null?esc(String(p.stock)):'') + '" placeholder="20"></div>'
    +   '<div class="field"><label>รหัสสินค้า (SKU)</label><input id="f-p-sku" value="' + esc(p.sku||'') + '" placeholder="HSK1-BOOK"></div>'
    + '</div>'
    + '<div class="field"><label>ไอคอนสำรอง</label><div class="badge-pick" id="iconProd">'
    +   icons.map(function(ic){ return '<button class="' + (ic===pendingProdIcon?'sel':'') + '" onclick="pickProdIcon(\'' + ic + '\')">' + ic + '</button>'; }).join('')
    + '</div></div>'
    + '<div class="field"><label>สถานะ</label><div class="badge-pick">'
    +   '<button class="' + (!pendingSoldOut?'sel':'') + '" onclick="pickSoldOut(false)" id="pInStock">✅ มีสินค้า</button>'
    +   '<button class="' + (pendingSoldOut?'sel':'') + '" onclick="pickSoldOut(true)" id="pSoldOut">🚫 สินค้าหมด</button>'
    + '</div></div>'
    + '<div class="form-acts">'
    +   '<button class="mini-btn" onclick="saveProduct(' + (isNew?'null':idx) + ')">💾 บันทึกสินค้า</button>'
    +   '<button class="mini-btn ghost" onclick="editState.product=null;renderAdminBody()">ยกเลิก</button>'
    + '</div></div>';
}
function pickProdIcon(ic){ pendingProdIcon = ic; $$('#iconProd button').forEach(function(b){ b.classList.toggle('sel', b.textContent===ic); }); }
function pickSoldOut(v){
  pendingSoldOut = v;
  var a = $('#pInStock'), b = $('#pSoldOut');
  if(a) a.classList.toggle('sel', !v);
  if(b) b.classList.toggle('sel', v);
}
function newProduct(){ editState.product = {}; pendingProdIcon='📦'; pendingSoldOut=false; renderAdminBody(); setTimeout(function(){ if($('#f-p-name')) $('#f-p-name').focus(); },60); }
function editProduct(i){
  var p = DB.products[i];
  editState.product = i; pendingProdIcon = p.icon||'📦'; pendingSoldOut = !!p.soldOut;
  renderAdminBody();
  setTimeout(function(){ if($('#f-p-name')) $('#f-p-name').focus(); window.scrollTo({top:200,behavior:'smooth'}); },60);
}
function saveProduct(idx){
  var v = function(id){ return ($('#'+id) && $('#'+id).value) || ''; };
  var name = v('f-p-name').trim();
  if(!name){ toast('ใส่ชื่อสินค้าก่อนนะ'); return; }
  var old = (idx!==null && idx!==undefined) ? DB.products[idx] : {};
  var rec = {
    name: name,
    desc: v('f-p-desc').trim(),
    price: +v('f-p-price') || 0,
    icon: pendingProdIcon,
    tag: v('f-p-tag').trim(),
    unit: v('f-p-unit').trim(),
    stock: v('f-p-stock').trim(),
    sku: v('f-p-sku').trim(),
    soldOut: pendingSoldOut,
    img: takeImage('prodImg', old.img || '')
  };
  DB.products = DB.products || [];
  if(idx === null || idx === undefined) DB.products.push(rec);
  else DB.products[idx] = rec;
  store.set('products', DB.products);
  editState.product = null;
  toast('บันทึกสินค้าแล้ว ✓');
  renderAdmin();
}
function dupProduct(i){
  var copy = Object.assign({}, DB.products[i], {name: DB.products[i].name + ' (สำเนา)'});
  DB.products.push(copy);
  store.set('products', DB.products);
  toast('ทำสำเนาแล้ว'); renderAdmin();
}
function delProduct(i){
  if(!confirm('ลบสินค้านี้?')) return;
  DB.products.splice(i,1);
  store.set('products', DB.products);
  toast('ลบแล้ว'); renderAdmin();
}

/* ==========================================================================
   BRANDING
   ========================================================================== */
function adminBrand(){
  var S = DB.settings;
  return ''
    + '<div class="panel"><h3>โลโก้เว็บไซต์</h3>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">โลโก้จะแสดงในแถบเมนูด้านบน ท้ายเว็บ และหน้าเข้าสู่ระบบ — แนะนำรูปสี่เหลี่ยมจัตุรัส 512×512 ขึ้นไป</p>'
    + uploadBox('brandLogo', S.logo || '', 512, false)
    + '<div class="hint">ถ้าไม่เลือกรูปใหม่ ระบบจะใช้ไฟล์ <code>assets/logo-why-chinese.png</code></div>'
    + '<button class="mini-btn" style="margin-top:14px" onclick="saveBrandLogo()">💾 บันทึกโลโก้</button>'
    + (S.logo ? '<div class="hint" style="color:var(--jade)">✓ ขณะนี้ใช้โลโก้ที่อัปโหลดเอง</div>' : '')
    + '</div>'

    + '<div class="panel"><h3>แบนเนอร์มุมขวาบน</h3>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">รูปขนาดเล็กที่แสดงข้างปุ่มโปรไฟล์บนแถบเมนู เหมาะกับป้ายโปรโมชันหรือโลโก้พันธมิตร — แนะนำรูปแนวนอน</p>'
    + uploadBox('brandBanner', S.banner || '', 700, true)
    + '<div class="field" style="margin-top:14px"><label>ลิงก์เมื่อคลิกแบนเนอร์ (ไม่บังคับ)</label>'
    + '<input id="f-b-bannerlink" value="' + esc(S.bannerLink||'') + '" placeholder="https://..."></div>'
    + '<button class="mini-btn" style="margin-top:6px" onclick="saveBrandBanner()">💾 บันทึกแบนเนอร์</button></div>'

    + '<div class="panel"><h3>ข้อความแบรนด์</h3>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ชื่อเว็บ (เมนูและท้ายเว็บ)</label><input id="f-b-name" value="' + esc(S.brandName) + '"></div>'
    +   '<div class="field"><label>ชื่อโรมัน/คำอ่าน</label><input id="f-b-latin" value="' + esc(S.brandLatin) + '"></div>'
    + '</div>'
    + '<div class="field"><label>ข้อความท้ายเว็บ (บรรทัดล่าง)</label><input id="f-b-tag" value="' + esc(S.footerTagline) + '"></div>'
    + '<div class="field"><label>คำอธิบายสั้นในท้ายเว็บ</label><textarea id="f-b-about">' + esc(S.footerAbout) + '</textarea></div>'
    + '<div class="field"><label>ลิขสิทธิ์</label><input id="f-b-copy" value="' + esc(S.copyright) + '"></div>'
    + '<button class="mini-btn" onclick="saveBrandText()">💾 บันทึกข้อความ</button></div>'

    + '<div class="panel"><h3>ข้อความหน้าร้านค้า</h3>'
    + '<div class="field"><label>หัวข้อร้านค้า</label><input id="f-b-shoptitle" value="' + esc(S.shopTitle||'ร้านค้า · 商店') + '"></div>'
    + '<div class="field"><label>คำโปรยร้านค้า</label><textarea id="f-b-shopsub">' + esc(S.shopSubtitle||'') + '</textarea></div>'
    + '<button class="mini-btn" onclick="saveShopText()">💾 บันทึกข้อความร้านค้า</button></div>';
}
function saveBrandLogo(){
  var v = takeImage('brandLogo', DB.settings.logo || '');
  DB.settings.logo = v;
  saveSettings();
  toast(v ? 'เปลี่ยนโลโก้แล้ว ✓' : 'กลับไปใช้โลโก้เริ่มต้นแล้ว');
  renderAdmin();
}
function saveBrandBanner(){
  DB.settings.banner = takeImage('brandBanner', DB.settings.banner || '');
  DB.settings.bannerLink = (($('#f-b-bannerlink') && $('#f-b-bannerlink').value) || '').trim();
  saveSettings();
  toast(DB.settings.banner ? 'บันทึกแบนเนอร์แล้ว ✓' : 'ลบแบนเนอร์แล้ว');
  renderAdmin();
}
function saveBrandText(){
  DB.settings.brandName = (($('#f-b-name') && $('#f-b-name').value) || '').trim() || '为什么中文';
  DB.settings.brandLatin = (($('#f-b-latin') && $('#f-b-latin').value) || '').trim();
  DB.settings.footerTagline = (($('#f-b-tag') && $('#f-b-tag').value) || '').trim();
  DB.settings.footerAbout = (($('#f-b-about') && $('#f-b-about').value) || '').trim();
  DB.settings.copyright = (($('#f-b-copy') && $('#f-b-copy').value) || '').trim();
  saveSettings();
  toast('บันทึกข้อความแบรนด์แล้ว ✓');
  renderAdmin();
}
function saveShopText(){
  DB.settings.shopTitle = (($('#f-b-shoptitle') && $('#f-b-shoptitle').value) || '').trim();
  DB.settings.shopSubtitle = (($('#f-b-shopsub') && $('#f-b-shopsub').value) || '').trim();
  saveSettings();
  toast('บันทึกข้อความร้านค้าแล้ว ✓');
  renderAdmin();
}

/* ==========================================================================
   CONTACT + SOCIAL
   ========================================================================== */
function adminSocial(){
  var S = DB.settings;
  var onCount = SOCIAL_DEFS.filter(function(d){ return (S.social[d.id]||{}).on; }).length;
  var readyCount = SOCIAL_DEFS.filter(function(d){
    var x = S.social[d.id]||{};
    return x.on && (x.handle || x.url);
  }).length;
  var boxes = [];
  SOCIAL_DEFS.forEach(function(d){
    var x = S.social[d.id] || {};
    var link = socialLink(d.id);
    var ok = !!(x.handle || x.url) && link && link !== '#';
    boxes.push('<a class="social-btn ' + d.id + ' ' + (ok?'':'empty') + '">'
      + '<span class="ico"><svg viewBox="0 0 24 24"><path d="' + socialIcon(d.id) + '"/></svg></span>'
      + '<span class="txt"><b>' + d.name + '</b><span>' + (x.handle || x.url ? esc(x.handle || x.url) : 'ยังไม่ได้ใส่ชื่อบัญชี') + '</span></span></a>');
  });

  return ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>🔗 ปุ่มติดตามโซเชียล</h3>'
    +   '<label style="font-size:13px;color:var(--text-2);display:flex;align-items:center;gap:7px">'
    +   '<input type="checkbox" ' + (S.showSocial!==false?'checked':'') + ' onchange="DB.settings.showSocial=this.checked;saveSettings();toast(\'อัปเดตแล้ว\')"> แสดงบล็อกนี้บนเว็บ</label></div>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">'
    +   'เปิดช่องทางที่คุณใช้ แล้วใส่ชื่อบัญชี (หรือลิงก์เต็มก็ได้) — ปุ่มจะไปโผล่ที่ '
    +   '<b>ท้ายเว็บทุกหน้า</b> และ <b>หน้าร้านค้า</b> อัตโนมัติ</p>'
    + '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:18px">'
    +   '<span class="stat-pill">เปิดใช้ <b>' + onCount + '</b> ช่องทาง</span>'
    +   '<span class="stat-pill">พร้อมแสดง <b>' + readyCount + '</b> ช่องทาง</span>'
    +   '<span class="stat-pill">ทั้งหมด <b>' + SOCIAL_DEFS.length + '</b> ช่องทาง</span>'
    + '</div>'
    + SOCIAL_DEFS.map(function(d){
        var x = S.social[d.id] || {};
        return '<div class="social-edit-row">'
          + '<div class="lbl"><span class="dot" style="background:' + d.color + '">'
          +   '<svg viewBox="0 0 24 24"><path d="' + socialIcon(d.id) + '"/></svg></span>' + d.name + '</div>'
          + '<div class="field" style="margin:0"><input value="' + esc(x.handle||'') + '" '
          +   'oninput="setSocial(\'' + d.id + '\',\'handle\',this.value)" placeholder="' + d.ph + '"></div>'
          + '<div style="display:flex;gap:9px;align-items:center">'
          +   '<div class="field" style="margin:0;flex:1"><input value="' + esc(x.url||'') + '" '
          +   'oninput="setSocial(\'' + d.id + '\',\'url\',this.value)" placeholder="หรือวางลิงก์เต็ม (ไม่บังคับ)"></div>'
          +   '<label style="font-size:12.5px;color:var(--text-2);display:flex;align-items:center;gap:6px;white-space:nowrap">'
          +   '<input type="checkbox" ' + (x.on?'checked':'') + ' onchange="setSocial(\'' + d.id + '\',\'on\',this.checked)"> เปิด</label>'
          + '</div></div>';
      }).join('')
    + '<div class="form-acts" style="margin-top:14px">'
    +   '<button class="mini-btn" onclick="saveSettings();toast(\'บันทึกโซเชียลแล้ว ✓\');renderAdmin()">💾 บันทึกทั้งหมด</button>'
    +   '<button class="mini-btn ghost" onclick="openLiveSite()">↗ ดูผลจริงบนเว็บ</button>'
    + '</div>'
    + '</div>'

    + '<div class="panel">'
    + '<h3>✏️ ข้อความหัวข้อ</h3>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">แก้ข้อความหัวข้อที่แสดงเหนือปุ่มโซเชียลได้ตามต้องการ</p>'
    + '<div class="grid2">'
    +   '<div class="field"><label>หัวข้อ (ท้ายเว็บทุกหน้า)</label>'
    +   '<input id="f-soc-head" value="' + esc(S.socialHeading||'') + '" placeholder="ติดตามเราได้ที่ · 关注我们"></div>'
    +   '<div class="field"><label>หัวข้อ (หน้าร้านค้า — เว้นว่างใช้ค่าเดียวกัน)</label>'
    +   '<input id="f-soc-shead" value="' + esc(S.shopSocialHeading||'') + '" placeholder="ติดตามเราได้ที่ · 关注我们"></div>'
    + '</div>'
    + '<div class="form-acts"><button class="mini-btn" onclick="saveSocialText()">💾 บันทึกหัวข้อ</button>'
    +   '<button class="mini-btn ghost" onclick="resetSocialHeading()">↺ ค่าเริ่มต้น</button></div>'
    + '</div>'

    + '<div class="panel">'
    + '<div class="panel-head"><h3>👁 ตัวอย่างที่แสดงจริง</h3>'
    +   '<span class="stat-pill">' + (S.showSocial!==false ? 'กำลังแสดงบนเว็บ' : 'ซ่อนอยู่') + '</span></div>'
    + '<p style="font-size:13px;color:var(--text-3);margin-bottom:14px">ตัวอย่างนี้จะอัปเดตเฉพาะเมื่อกด “บันทึกทั้งหมด”</p>'
    + '<div class="social-row" id="socialPreviewAdmin">' + boxes.join('') + '</div>'
    + '</div>';
}
function openLiveSite(){ toast('กำลังเปิดหน้าเว็บให้ดู…'); go('home'); }
function saveSocialText(){
  var h = ($('#f-soc-head') && $('#f-soc-head').value) || '';
  var sh = ($('#f-soc-shead') && $('#f-soc-shead').value) || '';
  DB.settings.socialHeading = h.trim() || 'ติดตามเราได้ที่ · 关注我们';
  DB.settings.shopSocialHeading = sh.trim();
  saveSettings();
  toast('บันทึกหัวข้อแล้ว ✓');
  renderAdmin();
}
function resetSocialHeading(){
  DB.settings.socialHeading = 'ติดตามเราได้ที่ · 关注我们';
  DB.settings.shopSocialHeading = '';
  saveSettings();
  toast('คืนค่าเริ่มต้นแล้ว');
  renderAdmin();
}

function adminContact(){
  var S = DB.settings;
  return ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>📞 ช่องทางติดต่อ</h3>'
    +   '<div style="display:flex;gap:12px;align-items:center">'
    +   '<label style="font-size:13px;color:var(--text-2);display:flex;align-items:center;gap:7px">'
    +   '<input type="checkbox" ' + (S.showContact!==false?'checked':'') + ' onchange="DB.settings.showContact=this.checked;saveSettings();toast(\'อัปเดตแล้ว\')"> แสดงผล</label>'
    +   '<button class="mini-btn" onclick="addContactRow()">+ เพิ่มช่องทาง</button></div></div>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">'
    +   'แสดงทั้งใน<b>ท้ายเว็บ</b>และ<b>หน้าร้านค้า</b> — ช่องที่เว้นว่างจะไม่แสดงบนเว็บ</p>'
    + '<div>'
    + ((S.contact||[]).map(function(c,i){
        return '<div class="social-edit-row" style="grid-template-columns:96px 1fr 1.4fr auto">'
          + '<div class="field" style="margin:0"><input value="' + esc(c.icon||'') + '" oninput="setContact(' + i + ',\'icon\',this.value)" placeholder="📧" style="text-align:center;font-size:18px"></div>'
          + '<div class="field" style="margin:0"><input value="' + esc(c.label||'') + '" oninput="setContact(' + i + ',\'label\',this.value)" placeholder="ชื่อช่องทาง เช่น อีเมล"></div>'
          + '<div class="field" style="margin:0"><input value="' + esc(c.value||'') + '" oninput="setContact(' + i + ',\'value\',this.value)" placeholder="ค่า เช่น hello@example.com"></div>'
          + '<button class="icon-btn" onclick="delContactRow(' + i + ')">🗑</button></div>';
      }).join('') || '<div class="empty">ยังไม่มีช่องทางติดต่อ — กด “เพิ่มช่องทาง” ด้านบน</div>')
    + '</div>'
    + '<div class="form-acts" style="margin-top:12px">'
    +   '<button class="mini-btn" onclick="saveSettings();toast(\'บันทึกช่องทางติดต่อแล้ว ✓\');renderAdmin()">💾 บันทึกทั้งหมด</button>'
    + '</div>'
    + '</div>'

    + '<div class="panel">'
    + '<h3>✏️ ข้อความหัวข้อ</h3>'
    + '<div class="grid2">'
    +   '<div class="field"><label>หัวข้อ</label>'
    +   '<input id="f-con-head" value="' + esc(S.contactHeading||'') + '" placeholder="ช่องทางติดต่อ · 联系我们"></div>'
    +   '<div class="field"><label>คำอธิบายใต้หัวข้อ (เว้นว่างเพื่อซ่อน)</label>'
    +   '<input id="f-con-intro" value="' + esc(S.contactIntro||'') + '" placeholder="สอบถามเรื่องสินค้า การสั่งซื้อ หรือสื่อการเรียนเพิ่มเติม"></div>'
    + '</div>'
    + '<div class="form-acts"><button class="mini-btn" onclick="saveContactText()">💾 บันทึกหัวข้อ</button></div>'
    + '</div>';
}
function saveContactText(){
  var h = ($('#f-con-head') && $('#f-con-head').value) || '';
  var i = ($('#f-con-intro') && $('#f-con-intro').value) || '';
  DB.settings.contactHeading = h.trim() || 'ช่องทางติดต่อ · 联系我们';
  DB.settings.contactIntro = i.trim();
  saveSettings();
  toast('บันทึกหัวข้อแล้ว ✓');
  renderAdmin();
}

function setContact(i, key, value){
  DB.settings.contact[i] = DB.settings.contact[i] || {};
  DB.settings.contact[i][key] = value;
}
function addContactRow(){
  DB.settings.contact = DB.settings.contact || [];
  DB.settings.contact.push({icon:'📌', label:'', value:''});
  saveSettings(); renderAdminBody();
}
function delContactRow(i){
  DB.settings.contact.splice(i,1);
  saveSettings(); renderAdminBody();
}
function setSocial(id, key, value){
  DB.settings.social[id] = DB.settings.social[id] || {};
  DB.settings.social[id][key] = value;
}

/* ==========================================================================
   USERS
   ========================================================================== */
function adminCloudUsers(){
  return '<div class="panel"><h3>☁️ ผู้ใช้บนคลาวด์ (Supabase)</h3>'
    + '<p style="font-size:13px;color:var(--text-2);margin-bottom:12px">'
    + (typeof sbConfigured === 'function' && sbConfigured()
      ? 'เชื่อมต่อคลาวด์แล้ว — รายชื่อด้านล่าง sync แบบเรียลไทม์ · เติมพรีเมียม/เหรียญได้จากเครื่องใดก็ได้'
      : 'ยังไม่ได้ตั้งค่า Supabase (assets/supabase-config.js) — เติม URL + anon key แล้วอัปโหลดเว็บใหม่')
    + '</p><div id="cloudUsersBox"><button class="mini-btn" onclick="refreshCloudUsers()">โหลดรายชื่อผู้ใช้</button></div></div>';
}
function refreshCloudUsers(){
  if(typeof sbListProfiles !== 'function') return;
  var box = $('#cloudUsersBox'); if(!box) return;
  box.innerHTML = '<span style="font-size:12.5px;color:var(--text-3)">กำลังโหลด…</span>';
  sbListProfiles().then(function(list){
    box.innerHTML = list.length ? list.map(function(p){
      var acts = '<button class="mini-btn" onclick="cloudGrant(\'' + p.email + '\',\'m6\')">พรีเมียม 6 เดือน</button>'
        + '<button class="mini-btn ghost" onclick="cloudGrantCoins(\'' + p.email + '\')">+50 เหรียญ</button>';
      return '<div class="activity"><span class="ic">' + avatarHTML(p.avatar||'龍') + '</span>'
        + '<span class="txt"><b>' + esc(p.name||'') + '</b>' + (p.is_admin?' <span class="tag-pill red">แอดมิน</span>':'')
        + '<br><span style="font-size:11.5px;color:var(--text-3)">' + esc(p.email||'') + ' · แต้ม ' + (+p.points||0)
        + ' · เหรียญ ' + (+p.weiqian||0) + (p.premium_plan ? ' · พรีเมียม ' + p.premium_plan : '') + '</span></span>'
        + '<span class="pts">' + acts + '</span></div>';
    }).join('') : '<div class="empty">ยังไม่มีผู้ใช้บนคลาวด์</div>';
  });
}
function cloudGrant(email, plan){
  if(typeof sbGrantPremium !== 'function') return;
  sbGrantPremium(email, plan, 6).then(function(ok){ toast(ok ? 'ให้พรีเมียมแล้ว ⚡' : 'ไม่พบผู้ใช้'); refreshCloudUsers(); });
}
function cloudGrantCoins(email){
  if(typeof sbGrantCoins !== 'function') return;
  sbGrantCoins(email, 50).then(function(ok){ toast(ok ? 'เติมเหรียญแล้ว ⚡' : 'ไม่พบผู้ใช้'); refreshCloudUsers(); });
}
function adminUsers(){
  if(!USERS.length) return adminCloudUsers() + '<div class="panel"><h3>ผู้ใช้</h3><div class="empty"><span class="ic">👤</span>ยังไม่มีผู้ใช้ลงทะเบียนในเบราว์เซอร์นี้</div></div>';
  return ''
    + '<div class="panel"><h3>ผู้ใช้ทั้งหมด (' + USERS.length + ')</h3>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">บัญชีผู้เรียนถูกเก็บในเบราว์เซอร์นี้เท่านั้น — แก้ไขข้อมูล รีเซ็ตความก้าวหน้า หรือลบบัญชีได้จากที่นี่</p>'
    + USERS.map(function(u){
        var stars = Object.values(u.gameStars||{}).reduce(function(a,b){return a+b;},0);
        var me = (currentUser() && u.id===currentUser().id);
        return '<div class="row-card"><div class="top">'
          + '<div style="width:50px;height:50px;border-radius:50%;display:grid;place-items:center;font-size:25px;background:var(--bg-2);flex:0 0 auto">' + u.avatar + '</div>'
          + '<div class="txt"><b>' + esc(u.name) + ' ' + (me?'<span class="tag-pill jade">กำลังใช้</span>':'') + '</b>'
          + '<small>Lv ' + levelOf(u.xp) + ' · ' + (u.points||0).toLocaleString() + ' แต้ม · อ่าน ' + (u.read||[]).length + ' บท · ดาว ' + stars + ' · ประเมิน HSK ' + (hskEstimate(u)||'–') + ' · streak ' + (u.streak||0) + ' วัน</small></div>'
          + '<div class="acts">'
          + '<button class="icon-btn ok" title="แก้ไขข้อมูล" onclick="editUser(\'' + u.id + '\')">✏️</button>'
          + '<button class="icon-btn warn" title="รีเซ็ตความก้าวหน้า" onclick="adminResetUser(\'' + u.id + '\')">↺</button>'
          + '<button class="icon-btn" title="ลบบัญชี" onclick="adminDelUser(\'' + u.id + '\')">🗑</button>'
          + '</div></div></div>';
      }).join('')
    + '</div>'
    + '<div class="panel" id="userEditPanel" style="display:none"></div>';
}
function editUser(id){
  var u = USERS.filter(function(x){return x.id===id;})[0]; if(!u) return;
  var p = $('#userEditPanel');
  p.style.display = '';
  p.innerHTML = ''
    + '<h3>แก้ไขข้อมูลผู้ใช้: ' + esc(u.name) + '</h3>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ชื่อที่แสดง</label><input id="f-u-name" value="' + esc(u.name) + '"></div>'
    +   '<div class="field"><label>วันเกิด</label><input id="f-u-birth" type="date" value="' + (u.birthday||'') + '"></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>แต้ม</label><input id="f-u-points" type="number" value="' + (u.points||0) + '"></div>'
    +   '<div class="field"><label>XP</label><input id="f-u-xp" type="number" value="' + (u.xp||0) + '"></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>หัวใจ</label><input id="f-u-hp" type="number" value="' + (u.hp||maxHp()) + '"></div>'
    +   '<div class="field"><label>Streak (วัน)</label><input id="f-u-streak" type="number" value="' + (u.streak||0) + '"></div>'
    + '</div>'
    + '<div class="field"><label>รูปโปรไฟล์</label><div class="emoji-picker">'
    +   AVATARS.map(function(e){ return '<button class="emoji-opt ' + (e===u.avatar?'sel':'') + '" onclick="pickAdminAvatar(\'' + e + '\')">' + e + '</button>'; }).join('')
    + '</div></div>'
    + '<div class="form-acts">'
    +   '<button class="mini-btn" onclick="saveUser(\'' + u.id + '\')">💾 บันทึก</button>'
    +   '<button class="mini-btn ghost" onclick="document.getElementById(\'userEditPanel\').style.display=\'none\'">ปิด</button>'
    + '</div>';
  p.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function pickAdminAvatar(e){
  adminPickAvatar = e;
  $$('#userEditPanel .emoji-opt').forEach(function(b){ b.classList.toggle('sel', b.textContent===e); });
}
function saveUser(id){
  var u = USERS.filter(function(x){return x.id===id;})[0]; if(!u) return;
  var g = function(k){ return $('#'+k) ? $('#'+k).value : null; };
  u.name = esc(((g('f-u-name')||'').trim()) || u.name);
  u.birthday = g('f-u-birth') || u.birthday;
  u.points = +g('f-u-points') || 0;
  u.xp = +g('f-u-xp') || 0;
  u.hp = Math.min(maxHp(), +g('f-u-hp') || maxHp());
  u.streak = +g('f-u-streak') || 0;
  if(adminPickAvatar) u.avatar = adminPickAvatar;
  saveUsers();
  adminPickAvatar = null;
  toast('บันทึกข้อมูลผู้ใช้แล้ว ✓');
  renderUserChip(); renderAdmin();
}
function adminResetUser(id){
  var u = USERS.filter(function(x){return x.id===id;})[0]; if(!u) return;
  if(!confirm('รีเซ็ตความก้าวหน้าของ ' + u.name + ' ?')) return;
  u.xp = 0; u.points = 0; u.read = []; u.gameStars = {}; u.gameBest = {};
  u.history = []; u.badges = []; u.streak = 0; u.hp = maxHp();
  saveUsers();
  toast('รีเซ็ตแล้ว');
  renderAdmin(); renderUserChip();
}
function adminDelUser(id){
  var u = USERS.filter(function(x){return x.id===id;})[0]; if(!u) return;
  if(!confirm('ลบบัญชี ' + u.name + ' ?')) return;
  USERS = USERS.filter(function(x){ return x.id !== id; });
  saveUsers();
  if(session && session.uid === id){ session = null; saveSession(); }
  toast('ลบบัญชีแล้ว');
  renderAdmin(); renderUserChip();
}

/* ==========================================================================
   SETTINGS
   ========================================================================== */
function adminSettings(){
  var A = DB.auth || {user:'admin'};
  var g = DB.settings.game || {};
  return ''
    + '<div class="panel"><h3>🔐 บัญชีผู้ดูแลหลังบ้าน</h3>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">เปลี่ยนอีเมลและรหัสผ่านผู้ดูแล — ใช้เข้าหลังบ้านทุกครั้ง</p>'
    + '<div class="grid2">'
    +   '<div class="field"><label>อีเมลผู้ดูแล</label><input id="f-s-user" type="email" value="' + esc(A.email||A.user||'admin') + '" placeholder="admin@example.com"></div>'
    +   '<div class="field"><label>รหัสผ่านใหม่</label><input id="f-s-pwd" type="password" placeholder="เว้นว่างถ้าไม่เปลี่ยน"></div>'
    + '</div>'
    + '<div class="field"><label>ยืนยันรหัสผ่านใหม่</label><input id="f-s-pwd2" type="password" placeholder="พิมพ์รหัสอีกครั้ง"></div>'
    + '<button class="mini-btn" onclick="saveAdminAuth()">💾 บันทึกบัญชีผู้ดูแล</button>'
    + '<div class="hint">⚠️ จดเก็บไว้ให้ดี — ถ้าลืมต้องล้างข้อมูลเว็บในเบราว์เซอร์จึงจะกลับไปใช้ค่าเริ่มต้น (admin / admin123)</div>'
    + '</div>'

    + '<div class="panel"><h3>🎮 กติกาของเกม</h3>'
    + '<div class="grid2">'
    +   '<div class="field"><label>จำนวนข้อต่อหนึ่งด่าน</label><input id="f-g-perlevel" type="number" min="4" max="30" value="' + (g.perLevel||10) + '"></div>'
    +   '<div class="field"><label>เปอร์เซ็นต์ที่ถือว่าผ่านด่าน</label><input id="f-g-pass" type="number" min="30" max="100" value="' + (g.passPct||70) + '"></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>เปอร์เซ็นต์ที่ได้ 3 ดาว</label><input id="f-g-star3" type="number" min="50" max="100" value="' + (g.star3Pct||90) + '"></div>'
    +   '<div class="field"><label>หัวใจสูงสุดของผู้เล่น</label><input id="f-g-hp" type="number" min="1" max="20" value="' + (g.hp||5) + '"></div>'
    + '</div>'
    + '<div class="field"><label>นาทีต่อการฟื้นหัวใจ 1 ดวง</label><input id="f-g-regen" type="number" min="1" max="180" value="' + (g.hpRegenMin||12) + '"></div>'
    + '<button class="mini-btn" onclick="saveGameRules()">💾 บันทึกกติกาเกม</button></div>'

    + '<div class="panel"><h3>💾 สำรองและกู้คืนข้อมูล</h3>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:14px">ดาวน์โหลดข้อมูลเก็บไว้ หรือวางข้อมูลสำรองแล้วกดกู้คืน (ทับข้อมูลปัจจุบัน)</p>'
    + '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:16px">'
    +   '<button class="mini-btn" onclick="exportData(\'articles\')">⬇ บทความ</button>'
    +   '<button class="mini-btn" onclick="exportData(\'hsk\')">⬇ คำศัพท์ HSK</button>'
    +   '<button class="mini-btn" onclick="exportData(\'cat\')">⬇ หมวดคำศัพท์</button>'
    +   '<button class="mini-btn" onclick="exportData(\'games\')">⬇ คลังเกม</button>'
    +   '<button class="mini-btn" onclick="exportData(\'products\')">⬇ สินค้า</button>'
    +   '<button class="mini-btn ghost" onclick="exportData(\'all\')">⬇ ทั้งหมด</button>'
    + '</div>'
    + '<div class="field"><label>กู้คืนจากข้อมูลสำรอง (JSON)</label><textarea id="restoreText" style="min-height:100px" placeholder="{...}"></textarea></div>'
    + '<div class="field"><label>กู้คืนเฉพาะส่วน</label><select id="restorePart">'
    +   '<option value="articles">บทความ</option><option value="hsk">คำศัพท์ HSK</option>'
    +   '<option value="cats">หมวดคำศัพท์</option><option value="games">คลังเกม</option>'
    +   '<option value="products">สินค้า</option><option value="settings">ตั้งค่าเว็บ</option>'
    + '</select></div>'
    + '<button class="mini-btn" onclick="restoreData()">⬆ กู้คืนข้อมูล</button></div>'

    + '<div class="panel"><h3 style="color:var(--red)">⚠️ รีเซ็ตข้อมูล</h3>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:14px">ล้างเฉพาะส่วนที่ต้องการ — บัญชีผู้ใช้และบัญชีผู้ดูแลจะไม่ถูกลบ</p>'
    + '<div style="display:flex;gap:9px;flex-wrap:wrap">'
    +   '<button class="mini-btn ghost" onclick="resetPart(\'articles\')">↺ บทความ</button>'
    +   '<button class="mini-btn ghost" onclick="resetPart(\'hsk\')">↺ คำศัพท์ HSK</button>'
    +   '<button class="mini-btn ghost" onclick="resetPart(\'cats\')">↺ หมวดคำศัพท์</button>'
    +   '<button class="mini-btn ghost" onclick="resetPart(\'games\')">↺ คลังเกม</button>'
    +   '<button class="mini-btn ghost" onclick="resetPart(\'products\')">↺ สินค้า</button>'
    +   '<button class="mini-btn ghost" onclick="resetPart(\'settings\')">↺ ตั้งค่าเว็บ</button>'
    +   '<button class="mini-btn danger" onclick="resetEverything()">☠ ล้างข้อมูลทั้งหมด</button>'
    + '</div></div>';
}
function saveAdminAuth(){
  var u = (($('#f-s-user') && $('#f-s-user').value) || '').trim().toLowerCase();
  var p = ($('#f-s-pwd') && $('#f-s-pwd').value) || '';
  var p2 = ($('#f-s-pwd2') && $('#f-s-pwd2').value) || '';
  if(!u || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)){ toast('ใส่อีเมลผู้ดูแลให้ถูกต้อง'); return; }
  if(p || p2){
    if(p !== p2){ toast('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
    if(p.length < 6){ toast('รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร'); return; }
  }
  DB.auth = {email:u, pwd: p ? p : ((DB.auth && DB.auth.pwd) || 'admin123')};
  store.set('auth', DB.auth);
  ['f-s-pwd','f-s-pwd2'].forEach(function(id){ var e = $('#'+id); if(e) e.value=''; });
  toast('บันทึกบัญชีผู้ดูแลแล้ว ✓ — ครั้งต่อไปใช้อีเมลนี้เข้าสู่ระบบ');
  renderAdmin();
}
function saveGameRules(){
  var v = function(id, d){ return +($('#'+id) && $('#'+id).value) || d; };
  DB.settings.game = {
    perLevel: Math.max(4, Math.min(30, v('f-g-perlevel', 10))),
    passPct: Math.max(30, Math.min(100, v('f-g-pass', 70))),
    star3Pct: Math.max(50, Math.min(100, v('f-g-star3', 90))),
    hp: Math.max(1, Math.min(20, v('f-g-hp', 5))),
    hpRegenMin: Math.max(1, Math.min(180, v('f-g-regen', 12)))
  };
  saveSettings();
  toast('บันทึกกติกาเกมแล้ว ✓');
  renderAdmin();
}
function restoreData(){
  var raw = (($('#restoreText') && $('#restoreText').value) || '').trim();
  var part = ($('#restorePart') && $('#restorePart').value) || 'articles';
  if(!raw){ toast('ยังไม่ได้วางข้อมูล'); return; }
  var obj;
  try{ obj = JSON.parse(raw); }catch(e){ toast('รูปแบบ JSON ไม่ถูกต้อง'); return; }
  if(!confirm('กู้คืนข้อมูลส่วน "' + part + '" — ข้อมูลปัจจุบันจะถูกแทนที่')) return;
  if(part === 'articles'){ DB.articles = Array.isArray(obj) ? obj : []; store.set('articles', DB.articles); }
  if(part === 'hsk'){ DB.hsk = obj; store.set('hsk', DB.hsk); }
  if(part === 'cats'){ DB.cats = obj; store.set('cats', DB.cats); }
  if(part === 'games'){ DB.games = obj; store.set('games', DB.games); }
  if(part === 'products'){ DB.products = obj; store.set('products', DB.products); }
  if(part === 'pages'){ DB.pages = Array.isArray(obj) ? obj : []; store.set('pages', DB.pages); renderNavMenu(); }
  if(part === 'blog'){ DB.blog = Array.isArray(obj) ? obj : []; store.set('blog', DB.blog); }
  if(part === 'gameCats'){ DB.gameCats = Array.isArray(obj) ? obj : []; store.set('gameCats', DB.gameCats); }
  if(part === 'nav'){ DB.nav = Array.isArray(obj) ? obj : JSON.parse(JSON.stringify(DEFAULT_NAV)); store.set('nav', DB.nav); renderNavMenu(); }
  if(part === 'theme'){ DB.theme = Object.assign({}, DEFAULT_THEME, obj); DB.theme.colors = Object.assign({}, DEFAULT_THEME.colors, (obj||{}).colors||{}); saveTheme(); }
  if(part === 'daily'){ DB.daily = Object.assign({}, DEFAULT_DAILY, obj); saveDaily(); }
  if(part === 'settings'){
    DB.settings = Object.assign({}, DEFAULT_SETTINGS, obj);
    DB.settings.social = Object.assign({}, DEFAULT_SETTINGS.social, obj.social || {});
    DB.settings.game = Object.assign({}, DEFAULT_SETTINGS.game, obj.game || {});
    saveSettings();
  }
  toast('กู้คืนข้อมูลแล้ว ✓');
  renderAdmin();
}
function resetPart(part){
  if(!confirm('คืนค่าเริ่มต้นของส่วนนี้?')) return;
  if(part === 'articles'){ store.del('articles'); DB.articles = DEFAULT_ARTICLES.slice(); }
  if(part === 'hsk'){ buildHskDefault(); store.set('hsk', DB.hsk); }
  if(part === 'cats'){
    DB.cats = {};
    Object.keys(CATS).forEach(function(k){ DB.cats[catKey(k)] = CATS[k].slice(); });
    store.set('cats', DB.cats);
  }
  if(part === 'games'){
    DB.games = {};
    GAME_DEFS.forEach(function(d){ DB.games[d.id] = ((D.games && D.games[d.id]) || []).slice(); });
    store.set('games', DB.games);
  }
  if(part === 'products'){ DB.products = DEFAULT_PRODUCTS.slice(); store.set('products', DB.products); }
  if(part === 'settings'){ DB.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); saveSettings(); }
  if(part === 'theme'){ DB.theme = JSON.parse(JSON.stringify(DEFAULT_THEME)); DB.theme.on = false; saveTheme(); }
  if(part === 'pages'){ DB.pages = JSON.parse(JSON.stringify(DEFAULT_PAGES)); store.set('pages', DB.pages); renderNavMenu(); }
  if(part === 'blog'){ DB.blog = []; store.set('blog', DB.blog); }
  if(part === 'gameCats'){ DB.gameCats = []; store.set('gameCats', DB.gameCats); }
  if(part === 'nav'){ DB.nav = JSON.parse(JSON.stringify(DEFAULT_NAV)); store.set('nav', DB.nav); renderNavMenu(); }
  if(part === 'daily'){ DB.daily = JSON.parse(JSON.stringify(DEFAULT_DAILY)); saveDaily(); }
  toast('คืนค่าเริ่มต้นแล้ว');
  renderAdmin();
}
function buildHskDefault(){
  var out = {};
  for(var i=1;i<=6;i++) out[i] = [];
  Object.keys(HSK || {}).forEach(function(k){
    var lv = String(k);
    if(!out[lv]) out[lv] = [];
    (HSK[k]||[]).forEach(function(w){
      if(!w || !w.cn) return;
      if(out[lv].some(function(x){return x.cn===w.cn;})) return;
      out[lv].push(w);
    });
  });
  DB.hsk = out;
}
function resetEverything(){
  if(!confirm('ล้างข้อมูลเนื้อหาทั้งหมดกลับเป็นค่าเริ่มต้น? (บทความ คำศัพท์ หมวด เกม สินค้า และตั้งค่า)')) return;
  ['articles','hsk','cats','games','products','settings','fill','theme','daily','pages','blog','gameCats'].forEach(function(k){ store.del(k); });
  location.reload();
}

/* --------------------------------------------------------------------------
   SEARCH INPUTS — debounce + คืนโฟกัสหลัง re-render (กันช่องค้นหาหลุด)
-------------------------------------------------------------------------- */
var _searchTimers = {};
function onAdminSearch(input, key, customSet){
  if(customSet) customSet(input.value);
  else adminSearch[key] = input.value;
  var pos = input.selectionStart;
  var val = input.value;
  clearTimeout(_searchTimers[key]);
  _searchTimers[key] = setTimeout(function(){
    renderAdminBody();
    /* คืนโฟกัสให้ช่องค้นหาเดิม พิมพ์ต่อได้ทันที (กันบางเบราว์เซอร์ตัดโฟกัส) */
    var restore = function(){
      var el = document.querySelector('#adminBody input[data-search="' + key + '"]');
      if(!el) return;
      el.focus();
      var p = Math.min(pos, el.value.length);
      try{ el.setSelectionRange(p, p); }catch(e){}
    };
    restore();
    setTimeout(restore, 0);
    if(typeof requestAnimationFrame === 'function') requestAnimationFrame(restore);
  }, 260);
}

/* helpers */
function toggleRow(id){ var e = $('#'+id); if(e) e.classList.toggle('open'); }
function toggleBox(id){ var e = $('#'+id); if(e) e.classList.toggle('open'); }

/* ==========================================================================
   🎨 THEME — จัดการสีและหน้าตาทั้งเว็บ
   ========================================================================== */
var COLOR_LABELS = {
  '--bg':      'พื้นหลังเว็บ',
  '--bg-2':    'พื้นหลังรอง',
  '--paper':   'สีการ์ด / กระดาษ',
  '--brown':   'สีน้ำตาลหลัก',
  '--brown-3': 'สีน้ำตาลเข้ม (หัวข้อ)',
  '--red':     'สีแดงหลัก (แบรนด์)',
  '--red-dark':'สีแดงเข้ม',
  '--gold':    'สีทอง',
  '--text':    'สีตัวอักษรหลัก',
  '--text-2':  'สีตัวอักษรรอง'
};
function adminTheme(){
  var T = DB.theme || DEFAULT_THEME;
  var on = T.on !== false;
  var presetNames = Object.keys(THEME_PRESETS);
  var current = '';
  presetNames.forEach(function(n){
    var p = THEME_PRESETS[n], same = true;
    Object.keys(p).forEach(function(k){ if((T.colors[k]||'') !== p[k]) same = false; });
    if(same) current = n;
  });
  return ''
  + '<div class="panel">'
  + '<div class="panel-head"><h3>🎨 ชุดสีสำเร็จรูป</h3>'
  +   '<label style="font-size:13px;color:var(--text-2);display:flex;align-items:center;gap:7px">'
  +   '<input type="checkbox" ' + (on?'checked':'') + ' onchange="DB.theme.on=this.checked;saveTheme();toast(\'อัปเดตแล้ว\')"> ใช้ชุดสีที่กำหนดเอง</label></div>'
  + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">กดเลือกชุดสีที่ชอบได้เลย — ระบบจะเปลี่ยนสีทั้งเว็บให้ทันที (รวมถึงหลังบ้าน)</p>'
  + '<div class="preset-grid">'
  +   presetNames.map(function(n){
        var p = THEME_PRESETS[n];
        return '<button class="preset-swatch ' + (current===n?'sel':'') + '" onclick="applyPreset(\'' + n + '\')">'
          + '<span class="dots">'
          +   '<i style="background:' + p['--red'] + '"></i>'
          +   '<i style="background:' + p['--gold'] + '"></i>'
          +   '<i style="background:' + p['--bg'] + '"></i>'
          +   '<i style="background:' + p['--brown-3'] + '"></i>'
          + '</span>' + n + '</button>';
      }).join('')
  + '</div>'
  + '<div style="display:flex;gap:9px;flex-wrap:wrap">'
  +   '<button class="mini-btn ghost" onclick="resetTheme()">↺ คืนค่าเริ่มต้นทั้งหมด</button>'
  +   '<button class="mini-btn ghost" onclick="go(\'home\')">↗ ดูผลจริงบนเว็บ</button>'
  + '</div>'
  + '</div>'

  + '<div class="panel">'
  + '<h3>🎯 กำหนดสีเองทีละสี</h3>'
  + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">เปลี่ยนแล้วเห็นผลทันที — ไม่ต้องกดบันทึก</p>'
  + Object.keys(COLOR_LABELS).map(function(k){
      var v = (T.colors && T.colors[k]) || DEFAULT_THEME.colors[k];
      return '<div class="color-row">'
        + '<label>' + COLOR_LABELS[k] + '<br><span style="font-size:11px;color:var(--text-3);font-family:monospace">' + k + '</span></label>'
        + '<input type="color" value="' + v + '" oninput="setThemeColor(\'' + k + '\',this.value);this.nextElementSibling.value=this.value">'
        + '<input type="text" value="' + v + '" oninput="setThemeColor(\'' + k + '\',this.value);this.previousElementSibling.value=this.value">'
        + '</div>';
    }).join('')
  + '</div>'

  + '<div class="panel">'
  + '<h3>🔤 ฟอนต์ทั้งเว็บ</h3>'
  + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">เปลี่ยนได้ทุกเมื่อ จะได้ไม่ต้องแก้โค้ดทีหลัง</p>'
  + '<div class="grid2">'
  +   '<div class="field"><label>ฟอนต์เนื้อหาทั่วไป</label><select id="f-font-th" onchange="DB.theme.fontThai=this.value;saveTheme()">'
  +     [['th','IBM Plex Sans Thai (ไม่มีหัว)'],['th2','Noto Sans Thai'],['serif','Noto Serif Thai (มีหัว)']].map(function(o){
          return '<option value="' + o[0] + '" ' + ((T.fontThai||'th')===o[0]?'selected':'') + '>' + o[1] + '</option>';
        }).join('')
  +   '</select></div>'
  +   '<div class="field"><label>ฟอนต์หัวข้อ</label><select id="f-font-head" onchange="DB.theme.fontHead=this.value;saveTheme()">'
  +     [['th','IBM Plex Sans Thai (ไม่มีหัว)'],['th2','Noto Sans Thai'],['serif','Noto Serif Thai (มีหัว)']].map(function(o){
          return '<option value="' + o[0] + '" ' + ((T.fontHead||'head')===o[0]?'selected':'') + '>' + o[1] + '</option>';
        }).join('')
  +   '</select></div>'
  + '</div>'
  + '<div class="grid2">'
  +   '<div class="field"><label>ฟอนต์ตัวเลข</label><select id="f-font-num" onchange="DB.theme.fontNum=this.value;saveTheme()">'
  +     [['th','Plus Jakarta Sans'],['th2','IBM Plex Sans Thai'],['serif','Cormorant Garamond (มีหัว)']].map(function(o){
          return '<option value="' + o[0] + '" ' + ((T.fontNum||'num')===o[0]?'selected':'') + '>' + o[1] + '</option>';
        }).join('')
  +   '</select></div>'
  +   '<div class="field"><label>น้ำหนักหัวข้อ</label><select id="f-font-hw" onchange="DB.theme.headingWeight=+this.value;saveTheme()">'
  +     [600,700,800].map(function(w){ return '<option value="' + w + '" ' + (+T.headingWeight===w?'selected':'') + '>' + w + '</option>'; }).join('')
  +   '</select></div>'
  + '</div>'
  + '<div class="grid2">'
  +   '<div class="field"><label>น้ำหนักเนื้อหา</label><select onchange="DB.theme.bodyWeight=+this.value;saveTheme()">'
  +     [300,400,500].map(function(w){ return '<option value="' + w + '" ' + (+T.bodyWeight===w?'selected':'') + '>' + w + '</option>'; }).join('')
  +   '</select></div>'
  +   '<div class="field"><label>ขนาดตัวอักษรทั้งเว็บ (%)</label><select onchange="DB.theme.fontScale=+this.value;saveTheme()">'
  +     [90,95,100,105,110,115,120].map(function(w){ return '<option value="' + w + '" ' + (+T.fontScale===w?'selected':'') + '>' + w + '%</option>'; }).join('')
  +   '</select></div>'
  + '</div>'
  + '</div>'

  + '<div class="panel">'
  + '<h3>📐 รูปร่างและระยะห่าง</h3>'
  + '<div class="range-row"><label>ความมนของมุม</label>'
  +   '<input type="range" min="0" max="40" value="' + (T.radius!=null?T.radius:20) + '" oninput="setThemeNum(\'radius\',this.value);this.nextElementSibling.value=this.value+\'px\'">'
  +   '<output>' + (T.radius!=null?T.radius:20) + 'px</output></div>'
  + '<div class="range-row"><label>ความโปร่งของระยะห่าง</label>'
  +   '<input type="range" min="40" max="130" value="' + (T.density!=null?T.density:70) + '" oninput="setThemeNum(\'density\',this.value);this.nextElementSibling.value=this.value+\'%\'">'
  +   '<output>' + (T.density!=null?T.density:70) + '%</output></div>'
  + '<div class="range-row"><label>ขนาดตัวอักษรทั้งเว็บ</label>'
  +   '<input type="range" min="85" max="120" value="' + (T.fontScale!=null?T.fontScale:100) + '" oninput="setThemeNum(\'fontScale\',this.value);this.nextElementSibling.value=this.value+\'%\'">'
  +   '<output>' + (T.fontScale!=null?T.fontScale:100) + '%</output></div>'
  + '</div>';
}
function saveTheme(){ store.set('theme', DB.theme); applyTheme(); }
function applyPreset(name){
  var p = THEME_PRESETS[name]; if(!p) return;
  DB.theme.colors = Object.assign({}, DEFAULT_THEME.colors, p);
  DB.theme.on = true;
  saveTheme();
  toast('ใช้ชุดสี “' + name + '” แล้ว');
  renderAdmin();
}
function setThemeColor(key, val){
  if(!DB.theme.colors) DB.theme.colors = {};
  DB.theme.colors[key] = val;
  DB.theme.on = true;
  saveTheme();
}
function setThemeNum(key, val){
  DB.theme[key] = +val;
  DB.theme.on = true;
  saveTheme();
}
function resetTheme(){
  if(!confirm('คืนค่าสีและหน้าตาทั้งหมดกลับเป็นค่าเริ่มต้น?')) return;
  DB.theme = JSON.parse(JSON.stringify(DEFAULT_THEME));
  DB.theme.on = false;
  saveTheme();
  toast('คืนค่าเริ่มต้นแล้ว');
  renderAdmin();
}

/* ==========================================================================
   📅 DAILY CHINESE — ควบคุมคำศัพท์ประจำวัน
   ========================================================================== */
function adminDaily(){
  var D = DB.daily || DEFAULT_DAILY;
  var pinned = D.mode === 'pin' ? findWordById(D.pinId) : null;
  var today = getDailyWord();
  var pool = dailyPool();
  var q = (adminSearch.daily || '').toLowerCase();

  var picker = [];
  [1,2,3,4,5,6].forEach(function(n){
    (DB.hsk[n]||[]).forEach(function(w,i){
      if(!w || !w.cn) return;
      if(q && ((w.cn||'')+(w.py||'')+(w.th||'')).toLowerCase().indexOf(q) === -1) return;
      picker.push({lv:n, idx:i, w:w});
    });
  });
  var shown = q ? picker.slice(0, 200) : picker.slice(0, 60);

  return ''
  + '<div class="panel">'
  + '<div class="panel-head"><h3>📅 คำศัพท์ประจำวัน</h3>'
  +   '<span class="stat-pill">คลังที่ใช้อยู่ <b>' + pool.length.toLocaleString() + '</b> คำ</span></div>'
  + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">'
  +   'เลือกได้ว่าจะให้ระบบเลือกคำเองอัตโนมัติ หรือปักหมุดคำที่ต้องการให้แสดงจนกว่าจะเปลี่ยน</p>'
  + '<div class="badge-pick" style="margin-bottom:18px">'
  +   '<button class="' + (D.mode!=='pin'?'sel':'') + '" onclick="setDailyMode(\'auto\')">🔄 ให้ระบบเลือกอัตโนมัติ</button>'
  +   '<button class="' + (D.mode==='pin'?'sel':'') + '" onclick="setDailyMode(\'pin\')">📌 ปักหมุดคำที่ฉันเลือก</button>'
  + '</div>'
  + (D.mode === 'pin'
      ? (pinned
          ? '<div class="daily-word" style="box-shadow:none;margin-bottom:8px"><div class="dw-label">กำลังปักหมุด</div>'
            + '<div style="text-align:center"><div class="dw-char">' + esc(pinned.cn) + '</div><div class="dw-py">' + esc(pinned.py||'') + '</div></div>'
            + '<div><div class="dw-th" style="font-size:19px;color:var(--brown-3);font-weight:600">' + esc(pinned.th||'') + '</div>'
            + '<div style="margin-top:14px"><button class="mini-btn ghost" onclick="clearDailyPin()">✕ ยกเลิกการปักหมุด</button></div></div></div>'
          : '<div class="empty">ยังไม่ได้เลือกคำที่จะปักหมุด — เลือกจากรายการด้านล่างได้เลย</div>')
      : '<div class="hint" style="color:var(--jade)">✓ ระบบจะเลือกคำให้ใหม่ทุกวันโดยอัตโนมัติ (วันนี้ได้คำว่า “' + esc(today.cn) + '”)</div>')
  + '</div>'

  + '<div class="panel">'
  + '<h3>⚙️ ตั้งค่าการเลือกคำ</h3>'
  + '<div class="grid2">'
  +   '<div class="field"><label>หัวข้อที่แสดงบนหน้าแรก</label>'
  +   '<input id="f-d-head" value="' + esc(D.heading||'') + '" placeholder="คำศัพท์ประจำวัน"></div>'
  +   '<div class="field"><label>คำอธิบายใต้หัวข้อ</label>'
  +   '<input id="f-d-sub" value="' + esc(D.sub||'') + '" placeholder="วันละคำ ก็ยังดีกว่าไม่ได้เรียน"></div>'
  + '</div>'
  + '<div class="field"><label>เลือกคลังคำศัพท์</label>'
  +   '<div class="badge-pick">'
  +   [['hsk','คำศัพท์ HSK'],['cats','หมวดคำศัพท์'],['both','ทั้งสองคลัง']].map(function(o){
        return '<button class="' + ((D.pool||'hsk')===o[0]?'sel':'') + '" onclick="DB.daily.pool=\'' + o[0] + '\';saveDaily();renderAdminBody()">' + o[1] + '</button>';
      }).join('')
  +   '</div></div>'
  + '<div class="field"><label>ใช้คำจากระดับ HSK</label>'
  +   '<div class="badge-pick">'
  +   [1,2,3,4,5,6].map(function(n){
        var on = (D.levels||[]).indexOf(n) > -1;
        return '<button class="' + (on?'sel':'') + '" onclick="toggleDailyLevel(' + n + ')">HSK ' + n + '</button>';
      }).join('')
  +   '</div><div class="hint">ปิดระดับที่ยังไม่ต้องการได้ — คลังจะเล็กลง คำจะวนเร็วขึ้น</div></div>'
  + '<button class="mini-btn" onclick="saveDailyText()">💾 บันทึกข้อความ</button>'
  + '</div>'

  + '<div class="panel">'
  + '<div class="panel-head"><h3>🔎 เลือกคำที่จะปักหมุด</h3></div>'
  + '<div class="toolbar"><input class="search-in" placeholder="🔍 ค้นหาคำจีน พินอิน หรือความหมาย" value="' + esc(adminSearch.daily||'') + '" data-search="daily" oninput="onAdminSearch(this,\'daily\')"></div>'
  + '<div style="max-height:420px;overflow-y:auto">'
  + (shown.map(function(o){
      var isPin = D.pinId === (o.lv + '|' + o.w.cn);
      return '<div class="row-card"><div class="top">'
        + '<div class="txt"><b><span class="cn">' + esc(o.w.cn) + '</span> '
        + '<span style="font-weight:500;color:var(--red);font-size:13px">' + esc(o.w.py||'') + '</span></b>'
        + '<small>' + esc(o.w.th||'') + ' · HSK ' + o.lv + '</small></div>'
        + '<div class="acts"><button class="icon-btn ' + (isPin?'ok':'') + '" title="ปักหมุดคำนี้" '
        + 'onclick="pinDaily(' + o.lv + ',' + JSON.stringify(o.w.cn).replace(/"/g,'&quot;') + ')">' + (isPin?'✓':'📌') + '</button></div>'
        + '</div></div>';
    }).join('') || '<div class="empty">ไม่พบคำศัพท์</div>')
  + '</div>'
  + (picker.length > shown.length ? '<p class="hint">แสดง ' + shown.length + ' จาก ' + picker.length + ' คำ — ใช้ช่องค้นหาเพื่อกรอง</p>' : '')
  + '</div>';
}
function saveDaily(){ store.set('daily', DB.daily); }
function setDailyMode(m){
  DB.daily.mode = m;
  if(m === 'auto') DB.daily.pinId = '';
  saveDaily();
  toast(m === 'pin' ? 'โหมดปักหมุด — เลือกคำด้านล่าง' : 'กลับไปโหมดอัตโนมัติแล้ว');
  renderAdmin();
}
function pinDaily(lv, cn){
  DB.daily.mode = 'pin';
  DB.daily.pinId = lv + '|' + cn;
  saveDaily();
  toast('ปักหมุด “' + cn + '” แล้ว — จะแสดงจนกว่าจะเปลี่ยน');
  renderAdmin();
}
function clearDailyPin(){
  DB.daily.pinId = '';
  DB.daily.mode = 'auto';
  saveDaily();
  toast('ยกเลิกการปักหมุดแล้ว');
  renderAdmin();
}
function toggleDailyLevel(n){
  var a = DB.daily.levels || [];
  var i = a.indexOf(n);
  if(i > -1){ if(a.length <= 1){ toast('ต้องเหลืออย่างน้อย 1 ระดับ'); return; } a.splice(i,1); }
  else a.push(n);
  a.sort();
  DB.daily.levels = a;
  saveDaily();
  renderAdminBody();
}
function saveDailyText(){
  DB.daily.heading = (($('#f-d-head') && $('#f-d-head').value) || '').trim() || 'คำศัพท์ประจำวัน';
  DB.daily.sub = (($('#f-d-sub') && $('#f-d-sub').value) || '').trim();
  saveDaily();
  toast('บันทึกแล้ว ✓');
  renderAdmin();
}
function previewDaily(){ toast('คำที่จะแสดงวันนี้: ' + getDailyWord().cn); }

/* ==========================================================================
   📄 PAGES — page builder
   ========================================================================== */
var pbState = { pageId:null, blockId:null };

function adminPages(){
  var pages = allPages();
  var pg = pbState.pageId ? findPage(pbState.pageId) : null;
  var q = (adminSearch.page || '').toLowerCase();
  var shown = q ? pages.filter(function(p){ return ((p.title||'')+(p.heading||'')).toLowerCase().indexOf(q) > -1; }) : pages;

  var list = ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>📄 หน้าที่สร้างเอง (' + pages.length + ')</h3>'
    +   '<button class="mini-btn" onclick="newCustomPage()">+ สร้างหน้าใหม่</button></div>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">'
    +   'สร้างหน้าเว็บใหม่ได้เองโดยไม่ต้องเขียนโค้ด — ลากจัดบล็อก เพิ่มข้อความ รูปภาพ ปุ่ม และแบ่งคอลัมน์ได้ตามใจ</p>'
    + '<div class="toolbar"><input class="search-in" placeholder="🔍 ค้นหาหน้า" value="' + esc(adminSearch.page||'') + '" data-search="page" oninput="onAdminSearch(this,\'page\')"></div>'
    + '<div>'
    + (shown.map(function(p, idx){
        var blocks = (p.blocks||[]).length;
        var realIdx = pages.indexOf(p);
        return '<div class="row-card"><div class="top">'
          + '<div class="txt"><b>' + (p.icon||'📄') + ' ' + esc(p.title||'') + (p.show===false?' <span class="tag-pill">ซ่อน</span>':'') + (p.inNav?' <span class="tag-pill jade">อยู่ในเมนู</span>':'') + '</b>'
          + '<small>ลำดับที่ ' + (realIdx+1) + ' · ' + blocks + ' บล็อก · /' + esc(p.id) + (p.sub?(' · '+esc(p.sub)):'') + '</small></div>'
          + '<div class="acts">'
          +   '<button class="icon-btn" title="เลื่อนขึ้น" onclick="movePageOrder(\'' + esc(p.id) + '\',-1)">↑</button>'
          +   '<button class="icon-btn" title="เลื่อนลง" onclick="movePageOrder(\'' + esc(p.id) + '\',1)">↓</button>'
          +   '<button class="icon-btn ok" title="แก้ไขหน้า (ชื่อ ไอคอน เนื้อหา)" onclick="editCustomPage(\'' + esc(p.id) + '\')">✏️</button>'
          +   '<button class="icon-btn" title="เปิดดู" onclick="go(\'' + esc(p.id) + '\')">👁</button>'
          +   '<button class="icon-btn warn" title="ทำสำเนา" onclick="dupCustomPage(\'' + esc(p.id) + '\')">⧉</button>'
          +   '<button class="icon-btn" title="ลบ" onclick="delCustomPage(\'' + esc(p.id) + '\')">🗑</button>'
          + '</div></div></div>';
      }).join('') || '<div class="empty">ยังไม่มีหน้า — กด “สร้างหน้าใหม่” ด้านบน</div>')
    + '</div></div>';

  if(!pg) return list;

  /* ---------- editor ---------- */
  var editor = ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>✏️ กำลังแก้ไข: ' + (pg.icon||'📄') + ' ' + esc(pg.title||'') + '</h3>'
    +   '<div style="display:flex;gap:9px;flex-wrap:wrap">'
    +   '<button class="mini-btn ghost" onclick="go(\'' + esc(pg.id) + '\')">↗ ดูตัวอย่างจริง</button>'
    +   '<button class="mini-btn ghost" onclick="pbState.pageId=null;renderAdminBody()">ปิดตัวแก้ไข</button>'
    +   '</div></div>'

    + '<div class="grid2">'
    +   '<div class="field"><label>ชื่อหน้า (แสดงในเมนู)</label><input id="pg-title" value="' + esc(pg.title||'') + '" oninput="patchPage(\'' + esc(pg.id) + '\',\'title\',this.value)"></div>'
    +   '<div class="field"><label>ไอคอน (อีโมจิ)</label><input id="pg-icon" value="' + esc(pg.icon||'') + '" placeholder="🏮" oninput="patchPage(\'' + esc(pg.id) + '\',\'icon\',this.value)"></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>หัวข้อใหญ่บนหน้า</label><input id="pg-heading" value="' + esc(pg.heading||'') + '" oninput="patchPage(\'' + esc(pg.id) + '\',\'heading\',this.value)"></div>'
    +   '<div class="field"><label>คำอธิบายใต้หัวข้อ</label><input id="pg-sub" value="' + esc(pg.sub||'') + '" oninput="patchPage(\'' + esc(pg.id) + '\',\'sub\',this.value)"></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ตัวอักษรจางพื้นหลัง</label><input id="pg-wm" value="' + esc(pg.watermark||'') + '" placeholder="頁" oninput="patchPage(\'' + esc(pg.id) + '\',\'watermark\',this.value)"></div>'
    +   '<div class="field"><label>ลำดับในเมนู (เลขน้อยอยู่ซ้าย)</label><input id="pg-order" type="number" value="' + (pg.order!=null?pg.order:1) + '" oninput="patchPage(\'' + esc(pg.id) + '\',\'order\',+this.value)"></div>'
    + '</div>'
    + '<div class="field"><label>การแสดงผล</label><div class="badge-pick">'
    +   '<button class="' + (pg.inNav?'sel':'') + '" onclick="patchPage(\'' + esc(pg.id) + '\',\'inNav\',!' + (!!pg.inNav) + ');renderAdminBody()">📌 แสดงในเมนูด้านบน</button>'
    +   '<button class="' + (pg.show!==false?'sel':'') + '" onclick="patchPage(\'' + esc(pg.id) + '\',\'show\',!' + (pg.show!==false) + ');renderAdminBody()">👁 แสดงหน้าเว็บ</button>'
    +   '<button class="' + (pg.fullWidth?'sel':'') + '" onclick="patchPage(\'' + esc(pg.id) + '\',\'fullWidth\',!' + (!!pg.fullWidth) + ');renderAdminBody()">↔️ กว้างเต็มจอ</button>'
    + '</div></div>'
    + '</div>'

    + '<div class="panel">'
    + '<div class="panel-head"><h3>🧱 บล็อกในหน้า (' + (pg.blocks||[]).length + ')</h3>'
    +   '<span class="stat-pill">ลาก ⠿ เพื่อจัดลำดับ</span></div>'
    + '<div style="margin-bottom:16px">'
    +   BLOCK_TYPES.map(function(t){
        return '<button class="chip" style="margin:0 6px 8px 0" onclick="addBlock(\'' + esc(pg.id) + '\',\'' + t.id + '\')">'
          + t.ic + ' + ' + t.name + '</button>';
      }).join('')
    + '</div>'
    + '<div id="pbList" ondragover="event.preventDefault()">'
    + (pg.blocks||[]).map(function(b, i){ return blockEditor(pg, b, i); }).join('') || '<div class="empty">ยังไม่มีบล็อก — กดปุ่มด้านบนเพื่อเพิ่ม</div>'
    + '</div></div>';

  return editor + list;
}
function blockEditor(pg, b, i){
  var meta = blockLabel(b);
  var body = '';
  var F = function(label, id, val, ph, input){
    return '<div class="field"><label>' + label + '</label>'
      + (input || ('<input id="' + id + '" value="' + esc(val==null?'':val) + '" placeholder="' + esc(ph||'') + '" '
        + 'oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'' + id + '\',this.value)">'))
      + '</div>';
  };

  if(b.type === 'heading' || b.type === 'text' || b.type === 'quote' || b.type === 'html'){
    body += '<div class="field"><label>ข้อความ' + (b.type==='html'?' (โค้ด HTML)':' (ขึ้นบรรทัดใหม่ได้)') + '</label>'
      + '<textarea style="min-height:' + (b.type==='html'?110:90) + 'px" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'text\',this.value)">' + esc(b.text||'') + '</textarea></div>';
  }
  if(b.type === 'button'){
    body += F('ข้อความบนปุ่ม','label',b.label,'เริ่มเรียน');
    body += F('ลิงก์ (ชื่อหน้า เช่น learn / hsk / p-about หรือ URL เต็ม)','link',b.link,'learn');
    body += '<div class="field"><label>รูปแบบปุ่ม</label><div class="badge-pick">'
      + [['primary','หลัก'],['ghost','โปร่ง'],['gold','ทอง']].map(function(o){
          return '<button class="' + ((b.style||'primary')===o[0]?'sel':'') + '" onclick="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'style\',\'' + o[0] + '\');renderAdminBody()">' + o[1] + '</button>';
        }).join('') + '</div></div>';
  }
  if(b.type === 'buttons'){
    body += '<label style="font-size:13px;font-weight:700;color:var(--text-2);display:block;margin-bottom:8px">ปุ่มในกลุ่ม</label>';
    body += (b.items||[]).map(function(it, k){
      return '<div class="pb-item-row">'
        + '<div class="field" style="margin:0"><label>ข้อความ</label><input value="' + esc(it.label||'') + '" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'label\',this.value)"></div>'
        + '<div class="field" style="margin:0"><label>ลิงก์</label><input value="' + esc(it.link||'') + '" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'link\',this.value)"></div>'
        + '<div class="field" style="margin:0"><label>รูปแบบ</label><select onchange="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'style\',this.value)">'
        +   ['primary','ghost','gold'].map(function(s){ return '<option value="' + s + '" ' + ((it.style||'primary')===s?'selected':'') + '>' + s + '</option>'; }).join('')
        + '</select></div>'
        + '<div style="display:flex;align-items:flex-end"><button class="mini-btn danger" onclick="delItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ')">🗑 ลบปุ่มนี้</button></div>'
        + '</div>';
    }).join('');
    body += '<button class="mini-btn ghost" onclick="addItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\')">+ เพิ่มปุ่ม</button>';
  }
  if(b.type === 'image'){
    body += '<div class="field"><label>รูปภาพ</label>' + uploadBox('pbImg_' + b.id, b.src||'', 1600, true) + '</div>';
    body += F('คำบรรยายใต้รูป (ไม่บังคับ)','caption',b.caption,'');
    body += F('ลิงก์เมื่อคลิกรูป (ไม่บังคับ)','link',b.link,'');
    body += '<div class="grid2">'
      + '<div class="field"><label>ความสูง (px) — เว้นว่างให้สูงตามรูป</label><input type="number" value="' + (b.height||'') + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'height\',+this.value||\'\')"></div>'
      + '<div class="field"><label>ความกว้างสูงสุด (px)</label><input type="number" value="' + (b.width||900) + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'width\',+this.value)"></div>'
      + '</div>'
      + '<div class="field"><label>การจัดวาง</label><div class="badge-pick">'
      + [['left','ชิดซ้าย'],['center','กลาง'],['right','ชิดขวา']].map(function(o){
          return '<button class="' + ((b.align||'left')===o[0]?'sel':'') + '" onclick="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'align\',\'' + o[0] + '\');renderAdminBody()">' + o[1] + '</button>';
        }).join('')
      + '<button class="' + (b.full?'sel':'') + '" onclick="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'full\',!' + (!!b.full) + ');renderAdminBody()">เต็มความกว้าง</button>'
      + '</div></div>';
  }
  if(b.type === 'columns'){
    body += '<div class="grid2">'
      + '<div class="field"><label>สัดส่วนคอลัมน์</label><select onchange="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'ratio\',this.value)">'
      +   [['1-1','เท่ากัน 1:1'],['1-2','ซ้ายเล็ก 1:2'],['2-1','ซ้ายใหญ่ 2:1']].map(function(o){
            return '<option value="' + o[0] + '" ' + ((b.ratio||'1-1')===o[0]?'selected':'') + '>' + o[1] + '</option>';
          }).join('')
      + '</select></div>'
      + '<div class="field"><label>ช่องว่างระหว่างคอลัมน์ (px)</label><input type="number" value="' + (b.gap||22) + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'gap\',+this.value)"></div>'
      + '</div>';
    body += (b.items||[]).map(function(c, k){
      return '<div class="pb-item-row" style="grid-template-columns:1fr">'
        + '<div class="grid2">'
        +   '<div class="field" style="margin:0"><label>หัวข้อย่อย</label><input value="' + esc(c.title||'') + '" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'title\',this.value)"></div>'
        +   '<div class="field" style="margin:0"><label>สีพื้นช่อง</label><input type="color" value="' + (c.bg||'#fffdf7') + '" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'bg\',this.value)"></div>'
        + '</div>'
        + '<div class="field" style="margin:0"><label>ข้อความ</label><textarea style="min-height:70px" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'text\',this.value)">' + esc(c.text||'') + '</textarea></div>'
        + '<button class="mini-btn danger" onclick="delItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ')">🗑 ลบคอลัมน์นี้</button>'
        + '</div>';
    }).join('');
    body += '<button class="mini-btn ghost" onclick="addItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\')">+ เพิ่มคอลัมน์</button>';
  }
  if(b.type === 'cards'){
    body += '<div class="field"><label>ความกว้างการ์ดขั้นต่ำ (px)</label><input type="number" value="' + (b.colWidth||230) + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'colWidth\',+this.value)"></div>';
    body += (b.items||[]).map(function(c, k){
      return '<div class="pb-item-row">'
        + '<div class="field" style="margin:0"><label>ไอคอน</label><input value="' + esc(c.icon||'') + '" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'icon\',this.value)"></div>'
        + '<div class="field" style="margin:0"><label>หัวข้อ</label><input value="' + esc(c.title||'') + '" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'title\',this.value)"></div>'
        + '<div class="field" style="margin:0"><label>คำอธิบาย</label><input value="' + esc(c.desc||'') + '" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'desc\',this.value)"></div>'
        + '<div class="field" style="margin:0"><label>ลิงก์ (ไม่บังคับ)</label><input value="' + esc(c.link||'') + '" oninput="patchItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ',\'link\',this.value)"></div>'
        + '<button class="mini-btn danger" style="grid-column:1/-1" onclick="delItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',' + k + ')">🗑 ลบการ์ดนี้</button>'
        + '</div>';
    }).join('');
    body += '<button class="mini-btn ghost" onclick="addItem(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\')">+ เพิ่มการ์ด</button>';
  }
  if(b.type === 'spacer'){
    body += '<div class="field"><label>ขนาดช่องว่าง</label><div class="badge-pick">'
      + [['sm','เล็ก'],['md','กลาง'],['lg','ใหญ่'],['xl','ใหญ่พิเศษ']].map(function(o){
          return '<button class="' + ((b.size||'md')===o[0]?'sel':'') + '" onclick="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'size\',\'' + o[0] + '\');renderAdminBody()">' + o[1] + '</button>';
        }).join('') + '</div></div>';
  }

  /* shared appearance controls */
  body += '<div class="grid2" style="margin-top:6px">'
    + '<div class="field"><label>สีพื้นบล็อก</label><input type="color" value="' + (b.bg||'#fffdf7') + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'bg\',this.value)">'
    + '<button class="mini-btn ghost" style="margin-top:6px" onclick="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'bg\',\'\');renderAdminBody()">ล้างสีพื้น</button></div>'
    + '<div class="field"><label>สีตัวอักษร</label><input type="color" value="' + (b.color||'#3a2e25') + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'color\',this.value)">'
    + '<button class="mini-btn ghost" style="margin-top:6px" onclick="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'color\',\'\');renderAdminBody()">คืนค่าสีเดิม</button></div>'
    + '</div>'
    + '<div class="grid2">'
    + '<div class="field"><label>ขนาดตัวอักษร (px) — เว้นว่างใช้ค่าปกติ</label><input type="number" value="' + (b.size||'') + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'size\',+this.value||\'\')"></div>'
    + '<div class="field"><label>น้ำหนักตัวอักษร</label><select onchange="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'weight\',+this.value||\'\')">'
    +   '<option value="">ปกติ</option>'
    +   [300,400,500,600,700,800].map(function(w){ return '<option value="' + w + '" ' + (+b.weight===w?'selected':'') + '>' + w + '</option>'; }).join('')
    + '</select></div>'
    + '</div>'
    + '<div class="grid2">'
    + '<div class="field"><label>ฟอนต์</label><select onchange="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'font\',this.value)">'
    +   [['th','ไทยไม่มีหัว (ค่าเริ่มต้น)'],['head','หัวข้อ'],['num','ตัวเลข'],['cn','จีน (serif)']].map(function(o){
          return '<option value="' + o[0] + '" ' + ((b.font||'th')===o[0]?'selected':'') + '>' + o[1] + '</option>';
        }).join('')
    + '</select></div>'
    + '<div class="field"><label>ระยะห่างบรรทัด</label><input type="number" step="0.1" value="' + (b.lh||'') + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'lh\',+this.value||\'\')"></div>'
    + '</div>'
    + '<div class="grid2">'
    + '<div class="field"><label>ระยะห่างในบล็อก (px)</label><input type="number" value="' + (b.pad==null?'':b.pad) + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'pad\',+this.value||0)"></div>'
    + '<div class="field"><label>ความมนของมุม (px)</label><input type="number" value="' + (b.radius==null?'':b.radius) + '" oninput="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'radius\',+this.value||0)"></div>'
    + '</div>'
    + '<div class="field"><label>การจัดตำแหน่ง</label><div class="badge-pick">'
    + [['left','ซ้าย'],['center','กลาง'],['right','ขวา']].map(function(o){
        return '<button class="' + ((b.align||'left')===o[0]?'sel':'') + '" onclick="patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'align\',\'' + o[0] + '\');renderAdminBody()">' + o[1] + '</button>';
      }).join('') + '</div></div>';

  return '<div class="pb-block" id="pb-' + esc(b.id) + '" draggable="true" '
    + 'ondragstart="pbDragStart(event,\'' + esc(pg.id) + '\',' + i + ')" ondragover="event.preventDefault()" ondrop="pbDrop(event,\'' + esc(pg.id) + '\',' + i + ')">'
    + '<div class="pb-block-head" onclick="toggleBlockBody(\'' + esc(b.id) + '\')">'
    +   '<span class="grip">⠿</span>'
    +   '<span class="txt"><b>' + meta.label + (b.hidden?' <span class="tag-pill">ซ่อน</span>':'') + '</b><small>' + esc(meta.preview) + '</small></span>'
    +   '<span class="acts">'
    +   '<button class="icon-btn" title="ขึ้น" onclick="event.stopPropagation();moveBlock(\'' + esc(pg.id) + '\',' + i + ',-1)">↑</button>'
    +   '<button class="icon-btn" title="ลง" onclick="event.stopPropagation();moveBlock(\'' + esc(pg.id) + '\',' + i + ',1)">↓</button>'
    +   '<button class="icon-btn warn" title="ทำสำเนา" onclick="event.stopPropagation();dupBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\')">⧉</button>'
    +   '<button class="icon-btn" title="' + (b.hidden?'แสดง':'ซ่อน') + '" onclick="event.stopPropagation();patchBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\',\'hidden\',!' + (!!b.hidden) + ');renderAdminBody()">' + (b.hidden?'🚫':'👁') + '</button>'
    +   '<button class="icon-btn" title="ลบ" onclick="event.stopPropagation();delBlock(\'' + esc(pg.id) + '\',\'' + esc(b.id) + '\')">🗑</button>'
    +   '</span>'
    + '</div>'
    + '<div class="pb-block-body' + (pbState.blockId===b.id?' open':'') + '">' + body + '</div>'
    + '</div>';
}
function toggleBlockBody(id){
  pbState.blockId = (pbState.blockId === id) ? null : id;
  var el = document.getElementById('pb-' + id);
  if(el) el.classList.toggle('open');
  /* seed defaults when opening for the first time */
  var target = el && el.querySelector('.pb-block-body');
  if(target && target.scrollIntoView) target.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function getPage(id){ return (DB.pages||[]).filter(function(p){ return p && p.id === id; })[0]; }
function patchPage(id, key, val){
  var p = getPage(id); if(!p) return;
  p[key] = val;
  store.set('pages', DB.pages);
  renderNavMenu();
}
function patchBlock(pageId, blockId, key, val){
  var p = getPage(pageId); if(!p) return;
  var b = (p.blocks||[]).filter(function(x){ return x.id === blockId; })[0]; if(!b) return;
  b[key] = val;
  store.set('pages', DB.pages);
}
function patchItem(pageId, blockId, idx, key, val){
  var p = getPage(pageId); if(!p) return;
  var b = (p.blocks||[]).filter(function(x){ return x.id === blockId; })[0]; if(!b) return;
  if(!b.items) b.items = [];
  if(!b.items[idx]) b.items[idx] = {};
  b.items[idx][key] = val;
  store.set('pages', DB.pages);
}
function blockDefaults(type){
  switch(type){
    case 'heading': return { text:'หัวข้อใหม่' };
    case 'text':    return { text:'พิมพ์ข้อความของคุณที่นี่' };
    case 'quote':   return { text:'ข้อความที่ต้องการเน้นให้โดดเด่น' };
    case 'button':  return { label:'คลิกที่นี่', link:'learn', style:'primary' };
    case 'buttons': return { items:[{label:'ปุ่มที่ 1', link:'learn', style:'primary'},{label:'ปุ่มที่ 2', link:'articles', style:'ghost'}] };
    case 'image':   return { src:'', width:900, align:'left' };
    case 'columns': return { ratio:'1-1', gap:22, items:[{title:'คอลัมน์ซ้าย', text:'ข้อความ...'},{title:'คอลัมน์ขวา', text:'ข้อความ...'}] };
    case 'cards':   return { colWidth:230, items:[{icon:'📌', title:'การ์ดที่ 1', desc:'คำอธิบายสั้น ๆ'},{icon:'📌', title:'การ์ดที่ 2', desc:'คำอธิบายสั้น ๆ'}] };
    case 'spacer':  return { size:'md' };
    case 'divider': return {};
    case 'html':    return { text:'<p>โค้ด HTML ของคุณ</p>' };
  }
  return {};
}
function addBlock(pageId, type){
  var p = getPage(pageId); if(!p) return;
  if(!p.blocks) p.blocks = [];
  var b = Object.assign({ id: uid('b'), type: type }, blockDefaults(type));
  p.blocks.push(b);
  store.set('pages', DB.pages);
  pbState.blockId = b.id;
  toast('เพิ่มบล็อกแล้ว — เลื่อนลงไปตั้งค่าได้เลย');
  renderAdminBody();
}
function addItem(pageId, blockId){
  var p = getPage(pageId); if(!p) return;
  var b = (p.blocks||[]).filter(function(x){ return x.id === blockId; })[0]; if(!b) return;
  if(!b.items) b.items = [];
  if(b.type === 'columns') b.items.push({title:'คอลัมน์ใหม่', text:'ข้อความ...'});
  else if(b.type === 'cards') b.items.push({icon:'📌', title:'การ์ดใหม่', desc:'คำอธิบาย'});
  else b.items.push({label:'ปุ่มใหม่', link:'', style:'primary'});
  store.set('pages', DB.pages);
  renderAdminBody();
}
function delItem(pageId, blockId, idx){
  var p = getPage(pageId); if(!p) return;
  var b = (p.blocks||[]).filter(function(x){ return x.id === blockId; })[0]; if(!b) return;
  b.items.splice(idx, 1);
  store.set('pages', DB.pages);
  renderAdminBody();
}
function delBlock(pageId, blockId){
  if(!confirm('ลบบล็อกนี้?')) return;
  var p = getPage(pageId); if(!p) return;
  p.blocks = (p.blocks||[]).filter(function(x){ return x.id !== blockId; });
  store.set('pages', DB.pages);
  toast('ลบบล็อกแล้ว');
  renderAdminBody();
}
function dupBlock(pageId, blockId){
  var p = getPage(pageId); if(!p) return;
  var i = (p.blocks||[]).map(function(x){ return x.id; }).indexOf(blockId);
  if(i < 0) return;
  var copy = JSON.parse(JSON.stringify(p.blocks[i]));
  copy.id = uid('b');
  p.blocks.splice(i+1, 0, copy);
  store.set('pages', DB.pages);
  renderAdminBody();
}
function moveBlock(pageId, idx, dir){
  var p = getPage(pageId); if(!p) return;
  var j = idx + dir;
  if(j < 0 || j >= p.blocks.length) return;
  var t = p.blocks[idx]; p.blocks[idx] = p.blocks[j]; p.blocks[j] = t;
  store.set('pages', DB.pages);
  renderAdminBody();
}
var pbDragIdx = null;
function pbDragStart(e, pageId, idx){ pbDragIdx = idx; e.dataTransfer.effectAllowed = 'move'; }
function pbDrop(e, pageId, idx){
  e.preventDefault();
  if(pbDragIdx === null || pbDragIdx === idx) return;
  var p = getPage(pageId); if(!p) return;
  var moved = p.blocks.splice(pbDragIdx, 1)[0];
  p.blocks.splice(idx, 0, moved);
  pbDragIdx = null;
  store.set('pages', DB.pages);
  renderAdminBody();
}
function newCustomPage(){
  var title = prompt('ชื่อหน้าใหม่ (เช่น ติดต่อเรา, เกี่ยวกับเรา)', 'หน้าใหม่');
  if(!title) return;
  var p = {
    id: uid('p-'), title: title, icon:'📄', inNav:false, show:true,
    order: (allPages().length + 1), heading: title, sub:'', watermark:'頁',
    blocks:[{ id: uid('b'), type:'heading', text: title },
            { id: uid('b'), type:'text', text:'พิมพ์ข้อความของคุณที่นี่' }]
  };
  DB.pages = (DB.pages||[]).concat([p]);
  store.set('pages', DB.pages);
  pbState.pageId = p.id;
  toast('สร้างหน้า “' + title + '” แล้ว');
  renderNavMenu();
  renderAdmin();
}
function editCustomPage(id){ pbState.pageId = id; pbState.blockId = null; renderAdminBody(); }
function dupCustomPage(id){
  var p = getPage(id); if(!p) return;
  var copy = JSON.parse(JSON.stringify(p));
  copy.id = uid('p-');
  copy.title = (p.title||'') + ' (สำเนา)';
  copy.inNav = false;
  (copy.blocks||[]).forEach(function(b){ b.id = uid('b'); });
  DB.pages = (DB.pages||[]).concat([copy]);
  store.set('pages', DB.pages);
  toast('ทำสำเนาแล้ว');
  renderNavMenu();
  renderAdmin();
}
function movePageOrder(id, dir){
  var pages = DB.pages || [];
  var i = pages.map(function(p){return p.id;}).indexOf(id);
  if(i < 0) return;
  var j = i + dir;
  if(j < 0 || j >= pages.length) return;
  var t = pages[i]; pages[i] = pages[j]; pages[j] = t;
  pages.forEach(function(p, k){ p.order = k + 1; });
  store.set('pages', DB.pages);
  renderNavMenu();
  renderAdminBody();
}
function delCustomPage(id){
  var p = getPage(id); if(!p) return;
  if(!confirm('ลบหน้า “' + (p.title||'') + '” และทุกบล็อกในหน้านี้?')) return;
  DB.pages = (DB.pages||[]).filter(function(x){ return x.id !== id; });
  store.set('pages', DB.pages);
  if(pbState.pageId === id) pbState.pageId = null;
  toast('ลบหน้าแล้ว');
  renderNavMenu();
  renderAdmin();
}

/* ==========================================================================
   🗃️ GAME CATEGORIES — สร้างหมวดหมู่เกมเอง + ด่านไม่จำกัด
   ========================================================================== */
var CAT_TYPE_NAMES = {fill:'✏️ เติมคำ', vocab:'🧠 จับคู่คำศัพท์', pinyin:'🔤 คำอ่าน', tone:'🎵 วรรณยุกต์', order:'🧩 เรียงประโยค', reading:'📖 อ่านจับใจความ'};
function adminGameCats(){
  var cats = DB.gameCats || [];
  var cur = catState.id ? cats.filter(function(c){return c.id===catState.id;})[0] : null;

  var list = ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>🗃️ หมวดหมู่เกมที่สร้างเอง (' + cats.length + ')</h3>'
    +   '<button class="mini-btn" onclick="newGameCat()">+ สร้างหมวดหมู่ใหม่</button></div>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">'
    +   'สร้างหมวดหมู่เกมได้ไม่จำกัด — กำหนดชนิดคำถาม เลือกไอคอน และเพิ่มด่านได้ไม่จำกัด (ไม่จำกัดอยู่แค่ HSK) '
    +   'แต่ละด่านเก็บดาวและปลดล็อกแบบเดียวกับเกมมาตรฐาน</p>'
    + '<div>'
    + (cats.map(function(c){
        var m = (c.levels||[]).length;
        var n = (c.questions||[]).length;
        return '<div class="row-card"><div class="top"><div class="txt">'
          + '<b>' + (c.icon||'🎮') + ' ' + esc(c.name) + '</b>'
          + '<small>' + (CAT_TYPE_NAMES[c.type]||'') + ' · ' + m + ' ด่าน · ' + n + ' คำถาม</small></div>'
          + '<div class="acts">'
          +   '<button class="icon-btn ok" onclick="openGameCat(\'' + esc(c.id) + '\')">✏️</button>'
          +   '<button class="icon-btn" title="เปิดดู" onclick="go(\'gamelevels\',\'' + esc(c.id) + '\')">👁</button>'
          +   '<button class="icon-btn" title="ลบ" onclick="delGameCat(\'' + esc(c.id) + '\')">🗑</button>'
          + '</div></div></div>';
      }).join('') || '<div class="empty">ยังไม่มีหมวดหมู่ที่สร้างเอง — กด “สร้างหมวดหมู่ใหม่” ด้านบน</div>')
    + '</div></div>';

  if(!cur) return list;

  /* ---- category properties ---- */
  var lv = catState.lv;
  var levels = cur.levels || [];
  var bank = cur.questions || [];
  var rows = bank.map(function(x,i){return {x:x,i:i};}).filter(function(r){ return (r.x.lv||1) === lv; });
  var e = editState.gameQ;

  var editor = ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>✏️ ตั้งค่าหมวดหมู่: ' + (cur.icon||'🎮') + ' ' + esc(cur.name) + '</h3>'
    +   '<div style="display:flex;gap:9px;flex-wrap:wrap">'
    +   '<button class="mini-btn ghost" onclick="go(\'gamelevels\',\'' + esc(cur.id) + '\')">↗ ดูหน้าเกมจริง</button>'
    +   '<button class="mini-btn ghost" onclick="catState.id=null;renderAdminBody()">← กลับรายการ</button>'
    +   '</div></div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>ชื่อหมวดหมู่</label><input id="gc-name" value="' + esc(cur.name) + '" oninput="patchGameCat(\'name\',this.value)"></div>'
    +   '<div class="field"><label>ไอคอน (อีโมจิ)</label><input id="gc-icon" value="' + esc(cur.icon||'') + '" oninput="patchGameCat(\'icon\',this.value)"></div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<div class="field"><label>อักษรจีนประกอบ</label><input id="gc-cn" value="' + esc(cur.cn||'') + '" placeholder="玩" oninput="patchGameCat(\'cn\',this.value)"></div>'
    +   '<div class="field"><label>ชนิดคำถาม</label><select id="gc-type" onchange="patchGameCat(\'type\',this.value)">'
    +     Object.keys(CAT_TYPE_NAMES).map(function(t){
            return '<option value="' + t + '" ' + (cur.type===t?'selected':'') + '>' + CAT_TYPE_NAMES[t] + '</option>';
          }).join('')
    +   '</select></div>'
    + '</div>'
    + '<div class="field"><label>คำอธิบายหมวดหมู่</label><input id="gc-desc" value="' + esc(cur.desc||'') + '" oninput="patchGameCat(\'desc\',this.value)"></div>'
    + '</div>'

    /* ---- levels ---- */
    + '<div class="panel">'
    + '<div class="panel-head"><h3>🧗 ด่านทั้งหมด (' + levels.length + ') — เพิ่มได้ไม่จำกัด</h3>'
    +   '<button class="mini-btn" onclick="addGameLevel()">+ เพิ่มด่าน</button></div>'
    + '<div>'
    + (levels.map(function(lvdef, i){
        var cnt = bank.filter(function(q){return (q.lv||1) === (i+1);}).length;
        var on = (i+1) === lv;
        return '<div class="list-item">'
          + '<div class="txt"><b style="font-size:14px">' + (i+1) + '. ' + esc(lvdef.name) + '</b> — ' + cnt + ' คำถาม</div>'
          + '<div class="acts">'
          +   '<button class="icon-btn" onclick="catState.lv=' + (i+1) + ';renderAdminBody()">' + (on?'🔎':'→') + '</button>'
          +   '<button class="icon-btn ok" onclick="renameGameLevel(' + i + ')">✏️</button>'
          +   '<button class="icon-btn" onclick="moveGameLevel(' + i + ',-1)">↑</button>'
          +   '<button class="icon-btn" onclick="moveGameLevel(' + i + ',1)">↓</button>'
          +   '<button class="icon-btn" onclick="delGameLevel(' + i + ')">🗑</button>'
          + '</div></div>';
      }).join('') || '<div class="empty">ยังไม่มีด่าน — กด “เพิ่มด่าน” ด้านบน</div>')
    + '</div>'
    + (catState.editLevel ? '<div class="edit-form open"><h4>เปลี่ยนชื่อด่านที่ ' + catState.editLevel + '</h4>'
        + '<div class="field"><label>ชื่อด่านใหม่</label><input id="gc-lname" value="' + esc((levels[catState.editLevel-1]||{}).name||'') + '"></div>'
        + '<div class="form-acts"><button class="mini-btn" onclick="saveGameLevelName()">💾 บันทึก</button>'
        + '<button class="mini-btn ghost" onclick="catState.editLevel=0;renderAdminBody()">ยกเลิก</button></div></div>' : '')
    + '</div>'

    /* ---- questions of selected level ---- */
    + '<div class="panel">'
    + '<div class="panel-head"><h3>❓ คำถามในด่าน ' + lv + ': ' + esc((levels[lv-1]||{}).name||'') + ' (' + rows.length + ')</h3>'
    +   '<button class="mini-btn" onclick="newCatQuestion()">+ เพิ่มคำถาม</button></div>'
    + (e!==null && e!==undefined ? gameForm(typeof e==='object'?e:bank[+e], typeof e==='object'?null:+e, cur.type, lv) : '')
    + '<div>'
    + (rows.map(function(o){
        var x = o.x;
        return '<div class="row-card"><div class="top"><div class="txt">'
          + '<b>' + esc(gameQTitle(x, cur.type)) + '</b><small>' + esc(gameQSub(x, cur.type)) + '</small></div>'
          + '<div class="acts">'
          +   '<button class="icon-btn ok" onclick="editCatQuestion(' + o.i + ')">✏️</button>'
          +   '<button class="icon-btn" onclick="delCatQuestion(' + o.i + ')">🗑</button>'
          + '</div></div></div>';
      }).join('') || '<div class="empty">ยังไม่มีคำถามในด่านนี้</div>')
    + '</div></div>';

  return editor + list;
}
function saveGameCats(){ store.set('gameCats', DB.gameCats); }
function curGameCat(){
  return (DB.gameCats||[]).filter(function(c){return c.id===catState.id;})[0] || null;
}
function patchGameCat(key, val){
  var c = curGameCat(); if(!c) return;
  c[key] = val; saveGameCats();
}
function newGameCat(){
  var name = prompt('ชื่อหมวดหมู่ใหม่ (เช่น อาหารจีน, ครอบครัวของฉัน)', 'หมวดหมู่ใหม่');
  if(!name) return;
  DB.gameCats = DB.gameCats || [];
  var c = {id: uid('gc-'), name:name, icon:'🎮', cn:'玩', desc:'', type:'vocab', levels:[{name:'ด่าน 1'},{name:'ด่าน 2'},{name:'ด่าน 3'}], questions:[]};
  DB.gameCats.push(c); saveGameCats();
  catState = {id:c.id, lv:1, editLevel:0, newName:''};
  toast('สร้างหมวดหมู่ “' + name + '” แล้ว');
  renderAdmin();
}
function openGameCat(id){
  catState = {id:id, lv:1, editLevel:0, newName:''};
  renderAdminBody();
}
function delGameCat(id){
  var c = (DB.gameCats||[]).filter(function(x){return x.id===id;})[0];
  if(!confirm('ลบหมวดหมู่ “' + (c?c.name:'') + '” และคำถามทั้งหมด?')) return;
  DB.gameCats = DB.gameCats.filter(function(x){return x.id!==id;});
  saveGameCats();
  catState.id = null;
  toast('ลบแล้ว'); renderAdmin();
}
function addGameLevel(){
  var c = curGameCat(); if(!c) return;
  var name = prompt('ชื่อด่านใหม่', 'ด่าน ' + ((c.levels||[]).length + 1));
  if(!name) return;
  c.levels = c.levels || [];
  c.levels.push({name:name});
  saveGameCats();
  catState.lv = c.levels.length;
  toast('เพิ่มด่านที่ ' + c.levels.length + ' แล้ว');
  renderAdminBody();
}
function renameGameLevel(i){
  catState.editLevel = i+1;
  renderAdminBody();
  setTimeout(function(){ if($('#gc-lname')) $('#gc-lname').focus(); },60);
}
function saveGameLevelName(){
  var c = curGameCat(); if(!c) return;
  var name = (($('#gc-lname') && $('#gc-lname').value) || '').trim();
  if(!name){ toast('ใส่ชื่อด่านก่อน'); return; }
  c.levels[catState.editLevel-1].name = name;
  saveGameCats();
  catState.editLevel = 0;
  toast('บันทึกแล้ว'); renderAdminBody();
}
function moveGameLevel(i, dir){
  var c = curGameCat(); if(!c) return;
  var j = i + dir;
  if(j < 0 || j >= c.levels.length) return;
  /* ย้ายคำถามตามไปด้วย */
  var tmp = c.levels[i]; c.levels[i] = c.levels[j]; c.levels[j] = tmp;
  (c.questions||[]).forEach(function(q){
    var lvq = q.lv||1;
    if(lvq === i+1) q.lv = j+1;
    else if(lvq === j+1) q.lv = i+1;
  });
  saveGameCats();
  renderAdminBody();
}
function delGameLevel(i){
  var c = curGameCat(); if(!c) return;
  if(!confirm('ลบด่านที่ ' + (i+1) + ' และย้ายคำถามในด่านนี้ไปด่านก่อนหน้า?')) return;
  c.levels.splice(i, 1);
  /* คำถามที่เคยอยู่ด่านนี้ถูกผลักไปด่านก่อนหน้า (หรือ 1) */
  (c.questions||[]).forEach(function(q){
    var lvq = q.lv||1;
    if(lvq === i+1) q.lv = Math.max(1, i);
    else if(lvq > i+1) q.lv = lvq - 1;
  });
  if(c.levels.length === 0) c.levels.push({name:'ด่าน 1'});
  saveGameCats();
  if(catState.lv > c.levels.length) catState.lv = c.levels.length;
  toast('ลบด่านแล้ว'); renderAdminBody();
}
function newCatQuestion(){
  editState.gameQ = {};
  renderAdminBody();
  setTimeout(function(){ if($('#f-g-q')) $('#f-g-q').focus(); },60);
}
function editCatQuestion(i){
  editState.gameQ = i;
  renderAdminBody();
  setTimeout(function(){ if($('#f-g-q')) $('#f-g-q').focus(); window.scrollTo({top:220,behavior:'smooth'}); },60);
}
function delCatQuestion(i){
  var c = curGameCat(); if(!c) return;
  if(!confirm('ลบคำถามนี้?')) return;
  c.questions.splice(i,1); saveGameCats();
  renderAdminBody();
}
/* saveGameQ ถูกครอบเมื่อ editState.gameQ อยู่ในหมวดหมู่ที่สร้างเอง */
var _origSaveGameQ = null;
function saveGameQ(gid, idx){
  var c = catState.id ? curGameCat() : null;
  if(c && c.id === gid){
    var v = function(id){ return ($('#'+id) && $('#'+id).value) || ''; };
    var lv = catState.lv;
    var rec = {lv:lv}; var ok = true;
    var t = c.type || 'vocab';
    if(t==='fill'){ rec.q=v('f-g-q').trim(); rec.a=v('f-g-a').trim(); rec.w=[v('f-g-w1').trim(),v('f-g-w2').trim()]; rec.th=v('f-g-th').trim(); rec.py=v('f-g-py').trim(); if(!rec.q||!rec.a||!rec.w[0]||!rec.w[1]) ok=false; if(rec.q.indexOf('___')<0) rec.q=rec.q.replace(/\s*_+\s*/, '___'); }
    else if(t==='vocab'){ rec.q=v('f-g-q').trim(); rec.py=v('f-g-py').trim(); rec.a=v('f-g-a').trim(); rec.w=[v('f-g-w1').trim(),v('f-g-w2').trim()]; if(!rec.q||!rec.a||!rec.w[0]||!rec.w[1]) ok=false; }
    else if(t==='pinyin'){ rec.q=v('f-g-q').trim(); rec.a=v('f-g-a').trim(); rec.w=[v('f-g-w1').trim(),v('f-g-w2').trim()]; rec.th=v('f-g-th').trim(); if(!rec.q||!rec.a||!rec.w[0]||!rec.w[1]) ok=false; }
    else if(t==='tone'){ rec.q=v('f-g-q').trim(); rec.target=v('f-g-target').trim(); rec.a=v('f-g-a'); rec.w=[v('f-g-w1').trim(),v('f-g-w2').trim()].filter(function(x){return x&&x!==rec.a;}); rec.th=v('f-g-th').trim(); if(!rec.q||!rec.target) ok=false; while(rec.w.length<2) rec.w.push(String(1+rec.w.length)); rec.w=rec.w.slice(0,2); }
    else if(t==='order'){ rec.q=v('f-g-q').trim(); rec.a=v('f-g-a').trim().split(/\s+/).filter(Boolean); rec.th=v('f-g-th').trim(); var w0=v('f-g-w0').trim().split(/\s+/).filter(Boolean); rec.w0=(w0.length===rec.a.length&&w0.join('')!==rec.a.join(''))?w0:shuffle(rec.a); if(!rec.q||rec.a.length<2) ok=false; }
    else { rec.zh=v('f-g-zh').trim(); rec.py=v('f-g-py').trim(); rec.q=v('f-g-q').trim(); rec.a=v('f-g-a').trim(); rec.w=[v('f-g-w1').trim(),v('f-g-w2').trim()]; rec.th=v('f-g-th').trim(); if(!rec.zh||!rec.q||!rec.a||!rec.w[0]||!rec.w[1]) ok=false; }
    if(!ok){ toast('กรอกข้อมูลสำคัญให้ครบก่อนนะ'); return; }
    c.questions = c.questions || [];
    if(idx === null || idx === undefined) c.questions.push(rec);
    else c.questions[idx] = rec;
    saveGameCats();
    editState.gameQ = null;
    toast('บันทึกคำถามแล้ว ✓');
    renderAdmin();
    return;
  }
  /* เดิม: เกมมาตรฐาน 6 เกม */
  if(typeof _origSaveGameQ === 'function') return _origSaveGameQ(gid, idx);
  var v2 = function(id){ return ($('#'+id) && $('#'+id).value) || ''; };
  var lv2 = pendingFormLevel || activeLv || 1;
  var rec2 = {lv:lv2}; var ok2 = true;
  if(gid === 'fill'){ rec2.q=v2('f-g-q').trim(); rec2.a=v2('f-g-a').trim(); rec2.w=[v2('f-g-w1').trim(),v2('f-g-w2').trim()]; rec2.th=v2('f-g-th').trim(); rec2.py=v2('f-g-py').trim(); if(!rec2.q||!rec2.a||!rec2.w[0]||!rec2.w[1]) ok2=false; if(rec2.q.indexOf('___')<0) rec2.q=rec2.q.replace(/\s*_+\s*/,'___'); }
  else if(gid==='vocab'){ rec2.q=v2('f-g-q').trim(); rec2.py=v2('f-g-py').trim(); rec2.a=v2('f-g-a').trim(); rec2.w=[v2('f-g-w1').trim(),v2('f-g-w2').trim()]; if(!rec2.q||!rec2.a||!rec2.w[0]||!rec2.w[1]) ok2=false; }
  else if(gid==='pinyin'){ rec2.q=v2('f-g-q').trim(); rec2.a=v2('f-g-a').trim(); rec2.w=[v2('f-g-w1').trim(),v2('f-g-w2').trim()]; rec2.th=v2('f-g-th').trim(); if(!rec2.q||!rec2.a||!rec2.w[0]||!rec2.w[1]) ok2=false; }
  else if(gid==='tone'){ rec2.q=v2('f-g-q').trim(); rec2.target=v2('f-g-target').trim(); rec2.a=v2('f-g-a'); rec2.w=[v2('f-g-w1').trim(),v2('f-g-w2').trim()].filter(function(x){return x&&x!==rec2.a;}); rec2.th=v2('f-g-th').trim(); if(!rec2.q||!rec2.target) ok2=false; while(rec2.w.length<2) rec2.w.push(String(1+rec2.w.length)); rec2.w=rec2.w.slice(0,2); }
  else if(gid==='order'){ rec2.q=v2('f-g-q').trim(); rec2.a=v2('f-g-a').trim().split(/\s+/).filter(Boolean); rec2.th=v2('f-g-th').trim(); var w02=v2('f-g-w0').trim().split(/\s+/).filter(Boolean); rec2.w0=(w02.length===rec2.a.length&&w02.join('')!==rec2.a.join(''))?w02:shuffle(rec2.a); if(!rec2.q||rec2.a.length<2) ok2=false; }
  else { rec2.zh=v2('f-g-zh').trim(); rec2.py=v2('f-g-py').trim(); rec2.q=v2('f-g-q').trim(); rec2.a=v2('f-g-a').trim(); rec2.w=[v2('f-g-w1').trim(),v2('f-g-w2').trim()]; rec2.th=v2('f-g-th').trim(); if(!rec2.zh||!rec2.q||!rec2.a||!rec2.w[0]||!rec2.w[1]) ok2=false; }
  if(!ok2){ toast('กรอกข้อมูลสำคัญให้ครบก่อนนะ'); return; }
  DB.games[gid] = DB.games[gid] || [];
  if(idx === null || idx === undefined) DB.games[gid].push(rec2);
  else DB.games[gid][idx] = rec2;
  store.set('games', DB.games);
  editState.gameQ = null;
  activeLv = lv2;
  pendingFormLevel = null;
  toast('บันทึกคำถามแล้ว ✓');
  renderAdmin();
}

/* ==========================================================================
   ✍️ BLOG — เขียนบทความเองแบบ WordPress
   ========================================================================== */
function adminBlog(){
  var posts = allBlogPosts();
  var cur = blogState.id ? findBlogPost(blogState.id) : null;
  var tags = blogTags();

  var list = ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>✍️ บทความบล็อก (' + posts.length + ')</h3>'
    +   '<button class="mini-btn" onclick="newBlogPost()">+ เขียนบทความใหม่</button></div>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">'
    +   'เขียนบทความของตัวเองได้ที่นี่แบบเดียวกับ WordPress — มีแท็ก รูปปก ปักหมุด และเผยแพร่/ฉบับร่าง</p>'
    + '<div class="toolbar">'
    +   '<input class="search-in" placeholder="🔍 ค้นหาบทความบล็อก" value="' + esc(blogState.filterTag||'') + '" '
    +   'data-search="blog" oninput="onAdminSearch(this,\'blog\',function(v){blogState.filterTag=v;})">'
    +   '<button class="mini-btn ghost" onclick="exportData(\'blog\')">⬇ สำรองข้อมูล</button>'
    + '</div>'
    + '<div>'
    + (posts.filter(function(p){ var q=(blogState.filterTag||'').toLowerCase(); return !q || ((p.title||'')+(p.body||'')+(p.tags||[]).join(' ')).toLowerCase().indexOf(q)>-1; }).map(function(p){
        return '<div class="row-card"><div class="top"><div class="txt">'
          + '<b>' + (p.pinned?'📌 ':'') + esc(p.title) + (p.status!=='published'?' <span class="tag-pill">ฉบับร่าง</span>':'') + '</b>'
          + '<small>' + (p.tags||[]).map(function(t){return '#'+esc(t);}).join(' ') + ' · ' + fmtDate(p.ts) + '</small></div>'
          + '<div class="acts">'
          +   '<button class="icon-btn ok" onclick="editBlogPost(\'' + esc(p.id) + '\')">✏️</button>'
          +   '<button class="icon-btn" onclick="go(\'blog\',\'' + esc(p.id) + '\')">👁</button>'
          +   '<button class="icon-btn warn" onclick="pinBlogPost(\'' + esc(p.id) + '\')">' + (p.pinned?'📍':'📌') + '</button>'
          +   '<button class="icon-btn" onclick="delBlogPost(\'' + esc(p.id) + '\')">🗑</button>'
          + '</div></div></div>';
      }).join('') || '<div class="empty">ยังไม่มีบทความ — กด “เขียนบทความใหม่” ด้านบน</div>')
    + '</div></div>';

  if(!cur) return list;

  var editor = ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>✏️ ' + (blogState.id==='new' ? 'เขียนบทความใหม่' : 'แก้ไข: ' + esc(cur.title)) + '</h3>'
    +   '<div style="display:flex;gap:9px;flex-wrap:wrap">'
    +   '<button class="mini-btn" onclick="saveBlogPost()">💾 บันทึก</button>'
    +   '<button class="mini-btn ghost" onclick="saveBlogPost(true)">💾 บันทึกเป็นฉบับร่าง</button>'
    +   '<button class="mini-btn ghost" onclick="go(\'blog\',\'' + esc(cur.id) + '\')">↗ ดูบนเว็บ</button>'
    +   '<button class="mini-btn ghost" onclick="blogState.id=null;renderAdminBody()">ปิด</button>'
    +   '</div></div>'
    + '<div class="field"><label>หัวข้อ</label><input id="bg-title" value="' + esc(cur.title) + '" placeholder="หัวข้อบทความ"></div>'
    + '<div class="field"><label>แท็ก (คั่นด้วยจุลภาค)</label><input id="bg-tags" value="' + esc((cur.tags||[]).join(', ')) + '" placeholder="เรียนจีน, HSK, เคล็ดลับ" list="blogTagList">'
    +   '<datalist id="blogTagList">' + tags.map(function(t){return '<option value="'+esc(t)+'">';}).join('') + '</datalist></div>'
    + '<div class="field"><label>รูปปก (ไม่บังคับ)</label>' + uploadBox('blogCover', cur.cover||'', 1200, true) + '</div>'
    + '<div class="field"><label>เนื้อหา — รองรับการจัดหน้า: ขึ้นบรรทัดใหม่ = ย่อหน้าใหม่, <code>**ตัวหนา**</code>, <code># หัวข้อ</code>, <code>- รายการ</code></label>'
    +   '<textarea id="bg-body" style="min-height:320px;font-size:15px;line-height:1.9" placeholder="เขียนเนื้อหาที่นี่...">' + esc(cur.body) + '</textarea></div>'
    + '<div class="form-acts">'
    +   '<button class="mini-btn" onclick="saveBlogPost()">💾 เผยแพร่</button>'
    +   '<button class="mini-btn ghost" onclick="saveBlogPost(true)">💾 ฉบับร่าง</button>'
    + '</div></div>';

  return editor + list;
}
function blogPostById(id){
  return (DB.blog||[]).filter(function(p){return p.id===id;})[0] || null;
}
function newBlogPost(){
  var p = {id: uid('bg-'), title:'', body:'', tags:[], cover:'', status:'draft', ts:Date.now(), pinned:false};
  DB.blog = DB.blog || [];
  DB.blog.push(p);
  store.set('blog', DB.blog);
  blogState.id = p.id;
  renderAdminBody();
  setTimeout(function(){ if($('#bg-title')) $('#bg-title').focus(); },60);
}
function editBlogPost(id){ blogState.id = id; renderAdminBody(); }
function saveBlogPost(asDraft){
  var p = blogPostById(blogState.id);
  if(!p) return;
  p.title = (($('#bg-title') && $('#bg-title').value) || '').trim();
  if(!p.title){ toast('ใส่หัวข้อก่อนนะ'); return; }
  p.body = ($('#bg-body') && $('#bg-body').value) || '';
  p.tags = (($('#bg-tags') && $('#bg-tags').value) || '').split(',').map(function(t){return t.trim();}).filter(Boolean);
  p.cover = takeImage('blogCover', p.cover || '');
  p.status = asDraft ? 'draft' : 'published';
  if(!p.ts) p.ts = Date.now();
  store.set('blog', DB.blog);
  toast(asDraft ? 'บันทึกฉบับร่างแล้ว' : 'เผยแพร่แล้ว ✓');
  renderAdmin();
}
function pinBlogPost(id){
  var p = blogPostById(id); if(!p) return;
  p.pinned = !p.pinned;
  store.set('blog', DB.blog);
  renderAdminBody();
}
function delBlogPost(id){
  if(!confirm('ลบบทความบล็อกนี้?')) return;
  DB.blog = (DB.blog||[]).filter(function(p){return p.id!==id;});
  store.set('blog', DB.blog);
  if(blogState.id === id) blogState.id = null;
  toast('ลบแล้ว'); renderAdmin();
}

/* ==========================================================================
   🧭 NAV — ลำดับของทุกรายการเมนูบน (built-in + หน้าเอง)
   ========================================================================== */
function adminNav(){
  var nav = DB.nav || [];
  var usedTitles = {};
  return ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>🧭 ลำดับเมนูด้านบนเว็บ (' + nav.length + ' รายการ)</h3>'
    +   '<button class="mini-btn ghost" onclick="go(\'home\')">↗ ดูผลบนเว็บ</button></div>'
    + '<p style="font-size:13.5px;color:var(--text-2);margin-bottom:16px">'
    +   'หน้านี้รวม<b>ทุกหน้า</b>ของเว็บ ทั้งหน้าหลัก (หน้าแรก, เริ่มเรียน, บทความ, HSK, เกมภาษา, อักษร 3000, บล็อก, ร้านค้า) และหน้าที่สร้างเอง '
    +   '— ใช้ปุ่ม ↑↓ จัดลำดับการแสดงบนแถบเมนูได้, เปลี่ยนชื่อที่แสดงได้, ซ่อนไม่ให้แสดงได้</p>'
    + '<div>'
    + (nav.map(function(n, i){
        var custom = !NAV_TITLES[n.id];
        var pg = custom ? findPage(n.id) : null;
        var name = navItemTitle(n);
        return '<div class="row-card"><div class="top"><div class="txt">'
          + '<b>' + (i+1) + '. ' + (custom ? (pg && pg.icon ? pg.icon + ' ' : '') : '') + esc(name)
          + (n.show===false ? ' <span class="tag-pill">ซ่อนอยู่</span>' : '')
          + (custom ? ' <span class="tag-pill jade">หน้าสร้างเอง</span>' : ' <span class="tag-pill">หน้าหลัก</span>') + '</b>'
          + '<small>' + esc(n.id) + (custom ? ' · แก้เนื้อหาได้ที่แท็บ 📄 หน้าเว็บ' : '') + '</small></div>'
          + '<div class="acts">'
          +   '<button class="icon-btn" title="เลื่อนขึ้น" onclick="moveNavItem(\'' + esc(n.id) + '\',-1)">↑</button>'
          +   '<button class="icon-btn" title="เลื่อนลง" onclick="moveNavItem(\'' + esc(n.id) + '\',1)">↓</button>'
          +   '<button class="icon-btn ok" title="เปลี่ยนชื่อที่แสดง" onclick="renameNavItem(\'' + esc(n.id) + '\')">✏️</button>'
          +   '<button class="icon-btn" title="' + (n.show===false?'แสดง':'ซ่อน') + '" onclick="toggleNavItem(\'' + esc(n.id) + '\')">' + (n.show===false?'🚫':'👁') + '</button>'
          + (custom ? '<button class="icon-btn warn" title="แก้ไขหน้า" onclick="editCustomPage(\'' + esc(n.id) + '\');switchAdmin(\'pages\')">📄</button>' : '')
          + '</div></div></div>';
      }).join('') || '<div class="empty">ไม่มีรายการเมนู</div>')
    + '</div>'
    + (navState.renameId !== null ? '<div class="edit-form open"><h4>เปลี่ยนชื่อที่แสดง: ' + esc(navItemTitle({id:navState.renameId})) + '</h4>'
        + '<div class="field"><label>ชื่อใหม่</label><input id="nav-rname" value="' + esc((DB.nav.filter(function(n){return n.id===navState.renameId;})[0]||{}).title||navItemTitle({id:navState.renameId})) + '"></div>'
        + '<div class="form-acts"><button class="mini-btn" onclick="saveNavRename()">💾 บันทึก</button>'
        + '<button class="mini-btn ghost" onclick="navState.renameId=null;renderAdminBody()">ยกเลิก</button></div></div>' : '')
    + '</div>';
}
var navState = {renameId:null};
function saveNav(){ store.set('nav', DB.nav); renderNavMenu(); }
function moveNavItem(id, dir){
  var nav = DB.nav || [];
  var i = nav.map(function(n){return n.id;}).indexOf(id);
  if(i < 0) return;
  var j = i + dir;
  if(j < 0 || j >= nav.length) return;
  var t = nav[i]; nav[i] = nav[j]; nav[j] = t;
  saveNav();
  renderAdminBody();
}
function toggleNavItem(id){
  var n = (DB.nav||[]).filter(function(x){return x.id===id;})[0];
  if(!n) return;
  n.show = n.show === false;
  saveNav();
  toast(n.show ? 'แสดงในเมนูแล้ว' : 'ซ่อนจากเมนูแล้ว');
  renderAdminBody();
}
function renameNavItem(id){
  navState.renameId = id;
  if(adminTab !== 'nav'){ adminTab = 'nav'; renderAdmin(); }
  else renderAdminBody();
  setTimeout(function(){ if($('#nav-rname')) $('#nav-rname').focus(); },60);
}
function saveNavRename(){
  var name = (($('#nav-rname') && $('#nav-rname').value) || '').trim();
  if(!name){ toast('ใส่ชื่อก่อน'); return; }
  var n = (DB.nav||[]).filter(function(x){return x.id===navState.renameId;})[0];
  if(n){
    n.title = name;
    if(!NAV_TITLES[n.id]){
      /* หน้าเอง: เปลี่ยนชื่อเพจจริงด้วย */
      var pg = findPage(n.id);
      if(pg){ pg.title = name; store.set('pages', DB.pages); }
    }
    saveNav();
  }
  navState.renameId = null;
  toast('บันทึกแล้ว ✓');
  renderAdmin();
}

/* ==========================================================================
   📦 EXPORT — สร้างไฟล์ custom.js จากข้อมูลปัจจุบัน (ใช้คู่กับการเผยแพร่ออนไลน์)
   ========================================================================== */
function buildExportData(){
  var cleanList = function(arr, keys){
    return (arr||[]).filter(function(x){ return x && !x.__deleted; }).map(function(x){
      var o = {}; keys.forEach(function(k){ if(x[k] !== undefined) o[k] = x[k]; });
      return o;
    });
  };
  var data = {
    ver: Date.now(),
    hsk: {}, articles: [], cats: {}, games: {},
    products: [], theme: {}, daily: {}, pages: [],
    gameCats: [], blog: [], nav: [], settings: {}, auth: {}
  };
  /* HSK: ทั้ง 6 ระดับตามที่เห็นในระบบตอนนี้ */
  for(var i=1;i<=6;i++){
    data.hsk[i] = (DB.hsk[i]||[]).map(function(w){
      return {cn:w.cn, py:w.py||'', th:w.th||'', pos:w.pos||'', vn:w.vn||'', v3:!!w.v3, cat:w.cat||''};
    });
  }
  /* บทความ: รายการสมบูรณ์ที่เห็นบนเว็บ (รวมบทความใหม่ที่แอดมินเขียน) */
  data.articles = allArticles().map(function(a){
    return {id:a.id, title:a.title, tag:a.tag||'', level:a.level||1, zh:a.zh||'', py:a.py||'', th:a.th||'', words:a.words||[]};
  });
  /* หมวดคำศัพท์ */
  Object.keys(DB.cats||{}).forEach(function(k){ data.cats[k] = (DB.cats[k]||[]).slice(); });
  /* คลังคำถามเกม 6 ชนิด */
  ['fill','vocab','pinyin','tone','order','reading'].forEach(function(g){
    data.games[g] = (DB.games[g]||[]).map(function(q){ return q; });
  });
  /* สินค้า */
  data.products = cleanList(DB.products, ['id','name','cn','price','desc','icon','badge','img','category','tags','featured','sold','stock']);
  /* ธีม / คำประจำวัน / ตั้งค่า / บัญชีแอดมิน */
  data.theme = DB.theme || {};
  data.daily = DB.daily || {};
  data.settings = DB.settings || {};
  data.auth = DB.auth || {user:'admin', pwd:'admin123'};
  /* หน้าเว็บที่สร้างเอง */
  data.pages = cleanList(DB.pages, ['id','title','heading','sub','icon','watermark','order','inNav','show','blocks']);
  /* หมวดหมู่เกมที่สร้างเอง */
  data.gameCats = (DB.gameCats||[]).map(function(c){ return c; });
  /* บทความบล็อก */
  data.blog = cleanList(DB.blog, ['id','title','body','tags','cover','status','ts','pinned']);
  /* ลำดับเมนู */
  data.nav = (DB.nav||[]).map(function(n){ return {id:n.id, title:n.title, show:n.show!==false}; });
  return data;
}
function exportFileText(){
  var data = buildExportData();
  var header = '/* 为什么中文 · ข้อมูลที่แอดมินส่งออกจากหลังบ้าน\n'
    + '   สร้างเมื่อ: ' + new Date().toLocaleString('th-TH') + '\n'
    + '   วิธีใช้: นำไฟล์นี้ไปวางแทน assets/data/custom.js แล้วอัปโหลดเว็บใหม่\n'
    + '   ผู้เข้าชมทุกคนจะเห็นเนื้อหาตามไฟล์นี้โดยอัตโนมัติ */\n';
  return header
    + 'window.WC_DATA = window.WC_DATA || {};\n'
    + 'window.WC_DATA.custom = ' + JSON.stringify(data) + ';';
}
function downloadExport(){
  var txt = exportFileText();
  var blob = new Blob([txt], {type:'text/javascript;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'custom.js';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 400);
  toast('สร้างไฟล์ custom.js แล้ว — ตรวจโฟลเดอร์ดาวน์โหลด');
}
function adminExport(){
  var data = buildExportData();
  var wc = 0; for(var i=1;i<=6;i++) wc += (data.hsk[i]||[]).length;
  var preview = exportFileText();
  if(preview.length > 4000) preview = preview.slice(0, 4000) + '\n/* ... (ตัดตัวอย่าง) ... */';
  return ''
    + '<div class="panel">'
    + '<div class="panel-head"><h3>📦 ส่งออกข้อมูลลงไฟล์เว็บ (custom.js)</h3></div>'
    + '<div style="font-size:14.5px;color:var(--text-2);line-height:1.9">'
    +   '<p>เนื้อหาทั้งหมดในเว็บตอนนี้:<br>'
    +   '🔤 คำศัพท์ <b>' + wc + '</b> คำ · 📖 บทความ <b>' + data.articles.length + '</b> เรื่อง · '
    +   '🎮 เกม <b>' + data.gameCats.length + '</b> หมวดที่สร้างเอง · 📄 หน้าเว็บ <b>' + data.pages.length + '</b> หน้า · '
    +   '✍️ บล็อก <b>' + data.blog.length + '</b> โพสต์</p>'
    +   '<p style="background:rgba(201,162,74,.1);border:1px solid rgba(201,162,74,.35);border-radius:10px;padding:12px 14px">'
    +   '<b>วิธีใช้ (หลังเว็บเผยแพร่แล้ว):</b><br>'
    +   '1. แก้เนื้อหาที่ไหนก็ได้ (เครื่องตัวเองหรือเว็บออนไลน์ก็ได้) → เข้าหลังบ้านแท็บนี้<br>'
    +   '2. กด <b>⬇ ดาวน์โหลด custom.js</b><br>'
    +   '3. นำไฟล์ไปวางทับ <code>assets/data/custom.js</code> ในโฟลเดอร์เว็บ<br>'
    +   '4. อัปโหลดเว็บใหม่ (ลากโฟลเดอร์ลง Netlify Drop อีกครั้ง) → <b>ผู้เข้าชมทุกคนเห็นเนื้อหาใหม่ทันที</b> '
    +   '(รวมคนที่เคยเข้าชมแล้วด้วย)</p>'
    +   '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0">'
    +     '<button class="btn btn-primary" onclick="downloadExport()">⬇ ดาวน์โหลด custom.js</button>'
    +     '<button class="btn btn-ghost" onclick="toast(\'คัดลอกข้อความจากกล่องด้านล่างได้เลย\')">📋 ดูโค้ดไฟล์</button>'
    +   '</div>'
    +   '<textarea id="exportPreview" readonly style="width:100%;min-height:260px;font:11.5px/1.6 ui-monospace,Menlo,monospace;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px">'
    +   esc(preview) + '</textarea>'
    + '</div></div>';
}

/* ==========================================================================
   ควบคุมฟีเจอร์ — เปิด/ปิด + กำหนดพรีเมียม ทุกฟีเจอร์/บทความ/เกม
   ========================================================================== */
function adminFeatures(){
  DB.features = DB.features || {};
  DB.itemCfg = DB.itemCfg || {articles:{}, games:{}};
  const rows = FEATURE_IDS.map(function(id){
    const cfg = featureCfg(id);
    return '<div class="social-edit-row" style="grid-template-columns:1.3fr auto auto auto">'
      + '<b style="font-size:13px">' + esc(FEATURE_NAMES[id] || id) + '</b>'
      + '<label class="ftr-switch"><input type="checkbox" ' + (cfg.on?'checked':'') + ' onchange="setFeature(\'' + id + '\',\'on\',this.checked)"> เปิดใช้</label>'
      + '<label class="ftr-switch"><input type="checkbox" ' + (cfg.premium?'checked':'') + ' onchange="setFeature(\'' + id + '\',\'premium\',this.checked)"> พรีเมียมเท่านั้น</label>'
      + '<span class="tag-pill ' + (featureGate(id)==='ok' ? 'jade' : 'red') + '">' + (featureGate(id)==='ok'?'เปิดใช้งาน':'จำกัด') + '</span>'
      + '</div>';
  }).join('');

  const artRows = allArticles().map(function(a){
    const c = DB.itemCfg.articles[a.id] || {on:true, premium:false};
    return '<div class="social-edit-row" style="grid-template-columns:1.4fr auto auto">'
      + '<span style="font-size:12.5px">' + esc(a.title) + ' <i style="color:var(--text-3);font-size:11px">(' + esc(a.tag||'') + ')</i></span>'
      + '<label class="ftr-switch"><input type="checkbox" ' + (c.on!==false?'checked':'') + ' onchange="setItemCfg(\'articles\',\'' + a.id + '\',\'on\',this.checked)"> เปิดใช้</label>'
      + '<label class="ftr-switch"><input type="checkbox" ' + (c.premium?'checked':'') + ' onchange="setItemCfg(\'articles\',\'' + a.id + '\',\'premium\',this.checked)"> พรีเมียม</label>'
      + '</div>';
  }).join('');

  const gameRows = GAME_DEFS.map(function(g){
    const c = DB.itemCfg.games[g.id] || {on:true, premium:false};
    return '<div class="social-edit-row" style="grid-template-columns:1.4fr auto auto">'
      + '<span style="font-size:12.5px">' + esc(g.name) + ' <i style="color:var(--text-3);font-size:11px">(' + g.id + ')</i></span>'
      + '<label class="ftr-switch"><input type="checkbox" ' + (c.on!==false?'checked':'') + ' onchange="setItemCfg(\'games\',\'' + g.id + '\',\'on\',this.checked)"> เปิดใช้</label>'
      + '<label class="ftr-switch"><input type="checkbox" ' + (c.premium?'checked':'') + ' onchange="setItemCfg(\'games\',\'' + g.id + '\',\'premium\',this.checked)"> พรีเมียม</label>'
      + '</div>';
  }).join('');

  return ''
    + '<div class="panel"><h3>เปิด/ปิดฟีเจอร์หลักของเว็บ</h3>'
    + '<p style="font-size:13px;color:var(--text-2);margin-bottom:14px">สลับเปิด-ปิดแต่ละฟีเจอร์ และกำหนดว่าให้ใช้ได้เฉพาะสมาชิกพรีเมียม — บันทึกอัตโนมัติเมื่อสลับ</p>'
    + rows + '</div>'
    + '<div class="panel"><h3>บทความ — เปิด/ปิดรายบทความ + พรีเมียม</h3><div class="admin-scroll">' + artRows + '</div></div>'
    + '<div class="panel"><h3>เกม — เปิด/ปิดรายเกม + พรีเมียม</h3>' + gameRows + '</div>';
}
function setFeature(id, key, val){
  DB.features = DB.features || {};
  DB.features[id] = DB.features[id] || {};
  DB.features[id][key] = val;
  saveSettings();
  renderAdminBody();
  /* เรียลไทม์: เขียนคลาวด์ → ทุกเบราว์เซอร์อัปเดตทันที */
  if(typeof sbConfigured === 'function' && sbConfigured()){ try{ sbPushConfig('features', DB.features); }catch(e){} }
  toast('บันทึกแล้ว' + (sbConfigured() ? ' ⚡ อัปเดตทุกเครื่องทันที' : ''));
}
function setItemCfg(group, id, key, val){
  DB.itemCfg = DB.itemCfg || {articles:{}, games:{}};
  DB.itemCfg[group] = DB.itemCfg[group] || {};
  DB.itemCfg[group][id] = DB.itemCfg[group][id] || {};
  DB.itemCfg[group][id][key] = val;
  saveSettings();
  renderAdminBody();
  if(typeof sbConfigured === 'function' && sbConfigured()){ try{ sbPushConfig('itemCfg', DB.itemCfg); }catch(e){} }
  toast('บันทึกแล้ว' + (sbConfigured() ? ' ⚡ อัปเดตทุกเครื่องทันที' : ''));
}
