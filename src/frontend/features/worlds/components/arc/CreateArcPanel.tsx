interface CreateArcPanelProps {
  showCreateArc: boolean;
  storyIdea: string;
  onStoryIdeaChange: (value: string) => void;
  onToggleForm: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateArcPanel({ 
  showCreateArc, 
  storyIdea, 
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
              />
            </div>
            <div className="world-detail__form-actions">
              <button type="submit" className="world-detail__submit-button">
                <span className="material-icons">auto_stories</span>
                Create Arc
              </button>
              <button 
                type="button" 
                onClick={onToggleForm}
                className="world-detail__cancel-button"
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