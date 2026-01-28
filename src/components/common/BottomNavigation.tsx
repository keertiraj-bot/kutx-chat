import { NavLink, useLocation } from 'react-router-dom';
import { MessageCircle, Search, CircleDot, Shuffle, Settings } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';

export function BottomNavigation() {
    const location = useLocation();
    const { conversations } = useChatStore();

    // Calculate total unread count
    const totalUnread = conversations.reduce(
        (sum, c) => sum + ((c as any).unread_count || 0),
        0
    );

    // Don't show on chat page
    if (location.pathname.startsWith('/chat/')) {
        return null;
    }

    const navItems = [
        { path: '/', icon: MessageCircle, label: 'Chats', badge: totalUnread },
        { path: '/search', icon: Search, label: 'Search' },
        { path: '/status', icon: CircleDot, label: 'Status' },
        { path: '/random', icon: Shuffle, label: 'Random' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map(({ path, icon: Icon, label, badge }) => (
                <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <Icon size={24} />
                    <span>{label}</span>
                    {badge && badge > 0 && (
                        <span className="badge">{badge > 99 ? '99+' : badge}</span>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}
