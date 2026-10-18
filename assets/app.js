/* ==========================================================================
   为什么中文 · Wèi Shénme Zhōngwén
   Core app: state, storage, router, user accounts, progress
   ========================================================================== */
'use strict';

/* ==========================================================================
   1. DATA LAYER  (localStorage-backed)
   ========================================================================== */
const D = window.WC_DATA || (window.WC_DATA = {});
/* CUSTOM — ไฟล์ assets/data/custom.js ที่แอดมินส่งออกจากหลังบ้าน (📦 ส่งออกเว็บ)
   เป็น "ความจริงชุดใหม่" ของเนื้อหาเว็บ — ผู้เข้าชมทุกคนเห็นข้อมูลจากไฟล์นี้ */
const CUSTOM = D.custom || null;
const CHARS  = D.chars  || [];          /* [{c,p,t,th,e,s,n}] 通用规范汉字表 3000 */
const HSK    = (CUSTOM && CUSTOM.hsk) ? CUSTOM.hsk : (D.hsk || {});  /* {1:[{cn,py,th}],...} */
const CATS   = (CUSTOM && CUSTOM.cats) ? CUSTOM.cats : (D.cats || {}); /* {หมวด:[{cn,py,th}]} */
const ARTS   = (CUSTOM && CUSTOM.articles) ? CUSTOM.articles : (D.articles || []); /* บทความ */
const GAMES  = (CUSTOM && CUSTOM.games) ? CUSTOM.games : (D.games || {}); /* level banks */

/* --------------------------------------------------------------------------
   SITE SETTINGS  (editable from the admin panel)
-------------------------------------------------------------------------- */
const SOCIAL_DEFS = [
  {id:'facebook', name:'Facebook',  color:'#1877f2', ph:'ชื่อเพจหรือลิงก์'},
  {id:'ig',       name:'Instagram', color:'#ee2a7b', ph:'@username หรือลิงก์'},
  {id:'lemon8',   name:'Lemon8',    color:'#ffb800', ph:'@username หรือลิงก์'},
  {id:'tiktok',   name:'TikTok',    color:'#2f2822', ph:'@username หรือลิงก์'},
  {id:'line',     name:'LINE',      color:'#06c755', ph:'@lineid'},
  {id:'youtube',  name:'YouTube',   color:'#ff0000', ph:'ชื่อช่องหรือลิงก์'},
  {id:'telegram', name:'Telegram',  color:'#229ed9', ph:'@channel'},
  {id:'x',        name:'X (Twitter)', color:'#111111', ph:'@username'},
  {id:'whatsapp', name:'WhatsApp',  color:'#25d366', ph:'เบอร์โทร'},
  {id:'wechat',   name:'WeChat',    color:'#07c160', ph:'WeChat ID'}
];

const DEFAULT_SETTINGS = {
  brandName: '为什么中文',
  brandLatin: 'Wèi shénme Zhōngwén',
  logo: '',                 /* data URL — ว่าง = ใช้ไฟล์ใน assets */
  banner: '',               /* แบนเนอร์มุมขวาบน */
  bannerLink: '',
  footerTagline: 'สู้ ๆ และเรียนภาษาจีนไปด้วยกัน · 加油！',
  socialHeading: 'ติดตามเราได้ที่ · 关注我们',
  socialIntro: '',
  contactHeading: 'ช่องทางติดต่อ · 联系我们',
  contactIntro: 'สอบถามเรื่องสินค้า การสั่งซื้อ หรือสื่อการเรียนเพิ่มเติม',
  shopSocialHeading: 'ติดตามเราได้ที่ · 关注我们',
  footerAbout: 'เรียนภาษาจีนด้วยคำถาม — บทความสั้น ระบบ HSK 1–6 เกมแบบด่าน และอักษรจีน 3,000 ตัว',
  copyright: '© 2025 为什么中文 · Wèi shénme Zhōngwén',
  contact: [
    {icon:'📧', label:'อีเมล',  value:''},
    {icon:'💬', label:'LINE',  value:''},
    {icon:'📞', label:'โทรศัพท์', value:''},
    {icon:'📍', label:'ที่อยู่', value:''}
  ],
  showContact: true,
  showSocial: true,
  social: {
    facebook:{on:true,  handle:'', url:''},
    ig:{on:true,        handle:'', url:''},
    lemon8:{on:true,    handle:'', url:''},
    tiktok:{on:false,   handle:'', url:''},
    line:{on:false,     handle:'', url:''},
    youtube:{on:false,  handle:'', url:''},
    telegram:{on:false, handle:'', url:''},
    x:{on:false,        handle:'', url:''},
    whatsapp:{on:false, handle:'', url:''},
    wechat:{on:false,   handle:'', url:''}
  },
  game: { perLevel: 10, passPct: 70, star3Pct: 90, hp: 5, hpRegenMin: 12 },
  /* ระบบพรีเมียม + การชำระเงิน (แก้ราคา/ช่องทางจากหลังบ้าน) */
  premium: {
    plans: [
      {id:'m1',   name:'รายเดือน',   months:1, price:99,   popular:false},
      {id:'m6',   name:'6 เดือน',    months:6, price:490,  popular:true},
      {id:'life', name:'ตลอดชีพ',    months:0, price:1490, popular:false}
    ],
    ppId: '',                       /* เลขพร้อมเพย์ (เบอร์โทร / เลขบัตรประชาชน) */
    ppName: '为什么中文',
    bank: '',                       /* ข้อความเลขบัญชีธนาคาร */
    paypal: '',                     /* ลิงก์ paypal.me/xxx */
    secret: 'why-cn-premium-2025',  /* คีย์สร้างรหัสปลดล็อก */
    codes: []                       /* ประวัติรหัสปลดล็อกที่ออก */
  }
};

/* --------------------------------------------------------------------------
   THEME  (every value is a CSS custom property the admin can override)
-------------------------------------------------------------------------- */
const DEFAULT_THEME = {
  on: false,
  colors: {
    '--bg':        '#faf4e8',
    '--bg-2':      '#f2e7d3',
    '--paper':     '#fffdf7',
    '--brown':     '#8b6f47',
    '--brown-3':   '#5a4632',
    '--red':       '#b23a2e',
    '--red-dark':  '#8a2519',
    '--gold':      '#c9a24a',
    '--text':      '#3a2e25',
    '--text-2':    '#6f6053'
  },
  radius: 20,
  density: 70,
  fontScale: 100,
  fontThai: 'th',
  fontHead: 'head',
  fontNum: 'num',
  headingWeight: 800,
  bodyWeight: 400
};
const THEME_PRESETS = {
  'ครีมทอง (ค่าเริ่มต้น)': { '--bg':'#faf4e8','--bg-2':'#f2e7d3','--paper':'#fffdf7','--brown':'#8b6f47','--brown-3':'#5a4632','--red':'#b23a2e','--red-dark':'#8a2519','--gold':'#c9a24a','--text':'#3a2e25','--text-2':'#6f6053' },
  'หยกเขียว':            { '--bg':'#f2f7f4','--bg-2':'#e2efe8','--paper':'#fdfffd','--brown':'#4a7c6f','--brown-3':'#2f5a4e','--red':'#1f7a5c','--red-dark':'#14563f','--gold':'#9cbf7a','--text':'#22332c','--text-2':'#5b7169' },
  'น้ำเงินหมึก':          { '--bg':'#f4f6fa','--bg-2':'#e6ebf4','--paper':'#ffffff','--brown':'#4a5b78','--brown-3':'#2c3a52','--red':'#2f5fa8','--red-dark':'#1e4278','--gold':'#c9a24a','--text':'#242c3a','--text-2':'#5d6a80' },
  'แดงตราประทับ':        { '--bg':'#fdf6f4','--bg-2':'#f8e6e2','--paper':'#fffdfc','--brown':'#8a5a52','--brown-3':'#5c2f28','--red':'#c0392b','--red-dark':'#8f241a','--gold':'#d4a94e','--text':'#3a2622','--text-2':'#77564f' },
  'ม่วงชบา':            { '--bg':'#f8f5fb','--bg-2':'#eee7f6','--paper':'#fffdfe','--brown':'#6d5b8a','--brown-3':'#463a5c','--red':'#8a4bbf','--red-dark':'#61318c','--gold':'#d6b45c','--text':'#2e2738','--text-2':'#6a6079' },
  'กรมท่าหรู':           { '--bg':'#f5f3ef','--bg-2':'#e8e4dc','--paper':'#fffefb','--brown':'#5a5348','--brown-3':'#332f28','--red':'#1f2a44','--red-dark':'#131b2e','--gold':'#b8944a','--text':'#2a2620','--text-2':'#635c50' },
  'ชาดำ':               { '--bg':'#f2f2f0','--bg-2':'#e4e4e1','--paper':'#ffffff','--brown':'#55554f','--brown-3':'#2a2a27','--red':'#3a3a35','--red-dark':'#1c1c19','--gold':'#a89a6a','--text':'#232320','--text-2':'#5e5e58' }
};

/* --------------------------------------------------------------------------
   DAILY WORD controller
-------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   NAV — ลำดับและชื่อของทุกรายการในแถบเมนูบน (แก้จากหลังบ้านได้)
-------------------------------------------------------------------------- */
const NAV_TITLES = {
  home:'หน้าแรก', learn:'เริ่มเรียน', articles:'บทความ', hsk:'HSK',
  games:'เกมภาษา', chars:'อักษรจีน', shop:'ร้านค้า', premium:'พรีเมียม'
};
/* โหมด/แท็บภายในหน้า (คงอยู่เมื่อสลับหน้า/รีเฟรช) */
let hskMode = sessionStorage.getItem('wszw_hskmode') || 'vocab';   /* vocab | exam */
function setHskMode(m){ hskMode = m; sessionStorage.setItem('wszw_hskmode', m); }
let charTab = sessionStorage.getItem('wszw_chartab') || 'list';    /* list | write | basic */
function setCharTab(t){ charTab = t; sessionStorage.setItem('wszw_chartab', t); }
let learnMode = sessionStorage.getItem('wszw_learnmode') || 'roadmap';  /* roadmap | pinyin */
function setLearnMode(m){ learnMode = m; sessionStorage.setItem('wszw_learnmode', m); }
let artMode = sessionStorage.getItem('wszw_artmode') || 'articles';     /* articles | blog */
function setArtMode(m){ artMode = m; sessionStorage.setItem('wszw_artmode', m); }
const DEFAULT_NAV = [
  {id:'home', title:'หน้าแรก', show:true},
  {id:'learn', title:'เริ่มเรียน', show:true},
  {id:'articles', title:'บทความ', show:true},
  {id:'hsk', title:'HSK', show:true},
  {id:'games', title:'เกมภาษา', show:true},
  {id:'chars', title:'อักษรจีน', show:true},
  {id:'shop', title:'ร้านค้า', show:true},
  {id:'premium', title:'พรีเมียม', show:true}
];

