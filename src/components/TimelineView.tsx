import React, { useState } from 'react';
import { 
  Calendar, CheckCircle2, Circle, Clock, FileText, Filter, 
  Flag, FolderGit2, Search, Star, Target, ChevronRight, Award,
  Sparkles, ExternalLink
} from 'lucide-react';
import { Phase, Task, WeekPlan, WeeklyDocument } from '../types/project';

interface TimelineViewProps {
  phases: Phase[];
  weeks: WeekPlan[];
  tasks: Task[];
  documents: WeeklyDocument[];
  activeWeek: number;
  onSelectWeek: (weekNum: number) => void;
  onOpenTaskModal: (weekNum?: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  phases,
  weeks,
  tasks,
  documents,
  activeWeek,
  onSelectWeek,
  onOpenTaskModal,
}) => {
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyMilestones, setOnlyMilestones] = useState<boolean>(false);

  // Filter weeks
  const filteredWeeks = weeks.filter((w) => {
    if (selectedPhaseFilter !== 'all' && w.phaseId !== selectedPhaseFilter) {
      return false;
    }
    if (onlyMilestones && !w.isMilestone) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = w.title.toLowerCase().includes(q);
      const matchGoal = w.goal.toLowerCase().includes(q);
      const weekTasks = tasks.filter((t) => t.weekNumber === w.weekNumber);
      const matchTasks = weekTasks.some((t) => t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)));
      return matchTitle || matchGoal || matchTasks;
    }
    return true;
  });

  // Calculate stats for a given week
  const getWeekStats = (weekNum: number) => {
    const weekTasks = tasks.filter((t) => t.weekNumber === weekNum);
    const completedTasks = weekTasks.filter((t) => t.status === 'completed');
    const weekDocs = documents.filter((d) => d.weekNumber === weekNum);
    const totalLoggedHours = weekTasks.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
    const totalEstHours = weekTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
    const percent = weekTasks.length > 0 ? Math.round((completedTasks.length / weekTasks.length) * 100) : 0;

    return {
      totalTasks: weekTasks.length,
      completedTasks: completedTasks.length,
      percent,
      totalLoggedHours,
      totalEstHours,
      docsCount: weekDocs.length,
      driveDocsCount: weekDocs.filter(d => d.type.startsWith('drive')).length,
    };
  };

  const getPhaseColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          accent: 'bg-emerald-500',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          accent: 'bg-blue-500',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/30',
          text: 'text-indigo-400',
          accent: 'bg-indigo-500',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          accent: 'bg-purple-500',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          accent: 'bg-amber-500',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'rose':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          accent: 'bg-rose-500',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      default:
        return {
          bg: 'bg-slate-800',
          border: 'border-slate-700',
          text: 'text-slate-300',
          accent: 'bg-blue-500',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 38-Week Mini Scroller Bar (Quick jump) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              38 Haftalık Hızlı Atlama Çubuğu
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Aktif: <strong className="text-white">Hafta {activeWeek}</strong>
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {weeks.map((w) => {
            const stats = getWeekStats(w.weekNumber);
            const isSelected = w.weekNumber === activeWeek;
            const phase = phases.find((p) => p.id === w.phaseId);
            const colorCls = getPhaseColorClasses(phase?.color || 'blue');

            return (
              <button
                key={w.weekNumber}
                onClick={() => onSelectWeek(w.weekNumber)}
                title={`Hafta ${w.weekNumber}: ${w.title} (${stats.completedTasks}/${stats.totalTasks} görev)`}
                className={`flex-shrink-0 w-8 sm:w-9 h-11 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 shadow-md'
                    : stats.percent === 100 && stats.totalTasks > 0
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                    : 'bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="text-[11px] leading-none">{w.weekNumber}</span>
                {w.isMilestone && (
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 mt-1" />
                )}
                {!w.isMilestone && (
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5"
                    style={{
                      backgroundColor:
                        stats.percent === 100 && stats.totalTasks > 0
                          ? '#10b981'
                          : stats.totalTasks > 0
                          ? '#3b82f6'
                          : '#64748b',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Faz Filtresi:
          </span>
          <button
            onClick={() => setSelectedPhaseFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedPhaseFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Tüm 38 Hafta
          </button>
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhaseFilter(phase.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedPhaseFilter === phase.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Hafta {phase.startWeek}-{phase.endWeek}
            </button>
          ))}
          <button
            onClick={() => setOnlyMilestones(!onlyMilestones)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              onlyMilestones
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            Sadece Kilometre Taşları
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hafta, hedef veya görev ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 38-Week Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredWeeks.map((week) => {
          const stats = getWeekStats(week.weekNumber);
          const phase = phases.find((p) => p.id === week.phaseId);
          const colors = getPhaseColorClasses(phase?.color || 'blue');
          const isCurrentActive = week.weekNumber === activeWeek;
          const weekTasksList = tasks.filter((t) => t.weekNumber === week.weekNumber);

          return (
            <div
              key={week.weekNumber}
              className={`rounded-2xl border transition-all hover:shadow-xl ${
                isCurrentActive
                  ? 'bg-slate-900 border-blue-500/60 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/5'
                  : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Hafta {week.weekNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium border ${colors.badge}`}>
                      {phase?.title.split(':')[0]}
                    </span>
                    {week.isMilestone && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {week.milestoneTitle || 'Kilometre Taşı'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-white truncate">
                    {week.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {week.goal}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{week.startDate} - {week.endDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{stats.totalLoggedHours}h / {week.targetHours}h Hedef</span>
                  </div>
                </div>
              </div>

              {/* Progress and Task preview */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Haftalık Görev İlerlemesi</span>
                    <span className="font-mono text-white font-bold">
                      {stats.completedTasks} / {stats.totalTasks} Görev ({stats.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.percent === 100
                          ? 'bg-emerald-500'
                          : stats.percent > 50
                          ? 'bg-blue-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>
                </div>

                {/* Tasks Snippets */}
                {weekTasksList.length > 0 ? (
                  <div className="space-y-1.5">
                    {weekTasksList.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800/60"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              task.status === 'completed'
                                ? 'line-through text-slate-500'
                                : 'text-slate-300 font-medium'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 flex-shrink-0 ml-2">
                          {task.loggedHours}/{task.estimatedHours}h
                        </span>
                      </div>
                    ))}
                    {weekTasksList.length > 3 && (
                      <div className="text-[11px] text-slate-500 text-center">
                        +{weekTasksList.length - 3} diğer görev
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-2 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    Bu hafta için henüz görev atanmamış.
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      {stats.docsCount} Doküman / Dosya
                    </span>
                    {stats.driveDocsCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <FolderGit2 className="w-3.5 h-3.5" />
                        {stats.driveDocsCount} Drive Linki
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenTaskModal(week.weekNumber)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      + Görev
                    </button>
                    <button
                      onClick={() => onSelectWeek(week.weekNumber)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm"
                    >
                      <span>Haftalık Çalışma Alanı</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
