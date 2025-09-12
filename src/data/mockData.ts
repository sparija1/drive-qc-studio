// Mock data for the QC Dashboard

export interface Frame {
  id: string;
  filePath: string;
  sequence_id: string;
  attributes: {
    timeOfDay: 'day' | 'night' | 'dawn' | 'dusk';
    roadType: 'highway' | 'city' | 'rural';
    trafficDensity: 'low' | 'medium' | 'high';
    weather: 'clear' | 'rain' | 'fog' | 'snow';
  };
  accuracyScore: number;
  timestamp: string;
}

export interface Sequence {
  id: string;
  name: string;
  pipeline_id: string;
  frameCount: number;
  duration: number; // in seconds
  aggregatedAttributes: {
    predominantTimeOfDay: string;
    predominantRoadType: string;
    avgTrafficDensity: string;
    predominantWeather: string;
  };
  avgAccuracyScore: number;
  createdAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  project_id: string;
  sequenceCount: number;
  totalFrames: number;
  status: 'active' | 'completed' | 'pending';
  createdAt: string;
  lastModified: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  pipelineCount: number;
  totalSequences: number;
  totalFrames: number;
  createdAt: string;
  lastModified: string;
  status: 'active' | 'completed' | 'archived';
}

// Mock data
export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Highway Data Collection Q1',
    description: 'Comprehensive highway driving data collection for Q1 2024, focusing on high-speed scenarios and weather variations.',
    pipelineCount: 8,
    totalSequences: 142,
    totalFrames: 28450,
    createdAt: '2024-01-15',
    lastModified: '2024-03-20',
    status: 'active'
  },
  {
    id: 'proj-2',
    name: 'Urban Traffic Analysis',
    description: 'City driving scenarios with focus on complex traffic interactions, pedestrians, and various lighting conditions.',
    pipelineCount: 12,
    totalSequences: 203,
    totalFrames: 41820,
    createdAt: '2024-02-01',
    lastModified: '2024-03-18',
    status: 'active'
  },
  {
    id: 'proj-3',
    name: 'Weather Condition Dataset',
    description: 'Specialized collection focusing on adverse weather conditions including rain, snow, and fog scenarios.',
    pipelineCount: 6,
    totalSequences: 89,
    totalFrames: 15680,
    createdAt: '2023-11-10',
    lastModified: '2024-01-05',
    status: 'completed'
  }
];

export const mockPipelines: Pipeline[] = [
  {
    id: 'pipe-1',
    name: 'Highway Night Conditions',
    description: 'Night-time highway driving data with various lighting conditions.',
    project_id: 'proj-1',
    sequenceCount: 24,
    totalFrames: 4800,
    status: 'completed',
    createdAt: '2024-01-15',
    lastModified: '2024-02-10'
  },
  {
    id: 'pipe-2',
    name: 'High-Speed Merging',
    description: 'High-speed highway merging scenarios during peak hours.',
    project_id: 'proj-1',
    sequenceCount: 18,
    totalFrames: 3600,
    status: 'active',
    createdAt: '2024-02-01',
    lastModified: '2024-03-15'
  },
  {
    id: 'pipe-3',
    name: 'Downtown Rush Hour',
    description: 'Urban traffic during rush hour with high pedestrian activity.',
    project_id: 'proj-2',
    sequenceCount: 35,
    totalFrames: 8750,
    status: 'active',
    createdAt: '2024-02-15',
    lastModified: '2024-03-18'
  }
];

export const mockSequences: Sequence[] = [
  {
    id: 'seq-1',
    name: 'Highway Exit Ramp - Night',
    pipeline_id: 'pipe-1',
    frameCount: 200,
    duration: 20,
    aggregatedAttributes: {
      predominantTimeOfDay: 'night',
      predominantRoadType: 'highway',
      avgTrafficDensity: 'medium',
      predominantWeather: 'clear'
    },
    avgAccuracyScore: 0.94,
    createdAt: '2024-01-20'
  },
  {
    id: 'seq-2', 
    name: 'Tunnel Passage',
    pipeline_id: 'pipe-1',
    frameCount: 150,
    duration: 15,
    aggregatedAttributes: {
      predominantTimeOfDay: 'night',
      predominantRoadType: 'highway',
      avgTrafficDensity: 'low',
      predominantWeather: 'clear'
    },
    avgAccuracyScore: 0.87,
    createdAt: '2024-01-22'
  },
  {
    id: 'seq-3',
    name: 'Merging Lane Traffic',
    pipeline_id: 'pipe-2',
    frameCount: 180,
    duration: 18,
    aggregatedAttributes: {
      predominantTimeOfDay: 'day',
      predominantRoadType: 'highway',
      avgTrafficDensity: 'high',
      predominantWeather: 'clear'
    },
    avgAccuracyScore: 0.91,
    createdAt: '2024-02-05'
  }
];

export const mockFrames: Frame[] = [
  {
    id: 'frame-1',
    filePath: '/frames/highway-night-001.jpg',
    sequence_id: 'seq-1',
    attributes: {
      timeOfDay: 'night',
      roadType: 'highway',
      trafficDensity: 'medium',
      weather: 'clear'
    },
    accuracyScore: 0.95,
    timestamp: '2024-01-20T22:15:30Z'
  },
  {
    id: 'frame-2',
    filePath: '/frames/highway-night-002.jpg',
    sequence_id: 'seq-1',
    attributes: {
      timeOfDay: 'night',
      roadType: 'highway',
      trafficDensity: 'medium',
      weather: 'clear'
    },
    accuracyScore: 0.93,
    timestamp: '2024-01-20T22:15:31Z'
  },
  {
    id: 'frame-3',
    filePath: '/frames/tunnel-001.jpg',
    sequence_id: 'seq-2',
    attributes: {
      timeOfDay: 'night',
      roadType: 'highway',
      trafficDensity: 'low',
      weather: 'clear'
    },
    accuracyScore: 0.88,
    timestamp: '2024-01-22T23:45:12Z'
  }
];

// Helper functions
export const getProjectById = (id: string): Project | undefined => 
  mockProjects.find(project => project.id === id);

export const getPipelinesByProjectId = (projectId: string): Pipeline[] =>
  mockPipelines.filter(pipeline => pipeline.project_id === projectId);

export const getSequencesByPipelineId = (pipelineId: string): Sequence[] =>
  mockSequences.filter(sequence => sequence.pipeline_id === pipelineId);

export const getFramesBySequenceId = (sequenceId: string): Frame[] =>
  mockFrames.filter(frame => frame.sequence_id === sequenceId);

export const getPipelineById = (id: string): Pipeline | undefined =>
  mockPipelines.find(pipeline => pipeline.id === id);

export const getSequenceById = (id: string): Sequence | undefined =>
  mockSequences.find(sequence => sequence.id === id);