const DEFAULT_DAILY = {
  mode: 'auto',        /* auto | pin */
  pinId: '',           /* "lv|cn" ของคำที่ปักหมุดไว้ */
  levels: [1,2,3,4,5,6],
  pool: 'hsk',         /* hsk | cats | both */
  heading: 'คำศัพท์ประจำวัน',
  sub: 'วันละคำ ก็ยังดีกว่าไม่ได้เรียน — กลับมาทุกวันเพื่อเก็บแต้มสะสม'
};

/* --------------------------------------------------------------------------
   CUSTOM PAGES  (page builder)  —  DB.pages = [{id,title,heading,sub,blocks:[]}]
-------------------------------------------------------------------------- */
const BLOCK_TYPES = [
  { id:'heading',  ic:'🅰️', name:'หัวข้อ',        has:['text'] },
  { id:'text',     ic:'📝', name:'กล่องข้อความ',   has:['text'] },
  { id:'quote',    ic:'❝',  name:'คำคม / กรอบเน้น', has:['text'] },
  { id:'button',   ic:'🔘', name:'ปุ่ม',           has:['label'] },
  { id:'buttons',  ic:'🔗', name:'กลุ่มปุ่ม',      has:['items'] },
  { id:'image',    ic:'🖼️', name:'รูปภาพ',        has:['image'] },
  { id:'columns',  ic:'🧱', name:'แบ่งคอลัมน์',    has:['items'] },
  { id:'cards',    ic:'🗂️', name:'การ์ดหลายใบ',    has:['items'] },
  { id:'spacer',   ic:'↕️', name:'ระยะห่าง',       has:[] },
  { id:'divider',  ic:'➖', name:'เส้นคั่น',        has:[] },
  { id:'html',     ic:'</>', name:'โค้ด HTML',      has:['text'] }
];

const DEFAULT_PAGES = [
  {
    id:'p-about', title:'เกี่ยวกับเรา', icon:'🏮', inNav:true, show:true, order:1,
    heading:'เกี่ยวกับเรา', sub:'รู้จักทีมงานและที่มาของ 为什么中文',
    blocks:[
      { id:'b1', type:'text', text:'为什么中文 คือพื้นที่เรียนภาษาจีนสำหรับคนไทย\nเราเชื่อว่าการเริ่มจาก “คำถาม” ทำให้จำได้นานกว่าการท่องจำ' },
      { id:'b2', type:'divider' },
      { id:'b3', type:'heading', text:'เราทำอะไร' },
      { id:'b4', type:'cards', items:[
        { title:'บทความสั้น',   desc:'อ่านจบใน 2–4 นาที พร้อมพินอินและคำแปลไทย' },
        { title:'เกมแบบด่าน',   desc:'6 เกม 36 ด่าน ไล่จาก HSK 1 ถึง HSK 6' },
        { title:'อักษร 3,000',  desc:'รวมอักษรจีนที่ใช้บ่อยที่สุดตาม 通用规范汉字表' }
      ]},
      { id:'b5', type:'spacer', size:'md' },
      { id:'b6', type:'buttons', items:[
        { label:'เริ่มเรียน',   link:'learn',  style:'primary' },
        { label:'ดูบทความ',     link:'articles', style:'ghost' }
      ]}
    ]
  }
];

const DEFAULT_PRODUCTS = [
  {name:'หนังสือเรียน HSK 1',desc:'หนังสือเรียนพร้อมแบบฝึกหัดและเสียงอ่าน',price:290,icon:'📚'},
  {name:'บัตรคำศัพท์ 500 คำ',desc:'บัตรคำจีน-ไทย พร้อมพินอิน พกพาสะดวก',price:190,icon:'🃏'},
  {name:'สมุดคัดอักษรจีน',desc:'สมุดฝึกเขียนตัวอักษรจีนอย่างถูกต้องตามลำดับขีด',price:120,icon:'✍️'},
  {name:'โปสเตอร์ 3000 常用字',desc:'โปสเตอร์อักษรจีนที่ใช้บ่อย เรียงตามความถี่',price:250,icon:'📜'}
];

const store = {
  get(k, fb){ try{ const v = localStorage.getItem('wszw_'+k); return v ? JSON.parse(v) : (fb===undefined?null:fb); }catch(e){ return fb===undefined?null:fb; } },
  set(k, v){ try{ localStorage.setItem('wszw_'+k, JSON.stringify(v)); }catch(e){ toast('บันทึกไม่ได้ — พื้นที่เก็บข้อมูลเต็ม'); } },
  del(k){ try{ localStorage.removeItem('wszw_'+k); }catch(e){} }
};

const DEFAULT_ARTICLES = [
  {id:'a1',title:'การทักทายครั้งแรก',tag:'บทสนทนาพื้นฐาน',level:1,
   zh:'你好！我叫阿明，很高兴认识你。\n请问你叫什么名字？',
   py:'Nǐ hǎo! Wǒ jiào Āmíng, hěn gāoxìng rènshi nǐ.\nQǐngwèn nǐ jiào shénme míngzi?',
   th:'สวัสดี! ฉันชื่ออามิง ยินดีที่ได้รู้จัก\nขอถามหน่อย คุณชื่ออะไร?',
   words:[['你好','nǐ hǎo','สวัสดี'],['认识','rènshi','รู้จัก'],['名字','míngzi','ชื่อ']]},
  {id:'a2',title:'ที่ร้านอาหาร',tag:'ชีวิตประจำวัน',level:2,
   zh:'服务员，请问这个菜多少钱？\n我要一碗面，谢谢。',
   py:'Fúwùyuán, qǐngwèn zhège cài duōshao qián?\nWǒ yào yì wǎn miàn, xièxie.',
   th:'พนักงานครับ ขอถามหน่อย อาหารจานนี้ราคาเท่าไหร่?\nผมขอเส้นหนึ่งชาม ขอบคุณ',
   words:[['服务员','fúwùyuán','พนักงานบริการ'],['多少','duōshao','เท่าไหร่'],['碗','wǎn','ชาม']]},
  {id:'a3',title:'วันนี้อากาศดี',tag:'ชีวิตประจำวัน',level:2,
   zh:'今天天气很好，我们一起去公园走走，好吗？',
   py:'Jīntiān tiānqì hěn hǎo, wǒmen yìqǐ qù gōngyuán zǒuzou, hǎo ma?',
   th:'วันนี้อากาศดีมาก เราไปเดินเล่นที่สวนสาธารณะด้วยกันไหม?',
   words:[['天气','tiānqì','อากาศ'],['一起','yìqǐ','ด้วยกัน'],['公园','gōngyuán','สวนสาธารณะ']]}
];

const DB = {
  articles: store.get('articles') || DEFAULT_ARTICLES,
  hsk: store.get('hsk') || null,
  cats: store.get('cats') || null,            /* หมวดคำศัพท์ที่แก้ไขได้ */
  games: store.get('games') || null,          /* คลังคำถามเกม 6 ชนิด */
  products: store.get('products') || (CUSTOM && CUSTOM.products) || DEFAULT_PRODUCTS,
  theme: Object.assign({}, DEFAULT_THEME, store.get('theme') || {}),
  daily: Object.assign({}, DEFAULT_DAILY, store.get('daily') || {}),
  pages: store.get('pages') || null,
  gameCats: store.get('gameCats') || null,
  blog: store.get('blog') || null,
  nav: store.get('nav') || null,
  settings: Object.assign({}, DEFAULT_SETTINGS, store.get('settings') || {}),
  auth: store.get('auth') || {user:'admin', pwd:'admin123'}
};

/* merge nested settings so new keys keep their defaults */
(function(){
  const th = store.get('theme');
  if(th){
    DB.theme.colors = Object.assign({}, DEFAULT_THEME.colors, th.colors || {});
  }
  const dl = store.get('daily');
  if(dl && !Array.isArray(dl.levels)) DB.daily.levels = DEFAULT_DAILY.levels.slice();
  const saved = store.get('settings');
  if(saved){
    DB.settings.social = Object.assign({}, DEFAULT_SETTINGS.social, saved.social || {});
    Object.keys(DB.settings.social).forEach(k=>{
      DB.settings.social[k] = Object.assign({}, DEFAULT_SETTINGS.social[k]||{on:false,handle:'',url:''}, DB.settings.social[k]);
    });
    DB.settings.game = Object.assign({}, DEFAULT_SETTINGS.game, saved.game || {});
    const prem = saved.premium;
    if(prem){
      DB.settings.premium = Object.assign({}, DEFAULT_SETTINGS.premium, prem);
      if(!Array.isArray(DB.settings.premium.plans) || !DB.settings.premium.plans.length)
        DB.settings.premium.plans = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.premium.plans));
      if(!Array.isArray(DB.settings.premium.codes)) DB.settings.premium.codes = [];
    }
  }
})();

function saveSettings(){ store.set('settings', DB.settings); applySettings(); }
function setSetting(path, value){
  const parts = path.split('.');
  let o = DB.settings;
  for(let i=0;i<parts.length-1;i++){ o[parts[i]] = o[parts[i]] || {}; o = o[parts[i]]; }
  o[parts[parts.length-1]] = value;
  saveSettings();
}

