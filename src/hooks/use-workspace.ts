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
      } else {
        // No workspaces exist, create a default one
        console.log('No workspaces found, creating default workspace...')
        const defaultWorkspace = await apiClient.createWorkspace({
          name: "My Workspace",
          description: "Default workspace for your team",
          slug: "my-workspace"
        })
        setCurrentWorkspaceId(defaultWorkspace.id)
      }
    } catch (error) {
      console.error('Failed to load current workspace:', error)
      // Set to null instead of fallback to "1"
      setCurrentWorkspaceId(null)
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
