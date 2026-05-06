import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, ChevronRight, Building2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { cn, formatWorkDays } from '../utils';
import type { Employee, WorkLog, Advance, TeamWorkLog, TeamAdvance } from '../types';

interface Props {
  employees: Employee[];
  workLogs: WorkLog[];
  advances: Advance[];
  teamWorkLogs: TeamWorkLog[];
  teamAdvances: TeamAdvance[];
  onBack: () => void;
}

interface ProjectCost {
  workDays: number;
  personShifts: number;
  wages: number;
  advances: number;
}

export default function ProjectCostSummary({ employees, workLogs, advances, teamWorkLogs, teamAdvances, onBack }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeMode, setTimeMode] = useState<'month' | 'year'>('month');

  const periodStart = timeMode === 'month' ? startOfMonth(currentMonth) : startOfYear(currentMonth);
  const periodEnd = timeMode === 'month' ? endOfMonth(currentMonth) : endOfYear(currentMonth);

  const projectStats = useMemo(() => {
    const stats: Record<string, ProjectCost> = {};

    workLogs.forEach(log => {
      if (!isWithinInterval(parseISO(log.date), { start: periodStart, end: periodEnd })) return;
      const p = log.project || '未分类';
      if (!stats[p]) stats[p] = { workDays: 0, personShifts: 0, wages: 0, advances: 0 };
      stats[p].workDays += log.workDayValue;
      stats[p].personShifts += 1;
      const emp = employees.find(e => e.id === log.employeeId);
      stats[p].wages += (emp?.dailyWage || 0) * log.workDayValue;
    });

    teamWorkLogs.forEach(log => {
      if (!isWithinInterval(parseISO(log.date), { start: periodStart, end: periodEnd })) return;
      const p = log.project || '未分类';
      if (!stats[p]) stats[p] = { workDays: 0, personShifts: 0, wages: 0, advances: 0 };
      stats[p].workDays += log.workerCount;
      stats[p].personShifts += log.workerCount;
    });

    advances.forEach(adv => {
      if (!isWithinInterval(parseISO(adv.date), { start: periodStart, end: periodEnd })) return;
      const empWorkLogs = workLogs.filter(l =>
        l.employeeId === adv.employeeId &&
        isWithinInterval(parseISO(l.date), { start: periodStart, end: periodEnd })
      );
      const empProjects = [...new Set(empWorkLogs.map(l => l.project).filter(Boolean))];
      const p = empProjects.length === 1 ? empProjects[0]! : '未分类';
      if (!stats[p]) stats[p] = { workDays: 0, personShifts: 0, wages: 0, advances: 0 };
      stats[p].advances += adv.amount;
    });

    teamAdvances.forEach(adv => {
      if (!isWithinInterval(parseISO(adv.date), { start: periodStart, end: periodEnd })) return;
      const tWorkLogs = teamWorkLogs.filter(l =>
        l.teamId === adv.teamId &&
        isWithinInterval(parseISO(l.date), { start: periodStart, end: periodEnd })
      );
      const tProjects = [...new Set(tWorkLogs.map(l => l.project).filter(Boolean))];
      const p = tProjects.length === 1 ? tProjects[0]! : '未分类';
      if (!stats[p]) stats[p] = { workDays: 0, personShifts: 0, wages: 0, advances: 0 };
      stats[p].advances += adv.amount;
    });

    return Object.entries(stats)
      .map(([name, s]) => ({ name, ...s, balance: s.wages - s.advances }))
      .sort((a, b) => b.workDays - a.workDays);
  }, [workLogs, teamWorkLogs, advances, teamAdvances, employees, periodStart, periodEnd]);

  const totals = projectStats.reduce(
    (acc, p) => ({
      workDays: acc.workDays + p.workDays,
      personShifts: acc.personShifts + p.personShifts,
      wages: acc.wages + p.wages,
      advances: acc.advances + p.advances,
      balance: acc.balance + p.balance,
    }),
    { workDays: 0, personShifts: 0, wages: 0, advances: 0, balance: 0 }
  );

  const maxWorkDays = projectStats.length > 0 ? Math.max(...projectStats.map(p => p.workDays), 1) : 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">工地成本汇总</h2>
            <p className="text-[9px] text-[#5A5A40]/40">按项目统计工天、人次、工资和借支</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-xl p-0.5 border border-black/5 shadow-sm">
            <button
              onClick={() => setTimeMode('month')}
              className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all", timeMode === 'month' ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]/40 hover:text-[#5A5A40]")}
            >
              月
            </button>
            <button
              onClick={() => setTimeMode('year')}
              className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all", timeMode === 'year' ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]/40 hover:text-[#5A5A40]")}
            >
              年
            </button>
          </div>
          <div className="flex items-center bg-white rounded-xl p-1 border border-black/5 shadow-sm">
            <button
              onClick={() => {
                const d = new Date(currentMonth);
                if (timeMode === 'month') d.setMonth(d.getMonth() - 1);
                else d.setFullYear(d.getFullYear() - 1);
                setCurrentMonth(d);
              }}
              className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <span className="px-3 font-bold text-[#5A5A40] text-xs min-w-[100px] text-center">
              {timeMode === 'month' ? format(currentMonth, 'yyyy年MM月') : format(currentMonth, 'yyyy年')}
            </span>
            <button
              onClick={() => {
                const d = new Date(currentMonth);
                if (timeMode === 'month') d.setMonth(d.getMonth() + 1);
                else d.setFullYear(d.getFullYear() + 1);
                setCurrentMonth(d);
              }}
              className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg">
          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-1">项目数</div>
          <div className="text-xl font-serif font-bold">{projectStats.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg">
          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-1">总工天</div>
          <div className="text-xl font-serif font-bold">{formatWorkDays(totals.workDays)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg">
          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-1">工资支出</div>
          <div className="text-xl font-serif font-bold text-[#5A5A40]">¥{totals.wages.toLocaleString()}</div>
        </div>
        <div className={cn(
          "rounded-2xl p-4 shadow-lg",
          totals.balance >= 0 ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white" : "bg-gradient-to-br from-red-600 to-red-500 text-white"
        )}>
          <div className="text-[8px] font-bold opacity-70 uppercase mb-1">应结余额</div>
          <div className="text-xl font-serif font-bold">¥{totals.balance.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-black/5 bg-[#F5F5F0]/30 flex items-center gap-2">
          <Building2 className="w-3 h-3 text-[#5A5A40]" />
          <h3 className="font-bold text-[10px] text-[#1A1A1A]">项目明细</h3>
        </div>
        <div className="divide-y divide-black/5">
          {projectStats.length === 0 ? (
            <div className="p-10 text-center text-[#5A5A40]/30 text-[10px] font-medium">
              暂无数据
            </div>
          ) : (
            projectStats.map(proj => (
              <div key={proj.name} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#5A5A40]" />
                    <h4 className="font-bold text-[10px] text-[#1A1A1A]">{proj.name}</h4>
                  </div>
                  <span className="text-[8px] font-bold text-[#5A5A40]/40">
                    {((proj.workDays / Math.max(maxWorkDays, 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#F5F5F0] rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#5A5A40] to-[#4A4A30] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(proj.workDays / Math.max(maxWorkDays, 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex gap-4 text-[9px] text-[#5A5A40]/60">
                  <span>{formatWorkDays(proj.workDays)}天</span>
                  <span>{proj.personShifts}人次</span>
                  <span>工资¥{proj.wages.toLocaleString()}</span>
                  {proj.advances > 0 && <span className="text-orange-500">借支¥{proj.advances.toLocaleString()}</span>}
                  <span className={cn("font-bold", proj.balance >= 0 ? "text-emerald-600" : "text-red-500")}>
                    结余¥{proj.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
          {projectStats.length > 0 && (
            <div className="px-4 py-2.5 bg-[#F5F5F0]/30 flex items-center justify-between font-bold text-[9px]">
              <span className="text-[#1A1A1A]">合计</span>
              <div className="flex gap-4 text-[#5A5A40]/60">
                <span>{formatWorkDays(totals.workDays)}天</span>
                <span>{totals.personShifts}人次</span>
                <span>¥{totals.wages.toLocaleString()}</span>
                <span>¥{totals.advances.toLocaleString()}</span>
                <span className={cn(totals.balance >= 0 ? "text-emerald-600" : "text-red-500")}>¥{totals.balance.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
