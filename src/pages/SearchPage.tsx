import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

export function SearchPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { createConversation } = useChatStore();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [recentSearches, setRecentSearches] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingConversation, setIsCreatingConversation] = useState(false);
    const [acceptedFriendIds, setAcceptedFriendIds] = useState<Set<string>>(new Set());

    // Load recent searches and accepted friends
    useEffect(() => {
        const saved = localStorage.getItem('kutx-recent-searches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }

        const fetchAcceptedFriends = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('conversations')
                .select('participants(user_id)')
                .eq('status', 'accepted')
                .eq('type', 'direct');

            if (data) {
                const ids = new Set<string>();
                data.forEach((conv: any) => {
                    conv.participants.forEach((p: any) => {
                        if (p.user_id !== user.id) ids.add(p.user_id);
                    });
                });
                setAcceptedFriendIds(ids);
            }
        };

        fetchAcceptedFriends();
    }, [user?.id]);

    // Search users
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchUsers = async () => {
            setIsLoading(true);

            const { data } = await supabase
                .from('users')
                .select('*')
                .ilike('username', `%${query}%`)
                .neq('id', user?.id)
                .limit(20);

            if (data) {
                setResults(data);
            }

            setIsLoading(false);
        };

        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [query, user?.id]);

    const handleUserClick = async (selectedUser: User) => {
        console.log('User item clicked:', selectedUser);
        if (!user) {
            console.error('No authenticated user found in search page');
            return;
        }

        try {
            if (isCreatingConversation) return;
            setIsCreatingConversation(true);

            console.log('Creating/getting conversation with:', selectedUser.id);
            // Add to recent searches
            const updatedRecent = [
                selectedUser,
                ...recentSearches.filter((u) => u.id !== selectedUser.id),
            ].slice(0, 10);
            setRecentSearches(updatedRecent);
            localStorage.setItem('kutx-recent-searches', JSON.stringify(updatedRecent));

            // Create or get conversation
            const isFriend = acceptedFriendIds.has(selectedUser.id);
            const conversation = await createConversation(user.id, selectedUser.id);

            if (conversation) {
                if (isFriend) {
                    navigate(`/chat/${conversation.id}`);
                } else {
                    alert(`Chat request sent to ${selectedUser.username}`);
                    // Refresh friend list to update the UI button
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error('Error in handleUserClick:', error);
        } finally {
            setIsCreatingConversation(false);
        }
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('kutx-recent-searches');
    };

    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    const displayUsers = query.trim() ? results : recentSearches;

    return (
        <div className="page">
            {/* Header */}
            <header className="search-header">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>

                <div className="search-input-container">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by username..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {query && (
                        <button className="btn btn-ghost btn-icon" onClick={() => setQuery('')}>
                            <X size={20} />
                        </button>
                    )}
                </div>
            </header>

            {/* Results */}
            <div className="search-results">
                {!query.trim() && recentSearches.length > 0 && (
                    <div className="search-section-header">
                        <span>Recent searches</span>
                        <button onClick={clearRecentSearches}>Clear all</button>
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-state">
                        <span className="spinner" />
                        <p>Searching...</p>
                    </div>
                ) : displayUsers.length === 0 ? (
                    <div className="empty-state">
                        <Search size={48} />
                        <p>{query ? 'No users found' : 'Search for users by username'}</p>
                    </div>
                ) : (
                    displayUsers.map((searchUser) => (
                        <div
                            key={searchUser.id}
                            className={`user-item ${isCreatingConversation ? 'pointer-events-none opacity-70' : ''}`}
                            onClick={() => handleUserClick(searchUser)}
                        >
                            {searchUser.avatar_url ? (
                                <img
                                    src={searchUser.avatar_url}
                                    alt={searchUser.username}
                                    className="avatar"
                                />
                            ) : (
                                <div className="avatar">{getInitials(searchUser.username)}</div>
                            )}

                            <div className="user-item-content">
                                <span className="user-item-name">{searchUser.username}</span>
                                {searchUser.bio && (
                                    <span className="user-item-bio">{searchUser.bio}</span>
                                )}
                            </div>

                            <div className="user-item-action">
                                {acceptedFriendIds.has(searchUser.id) ? (
                                    <button className="btn btn-ghost btn-sm text-primary">Chat</button>
                                ) : (
                                    <button className="btn btn-primary btn-sm">Invite</button>
                                )}
                            </div>

                            {searchUser.is_online && (
                                <span className="online-badge">Online</span>
                            )}
                        </div>
                    ))
                )}
            </div>

            <style>{`
        .search-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          padding-top: calc(0.75rem + var(--safe-area-top));
        }

        .search-input-container {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-full);
          padding: 0 1rem;
        }

        .search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.75rem 0.75rem;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .search-input:focus {
          outline: none;
        }

        .search-results {
          flex: 1;
          overflow-y: auto;
        }

        .search-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
        }

        .search-section-header button {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          font-size: 0.875rem;
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

        .user-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background var(--transition);
        }

        .user-item:hover {
          background: var(--bg-secondary);
        }

        .user-item-content {
          flex: 1;
          min-width: 0;
        }

        .user-item-name {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-item-bio {
          display: block;
          font-size: 0.875rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .online-badge {
          font-size: 0.75rem;
          color: var(--success);
          background: rgb(34 197 94 / 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
        }
      `}</style>
        </div>
    );
}
