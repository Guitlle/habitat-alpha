import { useState, useCallback } from 'react';
import { WorkData, Project, Task, Epic } from '../types';
import { db } from '../services/db';
import { syncService } from '../services/syncService';

export const useProjectManager = (userId?: string, teamId?: string) => {
    const [workData, setWorkData] = useState<WorkData>({ projects: [], epics: [], tasks: [] });

    const handleAddProject = useCallback(async (project: Project) => {
        await db.addProject(project);
        if (userId) await syncService.push('projects', project, userId, teamId);
        setWorkData(prev => ({ ...prev, projects: [...prev.projects, project] }));
    }, [userId, teamId]);

    const handleUpdateProject = useCallback(async (project: Project) => {
        await db.updateProject(project);
        if (userId) await syncService.push('projects', project, userId, teamId);
        setWorkData(prev => ({ ...prev, projects: prev.projects.map(p => p.id === project.id ? project : p) }));
    }, [userId, teamId]);

    const handleDeleteProject = useCallback(async (id: string) => {
        await db.deleteProject(id);
        if (userId) await syncService.delete('projects', id);
        setWorkData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    }, [userId]);

    const handleAddTask = useCallback(async (task: Task) => {
        await db.addTask(task);
        if (userId) await syncService.push('tasks', task, userId, teamId);
        setWorkData(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
    }, [userId, teamId]);

    const handleUpdateTask = useCallback(async (task: Task) => {
        await db.updateTask(task);
        if (userId) await syncService.push('tasks', task, userId, teamId);
        setWorkData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? task : t) }));
    }, [userId, teamId]);

    const handleDeleteTask = useCallback(async (id: string) => {
        await db.deleteTask(id);
        if (userId) await syncService.delete('tasks', id);
        setWorkData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    }, [userId]);

    const handleAddEpic = useCallback(async (epic: Epic) => {
        await db.addEpic(epic);
        if (userId) await syncService.push('epics', epic, userId, teamId);
        setWorkData(prev => ({ ...prev, epics: [...prev.epics, epic] }));
    }, [userId, teamId]);

    return {
        workData,
        setWorkData,
        actions: {
            addProject: handleAddProject,
            updateProject: handleUpdateProject,
            deleteProject: handleDeleteProject,
            addTask: handleAddTask,
            updateTask: handleUpdateTask,
            deleteTask: handleDeleteTask,
            addEpic: handleAddEpic
        }
    };
};
