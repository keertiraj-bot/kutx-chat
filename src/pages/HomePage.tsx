import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useRealtimeConversations, useRealtimeUserStatus } from '../hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';

export function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { conversations, fetchConversations, isLoading } = useChatStore();

    // Real-time subscription
    useRealtimeConversations(user?.id || null);
    useRealtimeUserStatus(user?.id || null);

    useEffect(() => {
        if (user) {
            fetchConversations(user.id);
        }
    }, [user, fetchConversations]);

    const handleChatClick = (conversationId: string) => {
        navigate(`/chat/${conversationId}`);
    };

    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="page">
            {/* Header */}
            <header className="header">
                <h1 className="header-title">Chats</h1>
            </header>

            {/* Chat List */}
            <div className="chat-list">
                {isLoading ? (
                    <div className="loading-state">
                        <span className="spinner" />
                        <p>Loading conversations...</p>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare size={64} />
                        <h3>No conversations yet</h3>
                        <p>Start chatting by searching for users or try random matching!</p>
                    </div>
                ) : (
                    conversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            className="chat-item"
                            onClick={() => handleChatClick(conversation.id)}
                        >
                            {/* Avatar */}
                            <div className="avatar-container">
                                {conversation.other_user?.avatar_url ? (
                                    <img
                                        src={conversation.other_user.avatar_url}
                                        alt={conversation.other_user.username}
                                        className="avatar"
                                    />
                                ) : (
                                    <div className="avatar">
                                        {getInitials(conversation.other_user?.username || 'U')}
                                    </div>
                                )}
                                {conversation.other_user?.is_online && (
                                    <span className="online-indicator" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="chat-item-content">
                                <div className="chat-item-name">
                                    {conversation.other_user?.username || 'Unknown User'}
                                    {conversation.type === 'random' && (
                                        <span className="random-badge">Random</span>
                                    )}
                                </div>
                                <div className="chat-item-message">
                                    {conversation.last_message?.content || 'No messages yet'}
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="chat-item-meta">
                                <span className="chat-item-time">
                                    {conversation.last_message?.created_at &&
                                        formatDistanceToNow(new Date(conversation.last_message.created_at), {
                                            addSuffix: false,
                                        })}
                                </span>
                                {(conversation as any).unread_count > 0 && (
                                    <span className="badge">{(conversation as any).unread_count}</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FAB */}
            <button
                className="fab"
                onClick={() => navigate('/search')}
                aria-label="New chat"
            >
                <Plus size={24} />
            </button>

            <style>{`
        .chat-list {
          flex: 1;
          overflow-y: auto;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
          color: var(--text-muted);
        }

        .avatar-container {
          position: relative;
        }

        .random-badge {
          font-size: 0.625rem;
          background: var(--accent-color);
          color: white;
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-full);
          margin-left: 0.5rem;
          font-weight: 500;
        }
      `}</style>
        </div>
    );
}
