import type { Club, RewardBooth } from "./types";

export const clubs: Club[] = [
  { id: "club-1", name: "ชมรมดนตรีสากล", location: "anekprasong", token: "club-music-a7k2" },
  { id: "club-2", name: "ชมรมหุ่นยนต์", location: "anekprasong", token: "club-robot-r9m4" },
  { id: "club-3", name: "ชมรมถ่ายภาพ", location: "anekprasong", token: "club-photo-p3x8" },
  { id: "club-4", name: "ชมรมอาสาพัฒนา", location: "anekprasong", token: "club-volunteer-v5n1" },
  { id: "club-5", name: "ชมรมกีฬา", location: "palm_garden", token: "club-sport-s6b2" },
  { id: "club-6", name: "ชมรมภาษาและวัฒนธรรม", location: "palm_garden", token: "club-language-l8c4" },
  { id: "club-7", name: "ชมรมผู้ประกอบการ", location: "palm_garden", token: "club-business-b2q7" },
  { id: "club-8", name: "ชมรมศิลปะสร้างสรรค์", location: "palm_garden", token: "club-art-a4w9" },
];

export const rewardBooths: RewardBooth[] = [
  { id: "reward-1", location: "anekprasong", token: "reward-anek-e4t8" },
  { id: "reward-2", location: "palm_garden", token: "reward-palm-k7u3" },
];

export const locationNames = { anekprasong: "อาคารอเนกประสงค์", palm_garden: "สวนปาล์ม" } as const;