/* --------------------------------------------------------------------------
   Apply branding + settings to the live DOM
-------------------------------------------------------------------------- */
const ASSET_VER = '20260101';
const DEFAULT_LOGO = 'assets/logo-why-chinese.png?v=' + ASSET_VER;
const DEFAULT_FAVICON = 'assets/favicon.png?v=' + ASSET_VER;

/* ==========================================================================
   THEME — apply admin-chosen colours / radius / density / font scale
   ========================================================================== */
function themeFont(kind, key){
  const MAP = {
    th:   { th:['IBM Plex Sans Thai','Noto Sans Thai','system-ui','sans-serif'],
             th2:['Noto Sans Thai','IBM Plex Sans Thai','system-ui','sans-serif'],
             serif:['Noto Serif Thai','Georgia','serif'] },
    head: { th:['IBM Plex Sans Thai','Noto Sans Thai','system-ui','sans-serif'],
             th2:['Noto Sans Thai','IBM Plex Sans Thai','system-ui','sans-serif'],
             serif:['Noto Serif Thai','Georgia','serif'] },
    num:  { th:['Plus Jakarta Sans','IBM Plex Sans Thai','system-ui','sans-serif'],
             th2:['IBM Plex Sans Thai','Noto Sans Thai','system-ui','sans-serif'],
             serif:['Cormorant Garamond','Georgia','serif'] }
  }[kind];
  const base = (MAP[key]) || MAP.th;
  return "'" + base.join("','") + "'";
}
function applyTheme(){
  const T = DB.theme || DEFAULT_THEME;
  const root = document.documentElement;
  const KEYS = Object.keys(DEFAULT_THEME.colors);
  /* reset everything first so switching presets never leaves leftovers */
  KEYS.forEach(k => root.style.removeProperty(k));
  if(T.on !== false){
    Object.keys(T.colors || {}).forEach(k => {
      if(String(k).indexOf('--') === 0 && T.colors[k]) root.style.setProperty(k, T.colors[k]);
    });
    if(T.radius != null)     root.style.setProperty('--radius',   Math.max(0, Math.min(40, +T.radius)) + 'px');
    if(T.radius != null)     root.style.setProperty('--radius-s', Math.max(0, Math.round(+T.radius * 0.65)) + 'px');
    if(T.density != null)    root.style.setProperty('--section-pad', Math.round(70 * (+T.density / 70)) + 'px');
    if(T.fontScale != null)  root.style.setProperty('--font-scale', (+T.fontScale / 100));
  }
  /* font scale must apply to the body text */
  if(T.on !== false && T.fontScale && +T.fontScale !== 100){
    root.style.setProperty('font-size', (+T.fontScale / 100 * 16) + 'px');
  } else {
    root.style.removeProperty('font-size');
  }
  /* font family + weight overrides (edit from admin) */
  if(T.on !== false){
    if(T.fontThai) root.style.setProperty('--ff-th', themeFont('th', T.fontThai));
    if(T.fontHead) root.style.setProperty('--ff-head', themeFont('head', T.fontHead));
    if(T.fontNum)  root.style.setProperty('--ff-num', themeFont('num', T.fontNum));
    if(T.headingWeight) root.style.setProperty('--head-w', T.headingWeight);
    if(T.bodyWeight)    root.style.setProperty('--body-w', T.bodyWeight);
  }
  const badge = $('#themeLiveChip');
  if(badge) badge.style.display = (T.on !== false) ? '' : 'none';
}

/* ==========================================================================
   DAILY WORD — manual pin or auto pick
   ========================================================================== */
