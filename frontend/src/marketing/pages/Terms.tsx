import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-shrm-primary to-shrm-primary-dark text-white py-20 px-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shrm-secondary animate-fade-in">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-100 max-w-3xl mx-auto animate-slide-up">
            Please read these terms carefully before using our website or services.
          </p>
          <p className="text-sm text-gray-300 mt-4">Last updated: April 4, 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-10">

          {/* Acceptance */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using the Safe Haven Restoration Ministries (SHRM) website located
              at this address, you agree to be bound by these Terms of Service. If you do not agree
              to these terms, please do not use this website. These terms apply to all visitors,
              users, and others who access or use the site.
            </p>
          </section>

          {/* About Our Services */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              2. About Our Services
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Safe Haven Restoration Ministries provides faith-based Christian counseling services,
              including individual counseling, couples counseling, family therapy, group sessions,
              and telehealth sessions. This website serves as an informational platform and allows
              users to request appointments and contact our team.
            </p>
          </section>

          {/* Not a Crisis Service */}
          {/*<section>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-red-700 mb-4 pb-2">
                3. Not a Crisis or Emergency Service
              </h2>
              <p className="text-red-800 leading-relaxed font-medium">
                THIS WEBSITE AND ITS CONTACT FORMS ARE NOT MONITORED 24/7 AND ARE NOT INTENDED
                FOR EMERGENCIES OR CRISIS SITUATIONS.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                If you or someone you know is in immediate danger or experiencing a mental health
                crisis, please:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
                <li>Call <strong>911</strong> for immediate emergencies</li>
                <li>Call or text the <strong>988 Suicide & Crisis Lifeline</strong> (dial 988)</li>
                <li>Go to your nearest emergency room</li>
              </ul>
            </div>
          </section>*/}

          {/* Use of Website */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              4. Acceptable Use
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to use this website only for lawful purposes and in a manner that does not
              infringe the rights of others. You must not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Submit false, misleading, or fraudulent information through our forms</li>
              <li>Attempt to gain unauthorized access to any part of the website or its systems</li>
              <li>Use automated tools to scrape, crawl, or harvest data from this website</li>
              <li>Transmit any harmful, offensive, or disruptive content</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          {/* Appointments */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              5. Appointment Requests
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Submitting an appointment request through this website does not guarantee a confirmed
              appointment. All appointments are subject to availability and confirmation by our
              staff. By requesting an appointment, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate and truthful information in your request</li>
              <li>Notify us as soon as possible if you need to cancel or reschedule</li>
              <li>Understand that repeated no-shows may affect your ability to book future appointments</li>
            </ul>
          </section>

          {/* Telehealth */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              6. Telehealth Services
            </h2>
            <p className="text-gray-700 leading-relaxed">
              SHRM offers telehealth counseling sessions conducted via secure video or phone
              platforms. By utilizing telehealth services, you acknowledge the following:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-4">
              <li>Telehealth sessions are subject to the same confidentiality standards as in-person sessions</li>
              <li>You are responsible for ensuring a private, secure environment during your session</li>
              <li>Technical difficulties may occasionally disrupt sessions; your counselor will work with you to reschedule or reconnect</li>
              <li>Telehealth may not be appropriate for all situations; your counselor will advise if in-person sessions are recommended</li>
            </ul>
          </section>

          {/* No Therapeutic Relationship */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              7. Website Content Is Not Therapy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The content on this website — including blog posts, articles, and informational pages
              — is provided for general informational and educational purposes only. It does not
              constitute professional counseling, therapy, medical advice, or the establishment of
              a therapeutic relationship. For professional support, please{' '}
              <Link to="/request-appointment" className="text-shrm-primary font-medium underline hover:text-shrm-primary-dark transition-colors">
                book an appointment
              </Link>{' '}
              with one of our counselors.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              8. Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All content on this website — including text, images, logos, graphics, and design —
              is the property of Safe Haven Restoration Ministries or its content suppliers and is
              protected by applicable copyright and intellectual property laws. You may not
              reproduce, distribute, or create derivative works without our express written
              permission.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              9. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To the fullest extent permitted by law, Safe Haven Restoration Ministries shall not
              be liable for any indirect, incidental, special, or consequential damages arising
              from your use of this website or reliance on its content. The website is provided "as
              is" without warranties of any kind, either express or implied.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              10. Third-Party Links
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This website may contain links to third-party websites. These links are provided for
              your convenience only. SHRM does not endorse and is not responsible for the content,
              privacy practices, or accuracy of any third-party site.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              11. Changes to These Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to update or modify these Terms of Service at any time. Changes
              will be posted on this page with a revised "Last updated" date. Your continued use of
              the website after any changes constitutes your acceptance of the new terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              12. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service are governed by and construed in accordance with the laws of
              the United States. Any disputes arising from these terms or your use of this website
              shall be subject to the exclusive jurisdiction of the applicable courts.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              13. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gradient-to-br from-shrm-primary/5 to-shrm-secondary/5 rounded-2xl p-6 border border-shrm-secondary/20">
              <p className="text-gray-800 font-semibold">Safe Haven Restoration Ministries</p>
              <p className="text-gray-700 mt-1">
                Email:{' '}
                <a
                  href="mailto:info@safehavenrestorationministries.com"
                  className="text-shrm-primary font-medium underline hover:text-shrm-primary-dark transition-colors"
                >
                  info@safehavenrestorationministries.com
                </a>
              </p>
              <p className="text-gray-700 mt-1">
                Or use our{' '}
                <Link to="/contact" className="text-shrm-primary font-medium underline hover:text-shrm-primary-dark transition-colors">
                  Contact Form
                </Link>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Terms;
