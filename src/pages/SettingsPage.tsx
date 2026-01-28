import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    Palette,
    Bell,
    Shield,
    Database,
    HelpCircle,
    LogOut,
    ChevronRight,
    Camera,
    Moon,
    Sun,
    Monitor,
} from 'lucide-react';
import { useAuthStore, useThemeStore } from '../stores/authStore';
import { supabase, uploadFile } from '../lib/supabase';

type SettingsSection = 'main' | 'profile' | 'theme' | 'privacy' | 'notifications';

function ProfileSection({ onBack }: { onBack: () => void }) {
    const { user, updateProfile } = useAuthStore();
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const path = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
        const url = await uploadFile('avatars', path, file);

        if (url) {
            await updateProfile({ avatar_url: url });
        }
    };

    const handleSave = async () => {
        setIsUpdating(true);
        await updateProfile({ username, bio });
        setIsUpdating(false);
        onBack();
    };

    return (
        <div className="settings-section fade-in">
            {/* Avatar */}
            <div className="avatar-edit">
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="avatar avatar-xl" />
                ) : (
                    <div className="avatar avatar-xl">{user?.username?.slice(0, 2).toUpperCase()}</div>
                )}
                <label className="avatar-edit-btn">
                    <Camera size={20} />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                </label>
            </div>

            {/* Form */}
            <div className="settings-form">
                <div className="input-group">
                    <label>Username</label>
                    <input
                        type="text"
                        className="input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        maxLength={20}
                    />
                </div>

                <div className="input-group">
                    <label>Bio</label>
                    <textarea
                        className="input"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={150}
                        rows={3}
                        placeholder="Tell something about yourself..."
                    />
                </div>

                <button
                    className="btn btn-primary w-full"
                    onClick={handleSave}
                    disabled={isUpdating}
                >
                    {isUpdating ? <span className="spinner" /> : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}

