export type Zone = "front" | "back";
export type Location = Zone;

export interface Student {
  id: string;
  studentCode: string;
  name: string;
  qrToken: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  location: Zone;
  token: string;
}

export interface Stamp {
  id: string;
  studentId: string;
  clubId: string;
  scannedAt: string;
}

export interface RewardBooth {
  id: string;
  location: Zone;
  token: string;
}

export interface RewardClaim {
  id: string;
  studentId: string;
  location: Zone;
  claimedAt: string;
}
