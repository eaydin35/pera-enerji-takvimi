// types/profile.ts

export type Gender = 'male' | 'female' | 'other';
export type LifeFocus = 'love' | 'career' | 'family' | 'children' | 'money' | 'health' | 'spiritual';

export interface UserProfile {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  
  // Demographics / Persona
  gender?: Gender;
  lifeFocus?: LifeFocus[];
  
  // Birth Data
  birthDate: string;       // YYYY-MM-DD format
  birthTime: string;       // HH:mm format
  birthPlace: string;
  birthLat?: number;
  birthLng?: number;
  
  // Optional Astrology Data
  sunSign?: string;
  moonSign?: string;
  ascendant?: string;
  
  avatarUrl?: string;
  chartVersion?: number; // Used for recalculating the charting;
  
  // Chart & Token Rights
  chartUpdatesRemaining: number;
  tokens: number;
  sub_stars?: number;
  bonus_stars?: number;
  chartLastUpdatedAt?: string;
  
  // WooCommerce Connection
  wpUserId?: number;
  wpLinkedAt?: string;
  
  // Migration Flags
  migratedFromGuest: boolean;
  guestMigratedAt?: string;
}

export interface GuestProfile {
  firstName: string;
  lastName: string;
  
  // Demographics / Persona
  gender?: Gender;
  lifeFocus?: LifeFocus[];
  
  // Birth Data
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthLat?: number;
  birthLng?: number;
  
  avatarUrl?: string;
  chartVersion?: number;
  tokens: number;
  
  createdAt: string; // Local timestamp ISO string
  isGuest: true;
}

export type AnyProfile = UserProfile | GuestProfile;

export function isGuestProfile(p: AnyProfile | null | undefined): p is GuestProfile {
  if (!p) return false;
  return (p as GuestProfile).isGuest === true;
}