export function SettingsPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuthStore();
    const { theme, setTheme } = useThemeStore();
    const [section, setSection] = useState<SettingsSection>('main');

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const renderMainSection = () => (
        <div className="settings-list fade-in">
            {/* Profile Preview */}
            <div className="profile-preview" onClick={() => setSection('profile')}>
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="avatar avatar-lg" />
                ) : (
                    <div className="avatar avatar-lg">{user?.username?.slice(0, 2).toUpperCase()}</div>
                )}
                <div className="profile-preview-info">
                    <span className="profile-preview-name">{user?.username}</span>
                    <span className="profile-preview-email">{user?.email}</span>
                </div>
                <ChevronRight size={20} className="text-muted" />
            </div>

            {/* Settings Items */}
            <div className="settings-group">
                <div className="settings-item" onClick={() => setSection('theme')}>
                    <Palette size={22} className="settings-icon" />
                    <span>Appearance</span>
                    <ChevronRight size={20} className="text-muted" />
                </div>

                <div className="settings-item" onClick={() => setSection('notifications')}>
                    <Bell size={22} className="settings-icon" />
                    <span>Notifications</span>
                    <ChevronRight size={20} className="text-muted" />
                </div>

                <div className="settings-item" onClick={() => setSection('privacy')}>
                    <Shield size={22} className="settings-icon" />
                    <span>Privacy</span>
                    <ChevronRight size={20} className="text-muted" />
                </div>

                <div className="settings-item" onClick={() => navigate('/settings/storage')}>
                    <Database size={22} className="settings-icon" />
                    <span>Storage</span>
                    <ChevronRight size={20} className="text-muted" />
                </div>

                <div className="settings-item" onClick={() => navigate('/settings/help')}>
                    <HelpCircle size={22} className="settings-icon" />
                    <span>Help & Support</span>
                    <ChevronRight size={20} className="text-muted" />
                </div>
            </div>

            {/* Logout */}
            <div className="settings-group">
                <div className="settings-item danger" onClick={handleSignOut}>
                    <LogOut size={22} className="settings-icon" />
                    <span>Log Out</span>
                </div>
            </div>

            {/* App Info */}
            <div className="app-info">
                <p>Kutx Chat v1.0.0</p>
                <p>Made with ❤️</p>
            </div>
        </div>
    );


    const renderThemeSection = () => (
        <div className="settings-section fade-in">
            <h3>Theme Mode</h3>
            <div className="theme-options">
                <button
                    className={`theme-option ${theme.mode === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme({ mode: 'light' })}
                >
                    <Sun size={24} />
                    <span>Light</span>
                </button>

                <button
                    className={`theme-option ${theme.mode === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme({ mode: 'dark' })}
                >
                    <Moon size={24} />
                    <span>Dark</span>
                </button>

                <button
                    className={`theme-option ${theme.mode === 'auto' ? 'active' : ''}`}
                    onClick={() => setTheme({ mode: 'auto' })}
                >
                    <Monitor size={24} />
                    <span>Auto</span>
                </button>
            </div>

            <h3>Primary Color</h3>
            <div className="color-options">
                {['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6'].map(
                    (color) => (
                        <button
                            key={color}
                            className={`color-option ${theme.primary_color === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setTheme({ primary_color: color })}
                        />
                    )
                )}
            </div>
        </div>
    );

    const renderPrivacySection = () => (
        <div className="settings-section fade-in">
            <div className="settings-group">
                <div className="settings-toggle-item">
                    <div>
                        <span>Show online status</span>
                        <p className="text-muted">Let others see when you're online</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                </div>

                <div className="settings-toggle-item">
                    <div>
                        <span>Read receipts</span>
                        <p className="text-muted">Let others know when you've read their messages</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                </div>

                <div className="settings-toggle-item">
                    <div>
                        <span>Last seen</span>
                        <p className="text-muted">Show when you were last active</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                </div>
            </div>

            <div className="settings-item">
                <Shield size={22} className="settings-icon" />
                <span>Blocked Users</span>
                <ChevronRight size={20} className="text-muted" />
            </div>
        </div>
    );

    const renderNotificationsSection = () => (
        <div className="settings-section fade-in">
            <div className="settings-group">
                <div className="settings-toggle-item">
                    <div>
                        <span>Message notifications</span>
                        <p className="text-muted">Get notified for new messages</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                </div>

                <div className="settings-toggle-item">
                    <div>
                        <span>Status notifications</span>
                        <p className="text-muted">Get notified for new status updates</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                </div>

                <div className="settings-toggle-item">
                    <div>
                        <span>Sound</span>
                        <p className="text-muted">Play sound for notifications</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                </div>

                <div className="settings-toggle-item">
                    <div>
                        <span>Vibration</span>
                        <p className="text-muted">Vibrate for notifications</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                </div>
            </div>
        </div>
    );

    const getSectionTitle = () => {
        switch (section) {
            case 'profile':
                return 'Edit Profile';
            case 'theme':
                return 'Appearance';
            case 'privacy':
                return 'Privacy';
            case 'notifications':
                return 'Notifications';
            default:
                return 'Settings';
        }
    };

    return (
        <div className="page settings-page">
            {/* Header */}
            <header className="header">
                <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => (section === 'main' ? navigate(-1) : setSection('main'))}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="header-title">{getSectionTitle()}</h1>
            </header>

            {/* Content */}
            {section === 'main' && renderMainSection()}
            {section === 'profile' && <ProfileSection onBack={() => setSection('main')} />}
            {section === 'theme' && renderThemeSection()}
            {section === 'privacy' && renderPrivacySection()}
            {section === 'notifications' && renderNotificationsSection()}

            <style>{`
        .settings-page {
          padding-bottom: 0;
        }

        .settings-list {
          flex: 1;
          overflow-y: auto;
        }

        .profile-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 1rem;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
        }

        .profile-preview-info {
          flex: 1;
        }

        .profile-preview-name {
          display: block;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .profile-preview-email {
          display: block;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .settings-group {
          background: var(--bg-primary);
          margin-top: 1rem;
        }

        .settings-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          user-select: none;
          transition: background var(--transition);
        }

        .settings-item:hover {
          background: var(--bg-secondary);
        }

        .settings-item.danger {
          color: var(--error);
        }

        .settings-icon {
          color: var(--primary-color);
        }

        .settings-item.danger .settings-icon {
          color: var(--error);
        }

        .settings-item span {
          flex: 1;
          font-weight: 500;
        }

        .app-info {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .settings-section {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .avatar-edit {
          position: relative;
          width: fit-content;
          margin: 0 auto 2rem;
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 3px solid var(--bg-primary);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .settings-section h3 {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          margin-top: 1.5rem;
        }

        .settings-section h3:first-child {
          margin-top: 0;
        }

        .theme-options {
          display: flex;
          gap: 0.75rem;
        }

        .theme-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition);
        }

        .theme-option.active {
          border-color: var(--primary-color);
          background: rgb(99 102 241 / 0.1);
        }

        .color-options {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .color-option {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          border: 3px solid transparent;
          cursor: pointer;
          transition: transform var(--transition);
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.active {
          border-color: var(--text-primary);
        }

        .settings-toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .settings-toggle-item span {
          font-weight: 500;
        }

        .settings-toggle-item p {
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .settings-toggle-item input[type="checkbox"] {
          width: 20px;
          height: 20px;
        }
      `}</style>
        </div>
    );
}
