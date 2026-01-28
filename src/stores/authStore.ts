import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ThemePreference } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
    user: User | null;
    session: any;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setSession: (session: any) => void;
    setLoading: (loading: boolean) => void;

    // Auth methods
    signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
    refreshUser: () => Promise<void>;
    updateLastSeen: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setSession: (session) => set({ session }),
            setLoading: (isLoading) => set({ isLoading }),

            signUp: async (email, password, username) => {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username },
                    },
                });

                if (!error && data.user) {
                    // Fetch the created user profile
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    set({ user: profile, session: data.session, isAuthenticated: true });
                }

                return { error };
            },

            signIn: async (email, password) => {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (!error && data.user) {
                    // Fetch user profile
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    // Update online status
                    await supabase
                        .from('users')
                        .update({ is_online: true, last_seen: new Date().toISOString() })
                        .eq('id', data.user.id);

                    set({ user: profile, session: data.session, isAuthenticated: true });
                }

                return { error };
            },

            signOut: async () => {
                const { user } = get();

                if (user) {
                    // Update offline status
                    await supabase
                        .from('users')
                        .update({ is_online: false, last_seen: new Date().toISOString() })
                        .eq('id', user.id);
                }

                await supabase.auth.signOut();
                set({ user: null, session: null, isAuthenticated: false });
            },

            updateProfile: async (updates) => {
                const { user } = get();
                if (!user) return { error: 'No user logged in' };

                const { data, error } = await supabase
                    .from('users')
                    .update(updates)
                    .eq('id', user.id)
                    .select()
                    .single();

                if (!error && data) {
                    set({ user: data });
                }

                return { error };
            },

            refreshUser: async () => {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    set({ user: profile, session, isAuthenticated: true, isLoading: false });
                    get().updateLastSeen();
                } else {
                    set({ user: null, session: null, isAuthenticated: false, isLoading: false });
                }
            },

            updateLastSeen: async () => {
                const { user } = get();
                if (!user) return;

                await supabase
                    .from('users')
                    .update({ is_online: true, last_seen: new Date().toISOString() })
                    .eq('id', user.id);
            },
        }),
        {
            name: 'kutx-auth-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
);

// Theme store
interface ThemeState {
    theme: ThemePreference;
    setTheme: (theme: Partial<ThemePreference>) => void;
    applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: {
                mode: 'light',
                primary_color: '#6366f1',
                accent_color: '#8b5cf6',
            },

            setTheme: (updates) => {
                set((state) => ({
                    theme: { ...state.theme, ...updates },
                }));
                get().applyTheme();
            },

            applyTheme: () => {
                const { theme } = get();
                const root = document.documentElement;

                // Apply CSS variables
                root.style.setProperty('--primary-color', theme.primary_color);
                root.style.setProperty('--accent-color', theme.accent_color);

                // Apply dark/light mode
                if (theme.mode === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                } else {
                    root.setAttribute('data-theme', theme.mode);
                }
            },
        }),
        {
            name: 'kutx-theme-storage',
        }
    )
);
