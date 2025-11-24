import { useEffect, useMemo, useState } from 'react';
import './styles/App.css';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import AuthForm from './components/AuthForm';
import { supabase } from './supabaseClient';
import {
  createActivity,
  createDependency,
  createMilestone,
  createProject,
  deleteActivity,
  deleteDependency,
  deleteMilestone,
  deleteProject,
  fetchProjectDetails,
  fetchProjects
} from './api/projects';
import { Activity, Dependency, Milestone, Project, ProjectDetails, ProjectStatus } from './types';

const statusOptions: ProjectStatus[] = ['planerat', 'pågående', 'avslutat'];

const emptyProject: Omit<Project, 'id'> = {
  name: '',
  description: '',
  status: 'planerat',
  priority: 1,
  project_owner: '',
  project_manager: '',
  impact_owner: ''
};

const emptyActivity: Omit<Activity, 'id'> = {
  project_id: '',
  name: '',
  description: '',
  status: 'planerat'
};

const emptyMilestone: Omit<Milestone, 'id'> = {
  project_id: '',
  name: '',
  decision_type: '',
  status: 'planerat'
};

const emptyDependency: Omit<Dependency, 'id'> = {
  from_activity_id: '',
  to_activity_id: '',
  type: 'finish-to-start'
};

function App(): JSX.Element {
  const { session, loading } = useSupabaseAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [activityForm, setActivityForm] = useState(emptyActivity);
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestone);
  const [dependencyForm, setDependencyForm] = useState<Omit<Dependency, 'id'>>(emptyDependency);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!session) return;
    handleLoadProjects();
  }, [session, statusFilter]);

  useEffect(() => {
    if (selectedProjectId) {
      handleLoadProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleLoadProjects = async () => {
    try {
      const response = await fetchProjects(statusFilter || undefined);
      setProjects(response);
      if (!selectedProjectId && response.length) {
        setSelectedProjectId(response[0].id);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleLoadProjectDetails = async (projectId: string) => {
    try {
      const response = await fetchProjectDetails(projectId);
      setDetails(response);
      if (response) {
        setActivityForm({ ...emptyActivity, project_id: response.project.id });
        setMilestoneForm({ ...emptyMilestone, project_id: response.project.id });
        setDependencyForm(emptyDependency);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleCreateProject = async () => {
    try {
      setErrorMessage(null);
      const created = await createProject(projectForm);
      setProjects((prev) => [...prev, created]);
      setProjectForm(emptyProject);
      setSelectedProjectId(created.id);
      setInfoMessage('Projektet skapades.');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Är du säker på att du vill ta bort projektet?')) return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setSelectedProjectId(null);
      setDetails(null);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleCreateActivity = async () => {
    if (!selectedProject) return;
    try {
      setErrorMessage(null);
      const payload = { ...activityForm, project_id: selectedProject.id };
      const created = await createActivity(payload);
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              activities: [...prev.activities, created]
            }
          : prev
      );
      setActivityForm({ ...emptyActivity, project_id: selectedProject.id });
      setInfoMessage('Aktivitet skapades.');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await deleteActivity(activityId);
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              activities: prev.activities.filter((activity) => activity.id !== activityId),
              dependencies: prev.dependencies.filter(
                (dependency) =>
                  dependency.from_activity_id !== activityId && dependency.to_activity_id !== activityId
              )
            }
          : prev
      );
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleCreateMilestone = async () => {
    if (!selectedProject) return;
    try {
      const payload = { ...milestoneForm, project_id: selectedProject.id };
      const created = await createMilestone(payload);
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              milestones: [...prev.milestones, created]
            }
          : prev
      );
      setMilestoneForm({ ...emptyMilestone, project_id: selectedProject.id });
      setInfoMessage('Beslutspunkt skapades.');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await deleteMilestone(milestoneId);
      setDetails((prev) =>
        prev
          ? { ...prev, milestones: prev.milestones.filter((milestone) => milestone.id !== milestoneId) }
          : prev
      );
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleCreateDependency = async () => {
    if (!details) return;

    if (!dependencyForm.from_activity_id || !dependencyForm.to_activity_id) {
      setErrorMessage('Välj både aktivitet och föregående aktivitet.');
      return;
    }

    if (dependencyForm.from_activity_id === dependencyForm.to_activity_id) {
      setErrorMessage('En aktivitet kan inte bero på sig själv.');
      return;
    }

    try {
      setErrorMessage(null);
      const created = await createDependency(dependencyForm);
      setDetails((prev) => (prev ? { ...prev, dependencies: [...prev.dependencies, created] } : prev));
      setDependencyForm(emptyDependency);
      setInfoMessage('Beroende skapades.');
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    try {
      await deleteDependency(dependencyId);
      setDetails((prev) =>
        prev ? { ...prev, dependencies: prev.dependencies.filter((dep) => dep.id !== dependencyId) } : prev
      );
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <p className="muted">Laddar session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <div className="header">
          <div>
            <h1>Portföljkollen</h1>
            <p className="muted">Logga in för att hantera projekt och aktiviteter.</p>
          </div>
          <span className="badge">Supabase Auth</span>
        </div>
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="header">
        <div>
          <h1>Portföljkollen</h1>
          <p className="muted">
            Enkel portföljvy för projekt, aktiviteter, beslutspunkter och beroenden.
          </p>
        </div>
        <div className="stack-row">
          <span className="badge">Inloggad: {session.user.email}</span>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>
            Logga ut
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <div className="flex-between">
            <h2>Projektlista</h2>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}>
              <option value="">Alla statusar</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="list">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`project-card ${selectedProjectId === project.id ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedProjectId(project.id)}
              >
                <div className="flex-between">
                  <div>
                    <strong>{project.name}</strong>
                    <div className="small">{project.description || 'Ingen beskrivning angiven.'}</div>
                  </div>
                  <span className={`status ${project.status || 'planerat'}`}>{project.status || 'okänd'}</span>
                </div>
                <div className="small">Ägare: {project.project_owner || '—'} | PL: {project.project_manager || '—'}</div>
                <div className="small">Prioritet: {project.priority ?? '—'}</div>
                <div className="small">Start: {project.start_date || '—'} | Slut: {project.end_date || '—'}</div>
              </div>
            ))}
          </div>

          <hr className="section-divider" />

          <h3>Skapa nytt projekt</h3>
          {errorMessage && <div className="alert">{errorMessage}</div>}
          {infoMessage && <div className="alert" style={{ background: '#dcfce7', borderColor: '#22c55e', color: '#166534' }}>
            {infoMessage}
          </div>}
          <div className="stack">
            <div>
              <label htmlFor="name">Namn</label>
              <input
                id="name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="Projektets namn"
              />
            </div>
            <div>
              <label htmlFor="description">Beskrivning</label>
              <textarea
                id="description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Kort sammanfattning"
              />
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="project_owner">Projektägare</label>
                <input
                  id="project_owner"
                  value={projectForm.project_owner}
                  onChange={(e) => setProjectForm({ ...projectForm, project_owner: e.target.value })}
                  placeholder="Ägare"
                />
              </div>
              <div>
                <label htmlFor="project_manager">Projektledare</label>
                <input
                  id="project_manager"
                  value={projectForm.project_manager}
                  onChange={(e) => setProjectForm({ ...projectForm, project_manager: e.target.value })}
                  placeholder="Projektledare"
                />
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="impact_owner">Effektägare</label>
                <input
                  id="impact_owner"
                  value={projectForm.impact_owner}
                  onChange={(e) => setProjectForm({ ...projectForm, impact_owner: e.target.value })}
                  placeholder="Effektägare"
                />
              </div>
              <div>
                <label htmlFor="priority">Prioritet (1-5)</label>
                <input
                  id="priority"
                  type="number"
                  min={1}
                  max={5}
                  value={projectForm.priority ?? ''}
                  onChange={(e) => setProjectForm({ ...projectForm, priority: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="start_date">Startdatum</label>
                <input
                  id="start_date"
                  type="date"
                  value={projectForm.start_date ?? ''}
                  onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="end_date">Slutdatum</label>
                <input
                  id="end_date"
                  type="date"
                  value={projectForm.end_date ?? ''}
                  onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleCreateProject}>Spara projekt</button>
          </div>
        </div>

        <div className="panel">
          {selectedProject && details ? (
            <div className="stack">
              <div className="flex-between">
                <h2>{selectedProject.name}</h2>
                <button className="secondary" onClick={() => handleDeleteProject(selectedProject.id)}>
                  Ta bort projekt
                </button>
              </div>
              <div className="small">
                {selectedProject.description || 'Ingen beskrivning'}
              </div>
              <div className="stack-row">
                <span className="tag">Ägare: {selectedProject.project_owner || '—'}</span>
                <span className="tag">PL: {selectedProject.project_manager || '—'}</span>
                <span className="tag">Effektägare: {selectedProject.impact_owner || '—'}</span>
              </div>
              <div className="stack-row">
                <span className={`status ${selectedProject.status || 'planerat'}`}>
                  {selectedProject.status || 'okänd'}
                </span>
                <span className="tag">Prioritet: {selectedProject.priority ?? '—'}</span>
              </div>

              <hr className="section-divider" />

              <div className="flex-between">
                <h3>Aktiviteter</h3>
                <span className="small">{details.activities.length} st</span>
              </div>

              <div className="stack">
                {details.activities.map((activity) => (
                  <div key={activity.id} className="project-card">
                    <div className="flex-between">
                      <div>
                        <strong>{activity.name}</strong>
                        <div className="small">{activity.description || 'Ingen beskrivning'}</div>
                        <div className="small">Ansvarig: {activity.responsible || '—'}</div>
                        <div className="small">
                          Start: {activity.start_date || '—'} | Slut: {activity.end_date || '—'} | Status:{' '}
                          {activity.status || 'okänd'}
                        </div>
                        <div className="small">
                          Beroende av:{' '}
                          {details.dependencies
                            .filter((dep) => dep.from_activity_id === activity.id)
                            .map((dep) =>
                              details.activities.find((candidate) => candidate.id === dep.to_activity_id)?.name ||
                              dep.to_activity_id
                            )
                            .join(', ') || 'Inga'}
                        </div>
                      </div>
                      <button className="secondary" onClick={() => handleDeleteActivity(activity.id)}>
                        Ta bort
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel" style={{ background: '#f8fafc' }}>
                <h4>Lägg till aktivitet</h4>
                <div className="stack">
                  <div>
                    <label htmlFor="activity-name">Namn</label>
                    <input
                      id="activity-name"
                      value={activityForm.name}
                      onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="activity-description">Beskrivning</label>
                    <textarea
                      id="activity-description"
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                    />
                  </div>
                  <div className="form-grid">
                    <div>
                      <label htmlFor="activity-responsible">Ansvarig</label>
                      <input
                        id="activity-responsible"
                        value={activityForm.responsible || ''}
                        onChange={(e) => setActivityForm({ ...activityForm, responsible: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="activity-status">Status</label>
                      <input
                        id="activity-status"
                        value={activityForm.status || ''}
                        onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div>
                      <label htmlFor="activity-start">Startdatum</label>
                      <input
                        id="activity-start"
                        type="date"
                        value={activityForm.start_date || ''}
                        onChange={(e) => setActivityForm({ ...activityForm, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="activity-end">Slutdatum</label>
                      <input
                        id="activity-end"
                        type="date"
                        value={activityForm.end_date || ''}
                        onChange={(e) => setActivityForm({ ...activityForm, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <button onClick={handleCreateActivity}>Spara aktivitet</button>
                </div>
              </div>

              <hr className="section-divider" />

              <div className="flex-between">
                <h3>Beslutspunkter</h3>
                <span className="small">{details.milestones.length} st</span>
              </div>

              <div className="stack">
                {details.milestones.map((milestone) => (
                  <div key={milestone.id} className="project-card">
                    <div className="flex-between">
                      <div>
                        <strong>{milestone.name}</strong>
                        <div className="small">Typ: {milestone.decision_type || '—'}</div>
                        <div className="small">Datum: {milestone.date || '—'} | Status: {milestone.status || 'okänd'}</div>
                      </div>
                      <button className="secondary" onClick={() => handleDeleteMilestone(milestone.id)}>
                        Ta bort
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel" style={{ background: '#f8fafc' }}>
                <h4>Lägg till beslutspunkt</h4>
                <div className="stack">
                  <div>
                    <label htmlFor="milestone-name">Namn</label>
                    <input
                      id="milestone-name"
                      value={milestoneForm.name}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-grid">
                    <div>
                      <label htmlFor="milestone-type">Beslutstyp</label>
                      <input
                        id="milestone-type"
                        value={milestoneForm.decision_type || ''}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, decision_type: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="milestone-date">Datum</label>
                      <input
                        id="milestone-date"
                        type="date"
                        value={milestoneForm.date || ''}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="milestone-status">Status</label>
                    <input
                      id="milestone-status"
                      value={milestoneForm.status || ''}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                    />
                  </div>
                  <button onClick={handleCreateMilestone}>Spara beslutspunkt</button>
                </div>
              </div>

              <hr className="section-divider" />

              <div className="flex-between">
                <h3>Beroenden</h3>
                <span className="small">{details.dependencies.length} st</span>
              </div>
              <div className="stack">
                {details.dependencies.map((dependency) => {
                  const from = details.activities.find((activity) => activity.id === dependency.from_activity_id);
                  const to = details.activities.find((activity) => activity.id === dependency.to_activity_id);
                  return (
                    <div key={dependency.id} className="project-card">
                      <div className="flex-between">
                        <div>
                          <strong>{from?.name || dependency.from_activity_id}</strong>
                          <div className="small">beroende av {to?.name || dependency.to_activity_id}</div>
                          <div className="small">Typ: {dependency.type || 'okänd'}</div>
                        </div>
                        <button className="secondary" onClick={() => handleDeleteDependency(dependency.id)}>
                          Ta bort
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="panel" style={{ background: '#f8fafc' }}>
                <h4>Lägg till beroende</h4>
                <div className="stack">
                  <div>
                    <label htmlFor="from-activity">Aktivitet</label>
                    <select
                      id="from-activity"
                      value={dependencyForm.from_activity_id}
                      onChange={(e) => setDependencyForm({ ...dependencyForm, from_activity_id: e.target.value })}
                    >
                      <option value="">Välj aktivitet</option>
                      {details.activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="to-activity">Är beroende av</label>
                    <select
                      id="to-activity"
                      value={dependencyForm.to_activity_id}
                      onChange={(e) => setDependencyForm({ ...dependencyForm, to_activity_id: e.target.value })}
                    >
                      <option value="">Välj föregående aktivitet</option>
                      {details.activities
                        .filter((activity) => activity.id !== dependencyForm.from_activity_id)
                        .map((activity) => (
                          <option key={activity.id} value={activity.id}>
                            {activity.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dependency-type">Typ</label>
                    <input
                      id="dependency-type"
                      value={dependencyForm.type || ''}
                      onChange={(e) => setDependencyForm({ ...dependencyForm, type: e.target.value })}
                    />
                  </div>
                  <button onClick={handleCreateDependency} disabled={!dependencyForm.from_activity_id || !dependencyForm.to_activity_id}>
                    Spara beroende
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">Välj ett projekt för att se detaljer.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
