# E-Stamp QR Code

ระบบ QR Code สำหรับสะสมแสตมป์งาน Open House สร้างด้วย Next.js 14, TypeScript, Tailwind CSS และ Supabase โดยใช้ฐานข้อมูลชุดเดียวกับ Dashboard

## เริ่มใช้งาน

```bash
nvm install
nvm use
npm install
cp qrcode/.env.example qrcode/.env.local
npm run dev
```

คำสั่ง `npm run dev` ที่ root จะเปิดแอปที่ใช้งานจริงพร้อมกัน:

- QR Code: `http://localhost:3000`
- Hub: `http://localhost:5173`
- Dashboard: `http://localhost:5174`

เปิด `http://localhost:3000` บนอุปกรณ์เดียวกัน สำหรับการทดสอบกล้องบนอุปกรณ์อื่นต้องให้บริการผ่าน HTTPS เพราะ Safari/Chrome ไม่อนุญาตกล้องบน HTTP ที่ไม่ใช่ localhost

### เปิดกล้องจากโทรศัพท์หรือ iPad

`localhost` หมายถึงอุปกรณ์ที่กำลังเปิดเว็บเสมอ ดังนั้น `localhost` บน iPad คือ iPad ไม่ใช่คอมพิวเตอร์ที่รัน Next.js การเปิดผ่าน IP เช่น `http://192.168.1.20:3000` จะดูหน้าเว็บได้ แต่ browser จะปิดกั้นกล้องเพราะไม่ใช่ HTTPS

วิธีที่ง่ายและเชื่อถือได้คือเปิด HTTPS tunnel ไปยัง dev server ตัวอย่างเมื่อมี `cloudflared`:

```bash
npm run dev
cloudflared tunnel --url http://localhost:3000
```

จากนั้นเปิด URL `https://...trycloudflare.com` ที่แสดงใน terminal บนโทรศัพท์/iPad หรือใช้ ngrok ในลักษณะเดียวกัน URL ต้องขึ้นต้นด้วย `https://` และไม่มีคำเตือน certificate จึงจะเปิดกล้องบน iOS ได้ ไม่ควร deploy งานจริงด้วย development tunnel

## ทดสอบครบทั้ง flow

1. เปิด `/register` กรอกชื่อและรหัสนักศึกษา 13 หลัก แล้วบันทึก QR
2. เปิด `/dev` เพื่อดูบูธจาก Supabase พร้อม URL และ QR สำหรับหน้าสแกน
3. เปิดหน้าสแกนของแต่ละบูธบน iPad/โทรศัพท์ กด **เริ่มสแกน** และสแกน QR ผู้เข้าร่วม
4. เมื่อครบทุกบูธทั้งโซนหน้าและโซนหลัง เปิดหน้าจุดรับรางวัลและสแกน QR เดิม

การสแกนสำเร็จจะอัปเดต `user_stamps` และเพิ่ม `activity_log` เพื่อให้ Dashboard อัปเดตผ่าน Realtime

## Supabase

กำหนด `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ใน `.env.local` ห้าม commit ไฟล์นี้

QR เก็บเฉพาะค่า SHA-256 ของรหัสนักศึกษา (`hashed_user_id`) ไม่ได้เก็บรหัสนักศึกษาจริง

## สิทธิ์เจ้าหน้าที่

หน้า `/dev`, `/club/*` และ `/reward/*` ต้องเข้าสู่ระบบด้วยบัญชี Supabase Auth ก่อน ส่วน `/register` ยังเป็นหน้าสาธารณะตามเดิม ดูขั้นตอนตั้งค่าและ RLS ที่ [`../ACCESS_CONTROL.md`](../ACCESS_CONTROL.md)
