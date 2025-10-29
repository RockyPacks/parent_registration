import React from 'react';

export enum StepStatus {
  Completed = 'completed',
  Active = 'active',
  Pending = 'pending',
}

export interface Step {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
}

export interface Subject {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}
