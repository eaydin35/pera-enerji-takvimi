// utils/secure-storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuestProfile } from '../types/profile';

const KEYS = {
  GUEST_PROFILE: 'pet_guest_profile',
} as const;

export async function saveGuestProfile(profile: GuestProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.GUEST_PROFILE, JSON.stringify(profile));
    console.log('[SecureStorage] Guest profile saved.');
  } catch (error) {
    console.error('[SecureStorage] Error saving guest profile:', error);
  }
}

export async function loadGuestProfile(): Promise<GuestProfile | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.GUEST_PROFILE);
    if (!data) return null;
    return JSON.parse(data) as GuestProfile;
  } catch (error) {
    console.error('[SecureStorage] Error loading guest profile:', error);
    return null;
  }
}

export async function clearGuestProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.GUEST_PROFILE);
    console.log('[SecureStorage] Guest profile deleted.');
  } catch (error) {
    console.error('[SecureStorage] Error deleting guest profile:', error);
  }
}

// Migration: Called when guest completes registration.
// Keeping the data in SecureStore as an offline fallback could be useful, 
// but typically we'd clear it. We'll provide it for migration purposes.
export async function getGuestProfileForMigration(): Promise<GuestProfile | null> {
  return loadGuestProfile();
}
