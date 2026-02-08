import { useState, useCallback } from 'react';
import { WorkData, Project, Task, Epic } from '../types';
import { db } from '../services/db';
import { syncService } from '../services/syncService';

export const useProjectManager = (userId?: string) => {
    const [workData, setWorkData] = useState<WorkData>({ projects: [], epics: [], tasks: [] });

    const handleAddProject = useCallback(async (project: Project) => {
        await db.addProject(project);
        const defaultEpic: Epic = {
            id: `e-${Date.now()}`,
            projectId: project.id,
            title: 'General',
            description: 'General tasks for ' + project.title
        };
        await db.addEpic(defaultEpic);
        if (userId) {
            await syncService.push('projects', project, userId);
            await syncService.push('epics', defaultEpic, userId);
        }
        setWorkData(prev => ({
            ...prev,
            projects: [...prev.projects, project],
            epics: [...prev.epics, defaultEpic]
        }));
    }, [userId]);

    const handleUpdateProject = useCallback(async (project: Project) => {
        await db.updateProject(project);
        if (userId) await syncService.push('projects', project, userId);
        setWorkData(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === project.id ? project : p)
        }));
    }, [userId]);

    const handleDeleteProject = useCallback(async (projectId: string) => {
        await db.deleteProject(projectId);
        if (userId) await syncService.delete('projects', projectId);
        setWorkData(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== projectId),
        }));
    }, [userId]);

    const handleAddTask = useCallback(async (task: Task) => {
        await db.addTask(task);
        if (userId) await syncService.push('tasks', task, userId);
        setWorkData(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
    }, [userId]);

    const handleUpdateTask = useCallback(async (task: Task) => {
        await db.updateTask(task);
        if (userId) await syncService.push('tasks', task, userId);
        setWorkData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? task : t) }));
    }, [userId]);

    const handleDeleteTask = useCallback(async (taskId: string) => {
        await db.deleteTask(taskId);
        if (userId) await syncService.delete('tasks', taskId);
        setWorkData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
    }, [userId]);

    return {
        workData,
        setWorkData,
        actions: {
            addProject: handleAddProject,
            updateProject: handleUpdateProject,
            deleteProject: handleDeleteProject,
            addTask: handleAddTask,
            updateTask: handleUpdateTask,
            deleteTask: handleDeleteTask
        }
    };
};
