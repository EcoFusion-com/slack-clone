"use client"

import { useState } from "react"
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react"
import { SlackSidebar } from "@/components/slack-sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatArea } from "@/components/chat-area"
import { TicketCenter } from "@/components/tickets/TicketCenter"
import { AdminDashboard } from "@/components/admin/AdminDashboard"
import { PeopleAndGroups } from "@/components/people/PeopleAndGroups"
import { ThreadsView } from "@/components/threads/ThreadsView"
import { MentionsAndReactions } from "@/components/mentions/MentionsAndReactions"
import { useWorkspace } from "@/hooks/use-workspace"

interface SlackLayoutProps {
  children?: React.ReactNode
}

type ViewType = 'chat' | 'tickets' | 'threads' | 'mentions' | 'people' | 'admin'

export function SlackLayout({ children }: SlackLayoutProps) {
  const { isSignedIn, user, isLoaded } = useUser()
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>("1")
  const [currentView, setCurrentView] = useState<ViewType>('chat')
  const [ticketCount, setTicketCount] = useState<number>(0)
  const { currentWorkspaceId, isLoading: workspaceLoading } = useWorkspace()

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId)
    setCurrentView('chat')
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
  }

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
      case 'tickets':
        return <TicketCenter workspaceId={currentWorkspaceId || "1"} onTicketCountChange={setTicketCount} />
      case 'admin':
        return <AdminDashboard />
      case 'people':
        return <PeopleAndGroups />
      case 'threads':
        return <ThreadsView />
      case 'mentions':
        return <MentionsAndReactions />
      case 'chat':
      default:
        return <ChatArea channelId={selectedChannelId ? parseInt(selectedChannelId) : 1} />
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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Slack Clone</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to access your workspace
          </p>
          <SignInButton mode="modal">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
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
      <div className="w-64 bg-sidebar-background border-r border-border flex flex-col">
        <SlackSidebar
          selectedChannelId={selectedChannelId}
          onChannelSelect={handleChannelSelect}
          currentView={currentView}
          onViewChange={handleViewChange}
          ticketCount={ticketCount}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            {currentView === 'chat' && selectedChannelId && (
              <ChatHeader
                channelName="general"
                channelType="channel"
                memberCount={42}
                topic="Company announcements and general discussion"
              />
            )}
            {currentView === 'tickets' && (
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold">Tickets</h1>
              </div>
            )}
            {currentView === 'admin' && (
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold">Admin Dashboard</h1>
              </div>
            )}
            {currentView === 'people' && (
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold">People & Groups</h1>
              </div>
            )}
            {currentView === 'threads' && (
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold">Threads</h1>
              </div>
            )}
            {currentView === 'mentions' && (
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold">Mentions & Reactions</h1>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              {user?.fullName || user?.emailAddresses[0]?.emailAddress}
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </div>
  )
}