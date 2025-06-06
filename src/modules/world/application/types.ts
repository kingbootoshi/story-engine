export interface WorldArcCreationParams {
  /** World identifier the arc belongs to */
  worldId: string;
  /** Current world name – used by AI prompt */
  worldName: string;
  /** Rich world description passed to AI */
  worldDescription: string;
  /** Optional seed idea provided by the player */
  storyIdea?: string;
}

export interface BeatProgressionParams {
  /** World owning the arc */
  worldId: string;
  /** Arc currently being progressed */
  arcId: string;
  /** Most recent events as a pre-formatted string (optional) */
  recentEvents?: string;
} 