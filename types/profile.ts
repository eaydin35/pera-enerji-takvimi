// types/profile.ts

export interface UserProfile {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  
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
  
  // Chart Update Rights
  chartUpdatesRemaining: number;
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
  
  // Birth Data
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthLat?: number;
  birthLng?: number;
  
  avatarUrl?: string;
  chartVersion?: number;
  
  createdAt: string; // Local timestamp ISO string
  isGuest: true;
}

export type AnyProfile = UserProfile | GuestProfile;

export function isGuestProfile(p: AnyProfile | null | undefined): p is GuestProfile {
  if (!p) return false;
  return (p as GuestProfile).isGuest === true;
}
