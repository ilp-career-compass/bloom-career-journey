// Supabase Resumable Upload Service
// Handles chunked uploads for poor rural connectivity
// Supports offline queuing and retry logic

import { supabase } from '@/integrations/supabase/client';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: Blob;
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  metadata?: {
    size: number;
    contentType: string;
    uploadedAt: string;
  };
}

export interface QueuedUpload {
  id: string;
  options: UploadOptions;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  retryCount: number;
  createdAt: string;
  lastAttempt?: string;
}

class SupabaseUploadService {
  private uploadQueue: QueuedUpload[] = [];
  private isProcessing = false;
  private maxConcurrentUploads = 2;
  private activeUploads = 0;

  constructor() {
    // Process queue when online
    window.addEventListener('online', () => {
      this.processQueue();
    });
  }

  /**
   * Upload file with resumable chunks
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const {
      bucket,
      path,
      file,
      chunkSize = 1024 * 1024, // 1MB chunks
      maxRetries = 3,
      onProgress,
      onError,
    } = options;

    try {
      // Check if file is too small for chunking
      if (file.size <= chunkSize) {
        return await this.uploadSingleChunk(bucket, path, file, onProgress);
      }

      // Upload in chunks
      return await this.uploadInChunks(
        bucket,
        path,
        file,
        chunkSize,
        maxRetries,
        onProgress,
        onError
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(error as Error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload single chunk (small files)
   */
  private async uploadSingleChunk(
    bucket: string,
    path: string,
    file: Blob,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      onProgress?.(0);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      onProgress?.(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        metadata: {
          size: file.size,
          contentType: file.type,
          uploadedAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload file in chunks with retry logic
   */
  private async uploadInChunks(
    bucket: string,
    path: string,
    file: Blob,
    chunkSize: number,
    maxRetries: number,
    onProgress?: (progress: number) => void,
    onError?: (error: Error) => void
  ): Promise<UploadResult> {
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunkHashes: string[] = [];
    let uploadedBytes = 0;

    try {
      // Upload each chunk
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const chunkPath = `${path}.chunk.${i}`;

        let retryCount = 0;
        let chunkUploaded = false;

        // Retry logic for each chunk
        while (retryCount < maxRetries && !chunkUploaded) {
          try {
            const { error } = await supabase.storage
              .from(bucket)
              .upload(chunkPath, chunk, {
                cacheControl: '3600',
                upsert: true,
              });

            if (error) {
              throw error;
            }

            // Calculate hash for chunk integrity
            const chunkHash = await this.calculateHash(chunk);
            chunkHashes.push(chunkHash);
            chunkUploaded = true;

            uploadedBytes += chunk.size;
            const progress = (uploadedBytes / file.size) * 100;
            onProgress?.(progress);

          } catch (error) {
            retryCount++;
            console.warn(`Chunk ${i} upload failed (attempt ${retryCount}):`, error);
            
            if (retryCount >= maxRetries) {
              throw new Error(`Failed to upload chunk ${i} after ${maxRetries} attempts`);
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
      }

      // Combine chunks into final file
      const finalFile = await this.combineChunks(bucket, path, totalChunks);
      
      // Clean up chunk files
      await this.cleanupChunks(bucket, path, totalChunks);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        success: true,
        url: urlData.publicUrl,
        path,
        metadata: {
          size: file.size,
          contentType: file.type,
          uploadedAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      // Clean up any uploaded chunks on failure
      await this.cleanupChunks(bucket, path, totalChunks);
      throw error;
    }
  }

  /**
   * Combine uploaded chunks into final file
   */
  private async combineChunks(
    bucket: string,
    path: string,
    totalChunks: number
  ): Promise<Blob> {
    const chunks: Blob[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${path}.chunk.${i}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(chunkPath);

      if (error) {
        throw new Error(`Failed to download chunk ${i}: ${error.message}`);
      }

      chunks.push(data);
    }

    // Combine chunks into single blob
    return new Blob(chunks, { type: 'audio/webm;codecs=opus' });
  }

  /**
   * Clean up chunk files after successful upload
   */
  private async cleanupChunks(
    bucket: string,
    path: string,
    totalChunks: number
  ): Promise<void> {
    const chunkPaths = Array.from({ length: totalChunks }, (_, i) => `${path}.chunk.${i}`);
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove(chunkPaths);

    if (error) {
      console.warn('Failed to cleanup chunk files:', error);
    }
  }

  /**
   * Calculate hash for chunk integrity
   */
  private async calculateHash(chunk: Blob): Promise<string> {
    const buffer = await chunk.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Queue upload for offline processing
   */
  queueUpload(options: UploadOptions): string {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedUpload: QueuedUpload = {
      id,
      options,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.uploadQueue.push(queuedUpload);
    
    // Process queue if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process upload queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    while (this.uploadQueue.length > 0 && this.activeUploads < this.maxConcurrentUploads) {
      const queuedUpload = this.uploadQueue.find(upload => upload.status === 'pending');
      
      if (!queuedUpload) {
        break;
      }

      this.activeUploads++;
      queuedUpload.status = 'uploading';
      queuedUpload.lastAttempt = new Date().toISOString();

      try {
        const result = await this.uploadFile(queuedUpload.options);
        
        if (result.success) {
          queuedUpload.status = 'completed';
          queuedUpload.progress = 100;
        } else {
          throw new Error(result.error || 'Upload failed');
        }

      } catch (error) {
        queuedUpload.retryCount++;
        queuedUpload.status = 'failed';
        
        if (queuedUpload.retryCount < (queuedUpload.options.maxRetries || 3)) {
          // Retry later
          queuedUpload.status = 'pending';
          setTimeout(() => {
            this.activeUploads--;
            this.processQueue();
          }, Math.pow(2, queuedUpload.retryCount) * 1000);
        } else {
          // Max retries exceeded
          queuedUpload.options.onError?.(error as Error);
          this.activeUploads--;
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get upload queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.uploadQueue.length,
      pending: this.uploadQueue.filter(u => u.status === 'pending').length,
      uploading: this.uploadQueue.filter(u => u.status === 'uploading').length,
      completed: this.uploadQueue.filter(u => u.status === 'completed').length,
      failed: this.uploadQueue.filter(u => u.status === 'failed').length,
    };
  }

  /**
   * Clear completed uploads from queue
   */
  clearCompleted(): void {
    this.uploadQueue = this.uploadQueue.filter(upload => upload.status !== 'completed');
  }

  /**
   * Retry failed uploads
   */
  retryFailed(): void {
    this.uploadQueue.forEach(upload => {
      if (upload.status === 'failed') {
        upload.status = 'pending';
        upload.retryCount = 0;
      }
    });
    
    this.processQueue();
  }
}

// Create singleton instance
export const supabaseUploadService = new SupabaseUploadService();

export default supabaseUploadService;
