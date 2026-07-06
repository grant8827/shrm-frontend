import React, { useState } from 'react';
import { publicApi } from '../services/publicApi';
import { validateField, handleApiError, showNotification } from '../utils/validation';

interface AppointmentForm {
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
  insuranceProvider: string;
  policyNumber: string;
  isEmergency: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  reasonForCounseling: string;
  previousCounseling: boolean;
  medications: string;
  additionalInfo: string;
}

const Appointments: React.FC = () => {
  const [formData, setFormData] = useState<AppointmentForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    sessionType: 'in-person',
    hasInsurance: false,
    insuranceProvider: '',
    policyNumber: '',
    isEmergency: false,
    emergencyContactName: '',
    emergencyContactPhone: '',
    reasonForCounseling: '',
    previousCounseling: false,
    medications: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'serviceType', 'preferredDate', 'preferredTime', 'reasonForCounseling'];
      
      for (const field of requiredFields) {
        const value = formData[field as keyof AppointmentForm];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          throw new Error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
      }

      // Validate email format
      const emailValidation = validateField('Email', formData.email, ['email']);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
      }

      // Validate phone format
      const phoneValidation = validateField('Phone', formData.phone, ['phone']);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error);
      }

      // Submit to API
      const response = await publicApi.createAppointmentRequest(formData);
      console.log('Appointment submitted:', response);
      
      setSubmitMessage(response.message || 'Thank you! Your appointment request has been submitted successfully. We will contact you within 24 hours to confirm your appointment.');
      showNotification('Appointment request submitted successfully!', 'success');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        serviceType: '',
        preferredDate: '',
        preferredTime: '',
        sessionType: 'in-person',
        hasInsurance: false,
        insuranceProvider: '',
        policyNumber: '',
        isEmergency: false,
        emergencyContactName: '',
        emergencyContactPhone: '',
        reasonForCounseling: '',
        previousCounseling: false,
        medications: '',
        additionalInfo: ''
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setSubmitMessage(`Error: ${errorMessage}`);
      showNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-shrm-primary to-shrm-primary-dark text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-shrm-secondary mb-4">
            Schedule Your Counseling Appointment
          </h1>
          <p className="text-lg md:text-xl text-neutral-100 max-w-3xl mx-auto">
            Take the first step toward healing and restoration. Complete the form below and we'll contact you within 24 hours to confirm your session details.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form - 2/3 width */}
          <div className="lg:col-span-2">
            {submitMessage && (
              <div className={`mb-6 p-4 rounded-xl ${submitMessage.includes('Thank you') ? 'bg-green-50 border-l-4 border-green-500 text-green-800' : 'bg-red-50 border-l-4 border-red-500 text-red-800'}`}>
                <p className="font-semibold">{submitMessage}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-shrm-primary mb-6 flex items-center gap-2">
                <span className="text-3xl">📋</span>
                Counseling Request Form
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary pb-2">
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <h3 className="text-lg font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary pb-2">
                    Appointment Details
                  </h3>
                  
                  <div className="mb-4">
                    <label htmlFor="serviceType" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Type of Counseling Service <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                      required
                    >
                      <option value="">Select a service...</option>
                      <option value="individual-counseling">Individual Counseling</option>
                      <option value="couples-counseling">Couples Counseling</option>
                      <option value="family-counseling">Family Counseling</option>
                      <option value="group-therapy">Group Therapy</option>
                      <option value="christian-counseling">Christian Counseling</option>
                      <option value="crisis-intervention">Crisis Intervention</option>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="preferredDate" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Preferred Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="preferredTime" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Preferred Time <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="preferredTime"
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        required
                      >
                        <option value="">Select a time...</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="sessionType" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Session Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="sessionType"
                      name="sessionType"
                      value={formData.sessionType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                      required
                    >
                      <option value="in-person">💼 In-Person at Our Office</option>
                      <option value="video-call">💻 Video Call (Telehealth)</option>
                      {/* <option value="phone-call">📞 Phone Call</option> */}
                    </select>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="reasonForCounseling" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Primary Reason for Visit <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="reasonForCounseling"
                      name="reasonForCounseling"
                      value={formData.reasonForCounseling}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                      required
                    >
                      <option value="">Select reason...</option>
                      <option value="anxiety">Anxiety</option>
                      <option value="depression">Depression</option>
                      <option value="relationship-issues">Relationship Issues</option>
                      <option value="marriage-counseling">Marriage Counseling</option>
                      <option value="trauma">Trauma/PTSD</option>
                      <option value="grief">Grief/Loss</option>
                      <option value="stress">Stress Management</option>
                      <option value="addiction">Addiction/Recovery</option>
                      <option value="family-conflict">Family Conflict</option>
                      <option value="spiritual">Spiritual Struggles</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Insurance Information */}
                <div>
                  <h3 className="text-lg font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary pb-2">
                    Insurance & Payment
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Do you have health insurance? <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="hasInsurance"
                          value="true"
                          checked={formData.hasInsurance === true}
                          onChange={() => setFormData(prev => ({ ...prev, hasInsurance: true }))}
                          className="mr-2"
                        />
                        Yes, I have insurance
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="hasInsurance"
                          value="false"
                          checked={formData.hasInsurance === false}
                          onChange={() => setFormData(prev => ({ ...prev, hasInsurance: false }))}
                          className="mr-2"
                        />
                        No, I will pay out-of-pocket
                      </label>
                    </div>
                  </div>

                  {formData.hasInsurance === true && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="insuranceProvider" className="block text-sm font-semibold text-neutral-700 mb-2">
                          Insurance Provider Name
                        </label>
                        <input
                          type="text"
                          id="insuranceProvider"
                          name="insuranceProvider"
                          value={formData.insuranceProvider}
                          onChange={handleChange}
                          placeholder="e.g., Blue Cross Blue Shield"
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="policyNumber" className="block text-sm font-semibold text-neutral-700 mb-2">
                          Policy Number
                        </label>
                        <input
                          type="text"
                          id="policyNumber"
                          name="policyNumber"
                          value={formData.policyNumber}
                          onChange={handleChange}
                          placeholder="Policy/Member ID"
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Medical History */}
                <div>
                  <h3 className="text-lg font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary pb-2">
                    Medical History
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Have you received counseling before?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="previousCounseling"
                            checked={formData.previousCounseling === true}
                            onChange={() => setFormData(prev => ({ ...prev, previousCounseling: true }))}
                            className="mr-2"
                          />
                          Yes
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="previousCounseling"
                            checked={formData.previousCounseling === false}
                            onChange={() => setFormData(prev => ({ ...prev, previousCounseling: false }))}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="medications" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Current Medications (if any)
                      </label>
                      <textarea
                        id="medications"
                        name="medications"
                        value={formData.medications}
                        onChange={handleChange}
                        placeholder="Please list any current medications or write 'None'"
                        rows={3}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Is this an emergency situation?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="isEmergency"
                            checked={formData.isEmergency === true}
                            onChange={() => setFormData(prev => ({ ...prev, isEmergency: true }))}
                            className="mr-2"
                          />
                          Yes - I need immediate assistance
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="isEmergency"
                            checked={formData.isEmergency === false}
                            onChange={() => setFormData(prev => ({ ...prev, isEmergency: false }))}
                            className="mr-2"
                          />
                          No - This is a regular appointment request
                        </label>
                      </div>
                      {formData.isEmergency && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700 text-sm">
                            <strong>If this is a mental health emergency, please call 911 or go to your nearest emergency room immediately.</strong>
                            <br />
                            For crisis support, you can also call the National Suicide Prevention Lifeline at 988.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary pb-2">
                    Emergency Contact
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="emergencyContactName" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        id="emergencyContactName"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        placeholder="Full name"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="emergencyContactPhone" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        id="emergencyContactPhone"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-semibold text-neutral-700 mb-2">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    placeholder="Please share any additional information that might help us prepare for your session..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-shrm-primary text-white font-bold py-4 px-8 rounded-full hover:bg-shrm-primary-dark transition-transform transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    '📅 Request Appointment'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="lg:col-span-1 space-y-6">
            {/* What to Expect */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-shrm-primary mb-4 flex items-center gap-2">
                <span className="text-2xl">ℹ️</span>
                What to Expect
              </h3>
              <ul className="space-y-3 text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="text-shrm-secondary mt-1">✓</span>
                  <span>We'll contact you within 24 hours to confirm</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-shrm-secondary mt-1">✓</span>
                  <span>First sessions typically last 60-90 minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-shrm-secondary mt-1">✓</span>
                  <span>Arrive 10 minutes early for paperwork</span>
                </li>
                {/*<li className="flex items-start gap-2">
                  <span className="text-shrm-secondary mt-1">✓</span>
                  <span>Bring valid ID and insurance card</span>
                </li>*/}
                <li className="flex items-start gap-2">
                  <span className="text-shrm-secondary mt-1">✓</span>
                  <span>All sessions are confidential and private</span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="bg-shrm-primary text-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-shrm-secondary mb-4 flex items-center gap-2">
                <span className="text-2xl">📞</span>
                Contact Us
              </h3>
              <div className="space-y-3">
                {/*<div>
                  <p className="text-neutral-200 text-sm">Phone</p>
                  <p className="font-bold text-lg">(555) 123-4567</p>
                </div>*/}
                <div>
                  <p className="text-neutral-200 text-sm">Email</p>
                  <p className="font-bold">info@safehavenrestorationministries.com</p>
                </div>
                <div>
                  <p className="text-neutral-200 text-sm">Hours</p>
                  <p className="font-bold">Mon-Fri: 9am - 6pm</p>
                  <p className="text-sm">Sat: 10am - 2pm</p>
                </div>
              </div>
            </div>

            {/* Crisis Support */}
            {/*<div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                Crisis Support
              </h3>
              <p className="text-red-700 text-sm mb-3">
                If you are experiencing a mental health crisis or having thoughts of self-harm:
              </p>
              <p className="text-red-900 font-bold mb-2">
                Call our 24/7 crisis line:<br/>
                <span className="text-xl">(555) 123-HELP</span>
              </p>
              <p className="text-red-700 text-xs">
                Or go to your nearest emergency room immediately.
              </p>
            </div>*/}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;