import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Mail, Globe, ExternalLink } from 'lucide-react';

export function HelpSupportPage() {
    const navigate = useNavigate();

    const faqs = [
        { q: 'How do I change my theme?', a: 'Go to Settings > Appearance to switch between light, dark, and auto modes.' },
        { q: 'Is my data secure?', a: 'Yes, your messages and status updates are protected by Supabase security policies.' },
        { q: 'How long do statuses last?', a: 'Statuses automatically disappear after 24 hours.' },
    ];

    return (
        <div className="page">
            <header className="header">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="header-title">Help & Support</h1>
            </header>

            <div className="content p-4">
                <section className="mb-8">
                    <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="card p-4">
                                <h3 className="font-semibold mb-1">{faq.q}</h3>
                                <p className="text-sm text-muted">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold mb-4">Contact Us</h2>
                    <div className="settings-group">
                        <div className="settings-item">
                            <Mail className="text-primary" size={20} />
                            <div className="flex-1">
                                <span className="block font-medium">Email Support</span>
                                <span className="text-sm text-muted">support@kutxchat.com</span>
                            </div>
                            <ExternalLink size={16} />
                        </div>
                        <div className="settings-item">
                            <MessageCircle className="text-primary" size={20} />
                            <div className="flex-1">
                                <span className="block font-medium">Live Chat</span>
                                <span className="text-sm text-muted">Available 24/7</span>
                            </div>
                            <ExternalLink size={16} />
                        </div>
                        <div className="settings-item">
                            <Globe className="text-primary" size={20} />
                            <div className="flex-1">
                                <span className="block font-medium">Website</span>
                                <span className="text-sm text-muted">www.kutxchat.com</span>
                            </div>
                            <ExternalLink size={16} />
                        </div>
                    </div>
                </section>

                <div className="text-center text-sm text-muted mt-8">
                    <p>Kutx Chat Version 1.0.0</p>
                    <p>© 2026 Kutx Chat. All rights reserved.</p>
                </div>
            </div>

            <style>{`
                .card {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                }
                .settings-group {
                    background: var(--bg-primary);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-color);
                    overflow: hidden;
                }
                .settings-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    cursor: pointer;
                }
                .settings-item:last-child {
                    border-bottom: none;
                }
            `}</style>
        </div>
    );
}
