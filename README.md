# Slack Frontend

A modern, responsive Slack clone built with React, TypeScript, and Tailwind CSS. This frontend provides a complete chat interface with real-time messaging capabilities, channel management, and user interactions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API running (see Backend README for setup)

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend runs on `http://localhost:8080` by default.

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom Slack design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Query for server state
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Theme**: Dark/Light mode support

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── slack-layout.tsx # Main layout wrapper
│   ├── slack-sidebar.tsx # Navigation sidebar
│   ├── chat-area.tsx    # Message display & input
│   ├── chat-header.tsx  # Channel header
│   └── theme-provider.tsx # Theme management
├── pages/               # Route components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── main.tsx            # App entry point
```

## 🔌 Backend Integration

### API Endpoints Expected

The frontend expects the following backend API structure:

#### Authentication
```typescript
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh
DELETE /api/v1/auth/logout
```

#### Workspaces
```typescript
GET /api/v1/workspaces
POST /api/v1/workspaces
GET /api/v1/workspaces/{id}
PUT /api/v1/workspaces/{id}
DELETE /api/v1/workspaces/{id}
```

#### Channels
```typescript
GET /api/v1/workspaces/{workspace_id}/channels
POST /api/v1/workspaces/{workspace_id}/channels
GET /api/v1/channels/{id}
PUT /api/v1/channels/{id}
DELETE /api/v1/channels/{id}
```

#### Messages
```typescript
GET /api/v1/channels/{channel_id}/messages
POST /api/v1/channels/{channel_id}/messages
PUT /api/v1/messages/{id}
DELETE /api/v1/messages/{id}
```

#### Users
```typescript
GET /api/v1/users
GET /api/v1/users/{id}
PUT /api/v1/users/{id}
GET /api/v1/workspaces/{workspace_id}/members
```

#### Tickets (Support System)
```typescript
GET /api/v1/tickets
POST /api/v1/tickets
GET /api/v1/tickets/{id}
PUT /api/v1/tickets/{id}
DELETE /api/v1/tickets/{id}
```

### WebSocket Events

For real-time functionality, implement these WebSocket events:

```typescript
// Client → Server
{
  "type": "join_channel",
  "data": { "channel_id": "string" }
}

{
  "type": "send_message", 
  "data": {
    "channel_id": "string",
    "content": "string",
    "attachments": "array"
  }
}

// Server → Client
{
  "type": "new_message",
  "data": {
    "id": "string",
    "user": { "id": "string", "name": "string", "avatar": "string" },
    "content": "string",
    "timestamp": "ISO string",
    "channel_id": "string"
  }
}

{
  "type": "user_typing",
  "data": {
    "user_id": "string",
    "channel_id": "string",
    "is_typing": "boolean"
  }
}

{
  "type": "user_status_change",
  "data": {
    "user_id": "string",
    "status": "online" | "away" | "busy" | "offline"
  }
}
```

## 📊 Data Models

### Message Interface
```typescript
interface Message {
  id: string
  user: {
    id: string
    name: string
    avatar?: string
    isOnline: boolean
    role?: string
  }
  content: string
  timestamp: Date
  channel_id: string
  reactions?: { emoji: string; count: number; users: string[] }[]
  replies?: number
  isOwn?: boolean
  readStatus?: 'sent' | 'delivered' | 'read'
  attachments?: { name: string; type: string; url: string }[]
}
```

### Channel Interface
```typescript
interface Channel {
  id: string
  type: 'channel' | 'dm' | 'private'
  name: string
  description?: string
  member_count: number
  unread_count?: number
  is_archived: boolean
  created_at: Date
  updated_at: Date
}
```

### User Interface
```typescript
interface User {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  role?: string
  last_seen?: Date
}
```

## 🎨 Design System

### Color Palette
The frontend uses a custom Slack-inspired design system with HSL color values:

- **Primary**: Purple (`hsl(283 100% 60%)`) - Main brand color
- **Accent**: Green (`hsl(158 64% 52%)`) - Success states
- **Sidebar**: Dark blue (`hsl(219 28% 12%)`) - Navigation background
- **Status Colors**: 
  - Online: Green (`hsl(142 71% 45%)`)
  - Away: Yellow (`hsl(43 96% 56%)`)
  - Busy: Red (`hsl(0 84% 60%)`)
  - Offline: Gray (`hsl(0 0% 60%)`)

### Theme Support
- Light mode (default)
- Dark mode
- System preference detection
- Smooth transitions between themes

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend root:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_BACKEND_URL=http://localhost:3001
# VITE_WS_URL is optional - will auto-detect protocol (ws:// for local, wss:// for production)
VITE_APP_NAME=Slack Clone
```

### Vite Configuration
- **Port**: 8080
- **Host**: All interfaces (`::`)
- **Path Alias**: `@` → `./src`
- **SWC**: Fast React compilation

## 🧪 Development Guidelines

### Component Structure
```typescript
// Example component structure
interface ComponentProps {
  // Props interface
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  )
}
```

### Styling Guidelines
- Use Tailwind CSS classes
- Follow the design system color variables
- Use semantic class names (e.g., `bg-sidebar-background`)
- Maintain consistent spacing and typography

### State Management
- Use React Query for server state
- Use React hooks for local state
- Implement proper loading and error states
- Handle optimistic updates for better UX

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
- Set `VITE_API_BASE_URL` to your production API URL
- Set `VITE_BACKEND_URL` to your production backend URL (WebSocket protocol will auto-detect)
- Configure CORS on backend to allow frontend domain

### Static Hosting
The build creates static files in `dist/` that can be served by:
- Nginx
- Apache
- CDN (Cloudflare, AWS CloudFront)
- Static hosting (Vercel, Netlify)

## 🔍 Key Features

### Real-time Messaging
- WebSocket integration for live updates
- Typing indicators
- Message status (sent/delivered/read)
- Emoji reactions
- File attachments

### Channel Management
- Public/private channels
- Direct messages
- Channel search
- Member management
- Channel settings

### User Experience
- Responsive design (mobile-friendly)
- Dark/light theme toggle
- Keyboard shortcuts
- Message search
- Notification system

### Admin Features
- User management
- Workspace settings
- Ticket system integration
- Analytics dashboard

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for frontend domain
2. **WebSocket Connection**: Check WebSocket URL and backend WebSocket setup
3. **Theme Issues**: Clear localStorage if theme switching doesn't work
4. **Build Errors**: Ensure all dependencies are installed with `npm install`

### Development Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API debugging
- Console for WebSocket debugging

## 📝 API Integration Checklist

For backend developers integrating with this frontend:

- [ ] Implement all required API endpoints
- [ ] Set up WebSocket server for real-time features
- [ ] Configure CORS for frontend domain
- [ ] Implement authentication (JWT recommended)
- [ ] Add proper error handling and status codes
- [ ] Set up file upload for message attachments
- [ ] Implement user presence/status system
- [ ] Add rate limiting for API endpoints
- [ ] Set up proper logging and monitoring

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use semantic commit messages
3. Test components thoroughly
4. Maintain design system consistency
5. Update documentation for new features

---

For backend-specific setup and API documentation, see the Backend README in the `../Backend/` directory.