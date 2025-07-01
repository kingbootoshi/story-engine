import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/shared/lib/trpcClient';
import { WorldSphere } from '@/features/worlds';
import './Dashboard.styles.css';
import { useState, useEffect } from 'react';

/**
 * Tutorial steps for the Story Engine
 */
const TUTORIAL_STEPS = [
  {
    id: 'create-world',
    title: 'Create Your First World',
    description: 'Begin your journey by creating a unique narrative universe',
    icon: 'public',
    completed: false,
  },
  {
    id: 'seed-world',
    title: 'Populate with AI',
    description: 'Let AI generate locations, factions, and characters',
    icon: 'auto_awesome',
    completed: false,
  },
  {
    id: 'create-story',
    title: 'Create a Story Arc',
    description: 'Begin your narrative journey with a story arc',
    icon: 'auto_stories',
    completed: false,
  },
  {
    id: 'add-events',
    title: 'Add World Events',
    description: 'Create events that shape your world\'s narrative',
    icon: 'event_note',
    completed: false,
  },
  {
    id: 'progress-story',
    title: 'Progress Your Story',
    description: 'Watch as characters and factions react to world events',
    icon: 'play_arrow',
    completed: false,
  }
];

/**
 * Dashboard page component - Interactive tutorial
 * Guides users through the Story Engine workflow
 */
