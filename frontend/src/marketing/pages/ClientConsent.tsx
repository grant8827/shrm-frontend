import React, { useRef, useState } from 'react';
import { publicApi } from '../services/publicApi';
import { validateField, handleApiError, showNotification } from '../utils/validation';
import SignaturePad, { SignaturePadHandle } from '../components/SignaturePad';

// SEC-1042 — digital onboarding & e-signature flow. A public, unauthenticated
// multi-step wizard: collect identity -> read & acknowledge the three
// mandatory forms (each gated behind actually opening the document) -> draw
// a signature -> submit for an immutable, timestamped consent record.

type WizardStep = 'info' | 'consents' | 'signature' | 'success';

interface ConsentItem {
  key: 'privacyPolicy' | 'treatmentAgreement' | 'hipaa';
  title: string;
  content: React.ReactNode;
}

const consentItems: ConsentItem[] = [
  {
    key: 'privacyPolicy',
    title: 'Privacy Policy Acknowledgment',
    content: (
      <>
        <p className="mb-2">I acknowledge that I have received and reviewed the Safe Haven Restoration Ministries Privacy Policy.</p>
        <p className="mb-2">I understand how my personal and health information is collected, stored, used, and protected, and I understand my rights regarding that information, including my right to request access to or correction of my records.</p>
        <p>I understand that I may withdraw this acknowledgment at any time by contacting the office in writing, without affecting services already provided.</p>
      </>
    ),
  },
  {
    key: 'treatmentAgreement',
    title: 'Treatment Agreement',
    content: (
      <>
        <p className="mb-2">This agreement outlines the terms of therapeutic treatment provided by Safe Haven Restoration Ministries.</p>
        <p className="mb-2"><strong>Appointments:</strong> Sessions are typically 50–60 minutes. Cancellations must be made at least 24 hours in advance to avoid a missed-appointment fee.</p>
        <p className="mb-2"><strong>Fees:</strong> I am responsible for all fees associated with treatment. Copays and deductibles are due at the time of service.</p>
        <p className="mb-2"><strong>Emergencies:</strong> In case of a mental health emergency, I will call 911, go to the nearest emergency room, or call the 988 Suicide &amp; Crisis Lifeline. Safe Haven is not an emergency service.</p>
        <p>I have the right to ask questions about my treatment and to end therapy at any time.</p>
      </>
    ),
  },
  {
    key: 'hipaa',
    title: 'HIPAA Authorization',
    content: (
      <>
        <p className="mb-2">This notice describes how medical and mental health information about me may be used and disclosed, and how I can access that information, in accordance with the Health Insurance Portability and Accountability Act (HIPAA).</p>
        <p className="mb-2"><strong>My rights:</strong> I have the right to request a copy of my record, request corrections, and request an accounting of certain disclosures.</p>
        <p className="mb-2"><strong>Our responsibilities:</strong> Safe Haven is required by law to maintain the privacy and security of my protected health information (PHI) and to notify me if a breach occurs.</p>
        <p>I authorize Safe Haven to use and disclose my PHI for treatment, payment, and healthcare operations as permitted by law.</p>
      </>
    ),
  },
];

