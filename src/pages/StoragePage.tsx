import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Trash2, HardDrive } from 'lucide-react';

export function StoragePage() {
    const navigate = useNavigate();

    const storageItems = [
        { id: 'media', label: 'Media', size: '1.2 GB', icon: <HardDrive size={20} /> },
        { id: 'files', label: 'Documents', size: '450 MB', icon: <HardDrive size={20} /> },
        { id: 'cache', label: 'Cache', size: '120 MB', icon: <Database size={20} /> },
    ];

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
                        <span className="font-semibold">Used Storage</span>
                        <span className="text-muted">1.77 GB / 5 GB</span>
                    </div>
                    <div className="progress-bar w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="progress-fill h-full bg-primary" style={{ width: '35.4%' }} />
                    </div>
                </div>

                <div className="settings-group">
                    {storageItems.map((item) => (
                        <div key={item.id} className="settings-item">
                            <div className="settings-icon">{item.icon}</div>
                            <div className="flex-1">
                                <span className="block font-medium">{item.label}</span>
                                <span className="text-sm text-muted">{item.size}</span>
                            </div>
                            <button className="btn btn-ghost text-error">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <button className="btn btn-primary w-full">
                        Clear All Data
                    </button>
                    <p className="text-center text-xs text-muted mt-4">
                        Clearing data will remove local copies of media and files.
                    </p>
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
                }
                .settings-item:last-child {
                    border-bottom: none;
                }
                .settings-icon {
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                }
            `}</style>
        </div>
    );
}
