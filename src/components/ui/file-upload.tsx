"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, File, Image, Video, Music, FileText, Archive, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  disabled?: boolean
  className?: string
}

export interface UploadedFile {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  url?: string
}

const getFileIcon = (file: File) => {
  const type = file.type.toLowerCase()
  
  if (type.startsWith('image/')) return <Image className="h-4 w-4" />
  if (type.startsWith('video/')) return <Video className="h-4 w-4" />
  if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return <FileText className="h-4 w-4" />
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return <Archive className="h-4 w-4" />
  
  return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileUpload({ 
  onUpload, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc', '.docx', '.txt', '.zip', '.rar'],
  disabled = false,
  className 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`
    }
    
    if (acceptedTypes.length > 0) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        return file.type.match(type.replace('*', '.*'))
      })
      
      if (!isAccepted) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`
      }
    }
    
    return null
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    if (fileArray.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      })
      return
    }

    // Validate files
    const validationErrors: string[] = []
    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) validationErrors.push(`${file.name}: ${error}`)
    })

    if (validationErrors.length > 0) {
      toast({
        title: "File validation failed",
        description: validationErrors.join(', '),
        variant: "destructive",
      })
      return
    }

    // Initialize upload state
    const initialFiles: UploadedFile[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))
    
    setUploadedFiles(prev => [...prev, ...initialFiles])
    setIsUploading(true)

    try {
      await onUpload(fileArray)
      
      // Mark all files as completed
      setUploadedFiles(prev => prev.map(f => 
        fileArray.includes(f.file) ? { ...f, status: 'completed' as const, progress: 100 } : f
      ))
      
      toast({
        title: "Files uploaded successfully",
        description: `${fileArray.length} file(s) uploaded`,
      })
    } catch (error) {
      // Mark files as error
      setUploadedFiles(prev => prev.map(f => 
        fileArray.includes(f.file) ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      ))
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [maxFiles, maxSize, acceptedTypes, onUpload, toast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [disabled, handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = (file: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== file))
  }

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragOver ? "Drop files here" : "Upload files"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFileDialog}
            disabled={disabled}
          >
            Choose Files
          </Button>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {getFileIcon(uploadedFile.file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                  {uploadedFile.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={uploadedFile.progress} className="h-1" />
                    </div>
                  )}
                  {uploadedFile.status === 'error' && uploadedFile.error && (
                    <p className="text-xs text-red-500 mt-1">
                      {uploadedFile.error}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {uploadedFile.status === 'completed' && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.file)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
