# E-Stamp QR Code

ระบบ QR Code สำหรับสะสมแสตมป์งาน Open House สร้างด้วย Next.js 14, TypeScript และ Tailwind CSS ข้อมูลทดสอบเก็บใน `localStorage` โดยไม่มี backend

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

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

1. เปิด `/register` กรอกรหัสนักศึกษาเป็นตัวเลข 13 หลัก และบันทึก QR
2. เปิด `/dev` เพื่อดู URL และ QR ของชมรมและจุดรับรางวัล
3. เปิดหน้าสแกนของแต่ละชมรมบน iPad/โทรศัพท์ กด **เริ่มสแกน** และสแกน QR ผู้เข้าร่วม
4. เมื่อครบทุกชมรมในสถานที่นั้น เปิดหน้าจุดรับรางวัลและสแกน QR เดิม
5. ปุ่ม **ล้างข้อมูลทดสอบ** ใน `/dev` จะล้างนักศึกษา แสตมป์ และประวัติรับรางวัลของ browser ปัจจุบัน

> localStorage แยกกันตาม browser/device การทดสอบข้อมูลร่วมกันระหว่างหลายอุปกรณ์ต้องเปลี่ยน data client ไปใช้ backend ก่อน

## เปลี่ยนไปใช้ Supabase

UI เรียกข้อมูลผ่าน [`lib/dataClient.ts`](lib/dataClient.ts) เท่านั้น ให้คงชื่อ ฟังก์ชัน arguments และ return types เดิม แล้วเปลี่ยน implementation ภายในเป็นการเรียก Supabase/API ได้แก่ `getStudentByToken`, `createStudent`, `getClubByToken`, `getClubsByLocation`, `recordStamp`, `getStampsForStudent`, `getRewardBoothByToken`, `getRewardClaim` และ `createRewardClaim`

ฐานข้อมูลจริงควรกำหนด unique constraints สำหรับ `(studentId, clubId)`, `(studentId, location)` และ `studentCode` เพื่อป้องกันรายการซ้ำแม้มี request พร้อมกัน
