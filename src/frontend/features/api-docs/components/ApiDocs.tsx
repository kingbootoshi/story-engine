import { useState, useEffect, useCallback } from 'react';
import './ApiDocs.styles.css';

/**
 * API Documentation component with multi-section navigation
 * Provides comprehensive guide to using the Story Engine API
 * Features glassmorphic design with mobile-friendly navigation
 */
export function ApiDocs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Copy code to clipboard and show feedback
   */
  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * Handle section change and close mobile menu
   */
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  // Navigation sections
  const sections = [
    { id: 'overview', label: 'Overview', icon: 'auto_stories' },
    { id: 'how-it-works', label: 'How It Works', icon: 'psychology' },
    { id: 'authentication', label: 'Authentication', icon: 'lock' },
    { id: 'quickstart', label: 'Quick Start', icon: 'rocket_launch' },
    { id: 'worlds', label: 'Worlds API', icon: 'public' },
    { id: 'characters', label: 'Characters API', icon: 'person' },
    { id: 'locations', label: 'Locations API', icon: 'place' },
    { id: 'factions', label: 'Factions API', icon: 'groups' },
    { id: 'events', label: 'Events & Progression', icon: 'event' },
    { id: 'best-practices', label: 'Best Practices', icon: 'tips_and_updates' },
  ];

  /**
   * Get current section index
   */
  const currentSectionIndex = sections.findIndex(s => s.id === activeSection);
  const currentSection = sections[currentSectionIndex];
  const prevSection = currentSectionIndex > 0 ? sections[currentSectionIndex - 1] : null;
  const nextSection = currentSectionIndex < sections.length - 1 ? sections[currentSectionIndex + 1] : null;

  /**
   * Navigate to previous/next section
   */
  const navigateToPrev = useCallback(() => {
    if (prevSection) {
      handleSectionChange(prevSection.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [prevSection]);

  const navigateToNext = useCallback(() => {
    if (nextSection) {
      handleSectionChange(nextSection.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [nextSection]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't interfere with form inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          navigateToPrev();
          break;
        case 'ArrowRight':
          navigateToNext();
          break;
        case 'Escape':
          setIsMobileMenuOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigateToPrev, navigateToNext]); // Use callbacks as dependencies

  /**
   * Handle swipe gestures for mobile
   */
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swiped left - go to next
          navigateToNext();
        } else {
          // Swiped right - go to prev
          navigateToPrev();
        }
      }
    };

    const contentEl = document.querySelector('.api-docs__content');
    if (contentEl) {
      contentEl.addEventListener('touchstart', handleTouchStart as any);
      contentEl.addEventListener('touchend', handleTouchEnd as any);

      return () => {
        contentEl.removeEventListener('touchstart', handleTouchStart as any);
        contentEl.removeEventListener('touchend', handleTouchEnd as any);
      };
    }
  }, [navigateToPrev, navigateToNext]); // Use callbacks as dependencies

  return (
    <div className="api-docs">
      {/* Fixed Mobile Header */}
      <header className="api-docs__mobile-header">
        <button 
          className="api-docs__mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle documentation menu"
        >
          <span className="material-icons">menu</span>
        </button>
        <div className="api-docs__mobile-header-content">
          <span className="material-icons">{currentSection?.icon}</span>
          <h1>{currentSection?.label}</h1>
        </div>
        <div className="api-docs__mobile-header-spacer" />
      </header>

      {/* Mobile Menu Toggle Button - REMOVED (replaced by header button) */}

      {/* Mobile Overlay */}
      <div 
        className={`api-docs__mobile-overlay ${isMobileMenuOpen ? 'api-docs__mobile-overlay--visible' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar Navigation */}
      <nav className={`api-docs__sidebar ${isMobileMenuOpen ? 'api-docs__sidebar--mobile-open' : ''}`}>
        {/* Mobile Close Button */}
        <button 
          className="api-docs__mobile-close"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <span className="material-icons">close</span>
        </button>

        <h2 className="api-docs__sidebar-title">Documentation</h2>
        {sections.map(section => (
          <button
            key={section.id}
            className={`api-docs__nav-item ${activeSection === section.id ? 'api-docs__nav-item--active' : ''}`}
            onClick={() => handleSectionChange(section.id)}
          >
            <span className="material-icons">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="api-docs__content">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <section className="api-docs__section">
            <h1 className="api-docs__title">Story Engine API</h1>
            <p className="api-docs__subtitle">
              Create and manage dynamic narrative worlds with our comprehensive API
            </p>

            <div className="api-docs__version">v1.0</div>

            <div className="api-docs__intro">
              <p>
                Story Engine is a revolutionary AI-powered platform that creates living, breathing narrative worlds. 
                Unlike traditional game narratives, our worlds evolve dynamically based on player actions, creating 
                unique stories that emerge from the interplay of characters, factions, locations, and events.
              </p>
            </div>

            <div className="api-docs__features">
              <h3>Key Features</h3>
              <ul>
                <li>
                  <span className="material-icons">check_circle</span>
                  <strong>Dynamic World Generation</strong> - AI creates rich worlds with interconnected entities
                </li>
                <li>
                  <span className="material-icons">check_circle</span>
                  <strong>Emergent Narratives</strong> - Stories evolve based on player actions and world events
                </li>
                <li>
                  <span className="material-icons">check_circle</span>
                  <strong>Event-Driven Architecture</strong> - Every action triggers reactions throughout the world
                </li>
                <li>
                  <span className="material-icons">check_circle</span>
                  <strong>RESTful & tRPC APIs</strong> - Use your preferred integration method
                </li>
              </ul>
            </div>

            <div className="api-docs__alert api-docs__alert--info">
              <span className="material-icons">info</span>
              <p>
                Ready to dive in? Check out the <a onClick={() => handleSectionChange('quickstart')}>Quick Start</a> guide 
                or learn <a onClick={() => handleSectionChange('how-it-works')}>How It Works</a>.
              </p>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        {activeSection === 'how-it-works' && (
          <section className="api-docs__section">
            <h1>How Story Engine Creates Dynamic Universes</h1>
            
            <div className="api-docs__subsection">
              <h2>The Golden Rule: Event-Driven Narratives</h2>
              <p>
                At the heart of Story Engine lies a simple but powerful principle we call the "Golden Rule":
              </p>
              
              <div className="api-docs__flow-diagram">
                <div className="api-docs__flow-step">
                  <span className="material-icons">touch_app</span>
                  <h4>Player Action</h4>
                  <p>Player destroys a bridge</p>
                </div>
                <span className="material-icons api-docs__flow-arrow">arrow_forward</span>
                <div className="api-docs__flow-step">
                  <span className="material-icons">event</span>
                  <h4>World Event</h4>
                  <p>Major infrastructure damage logged</p>
                </div>
                <span className="material-icons api-docs__flow-arrow">arrow_forward</span>
                <div className="api-docs__flow-step">
                  <span className="material-icons">auto_stories</span>
                  <h4>Story Beat</h4>
                  <p>AI generates "Isolation of the North"</p>
                </div>
                <span className="material-icons api-docs__flow-arrow">arrow_forward</span>
                <div className="api-docs__flow-step">
                  <span className="material-icons">sync</span>
                  <h4>World Reacts</h4>
                  <p>Factions realign, prices rise, bandits appear</p>
                </div>
              </div>

              <p>
                This creates a perpetual narrative loop where every action matters. The AI doesn't just generate 
                random events—it analyzes the context of player actions and world state to create meaningful, 
                coherent story progressions.
              </p>
            </div>

            <div className="api-docs__subsection">
              <h2>The Living World Architecture</h2>
              
              <div className="api-docs__hierarchy">
                <div className="api-docs__hierarchy-item">
                  <span className="material-icons">public</span>
                  <div>
                    <h4>Worlds</h4>
                    <p>Universe containers with themes and rules</p>
                  </div>
                </div>
                <div className="api-docs__hierarchy-item api-docs__hierarchy-item--indent">
                  <span className="material-icons">place</span>
                  <div>
                    <h4>Locations</h4>
                    <p>Dynamic places that evolve (thriving → ruined)</p>
                  </div>
                </div>
                <div className="api-docs__hierarchy-item api-docs__hierarchy-item--indent">
                  <span className="material-icons">person</span>
                  <div>
                    <h4>Characters</h4>
                    <p>Individual agents with memories and motivations</p>
                  </div>
                </div>
                <div className="api-docs__hierarchy-item api-docs__hierarchy-item--indent">
                  <span className="material-icons">groups</span>
                  <div>
                    <h4>Factions</h4>
                    <p>Political entities with ideologies and relationships</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="api-docs__subsection">
              <h2>Emergent Complexity</h2>
              <p>
                The magic happens when these systems interact:
              </p>
              <ul>
                <li>A character's faction influences their reaction to events</li>
                <li>A location's controlling faction affects its development</li>
                <li>Faction relationships create political intrigue</li>
                <li>Character memories shape future decisions</li>
              </ul>
              
              <div className="api-docs__alert api-docs__alert--success">
                <span className="material-icons">lightbulb</span>
                <p>
                  <strong>Example:</strong> When a player assassinates a duke, it triggers a succession crisis. 
                  Factions split, characters choose sides based on their motivations, locations change hands, 
                  and new story beats emerge—all without scripted outcomes.
                </p>
              </div>
            </div>

            <div className="api-docs__subsection">
              <h2>The 15-Beat Story Structure</h2>
              <p>
                Each world arc follows a modified "Save the Cat" structure, creating satisfying narrative progressions:
              </p>
              
              <div className="api-docs__story-structure">
                <div className="api-docs__act">
                  <h4>Act 1: Equilibrium (Beats 0-4)</h4>
                  <p>Status quo → Rising tensions → Catalyst event</p>
                </div>
                <div className="api-docs__act">
                  <h4>Act 2: Chaos (Beats 5-10)</h4>
                  <p>Systems fail → Power struggles → Turning point</p>
                </div>
                <div className="api-docs__act">
                  <h4>Act 3: Resolution (Beats 11-14)</h4>
                  <p>Final conflict → New order → Seeds of future</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Authentication Section */}
        {activeSection === 'authentication' && (
          <section className="api-docs__section">
            <h1>Authentication</h1>
            
            <p>
              All API requests require authentication using API keys. You can create and manage your API keys 
              through the Story Engine dashboard.
            </p>

            <div className="api-docs__alert api-docs__alert--warning">
              <span className="material-icons">warning</span>
              <p>
                <strong>Security Notice:</strong> Never expose your API keys in client-side code. Always use them 
                server-side and store them securely as environment variables.
              </p>
            </div>

            <div className="api-docs__subsection">
              <h2>API Key Format</h2>
              <p>Include your API key in the Authorization header using Bearer token format:</p>
              
              <div className="api-docs__code-block">
                <div className="api-docs__code-header">
                  <span className="api-docs__code-lang">http</span>
                  <button 
                    className="api-docs__code-copy"
                    onClick={() => copyToClipboard('Authorization: Bearer se_1234567890abcdef1234567890abcdef', 'auth-header')}
                  >
                    <span className="material-icons">
                      {copiedCode === 'auth-header' ? 'check' : 'content_copy'}
                    </span>
                    {copiedCode === 'auth-header' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre>
                  <code>Authorization: Bearer se_1234567890abcdef1234567890abcdef</code>
                </pre>
              </div>
            </div>

            <div className="api-docs__subsection">
              <h2>Example Request</h2>
              
              <div className="api-docs__tabs">
                <div className="api-docs__tab api-docs__tab--active">JavaScript</div>
              </div>
              
              <div className="api-docs__code-block">
                <div className="api-docs__code-header">
                  <span className="api-docs__code-lang">javascript</span>
                  <button 
                    className="api-docs__code-copy"
                    onClick={() => copyToClipboard(`const response = await fetch('https://api.storyengine.dev/trpc/world.list', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const worlds = await response.json();`, 'auth-example')}
                  >
                    <span className="material-icons">
                      {copiedCode === 'auth-example' ? 'check' : 'content_copy'}
                    </span>
                    {copiedCode === 'auth-example' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre>
                  <code>{`const response = await fetch('https://api.storyengine.dev/trpc/world.list', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const worlds = await response.json();`}</code>
                </pre>
              </div>
            </div>
          </section>
        )}

        {/* Quick Start Section */}
        {activeSection === 'quickstart' && (
          <section className="api-docs__section">
            <h1>Quick Start Guide</h1>
            
            <p>Get up and running with Story Engine in minutes.</p>

            <div className="api-docs__steps">
              <div className="api-docs__step">
                <div className="api-docs__step-number">1</div>
                <div className="api-docs__step-content">
                  <h3>Get Your API Key</h3>
                  <p>
                    Navigate to the <a href="/app/api-keys">API Keys</a> section and create a new key. 
                    Store it securely—you won't be able to see it again.
                  </p>
                </div>
              </div>

              <div className="api-docs__step">
                <div className="api-docs__step-number">2</div>
                <div className="api-docs__step-content">
                  <h3>Create Your First World</h3>
                  <p>Use the world creation endpoint to generate a complete narrative universe:</p>
                  
                  <div className="api-docs__code-block">
                    <div className="api-docs__code-header">
                      <span className="api-docs__code-lang">javascript</span>
                      <button 
                        className="api-docs__code-copy"
                        onClick={() => copyToClipboard(`const world = await fetch('https://api.storyengine.dev/trpc/world.create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "The Shattered Realms",
    description: "A dark fantasy world where magic is dying"
  })
});`, 'quickstart-create')}
                      >
                        <span className="material-icons">
                          {copiedCode === 'quickstart-create' ? 'check' : 'content_copy'}
                        </span>
                        {copiedCode === 'quickstart-create' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre>
                      <code>{`const world = await fetch('https://api.storyengine.dev/trpc/world.create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "The Shattered Realms",
    description: "A dark fantasy world where magic is dying"
  })
});`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="api-docs__step">
                <div className="api-docs__step-number">3</div>
                <div className="api-docs__step-content">
                  <h3>Add a World Event</h3>
                  <p>Drive the narrative forward by recording player actions:</p>
                  
                  <div className="api-docs__code-block">
                    <div className="api-docs__code-header">
                      <span className="api-docs__code-lang">javascript</span>
                      <button 
                        className="api-docs__code-copy"
                        onClick={() => copyToClipboard(`const event = await fetch('https://api.storyengine.dev/trpc/world.recordWorldEvent', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    world_id: world.id,
    event_type: 'player_action',
    impact_level: 'major',
    description: "The hero discovers an ancient artifact in the ruins"
  })
});`, 'quickstart-event')}
                      >
                        <span className="material-icons">
                          {copiedCode === 'quickstart-event' ? 'check' : 'content_copy'}
                        </span>
                        {copiedCode === 'quickstart-event' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre>
                      <code>{`const event = await fetch('https://api.storyengine.dev/trpc/world.recordWorldEvent', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    world_id: world.id,
    event_type: 'player_action',
    impact_level: 'major',
    description: "The hero discovers an ancient artifact in the ruins"
  })
});`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="api-docs__step">
                <div className="api-docs__step-number">4</div>
                <div className="api-docs__step-content">
                  <h3>Progress the Story</h3>
                  <p>Generate the next story beat based on accumulated events:</p>
                  
                  <div className="api-docs__code-block">
                    <div className="api-docs__code-header">
                      <span className="api-docs__code-lang">javascript</span>
                      <button 
                        className="api-docs__code-copy"
                        onClick={() => copyToClipboard(`const nextBeat = await fetch('https://api.storyengine.dev/trpc/world.progressArc', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    worldId: "world_abc123",
    arcId: "arc_def456",
    recentEvents: "The hero found a powerful artifact"
  })
});`, 'quickstart-progress')}
                      >
                        <span className="material-icons">
                          {copiedCode === 'quickstart-progress' ? 'check' : 'content_copy'}
                        </span>
                        {copiedCode === 'quickstart-progress' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre>
                      <code>{`const nextBeat = await fetch('https://api.storyengine.dev/trpc/world.progressArc', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    worldId: "world_abc123",
    arcId: "arc_def456",
    recentEvents: "The hero found a powerful artifact"
  })
});`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="api-docs__alert api-docs__alert--info">
              <span className="material-icons">tips_and_updates</span>
              <p>
                <strong>Pro Tip:</strong> The world creation automatically populates your world with characters, 
                locations, and factions. You can start adding events immediately!
              </p>
            </div>
          </section>
        )}

        {/* Worlds API Section */}
        {activeSection === 'worlds' && (
          <section className="api-docs__section">
            <h1>Worlds API</h1>
            
            <p>
              Worlds are the top-level containers for your stories. Each world has its own theme, 
              narrative arcs, and interconnected entities.
            </p>

            <div className="api-docs__endpoint">
              <div className="api-docs__endpoint-header">
                <span className="api-docs__method api-docs__method--post">POST</span>
                <code className="api-docs__endpoint-path">/world.create</code>
              </div>
              <div className="api-docs__endpoint-description">
                Create a new world with automatic population
              </div>
              
              <h4>Request Body</h4>
              <div className="api-docs__params">
                <div className="api-docs__param">
                  <code>name</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                  <p>The name of your world</p>
                </div>
                <div className="api-docs__param">
                  <code>description</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                  <p>Theme and setting description</p>
                </div>
              </div>

              <h4>Response</h4>
              <div className="api-docs__code-block">
                <pre>
                  <code>{`{
  "id": "world_abc123",
  "name": "The Shattered Realms",
  "description": "A dark fantasy world where magic is dying",
  "current_arc_id": "arc_def456",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}`}</code>
                </pre>
              </div>
            </div>

            <div className="api-docs__endpoint">
              <div className="api-docs__endpoint-header">
                <span className="api-docs__method api-docs__method--get">GET</span>
                <code className="api-docs__endpoint-path">/world.get?worldId={'{'}{'{'}worldId{'}'}</code>
              </div>
              <div className="api-docs__endpoint-description">
                Retrieve details about a specific world
              </div>
            </div>

            <div className="api-docs__endpoint">
              <div className="api-docs__endpoint-header">
                <span className="api-docs__method api-docs__method--get">GET</span>
                <code className="api-docs__endpoint-path">/world.list</code>
              </div>
              <div className="api-docs__endpoint-description">
                List all worlds for the authenticated user
              </div>
            </div>

            <div className="api-docs__endpoint">
              <div className="api-docs__endpoint-header">
                <span className="api-docs__method api-docs__method--post">POST</span>
                <code className="api-docs__endpoint-path">/world.recordWorldEvent</code>
              </div>
              <div className="api-docs__endpoint-description">
                <span className="material-icons">star</span>
                Primary interaction method - Add events to drive the narrative
              </div>
              
              <h4>Request Body</h4>
              <div className="api-docs__params">
                <div className="api-docs__param">
                  <code>world_id</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                  <p>The world to add the event to</p>
                </div>
                <div className="api-docs__param">
                  <code>event_type</code>
                  <span className="api-docs__param-type">enum</span>
                  <span className="api-docs__param-required">required</span>
                  <p>Type: player_action | system_event | environmental | social</p>
                </div>
                <div className="api-docs__param">
                  <code>impact_level</code>
                  <span className="api-docs__param-type">enum</span>
                  <span className="api-docs__param-required">required</span>
                  <p>Impact: minor | moderate | major | catastrophic</p>
                </div>
                <div className="api-docs__param">
                  <code>description</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                  <p>Detailed description of what happened</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Characters API Section */}
        {activeSection === 'characters' && (
          <section className="api-docs__section">
            <h1>Characters API</h1>
            
            <p>
              Characters are individual agents with personalities, memories, and motivations. They react to 
              world events and create personal narratives within the larger story.
            </p>

            <div className="api-docs__endpoint">
              <div className="api-docs__endpoint-header">
                <span className="api-docs__method api-docs__method--post">POST</span>
                <code className="api-docs__endpoint-path">/character.create</code>
              </div>
              <div className="api-docs__endpoint-description">
                Create a new character in a world
              </div>
              
              <h4>Request Body</h4>
              <div className="api-docs__params">
                <div className="api-docs__param">
                  <code>world_id</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                </div>
                <div className="api-docs__param">
                  <code>name</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                </div>
                <div className="api-docs__param">
                  <code>type</code>
                  <span className="api-docs__param-type">enum</span>
                  <span className="api-docs__param-required">required</span>
                  <p>player | npc</p>
                </div>
                <div className="api-docs__param">
                  <code>story_role</code>
                  <span className="api-docs__param-type">enum</span>
                  <span className="api-docs__param-required">required</span>
                  <p>major | minor | wildcard | background</p>
                </div>
              </div>
            </div>

            <div className="api-docs__subsection">
              <h2>Character Memory System</h2>
              <p>
                Characters form memories from significant events, which influence their future behavior:
              </p>
              
              <div className="api-docs__code-block">
                <pre>
                  <code>{`{
  "event_description": "Witnessed the market fire",
  "timestamp": "2024-01-15T10:30:00Z",
  "emotional_impact": "negative",
  "importance": 0.85,  // 0.0 - 1.0
  "beat_index": 7
}`}</code>
                </pre>
              </div>
              
              <ul>
                <li><strong>0.9-1.0:</strong> Life-changing events</li>
                <li><strong>0.7-0.8:</strong> Significant events</li>
                <li><strong>0.5-0.6:</strong> Notable events</li>
                <li><strong>0.3-0.4:</strong> Everyday events</li>
              </ul>
            </div>
          </section>
        )}

        {/* Locations API Section */}
        {activeSection === 'locations' && (
          <section className="api-docs__section">
            <h1>Locations API</h1>
            
            <p>
              Locations are dynamic places that evolve with the narrative. They have lifecycles reflecting 
              their state and can be discovered or lost as the story progresses.
            </p>

            <div className="api-docs__subsection">
              <h2>Location Lifecycle</h2>
              <div className="api-docs__lifecycle">
                <span className="api-docs__lifecycle-state">thriving</span>
                <span className="material-icons">arrow_forward</span>
                <span className="api-docs__lifecycle-state">stable</span>
                <span className="material-icons">arrow_forward</span>
                <span className="api-docs__lifecycle-state">declining</span>
                <span className="material-icons">arrow_forward</span>
                <span className="api-docs__lifecycle-state">ruined</span>
                <span className="material-icons">arrow_forward</span>
                <span className="api-docs__lifecycle-state">abandoned</span>
                <span className="material-icons">arrow_forward</span>
                <span className="api-docs__lifecycle-state">lost</span>
              </div>
            </div>

            <div className="api-docs__endpoint">
              <div className="api-docs__endpoint-header">
                <span className="api-docs__method api-docs__method--post">POST</span>
                <code className="api-docs__endpoint-path">/location.create</code>
              </div>
              <div className="api-docs__endpoint-description">
                Create a new location in a world
              </div>
              
              <h4>Request Body</h4>
              <div className="api-docs__params">
                <div className="api-docs__param">
                  <code>world_id</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                </div>
                <div className="api-docs__param">
                  <code>name</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                </div>
                <div className="api-docs__param">
                  <code>type</code>
                  <span className="api-docs__param-type">enum</span>
                  <span className="api-docs__param-required">required</span>
                  <p>region | city | landmark | wilderness</p>
                </div>
                <div className="api-docs__param">
                  <code>status</code>
                  <span className="api-docs__param-type">enum</span>
                  <span className="api-docs__param-required">required</span>
                  <p>thriving | stable | declining | ruined | abandoned | lost</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Factions API Section */}
        {activeSection === 'factions' && (
          <section className="api-docs__section">
            <h1>Factions API</h1>
            
            <p>
              Factions are political entities with ideologies and relationships. They control locations, 
              compete for resources, and create the political landscape of your world.
            </p>

            <div className="api-docs__endpoint">
              <div className="api-docs__endpoint-header">
                <span className="api-docs__method api-docs__method--post">POST</span>
                <code className="api-docs__endpoint-path">/faction.setStance</code>
              </div>
              <div className="api-docs__endpoint-description">
                Set diplomatic stance between two factions
              </div>
              
              <h4>Request Body</h4>
              <div className="api-docs__params">
                <div className="api-docs__param">
                  <code>sourceId</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                  <p>The faction setting the stance</p>
                </div>
                <div className="api-docs__param">
                  <code>targetId</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                  <p>The faction being targeted</p>
                </div>
                <div className="api-docs__param">
                  <code>stance</code>
                  <span className="api-docs__param-type">enum</span>
                  <span className="api-docs__param-required">required</span>
                  <p>ally | neutral | hostile</p>
                </div>
                <div className="api-docs__param">
                  <code>reason</code>
                  <span className="api-docs__param-type">string</span>
                  <span className="api-docs__param-required">required</span>
                  <p>Narrative reason for the stance</p>
                </div>
              </div>
            </div>

            <div className="api-docs__subsection">
              <h2>Faction Status Evolution</h2>
              <ul>
                <li><strong>rising:</strong> New or resurgent power</li>
                <li><strong>stable:</strong> Established authority</li>
                <li><strong>declining:</strong> Losing influence</li>
                <li><strong>collapsed:</strong> Fallen from power</li>
              </ul>
            </div>
          </section>
        )}

        {/* Events & Progression Section */}
        {activeSection === 'events' && (
          <section className="api-docs__section">
            <h1>Events & Story Progression</h1>
            
            <div className="api-docs__subsection">
              <h2>Event Impact Levels</h2>
              
              <div className="api-docs__impact-levels">
                <div className="api-docs__impact-level">
                  <h4>Minor</h4>
                  <p>Local changes, individual achievements</p>
                  <em>Example: "Player helps merchant recover stolen goods"</em>
                </div>
                <div className="api-docs__impact-level">
                  <h4>Moderate</h4>
                  <p>Regional effects, guild actions</p>
                  <em>Example: "Trade route established between cities"</em>
                </div>
                <div className="api-docs__impact-level">
                  <h4>Major</h4>
                  <p>World-changing discoveries, mass movements</p>
                  <em>Example: "Ancient magic artifact activated"</em>
                </div>
                <div className="api-docs__impact-level">
                  <h4>Catastrophic</h4>
                  <p>Reality-altering events</p>
                  <em>Example: "Portal to another dimension opened"</em>
                </div>
              </div>
            </div>

            <div className="api-docs__subsection">
              <h2>Story Beat Generation</h2>
              <p>
                The AI generates story beats when:
              </p>
              <ul>
                <li>3+ major or catastrophic events accumulate</li>
                <li>24 hours pass since the last beat</li>
                <li>Manual progression is triggered</li>
              </ul>
              
              <div className="api-docs__alert api-docs__alert--info">
                <span className="material-icons">info</span>
                <p>
                  Story beats contain directives that affect the world state and emergent storylines 
                  that create new opportunities for player interaction.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Best Practices Section */}
        {activeSection === 'best-practices' && (
          <section className="api-docs__section">
            <h1>Best Practices</h1>
            
            <div className="api-docs__best-practice">
              <h3>
                <span className="material-icons">event</span>
                Use Events to Drive Story
              </h3>
              <p>
                The <code>recordWorldEvent</code> endpoint is your primary tool for story progression. 
                Every significant player action should be recorded as an event.
              </p>
            </div>

            <div className="api-docs__best-practice">
              <h3>
                <span className="material-icons">update</span>
                Progress Beats Regularly
              </h3>
              <p>
                Use <code>progressArc</code> to advance the narrative and generate new story content. 
                This keeps the world feeling alive and responsive.
              </p>
            </div>

            <div className="api-docs__best-practice">
              <h3>
                <span className="material-icons">psychology</span>
                Let the System React
              </h3>
              <p>
                After adding events, the system automatically updates characters, locations, and factions. 
                Trust the AI to create meaningful connections.
              </p>
            </div>

            <div className="api-docs__best-practice">
              <h3>
                <span className="material-icons">search</span>
                Query Full Details
              </h3>
              <p>
                Use the <code>get</code> endpoints to see all relationships and current states. 
                The full context helps you make informed decisions.
              </p>
            </div>

            <div className="api-docs__best-practice">
              <h3>
                <span className="material-icons">account_tree</span>
                Consider Dependencies
              </h3>
              <p>
                When creating multiple entities, consider the dependencies. Create locations before 
                assigning characters to them, for example.
              </p>
            </div>

            <div className="api-docs__subsection">
              <h2>Rate Limits</h2>
              <ul>
                <li>100 requests per minute per API key</li>
                <li>Maximum 100 items per list query</li>
                <li>Events processed asynchronously (allow a few seconds)</li>
              </ul>
            </div>

            <div className="api-docs__subsection">
              <h2>Error Handling</h2>
              
              <div className="api-docs__table">
                <table>
                  <thead>
                    <tr>
                      <th>Status Code</th>
                      <th>Meaning</th>
                      <th>Common Causes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>200</code></td>
                      <td>Success</td>
                      <td>Request processed successfully</td>
                    </tr>
                    <tr>
                      <td><code>400</code></td>
                      <td>Bad Request</td>
                      <td>Invalid parameters or missing fields</td>
                    </tr>
                    <tr>
                      <td><code>401</code></td>
                      <td>Unauthorized</td>
                      <td>Invalid or missing API key</td>
                    </tr>
                    <tr>
                      <td><code>404</code></td>
                      <td>Not Found</td>
                      <td>Resource doesn't exist</td>
                    </tr>
                    <tr>
                      <td><code>429</code></td>
                      <td>Rate Limited</td>
                      <td>Too many requests</td>
                    </tr>
                    <tr>
                      <td><code>500</code></td>
                      <td>Server Error</td>
                      <td>Internal error (contact support)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Section Navigation Footer */}
        <nav className="api-docs__section-nav">
          <button 
            className={`api-docs__section-nav-btn api-docs__section-nav-btn--prev ${!prevSection ? 'api-docs__section-nav-btn--disabled' : ''}`}
            onClick={navigateToPrev}
            disabled={!prevSection}
          >
            <span className="material-icons">navigate_before</span>
            {prevSection && (
              <div className="api-docs__section-nav-content">
                <span className="api-docs__section-nav-label">Previous</span>
                <span className="api-docs__section-nav-title">{prevSection.label}</span>
              </div>
            )}
          </button>

          <div className="api-docs__section-nav-indicator">
            <div className="api-docs__section-nav-dots">
              {sections.map((section, index) => (
                <span 
                  key={section.id}
                  className={`api-docs__section-nav-dot ${index === currentSectionIndex ? 'api-docs__section-nav-dot--active' : ''}`}
                  onClick={() => handleSectionChange(section.id)}
                />
              ))}
            </div>
          </div>

          <button 
            className={`api-docs__section-nav-btn api-docs__section-nav-btn--next ${!nextSection ? 'api-docs__section-nav-btn--disabled' : ''}`}
            onClick={navigateToNext}
            disabled={!nextSection}
          >
            {nextSection && (
              <div className="api-docs__section-nav-content">
                <span className="api-docs__section-nav-label">Next</span>
                <span className="api-docs__section-nav-title">{nextSection.label}</span>
              </div>
            )}
            <span className="material-icons">navigate_next</span>
          </button>
        </nav>
      </main>
    </div>
  );
} 