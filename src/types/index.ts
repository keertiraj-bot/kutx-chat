export interface User {
    id: string;
    username: string;
    email: string;
    phone?: string;
    bio?: string;
    avatar_url?: string;
    theme_preference: ThemePreference;
    created_at: string;
    last_seen: string;
    is_online: boolean;
}

export interface ThemePreference {
    mode: 'light' | 'dark' | 'auto';
    primary_color: string;
    accent_color: string;
    chat_bubble_color?: string;
    wallpaper_url?: string;
}

export interface Conversation {
    id: string;
    type: 'direct' | 'random';
    created_at: string;
    last_message_at: string;
    participants?: ConversationParticipant[];
    last_message?: Message;
    other_user?: User;
    status: 'pending' | 'accepted' | 'rejected';
    creator_id: string;
}

export interface ConversationParticipant {
    conversation_id: string;
    user_id: string;
    joined_at: string;
    is_archived: boolean;
    unread_count: number;
    user?: User;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content?: string;
    media_url?: string;
    media_type?: 'image' | 'video' | 'audio' | 'file';
    created_at: string;
    is_read: boolean;
    sender?: User;
}

export interface StatusUpdate {
    id: string;
    user_id: string;
    content?: string;
    media_url?: string;
    media_type: 'text' | 'image' | 'video';
    background_color: string;
    privacy: 'everyone' | 'contacts' | 'custom';
    created_at: string;
    expires_at: string;
    view_count: number;
    user?: User;
}

export interface StatusView {
    id: string;
    status_id: string;
    viewer_id: string;
    viewed_at: string;
    viewer?: User;
}

export interface RandomChatQueue {
    id: string;
    user_id: string;
    interests: string[];
    is_anonymous: boolean;
    joined_queue_at: string;
}

export interface BlockedUser {
    blocker_id: string;
    blocked_id: string;
    blocked_at: string;
}

export interface UserContact {
    user_id: string;
    contact_id: string;
    added_at: string;
    contact?: User;
}
