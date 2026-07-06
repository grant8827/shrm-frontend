import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-shrm-primary to-shrm-primary-dark text-white py-20 px-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shrm-secondary animate-fade-in">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-100 max-w-3xl mx-auto animate-slide-up">
            Your privacy and confidentiality are sacred to us. Please read how we collect,
            use, and protect your information.
          </p>
          <p className="text-sm text-gray-300 mt-4">Last updated: April 4, 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-10">

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Safe Haven Restoration Ministries (SHRM) is committed to
              protecting your privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you visit our website or use our services. As a
              faith-based counseling organization, we hold your personal and sensitive information
              with the highest level of care and confidentiality.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By using this website or submitting information through our forms, you consent to the
              practices described in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              2. Information We Collect
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may collect the following types of personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Contact Information:</strong> Your name, email address, and phone number when you submit a contact or appointment form.</li>
              <li><strong>Appointment Details:</strong> Preferred dates, times, service type, and any notes you provide when requesting an appointment.</li>
              <li><strong>Account Information:</strong> If you create an account, your login credentials (email and encrypted password).</li>
              <li><strong>Usage Data:</strong> Non-personal data such as browser type, pages visited, and time spent on the site, collected automatically via standard web technologies.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do <strong>not</strong> collect sensitive clinical or therapy session notes through this website.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Respond to your inquiries and contact form submissions</li>
              <li>Schedule and manage counseling appointments</li>
              <li>Send appointment confirmations and reminders</li>
              <li>Provide information about our services that you have requested</li>
              <li>Improve the functionality and experience of our website</li>
              <li>Comply with applicable legal and ethical obligations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We will <strong>never</strong> use your information for unsolicited marketing or sell
              it to third parties for advertising purposes.
            </p>
          </section>

          {/* Confidentiality */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              4. Confidentiality
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We understand that reaching out for counseling requires trust. All information shared
              through this website is treated with strict confidentiality. Our counselors and staff
              are bound by professional ethical standards regarding client privacy.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Information may only be disclosed without your consent in the limited circumstances
              required by law, such as when there is an immediate risk of harm to you or others,
              or where mandated by applicable statutes.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              5. Sharing of Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information. We may share your
              information only in the following limited circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Trusted third-party vendors who help us operate our website (e.g., email delivery services), bound by confidentiality agreements.</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong>Safety:</strong> When disclosure is necessary to protect the safety of you or another person.</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              6. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement reasonable technical and organizational measures to protect your personal
              information from unauthorized access, disclosure, alteration, or destruction. Passwords
              are encrypted and never stored in plain text. However, no method of transmission over
              the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              7. Cookies & Tracking
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our website may use cookies and similar tracking technologies to enhance your browsing
              experience. These are small files stored on your device that help the site remember
              your preferences. You may disable cookies in your browser settings; however, some
              features of the site may not function as expected.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              8. Children's Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our website is not directed to children under the age of 13. We do not knowingly
              collect personal information from children. If you believe a child has provided us
              with personal information, please contact us immediately so we can remove it.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              9. Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Request access to the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal information (subject to legal obligations)</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise any of these rights, please contact us using the information below.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on
              this page with a revised "Last updated" date. We encourage you to review this policy
              periodically to stay informed.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-shrm-primary mb-4 border-b-2 border-shrm-secondary/30 pb-2">
              11. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions or concerns about this Privacy Policy or how we handle your
              information, please reach out to us:
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

export default Privacy;
