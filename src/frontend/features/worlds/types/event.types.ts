export interface NewEventForm {
  eventType: 'player_action' | 'system_event' | 'world_event';
  impactLevel: 'minor' | 'moderate' | 'major';
  description: string;
}

export interface EventFormProps {
  newEvent: NewEventForm;
  onEventChange: (event: NewEventForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export interface EventListProps {
  events: Array<{
    id: string;
    impact_level: 'minor' | 'moderate' | 'major';
    description: string;
    created_at: string;
  }>;
  isVisible: boolean;
}