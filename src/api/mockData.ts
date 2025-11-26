import { Activity, Dependency, Milestone, Project, ProjectDetails, ProjectStatus } from '../types';
import { v4 as uuid } from 'uuid';

// Enkel in-memory-databas för demo-läge så att appen kan visas utan Supabase.
const projects: Project[] = [
  {
    id: uuid(),
    name: 'Implementera Supabase-MVP',
    description: 'Bygg frontenden och koppla mot Supabase Auth + PostgreSQL.',
    start_date: '2024-05-01',
    end_date: '2024-07-01',
    project_owner: 'Anna Andersson',
    project_manager: 'Per Projektledare',
    impact_owner: 'Ida Impact',
    status: 'pågående',
    priority: 1
  },
  {
    id: uuid(),
    name: 'Portföljvy och rapporter',
    description: 'Ge ledningen en enkel portföljöversikt med filter.',
    start_date: '2024-06-01',
    end_date: '2024-09-15',
    project_owner: 'Bo Beställare',
    project_manager: 'Lisa Ledare',
    impact_owner: 'Ida Impact',
    status: 'planerat',
    priority: 2
  }
];

const activities: Activity[] = [
  {
    id: uuid(),
    project_id: projects[0].id,
    name: 'Sätta upp Supabase-projekt',
    description: 'Skapa databastabeller och Auth-konfiguration.',
    start_date: '2024-05-01',
    end_date: '2024-05-05',
    status: 'avslutat',
    responsible: 'Anna Andersson'
  },
  {
    id: uuid(),
    project_id: projects[0].id,
    name: 'Bygga React-UI',
    description: 'Skapa listor och formulär för projekt och aktiviteter.',
    start_date: '2024-05-06',
    end_date: '2024-06-01',
    status: 'pågående',
    responsible: 'Per Projektledare'
  }
];

const milestones: Milestone[] = [
  {
    id: uuid(),
    project_id: projects[0].id,
    name: 'Go/No-Go frontend',
    decision_type: 'go/no-go',
    date: '2024-06-05',
    status: 'planerat'
  }
];

const dependencies: Dependency[] = [
  {
    id: uuid(),
    from_activity_id: activities[1].id,
    to_activity_id: activities[0].id,
    type: 'finish-to-start'
  }
];

function filterByProject<T extends { project_id: string }>(projectId: string, list: T[]): T[] {
  return list.filter((item) => item.project_id === projectId);
}

export async function mockFetchProjects(statusFilter?: ProjectStatus): Promise<Project[]> {
  return statusFilter ? projects.filter((project) => project.status === statusFilter) : projects;
}

export async function mockFetchProject(projectId: string): Promise<Project | null> {
  return projects.find((project) => project.id === projectId) ?? null;
}

export async function mockCreateProject(payload: Omit<Project, 'id'>): Promise<Project> {
  const newProject: Project = { ...payload, id: uuid() };
  projects.push(newProject);
  return newProject;
}

export async function mockDeleteProject(projectId: string): Promise<void> {
  const projectIndex = projects.findIndex((project) => project.id === projectId);
  if (projectIndex >= 0) {
    projects.splice(projectIndex, 1);
  }
  // Rensa relaterade poster
  const removeActivityIds = activities.filter((a) => a.project_id === projectId).map((a) => a.id);
  removeActivityIds.forEach((activityId) => {
    const idx = activities.findIndex((a) => a.id === activityId);
    if (idx >= 0) activities.splice(idx, 1);
  });
  const milestoneIndexes = milestones
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => m.project_id === projectId)
    .map(({ idx }) => idx);
  milestoneIndexes.reverse().forEach((idx) => milestones.splice(idx, 1));
  const dependencyIndexes = dependencies
    .map((d, idx) => ({ d, idx }))
    .filter(({ d }) => removeActivityIds.includes(d.from_activity_id) || removeActivityIds.includes(d.to_activity_id))
    .map(({ idx }) => idx);
  dependencyIndexes.reverse().forEach((idx) => dependencies.splice(idx, 1));
}

export async function mockFetchActivities(projectId: string): Promise<Activity[]> {
  return filterByProject(projectId, activities);
}

export async function mockCreateActivity(payload: Omit<Activity, 'id'>): Promise<Activity> {
  const newActivity: Activity = { ...payload, id: uuid() };
  activities.push(newActivity);
  return newActivity;
}

export async function mockDeleteActivity(activityId: string): Promise<void> {
  const idx = activities.findIndex((activity) => activity.id === activityId);
  if (idx >= 0) activities.splice(idx, 1);
  const depIndexes = dependencies
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.from_activity_id === activityId || d.to_activity_id === activityId)
    .map(({ i }) => i);
  depIndexes.reverse().forEach((index) => dependencies.splice(index, 1));
}

export async function mockFetchMilestones(projectId: string): Promise<Milestone[]> {
  return filterByProject(projectId, milestones);
}

export async function mockCreateMilestone(payload: Omit<Milestone, 'id'>): Promise<Milestone> {
  const newMilestone: Milestone = { ...payload, id: uuid() };
  milestones.push(newMilestone);
  return newMilestone;
}

export async function mockDeleteMilestone(milestoneId: string): Promise<void> {
  const idx = milestones.findIndex((milestone) => milestone.id === milestoneId);
  if (idx >= 0) milestones.splice(idx, 1);
}

export async function mockFetchDependenciesForActivities(activityIds: string[]): Promise<Dependency[]> {
  return dependencies.filter(
    (dependency) => activityIds.includes(dependency.from_activity_id) || activityIds.includes(dependency.to_activity_id)
  );
}

export async function mockCreateDependency(payload: Omit<Dependency, 'id'>): Promise<Dependency> {
  const newDependency: Dependency = { ...payload, id: uuid() };
  dependencies.push(newDependency);
  return newDependency;
}

export async function mockDeleteDependency(dependencyId: string): Promise<void> {
  const idx = dependencies.findIndex((dependency) => dependency.id === dependencyId);
  if (idx >= 0) dependencies.splice(idx, 1);
}

export async function mockFetchProjectDetails(projectId: string): Promise<ProjectDetails | null> {
  const project = await mockFetchProject(projectId);
  if (!project) return null;

  const [projectActivities, projectMilestones] = await Promise.all([
    mockFetchActivities(projectId),
    mockFetchMilestones(projectId)
  ]);

  const projectDependencies = await mockFetchDependenciesForActivities(projectActivities.map((activity) => activity.id));

  return {
    project,
    activities: projectActivities,
    milestones: projectMilestones,
    dependencies: projectDependencies
  };
}
