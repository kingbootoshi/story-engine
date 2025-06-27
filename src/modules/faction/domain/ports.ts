import type { 
  Faction, 
  CreateFaction, 
  UpdateFaction, 
  FactionRelation,
  DiplomaticStance,
  HistoricalEvent
} from './schema';

export interface IFactionRepository {
  create(faction: CreateFaction): Promise<Faction>;
  update(id: string, updates: UpdateFaction): Promise<Faction>;
  findById(id: string): Promise<Faction | null>;
  findByWorldId(worldId: string): Promise<Faction[]>;
  delete(id: string): Promise<void>;
  
  addHistoricalEvent(id: string, event: HistoricalEvent): Promise<void>;
  
  setRelation(
    sourceId: string, 
    targetId: string, 
    stance: DiplomaticStance, 
    worldId: string
  ): Promise<void>;
  
  getRelations(factionId: string): Promise<FactionRelation[]>;
  getRelation(sourceId: string, targetId: string): Promise<FactionRelation | null>;
}

export interface IFactionAI {
  generateFaction(params: {
    worldId: string;
    worldTheme: string;
    existingFactions: string[];
    locationContext?: string;
    userId?: string;
  }): Promise<CreateFaction>;
  
  updateDoctrine(params: {
    faction: Faction;
    statusChange: { from: string; to: string; reason: string };
    worldContext: string;
    userId?: string;
  }): Promise<{ ideology: string; tags: string[] }>;
  
  evaluateRelations(params: {
    worldId: string;
    factions: Faction[];
    currentRelations: FactionRelation[];
    beatContext: string;
    userId?: string;
  }): Promise<Array<{
    sourceId: string;
    targetId: string;
    suggestedStance: DiplomaticStance;
    reason: string;
  }>>;
  
  generatePropaganda(params: {
    faction: Faction;
    targetAudience: string;
    topic: string;
  }): Promise<string>;
}