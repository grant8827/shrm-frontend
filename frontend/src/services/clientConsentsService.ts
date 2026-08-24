import { apiService } from './apiService';

// Backend shape (see backend/controllers/clientConsentsController.js)
export interface ClientConsentListItem {
  id: string;
  fullName: string;
  email: string;
  patientId: string | null;
  privacyPolicyAccepted: boolean;
  treatmentAgreementAccepted: boolean;
  hipaaAuthorizationAccepted: boolean;
  signedAt: string;
  createdAt: string;
}

export interface ClientConsentDetail extends ClientConsentListItem {
  signatureImage: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ClientConsentsPage {
  results: ClientConsentListItem[];
  count: number;
  next: number | null;
  previous: number | null;
}

export interface ClientConsentFilters {
  page?: number;
  limit?: number;
  search?: string;
}

class ClientConsentsService {
  async list(filters?: ClientConsentFilters): Promise<ClientConsentsPage> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiService.get<ClientConsentsPage>(`/client-consents?${params.toString()}`);
    return (response.data || response) as unknown as ClientConsentsPage;
  }

  async getById(id: string): Promise<ClientConsentDetail> {
    const response = await apiService.get<ClientConsentDetail>(`/client-consents/${id}`);
    return (response.data || response) as unknown as ClientConsentDetail;
  }
}

export const clientConsentsService = new ClientConsentsService();
