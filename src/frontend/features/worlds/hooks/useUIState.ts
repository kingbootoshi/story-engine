import { useState } from 'react';
import type { ViewDensity } from '../types';

export function useUIState() {
  const [expandedBeat, setExpandedBeat] = useState(false);
  const [viewDensity, setViewDensity] = useState<ViewDensity>('standard');

  return {
    expandedBeat,
    viewDensity,
    setExpandedBeat,
    setViewDensity
  };
}