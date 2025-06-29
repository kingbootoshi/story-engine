import { Link } from 'react-router-dom';
import './LandingPage.styles.css';

export function LandingPage() {
  return (
    <div className="landing-container">
      {/* Video Background */}
      <video 
        className="background-video" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/world_frontend.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Content Overlay */}
      <div className="content-overlay">
        <header className="landing-header">
          <div className="logo">
            <Link to="/">Story Engine</Link>
          </div>
          <nav className="nav-links">
            <Link to="/login" className="login-button">Login</Link>
          </nav>
        </header>
        
        <main className="landing-main">
          <section className="hero-section">
            <h1 className="title">Story Engine</h1>
            <div className="cta-container">
              <Link to="/login" className="cta-button">Get Started</Link>
            </div>
          </section>
          
          <section className="tagline-section">
            <p className="tagline">Create, manage, and design self-evolving AI universes that you and players can participate in.</p>
          </section>
        </main>
      </div>
    </div>
  );
}