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
        // No workspaces found, use the default workspace ID
        // The default workspace should exist from database seeding
        // console.log('No workspaces found, using default workspace...')
        setCurrentWorkspaceId("cmfmb07d90002f8qs44926mza") // Use the actual default workspace ID
      }
    } catch (error) {
      console.error('Failed to load current workspace:', error)
      // Fallback to default workspace ID
      setCurrentWorkspaceId("cmfmb07d90002f8qs44926mza")
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
