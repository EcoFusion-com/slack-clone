"use client"

import { useState } from "react"
import { Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@clerk/clerk-react"
import { useApiClient } from "@/lib/api"
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"

interface HeaderProps {
  onSearch?: (query: string) => void
  className?: string
}

export function Header({ onSearch, className }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useUser()
  const apiClient = useApiClient()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    // Debounced search could be added here
  }

  return (
    <header className={`flex items-center justify-between p-6 border-b bg-background ${className || ''}`}>
      <div className="flex-1 max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-2">HR Dashboard</h1>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="dashboard-search"
            name="dashboard-search"
            type="text"
            placeholder="Search tickets, users, or activities..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4"
            aria-label="Search dashboard"
          />
        </form>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationDropdown />

        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.imageUrl} 
              alt={user?.fullName || "User"} 
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">
              {user?.fullName || user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-xs text-muted-foreground">HR Manager</p>
          </div>
        </div>
      </div>
    </header>
  )
}