function dailyPool(){
  const d = DB.daily || DEFAULT_DAILY;
  const want = d.pool || 'hsk';
  const lv = (Array.isArray(d.levels) && d.levels.length) ? d.levels : [1,2,3,4,5,6];
  const out = [];
  if(want === 'hsk' || want === 'both'){
    lv.forEach(n => (DB.hsk[n]||[]).forEach(w => { if(w && w.cn) out.push({cn:w.cn, py:w.py, th:w.th, cat:w.cat, lv:n}); }));
  }
  if(want === 'cats' || want === 'both'){
    Object.keys(DB.cats||{}).forEach(k => {
      (DB.cats[k]||[]).forEach(w => { if(w && w.cn) out.push({cn:w.cn, py:w.py, th:w.th, cat:catLabel(k), lv:0}); });
    });
  }
  if(!out.length) out.push({cn:'你好', py:'nǐ hǎo', th:'สวัสดี', lv:1});
  return out;
}
function findWordById(id){
  if(!id) return null;
  const parts = String(id).split('|');
  const lv = +parts[0], cn = parts.slice(1).join('|');
  if(lv >= 1 && lv <= 6){
    const hit = (DB.hsk[lv]||[]).filter(w => w && w.cn === cn)[0];
    if(hit) return {cn:hit.cn, py:hit.py, th:hit.th, cat:hit.cat, lv:lv};
  }
  let found = null;
  Object.keys(DB.cats||{}).forEach(k => {
    (DB.cats[k]||[]).forEach(w => { if(w && w.cn === cn && !found) found = {cn:w.cn, py:w.py, th:w.th, cat:catLabel(k), lv:0}; });
  });
  if(found) return found;
  for(let i=1;i<=6;i++){
    const f = (DB.hsk[i]||[]).filter(w => w && w.cn === cn)[0];
    if(f) return {cn:f.cn, py:f.py, th:f.th, cat:f.cat, lv:i};
  }
  return null;
}
/* deterministic per-day hash so everyone sees the same word each day */
function hashStr(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function getDailyWord(){
  const d = DB.daily || DEFAULT_DAILY;
  if(d.mode === 'pin'){
    const w = findWordById(d.pinId);
    if(w) return Object.assign({pinned:true}, w);
  }
  const pool = dailyPool();
  const idx = hashStr(todayKey()) % pool.length;
  return Object.assign({pinned:false}, pool[idx]);
}

/* ==========================================================================
   BLOG — WordPress-like posts written by the admin
   ========================================================================== */
function allBlogPosts(){
  const list = (DB.blog||[]).filter(p => p && !p.__deleted);
  return list.slice().sort((a,b) => {
    const ta = a.pinned && !b.pinned ? -1 : (!a.pinned && b.pinned ? 1 : 0);
    if(ta) return ta;
    return (+b.ts||0) - (+a.ts||0);
  });
}
function findBlogPost(id){
  return allBlogPosts().filter(p => p.id === id)[0] || null;
}
function blogTags(){
  const set = {};
  allBlogPosts().forEach(p => (p.tags||[]).forEach(t => { if(t) set[t] = 1; }));
  return Object.keys(set).sort();
}
function blogExcerpt(p){
  const txt = String(p.body||'').replace(/<[^>]+>/g,' ').replace(/[#*_\n]+/g,' ').replace(/\s+/g,' ').trim();
  return txt.length > 130 ? txt.slice(0,130) + '…' : txt;
}

/* ==========================================================================
   CUSTOM PAGES
   ========================================================================== */
function allPages(){
  const list = (DB.pages || []).filter(p => p && !p.__deleted);
  return list.slice().sort((a,b) => (+a.order||99) - (+b.order||99));
}
function findPage(id){
  return allPages().filter(p => p.id === id)[0] || null;
}
function navPages(){
  return allPages().filter(p => p.show !== false && p.inNav);
}
function uid(prefix){
  return (prefix||'x') + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

function applySettings(){
  applyTheme();
  const S = DB.settings;
  /* brand text */
  $$('.brand-txt strong').forEach(e => e.textContent = S.brandName);
  $$('.brand-txt span').forEach(e => e.textContent = S.brandLatin);
  $$('.foot-brand strong').forEach(e => e.textContent = S.brandName);
  $$('.foot-brand span').forEach(e => e.textContent = S.brandLatin);
  /* logo image (nav, footer, auth, empty-state) */
  const logo = S.logo || DEFAULT_LOGO;
  $$('.logo img, .foot-brand .logo img, .auth-card .logo-big img, .login-hero .logo-big img')
    .forEach(e => { if(e.getAttribute('src') !== logo) e.setAttribute('src', logo); });
  /* favicon */
  const fav = $('link[rel="icon"]'); if(fav && fav.getAttribute('href') !== (S.logo||DEFAULT_FAVICON)) fav.setAttribute('href', S.logo || DEFAULT_FAVICON);
  /* banner */
  renderBanner();
  /* section headings (editable from the admin panel) */
  $$('.social-heading').forEach(e => { e.textContent = S.socialHeading || 'ติดตามเราได้ที่ · 关注我们'; });
  const shopSocialHead = $('#shopSocialHeading');
  if(shopSocialHead) shopSocialHead.textContent = S.shopSocialHeading || S.socialHeading || 'ติดตามเราได้ที่ · 关注我们';
  const ch = $('#contactHeading'); if(ch) ch.textContent = S.contactHeading || 'ช่องทางติดต่อ · 联系我们';
  const ci = $('#contactIntro');  if(ci) ci.textContent = S.contactIntro || '';
  /* footer */
  const ft = $('#footTagline'); if(ft) ft.textContent = S.footerTagline;
  const fa = $('#footAbout');   if(fa) fa.textContent = S.footerAbout;
  const fc = $('#footCopy');    if(fc) fc.textContent = S.copyright;
  /* contact + social live in the footer */
  renderContact();
  renderSocial();
  document.title = S.brandName + ' · เรียนภาษาจีนด้วยคำถาม';
}
function renderBanner(){
  const box = $('#navBanner'); if(!box) return;
  const S = DB.settings;
  if(!S.banner){ box.innerHTML = ''; return; }
  box.innerHTML = `<img class="nav-banner" src="${S.banner}" alt="banner"
     ${S.bannerLink?`onclick="window.open('${S.bannerLink}','_blank')"`:'style="cursor:default"'}>`;
}
function socialLink(id){
  const s = DB.settings.social[id] || {};
  if(s.url) return s.url;
  const h = (s.handle||'').trim();
  if(!h) return '';
  const base = {
    facebook:'https://facebook.com/', ig:'https://instagram.com/', lemon8:'https://www.lemon8-app.com/',
    tiktok:'https://www.tiktok.com/@', line:'https://line.me/R/ti/p/', youtube:'https://youtube.com/',
    telegram:'https://t.me/', x:'https://x.com/', whatsapp:'https://wa.me/', wechat:'#'
  }[id] || '';
  if(id === 'line' || id === 'whatsapp' || id === 'wechat') return h.startsWith('http') ? h : '#';
  return base + h.replace(/^@/, '');
}
function socialIcon(id){
  const P = {
    facebook:'M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V11H8v3h2v7h3v-7h2.2l.4-3H13v-1.2c0-.5.2-.8.5-.8z',
    ig:'M12 2.2c-2.7 0-3 0-4 .06-1.1.05-1.8.22-2.4.46-.7.26-1.2.6-1.7 1.1-.5.5-.9 1-1.1 1.7-.2.6-.4 1.3-.5 2.4C2.2 9 2.2 9.3 2.2 12s0 3 .06 4c.05 1.1.22 1.8.46 2.4.26.7.6 1.2 1.1 1.7.5.5 1 .9 1.7 1.1.6.2 1.3.4 2.4.5 1 .06 1.3.06 4 .06s3 0 4-.06c1.1-.05 1.8-.22 2.4-.46.7-.26 1.2-.6 1.7-1.1.5-.5.9-1 1.1-1.7.2-.6.4-1.3.5-2.4.06-1 .06-1.3.06-4s0-3-.06-4c-.05-1.1-.22-1.8-.46-2.4a4.6 4.6 0 0 0-1.1-1.7c-.5-.5-1-.9-1.7-1.1-.6-.2-1.3-.4-2.4-.5-1-.06-1.3-.06-4-.06zm0 1.8c2.7 0 2.9 0 4 .06.9.04 1.4.2 1.7.33.4.17.7.37 1 .67.3.3.5.6.67 1 .13.3.3.8.33 1.7.05 1.1.06 1.3.06 4s0 2.9-.06 4c-.04.9-.2 1.4-.33 1.7-.17.4-.37.7-.67 1-.3.3-.6.5-1 .67-.3.13-.8.3-1.7.33-1.1.05-1.3.06-4 .06s-2.9 0-4-.06c-.9-.04-1.4-.2-1.7-.33-.4-.17-.7-.37-1-.67-.3-.3-.5-.6-.67-1-.13-.3-.3-.8-.33-1.7C4 14.9 4 14.7 4 12s0-2.9.06-4c.04-.9.2-1.4.33-1.7.17-.4.37-.7.67-1 .3-.3.6-.5 1-.67.3-.13.8-.3 1.7-.33C8.86 4 9.06 4 12 4zm0 3.1a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zm6.3-8.2a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0z',
    lemon8:'M12 2C8 2 5.5 4 5 7.5c-.3 2.2.6 3.8 1.5 5 .8 1 1.4 1.8 1.2 3.2-.1 1.1-1.3 2-2.7 2.6 1.2 1 2.6 1.5 4 1.6 0-1.4.3-3 1.4-4.2 1.4-1.5 2.4-2 2.4-3.6 0-.7-.3-1.3-.8-1.8.9-.2 1.6-.9 1.6-1.9 0-1.1-.9-2-2-2-.4 0-.8.1-1.1.3C10.3 5.6 11 4.3 12 2z',
    tiktok:'M16.6 5.8a5.4 5.4 0 0 1-1.3-3.5h-3v11.8a2.6 2.6 0 1 1-1.9-2.5V8.5a5.8 5.8 0 1 0 4.9 5.7V9a8.4 8.4 0 0 0 4.4 1.3V7.2a5.4 5.4 0 0 1-3.1-1.4z',
    line:'M21 10.3c0-4-3.9-7.3-8.7-7.3S3.6 6.3 3.6 10.3c0 3.6 3.1 6.6 7.3 7.2.3.06.7.2.8.45.1.22.06.57.03.8l-.13.78c-.04.23-.19.9.79.49 1-.4 5.3-3.1 7.2-5.3 1.3-1.5 2.4-2.9 2.4-4.4zM8.4 12.3H6.9c-.2 0-.35-.15-.35-.35V9.1c0-.2.15-.35.35-.35s.35.15.35.35v2.5h1.15c.2 0 .35.16.35.35s-.16.35-.35.35zm1.7-.35c0 .2-.16.35-.35.35s-.35-.15-.35-.35V9.1c0-.2.16-.35.35-.35s.35.15.35.35v2.85zm3.9 0c0 .16-.1.29-.25.34-.04.01-.08.01-.11.01-.12 0-.23-.05-.3-.14l-1.5-1.98v1.77c0 .2-.16.35-.35.35s-.35-.15-.35-.35V9.1c0-.16.1-.29.25-.33.04-.01.08-.02.11-.02.12 0 .23.06.3.15l1.5 1.98V9.1c0-.2.16-.35.35-.35s.35.15.35.35v2.85zm3.1-1.77c.19 0 .35.16.35.35s-.16.35-.35.35h-1.2v.72h1.2c.19 0 .35.16.35.35s-.16.35-.35.35h-1.55c-.2 0-.35-.15-.35-.35V9.1c0-.2.15-.35.35-.35h1.55c.19 0 .35.15.35.35s-.16.35-.35.35h-1.2v.72h1.2z',
    youtube:'M21.6 7.2s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.2 4.1 12 4.1 12 4.1h-.01s-4.2 0-6.8.2c-.4.05-1.2.05-2 .9-.6.6-.8 2-.8 2S2.2 8.8 2.2 10.5v1.6c0 1.6.2 3.3.2 3.3s.2 1.4.8 2c.8.8 1.8.8 2.2.9 1.6.15 6.6.2 6.6.2s4.2 0 6.8-.2c.4-.05 1.2-.05 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.6c0-1.7-.2-3.3-.2-3.3zM10 14.6V8.9l5.5 2.9-5.5 2.8z',
    telegram:'M21.9 4.6 19 19.3c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.24.24-.44.44-.9.44l.32-4.5 8.4-7.6c.36-.32-.08-.5-.56-.18L7.6 13.3l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.5 1.7z',
    x:'M17.5 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L2 3h6.4l4.4 5.9L17.5 3zm-1.1 16.1h1.7L7.7 4.8H5.9l10.5 14.3z',
    whatsapp:'M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.45-.15-.64.15-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.3-.02-.45.13-.6.13-.13.3-.34.44-.51.15-.17.2-.29.3-.48.1-.19.05-.36-.02-.51-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .97-1 2.37 0 1.4 1.02 2.75 1.16 2.94.15.19 2 3.2 4.88 4.37 2.88 1.16 2.88.77 3.4.72.52-.05 1.68-.68 1.92-1.35.24-.66.24-1.23.17-1.35-.07-.12-.26-.19-.55-.34zM12 2.2C6.6 2.2 2.2 6.6 2.2 12c0 1.73.45 3.36 1.25 4.77L2.2 21.8l5.15-1.35A9.75 9.75 0 0 0 12 21.8c5.4 0 9.8-4.4 9.8-9.8S17.4 2.2 12 2.2zm0 17.8c-1.55 0-3-.43-4.24-1.18l-.3-.18-3.06.8.82-2.98-.2-.31A7.9 7.9 0 0 1 4.1 12c0-4.36 3.55-7.9 7.9-7.9s7.9 3.54 7.9 7.9-3.54 8-7.9 8z',
    wechat:'M8.7 3.5C4.9 3.5 1.8 6.1 1.8 9.3c0 1.85 1.02 3.5 2.62 4.58l-.65 1.97 2.3-1.2c.82.23 1.7.35 2.63.35.22 0 .44 0 .65-.03a5.5 5.5 0 0 1-.23-1.57c0-3.13 3.05-5.67 6.8-5.67.24 0 .47.01.7.03-.57-2.6-3.37-4.29-7.92-4.29zm-2.3 3.1a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9zm4.62 0a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9zM22.2 13.4c0-2.63-2.6-4.77-5.8-4.77s-5.8 2.14-5.8 4.77 2.6 4.77 5.8 4.77c.68 0 1.34-.1 1.95-.27l1.92 1-.53-1.65c1.5-.87 2.46-2.24 2.46-3.85zm-7.7-1.3a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6zm3.8 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6z'
  };
  return P[id] || '';
}
function renderSocial(){
  const S = DB.settings;
  const show = S.showSocial !== false;
  const active = SOCIAL_DEFS.filter(d => (S.social[d.id]||{}).on);
  const visible = show && active.length > 0;

  /* ซ่อนบล็อกโซเชียลทั้งก้อน (รวมหัวข้อ) เมื่อไม่ได้เปิดใช้ */
  const wrap = $('#socialWrap');
  if(wrap) wrap.style.display = visible ? '' : 'none';
  const shopSocial = $('#shopSocialWrap');
  if(shopSocial) shopSocial.style.display = visible ? '' : 'none';

  const html = !visible ? '' : active.map(d=>{
    const s = S.social[d.id] || {};
    const link = socialLink(d.id);
    const has = !!(s.handle || s.url) && link && link !== '#';
    const label = s.handle || s.url || 'ยังไม่ได้ใส่ชื่อบัญชี';
    return `<a class="social-btn ${d.id} ${has?'':'empty'}" ${has?`href="${link}" target="_blank" rel="noopener"`:''}>
      <span class="ico"><svg viewBox="0 0 24 24"><path d="${socialIcon(d.id)}"/></svg></span>
      <span class="txt"><b>${d.name}</b><span>${esc(label)}</span></span>
    </a>`;
  }).join('');

  [$('#socialRow'), $('#socialRowShop')].filter(Boolean).forEach(b => { b.innerHTML = html; });
}
function renderContact(){
  const S = DB.settings;
  const list = (S.contact||[]).filter(c => (c.value||'').trim());
  const show = S.showContact !== false && list.length > 0;

  /* shop page cards */
  const grid = $('#contactGrid');
  if(grid){
    grid.innerHTML = show ? list.map(c=>`
      <div class="contact-card">
        <div class="ic">${c.icon||'📌'}</div>
        <div><b>${esc(c.label||'')}</b><span>${esc(c.value||'')}</span></div>
      </div>`).join('') : '';
    const box = $('#shopContactBox');
    if(box) box.style.display = show ? '' : 'none';
  }

  /* footer links */
  const intro = $('#contactIntro');
  if(intro) intro.style.display = (S.contactIntro||'').trim() ? '' : 'none';

  const foot = $('#footContact');
  if(foot){
    foot.innerHTML = show ? list.map(c=>{
      const v = String(c.value||'');
      const href = /^https?:\/\//.test(v) ? v
                 : v.includes('@') && !v.includes(' ') ? 'mailto:'+v
                 : /^[+\d\s()-]{7,}$/.test(v) ? 'tel:'+v.replace(/[^+\d]/g,'') : '';
      const inner = `<span style="font-size:12.5px">${c.icon||'📌'} ${esc(c.label||'')}: </span>${esc(v)}`;
      return href ? `<a href="${href}" target="_blank" rel="noopener">${inner}</a>`
                  : `<p>${inner}</p>`;
    }).join('') : '<p style="font-size:12.5px;color:var(--text-3)">ยังไม่ได้ตั้งข้อมูลติดต่อ — ใส่ได้ที่หน้า ⚙ หลังบ้าน</p>';
  }
}

/* --------------------------------------------------------------------------
   Category namespaces (so user-made categories never mix with HSK ones)
-------------------------------------------------------------------------- */
const USER_PREFIX = 'u:';
const isUserCat = c => String(c||'').startsWith(USER_PREFIX);
const catLabel  = c => isUserCat(c) ? String(c).slice(USER_PREFIX.length) : c;
const catKey    = c => isUserCat(c) ? c : (c ? USER_PREFIX + c : '');


/* ==========================================================================
   2. UTILITIES
   ========================================================================== */
const $  = (s, r) => (r||document).querySelector(s);
const $$ = (s, r) => Array.from((r||document).querySelectorAll(s));
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd = n => Math.floor(Math.random()*n);
const shuffle = a => { const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=rnd(i+1);[b[i],b[j]]=[b[j],b[i]];} return b; };
const pick = (a,n) => shuffle(a).slice(0,n);
const todayKey = () => new Date().toISOString().slice(0,10);

/* SHA-256 (ซิงโครนัส) — ใช้เข้ารหัสรหัสผ่านและรหัสปลดล็อกพรีเมียม (client-side) */
function hashSha256(ascii){
  ascii = unescape(encodeURIComponent(String(ascii)));
  function rightRotate(v,a){ return (v>>>a)|(v<<(32-a)); }
  const maxWord = Math.pow(2,32);
  let result='', words=[];
  const asciiBitLength = ascii.length*8;
  let hash = [], k = [];
  const isComposite = {};
  let primeCounter = 0;
  for(let candidate=2; primeCounter<64; candidate++){
    if(!isComposite[candidate]){
      for(let i=0;i<313;i+=candidate) isComposite[i]=candidate;
      hash[primeCounter]=(Math.pow(candidate,.5)*maxWord)|0;
      k[primeCounter++]=(Math.pow(candidate,1/3)*maxWord)|0;
    }
  }
  hash = hash.slice(0,8);
  ascii += '\x80';
  while(ascii.length%64-56) ascii += '\x00';
  for(let i=0;i<ascii.length;i++){
    const j = ascii.charCodeAt(i);
    if(j>>8) return '';
    words[i>>2] |= j << ((3-i)%4)*8;
  }
  words[words.length] = (asciiBitLength/maxWord)|0;
  words[words.length] = asciiBitLength;
  for(let j=0;j<words.length;){
    const w = words.slice(j, j+=16);
    const oldHash = hash.slice(0,8);
    hash = hash.slice(0,8);
    for(let i=0;i<64;i++){
      const w15 = w[i-15], w2 = w[i-2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e,6)^rightRotate(e,11)^rightRotate(e,25))
        + ((e&hash[5])^((~e)&hash[6]))
        + k[i]
        + (w[i] = (i<16) ? w[i] : (w[i-16]
            + (rightRotate(w15,7)^rightRotate(w15,18)^(w15>>>3))
            + w[i-7]
            + (rightRotate(w2,17)^rightRotate(w2,19)^(w2>>>10)))|0);
      const temp2 = (rightRotate(a,2)^rightRotate(a,13)^rightRotate(a,22))
        + ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
      hash = [(temp1+temp2)|0].concat(hash);
      hash[4] = (hash[4]+temp1)|0;
    }
    for(let i=0;i<8;i++) hash[i] = (hash[i]+oldHash[i])|0;
  }
  for(let i=0;i<8;i++){
    for(let j=3;j+1;j--){
      const b = (hash[i]>>(j*8))&255;
      result += ((b<16)?'0':'') + b.toString(16);
    }
  }
  return result;
}
const fmtDate = ts => { const d=new Date(ts); return d.getDate()+'/'+(d.getMonth()+1)+'/'+(d.getFullYear()+543); };

/* Thai speech via Web Speech API (best effort) — เลือกเสียงจีนเมื่อมี */
let voiceOn = store.get('voice', true);
let zhVoice = null;
function pickZhVoice(){
  try{
    const vs = speechSynthesis.getVoices() || [];
    const zh = vs.filter(v => /^zh[-_]/i.test(v.lang));
    if(!zh.length){ zhVoice = null; return; }
    /* จัดอันดับเสียง: เลือกเสียงที่ฟังธรรมชาติที่สุดก่อน */
    const rank = v => {
      const n = (v.name || '').toLowerCase();
      let s = 0;
      if(/xiaoxiao|huihui|yaoyao|yunxi|xiaoyi|ting-?ting|tingting|meijia|sin-?ji/i.test(n)) s += 5;  /* เสียง neural ธรรมชาติ */
      if(/google/i.test(n)) s += 3;
      if(/premium|enhanced|neural|natural|online/i.test(n)) s += 2;
      if(/zh[-_]cn|mandarin|putonghua|普通话/i.test(v.lang + ' ' + n)) s += 2;
      if(/zh[-_]hk|zh[-_]tw|cantonese/i.test(v.lang)) s -= 2;
      if(/compact|deprecated/i.test(n)) s -= 4;
      return s;
    };
    zh.sort(function(a, b){ return rank(b) - rank(a); });
    zhVoice = zh[0] || null;
  }catch(e){ zhVoice = null; }
}
let speakLast = 0;
function speak(text){
  if(!voiceOn || !('speechSynthesis' in window)) return;
  /* watchdog: กัน TTS storm — ไม่พูดซ้ำถี่เกิน 700ms (ป้องกันหน้าแฮงก์บางเบราว์เซอร์) */
  const now = Date.now();
  if(now - speakLast < 700) return;
  speakLast = now;
  try{
    if(document.hidden) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/[。，！？、\n]/g,' '));
    u.lang = 'zh-CN';
    u.rate = .78;            /* ช้าลงเล็กน้อย ฟังชัดขึ้นเป็นธรรมชาติ */
    u.pitch = 1;
    if(zhVoice) u.voice = zhVoice;
    /* กัน error event ของ utterance (เบราว์เซอร์/headless ที่ไม่มีเสียง) ไม่ให้เด้งขึ้นเป็น global error */
    u.onerror = function(){};
    speechSynthesis.speak(u);
  }catch(e){}
}
function toggleVoice(){ voiceOn = !voiceOn; store.set('voice', voiceOn); toast(voiceOn?'เปิดเสียงอ่านแล้ว 🔊':'ปิดเสียงอ่านแล้ว 🔇'); }

