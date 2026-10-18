# 🚀 Deploy Guide — GitHub → Cloudflare Pages → Supabase (Real-time)

## 1. อัปโหลดขึ้น GitHub
```bash
cd why-chinese
git init -b main                       # (ทำแล้ว)
git add .
git commit -m "why-chinese v1"
gh auth login                          # ล็อกอิน GitHub (browser จะเปิดให้)
gh repo create weishenme --public --source=. --push
```
ถ้าไม่มี `gh`: สร้าง repo ว่างบน github.com แล้ว:
```bash
git remote add origin https://github.com/<user>/weishenme.git
git push -u origin main
```

## 2. Deploy ด้วย Cloudflare Pages (ฟรี + ผูกโดเมน)
1. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. เลือก repo `weishenme` → Build settings: **ไม่มี build command** (static) → Output: `/`
3. Deploy → ได้ URL `https://weishenme.pages.dev`
4. โดเมน: Cloudflare → โดเมนของคุณ → DNS → CNAME `@` และ `www` → `weishenme.pages.dev`
   (ซื้อโดเมนถูกที่สุดที่ Cloudflare Registrar — at-cost)
5. Pages → Custom domains → ใส่โดเมนของคุณ
6. ทุกครั้งที่ `git push` — เว็บอัปเดตอัตโนมัติ

## 3. Supabase — ทำให้เรียลไทม์
1. supabase.com → New project (ฟรี) → จำ Region ใกล้ไทย (ap-southeast-1)
2. SQL Editor → New query → วางเนื้อหาทั้งหมดใน `supabase/schema.sql` → Run
3. Project Settings → API → คัดลอก **Project URL** + **anon public key**
4. ใส่ใน `assets/supabase-config.js`:
   ```js
   window.WC_SUPABASE = { url: 'https://xxxx.supabase.co', anonKey: 'eyJ...' };
   ```
5. `git push` → เว็บอัปเดต → ทุกอย่างทำงานแบบเรียลไทม์

## 4. ตั้งแอดมินบนคลาวด์
1. เปิดเว็บ → footer → "เข้าสู่ระบบผู้ดูแล" → สมัครผู้ดูแลด้วยอีเมล+รหัสผ่านของคุณ
2. Supabase → SQL Editor:
   ```sql
   update public.profiles set is_admin = true where email = 'คุณ@example.com';
   ```
3. จากนี้แอดมินเข้าหลังบ้านด้วยอีเมล+รหัสผ่านนี้ — ปุ่มตั้งค่าเห็นเฉพาะแอดมิน
4. ผู้ใช้คนอื่นไม่เห็นปุ่มตั้งค่าใด ๆ

## 5. เรียลไทม์ได้อะไรบ้าง
- เปิด/ปิดฟีเจอร์ + พรีเมียม (หลังบ้าน → เปิด/ปิดฟีเจอร์) → ทุกเบราว์เซอร์อัปเดตทันที
- ผู้ใช้บนคลาวด์: ดูรายชื่อ เติมพรีเมียม/เหรียญ ได้จากเครื่องใดก็ได้ (หลังบ้าน → ผู้ใช้)
- บัญชีผู้ใช้ sync ข้ามเครื่อง (แต้ม/เหรียญ/พรีเมียม/ความคืบหน้า)
