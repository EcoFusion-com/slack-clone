/**
 * File Upload Service
 * Handles file uploads to S3 via backend presigned URLs
 */

import { apiClient } from './api'

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadedFileInfo {
  id: number
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  file_url: string
  width?: number
  height?: number
  duration?: number
  created_at: string
}

export interface PresignedUrlResponse {
  upload_url: string
  file_id: number
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
}

class FileUploadService {
  private maxFileSize = 10 * 1024 * 1024 // 10MB
  private allowedTypes = [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-rar-compressed'
  ]

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size must be less than ${this.formatFileSize(this.maxFileSize)}`
      }
    }

    // Check file type
    const isAllowed = this.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      }
    }

    return { valid: true }
  }

  /**
   * Get presigned URL for file upload
   */
  async getPresignedUrl(file: File): Promise<PresignedUrlResponse> {
    try {
      const response = await fetch('/api/v1/files/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          filename: file.name,
          file_size: file.size,
          mime_type: file.type
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get presigned URL: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting presigned URL:', error)
      throw error
    }
  }

  /**
   * Upload file to S3 using presigned URL
   */
  async uploadToS3(
    file: File, 
    presignedUrl: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          }
          onProgress(progress)
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`))
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      // Start upload
      xhr.open('PUT', presignedUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFileInfo> {
    // Validate file
    const validation = this.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    try {
      // Get presigned URL
      const presignedData = await this.getPresignedUrl(file)
      
      // Upload to S3
      await this.uploadToS3(file, presignedData.upload_url, onProgress)

      // Return file info
      return {
        id: presignedData.file_id,
        filename: presignedData.filename,
        original_filename: presignedData.original_filename,
        file_size: presignedData.file_size,
        mime_type: presignedData.mime_type,
        file_url: presignedData.upload_url.split('?')[0], // Remove query params
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('File upload failed:', error)
      throw error
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadedFileInfo[]> {
    const uploadPromises = files.map(async (file, index) => {
      return this.uploadFile(file, (progress) => {
        if (onProgress) {
          onProgress(index, progress)
        }
      })
    })

    return Promise.all(uploadPromises)
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file type icon
   */
  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('document') || mimeType.includes('text')) return '📝'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
    return '📁'
  }

  /**
   * Check if file is an image
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * Check if file is a video
   */
  isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/')
  }

  /**
   * Check if file is an audio file
   */
  isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/')
  }

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService()

// Export types
export type { UploadProgress, UploadedFileInfo, PresignedUrlResponse }


