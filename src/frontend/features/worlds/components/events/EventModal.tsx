import { useEffect } from 'react';
import { useSound } from '@/features/audio';
import { EntityModal } from '../modals/EntityModal';
import { EventForm } from './EventForm';
import type { NewEventForm } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  newEvent: NewEventForm;
  onEventChange: (event: NewEventForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Modal for adding world events
 * Provides a centered modal experience for event creation
 */
export function EventModal({ 
  isOpen, 
  onClose, 
  newEvent, 
  onEventChange, 
  onSubmit 
}: EventModalProps) {
  const { play } = useSound();

  // Play sound when modal opens
  useEffect(() => {
    if (isOpen) {
      play('click_menu_button');
    }
  }, [isOpen, play]);

  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e);
    // The parent component will handle closing the modal after successful submission
  };

  return (
    <EntityModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Add World Event"
    >
      <EventForm
        newEvent={newEvent}
        onEventChange={onEventChange}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </EntityModal>
  );
} 