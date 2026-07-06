import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../services/publicApi';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Frontend validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setSubmitMessage('Please enter a valid name (at least 2 characters).');
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setSubmitMessage('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.subject || formData.subject === '') {
      setSubmitMessage('Please select a subject for your message.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setSubmitMessage('Please enter a message (at least 10 characters).');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('🚀 Sending contact form:', formData);
      console.log('🔗 API URL will be determined by apiService');
      
      // Call the actual API
      const response = await publicApi.sendContactMessage(formData);
      console.log('✅ Contact form response:', response);
      
      setSubmitMessage(response.message || 'Thank you for your message! We will respond within 24 hours.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      console.error('❌ Contact form error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method
        }
      });
      
      let errorMessage = 'Sorry, there was an error sending your message. Please try again or contact us directly via email.';
      
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. The server may be down or the URL is incorrect.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again in a few minutes.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setSubmitMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-shrm-primary to-shrm-primary-dark text-white py-20 px-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shrm-secondary animate-fade-in">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto animate-slide-up">
            We're here to help and answer any questions you may have. Reach out to us 
            and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-8 mb-16">
          {/* Contact Info Sidebar */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-shrm-primary to-shrm-primary-dark text-white rounded-3xl p-8 shadow-xl">
              <h2 className="text-3xl font-bold mb-6 text-shrm-secondary">Get in Touch</h2>
              
              {/* Office Location */}
              <div className="mb-8 pb-8 border-b border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-shrm-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                    📍
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-shrm-secondary">Office Location</h3>
                    <p className="text-gray-100 leading-relaxed">
                      We Offer telehealth services <br/> in person counseling can be aranged                       
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              {/*<div className="mb-8 pb-8 border-b border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-shrm-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                    📞
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-shrm-secondary">Phone</h3>
                    <p className="text-gray-100 leading-relaxed">
                      <strong className="text-white">Main Office:</strong> (555) 123-4567<br />
                      <strong className="text-white">Crisis Line:</strong> (555) 123-HELP<br />
                      <em className="text-gray-300 text-sm">Available 24/7 for emergencies</em>
                    </p>
                  </div>
                </div>
              </div>*/}

              {/* Email */}
              <div className="mb-8 pb-8 border-b border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-shrm-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                    ✉️
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-shrm-secondary">Email</h3>
                    <div className="text-gray-100 text-sm space-y-1">
                      <p><strong className="text-white">General:</strong> <a href="mailto:info@safehavenrestorationministries.com" className="underline hover:text-shrm-secondary transition-colors">info@safehavenrestorationministries.com</a></p>
                      <p><strong className="text-white">Appointments:</strong><Link to="/request-appointment"> Click here</Link></p>
                      {/*<p><strong className="text-white">Crisis:</strong> crisis@shrmcounseling.org</p>*/}
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-shrm-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                    🕒
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-shrm-secondary">Office Hours</h3>
                    <ul className="text-gray-100 space-y-2 text-sm">
                      <li className="flex justify-between gap-4">
                        <strong className="text-white">Monday - Friday:</strong>
                        <span>9:00 AM - 7:00 PM</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <strong className="text-white">Saturday:</strong>
                        <span>10:00 AM - 4:00 PM</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <strong className="text-white">Sunday:</strong>
                        <span>Closed</span>
                      </li>
                      {/*<li className="flex justify-between gap-4 pt-2 border-t border-white/20">
                        <strong className="text-shrm-secondary">Emergency:</strong>
                        <span className="text-shrm-secondary font-bold">24/7</span>
                      </li>*/}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3 animate-slide-up">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
              <h2 className="text-3xl font-bold text-shrm-primary mb-6">Send Us a Message</h2>
              
              {submitMessage && (
                <div className={`mb-6 p-4 rounded-xl ${
                  submitMessage.includes('Thank you') 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-shrm-primary mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-shrm-secondary focus:ring-2 focus:ring-shrm-secondary/20 transition-all duration-200 outline-none"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email and Phone Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-shrm-primary mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-shrm-secondary focus:ring-2 focus:ring-shrm-secondary/20 transition-all duration-200 outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-shrm-primary mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-shrm-secondary focus:ring-2 focus:ring-shrm-secondary/20 transition-all duration-200 outline-none"
                      placeholder="Your phone number (optional)"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-shrm-primary mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-shrm-secondary focus:ring-2 focus:ring-shrm-secondary/20 transition-all duration-200 outline-none bg-white"
                  >
                    <option value="">Select a subject...</option>
                    <option value="appointment">Appointment Inquiry</option>
                    <option value="services">Services Information</option>
                    <option value="insurance">Insurance Questions</option>
                    <option value="crisis">Crisis Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-shrm-primary mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please share your message, questions, or concerns..."
                    rows={6}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-shrm-secondary focus:ring-2 focus:ring-shrm-secondary/20 transition-all duration-200 outline-none resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-shrm-primary to-shrm-secondary hover:from-shrm-primary-dark hover:to-shrm-secondary-dark'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Crisis Notice */}
       {/*} <div className="animate-fade-in">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-3xl p-8 md:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl animate-pulse-slow">🚨</div>
              <div>
                <h2 className="text-3xl font-bold text-red-800 mb-4">Crisis Support</h2>
                <p className="text-lg text-red-700 leading-relaxed mb-6">
                  If you are experiencing a mental health crisis, having thoughts of self-harm, 
                  or are in immediate danger, please:
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📞</span>
                  <h3 className="font-bold text-red-800">24/7 Crisis Line</h3>
                </div>
                <p className="text-2xl font-bold text-red-600">JA: 888 (639-5433), USA: Call or text 988</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🆘</span>
                  <h3 className="font-bold text-red-800">Emergency</h3>
                </div>
                <p className="text-2xl font-bold text-red-600">JA: 119, USA & CA: 911, or the emergency number in your country</p>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-red-700">
                <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                <span>Go to your nearest emergency room</span>
              </li>
              <li className="flex items-center gap-3 text-red-700">
                <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                <span>Call the National Suicide Prevention Lifeline: <strong className="text-red-800">988</strong></span>
              </li>
            </ul>

            <div className="bg-red-100 rounded-xl p-4 text-center border border-red-300">
              <p className="text-red-800 font-medium text-lg">
                ❤️ Remember: You are not alone, and help is always available.
              </p>
            </div>
          </div>
        </div>*/}
      </div>
    </div>
  );
};

export default Contact;