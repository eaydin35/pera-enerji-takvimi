import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Uploads an image to Supabase Storage and returns the public URL.
 * @param uri Local file URI (from ImagePicker)
 * @param userId User's unique ID for file naming
 * @returns Public URL string or null on failure
 */
export const uploadAvatar = async (uri: string, userId: string): Promise<string | null> => {
    try {
        if (!uri) throw new Error('URI is empty');
        
        // Supabase RLS enforces that the file must be stored in a folder named after the user's ID
        // Policy requirement: (storage.foldername(name))[1] = auth.uid()
        const fileName = `${userId}/${Date.now()}.jpg`;

        console.log('[Storage] Starting upload for:', fileName);

        // Read file as base64 (needed for Supabase upload in React Native)
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        if (!base64) throw new Error('Failed to read file as base64');

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, decode(base64), {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (error) {
            console.error('[Storage] Upload error detail:', error);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        console.log('[Storage] Upload success. Public URL:', publicUrl);
        return publicUrl;
    } catch (err) {
        console.error('[Storage] Unexpected error during upload:', err);
        return null;
    }
};
