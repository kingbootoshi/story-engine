import { api } from './api';
import type { World, WorldArc, WorldBeat, WorldEvent } from './api';

export class WorldStoryApp {
  private currentWorld: World | null = null;
  private currentArc: WorldArc | null = null;
  private currentBeats: WorldBeat[] = [];
  private recentEvents: WorldEvent[] = [];

  constructor(private container: HTMLElement) {
    this.render();
    this.attachEventListeners();
  }

  private render() {
    this.container.innerHTML = `
      <div class="world-story-engine">
        <header>
          <h1>🌍 World Story Engine</h1>
          <p>Create and evolve dynamic world narratives</p>
        </header>

        <main>
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
            
            <!-- Arc Controls -->
            <div class="arc-controls">
              <h3>Story Arc</h3>
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

          <!-- World Selector -->
          <section class="world-selector">
            <h3>Load Existing World</h3>
            <input type="text" id="world-id-input" placeholder="Enter World ID" />
            <button id="load-world-btn">Load World</button>
          </section>
        </main>

        <div id="loading" class="loading" style="display: none;">Loading...</div>
        <div id="error" class="error" style="display: none;"></div>
      </div>
    `;
  }

  private attachEventListeners() {
    // Create World Form
    const createWorldForm = document.getElementById('create-world-form') as HTMLFormElement;
    createWorldForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.getElementById('world-name') as HTMLInputElement).value;
      const description = (document.getElementById('world-description') as HTMLTextAreaElement).value;
      
      await this.createWorld(name, description);
    });

    // Load World Button
    const loadWorldBtn = document.getElementById('load-world-btn');
    loadWorldBtn?.addEventListener('click', async () => {
      const worldId = (document.getElementById('world-id-input') as HTMLInputElement).value;
      if (worldId) {
        await this.loadWorld(worldId);
      }
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
      this.currentWorld = world;
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

  private async loadWorld(worldId: string) {
    try {
      this.showLoading(true);
      const worldState = await api.getWorldState(worldId);
      
      this.currentWorld = worldState.world;
      this.currentArc = worldState.currentArc;
      this.currentBeats = worldState.currentBeats;
      this.recentEvents = worldState.recentEvents;
      
      this.updateWorldDisplay();
      await this.loadEvents();
    } catch (error) {
      this.showError(`Failed to load world: ${error}`);
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

  private updateBeatsTimeline() {
    const timeline = document.getElementById('beats-timeline');
    if (!timeline) return;

    const totalBeats = 15;
    let html = '<div class="timeline">';
    
    for (let i = 0; i < totalBeats; i++) {
      const beat = this.currentBeats.find(b => b.beat_index === i);
      const isAnchor = i === 0 || i === 7 || i === 14;
      
      html += `
        <div class="beat ${beat ? 'completed' : 'pending'} ${isAnchor ? 'anchor' : 'dynamic'}" 
             title="${beat ? beat.beat_name : `Beat ${i}`}">
          <div class="beat-number">${i}</div>
          ${beat ? `<div class="beat-name">${beat.beat_name}</div>` : ''}
        </div>
      `;
    }
    
    html += '</div>';
    
    if (this.currentBeats.length > 0) {
      const latestBeat = this.currentBeats[this.currentBeats.length - 1];
      html += `
        <div class="latest-beat">
          <h4>${latestBeat.beat_name}</h4>
          <p>${latestBeat.description}</p>
          <div class="directives">
            <strong>World Changes:</strong>
            <ul>
              ${latestBeat.world_directives.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
          <div class="storylines">
            <strong>Emerging Stories:</strong>
            <ul>
              ${latestBeat.emergent_storylines.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }
    
    timeline.innerHTML = html;
  }

  private async createArc(storyIdea: string) {
    if (!this.currentWorld) return;
    
    try {
      this.showLoading(true);
      const result = await api.createArc(this.currentWorld.id, storyIdea);
      this.currentArc = result.arc;
      this.currentBeats = result.anchors;
      
      this.updateWorldDisplay();
      
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
      
      // Get recent events as context
      const recentEventsText = this.recentEvents
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
        this.showError('Arc completed! Create a new arc to continue the world story.');
      } else {
        // Add new beat to our list
        this.currentBeats.push(result);
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
      const event = await api.recordEvent(this.currentWorld.id, {
        eventType,
        description,
        impactLevel,
        arcId: this.currentArc?.id
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
    
    const html = this.recentEvents.slice(0, 10).map(event => `
      <div class="event ${event.impact_level}">
        <div class="event-header">
          <span class="event-type">${event.event_type}</span>
          <span class="event-impact">${event.impact_level}</span>
        </div>
        <p>${event.description}</p>
        <time>${new Date(event.created_at).toLocaleString()}</time>
      </div>
    `).join('');
    
    eventsList.innerHTML = html || '<p>No events recorded yet</p>';
  }
}

export default WorldStoryApp;