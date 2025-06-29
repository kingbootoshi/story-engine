import { useState } from 'react';
import { AuthForm } from '@/features/auth/components/AuthForm';
import './LandingPage.styles.css';

/**
 * Landing page component with video background and hero section
 * Features responsive design, call-to-action elements, and fade-in animations
 * Includes integrated authentication that replaces the hero content
 */
export function LandingPage() {
  // State to control the visibility of the auth form
  const [showAuth, setShowAuth] = useState(false);
  // State to track if content is transitioning out
  const [isContentExiting, setIsContentExiting] = useState(false);

  /**
   * Handles the transition to show the auth form
   * First fades out the content, then shows the auth form
   */
  const handleBeginJourney = () => {
    setIsContentExiting(true);
    // Wait for content exit animation to complete before showing auth
    setTimeout(() => {
      setShowAuth(true);
    }, 600); // Match this with the exit animation duration
  };

  /**
   * Handles the transition back to the landing page
   * Hides the auth form and fades the content back in
   */
  const handleBackToLanding = () => {
    setShowAuth(false);
    setTimeout(() => {
      setIsContentExiting(false);
    }, 100);
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
          {/* Hero Section - shown when auth is not active */}
          {!showAuth && (
            <section className={`hero-section ${isContentExiting ? 'hero-section--exiting' : ''}`}>
              <h1 className="title">
                <span className="title-story">Story</span>
                <span className="title-engine">Engine</span>
              </h1>
              <p className="subtitle">
                Create, design, and grow self-evolving AI universes that you and players can participate in.
              </p>
              <div className="cta-container">
                <button onClick={handleBeginJourney} className="cta-button">Begin Your Journey</button>
              </div>
            </section>
          )}

          {/* Auth Form - shown when auth is active */}
          {showAuth && (
            <section className="auth-section">
              <AuthForm onBack={handleBackToLanding} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}