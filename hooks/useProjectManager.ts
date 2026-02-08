import { useState, useCallback } from 'react';
import { WorkData, Project, Task, Epic } from '../types';
import { db } from '../services/db';

export const useProjectManager = () => {
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
        setWorkData(prev => ({
            ...prev,
            projects: [...prev.projects, project],
            epics: [...prev.epics, defaultEpic]
        }));
    }, []);

    const handleUpdateProject = useCallback(async (project: Project) => {
        await db.updateProject(project);
        setWorkData(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === project.id ? project : p)
        }));
    }, []);

    const handleDeleteProject = useCallback(async (projectId: string) => {
        await db.deleteProject(projectId);
        setWorkData(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== projectId),
        }));
    }, []);

    const handleAddTask = useCallback(async (task: Task) => {
        await db.addTask(task);
        setWorkData(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
    }, []);

    const handleUpdateTask = useCallback(async (task: Task) => {
        await db.updateTask(task);
        setWorkData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? task : t) }));
    }, []);

    const handleDeleteTask = useCallback(async (taskId: string) => {
        await db.deleteTask(taskId);
        setWorkData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
    }, []);

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
