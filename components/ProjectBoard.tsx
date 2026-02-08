import React, { useState, useEffect } from 'react';
import { WorkData, TaskStatus, Task, Project, Epic } from '../types';
import { Plus, Edit, Trash2, X, Archive, RefreshCcw, Folder, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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
  }>({ isOpen: false, title: '', message: '', actionLabel: '', isDestructive: false, onConfirm: () => {} });

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


  // --- Components ---

  const StatusColumn = ({ status, title, color }: { status: TaskStatus, title: string, color: string }) => {
    const tasks = activeTasks.filter(t => t.status === status);
    // Extract base color name for border/text usage
    const baseColor = color.replace('bg-', '');

    return (
      <div className="flex flex-col gap-3 min-w-[280px] w-full max-w-xs h-full">
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${color} bg-opacity-10 border border-opacity-20 border-${baseColor}-500 flex-shrink-0`}>
          <span className={`text-sm font-semibold text-${baseColor}-600 dark:text-${baseColor}-400`}>{title}</span>
          <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400">{tasks.length}</span>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 pr-1 pb-2">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`bg-white dark:bg-gray-900 border ${task.archived ? 'border-dashed border-gray-300 dark:border-gray-700 opacity-60' : 'border-gray-200 dark:border-gray-800'} rounded-lg p-3 shadow-sm hover:border-gray-400 dark:hover:border-gray-600 transition-all group relative`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                  {data.epics.find(e => e.id === task.epicId)?.title || 'No Epic'}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!task.archived ? (
                    <>
                      <button onClick={() => openEditTaskModal(task)} className="text-gray-400 hover:text-blue-500 p-0.5" title={t.common.edit}>
                        <Edit size={12} />
                      </button>
                      <button onClick={() => promptArchiveTask(task)} className="text-gray-400 hover:text-amber-500 p-0.5" title={t.common.archive}>
                        <Archive size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => restoreTask(task)} className="text-gray-400 hover:text-green-500 p-0.5" title={t.common.restore}>
                        <RefreshCcw size={12} />
                      </button>
                      <button onClick={() => promptDeleteTask(task)} className="text-gray-400 hover:text-red-500 p-0.5" title={t.common.delete}>
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 flex items-center gap-2">
                {task.title}
                {task.archived && <span className="text-[9px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1 rounded">ARCHIVED</span>}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{task.description}</p>
              
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                 <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] text-gray-600 dark:text-gray-300">AI</div>
                 {task.dueDate && <span className="text-[10px] text-gray-400 dark:text-gray-500">{task.dueDate}</span>}
              </div>
            </div>
          ))}
          {!showArchivedTasks && (
            <button 
              onClick={() => openNewTaskModal(status)}
              className="flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 dark:border-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-all text-xs flex-shrink-0"
            >
              <Plus size={14} /> {t.work.add_task}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 p-6 overflow-hidden relative transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-600 rounded-lg"><Folder size={20} className="text-white"/></div>
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
            <StatusColumn status={TaskStatus.TODO} title={t.work.status.TODO} color="bg-gray-500" />
            <StatusColumn status={TaskStatus.IN_PROGRESS} title={t.work.status.IN_PROGRESS} color="bg-blue-500" />
            <StatusColumn status={TaskStatus.BLOCKED} title={t.work.status.BLOCKED} color="bg-red-500" />
            <StatusColumn status={TaskStatus.DONE} title={t.work.status.DONE} color="bg-green-500" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
            <p>{t.work.no_active_project}</p>
            <button onClick={openNewProjectModal} className="text-indigo-500 hover:text-indigo-400 text-sm">{t.work.create_project}</button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-96 shadow-2xl transform scale-100 transition-all">
              <div className="flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                <div className={`p-2 rounded-full ${confirmModal.isDestructive ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500'}`}>
                   <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold">{confirmModal.title}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-3">
                 <button 
                   onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                   className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                 >
                   {t.common.cancel}
                 </button>
                 <button 
                   onClick={confirmModal.onConfirm}
                   className={`px-4 py-2 text-xs font-bold text-white rounded transition-colors ${confirmModal.isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                 >
                   {confirmModal.actionLabel}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleTaskSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-96 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingTask ? t.work.edit_task : t.work.new_task}</h3>
              <button type="button" onClick={() => setIsTaskModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">{t.calendar.title}</label>
                <input 
                  autoFocus
                  type="text" 
                  value={taskForm.title}
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea 
                  value={taskForm.description}
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none h-20 resize-none"
                  placeholder="Details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Status</label>
                  <select 
                    value={taskForm.status}
                    onChange={e => setTaskForm({...taskForm, status: e.target.value as TaskStatus})}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                  >
                    {Object.values(TaskStatus).map(s => <option key={s} value={s}>{t.work.status[s] || s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Epic</label>
                  <select 
                    value={taskForm.epicId}
                    onChange={e => setTaskForm({...taskForm, epicId: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                  >
                    {activeEpics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    {activeEpics.length === 0 && <option value="">No Epics Available</option>}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t.common.cancel}</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium">{t.common.save}</button>
            </div>
          </form>
        </div>
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleProjectSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-96 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingProject ? t.work.edit_project : t.work.new_project}</h3>
              <button type="button" onClick={() => setIsProjectModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">{t.calendar.title}</label>
                <input 
                  autoFocus
                  type="text" 
                  value={projectForm.title}
                  onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                  placeholder="Project Name"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea 
                  value={projectForm.description}
                  onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none h-16 resize-none"
                  placeholder="What is this project about?"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">{t.work.goal}</label>
                <input 
                  type="text" 
                  value={projectForm.goal}
                  onChange={e => setProjectForm({...projectForm, goal: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                  placeholder="Primary objective"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t.common.cancel}</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium">{t.common.save}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;