const ClientConsent: React.FC = () => {
  const [step, setStep] = useState<WizardStep>('info');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [readDocument, setReadDocument] = useState<Record<ConsentItem['key'], boolean>>({
    privacyPolicy: false,
    treatmentAgreement: false,
    hipaa: false,
  });
  const [accepted, setAccepted] = useState<Record<ConsentItem['key'], boolean>>({
    privacyPolicy: false,
    treatmentAgreement: false,
    hipaa: false,
  });
  const [openModal, setOpenModal] = useState<ConsentItem['key'] | null>(null);

  const signaturePadRef = useRef<SignaturePadHandle>(null);
  const [signatureEmpty, setSignatureEmpty] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const allConsentsChecked = consentItems.every((item) => accepted[item.key]);

  const handleContinueFromInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const nameValidation = validateField('Full legal name', fullName, ['required']);
    if (!nameValidation.isValid || fullName.trim().length < 2) {
      setFieldError('Please enter your full legal name.');
      return;
    }
    const emailValidation = validateField('Email', email, ['required', 'email']);
    if (!emailValidation.isValid) {
      setFieldError(emailValidation.error || 'Please enter a valid email address.');
      return;
    }

    setStep('consents');
  };

  const handleCloseModal = (key: ConsentItem['key']) => {
    setReadDocument((prev) => ({ ...prev, [key]: true }));
    setOpenModal(null);
  };

  const handleSubmit = async () => {
    if (signaturePadRef.current?.isEmpty()) {
      setSubmitError('Please sign the pad before submitting.');
      return;
    }
    const signatureImage = signaturePadRef.current?.toDataURL();
    if (!signatureImage) {
      setSubmitError('Please sign the pad before submitting.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await publicApi.submitClientConsent({
        fullName: fullName.trim(),
        email: email.trim(),
        privacyPolicyAccepted: accepted.privacyPolicy,
        treatmentAgreementAccepted: accepted.treatmentAgreement,
        hipaaAuthorizationAccepted: accepted.hipaa,
        signatureImage,
      });
      setSignedAt(response.signedAt || new Date().toISOString());
      setStep('success');
      showNotification('Consent forms submitted successfully!', 'success');
    } catch (error) {
      const message = handleApiError(error);
      setSubmitError(message);
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepIndex = { info: 0, consents: 1, signature: 2, success: 3 }[step];

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-shrm-primary mb-3">
            Client Onboarding &amp; Consent Forms
          </h1>
          <p className="text-neutral-600">
            Please review and electronically sign the required forms below. This should take about five minutes.
          </p>
        </div>

        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['Your Info', 'Consents', 'Signature'].map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx <= stepIndex ? 'bg-shrm-primary text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`text-sm hidden sm:inline ${idx <= stepIndex ? 'text-shrm-primary font-semibold' : 'text-neutral-400'}`}>
                  {label}
                </span>
                {idx < 2 && <div className="w-8 h-px bg-neutral-300" />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'info' && (
            <form onSubmit={handleContinueFromInfo} className="space-y-5">
              <h2 className="text-xl font-bold text-shrm-primary mb-2">Your Information</h2>
              {fieldError && (
                <div className="p-3 rounded-lg bg-red-50 border-l-4 border-red-500 text-red-800 text-sm">{fieldError}</div>
              )}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-shrm-secondary focus:border-shrm-primary transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-shrm-primary text-white font-bold py-3 px-8 rounded-full hover:bg-shrm-primary-dark transition-colors"
              >
                Continue
              </button>
            </form>
          )}

          {step === 'consents' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-shrm-primary mb-2">Required Consents</h2>
              <p className="text-sm text-neutral-500 mb-4">
                Open and read each document below. The checkbox unlocks once you've reviewed it.
              </p>

              {consentItems.map((item) => (
                <div key={item.key} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-semibold text-neutral-800">{item.title}</span>
                    <button
                      type="button"
                      onClick={() => setOpenModal(item.key)}
                      className="text-sm font-semibold text-shrm-primary border border-shrm-primary rounded-full px-4 py-1.5 hover:bg-shrm-primary hover:text-white transition-colors whitespace-nowrap"
                    >
                      📄 Read Document
                    </button>
                  </div>
                  <label className={`flex items-start gap-2 text-sm ${readDocument[item.key] ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    <input
                      type="checkbox"
                      checked={accepted[item.key]}
                      disabled={!readDocument[item.key]}
                      onChange={(e) => setAccepted((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <span>
                      I have read and agree to the {item.title}.
                      {!readDocument[item.key] && ' (Open the document above to unlock this.)'}
                    </span>
                  </label>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="flex-1 border border-neutral-300 text-neutral-700 font-semibold py-3 rounded-full hover:bg-neutral-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!allConsentsChecked}
                  onClick={() => setStep('signature')}
                  className="flex-1 bg-shrm-primary text-white font-bold py-3 rounded-full hover:bg-shrm-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'signature' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-shrm-primary mb-2">Sign Below</h2>
              <p className="text-sm text-neutral-500">
                By signing, you are electronically signing all three documents acknowledged in the previous step.
              </p>

              <SignaturePad ref={signaturePadRef} onChange={setSignatureEmpty} />
              <button
                type="button"
                onClick={() => signaturePadRef.current?.clear()}
                className="text-sm font-semibold text-shrm-primary underline"
              >
                Clear Pad
              </button>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border-l-4 border-red-500 text-red-800 text-sm">{submitError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('consents')}
                  disabled={isSubmitting}
                  className="flex-1 border border-neutral-300 text-neutral-700 font-semibold py-3 rounded-full hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={signatureEmpty || isSubmitting}
                  onClick={() => void handleSubmit()}
                  className="flex-1 bg-shrm-primary text-white font-bold py-3 rounded-full hover:bg-shrm-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Encrypting &amp; Submitting...
                    </>
                  ) : (
                    '🔒 Submit Signature'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-5 py-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-2xl font-bold text-shrm-primary">You're All Set!</h2>
              <p className="text-neutral-600">
                Thank you, {fullName.trim()}. Your consent forms have been securely submitted and signed.
              </p>
              <div className="bg-neutral-50 rounded-lg p-4 text-left text-sm space-y-2 max-w-md mx-auto">
                <p><strong>Name:</strong> {fullName.trim()}</p>
                <p><strong>Email:</strong> {email.trim()}</p>
                <p><strong>Signed at:</strong> {signedAt ? new Date(signedAt).toLocaleString() : ''}</p>
                <div className="pt-2 border-t border-neutral-200 mt-2">
                  {consentItems.map((item) => (
                    <p key={item.key} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span> {item.title}
                    </p>
                  ))}
                </div>
              </div>
              <p className="text-sm text-neutral-500">
                A member of our team will follow up if any further information is needed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Document reading modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-shrm-primary">
                {consentItems.find((i) => i.key === openModal)?.title}
              </h3>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-neutral-700 leading-relaxed">
              {consentItems.find((i) => i.key === openModal)?.content}
            </div>
            <div className="p-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => handleCloseModal(openModal)}
                className="w-full bg-shrm-primary text-white font-bold py-3 rounded-full hover:bg-shrm-primary-dark transition-colors"
              >
                I've Read This Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientConsent;
