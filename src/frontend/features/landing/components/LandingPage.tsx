import { useState } from 'react';
import { AuthModal } from '@/features/auth/components/AuthModal';
import './LandingPage.styles.css';

/**
 * Landing page component with video background and hero section
 * Features responsive design, call-to-action elements, and fade-in animations
 * Includes integrated authentication modal
 */
export function LandingPage() {
  // State to control the visibility of the auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  /**
   * Opens the authentication modal
   */
  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  /**
   * Closes the authentication modal
   */
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

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
            <p className="subtitle">
              Create, design, and grow self-evolving AI universes that you and players can participate in.
            </p>
            <div className="cta-container">
              <button onClick={openAuthModal} className="cta-button">Begin Your Journey</button>
            </div>
          </section>
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
      />
    </div>
  );
}