import { api } from './api';
import type { World, WorldArc, WorldBeat, WorldEvent } from './api';
import AuthService, { supabase } from './auth';

export class WorldStoryApp {
  private currentWorld: World | null = null;
  private currentArc: WorldArc | null = null;
  private currentBeats: WorldBeat[] = [];
  private recentEvents: WorldEvent[] = [];
  private allArcs: WorldArc[] = [];
  private selectedBeat: WorldBeat | null = null;
  private worlds: World[] = [];

  constructor(private container: HTMLElement) {
    this.initialize();
  }

  private async initialize() {
    await AuthService.initialize();
    this.render();
    this.attachEventListeners();
    this.checkAuthState();

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event) => {
      this.checkAuthState();
    });
  }

  private checkAuthState() {
    const isAuthenticated = AuthService.isAuthenticated();
    const authSection = document.getElementById('auth-section');
    const appContent = document.getElementById('app-content');
    const worldsList = document.getElementById('worlds-list');
    
    if (authSection && appContent) {
      if (isAuthenticated) {
        authSection.style.display = 'none';
        appContent.style.display = 'block';
        this.loadUserWorlds();
      } else {
        authSection.style.display = 'block';
        appContent.style.display = 'none';
        this.currentWorld = null;
        this.worlds = [];
        if (worldsList) worldsList.innerHTML = '';
      }
    }
  }

  private async loadUserWorlds() {
    try {
      this.worlds = await api.getUserWorlds();
      this.updateWorldsList();
    } catch (error) {
      this.showError('Failed to load worlds');
    }
  }

  private updateWorldsList() {
    const worldsList = document.getElementById('worlds-list');
    if (!worldsList) return;

    const html = this.worlds.map(world => `
      <div class="world-item ${world.id === this.currentWorld?.id ? 'active' : ''}">
        <div class="world-header">
          <h4>${world.name}</h4>
          <span class="world-date">${new Date(world.created_at).toLocaleDateString()}</span>
        </div>
        <p class="world-description">${world.description}</p>
        <button onclick="app.loadWorld('${world.id}')" 
                ${world.id === this.currentWorld?.id ? 'disabled' : ''}>
          ${world.id === this.currentWorld?.id ? 'Current World' : 'Load World'}
        </button>
      </div>
    `).join('');

    worldsList.innerHTML = html || '<p>No worlds created yet. Create one to begin!</p>';
  }

  public async loadWorld(worldId: string) {
    try {
      this.showLoading(true);
      const worldState = await api.getWorldState(worldId);
      
      if (!worldState.world) {
        throw new Error('World not found');
      }
      
      this.currentWorld = worldState.world;
      this.currentArc = worldState.currentArc;
      this.currentBeats = worldState.currentBeats;
      this.recentEvents = worldState.recentEvents;
      
      // Load all arcs
      this.allArcs = await api.getArcs(worldId);
      
      this.updateWorldDisplay();
      await this.loadEvents();

      // Select the latest beat if available
      if (this.currentBeats.length > 0) {
        this.selectBeat(this.currentBeats[this.currentBeats.length - 1]);
      }
    } catch (error) {
      this.showError(`Failed to load world: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Reset state on error
      this.currentWorld = null;
      this.currentArc = null;
      this.currentBeats = [];
      this.recentEvents = [];
      this.allArcs = [];
      this.selectedBeat = null;
    } finally {
      this.showLoading(false);
    }
  }

  private render() {
    this.container.innerHTML = `
      <div class="world-story-engine">
        <header>
          <h1>🌍 World Story Engine</h1>
          <p>Create and evolve dynamic world narratives</p>
          ${AuthService.isAuthenticated() ? `
            <div class="auth-info">
              <span>Signed in as ${AuthService.getCurrentUser()?.email}</span>
              <button id="sign-out-btn" class="secondary">Sign Out</button>
            </div>
          ` : ''}
        </header>

        <!-- Authentication Section -->
        <section id="auth-section" class="auth-section" style="display: none;">
          <div class="auth-forms">
            <div class="auth-form">
              <h2>Sign In</h2>
              <form id="sign-in-form">
                <input type="email" id="sign-in-email" placeholder="Email" required />
                <input type="password" id="sign-in-password" placeholder="Password" required />
                <button type="submit">Sign In</button>
              </form>
            </div>

            <div class="auth-form">
              <h2>Sign Up</h2>
              <form id="sign-up-form">
                <input type="email" id="sign-up-email" placeholder="Email" required />
                <input type="password" id="sign-up-password" placeholder="Password" required />
                <button type="submit">Sign Up</button>
              </form>
            </div>
          </div>
        </section>

        <!-- Main App Content (Protected) -->
        <main id="app-content" style="display: none;">
          <!-- Worlds List -->
          <section class="worlds-section">
            <h2>Your Worlds</h2>
            <div id="worlds-list" class="worlds-list">
              <!-- Worlds will be listed here -->
            </div>
          </section>

          <!-- World Creation -->
          <section class="world-creation">
            <h2>Create New World</h2>
            <form id="create-world-form">
              <input type="text" id="world-name" placeholder="World Name" required />
              <textarea id="world-description" placeholder="World Description" rows="3" required></textarea>
              <button type="submit">Create World</button>
            </form>
          </section>

          <!-- Current World Display -->
          <section class="current-world" id="current-world" style="display: none;">
            <h2>Current World: <span id="world-name-display"></span></h2>
            <p id="world-description-display"></p>
            
            <!-- Arc Selection -->
            <div class="arc-selection">
              <h3>Story Arcs</h3>
              <div id="arc-list" class="arc-list">
                <!-- Arc list will be populated here -->
              </div>
            </div>
            
            <!-- Arc Controls -->
            <div class="arc-controls">
              <h3>Current Arc</h3>
              <div id="arc-info" style="display: none;">
                <p><strong>Arc:</strong> <span id="arc-name"></span></p>
                <p><strong>Status:</strong> <span id="arc-status"></span></p>
                <button id="progress-arc-btn">Progress Story</button>
              </div>
              <div id="create-arc" style="display: none;">
                <input type="text" id="story-idea" placeholder="Story idea (optional)" />
                <button id="create-arc-btn">Start New Arc</button>
              </div>
            </div>

            <!-- Story Beats Timeline -->
            <div class="story-timeline">
              <h3>Story Timeline</h3>
              <div id="beats-timeline" class="beats-timeline"></div>
            </div>

            <!-- Selected Beat Display -->
            <div id="selected-beat" class="selected-beat" style="display: none;">
              <h3 id="selected-beat-name"></h3>
              <p id="selected-beat-description"></p>
              <div class="directives">
                <strong>World Changes:</strong>
                <ul id="selected-beat-directives"></ul>
              </div>
              <div class="storylines">
                <strong>Emerging Stories:</strong>
                <ul id="selected-beat-storylines"></ul>
              </div>
            </div>

            <!-- World Events -->
            <div class="world-events">
              <h3>Recent World Events</h3>
              <form id="record-event-form">
                <input type="text" id="event-description" placeholder="Event description" required />
                <select id="event-type">
                  <option value="player_action">Player Action</option>
                  <option value="environmental">Environmental</option>
                  <option value="social">Social</option>
                  <option value="system_event">System Event</option>
                </select>
                <select id="impact-level">
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="major">Major</option>
                  <option value="catastrophic">Catastrophic</option>
                </select>
                <button type="submit">Record Event</button>
              </form>
              <div id="events-list" class="events-list"></div>
            </div>
          </section>
        </main>

        <div id="loading" class="loading" style="display: none;">Loading...</div>
        <div id="error" class="error" style="display: none;"></div>
      </div>
    `;
  }

  private attachEventListeners() {
    // Auth Forms
    const signInForm = document.getElementById('sign-in-form') as HTMLFormElement;
    const signUpForm = document.getElementById('sign-up-form') as HTMLFormElement;
    const signOutBtn = document.getElementById('sign-out-btn');

    signInForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('sign-in-email') as HTMLInputElement).value;
      const password = (document.getElementById('sign-in-password') as HTMLInputElement).value;
      
      try {
        this.showLoading(true);
        await AuthService.signIn(email, password);
        signInForm.reset();
      } catch (error) {
        this.showError('Failed to sign in');
      } finally {
        this.showLoading(false);
      }
    });

    signUpForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('sign-up-email') as HTMLInputElement).value;
      const password = (document.getElementById('sign-up-password') as HTMLInputElement).value;
      
      try {
        this.showLoading(true);
        await AuthService.signUp(email, password);
        signUpForm.reset();
        this.showError('Check your email to confirm your account');
      } catch (error) {
        this.showError('Failed to sign up');
      } finally {
        this.showLoading(false);
      }
    });

    signOutBtn?.addEventListener('click', async () => {
      try {
        await AuthService.signOut();
      } catch (error) {
        this.showError('Failed to sign out');
      }
    });

    // Create World Form
    const createWorldForm = document.getElementById('create-world-form') as HTMLFormElement;
    createWorldForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.getElementById('world-name') as HTMLInputElement).value;
      const description = (document.getElementById('world-description') as HTMLTextAreaElement).value;
      
      await this.createWorld(name, description);
    });

    // Create Arc Button
    const createArcBtn = document.getElementById('create-arc-btn');
    createArcBtn?.addEventListener('click', async () => {
      const storyIdea = (document.getElementById('story-idea') as HTMLInputElement).value;
      await this.createArc(storyIdea);
    });

    // Progress Arc Button
    const progressArcBtn = document.getElementById('progress-arc-btn');
    progressArcBtn?.addEventListener('click', async () => {
      await this.progressArc();
    });

    // Record Event Form
    const recordEventForm = document.getElementById('record-event-form') as HTMLFormElement;
    recordEventForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = (document.getElementById('event-description') as HTMLInputElement).value;
      const eventType = (document.getElementById('event-type') as HTMLSelectElement).value;
      const impactLevel = (document.getElementById('impact-level') as HTMLSelectElement).value;
      
      await this.recordEvent(description, eventType, impactLevel);
    });

    // Timeline beat clicks for navigation
    const timeline = document.getElementById('beats-timeline');
    timeline?.addEventListener('click', (e) => {
      const beatEl = (e.target as HTMLElement).closest('.beat');
      if (beatEl) {
        const beatIndex = parseInt(beatEl.getAttribute('data-index') || '0', 10);
        const beat = this.currentBeats.find(b => b.beat_index === beatIndex);
        if (beat) {
          this.selectBeat(beat);
        }
      }
    });
  }

  private selectBeat(beat: WorldBeat) {
    this.selectedBeat = beat;
    
    const selectedBeatEl = document.getElementById('selected-beat');
    const nameEl = document.getElementById('selected-beat-name');
    const descEl = document.getElementById('selected-beat-description');
    const directivesEl = document.getElementById('selected-beat-directives');
    const storylinesEl = document.getElementById('selected-beat-storylines');
    
    if (selectedBeatEl && nameEl && descEl && directivesEl && storylinesEl) {
      selectedBeatEl.style.display = 'block';
      nameEl.textContent = beat.beat_name;
      descEl.textContent = beat.description;
      
      directivesEl.innerHTML = beat.world_directives
        .map(d => `<li>${d}</li>`)
        .join('');
        
      storylinesEl.innerHTML = beat.emergent_storylines
        .map(s => `<li>${s}</li>`)
        .join('');
    }

    // Refresh the events list to show only events tied to this beat so
    // the UI stays context-aware as the user navigates between beats.
    this.updateEventsList();
  }

  private showLoading(show: boolean) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'block' : 'none';
    }
  }

  private showError(message: string) {
    const errorEl = document.getElementById('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 5000);
    }
  }

  private async createWorld(name: string, description: string) {
    try {
      this.showLoading(true);
      const world = await api.createWorld(name, description);
      
      // Add to worlds list and select it
      this.worlds.unshift(world);
      this.updateWorldsList();
      await this.loadWorld(world.id);
      
      // Clear form
      (document.getElementById('world-name') as HTMLInputElement).value = '';
      (document.getElementById('world-description') as HTMLTextAreaElement).value = '';
    } catch (error) {
      this.showError(`Failed to create world: ${error}`);
    } finally {
      this.showLoading(false);
    }
  }

  public async handleArcSwitch(arcId: string) {
    try {
      this.showLoading(true);
      if (!this.currentWorld) throw new Error('No current world');

      const arc = this.allArcs.find(a => a.id === arcId);
      if (!arc) throw new Error('Arc not found');

      this.currentArc = arc;
      const beats = await api.getArcBeats(this.currentWorld.id, arcId);
      this.currentBeats = beats;
      
      this.updateWorldDisplay();

      // Select the latest beat in the new arc
      if (beats.length > 0) {
        this.selectBeat(beats[beats.length - 1]);
      }
    } catch (error) {
      this.showError(`Failed to switch arc: ${error}`);
    } finally {
      this.showLoading(false);
    }
  }

  private updateWorldDisplay() {
    if (!this.currentWorld) return;

    // Show world section
    const worldSection = document.getElementById('current-world');
    if (worldSection) {
      worldSection.style.display = 'block';
    }

    // Update world info
    const worldNameDisplay = document.getElementById('world-name-display');
    const worldDescDisplay = document.getElementById('world-description-display');
    if (worldNameDisplay) worldNameDisplay.textContent = this.currentWorld.name;
    if (worldDescDisplay) worldDescDisplay.textContent = this.currentWorld.description;

    // Update arc list
    this.updateArcList();

    // Update arc info
    const arcInfo = document.getElementById('arc-info');
    const createArc = document.getElementById('create-arc');
    
    if (this.currentArc) {
      if (arcInfo) arcInfo.style.display = 'block';
      if (createArc) createArc.style.display = 'none';
      
      const arcName = document.getElementById('arc-name');
      const arcStatus = document.getElementById('arc-status');
      if (arcName) arcName.textContent = this.currentArc.story_name;
      if (arcStatus) arcStatus.textContent = this.currentArc.status;
      
      // Disable progress button if arc is completed
      const progressBtn = document.getElementById('progress-arc-btn') as HTMLButtonElement;
      if (progressBtn) {
        progressBtn.disabled = this.currentArc.status === 'completed';
        progressBtn.textContent = this.currentArc.status === 'completed' ? 'Arc Completed' : 'Progress Story';
      }
    } else {
      if (arcInfo) arcInfo.style.display = 'none';
      if (createArc) createArc.style.display = 'block';
    }

    // Update beats timeline
    this.updateBeatsTimeline();
  }

  private updateArcList() {
    const arcList = document.getElementById('arc-list');
    if (!arcList) return;

    const html = this.allArcs.map(arc => `
      <div class="arc-item ${arc.id === this.currentArc?.id ? 'active' : ''} ${arc.status}">
        <div class="arc-header">
          <h4>${arc.story_name}</h4>
          <span class="arc-status">${arc.status}</span>
        </div>
        <p class="arc-idea">${arc.story_idea}</p>
        <button onclick="app.handleArcSwitch('${arc.id}')" ${arc.id === this.currentArc?.id ? 'disabled' : ''}>
          ${arc.id === this.currentArc?.id ? 'Current Arc' : 'Switch to Arc'}
        </button>
      </div>
    `).join('');

    arcList.innerHTML = html || '<p>No story arcs yet. Create one to begin!</p>';
  }

  private updateBeatsTimeline() {
    const timeline = document.getElementById('beats-timeline');
    if (!timeline) return;

    const totalBeats = 15;
    let html = '<div class="timeline">';
    
    for (let i = 0; i < totalBeats; i++) {
      const beat = this.currentBeats.find(b => b.beat_index === i);
      const isAnchor = i === 0 || i === 7 || i === 14;
      const isSelected = beat?.id === this.selectedBeat?.id;
      
      html += `
        <div class="beat ${beat ? 'completed' : 'pending'} ${isAnchor ? 'anchor' : 'dynamic'} ${isSelected ? 'selected' : ''}" 
             data-index="${i}"
             title="${beat ? beat.beat_name : `Beat ${i}`}">
          <div class="beat-number">${i}</div>
          ${beat ? `<div class="beat-name">${beat.beat_name}</div>` : ''}
        </div>
      `;
    }
    
    html += '</div>';
    
    timeline.innerHTML = html;
  }

  private async createArc(storyIdea: string) {
    if (!this.currentWorld) return;
    
    try {
      this.showLoading(true);
      const result = await api.createArc(this.currentWorld.id, storyIdea);
      this.currentArc = result.arc;
      this.currentBeats = result.anchors;
      
      // Add to all arcs
      this.allArcs.push(result.arc);
      
      this.updateWorldDisplay();
      
      // Select the first beat
      if (result.anchors.length > 0) {
        this.selectBeat(result.anchors[0]);
      }
      
      // Clear input
      (document.getElementById('story-idea') as HTMLInputElement).value = '';
    } catch (error) {
      this.showError(`Failed to create arc: ${error}`);
    } finally {
      this.showLoading(false);
    }
  }

  private async progressArc() {
    if (!this.currentWorld || !this.currentArc) return;
    
    try {
      this.showLoading(true);
      
      // Filter events to only include those from the CURRENT beat so we
      // don't accidentally feed the AI duplicate context from earlier
      // beats.  The current beat is always the last one in the timeline
      // (highest index) so we grab its id and filter accordingly.
      const currentBeatId = this.currentBeats.length
        ? this.currentBeats[this.currentBeats.length - 1].id
        : undefined;

      const eventsForContext = currentBeatId
        ? this.recentEvents.filter(e => e.beat_id === currentBeatId)
        : this.recentEvents;

      const recentEventsText = eventsForContext
        .slice(0, 5)
        .map(e => `[${e.impact_level}] ${e.description}`)
        .join('\n');
      
      const result = await api.progressArc(
        this.currentWorld.id, 
        this.currentArc.id,
        recentEventsText
      );
      
      if (result.completed) {
        this.currentArc.status = 'completed';
        // Update arc in allArcs
        const arcIndex = this.allArcs.findIndex(a => a.id === this.currentArc?.id);
        if (arcIndex !== -1) {
          this.allArcs[arcIndex] = this.currentArc;
        }
        this.showError('Arc completed! Create a new arc to continue the world story.');
      } else {
        // Add new beat to our list
        this.currentBeats.push(result);
        // Select the new beat
        this.selectBeat(result);
      }
      
      this.updateWorldDisplay();
    } catch (error) {
      this.showError(`Failed to progress arc: ${error}`);
    } finally {
      this.showLoading(false);
    }
  }

  private async recordEvent(description: string, eventType: string, impactLevel: string) {
    if (!this.currentWorld) return;
    
    try {
      // Always associate the new event with the *current* beat so the
      // backend can cleanly separate events by beat.  This also enables
      // us to provide precise context when we ask the AI to progress
      // the story.
      const currentBeatId = this.currentBeats.length
        ? this.currentBeats[this.currentBeats.length - 1].id
        : undefined;

      const event = await api.recordEvent(this.currentWorld.id, {
        eventType,
        description,
        impactLevel,
        arcId: this.currentArc?.id,
        beatId: currentBeatId
      });
      
      // Add to beginning of events list
      this.recentEvents.unshift(event);
      this.updateEventsList();
      
      // Clear form
      (document.getElementById('event-description') as HTMLInputElement).value = '';
    } catch (error) {
      this.showError(`Failed to record event: ${error}`);
    }
  }

  private async loadEvents() {
    if (!this.currentWorld) return;
    
    try {
      this.recentEvents = await api.getEvents(this.currentWorld.id);
      this.updateEventsList();
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  private updateEventsList() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    // Determine which beat's events to show.  Prefer the selected beat if
    // the user has clicked one; otherwise default to the *current* beat
    // (the most recently generated beat in the timeline).
    const beatIdToShow = this.selectedBeat?.id || (this.currentBeats.length
      ? this.currentBeats[this.currentBeats.length - 1].id
      : undefined);

    const filteredEvents = beatIdToShow
      ? this.recentEvents.filter(e => e.beat_id === beatIdToShow)
      : this.recentEvents;

    const html = filteredEvents.slice(0, 10).map(event => `
      <div class="event ${event.impact_level}">
        <div class="event-header">
          <span class="event-type">${event.event_type}</span>
          <span class="event-impact">${event.impact_level}</span>
        </div>
        <p>${event.description}</p>
        <time>${new Date(event.created_at).toLocaleString()}</time>
      </div>
    `).join('');
    
    eventsList.innerHTML = html || '<p>No events recorded yet for this beat</p>';
  }
}

// Make app instance available globally for arc switching
declare global {
  interface Window {
    app: WorldStoryApp;
  }
}

export default WorldStoryApp;