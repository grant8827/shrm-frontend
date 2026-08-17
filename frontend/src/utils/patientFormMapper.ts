// Shared mapping from AddPatientForm's nested form shape to the flat
// payload the backend's /patients (and /counseling-requests/:id/convert)
// endpoints expect. Extracted so Client Management's "Add Client" and the
// Counseling Requests "Add as Client" action stay in sync.

import { CounselingRequest } from '../types';

export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
    email: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    memberID: string;
    effectiveDate: Date | null;
  };
  medical: {
    primaryDiagnosis: string;
    secondaryDiagnoses: string[];
    allergies: string[];
    medications: string[];
    primaryTherapist: string;
    referringPhysician: string;
    medicalHistory: string;
  };
  compliance: {
    consentForms: boolean;
    privacyPolicy: boolean;
    treatmentAgreement: boolean;
    hipaaAuthorization: boolean;
  };
}

const GENDER_MAP: Record<string, string> = {
  male: 'M',
  female: 'F',
  m: 'M',
  f: 'F',
};

// Backend requires a username but the form doesn't collect one — derive it
// from the applicant's name, same as Client Management has always done.
export const generateUsernameFromName = (firstName: string, lastName: string): string =>
  `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');

export const mapPatientFormDataToApiPayload = (formData: PatientFormData): Record<string, unknown> => {
  const username = generateUsernameFromName(formData.firstName, formData.lastName);

  return {
    // Required user fields
    username,
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    phoneNumber: formData.phone,

    // Patient fields
    dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : '',
    gender: GENDER_MAP[formData.gender.toLowerCase()],

    // Address
    street: formData.address.street,
    city: formData.address.city,
    state: formData.address.state,
    zipCode: formData.address.zipCode,

    // Emergency contact
    emergencyContactName: formData.emergencyContact.name,
    emergencyContactPhone: formData.emergencyContact.phone,
    emergencyContactRelationship: formData.emergencyContact.relationship,
    emergencyContactEmail: formData.emergencyContact.email,

    // Insurance
    insuranceProvider: formData.insurance.provider,
    insurancePolicyNumber: formData.insurance.policyNumber,
    insuranceGroupNumber: formData.insurance.groupNumber,
    insuranceMemberID: formData.insurance.memberID,

    // Medical
    medicalHistory: formData.medical.medicalHistory,
    allergies: formData.medical.allergies.join(', '),
    primaryDiagnosis: formData.medical.primaryDiagnosis,
  };
};

// Pre-fills the "Add as Client" intake form from a Counseling Request
// submission — everything the request already captured is carried over;
// fields the request form never asked for (gender, address, primary
// diagnosis, emergency contact relationship, etc.) are left blank for staff
// to fill in before submitting.
export const buildPatientFormDataFromCounselingRequest = (
  request: CounselingRequest
): Partial<PatientFormData> => ({
  firstName: request.firstName,
  lastName: request.lastName,
  email: request.email,
  phone: request.phone,
  dateOfBirth: request.dateOfBirth ? new Date(request.dateOfBirth) : null,
  emergencyContact: {
    name: request.emergencyContactName || '',
    phone: request.emergencyContactPhone || '',
    relationship: '',
    email: '',
  },
  insurance: {
    provider: request.insuranceProvider || '',
    policyNumber: request.policyNumber || '',
    groupNumber: '',
    memberID: '',
    effectiveDate: null,
  },
  medical: {
    primaryDiagnosis: '',
    secondaryDiagnoses: [],
    allergies: [],
    medications: request.medications ? [request.medications] : [],
    primaryTherapist: '',
    referringPhysician: '',
    medicalHistory: [
      `Reason for counseling: ${request.reasonForCounseling}`,
      request.previousCounseling ? 'Has had previous counseling.' : 'No previous counseling reported.',
      request.additionalInfo ? `Additional info from request: ${request.additionalInfo}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  },
});
