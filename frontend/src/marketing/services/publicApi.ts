import { apiClient } from '../../services/apiClient';

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface AppointmentRequestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  sessionType: string;
  hasInsurance: boolean;
  insuranceProvider?: string;
  policyNumber?: string;
  isEmergency: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  reasonForCounseling: string;
  previousCounseling: boolean;
  medications: string;
  additionalInfo?: string;
}

export const publicApi = {
  sendContactMessage: async (data: ContactFormData) => {
    const response = await apiClient.post('/api/contact', data);
    return response.data;
  },

  createAppointmentRequest: async (data: AppointmentRequestData) => {
    const response = await apiClient.post('/api/appointment-requests', data);
    return response.data;
  },
};
