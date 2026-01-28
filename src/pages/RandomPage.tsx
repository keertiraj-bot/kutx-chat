import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, X, UserPlus, SkipForward, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

type MatchingState = 'idle' | 'searching' | 'matched' | 'chatting';

console.log('RandomPage loading...');

export function RandomPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { createConversation } = useChatStore();

    const [state, setState] = useState<MatchingState>('idle');
    const [matchedUser, setMatchedUser] = useState<User | null>(null);
    const [interests, setInterests] = useState<string[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);

    const availableInterests = [
        'Gaming',
        'Music',
        'Tech',
        'Sports',
        'Movies',
        'Anime',
        'Travel',
        'Food',
        'Art',
        'Books',
    ];

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (user) {
                leaveQueue();
            }
        };
    }, [user]);

    const joinQueue = async () => {
        if (!user) return;

        setState('searching');

        // Add to queue
        await supabase.from('random_chat_queue').upsert({
            user_id: user.id,
            interests,
            is_anonymous: isAnonymous,
        });

        // Subscribe to queue changes
        const channel = supabase
            .channel('random-matching')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'random_chat_queue',
                },
                async () => {
                    // Check for potential match
                    await findMatch();
                }
            )
            .subscribe();

        // Initial match attempt
        await findMatch();

        // Cleanup subscription after 5 minutes
        setTimeout(() => {
            if (state === 'searching') {
                supabase.removeChannel(channel);
                leaveQueue();
                setState('idle');
            }
        }, 300000);
    };

    const findMatch = async () => {
        if (!user) return;

        // Find another user in queue (not self)
        let query = supabase
            .from('random_chat_queue')
            .select('*, user:users(*)')
            .neq('user_id', user.id);

        // Match by interests if any
        if (interests.length > 0) {
            query = query.overlaps('interests', interests);
        }

        const { data } = await query.order('joined_queue_at', { ascending: true }).limit(1);

        if (data && data.length > 0) {
            const match = data[0];

            // Remove both from queue
            await supabase.from('random_chat_queue').delete().eq('user_id', user.id);
            await supabase.from('random_chat_queue').delete().eq('user_id', match.user_id);

            // Create conversation
            const conversation = await createConversation(user.id, match.user_id, 'random');

            if (conversation) {
                setMatchedUser(match.user as User);
                setConversationId(conversation.id);
                setState('matched');
            }
        }
    };

    const leaveQueue = async () => {
        if (!user) return;
        await supabase.from('random_chat_queue').delete().eq('user_id', user.id);
    };

    const handleSkip = async () => {
        setMatchedUser(null);
        setConversationId(null);
        setState('searching');
        await joinQueue();
    };

    const handleAddContact = async () => {
        if (!user || !matchedUser) return;

        await supabase.from('user_contacts').insert({
            user_id: user.id,
            contact_id: matchedUser.id,
        });
    };

    const handleStartChat = () => {
        if (conversationId) {
            navigate(`/chat/${conversationId}`);
        }
    };

    const handleCancel = () => {
        leaveQueue();
        setMatchedUser(null);
        setConversationId(null);
        setState('idle');
    };

    const toggleInterest = (interest: string) => {
        setInterests((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        );
    };

    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="page random-page">
            {/* Header */}
            <header className="header">
                <h1 className="header-title">Random Chat</h1>
            </header>

            <div className="random-content">
                {state === 'idle' && (
                    <div className="random-idle fade-in">
                        <div className="random-icon">
                            <Shuffle size={48} />
                        </div>
                        <h2>Meet New People</h2>
                        <p>Get matched with random users for interesting conversations</p>

                        {/* Interests */}
                        <div className="interests-section">
                            <h4>Select your interests (optional)</h4>
                            <div className="interests-list">
                                {availableInterests.map((interest) => (
                                    <button
                                        key={interest}
                                        className={`interest-tag ${interests.includes(interest) ? 'active' : ''}`}
                                        onClick={() => toggleInterest(interest)}
                                    >
                                        {interest}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Anonymous toggle */}
                        <label className="anonymous-toggle">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                            />
                            <span>Chat anonymously</span>
                        </label>

                        <button className="btn btn-primary btn-lg" onClick={joinQueue}>
                            <Shuffle size={20} />
                            Start Matching
                        </button>
                    </div>
                )}

                {state === 'searching' && (
                    <div className="random-searching fade-in">
                        <div className="searching-animation">
                            <div className="pulse-ring" />
                            <div className="pulse-ring" style={{ animationDelay: '0.5s' }} />
                            <div className="pulse-ring" style={{ animationDelay: '1s' }} />
                            <Shuffle size={40} />
                        </div>
                        <h2>Looking for someone...</h2>
                        <p>Matching you with the perfect person</p>

                        <button className="btn btn-secondary" onClick={handleCancel}>
                            <X size={20} />
                            Cancel
                        </button>
                    </div>
                )}

                {state === 'matched' && matchedUser && (
                    <div className="random-matched fade-in">
                        <div className="match-success">
                            <span>🎉</span>
                            <h2>Match Found!</h2>
                        </div>

                        <div className="matched-user">
                            {!isAnonymous && matchedUser.avatar_url ? (
                                <img
                                    src={matchedUser.avatar_url}
                                    alt={matchedUser.username}
                                    className="avatar avatar-xl"
                                />
                            ) : (
                                <div className="avatar avatar-xl">
                                    {isAnonymous ? '?' : getInitials(matchedUser.username)}
                                </div>
                            )}
                            <h3>{isAnonymous ? 'Anonymous User' : matchedUser.username}</h3>
                            {matchedUser.bio && !isAnonymous && (
                                <p className="matched-bio">{matchedUser.bio}</p>
                            )}
                        </div>

                        <div className="match-actions">
                            <button className="btn btn-secondary" onClick={handleSkip}>
                                <SkipForward size={20} />
                                Skip
                            </button>

                            {!isAnonymous && (
                                <button className="btn btn-secondary" onClick={handleAddContact}>
                                    <UserPlus size={20} />
                                    Add
                                </button>
                            )}

                            <button className="btn btn-primary" onClick={handleStartChat}>
                                <MessageCircle size={20} />
                                Chat
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .random-page {
          background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
        }

        .random-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
        }

        .random-icon {
          width: 100px;
          height: 100px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 1.5rem;
        }

        .random-idle h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .random-idle > p {
          color: var(--text-muted);
          margin-bottom: 2rem;
        }

        .interests-section {
          width: 100%;
          margin-bottom: 1.5rem;
        }

        .interests-section h4 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .interests-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }

        .interest-tag {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition);
        }

        .interest-tag.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .anonymous-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          cursor: pointer;
        }

        .anonymous-toggle input {
          width: 18px;
          height: 18px;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1rem;
        }

        .random-searching {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .searching-animation {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          color: var(--primary-color);
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: var(--radius-full);
          border: 2px solid var(--primary-color);
          animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .random-searching h2 {
          margin-bottom: 0.5rem;
        }

        .random-searching p {
          color: var(--text-muted);
          margin-bottom: 2rem;
        }

        .random-matched {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .match-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .match-success span {
          font-size: 2rem;
        }

        .matched-user {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .matched-user .avatar {
          margin-bottom: 1rem;
        }

        .matched-user h3 {
          font-size: 1.25rem;
        }

        .matched-bio {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .match-actions {
          display: flex;
          gap: 0.75rem;
        }
      `}</style>
        </div>
    );
}
