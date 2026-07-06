import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Header.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if current path matches link
  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        {/* Logo Section */}
        <div className="logo">
          <Link to="/" className="logo-link">
            <div className="logo-icon-container">
              <div className="logo-icon">
                <span>S</span>
              </div>
              <div className="logo-accent"></div>
            </div>
            <div className="logo-text">
              <h1>SHRM</h1>
              <span>Safe Haven Restoration Ministries</span>
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
              >
                Home
                {isActiveLink('/') && <span className="nav-active-dot"></span>}
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/about" 
                className={`nav-link ${isActiveLink('/about') ? 'active' : ''}`}
              >
                About
                {isActiveLink('/about') && <span className="nav-active-dot"></span>}
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/services" 
                className={`nav-link ${isActiveLink('/services') ? 'active' : ''}`}
              >
                Services
                {isActiveLink('/services') && <span className="nav-active-dot"></span>}
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/contact" 
                className={`nav-link ${isActiveLink('/contact') ? 'active' : ''}`}
              >
                Contact
                {isActiveLink('/contact') && <span className="nav-active-dot"></span>}
              </Link>
            </li>
            
            <li className="nav-separator">
              <div className="nav-divider"></div>
            </li>
            
            <li>
              <Link
                to="/login"
                className="cta-button cta-button-secondary"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Login
              </Link>
            </li>

            <li>
              <Link to="/request-appointment" className="cta-button">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Get Started
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <div className="mobile-nav-container">
          <Link to="/request-appointment" className="tablet-cta">Book Now</Link>
          
          <button 
            className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="menu-toggle-line"></span>
            <span className="menu-toggle-line"></span>
            <span className="menu-toggle-line"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={`mobile-nav ${isMenuOpen ? 'open' : 'closed'}`}>
        <div className="mobile-nav-content">
          <ul className="mobile-nav-list">
            <li>
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className={`mobile-nav-link ${isActiveLink('/') ? 'active' : ''}`}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                onClick={() => setIsMenuOpen(false)}
                className={`mobile-nav-link ${isActiveLink('/about') ? 'active' : ''}`}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>About</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/services" 
                onClick={() => setIsMenuOpen(false)}
                className={`mobile-nav-link ${isActiveLink('/services') ? 'active' : ''}`}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Services</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/contact" 
                onClick={() => setIsMenuOpen(false)}
                className={`mobile-nav-link ${isActiveLink('/contact') ? 'active' : ''}`}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Contact</span>
              </Link>
            </li>
            
            <li className="mobile-cta-container">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="mobile-cta mobile-cta-secondary"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Login</span>
              </Link>
            </li>
            
            <li className="mobile-cta-container">
              <Link 
                to="/request-appointment" 
                onClick={() => setIsMenuOpen(false)}
                className="mobile-cta"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Book Appointment</span>
              </Link>
            </li>
          </ul>
          
          {/* <div className="quick-contact">
            <p>24/7 Crisis Support</p>
            <a href="tel:5551234567">(555) 123-4567</a>
          </div> */}
        </div>
      </nav>
    </header>
  );
};

export default Header;