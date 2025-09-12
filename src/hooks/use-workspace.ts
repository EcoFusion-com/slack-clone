import { useState, useEffect } from 'react'
import { useApiClient } from '@/lib/api'

export function useWorkspace() {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const apiClient = useApiClient()

  useEffect(() => {
    loadCurrentWorkspace()
  }, [])

  const loadCurrentWorkspace = async () => {
    try {
      setIsLoading(true)
      // Get current user's workspaces
      const workspaces = await apiClient.getWorkspaces()
      if (workspaces && workspaces.length > 0) {
        // Use the first workspace as the current one
        setCurrentWorkspaceId(workspaces[0].id)
      }
    } catch (error) {
      console.error('Failed to load current workspace:', error)
      // Fallback to a default workspace ID if needed
      setCurrentWorkspaceId('1')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    currentWorkspaceId,
    isLoading,
    refreshWorkspace: loadCurrentWorkspace
  }
}
