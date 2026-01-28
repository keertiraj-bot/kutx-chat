import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import type { Message } from '../types';

// Hook for real-time message subscription
export function useRealtimeMessages(conversationId: string | null) {
    const { addMessage } = useChatStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    // Don't add if it's our own message (already added locally)
                    if (payload.new.sender_id === user?.id) return;

                    // Fetch sender info
                    const { data: sender } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const message: Message = {
                        ...payload.new as Message,
                        sender,
                    };

                    addMessage(message);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, addMessage, user?.id]);
}

// Hook for real-time conversation updates
export function useRealtimeConversations(userId: string | null) {
    const { fetchConversations } = useChatStore();

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel('conversation-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    // Refresh conversations when any message is received
                    fetchConversations(userId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchConversations]);
}

// Hook for user online status using Supabase Presence
export function useOnlineStatus() {
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                // We can use this to update local state if needed
            })
            .on('presence', { event: 'join' }, async ({ key }) => {
                if (key === user.id) {
                    await supabase
                        .from('users')
                        .update({ is_online: true, last_seen: new Date().toISOString() })
                        .eq('id', user.id);
                }
            })
            .on('presence', { event: 'leave' }, async ({ key }) => {
                if (key === user.id) {
                    await supabase
                        .from('users')
                        .update({ is_online: false, last_seen: new Date().toISOString() })
                        .eq('id', user.id);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);
}

// Hook for typing indicator
export function useTypingIndicator(conversationId: string | null) {
    const { user } = useAuthStore();
    const typingTimeout = useRef<any>(null);

    const sendTyping = useCallback(() => {
        if (!conversationId || !user) return;

        supabase.channel(`typing:${conversationId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: user.id, username: user.username },
        });

        // Clear previous timeout
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        // Stop typing after 3 seconds of inactivity
        typingTimeout.current = setTimeout(() => {
            supabase.channel(`typing:${conversationId}`).send({
                type: 'broadcast',
                event: 'stop_typing',
                payload: { user_id: user.id },
            });
        }, 3000);
    }, [conversationId, user]);

    return { sendTyping };
}

// Hook for real-time user status updates
export function useRealtimeUserStatus(userId: string | null) {
    const { fetchConversations } = useChatStore();

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel('user-status-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                },
                () => {
                    // Refresh conversations to get updated is_online status
                    fetchConversations(userId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchConversations]);
}
