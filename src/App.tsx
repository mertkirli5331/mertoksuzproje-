/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Phase, ProjectSettings, Task, TimeLog, WeekPlan, WeeklyDocument, TaskStatus 
} from './types/project';
import { 
  getProjectSettings, saveProjectSettings,
  getPhases, savePhases,
  getWeeks, saveWeeks,
  getTasks, saveTasks,
  getDocuments, saveDocuments,
  getTimeLogs, saveTimeLogs,
  exportProjectDataJSON, importProjectDataJSON, resetAllDataToDefault
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { LiveClock } from './components/LiveClock';
import { TimelineView } from './components/TimelineView';
import { WeeklyWorkspace } from './components/WeeklyWorkspace';
import { KanbanView } from './components/KanbanView';
import { AnalyticsView } from './components/AnalyticsView';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TaskModal } from './components/TaskModal';
import { DocumentModal } from './components/DocumentModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';

export default function App() {
  // Primary State
  const [settings, setSettings] = useState<ProjectSettings>(getProjectSettings);
  const [phases, setPhases] = useState<Phase[]>(getPhases);
  const [weeks, setWeeks] = useState<WeekPlan[]>(getWeeks);
  const [tasks, setTasks] = useState<Task[]>(getTasks);
  const [documents, setDocuments] = useState<WeeklyDocument[]>(getDocuments);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(getTimeLogs);

  // Active View & Navigation
  const [currentView, setCurrentView] = useState<'timeline' | 'workspace' | 'kanban' | 'analytics'>('timeline');
  const [activeWeek, setActiveWeek] = useState<number>(1);

  // Modals
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetTaskWeek, setTargetTaskWeek] = useState<number>(1);

  // Document Modal state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<WeeklyDocument | null>(null);
  const [targetDocWeek, setTargetDocWeek] = useState<number>(1);

  // Sync state to storage
  useEffect(() => {
    saveProjectSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveWeeks(weeks);
  }, [weeks]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveDocuments(documents);
  }, [documents]);

  useEffect(() => {
    saveTimeLogs(timeLogs);
  }, [timeLogs]);

  // Handlers for Weeks
  const handleSelectWeek = (weekNum: number) => {
    setActiveWeek(weekNum);
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateWeekPlan = (updatedWeek: WeekPlan) => {
    setWeeks((prev) => prev.map((w) => (w.weekNumber === updatedWeek.weekNumber ? updatedWeek : w)));
  };

  // Handlers for Tasks
  const handleOpenTaskModal = (weekNum?: number, task?: Task) => {
    setTargetTaskWeek(weekNum || activeWeek);
    setEditingTask(task || null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskToSave: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === taskToSave.id);
      if (exists) {
        return prev.map((t) => (t.id === taskToSave.id ? taskToSave : t));
      }
      return [taskToSave, ...prev];
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isComp = t.status === 'completed';
          return {
            ...t,
            status: isComp ? 'todo' : 'completed',
            completedAt: !isComp ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  // Handlers for Documents / Google Drive Files
  const handleOpenDocModal = (weekNum: number, doc?: WeeklyDocument) => {
    setTargetDocWeek(weekNum);
    setEditingDoc(doc || null);
    setIsDocModalOpen(true);
  };

  const handleSaveDoc = (docToSave: WeeklyDocument) => {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === docToSave.id);
      if (exists) {
        return prev.map((d) => (d.id === docToSave.id ? docToSave : d));
      }
      return [docToSave, ...prev];
    });
  };

  const handleDeleteDoc = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Handlers for Time Logs
  const handleSaveTimeLog = (logData: Omit<TimeLog, 'id' | 'timestamp'>) => {
    const newLog: TimeLog = {
      ...logData,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setTimeLogs((prev) => [newLog, ...prev]);

    // If linked to a task, update the task's logged hours too
    if (logData.taskId) {
      const hoursToAdd = Math.round((logData.durationMinutes / 60) * 10) / 10;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === logData.taskId) {
            return {
              ...t,
              loggedHours: Math.round(((t.loggedHours || 0) + hoursToAdd) * 10) / 10,
            };
          }
          return t;
        })
      );
    }
  };

  const handleSaveManualTimeLog = (weekNum: number, minutes: number, note: string) => {
    handleSaveTimeLog({
      weekNumber: weekNum,
      durationMinutes: minutes,
      note,
    });
  };

  // Export JSON file download
  const handleExportJSON = () => {
    const jsonStr = exportProjectDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mert_oksuz_38_haftalik_proje_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        settings={settings}
        activeWeek={activeWeek}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenTaskModal={() => handleOpenTaskModal(activeWeek)}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Live Clock & Project Countdown Bar */}
        <LiveClock
          settings={settings}
          weeks={weeks}
          activeWeek={activeWeek}
          onSelectWeek={handleSelectWeek}
          onOpenTimerModal={() => setIsTimerModalOpen(true)}
        />

        {/* View Switch */}
        {currentView === 'timeline' && (
          <TimelineView
            phases={phases}
            weeks={weeks}
            tasks={tasks}
            documents={documents}
            activeWeek={activeWeek}
            onSelectWeek={handleSelectWeek}
            onOpenTaskModal={(weekNum) => handleOpenTaskModal(weekNum)}
          />
        )}

        {currentView === 'workspace' && (
          <WeeklyWorkspace
            activeWeek={activeWeek}
            weeks={weeks}
            phases={phases}
            tasks={tasks}
            documents={documents}
            timeLogs={timeLogs}
            onSelectWeek={setActiveWeek}
            onUpdateWeekPlan={handleUpdateWeekPlan}
            onOpenTaskModal={(wNum, task) => handleOpenTaskModal(wNum, task)}
            onOpenDocModal={(wNum, doc) => handleOpenDocModal(wNum, doc)}
            onToggleTaskStatus={handleToggleTaskStatus}
            onDeleteTask={handleDeleteTask}
            onDeleteDoc={handleDeleteDoc}
            onOpenTimerModal={() => setIsTimerModalOpen(true)}
            onSaveManualTimeLog={handleSaveManualTimeLog}
          />
        )}

        {currentView === 'kanban' && (
          <KanbanView
            tasks={tasks}
            weeks={weeks}
            activeWeek={activeWeek}
            onOpenTaskModal={(wNum, task) => handleOpenTaskModal(wNum, task)}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onSelectWeek={handleSelectWeek}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            settings={settings}
            phases={phases}
            weeks={weeks}
            tasks={tasks}
            documents={documents}
            timeLogs={timeLogs}
            onSelectWeek={handleSelectWeek}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          <strong className="text-slate-400 font-semibold">{settings.ownerName}</strong> • 38 Haftalık Proje Planı & Zaman Yönetim Sistemi
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          Google Drive Entegrasyonu & Çalışma Saati Takibi • Tüm veriler yerel olarak cihazınızda güvenle saklanır.
        </p>
      </footer>

      {/* Modals */}
      <PomodoroTimer
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        settings={settings}
        weeks={weeks}
        tasks={tasks}
        activeWeek={activeWeek}
        onSaveTimeLog={handleSaveTimeLog}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        weeks={weeks}
        initialWeekNumber={targetTaskWeek}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        document={editingDoc}
        weekNumber={targetDocWeek}
        onSave={handleSaveDoc}
        onDelete={handleDeleteDoc}
      />

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onExportJSON={handleExportJSON}
        onImportJSON={importProjectDataJSON}
        onResetDefaults={resetAllDataToDefault}
      />
    </div>
  );
}
