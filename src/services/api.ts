const API_BASE_URL = 'http://localhost:8000';

import { RiskCheckRequest, RiskReportResponse } from '../../types';

export interface UploadResponse {
  success: boolean;
  message: string;
  file: {
    id: string;
    filename: string;
    size: number;
    content_type: string;
    document_type: string;
    bucket_name: string;
    download_url: string;
    created_at: string;
  };
}

export interface DocumentStatus {
  application_id: string;
  summary: Array<{
    document_type: string;
    uploaded_count: number;
    required_count: number;
    completed: boolean;
    files: Array<{
      file_url: string;
      filename: string;
    }>;
  }>;
}

export interface EnrollmentData {
  student: {
    surname: string;
    firstName: string;
    middleName?: string;
    preferredName?: string;
    dob: string;
    gender: string;
    homeLanguage: string;
    idNumber: string;
    previousGrade: string;
    gradeAppliedFor: string;
    previousSchool: string;
  };
  medical: {
    medicalAidName?: string;
    memberNumber?: string;
    conditions: string[];
    allergies?: string;
  };
  family: {
    fatherSurname: string;
    fatherFirstName: string;
    fatherIdNumber: string;
    fatherMobile: string;
    fatherEmail: string;
    motherSurname: string;
    motherFirstName: string;
    motherIdNumber: string;
    motherMobile: string;
    motherEmail: string;
  };
  fee: {
    feePerson: string;
    relationship: string;
    feeTermsAccepted: boolean;
  };
}

class ApiService {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with any additional headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFile(
    file: File,
    applicationId: string,
    documentType: string,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
  ): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('application_id', applicationId);
      formData.append('document_type', documentType);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response from server'));
          }
        } else {
          let errorMessage = `Upload failed: ${xhr.status} ${xhr.statusText}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.detail) {
              errorMessage = errorResponse.detail;
            }
          } catch {
            // Use default error message
          }
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      xhr.open('POST', `${API_BASE_URL}/upload`);
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }

  async getApplication(applicationId: string): Promise<any> {
    return this.request(`/applications/${applicationId}`);
  }

  async getDocumentStatus(applicationId: string): Promise<DocumentStatus> {
    return this.request<DocumentStatus>(`/documents/${applicationId}`);
  }

  async getUploadSummary(applicationId: string): Promise<{ completed_categories: number; uploaded_types: string[] }> {
    return this.request(`/applications/${applicationId}/upload-summary`);
  }

  async markDocumentComplete(applicationId: string, docType: string): Promise<{ message: string }> {
    return this.request(`/applications/${applicationId}/mark-complete/${docType}`, {
      method: 'POST',
    });
  }

  async getUploadedFiles(applicationId: string): Promise<{ files: any[] }> {
    return this.request<{ files: any[] }>(`/documents/${applicationId}/files`);
  }

  async deleteFile(applicationId: string, fileId: string): Promise<{ message: string }> {
    return this.request(`/documents/${applicationId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async submitEnrollment(data: EnrollmentData): Promise<{ message: string; data: any }> {
    return this.request('/enrollment/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async autoSaveEnrollment(data: { application_id: string; student?: any; medical?: any; family?: any; fee?: any }): Promise<{ message: string; application_id: string }> {
    return this.request('/enrollment/auto-save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitFullApplication(applicationId: string, data: any): Promise<{ message: string; data: any }> {
    return this.request(`/submit-application`, {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId, ...data }),
    });
  }

  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: any }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(full_name: string, email: string, password: string): Promise<{ message: string; user: any }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    });
  }

  async completeDocumentUpload(applicationId: string): Promise<{ message: string }> {
    return this.request('/documents/complete', {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId }),
    });
  }

  async runRiskCheck(request: RiskCheckRequest): Promise<RiskReportResponse> {
    return this.request<RiskReportResponse>('/risk-check', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiService = new ApiService();
