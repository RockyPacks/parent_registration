const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Utility function to convert object keys from camelCase to snake_case recursively
function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  // Handle Date objects by converting to ISO string
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(obj[key]);
  }
  return result;
}

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
  application_id: string;
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
    nextOfKinSurname: string;
    nextOfKinFirstName: string;
    nextOfKinRelationship: string;
    nextOfKinMobile: string;
    nextOfKinEmail: string;
    nextOfKinIdNumber?: string; // Added missing property
  };
  fee: {
    feePerson: string;
    relationship: string;
    feeTermsAccepted: boolean;
  };
}

class ApiService {
  private sessionCache: { session: any; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async getCachedSession() {
    const now = Date.now();

    // Return cached session if it's still valid
    if (this.sessionCache && (now - this.sessionCache.timestamp) < this.CACHE_DURATION) {
      return this.sessionCache.session;
    }

    // Get fresh session from Supabase
    const { supabase } = await import('./supabase');
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      this.sessionCache = null;
      throw new Error('Authentication required. Please log in again.');
    }

    // Cache the session
    this.sessionCache = { session, timestamp: now };
    return session;
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('API request - URL:', url);
    console.log('API request - Method:', options?.method || 'GET');
    console.log('API request - Body:', options?.body);

    const session = await this.getCachedSession();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };

    // Merge with any additional headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      console.log('Fetching URL:', url);
      const response = await fetch(url, {
        headers,
        ...options,
      });

      console.log('API response - Status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          errorMessage += ` - ${JSON.stringify(errorBody)}`;
        } catch {
          // If parsing fails, use default message
        }

