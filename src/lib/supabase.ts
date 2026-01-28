import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eeeskhrlwekseqclrxhf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZXNraHJsd2Vrc2VxY2xyeGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTM0NDIsImV4cCI6MjA4NTA2OTQ0Mn0.ud1AFJFJAKMNy4qmgrXFMIEqy6enwBqO3t5XNT-j21o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Helper to get public URL for storage files
export const getStorageUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

// Helper to upload file to storage
export const uploadFile = async (
    bucket: string,
    path: string,
    file: File
): Promise<string | null> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
    });

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    return getStorageUrl(bucket, path);
};
