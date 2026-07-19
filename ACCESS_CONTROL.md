# E-Stamp Access Control

ระบบใช้ Supabase Auth แบบ email/password เพราะ session เดียวกันสามารถใช้ทั้งตรวจหน้าเว็บและบังคับ RLS ที่ฐานข้อมูลได้ โดยไม่พึ่งการซ่อน URL หรือค่าใน `localStorage`

## เส้นทางที่ป้องกัน

Next.js middleware ใน `qrcode/middleware.ts` บังคับ login ก่อนเข้า:

- `/dev` และ subpaths
- `/club/*`
- `/reward/*`

หน้า `/register`, `/login` และหน้าสาธารณะอื่นยังเปิดได้โดยไม่ต้อง login ส่วน Dashboard จะตรวจ Supabase session ก่อน mount component ที่อ่าน analytics

## สิทธิ์ anonymous

- เรียก `register_attendee()` เพื่อสร้าง `user_info` และ `user_stamps` ใน transaction เดียว
- อ่าน `booths` เฉพาะข้อมูลชื่อ รหัส และโซน ซึ่งไม่มี PII และใช้แสดงข้อมูลกิจกรรมได้
- อ่าน `user_info`, `user_stamps`, `activity_log` ไม่ได้
- บันทึก check-in หรือรับรางวัลไม่ได้

## ตั้งค่า Supabase ด้วยตนเอง

1. เปิด Authentication > Providers และเปิด Email provider
2. ปิด public sign-up หากผู้เข้าร่วมไม่ควรสร้าง staff account (`Allow new users to sign up` = off)
3. สร้างบัญชีเจ้าหน้าที่ที่ Authentication > Users > Add user
4. รันไฟล์ใน `supabase/migrations/` ตามลำดับชื่อไฟล์ผ่าน SQL Editor หรือ Supabase CLI
5. เปิด Realtime สำหรับ `activity_log` หาก Dashboard ต้องอัปเดตทันที
6. ตั้ง environment variables ตาม `.env.example` ของ `qrcode` และ `dashboard`

บัญชี authenticated ทุกบัญชีในโปรเจกต์นี้ถือเป็น staff/organizer และเข้าถึง Dashboard ได้ หากต้องแยกสิทธิ์สองกลุ่มในอนาคต ให้เพิ่ม role ใน `app_metadata` และตรวจ role ใน RLS policies
