import { hasSupabaseConfig, supabase } from '../supabaseClient';
import { Activity, Dependency, Milestone, Project, ProjectDetails, ProjectStatus } from '../types';
import {
  mockCreateActivity,
  mockCreateDependency,
  mockCreateMilestone,
  mockCreateProject,
  mockDeleteActivity,
  mockDeleteDependency,
  mockDeleteMilestone,
  mockDeleteProject,
  mockFetchActivities,
  mockFetchDependenciesForActivities,
  mockFetchMilestones,
  mockFetchProject,
  mockFetchProjectDetails,
  mockFetchProjects
} from './mockData';

const baseProjectColumns = [
  'id',
  'name',
  'description',
  'start_date',
  'end_date',
  'project_owner',
  'project_manager',
  'impact_owner',
  'status',
  'priority'
].join(',');

function throwIfError(error: Error | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function fetchProjects(statusFilter?: ProjectStatus): Promise<Project[]> {
  if (!hasSupabaseConfig) return mockFetchProjects(statusFilter);

  let query = supabase
    .from('projects')
    .select(baseProjectColumns)
    .order('start_date', { ascending: true });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  throwIfError(error, 'Kunde inte hämta projekt');
  return data ?? [];
}

export async function fetchProject(projectId: string): Promise<Project | null> {
  if (!hasSupabaseConfig) return mockFetchProject(projectId);

  const { data, error } = await supabase
    .from('projects')
    .select(baseProjectColumns)
    .eq('id', projectId)
    .single();

  throwIfError(error, 'Kunde inte hämta projekt');
  return data ?? null;
}

export async function createProject(payload: Omit<Project, 'id'>): Promise<Project> {
  if (!hasSupabaseConfig) return mockCreateProject(payload);

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select()
    .single();

  throwIfError(error, 'Kunde inte skapa projekt');
  return data as Project;
}

export async function updateProject(projectId: string, payload: Partial<Project>): Promise<Project> {
  if (!hasSupabaseConfig) {
    // Enkelt demo-stöd: hämta, slå ihop och returnera.
    const project = await mockFetchProject(projectId);
    if (!project) throw new Error('Projektet hittades inte i demo-läget.');
    const updated: Project = { ...project, ...payload } as Project;
    return updated;
  }

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .select()
    .single();

  throwIfError(error, 'Kunde inte uppdatera projekt');
  return data as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  if (!hasSupabaseConfig) return mockDeleteProject(projectId);

  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  throwIfError(error, 'Kunde inte ta bort projekt');
}

export async function fetchActivities(projectId: string): Promise<Activity[]> {
  if (!hasSupabaseConfig) return mockFetchActivities(projectId);

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('project_id', projectId)
    .order('start_date', { ascending: true });

  throwIfError(error, 'Kunde inte hämta aktiviteter');
  return data ?? [];
}

export async function createActivity(payload: Omit<Activity, 'id'>): Promise<Activity> {
  if (!hasSupabaseConfig) return mockCreateActivity(payload);

  const { data, error } = await supabase
    .from('activities')
    .insert(payload)
    .select()
    .single();

  throwIfError(error, 'Kunde inte skapa aktivitet');
  return data as Activity;
}

export async function updateActivity(activityId: string, payload: Partial<Activity>): Promise<Activity> {
  if (!hasSupabaseConfig) {
    const allActivities = (
      await Promise.all((await mockFetchProjects()).map((project) => mockFetchActivities(project.id)))
    ).flat();
    const activity = allActivities.find((a) => a.id === activityId);
    if (!activity) throw new Error('Aktiviteten hittades inte i demo-läget.');
    return { ...activity, ...payload } as Activity;
  }

  const { data, error } = await supabase
    .from('activities')
    .update(payload)
    .eq('id', activityId)
    .select()
    .single();

  throwIfError(error, 'Kunde inte uppdatera aktivitet');
  return data as Activity;
}

export async function deleteActivity(activityId: string): Promise<void> {
  if (!hasSupabaseConfig) return mockDeleteActivity(activityId);

  const { error } = await supabase.from('activities').delete().eq('id', activityId);
  throwIfError(error, 'Kunde inte ta bort aktivitet');
}

export async function fetchMilestones(projectId: string): Promise<Milestone[]> {
  if (!hasSupabaseConfig) return mockFetchMilestones(projectId);

  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true });

  throwIfError(error, 'Kunde inte hämta beslutspunkter');
  return data ?? [];
}

export async function createMilestone(payload: Omit<Milestone, 'id'>): Promise<Milestone> {
  if (!hasSupabaseConfig) return mockCreateMilestone(payload);

  const { data, error } = await supabase
    .from('milestones')
    .insert(payload)
    .select()
    .single();

  throwIfError(error, 'Kunde inte skapa beslutspunkt');
  return data as Milestone;
}

export async function updateMilestone(milestoneId: string, payload: Partial<Milestone>): Promise<Milestone> {
  if (!hasSupabaseConfig) {
    const allMilestones = (
      await Promise.all((await mockFetchProjects()).map((project) => mockFetchMilestones(project.id)))
    ).flat();
    const existing = allMilestones.find((m) => m.id === milestoneId);
    if (!existing) throw new Error('Beslutspunkten hittades inte i demo-läget.');
    return { ...existing, ...payload } as Milestone;
  }

  const { data, error } = await supabase
    .from('milestones')
    .update(payload)
    .eq('id', milestoneId)
    .select()
    .single();

  throwIfError(error, 'Kunde inte uppdatera beslutspunkt');
  return data as Milestone;
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  if (!hasSupabaseConfig) return mockDeleteMilestone(milestoneId);

  const { error } = await supabase.from('milestones').delete().eq('id', milestoneId);
  throwIfError(error, 'Kunde inte ta bort beslutspunkt');
}

export async function fetchDependenciesForActivities(activityIds: string[]): Promise<Dependency[]> {
  if (!hasSupabaseConfig) return mockFetchDependenciesForActivities(activityIds);

  if (!activityIds.length) return [];

  const idList = activityIds.join(',');
  const { data, error } = await supabase
    .from('dependencies')
    .select('*')
    .or(`from_activity_id.in.(${idList}),to_activity_id.in.(${idList})`);

  throwIfError(error, 'Kunde inte hämta beroenden');
  return data ?? [];
}

export async function createDependency(payload: Omit<Dependency, 'id'>): Promise<Dependency> {
  if (!hasSupabaseConfig) return mockCreateDependency(payload);

  const { data, error } = await supabase
    .from('dependencies')
    .insert(payload)
    .select()
    .single();

  throwIfError(error, 'Kunde inte skapa beroende');
  return data as Dependency;
}

export async function deleteDependency(dependencyId: string): Promise<void> {
  if (!hasSupabaseConfig) return mockDeleteDependency(dependencyId);

  const { error } = await supabase.from('dependencies').delete().eq('id', dependencyId);
  throwIfError(error, 'Kunde inte ta bort beroende');
}

export async function fetchProjectDetails(projectId: string): Promise<ProjectDetails | null> {
  if (!hasSupabaseConfig) return mockFetchProjectDetails(projectId);

  const project = await fetchProject(projectId);
  if (!project) return null;

  const [activities, milestones] = await Promise.all([
    fetchActivities(projectId),
    fetchMilestones(projectId)
  ]);

  const dependencies = await fetchDependenciesForActivities(activities.map((activity) => activity.id));

  return {
    project,
    activities,
    milestones,
    dependencies
  };
}
