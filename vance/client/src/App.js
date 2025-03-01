import React from 'react';
import { Mic, ChevronDown, Menu } from 'lucide-react';
import VoiceChat from './VoiceComponent';

function App() {
  return (
    <div className="app-container">
      {/* NAVIGATION */}
      <nav className="nav">
        <div className="nav-content">
          <div className="logo">VANCE</div>
          <div className="nav-links">
            <div className="nav-link">
              Products <ChevronDown size={16} />
            </div>
            <div className="nav-link">Converters</div>
            <div className="nav-link">
              Resources <ChevronDown size={16} />
            </div>
            <button className="download-button">Download App</button>
          </div>
          <Menu className="menu-icon" size={24} />
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* HERO SECTION */}
        <div className="hero-section">
          <h2 className="subtitle">Meet Your AI Assistant</h2>
          <h1 className="title">Hello, we're Vance.</h1>
          <p className="description">
            Your intelligent voice companion for seamless interaction
          </p>
        </div>

        {/* VOICE CHAT */}
        <div className="voice-chat-container">
          <VoiceChat />
        </div>

        {/* FEATURED BY SECTION */}
        <section className="featured-section">
          <h2>Featured by</h2>
          <div className="featured-logos">
            {/* Replace with actual logos or text */}
            <div className="logo-item">BC</div>
            <div className="logo-item">Entrepreneur</div>
            <div className="logo-item">ET</div>
            <div className="logo-item">YourStory</div>
            <div className="logo-item">Gulf News</div>
          </div>
        </section>

        {/* SEND MONEY BANNER SECTION */}
        <section className="send-money-section">
          <div className="send-money-content">
            <h2>Send money to India at Google rates</h2>
            <p className="send-money-subtitle">
              Zero hidden fees, on-time transfers and 24x7 support
            </p>
            <div className="flag-row">
              {/* Example flags or placeholders */}
              <img
                src="https://flagcdn.com/48x36/gb.png"
                alt="UK Flag"
                className="flag"
              />
              <span className="arrow">&rarr;</span>
              <img
                src="https://flagcdn.com/48x36/in.png"
                alt="India Flag"
                className="flag"
              />
            </div>
            <div className="send-money-buttons">
              <button>Send from UK</button>
              <button>Send from UAE</button>
              <button>Send from Europe</button>
            </div>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section className="security-section">
          <h2>Get end-to-end security. Guaranteed.</h2>
          <div className="security-features">
            <div className="security-feature">
              <div className="security-icon">🔒</div>
              <p>A layer of 256-bit encryption on all your transfers</p>
            </div>
            <div className="security-feature">
              <div className="security-icon">🏦</div>
              <p>Money handled by regulated financial institutions</p>
            </div>
            <div className="security-feature">
              <div className="security-icon">✅</div>
              <p>
                Anti-theft ISO/IEC 27001:2013 certification for information
                security
              </p>
            </div>
          </div>
        </section>

        {/* EXISTING FEATURES SECTION */}
        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h3>Secure Voice Chat</h3>
            <p>End-to-end encrypted conversations</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 22V4c0-.27.2-.5.45-.5h11.1c.25 0 .45.23.45.5v18" />
                <path d="M2 22h20" />
              </svg>
            </div>
            <h3>Enterprise Ready</h3>
            <p>Built for business scale</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Privacy First</h3>
            <p>Your data stays yours</p>
          </div>
        </div>
      </main>

      {/* FOOTER SECTION */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-column">
            <h3>Company</h3>
            <p>About us</p>
            <p>Careers</p>
            <p>Media</p>
            <p>Privacy Policy</p>
            <p>Terms of use</p>
            <p>Customer reviews</p>
            <p>Help</p>
          </div>
          <div className="footer-column">
            <h3>Products</h3>
            <p>Send money to India</p>
          </div>
          <div className="footer-column">
            <h3>Quick links</h3>
            <p>Blog</p>
            <p>Currency Converters</p>
            <p>Compare</p>
            <p>Calculators</p>
            <p>Vance Rate Guard</p>
            <p>Sitemap</p>
          </div>
          <div className="footer-column">
            <h3>Get the latest from Vance</h3>
            <div className="subscribe-box">
              <input type="email" placeholder="Enter your email" />
              <button>Subscribe</button>
            </div>
          </div>
        </div>
        <div className="footer-global">
          <p>Global presence</p>
          <div className="global-list">
            <span>GBP</span> | <span>USD</span> | <span>AED</span> | <span>INR</span> |{' '}
            <span>EUR</span> | <span>CAD</span> | <span>AUD</span> ...
          </div>
        </div>
      </footer>

      {/* STYLES */}
      <style jsx>{`
        /* LAYOUT + NAV */
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          display: flex;
          flex-direction: column;
        }
        .nav {
          background-color: black;
          padding: 16px 24px;
        }
        .nav-content {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          color: #4ded95;
          font-size: 24px;
          font-weight: bold;
        }
        .nav-links {
          display: none;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          color: white;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .download-button {
          background-color: #4ded95;
          color: black;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          border: none;
          cursor: pointer;
        }
        .menu-icon {
          color: white;
          display: block;
        }

        /* MAIN CONTENT */
        .main-content {
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 80px 24px;
          flex: 1;
        }
        .hero-section {
          text-align: center;
          margin-bottom: 48px;
        }
        .subtitle {
          color: #9333ea;
          font-weight: 500;
          margin-bottom: 16px;
        }
        .title {
          font-size: 60px;
          font-weight: bold;
          margin-bottom: 24px;
          line-height: 1.2;
        }
        .description {
          font-size: 20px;
          color: #4b5563;
          max-width: 600px;
          margin: 0 auto;
        }

        .voice-chat-container {
          max-width: 800px;
          margin: 0 auto;
        }

        /* FEATURED SECTION */
        .featured-section {
          text-align: center;
          margin-top: 64px;
        }
        .featured-section h2 {
          font-size: 24px;
          margin-bottom: 24px;
        }
        .featured-logos {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
        }
        .logo-item {
          background: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-weight: 500;
        }

        /* SEND MONEY SECTION */
        .send-money-section {
          margin-top: 64px;
          display: flex;
          justify-content: center;
        }
        .send-money-content {
          background: #fff;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 700px;
          width: 100%;
        }
        .send-money-content h2 {
          font-size: 28px;
          margin-bottom: 16px;
        }
        .send-money-subtitle {
          color: #6b7280;
          margin-bottom: 24px;
        }
        .flag-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .flag {
          width: 48px;
          height: auto;
          border-radius: 4px;
        }
        .arrow {
          font-size: 24px;
        }
        .send-money-buttons button {
          background-color: #4ded95;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          margin: 0 8px;
          font-weight: 500;
          cursor: pointer;
        }

        /* SECURITY SECTION */
        .security-section {
          margin-top: 64px;
          text-align: center;
        }
        .security-section h2 {
          font-size: 28px;
          margin-bottom: 24px;
        }
        .security-features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          max-width: 700px;
          margin: 0 auto;
        }
        .security-feature {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .security-icon {
          font-size: 24px;
        }

        /* EXISTING FEATURES SECTION */
        .features-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          margin-top: 64px;
        }
        .feature-card {
          background-color: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .feature-icon {
          background-color: #1f2937;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .feature-icon svg {
          width: 24px;
          height: 24px;
          color: #4ded95;
        }
        .feature-card h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .feature-card p {
          color: #6b7280;
        }

        @media (min-width: 768px) {
          .nav-links {
            display: flex;
          }
          .menu-icon {
            display: none;
          }
          .features-section {
            grid-template-columns: repeat(3, 1fr);
          }
          .security-features {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* FOOTER */
        .footer {
          background-color: black;
          padding: 40px 24px;
          color: white;
        }
        .footer-content {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .footer-column h3 {
          margin-bottom: 16px;
          color: #4ded95;
        }
        .footer-column p {
          margin: 4px 0;
          color: #e5e7eb;
        }
        .subscribe-box {
          display: flex;
          gap: 8px;
        }
        .subscribe-box input {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
        .subscribe-box button {
          background-color: #4ded95;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-weight: 500;
        }
        .footer-global {
          max-width: 1280px;
          margin: 24px auto 0;
          border-top: 1px solid #4ded95;
          padding-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          color: #e5e7eb;
        }
        .footer-global p {
          margin-bottom: 8px;
        }
        .global-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .global-list span {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default App;
