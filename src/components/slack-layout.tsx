"use client"

import { useState, useEffect } from "react"
import { useUser, SignInButton } from "@clerk/clerk-react"
import { SlackSidebar } from "@/components/slack-sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatArea } from "@/components/chat-area"
import { TicketCenter } from "@/components/tickets/TicketCenter"
import { AdminDashboard } from "@/components/admin/AdminDashboard"
import { PeopleAndGroups } from "@/components/people/PeopleAndGroups"
import { ThreadsView } from "@/components/threads/ThreadsView"
import { MentionsAndReactions } from "@/components/mentions/MentionsAndReactions"
import { Dashboard } from "@/pages/dashboard"
import { useWorkspace } from "@/hooks/use-workspace"
import { useChat } from "@/hooks/use-chat"
import ErrorBoundary from "./ErrorBoundary"

interface SlackLayoutProps {
  children?: React.ReactNode
}

type ViewType = 'chat' | 'tickets' | 'threads' | 'mentions' | 'people' | 'admin' | 'dashboard'

export function SlackLayout({ children }: SlackLayoutProps) {
  const { isSignedIn, user, isLoaded } = useUser()
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined)
  const [currentView, setCurrentView] = useState<ViewType>('dashboard') // Default to dashboard
  const [ticketCount, setTicketCount] = useState<number>(0)
  const { currentWorkspaceId, isLoading: workspaceLoading } = useWorkspace()
  
  // Use chat hook to get channel information
  const { currentChannel, channels } = useChat({ 
    workspaceId: currentWorkspaceId || "1", 
    channelId: selectedChannelId 
  })

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId)
    setCurrentView('chat')
    // The useChat hook will automatically handle channel selection
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
  }

  // Auto-select first channel when channels are loaded
  useEffect(() => {
    if (selectedChannelId === undefined && currentWorkspaceId) {
      // Try to get the selected channel from localStorage first
      const savedChannelId = localStorage.getItem('selectedChannelId')
      if (savedChannelId) {
        setSelectedChannelId(savedChannelId)
      }
    }
  }, [selectedChannelId, currentWorkspaceId])

  const renderMainContent = () => {
    if (children) {
      return children
    }

    // Show loading state while workspace is loading
    if (workspaceLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workspace...</p>
          </div>
        </div>
      )
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <ErrorBoundary level="component">
            <Dashboard workspaceId={currentWorkspaceId || "1"} />
          </ErrorBoundary>
        )
      case 'tickets':
        return (
          <ErrorBoundary level="component">
            <TicketCenter workspaceId={currentWorkspaceId || "1"} onTicketCountChange={setTicketCount} />
          </ErrorBoundary>
        )
      case 'admin':
        return (
          <ErrorBoundary level="component">
            <AdminDashboard />
          </ErrorBoundary>
        )
      case 'people':
        return (
          <ErrorBoundary level="component">
            <PeopleAndGroups />
          </ErrorBoundary>
        )
      case 'threads':
        return (
          <ErrorBoundary level="component">
            <ThreadsView />
          </ErrorBoundary>
        )
      case 'mentions':
        return (
          <ErrorBoundary level="component">
            <MentionsAndReactions />
          </ErrorBoundary>
        )
      case 'chat':
      default:
        return (
          <ErrorBoundary level="component">
            <ChatArea channelId={selectedChannelId} workspaceId={currentWorkspaceId || "1"} />
          </ErrorBoundary>
        )
    }
  }

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign-in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome to Slack Clone</h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <SlackSidebar 
        selectedChannelId={selectedChannelId}
        onChannelSelect={handleChannelSelect}
        currentView={currentView}
        onViewChange={handleViewChange}
        ticketCount={ticketCount}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header - only show for chat view */}
        {currentView === 'chat' && currentChannel && (
          <ChatHeader 
            channelName={currentChannel.name}
            channelType="channel"
            memberCount={0}
            topic={currentChannel.description || undefined}
            isStarred={false}
            isNotificationEnabled={true}
          />
        )}
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </div>
  )
}