        console.error('API error response:', errorMessage);

        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          // Clear cache and session
          this.sessionCache = null;
          const { supabase } = await import('./supabase');
          await supabase.auth.signOut();
          throw new Error('Authentication required. Please log in again.');
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API response - Data:', data);
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async uploadFile(
    file: File,
    applicationId: string | null, // applicationId can be null
    documentType: string,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
  ): Promise<UploadResponse> {
    const session = await this.getCachedSession();

    if (!applicationId || applicationId === "unknown") {
      throw new Error("Cannot upload file: Application ID is missing or invalid.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('application_id', applicationId);
    formData.append('document_type', documentType);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorBody);
        throw new Error(errorBody.detail || `Upload failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Upload error caught in frontend:', error);
      throw error;
    }
  }

  /**
   * Calls the backend to get an existing application ID for the current user
   * or create a new one. This is the authoritative way to get the ID after login.
   */
  async initiateApplication(): Promise<{ application_id: string; status: string }> {
    // This makes a POST request to the correct, secure endpoint.
    return this.request('/enrollment/initiate-application', {
      method: 'POST',
    });
  }

  async getApplication(applicationId: string): Promise<any> {
    return this.request(`/enrollment/get-application/${applicationId}`);
  }

  async getDocumentStatus(applicationId: string): Promise<DocumentStatus> {
    return this.request<DocumentStatus>(`/documents/${applicationId}`);
  }

  async getUploadSummary(applicationId: string): Promise<{ completed_categories: number; uploaded_types: string[] }> {
    // Handle empty applicationId
    if (!applicationId || applicationId.trim() === '') {
      return { completed_categories: 0, uploaded_types: [] };
    }

    return this.request(`/enrollment/${applicationId}/upload-summary`);
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

  async submitEnrollment(data: EnrollmentData): Promise<{ message: string; application_id: string }> {
    const snakeCaseData = toSnakeCase(data);
    // Ensure required fields are present for submission
    if (snakeCaseData.student) {
      // Map dob to date_of_birth
      if (snakeCaseData.student.dob) {
        snakeCaseData.student.date_of_birth = new Date(snakeCaseData.student.dob).toISOString().split("T")[0];
        delete snakeCaseData.student.dob;
      }
      // Ensure gender is lowercase
      if (snakeCaseData.student.gender) {
        snakeCaseData.student.gender = snakeCaseData.student.gender.toLowerCase();
      }
    }
    // Handle empty strings for optional fields
    if (snakeCaseData.family) {
      // Mother fields
      if (snakeCaseData.family.mother_id_number === '') {
        snakeCaseData.family.mother_id_number = undefined;
      }
      if (snakeCaseData.family.mother_mobile === '') {
        snakeCaseData.family.mother_mobile = undefined;
      }
      if (snakeCaseData.family.mother_email === '') {
        snakeCaseData.family.mother_email = undefined;
      }
      
      // Next of kin fields - convert 'none' or empty strings to undefined
      const nokFields = ['next_of_kin_surname', 'next_of_kin_first_name', 'next_of_kin_relationship', 'next_of_kin_mobile', 'next_of_kin_email'];
      for (const field of nokFields) {
        const value = snakeCaseData.family[field];
        if (!value || value === '' || String(value).toLowerCase() === 'none') {
          snakeCaseData.family[field] = undefined;
        }
      }
    }
    return this.request('/enrollment/submit', {
      method: 'POST',
      body: JSON.stringify(snakeCaseData),
    });
  }

  async autoSaveEnrollment(data: { application_id: string; student?: any; medical?: any; family?: any; fee?: any }): Promise<{ message: string; application_id: string }> {
    // Only include sections that have actual data
    const filteredData: any = {
      application_id: data.application_id
    };

    // Helper function to check if an object has any non-empty values
    const hasData = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      // Check if there is at least one own property that is not null or undefined.
      // This is less strict than the previous check and allows empty strings to be saved.
      return Object.keys(obj).some(key => obj[key] !== null && obj[key] !== undefined);
    };

    // Helper function to sanitize data before sending
    // This function is no longer used with the simplified hasData check, but kept for potential future use.
    const sanitizeData = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
          // Special handling for specific fields
          if (key === 'id_number' || key.includes('id_number')) {
            // Only include if it's a valid 13-digit number
            if (typeof value === 'string' && /^\d{13}$/.test(value)) {
              sanitized[key] = value;
            }
          } else if (key === 'date_of_birth' || key === 'dob') {
            // Only include if it's a valid date string
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
              sanitized[key] = value;
            }
          } else if (key === 'gender') {
            // Only include if it's a valid gender
            if (typeof value === 'string' && ['male', 'female', 'other'].includes(value.toLowerCase())) {
              sanitized[key] = value.toLowerCase();
            }
          } else if (key.includes('mobile') || key.includes('email')) {
            // Basic validation for contact fields
            if (typeof value === 'string' && value.trim().length > 0) {
              sanitized[key] = value.trim();
            }
          } else if (typeof value === 'string') {
            // For other strings, trim and check length
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              sanitized[key] = trimmed;
            }
          } else if (typeof value === 'boolean' || typeof value === 'number') {
            // Include booleans and numbers as-is
            sanitized[key] = value;
          } else if (Array.isArray(value)) {
            // Include non-empty arrays
            if (value.length > 0) {
              sanitized[key] = value;
            }
          } else if (typeof value === 'object') {
            // Recursively sanitize nested objects
            const nested = sanitizeData(value);
            if (hasData(nested)) {
              sanitized[key] = nested;
            }
          }
        }
      }
      return sanitized;
    };

    if (hasData(data.student)) {
      filteredData.student = data.student;
    }
    if (hasData(data.medical)) {
      filteredData.medical = data.medical;
    }
    if (hasData(data.family)) {
      filteredData.family = data.family;
    }
    if (hasData(data.fee)) {
      filteredData.fee = data.fee;
    }

    // Only proceed if we have at least some data to save besides the application_id
    if (!hasData(filteredData) || Object.keys(filteredData).length <= 1) {
      console.log('Auto-save skipped: no valid data to save');
      return { message: 'No data to save', application_id: data.application_id };
    }

    const snakeCaseData = toSnakeCase(filteredData);

    // Ensure required fields are present
    if (snakeCaseData.student) {
      // Map dob to date_of_birth
      if (snakeCaseData.student.dob) {
        snakeCaseData.student.date_of_birth = new Date(snakeCaseData.student.dob).toISOString().split("T")[0];
        delete snakeCaseData.student.dob;
      }
      // Ensure gender is lowercase
      if (snakeCaseData.student.gender) {
        snakeCaseData.student.gender = snakeCaseData.student.gender.toLowerCase();
      }
    }
    // Handle empty strings for optional fields
    if (snakeCaseData.family) {
      if (snakeCaseData.family.mother_id_number === '') {
        snakeCaseData.family.mother_id_number = undefined;
      }
      if (snakeCaseData.family.mother_mobile === '') {
        snakeCaseData.family.mother_mobile = undefined;
      }
      if (snakeCaseData.family.mother_email === '') {
        snakeCaseData.family.mother_email = undefined;
      }
      
      // Next of kin fields - convert 'none' or empty strings to undefined
      const nokFields = ['next_of_kin_surname', 'next_of_kin_first_name', 'next_of_kin_relationship', 'next_of_kin_mobile', 'next_of_kin_email'];
      for (const field of nokFields) {
        const value = snakeCaseData.family[field];
        if (!value || value === '' || String(value).toLowerCase() === 'none') {
          snakeCaseData.family[field] = undefined;
        }
      }
    }

    console.log('Auto-saving data:', snakeCaseData);
    return this.request('/enrollment/auto-save', {
      method: 'POST',
      body: JSON.stringify(snakeCaseData),
    });
  }

  async submitFullApplication(applicationId: string, data: any): Promise<{ message: string; data: any }> {
    // Transform frontend data to match backend schema
    const transformedData = {
      application_id: applicationId,
      student: data.student ? {
        surname: data.student.surname || '',
        first_name: data.student.firstName || '',
        middle_name: data.student.middleName || null,
        preferred_name: data.student.preferredName || null,
        date_of_birth: data.student.date_of_birth || null,
        gender: data.student.gender || '',
        home_language: data.student.homeLanguage || '',
        id_number: data.student.idNumber || '',
        previous_grade: data.student.previousGrade || '',
        grade_applied_for: data.student.gradeAppliedFor || '',
        previous_school: data.student.previousSchool || ''
      } : null,
      medical: data.medical ? {
        medical_aid_name: data.medical.medicalAidName || null,
        member_number: data.medical.memberNumber || null,
        conditions: data.medical.conditions || [],
        allergies: data.medical.allergies || null
      } : null,
      family: data.family ? {
        father_surname: data.family.fatherSurname || null,
        father_first_name: data.family.fatherFirstName || null,
        father_id_number: data.family.fatherIdNumber || null,
        father_mobile: data.family.fatherMobile || null,
        father_email: data.family.fatherEmail || null,
        mother_surname: data.family.motherSurname || null,
        mother_first_name: data.family.motherFirstName || null,
        mother_id_number: data.family.motherIdNumber || null,
        mother_mobile: data.family.motherMobile || null,
        mother_email: data.family.motherEmail || null,
        // Add next_of_kin fields directly into the family object
        next_of_kin_surname: data.family.nextOfKinSurname || null,
        next_of_kin_first_name: data.family.nextOfKinFirstName || null,
        next_of_kin_relationship: data.family.nextOfKinRelationship || null,
        next_of_kin_mobile: data.family.nextOfKinMobile || null,
        next_of_kin_email: data.family.nextOfKinEmail || null
      } : null,
      fee: data.fee ? {
        fee_person: data.fee.feePerson || '',
        relationship: data.fee.relationship || '',
        fee_terms_accepted: data.fee.feeTermsAccepted || false,
        selected_plan: data.fee.selectedPlan || null
      } : null,
      academic_history: data.academicHistory ? {
        school_name: data.academicHistory.schoolName || '',
        school_type: data.academicHistory.schoolType || '',
        last_grade_completed: data.academicHistory.lastGradeCompleted || '',
        academic_year_completed: data.academicHistory.academicYearCompleted || '',
        reason_for_leaving: data.academicHistory.reasonForLeaving || null,
        principal_name: data.academicHistory.principalName || null,
        school_phone_number: data.academicHistory.schoolPhoneNumber || null,
        school_email: data.academicHistory.schoolEmail || null,
        school_address: data.academicHistory.schoolAddress || null,
        additional_notes: data.academicHistory.additionalNotes || null,
        report_card_url: data.academicHistory.reportCardUrl || null
      } : null,
      subjects: data.subjects || null,
      financing: data.financing || null,
      declaration: data.declaration || null
    };

    return this.request(`/enrollment/submit-application`, {
      method: 'POST',
      body: JSON.stringify(transformedData),
    });
  }

  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: any }> {
    // Use Supabase auth service
    const { authService } = await import('./auth');
    return authService.login(email, password);
  }

  async signup(full_name: string, email: string, password: string): Promise<{ access_token: string; token_type: string; user: any; message?: string }> {
    // Use Supabase auth service
    const { authService } = await import('./auth');
    return authService.signup(full_name, email, password);
  }

  async completeDocumentUpload(applicationId: string): Promise<{ message: string }> {
    return this.request('/documents/complete', {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId }),
    });
  }

  async runRiskCheck(request: any): Promise<any> {
    return this.request('/risk-check', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAcademicHistory(applicationId: string): Promise<any> {
    return this.request(`/academic/academic-history/${applicationId}`);
  }

  async submitDeclaration(data: any): Promise<{ message: string; application_id: string }> {
    return this.request('/enrollment/declaration', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitAcademicHistory(data: any): Promise<{ message: string; application_id: string }> {
    // Extract application_id from the payload (it's already snake_case)
    const { application_id, ...formData } = data;

    // Convert the form data to snake_case for the backend (already mostly snake_case, but ensure consistency)
    const snakeCaseData = toSnakeCase(formData);

    // Construct the final payload
    const payload = {
      application_id,
      ...snakeCaseData
    };
    
    console.log('API submitAcademicHistory - Extracted application_id:', application_id);
    console.log('API submitAcademicHistory - Form data:', formData);
    console.log('API submitAcademicHistory - Final payload:', payload);
    
    try {
      console.log('Starting API request to /academic/academic-history');
      const result = await this.request('/academic/academic-history', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('API submitAcademicHistory - Success:', result);
      return result;
    } catch (error) {
      console.error('API submitAcademicHistory - Error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