export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialProgress, setTutorialProgress] = useState(TUTORIAL_STEPS);
  
  // Fetch worlds to check progress
  const { data: worlds, isLoading, refetch } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => trpc.world.list.query(),
  });

  // Check tutorial progress based on user's data
  useEffect(() => {
    if (!worlds || isLoading) return;

    const updateProgress = async () => {
      const progress = [...tutorialProgress];
      
      // Step 1: Has created a world?
      if (worlds.length > 0) {
        progress[0].completed = true;
        
        // Get the first world to check further progress
        const world = worlds[0];
        
        // Step 2: Has seeded the world?
        try {
          const [locations, factions, characters] = await Promise.all([
            trpc.location.list.query({ worldId: world.id }),
            trpc.faction.list.query({ worldId: world.id }),
            trpc.character.list.query({ worldId: world.id })
          ]);
          
          if (locations.length > 0 && factions.length > 0 && characters.length > 0) {
            progress[1].completed = true;
          }
          
          // Step 3: Has created a story arc?
          if (world.current_arc_id) {
            progress[2].completed = true;
            
            // Step 4: Has added events? (simplified check)
            // If they have an arc, we assume they can add events
            progress[3].completed = true;
            
            // Step 5: Has progressed the story? 
            // For now, we'll mark this as complete if they have locations, factions, characters AND an arc
            // This is a simplified check - in a real app, you'd check beat progression
            progress[4].completed = true;
          }
        } catch (error) {
          console.error('Error checking tutorial progress:', error);
        }
      }
      
      // Update progress and current step
      setTutorialProgress(progress);
      const nextIncompleteStep = progress.findIndex(step => !step.completed);
      setCurrentStep(nextIncompleteStep === -1 ? progress.length : nextIncompleteStep);
    };

    updateProgress();
  }, [worlds, isLoading]);

  const handleStepAction = (stepId: string) => {
    switch(stepId) {
      case 'create-world':
        navigate('/app/worlds');
        break;
      case 'seed-world':
        if (worlds && worlds[0]) {
          navigate(`/app/worlds/${worlds[0].id}`);
        }
        break;
      case 'add-events':
      case 'create-story':
      case 'progress-story':
        if (worlds && worlds[0]) {
          navigate(`/app/worlds/${worlds[0].id}`);
        }
        break;
    }
  };

  const handleSkipTutorial = () => {
    navigate('/app/worlds');
  };

  const completedSteps = tutorialProgress.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / TUTORIAL_STEPS.length) * 100;

  if (isLoading) {
    return (
      <div className="dashboard dashboard--loading">
        <div className="dashboard__loading-spinner"></div>
        <p>Loading your journey...</p>
      </div>
    );
  }

  return (
    <div className="dashboard dashboard--tutorial">
      <div className="dashboard__tutorial-header">
        <div className="dashboard__welcome">
          <h1 className="dashboard__title">Welcome to Story Engine</h1>
          <p className="dashboard__subtitle">
            Hello, <span className="dashboard__username">{user?.email?.split('@')[0]}</span>! 
            Let's create your first living narrative.
          </p>
        </div>
        
        {completedSteps > 0 && (
          <button onClick={handleSkipTutorial} className="dashboard__skip-button">
            Skip Tutorial
            <span className="material-icons">arrow_forward</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="dashboard__progress-container">
        <div className="dashboard__progress-bar">
          <div 
            className="dashboard__progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="dashboard__progress-glow"></div>
          </div>
        </div>
        <p className="dashboard__progress-text">
          {completedSteps} of {TUTORIAL_STEPS.length} steps completed
        </p>
      </div>

      {/* Tutorial Steps */}
      <div className="dashboard__tutorial-steps">
        {tutorialProgress.map((step, index) => (
          <div 
            key={step.id}
            className={`dashboard__step ${
              step.completed ? 'dashboard__step--completed' : ''
            } ${
              index === currentStep ? 'dashboard__step--current' : ''
            } ${
              index > currentStep ? 'dashboard__step--locked' : ''
            }`}
          >
            <div className="dashboard__step-indicator">
              {step.completed ? (
                <span className="material-icons dashboard__step-check">check_circle</span>
              ) : (
                <div className="dashboard__step-number">{index + 1}</div>
              )}
            </div>
            
            <div className="dashboard__step-content">
              <div className="dashboard__step-header">
                <span className={`material-icons dashboard__step-icon ${
                  index === currentStep ? 'dashboard__step-icon--active' : ''
                }`}>
                  {step.icon}
                </span>
                <h3 className="dashboard__step-title">{step.title}</h3>
              </div>
              
              <p className="dashboard__step-description">{step.description}</p>
              
              {index === currentStep && !step.completed && (
                <button 
                  onClick={() => handleStepAction(step.id)}
                  className="dashboard__step-action"
                >
                  {step.id === 'create-world' ? 'Create World' : 'Continue'}
                  <span className="material-icons">arrow_forward</span>
                </button>
              )}
            </div>
            
            {index < tutorialProgress.length - 1 && (
              <div className={`dashboard__step-connector ${
                step.completed ? 'dashboard__step-connector--completed' : ''
              }`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Tutorial Complete Message */}
      {completedSteps === TUTORIAL_STEPS.length && (
        <div className="dashboard__complete">
          <div className="dashboard__complete-content">
            <span className="material-icons dashboard__complete-icon">celebration</span>
            <h2 className="dashboard__complete-title">Congratulations!</h2>
            <p className="dashboard__complete-text">
              You've mastered the basics of Story Engine. Your world is alive and evolving!
            </p>
            <Link to="/app/worlds" className="dashboard__complete-button">
              <span className="material-icons">explore</span>
              Explore Your Worlds
            </Link>
          </div>
        </div>
      )}

      {/* Quick Access for Returning Users */}
      {worlds && worlds.length > 0 && (
        <div className="dashboard__quick-access">
          <h2 className="dashboard__quick-access-title">Your Worlds</h2>
          <div className="dashboard__worlds-grid">
            {worlds.slice(0, 3).map((world) => (
              <Link 
                key={world.id} 
                to={`/app/worlds/${world.id}`}
                className="dashboard__world-card"
              >
                <div className="dashboard__world-sphere">
                  <WorldSphere seed={world.id} size={100} />
                </div>
                <div className="dashboard__world-info">
                  <h3 className="dashboard__world-name">{world.name}</h3>
                  {world.current_arc_id && (
                    <span className="dashboard__world-badge">
                      <span className="material-icons">auto_stories</span>
                      Active Story
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}