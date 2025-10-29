import { useState, useCallback, useRef } from 'react';
import { apiService, UploadResponse } from '@/services/api';

export interface UploadState {
  isUploading: boolean;
  error: string | null;
  progress: number;
}

export interface UploadError {
  type: 'network' | 'server' | 'validation' | 'cancelled' | 'unknown';
  message: string;
}

export const useUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    error: null,
    progress: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadFile = useCallback(async (
    file: File,
    applicationId: string,
    documentType: string,
    bucketName: string
  ): Promise<UploadResponse | null> => {
    // Cancel any existing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setUploadState({ isUploading: true, error: null, progress: 0 });

    try {
      // Direct upload to backend
      const response = await apiService.uploadFile(
        file,
        applicationId,
        documentType,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        },
        abortControllerRef.current.signal
      );

      setUploadState({ isUploading: false, error: null, progress: 100 });
      abortControllerRef.current = null;
      
      return response;
    } catch (error) {
      abortControllerRef.current = null;

      let uploadError: UploadError;

      if (error instanceof Error) {
        if (error.message.includes('Network error')) {
          uploadError = { type: 'network', message: 'Network connection failed. Please check your internet connection.' };
        } else if (error.message.includes('cancelled')) {
          uploadError = { type: 'cancelled', message: 'Upload was cancelled.' };
        } else if (error.message.includes('Upload failed:')) {
          uploadError = { type: 'server', message: error.message };
        } else if (error.message.includes('Invalid JSON')) {
          uploadError = { type: 'server', message: 'Server returned an invalid response.' };
        } else {
          uploadError = { type: 'unknown', message: error.message };
        }
      } else {
        uploadError = { type: 'unknown', message: 'An unexpected error occurred during upload.' };
      }

      setUploadState({ isUploading: false, error: uploadError.message, progress: 0 });
      return null;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setUploadState({ isUploading: false, error: 'Upload was cancelled.', progress: 0 });
    }
  }, []);

  const resetUploadState = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploadState({ isUploading: false, error: null, progress: 0 });
  }, []);

  return {
    uploadState,
    uploadFile,
    cancelUpload,
    resetUploadState,
  };
};
