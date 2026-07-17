export type Location = "anekprasong" | "palm_garden";

export interface Student { id: string; studentCode: string; qrToken: string; createdAt: string }
export interface Club { id: string; name: string; location: Location; token: string }
export interface Stamp { id: string; studentId: string; clubId: string; scannedAt: string }
export interface RewardBooth { id: string; location: Location; token: string }
export interface RewardClaim { id: string; studentId: string; location: Location; claimedAt: string }
