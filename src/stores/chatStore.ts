import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { supabase } from '../lib/supabase';

interface ChatState {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    isLoading: boolean;

    // Actions
    setConversations: (conversations: Conversation[]) => void;
    setActiveConversation: (conversation: Conversation | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;

    // API methods
    fetchConversations: (userId: string) => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (conversationId: string, senderId: string, content: string, mediaUrl?: string, mediaType?: string) => Promise<{ error: any }>;
    createConversation: (userId: string, otherUserId: string, type?: 'direct' | 'random') => Promise<Conversation | null>;
    markAsRead: (conversationId: string, userId: string) => Promise<void>;
    archiveConversation: (conversationId: string, userId: string) => Promise<void>;
    acceptChatRequest: (conversationId: string) => Promise<void>;
    rejectChatRequest: (conversationId: string) => Promise<void>;
    blockUser: (blockerId: string, blockedId: string) => Promise<void>;
    unblockUser: (blockerId: string, blockedId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    isLoading: false,

    setConversations: (conversations) => set({ conversations }),
    setActiveConversation: (activeConversation) => set({ activeConversation }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),

    fetchConversations: async (userId) => {
        set({ isLoading: true });

        // Fetch conversations where user is a participant
        const { data: participations } = await supabase
            .from('conversation_participants')
            .select(`
    *,
    conversation: conversations(*)
        `)
            .eq('user_id', userId)
            .eq('is_archived', false)
            .order('conversation(last_message_at)', { ascending: false });

        if (participations) {
            // Get other participants for each conversation
            const conversationsWithUsers = await Promise.all(
                participations.map(async (p) => {
                    const { data: otherParticipants } = await supabase
                        .from('conversation_participants')
                        .select('user:users(*)')
                        .eq('conversation_id', p.conversation_id)
                        .neq('user_id', userId)
                        .maybeSingle();

                    // Get last message
                    const { data: lastMessage } = await supabase
                        .from('messages')
                        .select('*, sender:users(*)')
                        .eq('conversation_id', p.conversation_id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    return {
                        ...p.conversation,
                        unread_count: p.unread_count,
                        other_user: otherParticipants?.user,
                        last_message: lastMessage,
                    } as Conversation;
                })
            );

            // Deduplicate conversations by other_user.id
            const uniqueConversationsMap = new Map<string, Conversation>();
            for (const conv of conversationsWithUsers) {
                const otherId = conv.other_user?.id;
                if (!otherId) {
                    uniqueConversationsMap.set(conv.id, conv);
                    continue;
                }
                const existing = uniqueConversationsMap.get(otherId);
                if (!existing || new Date(conv.last_message_at) > new Date(existing.last_message_at)) {
                    uniqueConversationsMap.set(otherId, conv);
                }
            }

            set({ conversations: Array.from(uniqueConversationsMap.values()) });
        }

        set({ isLoading: false });
    },

    fetchMessages: async (conversationId) => {
        set({ isLoading: true });

        const { data } = await supabase
            .from('messages')
            .select('*, sender:users(*)')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (data) {
            set({ messages: data });
        }

        set({ isLoading: false });
    },

    sendMessage: async (conversationId, senderId, content, mediaUrl, mediaType) => {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content,
                media_url: mediaUrl,
                media_type: mediaType,
            })
            .select('*, sender:users(*)')
            .single();

        if (!error && data) {
            get().addMessage(data);
        }

        return { error };
    },

    createConversation: async (userId, otherUserId, type = 'direct') => {
        // Find if a direct conversation already exists between these users
        const { data: participations } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (participations && participations.length > 0) {
            const conversationIds = participations.map(p => p.conversation_id);

            // Check if other user is also in any of these conversations
            const { data: otherParticipations } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', otherUserId)
                .in('conversation_id', conversationIds);

            const convoIds = otherParticipations?.map(p => p.conversation_id) || [];
            if (convoIds.length > 0) {
                const { data: conversation } = await supabase
                    .from('conversations')
                    .select('*')
                    .in('id', convoIds)
                    .eq('type', 'direct')
                    .maybeSingle();

                if (conversation) return conversation;
            }
        }

        // Create new conversation
        console.log('Inserting new conversation:', { type, creator_id: userId, status: 'accepted' });
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({
                type,
                creator_id: userId,
                status: 'accepted'
            })
            .select()
            .single();

        if (convError || !conversation) {
            console.error('Error creating conversation:', convError);
            return null;
        }

        // Add participants
        const { error: partError } = await supabase.from('conversation_participants').insert([
            { conversation_id: conversation.id, user_id: userId },
            { conversation_id: conversation.id, user_id: otherUserId },
        ]);

        if (partError) {
            console.error('Error adding participants:', partError);
            return null;
        }

        return conversation;
    },

    markAsRead: async (conversationId, userId) => {
        await supabase
            .from('conversation_participants')
            .update({ unread_count: 0 })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);

        // Update local state
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? { ...c, unread_count: 0 } : c
            ),
        }));
    },

    archiveConversation: async (conversationId, userId) => {
        await supabase
            .from('conversation_participants')
            .update({ is_archived: true })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== conversationId),
        }));
    },

    acceptChatRequest: async (conversationId) => {
        await supabase
            .from('conversations')
            .update({ status: 'accepted' })
            .eq('id', conversationId);

        set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? { ...c, status: 'accepted' } : c
            ),
        }));
    },

    rejectChatRequest: async (conversationId) => {
        await supabase
            .from('conversations')
            .update({ status: 'rejected' })
            .eq('id', conversationId);

        set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== conversationId),
        }));
    },

    blockUser: async (blockerId, blockedId) => {
        const { error } = await supabase
            .from('blocked_users')
            .insert({ blocker_id: blockerId, blocked_id: blockedId });

        if (error) throw error;
    },

    unblockUser: async (blockerId, blockedId) => {
        const { error } = await supabase
            .from('blocked_users')
            .delete()
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId);

        if (error) throw error;
    },
}));
