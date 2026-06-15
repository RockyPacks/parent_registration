const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Utility function to convert object keys from camelCase to snake_case recursively
export function toSnakeCase(obj: any): any {
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

// Utility function to convert object keys from snake_case to camelCase recursively
export function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
    result[camelKey] = toCamelCase(obj[key]);
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

export interface SchoolFees {
  id: string;
  grade: string;
  annualFee: number;
  termFee: number;
  registrationFee: number;
  reRegistrationFee: number;
  sportFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolConfig {
  id: string;
  name: string;
  short_name: string | null;
  school_key: string;
  email: string | null;
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
  branch_code: string | null;
  branch_name: string | null;
  payment_reference_format: string | null;
  active: boolean;
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
    email?: string;
    phone?: string;
  };
  medical: {
    homeLanguage?: string;
    allergies?: string;
    allergyActionRequired?: string;
    allergyStatus?: string;
    immunisationsUpToDate?: string;
    medicalAidScheme?: string;
    medicalAidNumber?: string;
    primaryMemberDetails?: string;
    learnerConditions?: string[];
    medicineNotToAdminister?: string;
    // Legacy fields for backward compatibility
    medicalAidName?: string;
    memberNumber?: string;
    conditions?: string[];
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
    bankName?: string;
    branchCode?: string;
    accountNumber?: string;
    accountType?: string;
  };
  next_of_kin?: any;
}

export interface PvseAnswerOption {
  answerId: string;
  answerText: string;
}

export interface PvseQuestion {
  questionId: string;
  questionText: string;
  answers: PvseAnswerOption[];
}

export interface PvseStartResponse {
  transactionId: string;
  result: string;
  questions: PvseQuestion[];
  message: string;
}

export interface PvseStatusResponse {
  transactionId?: string;
  result: string;
  score?: number | null;
  threshold?: number | null;
  lockedUntil?: string | null;
  verified: boolean;
  message: string;
}

export interface ConsentDisclosure {
  id: string;
  version: string;
  title: string;
  body: string;
  checks: string[];
  responsibleParty: string;
  operatorName: string;
  rights: string[];
}

export interface ConsentRecord {
  consentToken: string;
  consentedAt: string;
  disclosureVersion: string;
}

export interface ConsentConfigResponse {
  schoolKey: string;
  schoolName?: string | null;
  screeningEnabled: boolean;
  kbaEnabled: boolean;
  disclosure?: ConsentDisclosure | null;
  consent?: ConsentRecord | null;
}

export type ScreeningCheckStatus = 'pending' | 'not_run' | 'pass' | 'refer' | 'flagged' | 'error';
export type ScreeningOverallStatus = 'green' | 'amber' | 'red';

export interface ScreeningCheckResult {
  checkKey: string;
  checkName: string;
  status: ScreeningCheckStatus;
  summary: string;
  timestamp?: string | null;
  details?: string | null;
  actionLabel?: string | null;
  result?: Record<string, any> | null;
}

export interface ApplicantScreeningResults {
  applicationId: string;
  schoolKey?: string | null;
  schoolName?: string | null;
  overallStatus?: ScreeningOverallStatus | null;
  overallSummary?: string | null;
  checks: ScreeningCheckResult[];
  updatedAt?: string | null;
}

export type ScreeningCheckMode = 'mandatory' | 'advisory' | 'disabled';

export interface ScreeningCheckConfig {
  checkKey: string;
  checkName: string;
  mode: ScreeningCheckMode;
}

export interface ScreeningThresholdConfig {
  affordabilityMonthlyFeeBand?: 'school_default' | 'custom';
  affordabilityMonthlyFeeLabel?: string | null;
  creditDefaultSensitivity?: 'single_default_refers' | 'multiple_defaults_refer';
  riskLowMax?: number;
  riskMediumMax?: number;
}

export interface ScreeningDisclosureConfig {
  version: string;
  title: string;
  body: string;
  active: boolean;
  updatedAt?: string | null;
}

export interface ScreeningAdminConfig {
  schoolKey: string;
  schoolName?: string | null;
  checks: ScreeningCheckConfig[];
  thresholds: ScreeningThresholdConfig;
  disclosure: ScreeningDisclosureConfig;
  updatedAt?: string | null;
}

export interface ScreeningAuditLogEntry {
  id: string;
  applicationId?: string | null;
  checkKey: string;
  checkName: string;
  timestamp: string;
  experianReference?: string | null;
  resultSummary: string;
  status?: ScreeningCheckStatus | null;
}

export interface ScreeningConfigChangeLogEntry {
  id: string;
  changedBy: string;
  changedAt: string;
  changeSummary: string;
}

class ApiService {
  private sessionCache: { session: any; timestamp: number } | null = null;
  private schoolsCache: { data: any; timestamp: number } | null = null;
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

  async request<T>(endpoint: string, options?: RequestInit & { authenticated?: boolean }): Promise<T> {
    const { authenticated = true, ...fetchOptions } = options || {};
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('API request - URL:', url);
    console.log('API request - Method:', options?.method || 'GET');
    console.log('API request - Body:', options?.body);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      const session = await this.getCachedSession();
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Merge with any additional headers from options
    if (fetchOptions?.headers) {
      Object.assign(headers, fetchOptions.headers);
    }

    try {
      console.log('Fetching URL:', url);
      const response = await fetch(url, {
        headers,
        ...fetchOptions,
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
          // Clear cache but don't force sign out - let the app handle it gracefully
          this.sessionCache = null;
          throw new Error('Authentication required. Please log in again.');
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API response - Data:', data);
      return toCamelCase(data);
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
  async initiateApplication(): Promise<{ applicationId: string; status: string }> {
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
    console.log(`ApiService: Fetching uploaded files for application: ${applicationId}`);
    try {
      const result = await this.request<{ files: any[] }>(`/documents/${applicationId}/files`);
      console.log(`ApiService: Successfully fetched ${result.files?.length || 0} files for application: ${applicationId}`);
      if (result.files && result.files.length > 0) {
        console.log('ApiService: Sample file data:', result.files[0]);
      }
      return result;
    } catch (error) {
      console.error(`ApiService: Failed to fetch uploaded files for application ${applicationId}:`, error);
      throw error;
    }
  }

  async deleteFile(applicationId: string, fileId: string): Promise<{ message: string }> {
    return this.request(`/documents/${applicationId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async submitEnrollment(data: EnrollmentData): Promise<{ message: string; applicationId: string }> {
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
    if (snakeCaseData.application_details?.proposed_start_date === '') {
      snakeCaseData.application_details.proposed_start_date = undefined;
    }
    return this.request('/enrollment/submit', {
      method: 'POST',
      body: JSON.stringify(snakeCaseData),
    });
  }

  async autoSaveEnrollment(data: { application_id: string; student?: any; medical?: any; family?: any; fee?: any; application_details?: any; next_of_kin?: any }): Promise<{ message: string; applicationId: string }> {
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
    if (hasData(data.application_details)) {
      filteredData.application_details = data.application_details;
    }
    if (hasData(data.next_of_kin)) {
      filteredData.next_of_kin = data.next_of_kin;
    }

    // Only proceed if we have at least some data to save besides the application_id
    if (!hasData(filteredData) || Object.keys(filteredData).length <= 1) {
      console.log('Auto-save skipped: no valid data to save');
      return { message: 'No data to save', applicationId: data.application_id };
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
    if (snakeCaseData.application_details?.proposed_start_date === '') {
      snakeCaseData.application_details.proposed_start_date = undefined;
    }

    console.log('Auto-saving data:', snakeCaseData);
    return this.request('/enrollment/auto-save', {
      method: 'POST',
      body: JSON.stringify(snakeCaseData),
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

  async getAcademicHistory(applicationId: string): Promise<any> {
    return this.request(`/academic/academic-history/${applicationId}`);
  }

  async getDeclaration(applicationId: string): Promise<any> {
    return this.request(`/enrollment/declaration/${applicationId}`);
  }

  async submitDeclaration(data: any): Promise<{ message: string; applicationId: string }> {
    const snakeCaseData = toSnakeCase(data);
    return this.request('/enrollment/declaration', {
      method: 'POST',
      body: JSON.stringify(snakeCaseData),
    });
  }

  async submitAcademicHistory(data: any): Promise<{ message: string; applicationId: string }> {
    // Extract application_id from the payload (handle both snake_case and camelCase)
    const application_id = data.application_id || data.applicationId;
    const { application_id: _1, applicationId: _2, ...formData } = data;

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
      const result = await this.request<{ message: string; application_id: string }>('/academic/academic-history', {
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

  async submitApplication(applicationId: string, fullData?: any): Promise<{ message: string; applicationId: string }> {
    const payload: any = { application_id: applicationId };
    
    // Include full application data if provided
    if (fullData) {
      const snakeCaseData = toSnakeCase(fullData);
      
      if (snakeCaseData.student) {
        payload.student = snakeCaseData.student;
        // Map dob to date_of_birth for backend compatibility
        if (payload.student.dob) {
          payload.student.date_of_birth = new Date(payload.student.dob).toISOString().split("T")[0];
          delete payload.student.dob;
        }
        // Ensure gender is lowercase
        if (payload.student.gender) {
          payload.student.gender = payload.student.gender.toLowerCase();
        }
      }
      
      if (snakeCaseData.medical) {
        payload.medical = snakeCaseData.medical;
      }
      
      if (snakeCaseData.family) {
        payload.family = snakeCaseData.family;
        // Convert empty strings to undefined for all optional pattern-validated fields
        const patternFields = [
          'father_id_number', 'father_mobile',
          'mother_id_number', 'mother_mobile', 'mother_email',
          'next_of_kin_surname', 'next_of_kin_first_name', 'next_of_kin_relationship',
          'next_of_kin_mobile', 'next_of_kin_email', 'next_of_kin_id_number'
        ];
        for (const field of patternFields) {
          const value = payload.family[field];
          if (!value || value === '' || String(value).toLowerCase() === 'none') {
            payload.family[field] = undefined;
          }
        }
      }
      
      if (snakeCaseData.fee) {
        payload.fee = snakeCaseData.fee;
      }

      if (snakeCaseData.application_details) {
        payload.application_details = snakeCaseData.application_details;
        if (payload.application_details.proposed_start_date === '') {
          payload.application_details.proposed_start_date = undefined;
        }
      }
      
      if (snakeCaseData.academic_history) {
        payload.academic_history = snakeCaseData.academic_history;
      }
      
      if (snakeCaseData.declaration) {
        payload.declaration = snakeCaseData.declaration;
      }
    }
    
    return this.request<{ message: string; applicationId: string }>('/enrollment/submit-application', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get school fees for a specific class name
   * @param grade - Class name
   * @returns SchoolFees object with fee structure
   */
  async getSchoolFees(grade: string, schoolKey?: string): Promise<SchoolFees> {
    const params = new URLSearchParams({ grade });
    if (schoolKey) params.append('school_key', schoolKey);
    return this.request<SchoolFees>(`/fees/?${params.toString()}`);
  }

  async getSchoolConfig(schoolKey: string): Promise<SchoolConfig> {
    return this.request<SchoolConfig>(`/schools/config/${encodeURIComponent(schoolKey)}`);
  }

  /**
   * Get all school fees
   * @returns Array of all fee structures
   */
  async getAllSchoolFees(): Promise<SchoolFees[]> {
    return this.request<SchoolFees[]>('/fees/all');
  }

  /**
   * Get list of all schools (public endpoint)
   * @returns List of schools with id and schoolName
   */
  async getSchools(): Promise<{ data: Array<{ id: number, schoolName: string }>, count: number }> {
    const now = Date.now();
    if (this.schoolsCache && (now - this.schoolsCache.timestamp) < this.CACHE_DURATION) {
      return this.schoolsCache.data;
    }

    const result = await this.request<{ data: Array<{ id: number, schoolName: string }>, count: number }>('/schools', {
      authenticated: false
    });

    this.schoolsCache = { data: result, timestamp: now };
    return result;
  }

  /**
   * Get financing selection for an application.
   * @param applicationId - Application ID
   * @returns Financing selection data including selected plan
   */
  async getFinancingSelection(applicationId: string): Promise<any> {
    return this.request(`/financing/selection/${applicationId}`);
  }

  async getPvseStatus(applicationId: string): Promise<PvseStatusResponse> {
    return this.request<PvseStatusResponse>(`/pvse/status/${applicationId}`);
  }

  async startPvseVerification(applicationId: string): Promise<PvseStartResponse> {
    return this.request<PvseStartResponse>('/pvse/start', {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId }),
    });
  }

  async submitPvseAnswers(
    transactionId: string,
    answers: Array<{ questionId: string; answerId: string }>
  ): Promise<PvseStatusResponse> {
    return this.request<PvseStatusResponse>('/pvse/submit', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase({
        transactionId,
        answers,
      })),
    });
  }

  async adminPvseListLocked(): Promise<Array<{
    parentId: string;
    userId: string;
    transactionId: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const raw = await this.request<any[]>('/pvse/admin/locked');
    return (raw || []).map((r) => ({
      parentId: r.parent_id,
      userId: r.user_id,
      transactionId: r.transaction_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async adminPvseUnblock(parentId: string, reason: string): Promise<{ unblocked: boolean; message: string }> {
    return this.request('/pvse/admin/unblock', {
      method: 'POST',
      body: JSON.stringify({ parent_id: parentId, reason }),
    });
  }

  async getConsentConfig(applicationId: string): Promise<ConsentConfigResponse> {
    return this.request<ConsentConfigResponse>(`/consent/config/${applicationId}`);
  }

  async recordConsent(applicationId: string, disclosureVersion: string, accepted: boolean): Promise<ConsentRecord> {
    return this.request<ConsentRecord>('/consent/record', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase({
        applicationId,
        disclosureVersion,
        accepted,
      })),
    });
  }

  async getApplicantScreeningResults(applicationId: string): Promise<ApplicantScreeningResults> {
    return this.request<ApplicantScreeningResults>(`/screening/applications/${applicationId}/results`);
  }

  async getScreeningAdminConfig(schoolKey = 'ST_ANDREWS'): Promise<ScreeningAdminConfig> {
    return this.request<ScreeningAdminConfig>(`/screening/admin/config/${encodeURIComponent(schoolKey)}`);
  }

  async updateScreeningAdminConfig(schoolKey: string, config: Partial<ScreeningAdminConfig>): Promise<ScreeningAdminConfig> {
    return this.request<ScreeningAdminConfig>(`/screening/admin/config/${encodeURIComponent(schoolKey)}`, {
      method: 'PATCH',
      body: JSON.stringify(toSnakeCase(config)),
    });
  }

  async updateScreeningDisclosure(
    schoolKey: string,
    disclosure: Pick<ScreeningDisclosureConfig, 'title' | 'body'>
  ): Promise<ScreeningDisclosureConfig> {
    return this.request<ScreeningDisclosureConfig>(`/screening/admin/config/${encodeURIComponent(schoolKey)}/disclosure`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(disclosure)),
    });
  }

  async getScreeningAuditLog(params: { schoolKey?: string; applicationId?: string }): Promise<ScreeningAuditLogEntry[]> {
    const query = new URLSearchParams();
    if (params.schoolKey) query.set('school_key', params.schoolKey);
    if (params.applicationId) query.set('application_id', params.applicationId);
    return this.request<ScreeningAuditLogEntry[]>(`/screening/admin/audit-log?${query.toString()}`);
  }

  async getScreeningConfigChangeLog(schoolKey = 'ST_ANDREWS'): Promise<ScreeningConfigChangeLogEntry[]> {
    return this.request<ScreeningConfigChangeLogEntry[]>(
      `/screening/admin/config/${encodeURIComponent(schoolKey)}/change-log`
    );
  }
}

export const apiService = new ApiService();
