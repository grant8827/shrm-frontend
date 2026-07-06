import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Safe Haven Restoration Ministries</h3>
            <p>
              Providing compassionate Christian counseling services to help individuals, 
              couples, and families find hope, healing, and restoration.
            </p>
            <div className="contact-info">
              {/*<p><strong>Phone:</strong> (555) 123-4567</p>*/}
              
              <p><strong>Email:</strong> info@safehavenrestorationministries.com</p>
              <Link to="/request-appointment" className="contact-link">Start Your Journey</Link>
            </div>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/request-appointment">Book Appointment</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li>Individual Counseling</li>
              <li>Couples Counseling</li>
              <li>Family Therapy</li>
              <li>Group Sessions</li>
              <li>Crisis Intervention</li>
              <li>Christian Counseling</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Office Hours</h4>
            <ul className="office-hours">
              <li>Monday - Friday: 9:00 AM - 7:00 PM</li>
              <li>Saturday: 10:00 AM - 4:00 PM</li>
              <li>Sunday: Closed</li>
              {/*<li className="emergency">24/7 Crisis Support Available</li>*/}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-divider"></div>
          <div className="footer-bottom-content">
            <p>&copy; {currentYear} Safe Haven Restoration Ministries. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;