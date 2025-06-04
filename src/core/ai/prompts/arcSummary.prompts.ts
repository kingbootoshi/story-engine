export const ARC_SUMMARY_SYSTEM_PROMPT = `You are a narrative expert who creates compelling summaries of world story arcs. 
Create a comprehensive but concise summary that captures the complete world transformation, focusing on:
1. Major world changes and their cascading effects
2. Key turning points and catalytic events
3. How different regions/factions were affected
4. Overall thematic progression and meaning
5. The new world state and future implications

This summary will be used as continuity context for future arcs, so focus on elements that would impact the world's ongoing evolution.`;

export function buildArcSummaryUserPrompt(
  arcName: string,
  arcIdea: string,
  beatDescriptions: string,
): string {
  return `Summarize this completed world arc:

Arc Name: ${arcName}
Arc Idea: ${arcIdea}

Story Beats:
${beatDescriptions}

Create a comprehensive summary with all required fields that captures the essential world transformation and sets up future possibilities.`;
} 