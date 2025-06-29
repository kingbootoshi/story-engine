import { Link } from 'react-router-dom';
import './LandingPage.styles.css';

/**
 * Landing page component with video background and hero section
 * Features responsive design and call-to-action elements
 */
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
        <source src="/worldtree.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Content Overlay */}
      <div className="content-overlay">
        <main className="landing-main">
          <section className="hero-section">
            <h1 className="title">
              <span className="title-story">Story</span>
              <span className="title-engine">Engine</span>
            </h1>
            <div className="cta-container">
              <Link to="/login" className="cta-button">Begin Your Journey</Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}