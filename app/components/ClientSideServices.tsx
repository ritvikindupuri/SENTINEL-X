"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { RealTimeInferenceService } from '@/lib/real-time-inference';

const DataServiceProvider = dynamic(() => import('./DataServiceProvider'), {
  ssr: false,
});

interface ClientSideServicesProps {
  onServiceReady: (service: RealTimeInferenceService) => void;
  children: React.ReactNode;
}

export default function ClientSideServices({ onServiceReady, children }: ClientSideServicesProps) {
  const [service, setService] = useState<RealTimeInferenceService | null>(null);

  const handleServiceReady = (service: RealTimeInferenceService) => {
    setService(service);
    onServiceReady(service);
  };

  if (!service) {
    return <DataServiceProvider onServiceReady={handleServiceReady} />;
  }

  return <>{children}</>;
}
