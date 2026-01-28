import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function StoragePage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [sentMedia, setSentMedia] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSentMedia = async () => {
            if (!user) return;
            setIsLoading(true);

            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('sender_id', user.id)
                .not('media_url', 'is', null)
                .order('created_at', { ascending: false });

            if (data) {
                setSentMedia(data);
            }
            setIsLoading(false);
        };

        fetchSentMedia();
    }, [user?.id]);

    return (
        <div className="page">
            <header className="header">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="header-title">Storage</h1>
            </header>

            <div className="content p-4">
                <div className="storage-overview card mb-6 p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Sent Media</span>
                        <span className="text-muted">{sentMedia.length} items</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <span className="spinner" />
                    </div>
                ) : (
                    <div className="media-gallery">
                        {sentMedia.length > 0 ? (
                            sentMedia.map((item) => (
                                <div key={item.id} className="gallery-item">
                                    {item.media_type === 'video' ? (
                                        <div className="gallery-video">
                                            <video src={item.media_url} />
                                            <div className="video-icon"><Film size={16} /></div>
                                        </div>
                                    ) : (
                                        <img src={item.media_url} alt="" loading="lazy" onClick={() => window.open(item.media_url, '_blank')} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-12 text-muted bg-primary rounded-xl border border-dashed border-color">
                                <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No sent media found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .media-gallery {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.5rem;
                }
                .gallery-item {
                    aspect-ratio: 1;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    background: var(--bg-secondary);
                    position: relative;
                }
                .gallery-item img, .gallery-item video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .gallery-item img:hover {
                    transform: scale(1.05);
                }
                .gallery-video {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .video-icon {
                    position: absolute;
                    top: 0.25rem;
                    right: 0.25rem;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    padding: 0.25rem;
                    border-radius: var(--radius-sm);
                    display: flex;
                    pointer-events: none;
                }
                .card {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                }
            `}</style>
        </div>
    );
}
