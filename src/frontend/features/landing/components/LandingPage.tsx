import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.styles.css';

export function LandingPage() {
  const [isZooming, setIsZooming] = useState(false);
  const [isFadingToBlack, setIsFadingToBlack] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // Handle the zoom effect and navigation
  const handleEnterWorld = () => {
    // Start zoom animation
    setIsZooming(true);
    
    // After zoom completes, start fade to black
    setTimeout(() => {
      setIsFadingToBlack(true);
    }, 1500);
    
    // Navigate to login page after both animations complete
    setTimeout(() => {
      navigate('/login');
    }, 3000); // 1.5s for zoom + 1.5s for fade to black
  };

  // Add fade-in effect when component mounts
  useEffect(() => {
    document.body.classList.add('fade-in-page');
    
    return () => {
      document.body.classList.remove('fade-in-page');
    };
  }, []);

  return (
    <div className={`landing-container ${isZooming ? 'zooming' : ''} ${isFadingToBlack ? 'fading-to-black' : ''}`}>
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