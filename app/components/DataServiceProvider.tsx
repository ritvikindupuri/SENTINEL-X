"use client";

import { useEffect } from 'react';
import { RealTimeInferenceService } from '@/lib/real-time-inference';

interface DataServiceProviderProps {
  onServiceReady: (service: RealTimeInferenceService) => void;
}

const DataServiceProvider = ({ onServiceReady }: DataServiceProviderProps) => {
  useEffect(() => {
    const service = new RealTimeInferenceService();
    onServiceReady(service);

    return () => {
      service.stopService();
    };
  }, [onServiceReady]);

  return null; // This component does not render anything
};

export default DataServiceProvider;
