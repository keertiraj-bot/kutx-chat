import { useState, useEffect, useRef, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Smile, MoreVertical, X, Phone, Paperclip, Info } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useRealtimeMessages, useTypingIndicator, useRealtimeUserStatus } from '../hooks/useRealtime';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export function ChatPage() {
    const { id: conversationId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        activeConversation,
        messages,
        fetchMessages,
        sendMessage,
        markAsRead,
        isLoading,
        setActiveConversation,
        blockUser,
        unblockUser
    } = useChatStore();
    const { sendTyping } = useTypingIndicator(conversationId || null);

    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingMedia, setPendingMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const [isBlockedByMe, setIsBlockedByMe] = useState(false);
    const [amIBlocked, setAmIBlocked] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);

    // Real-time subscriptions
    useRealtimeMessages(conversationId || null);
    useRealtimeUserStatus(user?.id || null);

    // Fetch conversation and messages
    useEffect(() => {
        if (!conversationId || !user) return;

        const initChat = async () => {
            await fetchMessages(conversationId);
            await markAsRead(conversationId, user.id);

            // Set active conversation from local state if not already set
            const { data: conv } = await supabase
                .from('conversations')
                .select('*, participants:conversation_participants(user:users(*))')
                .eq('id', conversationId)
                .single();

            if (conv) {
                const otherParticipant = conv.participants.find((p: any) => p.user.id !== user.id);
                const otherUser = otherParticipant?.user;
                setActiveConversation({
                    ...conv,
                    other_user: otherUser,
                });

                if (otherUser) {
                    // Check blocking status
                    const { data: blocks } = await supabase
                        .from('blocked_users')
                        .select('*')
                        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUser.id}),and(blocker_id.eq.${otherUser.id},blocked_id.eq.${user.id})`);

                    if (blocks) {
                        setIsBlockedByMe(blocks.some(b => b.blocker_id === user.id));
                        setAmIBlocked(blocks.some(b => b.blocker_id === otherUser.id));
                    }
                }
            }
        };

        initChat();

        return () => setActiveConversation(null);
    }, [conversationId, user, fetchMessages, markAsRead, setActiveConversation]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleMediaUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (!file || !conversationId || !user) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(filePath);

            setPendingMedia({ url: publicUrl, type });
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload media');
        } finally {
            setIsUploading(false);
            if (mediaInputRef.current) mediaInputRef.current.value = '';
        }
    }, [conversationId, user]);

    const handleSend = async () => {
        if ((!messageText.trim() && !pendingMedia) || !conversationId || !user || isSending) return;

        setIsSending(true);
        const text = messageText.trim();
        const media = pendingMedia;

        setMessageText('');
        setPendingMedia(null);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const { error } = await sendMessage(conversationId, user.id, text, media?.url, media?.type);
        if (error) {
            setMessageText(text);
            setPendingMedia(media);
            console.error('Send error:', error);
        }
        setIsSending(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCall = () => {
        if (isBlockedByMe || amIBlocked) {
            alert('Cannot call while blocked.');
            return;
        }
        alert('Call feature is being initialized...');
    };

    const toggleBlock = async () => {
        if (!user || !otherUser) return;
        try {
            if (isBlockedByMe) {
                await unblockUser(user.id, otherUser.id);
                setIsBlockedByMe(false);
            } else {
                if (window.confirm(`Are you sure you want to block ${otherUser.username}?`)) {
                    await blockUser(user.id, otherUser.id);
                    setIsBlockedByMe(true);
                }
            }
        } catch (error) {
            console.error('Error toggling block:', error);
        }
        setIsMenuOpen(false);
    };

    const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

    const otherUser = activeConversation?.other_user;

    if (!activeConversation && isLoading) {
        return (
            <div className="chat-loading">
                <span className="spinner" />
            </div>
        );
    }

    return (
        <div className="chat-page">
            {/* Header */}
            <header className="chat-header">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>

                <div className="chat-header-user" onClick={() => setShowProfile(true)}>
                    {otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="avatar avatar-sm" />
                    ) : (
                        <div className="avatar avatar-sm">{getInitials(otherUser?.username || 'U')}</div>
                    )}
                    <div className="chat-header-info">
                        <span className="chat-header-name">{otherUser?.username || 'Chat'}</span>
                        <span className="chat-header-status">
                            {otherUser?.is_online ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="header-actions">
                    <button className="btn btn-ghost btn-icon" title="Audio Call" onClick={handleCall}>
                        <Phone size={20} />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <MoreVertical size={20} />
                    </button>
                    {isMenuOpen && (
                        <div className="menu-dropdown fade-in">
                            <button onClick={() => { setShowProfile(true); setIsMenuOpen(false); }}>
                                <Info size={16} /> View Profile
                            </button>
                            <button onClick={toggleBlock} className={isBlockedByMe ? 'text-primary' : 'text-error'}>
                                <X size={16} /> {isBlockedByMe ? 'Unblock User' : 'Block User'}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Content Area */}
            <div className="messages-container">
                {messages.map((message, index) => {
                    const isOwn = message.sender_id === user?.id;
                    const showDate = index === 0 ||
                        format(new Date(message.created_at), 'yyyy-MM-dd') !==
                        format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd');

                    return (
                        <div key={message.id}>
                            {showDate && (
                                <div className="message-date">
                                    {format(new Date(message.created_at), 'MMMM d, yyyy')}
                                </div>
                            )}
                            <div className={`message ${isOwn ? 'sent' : 'received'}`}>
                                <div className="message-bubble">
                                    {message.media_url && (
                                        <div className="message-media">
                                            {message.media_type === 'video' ? (
                                                <div className="video-player">
                                                    <video src={message.media_url} controls />
                                                </div>
                                            ) : (
                                                <img src={message.media_url} alt="" loading="lazy" />
                                            )}
                                        </div>
                                    )}
                                    {message.content && <p className="message-text">{message.content}</p>}
                                    <span className="message-time">
                                        {format(new Date(message.created_at), 'HH:mm')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Media Preview Area */}
            {pendingMedia && (
                <div className="media-preview-container fade-in">
                    <div className="media-preview-card">
                        {pendingMedia.type === 'video' ? (
                            <video src={pendingMedia.url} className="preview-media" muted />
                        ) : (
                            <img src={pendingMedia.url} alt="Staged" className="preview-media" />
                        )}
                        <button className="remove-media-btn" onClick={() => setPendingMedia(null)}>
                            <X size={16} />
                        </button>
                        <div className="preview-overlay">
                            Ready to send
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="message-input-container">
                <button className="btn btn-ghost btn-icon" onClick={() => mediaInputRef.current?.click()}>
                    <Paperclip size={22} />
                </button>
                <input
                    type="file"
                    ref={mediaInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,video/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleMediaUpload(e, file.type.startsWith('video/') ? 'video' : 'image');
                    }}
                />

                <textarea
                    ref={textareaRef}
                    className="message-input input"
                    placeholder={isBlockedByMe ? "You have blocked this user" : amIBlocked ? "You are blocked" : "Type a message..."}
                    value={messageText}
                    onChange={(e) => {
                        setMessageText(e.target.value);
                        sendTyping();
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={isUploading || isBlockedByMe || amIBlocked}
                />

                <button className="btn btn-ghost btn-icon" disabled={isBlockedByMe || amIBlocked}>
                    <Smile size={22} />
                </button>

                <button
                    className="btn btn-primary btn-icon"
                    onClick={handleSend}
                    disabled={(!messageText.trim() && !pendingMedia) || isSending || isUploading || isBlockedByMe || amIBlocked}
                >
                    {isUploading || isSending ? <span className="spinner spinner-sm" /> : <Send size={20} />}
                </button>
            </div>


            {/* Profile Modal */}
            {showProfile && otherUser && (
                <div className="modal-overlay" onClick={() => setShowProfile(false)}>
                    <div className="profile-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowProfile(false)}>
                            <X size={24} />
                        </button>
                        <div className="profile-header">
                            {otherUser.avatar_url ? (
                                <img src={otherUser.avatar_url} alt="" className="avatar avatar-xl" />
                            ) : (
                                <div className="avatar avatar-xl">{getInitials(otherUser.username)}</div>
                            )}
                            <h2>{otherUser.username}</h2>
                            <p className={otherUser.is_online ? 'text-success' : 'text-muted'}>
                                {otherUser.is_online ? 'Online' : 'Offline'}
                            </p>
                        </div>
                        <div className="profile-details">
                            {otherUser.bio && (
                                <div className="detail-item">
                                    <label>Bio</label>
                                    <p>{otherUser.bio}</p>
                                </div>
                            )}
                            {/* Email is hidden for privacy for other users */}
                            {otherUser.id === user?.id && otherUser.email && (
                                <div className="detail-item">
                                    <label>Email</label>
                                    <p>{otherUser.email}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .chat-page { display: flex; flex-direction: column; height: 100vh; height: 100dvh; background: var(--bg-secondary); }
                .chat-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--bg-primary); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
                .chat-header-user { flex: 1; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
                .chat-header-info { display: flex; flex-direction: column; }
                .chat-header-name { font-weight: 600; color: var(--text-primary); }
                .chat-header-status { font-size: 0.75rem; color: var(--text-muted); }
                .header-actions { position: relative; display: flex; gap: 0.25rem; }
                
                .messages-container { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; position: relative; }
                .message-date { text-align: center; font-size: 0.75rem; color: var(--text-muted); margin: 1rem 0; }
                .message { display: flex; flex-direction: column; max-width: 100%; transition: all 0.3s ease; }
                .message.sent { align-items: flex-end; }
                .message.received { align-items: flex-start; }
                .message-bubble { max-width: 80%; padding: 0.75rem 1rem; border-radius: 1rem; position: relative; box-shadow: var(--shadow-sm); }
                .sent .message-bubble { background: var(--primary-color); color: white; border-bottom-right-radius: 0.25rem; }
                .received .message-bubble { background: var(--bg-primary); color: var(--text-primary); border-bottom-left-radius: 0.25rem; }
                
                .message-text { word-break: break-all; font-size: 0.95rem; }
                .message-time { font-size: 0.65rem; opacity: 0.7; margin-top: 0.25rem; display: block; text-align: right; }
                .message-media { margin-bottom: 0.5rem; border-radius: 0.75rem; overflow: hidden; }
                .message-media img { max-width: 100%; display: block; border-radius: 0.75rem; transition: transform 0.3s; }
                .message-media img:hover { transform: scale(1.02); }
                .video-player { max-width: 250px; }
                .video-player video { width: 100%; border-radius: 0.75rem; }

                .message-input-container { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--bg-primary); border-top: 1px solid var(--border-color); padding-bottom: calc(0.75rem + var(--safe-area-bottom)); }
                .message-input { flex: 1; min-height: 44px; max-height: 120px; padding: 0.75rem 1.25rem; border-radius: var(--radius-xl); border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 1rem; transition: border-color 0.2s; }
                .message-input:focus { border-color: var(--primary-color); outline: none; }
                
                .menu-dropdown { position: absolute; top: 100%; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 100; min-width: 180px; overflow: hidden; margin-top: 0.5rem; animation: slideDown 0.2s ease; }
                .menu-dropdown button { width: 100%; padding: 0.875rem 1rem; display: flex; align-items: center; gap: 0.75rem; border: none; background: none; color: var(--text-primary); cursor: pointer; text-align: left; transition: background 0.2s; font-size: 0.9rem; }
                .menu-dropdown button:hover { background: var(--bg-secondary); }

                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.3s ease; }
                .profile-modal { background: var(--bg-primary); width: 100%; max-width: 360px; border-radius: var(--radius-xl); overflow: hidden; position: relative; animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .close-btn { position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.1); border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary); z-index: 10; transition: background 0.2s; }
                .close-btn:hover { background: rgba(0,0,0,0.2); }
                
                .profile-header { padding: 3rem 2rem 2rem; text-align: center; background: linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary)); border-bottom: 1px solid var(--border-color); }
                .profile-header h2 { margin-top: 1rem; font-size: 1.5rem; color: var(--text-primary); }
                .profile-header p { font-size: 0.875rem; }
                .avatar-xl { width: 120px; height: 120px; border-radius: 3.5rem; font-size: 3rem; box-shadow: var(--shadow-md); margin: 0 auto; object-fit: cover; }
                
                .profile-details { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .detail-item label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600; }
                .detail-item p { font-size: 1rem; color: var(--text-primary); line-height: 1.5; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

                .media-preview-container { padding: 0.75rem 1rem; background: var(--bg-primary); border-top: 1px solid var(--border-color); position: relative; display: flex; align-items: center; gap: 1rem; }
                .media-preview-card { position: relative; width: 80px; height: 80px; border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow); }
                .preview-media { width: 100%; height: 100%; object-fit: cover; }
                .remove-media-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(2px); }
                .preview-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.4); color: white; font-size: 0.65rem; text-align: center; padding: 2px 0; }
                .text-error { color: var(--error) !important; }
                .text-success { color: var(--success) !important; }
                .spinner-sm { border-width: 2px; }
            `}</style>
        </div>
    );
}
