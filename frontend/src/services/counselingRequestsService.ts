import { CounselingRequest, LeadStatus } from '../types';
import { apiService } from './apiService';

// Backend shape for list responses (see backend/controllers/counselingRequestsController.js)
export interface CounselingRequestsPage {
  results: CounselingRequest[];
  count: number;
  next: number | null;
  previous: number | null;
}

export interface CounselingRequestFilters {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  // 'true' = include archived alongside active, 'only' = archived only.
  // Omitted (default) = active (non-archived) only.
  includeArchived?: 'true' | 'only';
}

export interface ConvertToClientResult {
  id: string;
  email_sent: boolean;
  message: string;
  [key: string]: unknown;
}

class CounselingRequestsService {
  async list(filters?: CounselingRequestFilters): Promise<CounselingRequestsPage> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiService.get<CounselingRequestsPage>(
      `/counseling-requests?${params.toString()}`
    );
    // Backend returns the paginated shape directly (not wrapped in {success, data}).
    return (response.data || response) as unknown as CounselingRequestsPage;
  }

  async getById(id: string): Promise<CounselingRequest> {
    const response = await apiService.get<CounselingRequest>(`/counseling-requests/${id}`);
    return (response.data || response) as unknown as CounselingRequest;
  }

  async updateStatus(id: string, status: LeadStatus): Promise<CounselingRequest> {
    const response = await apiService.patch<CounselingRequest>(
      `/counseling-requests/${id}/status`,
      { status }
    );
    return (response.data || response) as unknown as CounselingRequest;
  }

  // "Delete" in the UI — soft-delete, recoverable via restore().
  async archive(id: string): Promise<CounselingRequest> {
    const response = await apiService.patch<CounselingRequest>(`/counseling-requests/${id}/archive`);
    return (response.data || response) as unknown as CounselingRequest;
  }

  async restore(id: string): Promise<CounselingRequest> {
    const response = await apiService.patch<CounselingRequest>(`/counseling-requests/${id}/restore`);
    return (response.data || response) as unknown as CounselingRequest;
  }

  async requestMoreInfo(id: string, note?: string): Promise<CounselingRequest> {
    const response = await apiService.post<CounselingRequest>(
      `/counseling-requests/${id}/request-info`,
      { note }
    );
    return (response.data || response) as unknown as CounselingRequest;
  }

  // Converts a request into a full Client record (Client Management). The
  // payload is the flat shape produced by mapPatientFormDataToApiPayload().
  async convertToClient(id: string, payload: Record<string, unknown>): Promise<ConvertToClientResult> {
    const response = await apiService.post<ConvertToClientResult>(
      `/counseling-requests/${id}/convert`,
      payload
    );
    return (response.data || response) as unknown as ConvertToClientResult;
  }
}

export const counselingRequestsService = new CounselingRequestsService();
