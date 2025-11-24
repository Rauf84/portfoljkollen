import { supabase } from '../supabaseClient';
import { Activity, Dependency, Milestone, Project, ProjectDetails, ProjectStatus } from '../types';

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
  const { data, error } = await supabase
    .from('projects')
    .select(baseProjectColumns)
    .eq('id', projectId)
    .single();

  throwIfError(error, 'Kunde inte hämta projekt');
  return data ?? null;
}

export async function createProject(payload: Omit<Project, 'id'>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select()
    .single();

  throwIfError(error, 'Kunde inte skapa projekt');
  return data as Project;
}

export async function updateProject(projectId: string, payload: Partial<Project>): Promise<Project> {
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
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  throwIfError(error, 'Kunde inte ta bort projekt');
}

export async function fetchActivities(projectId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('project_id', projectId)
    .order('start_date', { ascending: true });

  throwIfError(error, 'Kunde inte hämta aktiviteter');
  return data ?? [];
}

export async function createActivity(payload: Omit<Activity, 'id'>): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert(payload)
    .select()
    .single();

  throwIfError(error, 'Kunde inte skapa aktivitet');
  return data as Activity;
}

export async function updateActivity(activityId: string, payload: Partial<Activity>): Promise<Activity> {
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
  const { error } = await supabase.from('activities').delete().eq('id', activityId);
  throwIfError(error, 'Kunde inte ta bort aktivitet');
}

export async function fetchMilestones(projectId: string): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true });

  throwIfError(error, 'Kunde inte hämta beslutspunkter');
  return data ?? [];
}

export async function createMilestone(payload: Omit<Milestone, 'id'>): Promise<Milestone> {
  const { data, error } = await supabase
    .from('milestones')
    .insert(payload)
    .select()
    .single();

  throwIfError(error, 'Kunde inte skapa beslutspunkt');
  return data as Milestone;
}

export async function updateMilestone(milestoneId: string, payload: Partial<Milestone>): Promise<Milestone> {
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
  const { error } = await supabase.from('milestones').delete().eq('id', milestoneId);
  throwIfError(error, 'Kunde inte ta bort beslutspunkt');
}

export async function fetchDependenciesForActivities(activityIds: string[]): Promise<Dependency[]> {
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
  const { data, error } = await supabase
    .from('dependencies')
    .insert(payload)
    .select()
    .single();

  throwIfError(error, 'Kunde inte skapa beroende');
  return data as Dependency;
}

export async function deleteDependency(dependencyId: string): Promise<void> {
  const { error } = await supabase.from('dependencies').delete().eq('id', dependencyId);
  throwIfError(error, 'Kunde inte ta bort beroende');
}

export async function fetchProjectDetails(projectId: string): Promise<ProjectDetails | null> {
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
