================================================================================
PRODUCT REQUIREMENTS DOCUMENT (PRD)
Chat Application with Random Matching & Status Features
================================================================================

Document Information:
---------------------
Version: 1.0
Last Updated: January 27, 2026
Author: Product Team
Status: Draft


================================================================================
1. OVERVIEW
================================================================================

This document outlines the requirements for a cross-platform chat application 
similar to Telegram/WhatsApp, with unique features including random chat 
matching (Omegle-style), user status updates, customizable themes, and 
username-based search. The application will be built as a Progressive Web App 
(PWA) that can be converted to a native Android application.


================================================================================
2. PRODUCT GOALS
================================================================================

• Provide a seamless chat experience across web and mobile platforms
• Enable users to connect with random strangers for casual conversations
• Offer personalization through themes and status updates
• Ensure responsive design for both mobile and desktop experiences
• Maintain proper Android system UI visibility (status bar and navigation buttons)


================================================================================
3. TECHNICAL STACK 
================================================================================

Layer                   | Technology              | Purpose
------------------------|-------------------------|----------------------------------
Frontend Framework      | React 18+               | UI component library
Build Tool              | Vite                    | Fast dev server & optimized builds
Mobile Wrapper          | Capacitor               | Convert web app to native Android
Backend                 | Supabase (mcp already conected, project name kutx chat )               | Database, auth, storage, realtime
Deployment (Web)        | Vercel                  | Web hosting & CI/CD
Deployment (Android)    | Google Play Store       | Native Android distribution


================================================================================
4. CORE FEATURES
================================================================================

4.1 HOME
--------
Description: The main chat interface displaying all active conversations.

Features:
• List of all chat conversations with contact name, last message preview, and timestamp
• Unread message indicators (badge count)
• Real-time message updates using Supabase Realtime
• Pull-to-refresh functionality
• Swipe actions for archive/delete conversations
• Floating action button (FAB) to start new chat or random matching

User Stories:
• As a user, I want to see all my active chats at a glance so I can quickly 
  resume conversations
• As a user, I want to know when I have unread messages so I don't miss 
  important communications


4.2 SEARCH
----------
Description: Username-based search functionality to find and connect with other users.

Features:
• Search bar with real-time filtering
• Search by username (case-insensitive)
• Display user profile picture, username, and status in search results
• Tap to view user profile or start chat
• Recent searches history (local storage)
• Option to clear search history

User Stories:
• As a user, I want to search for people by username so I can connect with 
  specific individuals
• As a user, I want to see my recent searches so I can quickly find people 
  I've looked for before


4.3 STATUS
----------
Description: WhatsApp-style status feature allowing users to share temporary 
updates with text, images, or videos.

Features:
• View status updates from contacts
• Create status updates (text, image, or video)
• Status expires after 24 hours
• Text status with customizable background colors
• Image status with text overlay option
• Privacy settings: Who can view my status (Everyone, Contacts Only, Custom)
• View count and viewer list
• Reply to status (converts to direct message)
• Mute specific users' status updates

User Stories:
• As a user, I want to share temporary updates with my contacts so I can 
  express myself without permanent posting
• As a user, I want to control who sees my status so I can maintain my privacy


4.4 RANDOM CHAT (OMEGLE-STYLE)
------------------------------
Description: Connect with random users for anonymous conversations.

Features:
• One-tap random matching with online users
• Anonymous chat option (hide username/profile picture)
• Interest-based matching (optional tags like 'gaming', 'music', 'tech')
• Skip button to match with a different person
• End chat button with option to save conversation
• Report and block functionality
• Add to contacts option at end of chat
• Typing indicators
• Connection status indicator

User Stories:
• As a user, I want to chat with random strangers so I can meet new people 
  and have interesting conversations
• As a user, I want to skip to the next person if the conversation isn't engaging


4.5 SETTINGS
------------
Description: User preferences and account management.

Features:

