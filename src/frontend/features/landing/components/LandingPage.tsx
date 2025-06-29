import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.styles.css';

export function LandingPage() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // Handle the zoom effect and navigation
  const handleEnterWorld = () => {
    // Start zoom and fade animations simultaneously
    setIsTransitioning(true);
    
    // Navigate to login page after animations complete
    setTimeout(() => {
      navigate('/login');
    }, 3000); // 3s for combined zoom and fade
  };

  // Add fade-in effect when component mounts
  useEffect(() => {
    document.body.classList.add('fade-in-page');
    
    return () => {
      document.body.classList.remove('fade-in-page');
    };
  }, []);

  return (
    <div className={`landing-container ${isTransitioning ? 'transitioning' : ''}`}>
      {/* Video Background */}
      <video 
        ref={videoRef}
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
        <main className="landing-main">
          <div className="hero-content">
            <h1 className="title">Story Engine</h1>
            <p className="tagline">
              Create, manage, and design self-evolving AI universes that you and players can participate in.
            </p>
            <div className="cta-container">
              <button 
                onClick={handleEnterWorld}
                className="enter-button"
              >
                Enter World
              </button>
            </div>
          </div>
        </main>
      </div>
      
      {/* Fade to black overlay */}
      <div className="fade-overlay"></div>
    </div>
  );
}