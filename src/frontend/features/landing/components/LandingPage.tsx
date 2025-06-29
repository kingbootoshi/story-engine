import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.styles.css';

export function LandingPage() {
  const [isZooming, setIsZooming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // Handle the zoom effect and navigation
  const handleEnterWorld = () => {
    setIsZooming(true);
    
    // Navigate to login page after zoom animation completes
    setTimeout(() => {
      navigate('/login');
    }, 1500); // Match this with the CSS animation duration
  };

  return (
    <div className={`landing-container ${isZooming ? 'zooming' : ''}`}>
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
    </div>
  );
}