Account Settings:
  • Edit profile (username, bio, profile picture)
  • Change phone number/email
  • Privacy settings (Last seen, Profile photo, Status, Read receipts)
  • Blocked users list

Theme Customization:
  • Light mode
  • Dark mode
  • Auto (system default)
  • Custom color schemes (primary color, accent color)
  • Chat bubble customization (colors, shape)
  • Background wallpaper selection

Notification Settings:
  • Message notifications (on/off)
  • Status update notifications
  • Sound and vibration settings
  • Custom notification sounds

Chat Settings:
  • Enter key to send message (on/off)
  • Font size adjustment
  • Auto-download media (Wi-Fi only, Always, Never)

Data and Storage:
  • Storage usage (view by chat)
  • Clear cache
  • Export chat history

About:
  • App version
  • Terms of service
  • Privacy policy
  • Help and support
  • Logout

User Stories:
• As a user, I want to customize the app's appearance so it matches my 
  personal preferences
• As a user, I want to control my privacy settings so I can decide what 
  information is visible to others


================================================================================
5. DESIGN REQUIREMENTS
================================================================================

5.1 RESPONSIVE DESIGN
---------------------
• Mobile-first approach: Optimized for screens from 320px to 768px width
• Desktop responsive: Tablet (768px-1024px) and desktop (1024px+) layouts
• Touch-optimized: Minimum tap target size of 44x44px
• Adaptive navigation: Bottom navigation bar on mobile, sidebar on desktop


5.2 ANDROID NATIVE CONSIDERATIONS
----------------------------------
Status Bar Visibility: Must remain visible at all times
  • Use viewport-fit=cover with safe-area-insets
  • Set windowLayoutInDisplayCutoutMode to 'default' or 'shortEdges'

Navigation Buttons Visibility: Must remain accessible
  • Do NOT use fullscreen mode or immersive mode
  • Set android:windowFullscreen to false in config.xml
  • Implement proper bottom padding to account for navigation bar

Safe Area Implementation: Use CSS environment variables
  • padding-top: env(safe-area-inset-top)
  • padding-bottom: env(safe-area-inset-bottom)


5.3 UI/UX GUIDELINES
--------------------
• Material Design principles for Android consistency
• Smooth animations: 200-300ms transitions
• Loading states: Skeleton screens and progress indicators
• Error states: Clear error messages with retry options
• Accessibility: WCAG 2.1 AA compliance


================================================================================
6. TECHNICAL REQUIREMENTS
================================================================================

6.1 FRONTEND ARCHITECTURE
--------------------------
• React 18+ with functional components and hooks
• Vite for fast development and optimized builds
• React Router for navigation
• State Management: Zustand or React Context API
• UI Library: Tailwind CSS or Material-UI


6.2 BACKEND (SUPABASE)
----------------------
• Authentication: Supabase Auth (email/password, OAuth providers)
• Database: PostgreSQL via Supabase
• Real-time: Supabase Realtime for live message updates
• Storage: Supabase Storage for media files (images, videos)
• Functions: Supabase Edge Functions for complex logic (random matching algorithm)


6.3 DATABASE SCHEMA
-------------------

Table: users
Fields: id, username, email, phone, bio, avatar_url, theme_preference, 
        created_at, last_seen, is_online

Table: conversations
Fields: id, type (direct/random), created_at, last_message_at

Table: conversation_participants
Fields: conversation_id, user_id, joined_at, is_archived, unread_count

Table: messages
Fields: id, conversation_id, sender_id, content, media_url, media_type, 
        created_at, is_read

Table: status_updates
Fields: id, user_id, content, media_url, media_type, background_color, 
        created_at, expires_at, view_count

Table: status_views
Fields: status_id, viewer_id, viewed_at

Table: blocked_users
Fields: blocker_id, blocked_id, blocked_at

Table: random_chat_queue
Fields: user_id, interests (array), joined_queue_at


6.4 CAPACITOR CONFIGURATION
----------------------------

