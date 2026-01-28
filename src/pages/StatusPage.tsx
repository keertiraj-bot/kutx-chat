import { useState, useEffect } from 'react';
import { Plus, Eye, ChevronRight, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import type { StatusUpdate, User } from '../types';

interface StatusWithUser extends StatusUpdate {
    user: User;
}

export function StatusPage() {
    const { user } = useAuthStore();
    const [myStatuses, setMyStatuses] = useState<StatusUpdate[]>([]);
    const [otherStatuses, setOtherStatuses] = useState<StatusWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeStatusUser, setActiveStatusUser] = useState<{ user: User; statuses: StatusUpdate[] } | null>(null);

    useEffect(() => {
        fetchStatuses();
    }, [user?.id]);

    const fetchStatuses = async () => {
        if (!user) return;

        setIsLoading(true);

        // Fetch my statuses
        const { data: myData } = await supabase
            .from('status_updates')
            .select('*')
            .eq('user_id', user.id)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (myData) {
            setMyStatuses(myData);
        }

        // Fetch other users' statuses
        const { data: otherData } = await supabase
            .from('status_updates')
            .select('*, user:users(*)')
            .neq('user_id', user.id)
            .eq('privacy', 'everyone')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (otherData) {
            setOtherStatuses(otherData as StatusWithUser[]);
        }

        setIsLoading(false);
    };

    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    // Group statuses by user
    const groupedStatuses = otherStatuses.reduce((acc, status) => {
        const userId = status.user_id;
        if (!acc[userId]) {
            acc[userId] = {
                user: status.user,
                statuses: [],
            };
        }
        acc[userId].statuses.push(status);
        return acc;
    }, {} as Record<string, { user: User; statuses: StatusUpdate[] }>);

    return (
        <div className="page">
            {/* Header */}
            <header className="header">
                <h1 className="header-title">Status</h1>
            </header>

            {isLoading ? (
                <div className="loading-state">
                    <span className="spinner" />
                    <p>Loading statuses...</p>
                </div>
            ) : (
                <div className="status-list">
                    {/* My Status */}
                    <div className="status-section">
                        <div className="status-item">
                            <div
                                className="my-status-avatar"
                                onClick={(e) => {
                                    if (myStatuses.length > 0) {
                                        e.stopPropagation();
                                        setActiveStatusUser({ user: user!, statuses: myStatuses });
                                    }
                                }}
                            >
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} className="avatar avatar-lg" />
                                ) : (
                                    <div className="avatar avatar-lg">{getInitials(user?.username || 'M')}</div>
                                )}
                                <button className="add-status-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCreateModal(true);
                                }}>
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="status-item-content" onClick={() => setShowCreateModal(true)}>
                                <span className="status-item-name">My Status</span>
                                <span className="status-item-info">
                                    {myStatuses.length > 0
                                        ? `${myStatuses.length} status update${myStatuses.length > 1 ? 's' : ''}`
                                        : 'Tap to add status update'}
                                </span>
                            </div>

                            {myStatuses.length > 0 && (
                                <div className="status-views">
                                    <Eye size={16} />
                                    <span>
                                        {myStatuses.reduce((sum, s) => sum + (s.view_count || 0), 0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Other Statuses */}
                    {Object.keys(groupedStatuses).length > 0 && (
                        <>
                            <div className="status-section-header">Recent updates</div>
                            <div className="status-section">
                                {Object.values(groupedStatuses).map(({ user: statusUser, statuses }) => (
                                    <div
                                        key={statusUser.id}
                                        className="status-item"
                                        onClick={() => setActiveStatusUser({ user: statusUser, statuses })}
                                    >
                                        <div className="status-circle">
                                            <div className="status-circle-inner">
                                                {statusUser.avatar_url ? (
                                                    <img src={statusUser.avatar_url} alt={statusUser.username} />
                                                ) : (
                                                    <div className="avatar avatar-lg">
                                                        {getInitials(statusUser.username)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="status-item-content">
                                            <span className="status-item-name">{statusUser.username}</span>
                                            <span className="status-item-info">
                                                {formatDistanceToNow(new Date(statuses[0].created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <ChevronRight size={20} className="text-muted" />
                                    </div>
                                ))}
                            </div>
                        </>
                    )
                    }

                    {
                        Object.keys(groupedStatuses).length === 0 && myStatuses.length === 0 && (
                            <div className="empty-state">
                                <p>No status updates yet</p>
                                <p className="text-muted">Status updates disappear after 24 hours</p>
                            </div>
                        )
                    }
                </div>
            )}

            {/* Status Viewer Modal */}
            {
                activeStatusUser && (
                    <StatusViewerModal
                        user={activeStatusUser.user}
                        statuses={activeStatusUser.statuses}
                        onClose={() => setActiveStatusUser(null)}
                    />
                )
            }

            {/* Create Status Modal */}
            {
                showCreateModal && (
                    <CreateStatusModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => {
                            setShowCreateModal(false);
                            fetchStatuses();
                        }}
                    />
                )
            }

            <style>{`
        .status-list {
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

        .status-section {
          background: var(--bg-primary);
        }

        .status-section-header {
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: var(--text-muted);
          background: var(--bg-secondary);
          font-weight: 500;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background var(--transition);
        }

        .status-item:hover {
          background: var(--bg-secondary);
        }

        .my-status-avatar {
          position: relative;
        }

        .add-status-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 24px;
          height: 24px;
          border-radius: var(--radius-full);
          background: var(--primary-color);
          color: white;
          border: 2px solid var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .status-item-content {
          flex: 1;
          min-width: 0;
        }

        .status-item-name {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
        }

        .status-item-info {
          display: block;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .status-views {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
}

// Status Viewer Modal Component
function StatusViewerModal({
    user,
    statuses,
    onClose,
}: {
    user: User;
    statuses: StatusUpdate[];
    onClose: () => void;
}) {
    const { user: currentUser } = useAuthStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewers, setViewers] = useState<User[]>([]);
    const [showViewers, setShowViewers] = useState(false);
    const currentStatus = statuses[currentIndex];

    useEffect(() => {
        if (statuses.length > 0) {
            const timer = setTimeout(() => {
                if (currentIndex < statuses.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    onClose();
                }
            }, 5000); // 5 seconds per status

            return () => clearTimeout(timer);
        }
    }, [currentIndex, statuses, onClose]);

    // Handle view count update
    useEffect(() => {
        const markAsViewed = async () => {
            if (currentStatus && user.id !== currentUser?.id) {
                await supabase.rpc('increment_status_view', { status_id: currentStatus.id });
            }
        };
        markAsViewed();
    }, [currentStatus, user.id, currentUser?.id]);

    // Fetch viewers if it's our own status
    useEffect(() => {
        const fetchViewers = async () => {
            if (currentStatus && user.id === currentUser?.id) {
                const { data } = await supabase
                    .from('status_views')
                    .select('*, user:users(*)')
                    .eq('status_id', currentStatus.id)
                    .order('viewed_at', { ascending: false });

                if (data) {
                    const uniqueViewersMap = new Map();
                    data.forEach(v => {
                        const viewerData = v.user;
                        if (viewerData && !uniqueViewersMap.has(viewerData.id)) {
                            uniqueViewersMap.set(viewerData.id, {
                                ...viewerData,
                                viewed_at: v.viewed_at
                            });
                        }
                    });
                    setViewers(Array.from(uniqueViewersMap.values()));
                }
            }
        };
        fetchViewers();
    }, [currentStatus, user.id, currentUser?.id]);

    return (
        <div className="status-viewer-overlay" onClick={onClose}>
            <div className="status-viewer-content" onClick={(e) => e.stopPropagation()}>
                {/* Progress bar */}
                <div className="status-progress-container">
                    {statuses.map((_, i) => (
                        <div key={i} className="status-progress-bar">
                            <div
                                className="status-progress-fill"
                                style={{
                                    width: i < currentIndex ? '100%' : i === currentIndex ? '100%' : '0%',
                                    transition: i === currentIndex ? 'width 5s linear' : 'none'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="status-viewer-header">
                    <div className="flex items-center gap-2">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="avatar avatar-sm" />
                        ) : (
                            <div className="avatar avatar-sm">{user.username.slice(0, 2).toUpperCase()}</div>
                        )}
                        <div className="flex flex-col">
                            <span className="font-semibold text-white">{user.username}</span>
                            <span className="text-xs text-white/70">
                                {formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                    <button className="text-white" onClick={onClose}>
                        <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                </div>

                {/* Body */}
                <div
                    className="status-viewer-body"
                    style={{ backgroundColor: currentStatus.background_color || '#000' }}
                >
                    <p className="status-content text-white text-2xl text-center px-6">
                        {currentStatus.content}
                    </p>
                </div>

                {/* Footer / Viewers */}
                {user.id === currentUser?.id && (
                    <div className="status-viewer-footer">
                        <button className="viewers-toggle" onClick={() => setShowViewers(!showViewers)}>
                            <Eye size={20} />
                            <span>{viewers.length} views</span>
                        </button>

                        {showViewers && (
                            <div className="viewers-list-overlay fade-in">
                                <div className="viewers-list-header">
                                    <span>Viewed by</span>
                                    <button onClick={() => setShowViewers(false)}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="viewers-list-content">
                                    {viewers.length > 0 ? (
                                        viewers.map((viewer: any) => (
                                            <div key={viewer.id} className="viewer-item">
                                                {viewer.avatar_url ? (
                                                    <img src={viewer.avatar_url} alt={viewer.username} className="avatar avatar-sm" />
                                                ) : (
                                                    <div className="avatar avatar-sm">{viewer.username.slice(0, 2).toUpperCase()}</div>
                                                )}
                                                <div className="flex flex-col flex-1">
                                                    <span className="font-medium">{viewer.username}</span>
                                                    <span className="text-xs text-muted">
                                                        {new Date(viewer.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted p-4">No views yet</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation helpers */}
                <div className="status-nav-left" onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)} />
                <div className="status-nav-right" onClick={() => currentIndex < statuses.length - 1 ? setCurrentIndex(prev => prev + 1) : onClose()} />
            </div>

            <style>{`
                .status-viewer-overlay {
                    position: fixed;
                    inset: 0;
                    background: black;
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .status-viewer-content {
                    width: 100%;
                    height: 100%;
                    max-width: 500px;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }
                .status-progress-container {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    right: 1rem;
                    display: flex;
                    gap: 4px;
                    z-index: 10;
                }
                .status-progress-bar {
                    flex: 1;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .status-progress-fill {
                    height: 100%;
                    background: white;
                }
                .status-viewer-header {
                    position: absolute;
                    top: 2rem;
                    left: 1rem;
                    right: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 10;
                }
                .status-viewer-body {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .status-nav-left, .status-nav-right {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 30%;
                    z-index: 5;
                }
                .status-nav-left { left: 0; }
                .status-nav-right { right: 0; }

                .status-viewer-footer {
                    position: absolute;
                    bottom: 2rem;
                    left: 0;
                    right: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 10;
                }
                .viewers-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(0, 0, 0, 0.5);
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-full);
                    color: white;
                    border: none;
                    cursor: pointer;
                    backdrop-filter: blur(4px);
                }
                .viewers-list-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--bg-primary);
                    border-top-left-radius: var(--radius-xl);
                    border-top-right-radius: var(--radius-xl);
                    max-height: 50vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
                    z-index: 20;
                }
                .viewers-list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    font-weight: 600;
                }
                .viewers-list-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.5rem;
                }
                .viewer-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                }
            `}</style>
        </div>
    );
}

// Create Status Modal Component
function CreateStatusModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#6366f1');
    const [isCreating, setIsCreating] = useState(false);

    const colors = [
        '#6366f1',
        '#8b5cf6',
        '#ec4899',
        '#ef4444',
        '#f59e0b',
        '#22c55e',
        '#14b8a6',
        '#3b82f6',
        '#1e293b',
    ];

    const handleCreate = async () => {
        if (!content.trim() || !user) return;

        setIsCreating(true);

        const { error } = await supabase.from('status_updates').insert({
            user_id: user.id,
            content: content.trim(),
            media_type: 'text',
            background_color: backgroundColor,
        });

        if (!error) {
            onCreated();
        }

        setIsCreating(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Create Status</h3>

                <div
                    className="status-preview"
                    style={{ backgroundColor }}
                >
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        maxLength={500}
                        autoFocus
                    />
                </div>

                <div className="color-picker">
                    {colors.map((color) => (
                        <button
                            key={color}
                            className={`color-option ${backgroundColor === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setBackgroundColor(color)}
                        />
                    ))}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleCreate}
                        disabled={!content.trim() || isCreating}
                    >
                        {isCreating ? <span className="spinner" /> : 'Post Status'}
                    </button>
                </div>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1000;
        }

        .modal-content {
          width: 100%;
          max-width: 400px;
          background: var(--bg-primary);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
        }

        .modal-content h3 {
          margin-bottom: 1rem;
        }

        .status-preview {
          width: 100%;
          aspect-ratio: 9/16;
          max-height: 300px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .status-preview textarea {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          color: white;
          font-size: 1.25rem;
          text-align: center;
          resize: none;
        }

        .status-preview textarea::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .status-preview textarea:focus {
          outline: none;
        }

        .color-picker {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .color-option {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform var(--transition);
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.active {
          border-color: white;
          box-shadow: 0 0 0 2px var(--primary-color);
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
        }

        .modal-actions .btn {
          flex: 1;
        }
      `}</style>
        </div>
    );
}
