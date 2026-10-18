/* ==========================================================================
   为什么中文 · ICON SYSTEM
   ชุดไอคอน SVG วาดเองสไตล์เส้น (stroke) — ใช้แทนอีโมจิทั้งเว็บ
   ICON('ชื่อ') คืนค่า <svg> inline · iconize() แปลงอีโมจิที่หลงเหลืออัตโนมัติ
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   ไอคอนแต่ละตัว: อาร์เรย์ของ path/shape ใน viewBox 24×24
   รูปแบบ: [tag, attrs] เช่น ['path','M4 6h16'] หรือ ['circle','cx="12" cy="12" r="10"']
-------------------------------------------------------------------------- */
const ICON_PATHS = {
  /* ===== UI พื้นฐาน ===== */
  search:      [['circle','cx="11" cy="11" r="7"'],['path','m21 21-4.6-4.6']],
  x:           [['path','M18 6 6 18M6 6l12 12']],
  check:       [['path','M20 6 9 17l-5-5']],
  'chevron-right': [['path','m9 18 6-6-6-6']],
  'chevron-left':  [['path','m15 18-6-6 6-6']],
  'chevron-down':  [['path','m6 9 6 6 6-6']],
  'chevron-up':    [['path','m18 15-6-6-6 6']],
  'arrow-right':   [['path','M5 12h14M12 5l7 7-7 7']],
  'arrow-left':    [['path','M19 12H5M12 19l-7-7 7-7']],
  'arrow-up':      [['path','M12 19V5M5 12l7-7 7 7']],
  'arrow-down':    [['path','M12 5v14M19 12l-7 7-7-7']],
  'arrow-up-right':[['path','M7 17 17 7M7 7h10v10']],
  'arrow-left-right': [['path','M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4']],
  'refresh-cw':    [['path','M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5']],
  'rotate-ccw':    [['path','M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5']],
  undo:       [['path','M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13']],
  menu:       [['path','M4 6h16M4 12h16M4 18h16']],
  'more-h':   [['circle','cx="5" cy="12" r="1"'],['circle','cx="12" cy="12" r="1"'],['circle','cx="19" cy="12" r="1"']],
  plus:       [['path','M5 12h14M12 5v14']],
  minus:      [['path','M5 12h14']],
  trash:      [['path','M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6']],
  pencil:     [['path','M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z']],
  copy:       [['rect','x="9" y="9" width="13" height="13" rx="2"'],['path','M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1']],
  eye:        [['path','M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z'],['circle','cx="12" cy="12" r="3"']],
  'eye-off':  [['path','M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20']],
  upload:     [['path','M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12']],
  download:   [['path','M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3']],
  link:       [['path','M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71']],
  pin:        [['path','M12 17v5M5 3h14l-1 7-5 2v4l-2 2v-6l-5-2Z']],
  'map-pin':  [['path','M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'],['circle','cx="12" cy="10" r="3"']],
  calendar:   [['rect','x="3" y="4" width="18" height="18" rx="2"'],['path','M16 2v4M8 2v4M3 10h18']],
  'bar-chart':[['path','M3 3v18h18M18 17V9M13 17V5M8 17v-3']],
  'trending-up': [['path','m22 7-8.5 8.5-5-5L2 17M16 7h6v6']],
  package:    [['path','M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12']],
  tag:        [['path','M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z'],['circle','cx="7.5" cy="7.5" r=".5"']],
  layers:     [['path','m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83ZM22 17.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65']],
  palette:    [['path','M12 22a10 10 0 0 1 0-20c5.5 0 10 4.5 10 10 0 5-4 5.5-7 6h-1c-1 0-2 .5-2 1.5 0 .5.2 1 .8 1.4.5.4.7 1 .2 2.1Z'],['circle','cx="7.5" cy="11.5" r="1.5"'],['circle','cx="12" cy="7.5" r="1.5"'],['circle','cx="16.5" cy="11.5" r="1.5"']],
  brush:      [['path','m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z']],
  music:      [['path','M9 18V5l12-2v13'],['circle','cx="6" cy="18" r="3"'],['circle','cx="18" cy="16" r="3"']],
  type:       [['path','M4 7V4h16v3M9 20h6M12 4v16']],
  clock:      [['circle','cx="12" cy="12" r="10"'],['path','M12 6v6l4 2']],
  phone:      [['path','M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z']],
  mail:       [['rect','x="2" y="4" width="20" height="16" rx="2"'],['path','m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7']],
  shield:     [['path','M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z']],
  'shield-check': [['path','M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],['path','m9 12 2 2 4-4']],
  wallet:     [['path','M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4Z']],
  'credit-card': [['rect','x="2" y="5" width="20" height="14" rx="2"'],['path','M2 10h20']],
  receipt:    [['path','M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1ZM16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11']],
  'qr-code':  [['rect','x="3" y="3" width="5" height="5" rx="1"'],['rect','x="16" y="3" width="5" height="5" rx="1"'],['rect','x="3" y="16" width="5" height="5" rx="1"'],['path','M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1']],
  play:       [['path','M5 3l14 9-14 9V3z']],
  medal:      [['circle','cx="12" cy="8" r="6"'],['path','M15.477 12.89 17 22l-5-3-5 3 1.523-9.11']],
  sprout:     [['path','M7 20h10M10 20c5.5-2.5.8-6.4 3-10M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8zM14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-3.2.1-4.8 1-5.1 2z']],
  'book-open':[['path','M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z']],
  book:       [['path','M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20']],
  library:    [['path','M16 6l4 14M12 6v14M8 8v12M4 4v16']],
  'graduation-cap': [['path','M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5']],
  user:       [['path','M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'],['circle','cx="12" cy="7" r="4"']],
  users:      [['path','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'],['circle','cx="9" cy="7" r="4"'],['path','M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75']],
  crown:      [['path','M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zM5 20h14']],
  star:       [['path','m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z']],
  trophy:     [['path','M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z']],
  flame:      [['path','M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z']],
  gem:        [['path','M6 3h12l4 6-10 13L2 9ZM11 3 8 9l4 13 4-13-3-6M2 9h20']],
  zap:        [['path','M13 2 3 14h9l-1 8 10-12h-9l1-8z']],
  heart:      [['path','M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z']],
  'heart-pulse': [['path','M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7ZM3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27']],
  lock:       [['rect','x="3" y="11" width="18" height="11" rx="2"'],['path','M7 11V7a5 5 0 0 1 10 0v4']],
  unlock:     [['rect','x="3" y="11" width="18" height="11" rx="2"'],['path','M7 11V7a5 5 0 0 1 9.9-1']],
  settings:   [['path','M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'],['circle','cx="12" cy="12" r="3"']],
  home:       [['path','m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],['path','M9 22V12h6v10']],
  target:     [['circle','cx="12" cy="12" r="10"'],['circle','cx="12" cy="12" r="6"'],['circle','cx="12" cy="12" r="2"']],
  gamepad:    [['path','M6 12h4M8 10v4M15 13h.01M18 11h.01'],['rect','x="2" y="6" width="20" height="12" rx="2"']],
  puzzle:     [['path','M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z']],
  kanji:      [['path','M10.5 3.5h3M7.5 7h9M12 10 9 20M12 10l3.5 10']],
  'pen-line': [['path','M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z']],
  shuffle:    [['path','M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22M18 2l4 4-4 4M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8M18 14l4 4-4 4']],
  lightbulb:  [['path','M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4']],
  'volume-2': [['path','M11 5 6 9H2v6h4l5 4V5z'],['path','M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14']],
  'volume-1': [['path','M11 5 6 9H2v6h4l5 4V5z'],['path','M15.54 8.46a5 5 0 0 1 0 7.07']],
  'volume-x': [['path','M11 5 6 9H2v6h4l5 4V5z'],['path','m22 9-6 6M16 9l6 6']],
  info:       [['circle','cx="12" cy="12" r="10"'],['path','M12 16v-4M12 8h.01']],
  'alert-triangle': [['path','m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01']],
  'help-circle': [['circle','cx="12" cy="12" r="10"'],['path','M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01']],
  'log-out':  [['path','M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9']],
  power:      [['path','M12 2v10M18.4 6.6a9 9 0 1 1-12.77.04']],
  image:      [['rect','x="3" y="3" width="18" height="18" rx="2"'],['circle','cx="9" cy="9" r="2"'],['path','m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21']],
  'file-text':[['path','M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8']],
  'align-left':[['path','M21 6H3M15 12H3M17 18H3']],
  heading:    [['path','M6 4v16M18 4v16M6 12h12']],
  quote:      [['path','M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z']],
  'rect-h':   [['rect','x="2" y="8" width="20" height="8" rx="2"']],
  columns:    [['rect','x="3" y="3" width="18" height="18" rx="2"'],['path','M12 3v18']],
  'layout-grid': [['rect','x="3" y="3" width="7" height="7" rx="1"'],['rect','x="14" y="3" width="7" height="7" rx="1"'],['rect','x="14" y="14" width="7" height="7" rx="1"'],['rect','x="3" y="14" width="7" height="7" rx="1"']],
  'move-vertical': [['path','M12 2v20M8 18l4 4 4-4M8 6l4-4 4 4']],
  code:       [['path','m16 18 6-6-6-6M8 6l-6 6 6 6']],
  'grip-v':   [['circle','cx="9" cy="6" r="1"'],['circle','cx="9" cy="12" r="1"'],['circle','cx="9" cy="18" r="1"'],['circle','cx="15" cy="6" r="1"'],['circle','cx="15" cy="12" r="1"'],['circle','cx="15" cy="18" r="1"']],
  save:       [['path','M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8']],
  database:   [['ellipse','cx="12" cy="5" rx="9" ry="3"'],['path','M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0']],
  filter:     [['path','M22 3H2l8 9.46V19l4 2v-8.54L22 3z']],
  gift:       [['rect','x="3" y="8" width="18" height="4" rx="1"'],['path','M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5']],
  sparkles:   [['path','M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0zM20 3v4M22 5h-4M4 17v2M5 18H3']],
  'circle-check': [['circle','cx="12" cy="12" r="10"'],['path','m9 12 2 2 4-4']],
  'circle-x':  [['circle','cx="12" cy="12" r="10"'],['path','m15 9-6 6M9 9l6 6']],
  ban:        [['circle','cx="12" cy="12" r="10"'],['path','m4.9 4.9 14.2 14.2']],
  cone:       [['path','m20.9 18.55-8.34-14.45a1 1 0 0 0-1.7 0L2.5 18.55M12 9v4M12 17h.01']],
  message:    [['path','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']],
  folder:     [['path','M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z']],
  compass:    [['circle','cx="12" cy="12" r="10"'],['path','m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z']],
  globe:      [['circle','cx="12" cy="12" r="10"'],['path','M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20']],
  clipboard:  [['rect','x="8" y="2" width="8" height="4" rx="1"'],['path','M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2']],
  'shopping-bag': [['path','M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0']],
  'shopping-cart': [['circle','cx="8" cy="21" r="1"'],['circle','cx="19" cy="21" r="1"'],['path','M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12']],
  train:      [['path','M8 3.1V7a4 4 0 0 0 8 0V3.1M9 15l-1-1M15 15l1-1M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5ZM8 19l-2 3M16 19l2 3']],
  leaf:       [['path','M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12']],
  briefcase:  [['rect','x="2" y="7" width="20" height="14" rx="2"'],['path','M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16']],
  smartphone: [['rect','x="5" y="2" width="14" height="20" rx="2"'],['path','M12 18h.01']],
  monitor:    [['rect','x="2" y="3" width="20" height="14" rx="2"'],['path','M8 21h8M12 17v4']],
  sun:        [['circle','cx="12" cy="12" r="4"'],['path','M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41']],
  smile:      [['circle','cx="12" cy="12" r="10"'],['path','M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01']],
  coins:      [['circle','cx="8" cy="8" r="6"'],['path','M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82']],
  banknote:   [['rect','x="2" y="6" width="20" height="12" rx="2"'],['circle','cx="12" cy="12" r="2"'],['path','M6 12h.01M18 12h.01']],
  ruler:      [['path','M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0ZM14.5 12.5l2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2']],
  plane:      [['path','M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z']],
  bus:        [['path','M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3'],['circle','cx="7" cy="18" r="2"'],['path','M9 18h5'],['circle','cx="16" cy="18" r="2"']],
  headphones: [['path','M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3']],
  shirt:      [['path','M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z']],
  bookmark:   [['path','m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z']],
  bell:       [['path','M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0']],
  'thumb-up': [['path','M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z']],
  flag:       [['path','M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7']],
  hash:       [['path','M4 9h16M4 15h16M10 3 8 21M16 3l-2 18']],
  scan:       [['path','M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10']],
  camera:     [['path','M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'],['circle','cx="12" cy="13" r="3"']],
  terminal:   [['rect','x="2" y="3" width="20" height="18" rx="2"'],['path','M6 7l3 3-3 3M11 13h7']],
  pause:      [['path','M7 5v14M17 5v14']],
  keyboard:   [['rect','x="2" y="4" width="20" height="16" rx="2"'],
['path','M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12']],
  landmark:   [['path','M4 21V9l8-5 8 5v12'],['path','M9 21v-6h6v6'],['path','M4 21h16']],
  /* ===== ไอคอนเฉพาะธีมจีน ===== */
  lantern:    [['path','M9 3.5h6M12 3.5V5'],['ellipse','cx="12" cy="11.5" rx="5" ry="6.5"'],['path','M12 18v2M10.5 20h3M12 8.2v6.6M8.6 9.4c1.9 2.3 4.9 2.3 6.8 0']],
  dragon:     [['path','M4 6c5-3.5 8-1 9 2s-2 4-4 6-3 3-1 5c1.2 1.2 3 .5 4-1M13 8c2.5-.5 4.5.5 5.5 2.5 1 2.5 0 5-2.5 6.5M10 12c.5 1.5 1 2.5 2 3']],
  seal:       [['rect','x="3" y="3" width="18" height="18" rx="4"'],['path','M8 12c2-3 6-3 8 0 2 3-2 6-4 6s-6-3-4-6z']],
  'redpacket':[['rect','x="3" y="5" width="18" height="14" rx="2"'],['path','M8 5v14M12 5v14M16 5v14']],
  'chopsticks': [['path','m6 2 13 13M18 2 5 15M9 19l-1 3M13 19l-1 3']],
  yinyang:    [['circle','cx="12" cy="12" r="10"'],['path','M12 2a10 10 0 0 1 0 20zM12 12a5 5 0 0 0 0-10M12 12a5 5 0 0 1 0 10'],['circle','cx="12" cy="7" r="1.4"'],['circle','cx="12" cy="17" r="1.4"']],
  scroll:     [['path','M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4M19 17V5a2 2 0 0 0-2-2H4']],
  'ball-sport':[['circle','cx="12" cy="12" r="10"'],['path','M12 7c2 1.5 2 3.8 0 5s-2 3.5 0 5M7 12c1.5-2 3.8-2 5 0s3.5 2 5 0']]
};

const EMOJI_MAP = {
  /* UI */
  '💾':'save','✏️':'pencil','✏':'pencil','🗑️':'trash','🗑':'trash','📌':'pin','🎮':'gamepad','🔍':'search','🔎':'search',
  '📖':'book-open','⬇️':'arrow-down','⬇':'arrow-down','🀄':'kanji','📄':'file-text','📦':'package','✍️':'pen-line','✍':'pen-line',
  '👁️':'eye','👁':'eye','📚':'library','←':'arrow-left','→':'arrow-right','🏮':'lantern','⚙️':'settings','⚙':'settings','🔊':'volume-2','🔈':'volume-1',
  '🔇':'volume-x','🎯':'target','📥':'download','↗️':'arrow-up-right','🔤':'keyboard','⭐':'star','🛍️':'shopping-bag','🛍':'shopping-bag',
  '🖼️':'image','🖼':'image','↑':'arrow-up','↓':'arrow-down','🎵':'music','🚧':'cone','📊':'bar-chart','📞':'phone','👤':'user',
  '🔒':'lock','🔓':'unlock','🔐':'shield','🎉':'sparkles','💬':'message','🗂️':'folder','🗂':'folder','🗃️':'folder','🗃':'folder',
  '🎨':'palette','📅':'calendar','🧭':'compass','🔗':'link','🚫':'ban','🧠':'layers','🧩':'puzzle','❤️':'heart','💡':'lightbulb',
  '🔥':'flame','💎':'gem','🏅':'medal','✅':'circle-check','📈':'trending-up','✕':'x','🏠':'home','🌿':'leaf','💗':'heart',
  '💼':'briefcase','📱':'smartphone','🪙':'coins','🧧':'redpacket','↕️':'move-vertical','↕':'move-vertical','🃏':'layers','📜':'scroll',
  '📧':'mail','⚠️':'alert-triangle','⚠':'alert-triangle','🧱':'columns','📍':'map-pin','↩️':'undo','↩':'undo','↻':'refresh-cw',
  '🌱':'sprout','🌟':'star','🏆':'trophy','🥉':'medal','🥈':'medal','🥇':'trophy','✨':'sparkles','⚡':'zap','🈶':'circle-check',
  '🌏':'globe','🌐':'globe','🔖':'bookmark','🥢':'chopsticks','✈️':'plane','✈':'plane','🚌':'bus','🎓':'graduation-cap','☀️':'sun','☀':'sun',
  '😊':'smile','🛒':'shopping-cart','💰':'coins','💻':'monitor','⚽':'ball-sport','🏥':'heart-pulse','📂':'folder','🎧':'headphones',
  '🖌️':'brush','🖌':'brush','🎁':'gift','👕':'shirt','🧸':'smile','⬆️':'arrow-up','⬆':'arrow-up','☠️':'ban','📐':'ruler','🔄':'refresh-cw',
  '↔️':'arrow-left-right','↔':'arrow-left-right','🧗':'trending-up','❓':'help-circle','📋':'clipboard','🅰️':'heading','📝':'align-left',
  '❝':'quote','🔘':'rect-h','➖':'minus','🚄':'train','🍜':'chopsticks','🎋':'sprout','💻':'monitor','🛒':'shopping-cart','☰':'menu',
  '⚙':'settings','☰':'menu','🕮':'book','🌾':'leaf','🏯':'home','🎌':'flag','🧨':'sparkles','🪭':'seal','🪷':'sprout','🐉':'dragon',
  /* สัตว์/อวตารเดิม → ผู้ใช้ */
  '🐼':'user','🐯':'user','🐰':'user','🦊':'user','🐨':'user','🐸':'user','🐵':'user','🦁':'user','🐧':'user','🐢':'user','🐳':'user',
  '🦋':'user','🌸':'sprout','🍀':'leaf','🌙':'yinyang','🧋':'chopsticks','🎐':'lantern','🪴':'sprout','⭐':'star'
};

/* --------------------------------------------------------------------------
   ICON(name, cls) → สตริง SVG
   ใช้สัญลักษณ์จากไฟล์ sprite assets/icons.svg (ฉีดเข้า document แล้ว) —
   ถ้ายังโหลดไม่ได้ (เช่นเปิดจาก file:// ออฟไลน์) ใช้ path ฝังในตัวแทน หน้าตาเหมือนกัน
-------------------------------------------------------------------------- */
function shapeMarkup(p){
  let tag = p[0], attrs = p[1];
  if(tag === 'path' && !/^[a-zA-Z-]+=/.test(attrs)) attrs = 'd="' + attrs + '"';
  return '<' + tag + ' ' + attrs + '/>';
}
let ICON_SPRITE_READY = false;
let ICON_SPRITE_FAILED = false;
function ICON(name, cls){
  const known = ICON_PATHS[name] ? name : 'search';
  const body = ICON_SPRITE_READY
    ? '<use href="#wc-' + known + '"/>'
    : (ICON_PATHS[known] || []).map(shapeMarkup).join('');
  return '<svg class="icn ' + (cls||'') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
}
/* โหลดไฟล์ sprite assets/icons.svg เข้ามาใช้เป็นแหล่งไอคอนจริง */
function loadIconSprite(){
  if(ICON_SPRITE_READY || ICON_SPRITE_FAILED) return;
  try{
    if(typeof fetch !== 'function'){ ICON_SPRITE_FAILED = true; return; }
    fetch('assets/icons.svg?v=20260101d', {cache:'no-cache'})
      .then(function(r){ if(!r.ok) throw new Error('sprite '+r.status); return r.text(); })
      .then(function(txt){
        const wrap = document.createElement('div');
        wrap.innerHTML = txt;
        const svgSrc = wrap.querySelector('svg');
        const symbols = svgSrc ? svgSrc.querySelectorAll('symbol') : [];
        if(!symbols.length) throw new Error('no symbols');
        const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        host.setAttribute('id', 'wc-icon-sprite');
        host.setAttribute('style', 'display:none');
        host.setAttribute('aria-hidden', 'true');
        symbols.forEach(function(s){ host.appendChild(s); });
        (document.body || document.documentElement).appendChild(host);
        ICON_SPRITE_READY = true;
        /* ไอคอนที่ render ไปแล้วจะถูกใช้ sprite ในการ render ครั้งถัดไปอัตโนมัติ */
      })
      .catch(function(){ ICON_SPRITE_FAILED = true; });
  }catch(e){ ICON_SPRITE_FAILED = true; }
}

/* --------------------------------------------------------------------------
   TILE(name, variant) — สัญลักษณ์มินิมอล: วงกลมเรียบ + ไอคอนเส้นบางสีเดียว
   variant: '' | 'red' | 'gold' | 'brown' | 'jade'
-------------------------------------------------------------------------- */
function TILE(name, variant){
  return '<span class="icn-tile ' + (variant||'') + '">' + ICON(name) + '</span>';
}

/* --------------------------------------------------------------------------
   iconize(root) — แปลงอีโมจิที่หลงเหลือใน text node ให้เป็นไอคอน SVG
   (Emoji → icon แบบ inline; ข้าม script/style/svg/input/textarea)
-------------------------------------------------------------------------- */
const ICONIZED = (typeof WeakSet !== 'undefined') ? new WeakSet() : null;
const EMOJI_RE = new RegExp(Object.keys(EMOJI_MAP).map(function(e){ return e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }).join('|') + '|[\uFE0F\u200D]', 'g');

function iconizeTextNode(node){
  if(ICONIZED){
    if(ICONIZED.has(node)) return;
    ICONIZED.add(node);
  }
  const txt = node.nodeValue;
  if(!txt || !EMOJI_RE.test(txt)) return;
  EMOJI_RE.lastIndex = 0;
  const frag = document.createDocumentFragment();
  let last = 0, m;
  while((m = EMOJI_RE.exec(txt))){
    if(m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
    const em = m[0];
    const name = EMOJI_MAP[em];
    if(name){
      const span = document.createElement('span');
      span.className = 'icn-inline';
      span.setAttribute('role','img');
      span.innerHTML = ICON(name);
      frag.appendChild(span);
    }
    last = m.index + em.length;
  }
  if(last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
  if(node.parentNode) node.parentNode.replaceChild(frag, node);
}
function iconize(root){
  root = root || document.body;
  if(root.nodeType === 3){ iconizeTextNode(root); return; }
  if(root.nodeType !== 1) return;
  /* placeholder/title ใน attribute: ตัดอีโมจิออก (ใส่ SVG ใน attribute ไม่ได้) */
  if(root.getAttribute && (root.hasAttribute('placeholder') || root.hasAttribute('title'))){
    ['placeholder','title'].forEach(function(a){
      if(root.hasAttribute(a)){
        const v = root.getAttribute(a);
        if(v && EMOJI_RE.test(v)){
          EMOJI_RE.lastIndex = 0;
          root.setAttribute(a, v.replace(EMOJI_RE, ' ').replace(/\s+/g,' ').trim());
        }
      }
    });
  }
  if(['SCRIPT','STYLE','SVG','TEXTAREA','INPUT','SELECT','OPTION','IFRAME','CODE','PRE'].indexOf(root.tagName) > -1) return;
  /* text nodes ที่เป็นลูกโดยตรง */
  for(let i = 0; i < root.childNodes.length; i++){
    const ch = root.childNodes[i];
    if(ch.nodeType === 3) iconizeTextNode(ch);
  }
  const kids = root.children ? Array.from(root.children) : [];
  kids.forEach(iconize);
}

/* observer: จับทุกโหนดใหม่ที่ถูก inject เข้ามา แล้วแปลงอัตโนมัติ */
let iconizeScheduled = false;
let iconizeObserver = null;
function iconizeSchedule(root){
  if(iconizeScheduled) return;
  iconizeScheduled = true;
  setTimeout(function(){
    iconizeScheduled = false;
    try{ iconize(root || document.body); }catch(e){}
  }, 40);
}
function startIconizer(){
  if(typeof MutationObserver === 'undefined') return;
  iconizeObserver = new MutationObserver(function(muts){
    let dirty = false;
    muts.forEach(function(m){
      m.addedNodes && m.addedNodes.forEach(function(n){
        if(n.nodeType === 1 || n.nodeType === 3) dirty = true;
      });
      if(m.type === 'characterData' && m.target && m.target.nodeType === 3) dirty = true;
      if(m.type === 'attributes' && m.target && m.target.nodeType === 1){
        /* ประมวลผล attribute ของโหนดนั้นทันที */
        try{ iconize(m.target); }catch(e){}
      }
    });
    if(dirty) iconizeSchedule(document.body);
  });
  iconizeObserver.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['placeholder','title']});
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){
    iconize(document.body);
    startIconizer();
    loadIconSprite();
  });
} else {
  iconize(document.body);
  startIconizer();
  loadIconSprite();
}