Plugins Required:
• @capacitor/app - App state management
• @capacitor/splash-screen - Splash screen control
• @capacitor/status-bar - Status bar styling
• @capacitor/push-notifications - Push notifications
• @capacitor/camera - Camera access for status media
• @capacitor/filesystem - File system access

capacitor.config.ts Configuration:

{
  appId: 'com.yourapp.chat',
  appName: 'ChatApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#000000'
    }
  }
}


6.5 DEPLOYMENT
--------------

Web App: Vercel
• Automatic deployments from Git repository
• Environment variables for Supabase credentials
• Custom domain support

Android App: Google Play Store
• Build using Capacitor: npm run build && npx cap sync android
• Generate signed APK/AAB via Android Studio
• Internal testing track before production release


================================================================================
7. PERFORMANCE REQUIREMENTS
================================================================================

• Initial Load Time: < 3 seconds on 4G connection
• Message Delivery: < 1 second latency
• Image Upload: < 5 seconds for 5MB files
• Lighthouse Scores: Performance > 90, Accessibility > 90
• Offline Support: Service workers for offline message queueing


================================================================================
8. SECURITY REQUIREMENTS
================================================================================

• End-to-end encryption for messages (future consideration)
• Secure authentication with JWT tokens
• Row-level security (RLS) policies in Supabase
• Input sanitization to prevent XSS attacks
• Rate limiting on API endpoints
• Content moderation for reported messages
• HTTPS only (enforced by Vercel and Capacitor)


================================================================================
9. TESTING REQUIREMENTS
================================================================================

• Unit Tests: Jest and React Testing Library
• Integration Tests: Cypress or Playwright
• Mobile Testing: Test on physical Android devices (minimum Android 8.0)
• Browser Testing: Chrome, Firefox, Safari, Edge
• Performance Testing: Load testing with 1000+ concurrent users


================================================================================
10. FUTURE ENHANCEMENTS
================================================================================

• Voice messages
• Video calling
• Group chats
• Sticker packs and GIF integration
• Message reactions
• Cloud backup and restore
• Multi-device sync
• iOS native app
• Desktop app (Electron or Tauri)
• AI-powered chat suggestions


================================================================================
11. SUCCESS METRICS
================================================================================

• User Acquisition: 10,000 active users in first 6 months
• Engagement: Daily active users (DAU) > 40% of total users
• Retention: 30-day retention rate > 30%
• Random Chat Usage: Average session duration > 5 minutes
• Status Feature: 20% of users posting status weekly
• App Store Rating: Maintain 4.0+ stars on Google Play Store


================================================================================
12. DEVELOPMENT TIMELINE
================================================================================

Phase   | Duration     | Deliverables
--------|--------------|-------------------------------------------------------
Phase 1 | Weeks 1-2    | Project setup, UI/UX design, database schema
Phase 2 | Weeks 3-6    | Core features: Authentication, Home, Search, 1-on-1 chat
Phase 3 | Weeks 7-9    | Status feature, random chat matching, theme customization
Phase 4 | Weeks 10-11  | Settings, notifications, Capacitor integration for Android
Phase 5 | Weeks 12-13  | Testing, bug fixes, performance optimization
Phase 6 | Week 14      | Deployment to Vercel and Google Play Store (Beta)


================================================================================
13. CONCLUSION
================================================================================

This PRD outlines a comprehensive chat application that combines traditional 
messaging features with unique random chat capabilities and personalization 
options. The technical stack (React + Vite + Capacitor + Supabase + Vercel) 
provides a solid foundation for building a performant, scalable, and 
cross-platform application. The focus on responsive design and proper Android 
system UI visibility ensures a seamless user experience across all devices.

Key Success Factors:
• Mobile-first design with desktop responsiveness
• Proper Android system UI visibility (status bar and navigation buttons)
• Real-time messaging with low latency
• Engaging random chat experience
• Robust customization options
• Security and privacy compliance


================================================================================
END OF DOCUMENT
================================================================================