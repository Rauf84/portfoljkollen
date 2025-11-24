export type ProjectStatus = 'planerat' | 'pågående' | 'avslutat';

export interface Project {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  project_owner?: string;
  project_manager?: string;
  impact_owner?: string;
  status?: ProjectStatus;
  priority?: number;
}

export interface Activity {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  responsible?: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  decision_type?: string;
  date?: string;
  status?: string;
}

export interface Dependency {
  id: string;
  from_activity_id: string;
  to_activity_id: string;
  type?: string;
}

export interface ProjectDetails {
  project: Project;
  activities: Activity[];
  milestones: Milestone[];
  dependencies: Dependency[];
}
