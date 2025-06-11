export interface STCBeatInfo {
  /** 0-14 */
  index: number;
  /** Short Hollywood label – "Opening Image", "Catalyst", … */
  label: string;
  /** One-sentence narrative function of this beat */
  purpose: string;
}

/**
 * Canonical 15-beat Save-the-Cat map (world-scale variant).
 *
 *  – Keep the wording *concise*; prompts inject the `purpose` verbatim so
 *    large paragraphs would bloat token count.
 *  – If you rename or re-order beats adjust every index-lookup import.
 */
export const SAVE_THE_CAT_BEATS: STCBeatInfo[] = [
  { index: 0,  label: 'Opening Image',      purpose: "Show the world's baseline and latent tensions." },
  { index: 1,  label: 'Rising Tensions',   purpose: 'First hints of instability; stakes still low.' },
  { index: 2,  label: 'First Tremors',     purpose: 'Contained disturbance foreshadows greater upheaval.' },
  { index: 3,  label: 'Catalyst',          purpose: 'Irreversible incident that forces change.' },
  { index: 4,  label: 'Shock Waves',       purpose: 'Immediate fallout; different regions react.' },
  { index: 5,  label: 'Systems Fail',      purpose: 'Old structures cannot cope; disorder spreads.' },
  { index: 6,  label: 'Power Vacuum',      purpose: 'Leadership contested; new factions emerge.' },
  { index: 7,  label: 'Turning Point',     purpose: 'Mid-arc pivot redefining the core conflict.' },
  { index: 8,  label: 'New Alliances',     purpose: 'World reorganises around the new paradigm.' },
  { index: 9,  label: 'Emerging Order',    purpose: 'Patterns form; winners and losers apparent.' },
  { index:10,  label: 'The Struggle',      purpose: 'Final resistance to inevitable change.' },
  { index:11,  label: 'Final Conflict',    purpose: 'Climactic confrontation decides fate.' },
  { index:12,  label: 'The Synthesis',     purpose: 'Lessons integrated; new order internalised.' },
  { index:13,  label: 'New Dawn',          purpose: 'Transformed equilibrium – calm after storm.' },
  { index:14,  label: 'Future Seeds',      purpose: 'Tease next cycle; unresolved tension remains.' },
]; 