/* ==========================================================================
   3. USER ACCOUNTS  (name + birthday + emoji avatar, local only)
   ========================================================================== */
const AVATARS = ['龍','虎','兔','狐','鹤','竹','梅','兰','月','星','山','水','云','雪','鲤','蝶','鹿','凤','茶','墨','莲','松','福','印'];
/* เรนเดอร์อวตาร: ตัวอักษรจีนในวงกลมไล่เฉดทอง-แดง (แทนอีโมจิเดิม) */
function avatarHTML(a, size){
  if(!a) return ICON('user');
  if(AVATARS.indexOf(a) > -1) return '<span class="ava-cn' + (size?('" style="width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*.52)+'px'):'') + '">' + a + '</span>';
  return '<span>' + esc(a) + '</span>';
}

const USERS_KEY = 'users';
let USERS = store.get(USERS_KEY, []) || [];
let session = store.get('session', null);   /* {uid} */

function currentUser(){
  if(!session) return null;
  return USERS.find(u => u.id === session.uid) || null;
}
function saveUsers(){
  if(typeof sbScheduleProfilePush === 'function'){ try{ sbScheduleProfilePush(); }catch(e){} } store.set(USERS_KEY, USERS); }
function saveSession(){ store.set('session', session); }

/* ---- progression design -------------------------------------------------
   Level  : 1-20, driven by XP
   HP     : health points (regenerating energy for games)
   Points : spendable score (สะสมแต้ม)
   Streak : consecutive-day login
-------------------------------------------------------------------------- */
const XP_PER_LEVEL = 220;
const levelOf = xp => Math.min(20, Math.floor((xp||0)/XP_PER_LEVEL) + 1);
const xpInLevel = xp => (xp||0) % XP_PER_LEVEL;
const levelTitle = lv => {
  if(lv >= 18) return 'ระดับเจ้าของภาษา · 精通';
  if(lv >= 15) return 'ระดับสูงมาก · 高级';
  if(lv >= 12) return 'ระดับสูง · 熟练';
  if(lv >= 9)  return 'ระดับกลาง · 中级';
  if(lv >= 6)  return 'ระดับพื้นฐาน · 初级';
  if(lv >= 3)  return 'ระดับเริ่มต้น · 入门';
  return 'มือใหม่ · 新手';
};
/** live game configuration — editable from the admin panel */
function gcfg(){
  const g = (DB.settings && DB.settings.game) || {};
  return {
    perLevel: Math.max(4, Math.min(30, +g.perLevel || 10)),
    passPct:  Math.max(30, Math.min(100, +g.passPct || 70)),
    star3Pct: Math.max(50, Math.min(100, +g.star3Pct || 90)),
    hp:       Math.max(1, Math.min(20, +g.hp || 5)),
    regen:    Math.max(1, Math.min(180, +g.hpRegenMin || 12))
  };
}
function maxHp(){ return gcfg().hp; }
function hpRegenMs(){ return gcfg().regen * 60 * 1000; }
/* kept for compatibility with older helpers */
const MAX_HP = 5;
const HP_REGEN_MS = 12*60*1000;

function regenHp(u){
  if(!u) return;
  const now = Date.now();
  const cap = maxHp();
  if(u.hp === undefined || u.hp > cap) u.hp = cap;
  if(u.hpTs === undefined) u.hpTs = now;
  if(u.hp < cap){
    const gained = Math.floor((now - u.hpTs) / hpRegenMs());
    if(gained > 0){ u.hp = Math.min(cap, u.hp + gained); u.hpTs = now; }
  } else u.hpTs = now;
}

function createUser(name, birthday, avatar, email, pwdHash, profile){
  const u = {
    id: 'u' + Date.now().toString(36) + rnd(999).toString(36),
    name, birthday, avatar,
    email: email || '', pwdHash: pwdHash || '', salt: '',
    profile: profile || null,
    curriculum: null,
    premium: null,
    createdAt: Date.now(),
    xp: 0, points: 0, hp: maxHp(), hpTs: Date.now(),
    streak: 0, lastSeen: null,
    read: [],                 /* article ids read */
    gameStars: {},            /* 'gameId:levelNo' -> 0..3 */
    gameBest: {},             /* 'gameId:levelNo' -> best % */
    seenChars: [],            /* character sample */
    wordsSeen: 0,
    history: []               /* {type,txt,pts,ts} */
  };
  USERS.push(u);
  saveUsers();
  session = {uid: u.id};
  saveSession();
  return u;
}
function logout(){
  if(typeof sbSignOut === 'function'){ try{ sbSignOut(); }catch(e){} }
  session = null; saveSession();
  toast('ออกจากระบบแล้ว');
  renderUserChip();
  go('home');
}
function touchStreak(u){
  const t = todayKey();
  if(u.lastSeen === t) return false;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0,10);
  u.streak = (u.lastSeen === y) ? (u.streak||0)+1 : 1;
  u.lastSeen = t;
  saveUsers();
  return true;
}
function award(u, pts, xp, type, txt){
  if(!u) return;
  u.points = (u.points||0) + pts;
  u.xp = (u.xp||0) + xp;
  u.history.unshift({type, txt, pts, ts: Date.now()});
  if(u.history.length > 60) u.history.length = 60;
  /* บันทึกประวัติระดับความชำนาญ (ดูพัฒนาการในเส้นทางการเรียน) */
  const est = hskEstimate(u);
  u.estHistory = Array.isArray(u.estHistory) ? u.estHistory : [];
  const last = u.estHistory[u.estHistory.length-1];
  if(!last || last.est !== est){
    u.estHistory.push({est, ts: Date.now()});
    if(u.estHistory.length > 24) u.estHistory.shift();
  }
  saveUsers();
}
function starsStr(n, total){
  total = total || 3;
  let s = '';
  for(let i=0;i<total;i++) s += i < n ? '★' : '<span class="off">★</span>';
  return s;
}
function hskEstimate(u){
  if(!u) return 0;
  const stars = Object.values(u.gameStars||{}).reduce((a,b)=>a+b,0);
  const read  = (u.read||[]).length;
  const score = (u.xp||0) + stars*14 + read*22;
  if(score >= 2400) return 6;
  if(score >= 1400) return 5;
  if(score >= 800)  return 4;
  if(score >= 420)  return 3;
  if(score >= 180)  return 2;
  if(score >= 60)   return 1;
  return 0;
}

/* ==========================================================================
   4. TOAST
   ========================================================================== */
let toastTimer;
function toast(msg){
  const t = $('#toast'); if(!t) return;
  t.textContent = msg;
  if(typeof iconize === 'function') iconize(t);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}

/* ==========================================================================
   5. BACKGROUND DECOR
   ========================================================================== */
const ANCIENT_GLYPHS = ['學','為','語','書','雲','山','水','風','月','心','道','德','龍','華','文','問','漢','詩','墨','緣','靜','和'];
function buildAncients(){
  const box = $('#ancients'); if(!box) return;
  const spots = [
    {t:'4%',  l:'8%',  s:'86px', d:'0s',   dur:'19s'},
    {t:'12%', l:'76%', s:'110px',d:'1.4s', dur:'23s'},
    {t:'26%', l:'16%', s:'72px', d:'2.6s', dur:'17s'},
    {t:'38%', l:'88%', s:'94px', d:'0.7s', dur:'21s'},
    {t:'52%', l:'6%',  s:'120px',d:'3.1s', dur:'25s'},
    {t:'61%', l:'68%', s:'80px', d:'1.9s', dur:'18s'},
    {t:'74%', l:'28%', s:'104px',d:'0.4s', dur:'22s'},
    {t:'83%', l:'82%', s:'88px', d:'2.2s', dur:'20s'},
    {t:'90%', l:'48%', s:'76px', d:'3.6s', dur:'16s'},
    {t:'18%', l:'42%', s:'66px', d:'1.1s', dur:'24s'},
    {t:'46%', l:'58%', s:'70px', d:'2.9s', dur:'19s'},
    {t:'68%', l:'14%', s:'62px', d:'0.9s', dur:'23s'}
  ];
  const g = shuffle(ANCIENT_GLYPHS);
  let html = '<span class="big">為</span>';
  spots.forEach((sp,i)=>{
    html += `<span style="top:${sp.t};left:${sp.l};font-size:${sp.s};animation-duration:${sp.dur};animation-delay:${sp.d}">${g[i%g.length]}</span>`;
  });
  box.innerHTML = html;
}

/* ==========================================================================
   6. ROUTER
   ========================================================================== */
/* --------------------------------------------------------------------------
   ระบบเปิด/ปิดฟีเจอร์ + กำหนดพรีเมียม (แอดมินควบคุมจากหลังบ้าน)
   DB.features = {exams:{on:true,premium:false}, articles:{...}, ...}
-------------------------------------------------------------------------- */
const FEATURE_IDS = ['exams','articles','dlg','history','games','typing','scan','pinyin','chars','comp','premium','shop','blog'];
const FEATURE_NAMES = {exams:'ข้อสอบจำลอง HSK', articles:'บทความอ่าน', dlg:'บทสนทนา', history:'ประวัติศาสตร์จีน',
  games:'เกมภาษา', typing:'พิมพ์อักษรจีน (HanZi Typer)', scan:'สแกนอักษรจีน (OCR)', pinyin:'คอร์สพินอิน',
  chars:'อักษรจีน & ฝึกเขียน', comp:'ตัวต่ออักษร', premium:'หน้าร้านพรีเมียม', shop:'ร้านค้า', blog:'บล็อก'};
function featureCfg(id){
  const f = (DB.features || {})[id];
  return {on: !f || f.on !== false, premium: !!(f && f.premium)};
}
function featureEnabled(id){ return featureCfg(id).on; }
function featurePremium(id){ return featureCfg(id).premium; }
function featureGate(id){
  const cfg = featureCfg(id);
  if(!cfg.on) return 'off';
  if(cfg.premium && !isPremium(currentUser())) return 'premium';
  return 'ok';
}
function featureGateHTML(id){
  const st = featureGate(id);
  if(st === 'ok') return null;
  return `
    <div class="empty" style="padding:60px 20px">
      <span class="ic">${st === 'off' ? ICON('lock') : ICON('crown')}</span>
      <h3 style="margin:10px 0 4px">${st === 'off' ? 'ฟีเจอร์นี้ถูกปิดใช้งานชั่วคราว' : 'ฟีเจอร์นี้สำหรับสมาชิกพรีเมียม'}</h3>
      <p style="font-size:13px;color:var(--text-3)">${st === 'off' ? 'ผู้ดูแลเว็บกำลังปรับปรุง — กลับมาใหม่เร็ว ๆ นี้' : 'อัปเกรดสมาชิกเพื่อเข้าใช้ฟีเจอร์นี้'}</p>
      ${st === 'premium' ? `<button class="btn btn-gold btn-sm" style="margin-top:10px" onclick="go('premium')">ดูแพ็กเกจพรีเมียม</button>` : ''}
    </div>`;
}

const PAGES = ['home','learn','pinyin','articles','article','hsk','exams','hsklevel','games','gamelevels','gameplay','chars','writing','write','scan','shop','blog','login','profile','premium','admin','page'];
let route = {page:'home', param:null};

/* 'ราคา=2024' → 'ราคา' : เพื่อให้ id หน้าที่มีอักขระพิเศษใช้ได้ */
function basePage(p){ return String(p||'').split('=')[0]; }

const ROUTE_FEATURE = {articles:'articles', hsk:'exams', games:'games', gameplay:'games', scan:'scan', premium:'premium', shop:'shop', learn:'pinyin', chars:'chars', write:'chars'};
function go(page, param){
  /* หยุดแอนิเมชันลำดับขีดที่ค้างไว้เมื่อเปลี่ยนหน้า (กัน timer ค้าง/กอง) */
  if(typeof stopWriteAnim === 'function'){ try{ stopWriteAnim(); }catch(e){} }
  if(!page) page = 'home';
  page = basePage(page);
  const isCustom = !!findPage(page);
  if(!isCustom && !PAGES.includes(page)) page = 'home';
  route = {page, param: param===undefined?null:param};
  try{ location.hash = page + (param!=null?('='+encodeURIComponent(param)):''); }catch(e){}

  $$('.page').forEach(p => p.classList.remove('active'));
  const el = $('#page-' + (isCustom ? 'page' : page));
  if(el) el.classList.add('active');

  /* เกตฟีเจอร์: ปิด/พรีเมียม → แสดงข้อความแทนเนื้อหา (หลัง activate หน้า) */
  const featId = ROUTE_FEATURE[page];
  if(featId && !adminIn){
    const gateHTML = featureGateHTML(featId);
    if(gateHTML){
      const wrap = $('.page.active .wrap');
      if(wrap) wrap.innerHTML = gateHTML;
      window.scrollTo({top:0, behavior:'auto'});
      return;
    }
  }

  const navKey = {article:'articles', hsklevel:'hsk', gamelevels:'games', gameplay:'games', write:'writing'}[page] || page;
  $$('nav.menu a').forEach(a => a.classList.toggle('active', a.dataset.page === navKey));
  $('#menu').classList.remove('open');

  window.scrollTo({top:0, behavior:'auto'});
  renderRoute();
  observeReveals();
}
function parseHash(){
  const h = (location.hash||'').replace(/^#/,'');
  if(!h) return {page:'home', param:null};
  const eq = h.indexOf('=');
  const p = eq > -1 ? h.slice(0, eq) : h;
  const v = eq > -1 ? h.slice(eq+1) : null;
  const known = PAGES.includes(p) || !!findPage(p);
  return {page: known ? p : 'home', param: v===null?null:decodeURIComponent(v)};
}
/* จริง ๆ แล้ว id ของหน้าไม่ต้องมี '=' เพราะ go(p.id) แยกหน้า/param ให้อยู่แล้ว */
function renderRoute(){
  const {page, param} = route;
  switch(page){
    case 'home':        renderHome(); break;
    case 'learn':       renderLearn(); break;
    case 'articles':    renderArticlesPage(); break;
    case 'article':     renderArticleReader(param); break;
    case 'hsk':         renderHSK(); break;
    case 'hsklevel':    renderHskLevelPage(+param); break;
    case 'games':       renderGamesHub(); break;
    case 'gamelevels':  renderGameLevels(param); break;
    case 'gameplay':    renderGamePlay(param); break;
    case 'chars':       renderCharsPage(); break;
    case 'shop':        renderShop(); break;
    case 'blog':        setArtMode('blog'); go('articles', param); return;  /* redirect → หน้าบทความ (แท็บบล็อก) */
    case 'pinyin':      setLearnMode('pinyin'); go('learn'); return;  /* redirect → หน้าเริ่มเรียน (แท็บพินอิน) */
    case 'writing':     renderWritingHub(); break;              /* redirect → หน้าอักษรจีน (แท็บลำดับขีด) */
    case 'write':       renderWritePage(param || '一'); break;
    case 'exams':       setHskMode('exam'); go('hsk'); return;  /* redirect → หน้า HSK (แท็บข้อสอบ) */
    case 'scan':        renderScanHub(); break;
    case 'premium':     renderPremiumPage(); break;
    case 'login':       renderLogin(); break;
    case 'profile':     renderProfile(); break;
    case 'admin':       renderAdmin(); break;
    default:
      if(findPage(page)){ renderCustomPage(page); }
      else { go('home'); return; }
  }
  renderUserChip();
  renderNavMenu();
}
function isCustomRoute(){ return !!findPage(route.page); }

/* ==========================================================================
   DYNAMIC NAV — custom pages marked "show in menu"
   ========================================================================== */
function navItemTitle(n){
  if(NAV_TITLES[n.id]) return n.title || NAV_TITLES[n.id];
  const pg = findPage(n.id);
  return pg ? (pg.title || 'หน้าใหม่') : (n.title || n.id);
}
function renderNavMenu(){
  const menu = $('#menu'); if(!menu) return;
  /* ปุ่มหลังบ้านเห็นเฉพาะแอดมินที่เข้าสู่ระบบแล้ว */
  const gear = $('#navAdminBtn');
  if(gear) gear.style.display = (typeof adminIn !== 'undefined' && adminIn) ? '' : 'none';
  const items = (DB.nav||[]).filter(function(n){ return n.show !== false; });
  menu.innerHTML = items.map(function(n){
    const custom = !NAV_TITLES[n.id];
    const pg = custom ? findPage(n.id) : null;
    if(custom && !pg) return '';
    const label = custom ? (pg.icon ? pg.icon + ' ' : '') + navItemTitle(n) : navItemTitle(n);
    return '<a' + (custom ? ' class="dyn-page"' : '') + ' data-page="' + esc(n.id) + '" onclick="go(\'' + esc(n.id) + '\')">' + esc(label) + '</a>';
  }).join('');
  $$('#menu a').forEach(a => {
    const act = route.page;
    a.classList.toggle('active', a.dataset.page === act);
  });
}

/* ==========================================================================
   7. REVEAL ON SCROLL
   ========================================================================== */
let io = null;
let __revealFallback = null, __rvScroll = false;
function revealInView(){
  $$('.reveal:not(.in)').forEach(function(el){
    const r = el.getBoundingClientRect();
    if(r.top < (window.innerHeight || 800) - 20 && r.bottom > 0) el.classList.add('in');
  });
}
function observeReveals(){
  if(!io){
    io = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {threshold:.1, rootMargin:'0px 0px -40px 0px'});
  }
  $$('.reveal:not(.in)').forEach(el => io.observe(el));
  /* กันพลาด (เบราว์เซอร์ที่ IO ไม่ทำงาน): บังคับเปิดของที่อยู่ในจอเสมอ */
  clearTimeout(__revealFallback);
  __revealFallback = setTimeout(function(){
    revealInView();
    if(!__rvScroll){
      __rvScroll = true;
      window.addEventListener('scroll', function(){
        clearTimeout(__revealFallback);
        __revealFallback = setTimeout(revealInView, 150);
      }, {passive:true});
    }
  }, 1000);
}

/* ==========================================================================
   8. COUNTERS
   ========================================================================== */
function runCounter(el){
  if(el.dataset.done) return;
  const target = +el.dataset.count || 0;
  el.dataset.done = '1';
  if(target === 0){ el.textContent = '0'; return; }
  let cur = 0;
  const step = Math.max(1, Math.ceil(target/58));
  const t = setInterval(()=>{
    cur += step;
    if(cur >= target){ cur = target; clearInterval(t); }
    el.textContent = cur.toLocaleString();
  }, 22);
}
function initCounters(root){
  $$('[data-count]', root||document).forEach(runCounter);
}

/* ==========================================================================
   9. USER CHIP (nav)
   ========================================================================== */
function wqChipHTML(u){
  const n = Math.max(0, +u.weiqian || 0);
  return n > 0 ? '<span class="wq-chip" title="เหรียญ為錢">' + (typeof coinHTML === 'function' ? coinHTML('sm') : '為') + ' ' + n.toLocaleString() + '</span>' : '';
}
function renderUserChip(){
  const box = $('#userChip'); if(!box) return;
  const u = currentUser();
  if(!u){
    box.className = 'user-chip';
    box.title = 'เข้าสู่ระบบ';
    box.innerHTML = `<span class="ava">${ICON('user')}</span><span class="nm">เข้าสู่ระบบ</span>`;
    box.onclick = ()=>go('login');
    return;
  }
  regenHp(u);
  box.className = 'user-chip';
  box.title = esc(u.name) + ' · Lv ' + levelOf(u.xp);
  box.innerHTML = `<span class="ava">${avatarHTML(u.avatar)}</span><span class="nm">${esc(u.name)}</span>` +
    wqChipHTML(u) +
    (isPremium(u) ? '<span class="premium-chip" title="'+esc(premiumUntilTxt(u))+'">'+ICON('crown')+'</span>' : '') +
    `<span class="lv">Lv ${levelOf(u.xp)}</span>`;
  box.onclick = ()=>go('profile');
}

/* ==========================================================================
   10. INIT
   ========================================================================== */
/* --------------------------------------------------------------------------
   เรียกซ้ำได้เสมอ: เตรียมโครงสร้างข้อมูลให้ครบก่อนใช้งาน
-------------------------------------------------------------------------- */
function ensureData(){
  /* -------- อัปเดตเนื้อหาจากไฟล์ custom.js (เวอร์ชันใหม่กว่าที่เคยเห็น) -------- */
  if(CUSTOM && CUSTOM.ver && store.get('datav') !== String(CUSTOM.ver)){
    ['hsk','articles','cats','games','products','theme','daily','pages','gameCats','blog','nav','settings'].forEach(function(k){
      if(CUSTOM[k] === undefined) return;
      try{
        if(k === 'theme') DB.theme = Object.assign({}, DEFAULT_THEME, CUSTOM.theme);
        else if(k === 'daily') DB.daily = Object.assign({}, DEFAULT_DAILY, CUSTOM.daily);
        else if(k === 'settings') DB.settings = Object.assign({}, DEFAULT_SETTINGS, CUSTOM.settings);
        else DB[k] = JSON.parse(JSON.stringify(CUSTOM[k]));
      }catch(e){}
    });
    if(CUSTOM.auth) DB.auth = CUSTOM.auth;
    if(DB.hsk && typeof DB.hsk === 'object') DB.hsk.__seeded = true;
    ['hsk','articles','cats','games','products','theme','daily','pages','gameCats','blog','nav','settings','auth'].forEach(function(k){ store.set(k, DB[k]); });
    store.set('datav', String(CUSTOM.ver));
    store.set('hsk3v', '2');
    renderNavMenu();
  }
  /* เมื่อมี custom.hsk — เนื้อหา HSK ทั้งหมดมาจากไฟล์ที่แอดมินส่งออก ไม่ merge ของเดิมซ้ำ */
  if(CUSTOM && CUSTOM.hsk) store.set('hsk3v', '2');

  /* -------- HSK vocabulary -------- */
  if(!DB.hsk || typeof DB.hsk !== 'object'){ DB.hsk = {}; }
  for(let i=1;i<=6;i++) if(!Array.isArray(DB.hsk[i])) DB.hsk[i] = [];
  const seedHsk = !DB.hsk.__seeded;
  if(seedHsk){
    Object.keys(HSK || {}).forEach(k => {
      const lv = String(k);
      if(!Array.isArray(DB.hsk[lv])) DB.hsk[lv] = [];
      (HSK[k]||[]).forEach(w => {
        if(!w || !w.cn) return;
        if(DB.hsk[lv].some(x => x.cn === w.cn)) return;
        DB.hsk[lv].push(w);
      });
    });
    DB.hsk.__seeded = true;
  }

  /* -------- thematic categories (namespaced) -------- */
  if(!DB.cats || typeof DB.cats !== 'object'){
    DB.cats = {};
    Object.keys(CATS || {}).forEach(k => { DB.cats[catKey(k)] = (CATS[k]||[]).slice(); });
  }

  /* -------- game question banks -------- */
  if(!DB.games || typeof DB.games !== 'object'){ DB.games = {}; }
  (typeof GAME_DEFS !== 'undefined' ? GAME_DEFS : []).forEach(d => {
    if(!Array.isArray(DB.games[d.id])){
      const src = (GAMES && GAMES[d.id]) || (D.games && D.games[d.id]) || [];
      DB.games[d.id] = src.slice();
    }
  });

  /* -------- HSK 3.0 (标准 6.1–6.6) — merge once, then persist -------- */
  const H3 = (typeof WC_DATA !== 'undefined' && WC_DATA.hsk3) || (typeof D !== 'undefined' && D.hsk3) || null;
  if(H3 && store.get('hsk3v') !== '2'){
    /* ล้างคำอ่านไทย (tt) จากคำ v3 ที่ merge ไว้แล้ว — รอบนี้ไม่เก็บ tt แล้ว */
    for(let i=1;i<=6;i++){
      (DB.hsk[i]||[]).forEach(w => { if(w && w.v3 && w.tt !== undefined) delete w.tt; });
    }
    for(let i=1;i<=6;i++){
      const base = DB.hsk[i] || (DB.hsk[i] = []);
      const has = {};
      base.forEach(w => { if(w && w.cn) has[w.cn] = 1; });
      (H3[i]||[]).forEach(w => {
        if(!w || !w.cn || has[w.cn]) return;
        base.push({cn:w.cn, py:w.py, th:w.th||'', pos:w.pos||'', vn:w.vn||'', cat:w.cat||'', v3:true});
        has[w.cn] = 1;
      });
    }
    /* ผสมคำเก่า-ใหม่แล้วเรียงตามพินอิน ให้ดูเป็นเนื้อเดียวกัน */
    for(let i=1;i<=6;i++){
      DB.hsk[i].sort(function(a,b){
        return String(a.py||'').localeCompare(String(b.py||''), 'zh');
      });
    }
    store.set('hsk', DB.hsk);
    store.set('hsk3v', '2');
  }

  /* -------- เติมหมวดหมู่ (cat) ให้คำ HSK ที่ยังไม่มี — รอบเดียว -------- */
  if(store.get('hskcatv') !== '1'){
    const cmap = {};
    const putMap = function(list){ (list||[]).forEach(function(w){
      if(w && w.cn && w.cat){
        const key = w.cn + '|' + String(w.py||'').replace(/\s+/g,' ').toLowerCase();
        cmap[key] = w.cat;
        if(!cmap[w.cn]) cmap[w.cn] = w.cat;
      }
    }); };
    Object.keys(HSK||{}).forEach(function(k){ putMap(HSK[k]); });
    const H3m = (typeof WC_DATA !== 'undefined' && WC_DATA.hsk3) || {};
    Object.keys(H3m||{}).forEach(function(k){ putMap(H3m[k]); });
    let changed = false;
    for(let i=1;i<=6;i++){
      (DB.hsk[i]||[]).forEach(function(w){
        if(!w || !w.cn || w.cat) return;
        const key = w.cn + '|' + String(w.py||'').replace(/\s+/g,' ').toLowerCase();
        const cat = cmap[key] || cmap[w.cn];
        if(cat){ w.cat = cat; changed = true; }
      });
    }
    if(changed) store.set('hsk', DB.hsk);
    store.set('hskcatv', '1');
  }

  /* -------- nav: ลำดับเมนูทั้งหมด (built-in + หน้าเอง) -------- */
  if(!Array.isArray(DB.nav)) DB.nav = JSON.parse(JSON.stringify(DEFAULT_NAV));
  (function(){
    const ids = DB.nav.map(function(n){ return n.id; });
    /* กัน built-in ที่หายไป (เผื่อเพิ่มหน้ามาใหม่ในอนาคต) */
    DEFAULT_NAV.forEach(function(d){
      if(ids.indexOf(d.id) === -1) DB.nav.push({id:d.id, title:d.title, show:true});
    });
    /* หน้าเองที่เปิดเมนูต้องเข้า nav; ที่ปิดเมนูต้องออกจาก nav */
    allPages().forEach(function(pg){
      const inNav = DB.nav.some(function(n){ return n.id === pg.id; });
      if(pg.inNav && pg.show !== false && !inNav) DB.nav.push({id:pg.id, title:pg.title, show:true, custom:true});
      if((!pg.inNav || pg.show === false) && inNav) DB.nav = DB.nav.filter(function(n){ return n.id !== pg.id; });
    });
    /* กัน id ที่ไม่อยู่แล้ว (และหน้าเก่าที่ถูกยุบรวม เช่น writing/exams) */
    DB.nav = DB.nav.filter(function(n){
      if(!NAV_TITLES[n.id]) return !!findPage(n.id);
      return DEFAULT_NAV.some(function(d){ return d.id === n.id; });
    });
  })();

  /* -------- custom game categories (unlimited levels) -------- */
  if(!Array.isArray(DB.gameCats)) DB.gameCats = [];

  /* -------- blog posts (WordPress-like) -------- */
  if(!Array.isArray(DB.blog)) DB.blog = [];

  /* -------- custom pages -------- */
  if(!Array.isArray(DB.pages)) DB.pages = JSON.parse(JSON.stringify(DEFAULT_PAGES));
  if(!DB.theme || typeof DB.theme !== 'object') DB.theme = JSON.parse(JSON.stringify(DEFAULT_THEME));
  DB.theme.colors = Object.assign({}, DEFAULT_THEME.colors, DB.theme.colors || {});
  if(!DB.daily || typeof DB.daily !== 'object') DB.daily = Object.assign({}, DEFAULT_DAILY);
  DB.daily = Object.assign({}, DEFAULT_DAILY, DB.daily);
  if(!Array.isArray(DB.daily.levels) || !DB.daily.levels.length) DB.daily.levels = DEFAULT_DAILY.levels.slice();

  /* -------- legacy admin-added fill questions -------- */
  if(DB.fill && DB.fill.length){
    if(!Array.isArray(DB.games.fill)) DB.games.fill = [];
    DB.games.fill = DB.games.fill.concat(DB.fill.map(q => ({q:q.q, a:q.a, w:q.w||[], th:q.th||'', lv:1})));
    DB.fill = null; store.del('fill');
  }
  return DB;
}

/* ป๊อปอัปต้อนรับ — แสดงครั้งแรกที่เปิดหน้าแรก (จำว่าเคยเห็นแล้ว) */
function showWelcomePopup(){
  try{
    if(store.get('wszw_welcomed')) return;
    if(route.page !== 'home') return;
    store.set('wszw_welcomed', '1');
    setTimeout(function(){
      if(typeof glassPop !== 'function') return;
      glassPop({
        icon:'sparkles',
        title:'ยินดีต้อนรับสู่ 为什么中文',
        body:`<p style="font-size:13.5px;color:var(--text-2);line-height:1.9;margin:0;text-align:left">
          เรียนภาษาจีนครบทุกอย่างในที่เดียว:<br>
          · ข้อสอบจำลอง HSK 1–6 เสมือนจริง<br>
          · บทความ บทสนทนา และประวัติศาสตร์จีน 100+ เรื่อง<br>
          · เกมพิมพ์อักษรจีน 200 ด่าน + ธีม 8-bit<br>
          · สแกนอักษรจีนด้วย AI<br><br>
          <b style="color:var(--red)">เริ่มเรียนได้เลยวันนี้ — ฟรี!</b></p>`,
        actions:[
          {label:'เริ่มเรียนเลย', cls:'btn-primary', fn:function(){ closeGlassPop(); go('learn'); }},
          {label:'ดูทีหลัง', cls:'btn-ghost', fn:function(){ closeGlassPop(); }}
        ]
      });
    }, 900);
  }catch(e){}
}

function init(){
  buildAncients();
  ensureData();
  /* เปิดเลเยอร์ Supabase (ถ้าตั้งค่าไว้) — โหลด config คลาวด์ + สมัคร realtime */
  if(typeof sbConfigured === 'function' && sbConfigured() && typeof sbInit === 'function'){
    sbInit().then(function(){
      if(typeof renderRoute === 'function'){
        try{ renderRoute(); }catch(e){}
        try{ observeReveals(); }catch(e){}
      }
    });
  }
  if('speechSynthesis' in window){
    pickZhVoice();
    try{ speechSynthesis.onvoiceschanged = pickZhVoice; }catch(e){}
  }
  /* -------- apply editable branding / contact / social -------- */
  applySettings();

  window.addEventListener('hashchange', ()=>{ route = parseHash();
    $$('.page').forEach(p=>p.classList.remove('active'));
    const el = $('#page-' + (findPage(route.page) ? 'page' : route.page));
    if(el) el.classList.add('active');
    renderRoute(); observeReveals();
  });

  window.addEventListener('scroll', ()=>{
    const nav = $('#topnav');
    if(nav) nav.classList.toggle('scrolled', window.scrollY > 12);
  }, {passive:true});

  const u = currentUser();
  if(u) touchStreak(u);

  route = parseHash();
  $$('.page').forEach(p=>p.classList.remove('active'));
  const el = $('#page-' + (findPage(route.page) ? 'page' : route.page));
  if(el) el.classList.add('active');
  renderRoute();
  observeReveals();
  showWelcomePopup();
}

document.addEventListener('DOMContentLoaded', init);
