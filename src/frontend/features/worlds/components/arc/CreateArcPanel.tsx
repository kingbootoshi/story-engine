interface CreateArcPanelProps {
  showCreateArc: boolean;
  storyIdea: string;
  isCreating: boolean;
  onStoryIdeaChange: (value: string) => void;
  onToggleForm: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateArcPanel({ 
  showCreateArc, 
  storyIdea, 
  isCreating,
  onStoryIdeaChange, 
  onToggleForm, 
  onSubmit 
}: CreateArcPanelProps) {
  return (
    <div className="world-detail__no-arc-panel">
      {!showCreateArc ? (
        <div className="world-detail__no-arc-content">
          <span className="material-icons world-detail__no-arc-icon">auto_stories</span>
          <h2>Start Your Story</h2>
          <p>No active arc. Create one to begin your narrative journey!</p>
          <button
            onClick={onToggleForm}
            className="world-detail__create-arc-button-hero"
          >
            <span className="material-icons">add</span>
            Create New Arc
          </button>
        </div>
      ) : (
        <div className="world-detail__create-arc-form">
          <h2>Create New Story Arc</h2>
          <form onSubmit={onSubmit}>
            <div className="world-detail__form-group">
              <label htmlFor="storyIdea">
                Story Idea (optional)
              </label>
              <textarea
                id="storyIdea"
                value={storyIdea}
                onChange={(e) => onStoryIdeaChange(e.target.value)}
                placeholder="Describe your story idea, or leave blank for a random arc..."
                rows={4}
                disabled={isCreating}
              />
            </div>
            <div className="world-detail__form-actions">
              <button 
                type="submit" 
                className="world-detail__submit-button"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <div className="world-detail__button-spinner"></div>
                    <span>Creating Arc...</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons">auto_stories</span>
                    <span>Create Arc</span>
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={onToggleForm}
                className="world-detail__cancel-button"
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}