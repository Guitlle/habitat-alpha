import React, { useState, useEffect } from 'react';
import { WorkData, TaskStatus, Task, Project, Epic } from '../types';
import { Plus, Edit, Trash2, Archive, RefreshCcw, Folder, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Sub-components
import StatusColumn from './ProjectBoard/StatusColumn';
import TaskModal from './ProjectBoard/TaskModal';
import ProjectModal from './ProjectBoard/ProjectModal';
import ConfirmationModal from './ProjectBoard/ConfirmationModal';

interface ProjectBoardProps {
  data: WorkData;
  actions: {
    addProject: (p: Project) => void;
    updateProject: (p: Project) => void;
    deleteProject: (id: string) => void;
    addTask: (t: Task) => void;
    updateTask: (t: Task) => void;
    deleteTask: (id: string) => void;
  };
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ data, actions }) => {
  const { t } = useLanguage();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // View Preferences
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);

  // Edit States
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', actionLabel: '', isDestructive: false, onConfirm: () => { } });

  // Form States
  const [taskForm, setTaskForm] = useState<Partial<Task>>({ title: '', description: '', status: TaskStatus.TODO });
  const [projectForm, setProjectForm] = useState<Partial<Project>>({ title: '', description: '', goal: '' });

  // Initialize selected project
  useEffect(() => {
    const projectExists = data.projects.find(p => p.id === selectedProjectId);
    if (!projectExists || (projectExists.archived && !showArchivedProjects)) {
      const firstAvailable = data.projects.find(p => !p.archived);
      if (firstAvailable) {
        setSelectedProjectId(firstAvailable.id);
      } else if (showArchivedProjects && data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id);
      } else {
        setSelectedProjectId('');
      }
    }
  }, [data.projects, selectedProjectId, showArchivedProjects]);

  const activeProject = data.projects.find(p => p.id === selectedProjectId);
  const activeEpics = data.epics.filter(e => e.projectId === selectedProjectId);
  const activeEpicIds = activeEpics.map(e => e.id);

  const activeTasks = data.tasks.filter(t => {
    const belongsToProject = t.epicId && activeEpicIds.includes(t.epicId);
    const matchesArchiveStatus = showArchivedTasks ? true : !t.archived;
    return belongsToProject && matchesArchiveStatus;
  });

  const availableProjects = data.projects.filter(p => showArchivedProjects ? true : !p.archived);

  // --- Handlers ---

  const promptArchiveProject = (project: Project) => {
    setConfirmModal({
      isOpen: true,
      title: t.work.archive_project_title,
      message: t.work.archive_project_msg.replace('{title}', project.title),
      actionLabel: t.common.archive,
      isDestructive: false,
      onConfirm: () => {
        actions.updateProject({ ...project, archived: true });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const promptDeleteProject = (project: Project) => {
    setConfirmModal({
      isOpen: true,
      title: t.work.delete_project_title,
      message: t.work.delete_project_msg.replace('{title}', project.title),
      actionLabel: t.common.delete,
      isDestructive: true,
      onConfirm: () => {
        actions.deleteProject(project.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const restoreProject = (project: Project) => {
    actions.updateProject({ ...project, archived: false });
  };

  const promptArchiveTask = (task: Task) => {
    setConfirmModal({
      isOpen: true,
      title: t.work.archive_task_title,
      message: t.work.archive_task_msg,
      actionLabel: t.common.archive,
      isDestructive: false,
      onConfirm: () => {
        actions.updateTask({ ...task, archived: true });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const promptDeleteTask = (task: Task) => {
    setConfirmModal({
      isOpen: true,
      title: t.work.delete_task_title,
      message: t.work.delete_task_msg,
      actionLabel: t.common.delete,
      isDestructive: true,
      onConfirm: () => {
        actions.deleteTask(task.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const restoreTask = (task: Task) => {
    actions.updateTask({ ...task, archived: false });
  };

  // --- Form Handlers ---

  const openNewTaskModal = (status?: TaskStatus) => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      status: status || TaskStatus.TODO,
      epicId: activeEpics[0]?.id || ''
    });
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskForm({ ...task });
    setIsTaskModalOpen(true);
  };

  const openNewProjectModal = () => {
    setEditingProject(null);
    setProjectForm({ title: '', description: '', goal: '' });
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (project: Project) => {
    setEditingProject(project);
    setProjectForm({ ...project });
    setIsProjectModalOpen(true);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.epicId) return;

    if (editingTask) {
      actions.updateTask({ ...editingTask, ...taskForm } as Task);
    } else {
      const newTask: Task = {
        id: `t-${Date.now()}`,
        ...taskForm as any,
        archived: false
      };
      actions.addTask(newTask);
    }
    setIsTaskModalOpen(false);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title) return;

    if (editingProject) {
      actions.updateProject({ ...editingProject, ...projectForm } as Project);
    } else {
      const newProject: Project = {
        id: `p-${Date.now()}`,
        ...projectForm as any,
        archived: false
      };
      actions.addProject(newProject);
      setSelectedProjectId(newProject.id);
    }
    setIsProjectModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 p-6 overflow-hidden relative transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg"><Folder size={20} className="text-white" /></div>
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-2">
                {t.work.current_project}
                <button
                  onClick={() => setShowArchivedProjects(!showArchivedProjects)}
                  className={`ml-2 p-0.5 rounded ${showArchivedProjects ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title={showArchivedProjects ? "Hide Archived Projects" : "Show Archived Projects"}
                >
                  {showArchivedProjects ? <Eye size={10} /> : <EyeOff size={10} />}
                </button>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white font-bold text-lg focus:outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[200px]"
              >
                {availableProjects.map(p => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    {p.title} {p.archived ? '(Archived)' : ''}
                  </option>
                ))}
                {availableProjects.length === 0 && <option value="">{showArchivedProjects ? t.work.no_projects_found : t.work.no_active_project}</option>}
              </select>
            </div>
          </div>

          {activeProject && (
            <div className="flex gap-1 ml-4 border-l border-gray-300 dark:border-gray-800 pl-4">
              <button onClick={() => openEditProjectModal(activeProject)} className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded" title={t.common.edit}>
                <Edit size={14} />
              </button>

              {!activeProject.archived ? (
                <button onClick={() => promptArchiveProject(activeProject)} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" title={t.common.archive}>
                  <Archive size={14} />
                </button>
              ) : (
                <>
                  <button onClick={() => restoreProject(activeProject)} className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" title={t.common.restore}>
                    <RefreshCcw size={14} />
                  </button>
                  <button onClick={() => promptDeleteProject(activeProject)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded" title={t.common.delete}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{t.work.archived_tasks}</span>
            <button
              onClick={() => setShowArchivedTasks(!showArchivedTasks)}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showArchivedTasks ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${showArchivedTasks ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
          <button
            onClick={openNewProjectModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={14} /> {t.work.new_project}
          </button>
        </div>
      </div>

      {/* Goal Banner */}
      {activeProject && (
        <div className={`mb-4 text-xs flex items-center gap-2 p-2 rounded border flex-shrink-0 ${activeProject.archived ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-500' : 'bg-gray-100/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'}`}>
          {activeProject.archived && <Archive size={12} />}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{t.work.goal}:</span> {activeProject.goal}
          {activeProject.archived && <span className="ml-auto text-[10px] uppercase font-bold tracking-wider">Project Archived</span>}
        </div>
      )}

      {/* Board Columns */}
      <div className="flex gap-6 h-full overflow-x-auto pb-4 min-h-0 flex-1">
        {activeProject ? (
          <>
            <StatusColumn
              status={TaskStatus.TODO}
              title={t.work.status.TODO}
              color="bg-gray-500"
              tasks={activeTasks.filter(t => t.status === TaskStatus.TODO)}
              epics={data.epics}
              showArchivedTasks={showArchivedTasks}
              onAddTask={openNewTaskModal}
              onEditTask={openEditTaskModal}
              onArchiveTask={promptArchiveTask}
              onDeleteTask={promptDeleteTask}
              onRestoreTask={restoreTask}
            />
            <StatusColumn
              status={TaskStatus.IN_PROGRESS}
              title={t.work.status.IN_PROGRESS}
              color="bg-blue-500"
              tasks={activeTasks.filter(t => t.status === TaskStatus.IN_PROGRESS)}
              epics={data.epics}
              showArchivedTasks={showArchivedTasks}
              onAddTask={openNewTaskModal}
              onEditTask={openEditTaskModal}
              onArchiveTask={promptArchiveTask}
              onDeleteTask={promptDeleteTask}
              onRestoreTask={restoreTask}
            />
            <StatusColumn
              status={TaskStatus.BLOCKED}
              title={t.work.status.BLOCKED}
              color="bg-red-500"
              tasks={activeTasks.filter(t => t.status === TaskStatus.BLOCKED)}
              epics={data.epics}
              showArchivedTasks={showArchivedTasks}
              onAddTask={openNewTaskModal}
              onEditTask={openEditTaskModal}
              onArchiveTask={promptArchiveTask}
              onDeleteTask={promptDeleteTask}
              onRestoreTask={restoreTask}
            />
            <StatusColumn
              status={TaskStatus.DONE}
              title={t.work.status.DONE}
              color="bg-green-500"
              tasks={activeTasks.filter(t => t.status === TaskStatus.DONE)}
              epics={data.epics}
              showArchivedTasks={showArchivedTasks}
              onAddTask={openNewTaskModal}
              onEditTask={openEditTaskModal}
              onArchiveTask={promptArchiveTask}
              onDeleteTask={promptDeleteTask}
              onRestoreTask={restoreTask}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
            <p>{t.work.no_active_project}</p>
            <button onClick={openNewProjectModal} className="text-indigo-500 hover:text-indigo-400 text-sm">{t.work.create_project}</button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        actionLabel={confirmModal.actionLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        editingTask={editingTask}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        activeEpics={activeEpics}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleProjectSubmit}
        editingProject={editingProject}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
      />
    </div>
  );
};

export default ProjectBoard;