/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Calendar, Wallet, BarChart3, DollarSign, ChevronRight, Search, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { cn, formatWorkDays } from '../utils';
import type { Employee, WorkLog, Advance, Team, TeamWorkLog, TeamAdvance } from '../types';

interface SummaryViewProps {
  employees: Employee[];
  workLogs: WorkLog[];
  advances: Advance[];
  teams: Team[];
  teamWorkLogs: TeamWorkLog[];
  teamAdvances: TeamAdvance[];
  onViewStatement: (id: string) => void;
}

export default function SummaryView({ employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, onViewStatement }: SummaryViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reportMode, setReportMode] = useState<'boss' | 'worker' | 'team' | 'project'>('boss');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<'month' | 'year'>('month');
  
  const periodStart = timeMode === 'month' ? startOfMonth(currentMonth) : startOfYear(currentMonth);
  const periodEnd = timeMode === 'month' ? endOfMonth(currentMonth) : endOfYear(currentMonth);

  const filteredWorkLogs = workLogs.filter(log => 
    isWithinInterval(parseISO(log.date), { start: periodStart, end: periodEnd })
  );
  
  const filteredAdvances = advances.filter(adv => 
    isWithinInterval(parseISO(adv.date), { start: periodStart, end: periodEnd })
  );

  const filteredTeamWorkLogs = teamWorkLogs.filter(log =>
    isWithinInterval(parseISO(log.date), { start: periodStart, end: periodEnd })
  );

  const filteredTeamAdvances = teamAdvances.filter(adv =>
    isWithinInterval(parseISO(adv.date), { start: periodStart, end: periodEnd })
  );

  const grandTotalWorkDays = filteredWorkLogs.reduce((acc, curr) => acc + curr.workDayValue, 0);
  const grandTotalAdvances = filteredAdvances.reduce((acc, curr) => acc + curr.amount, 0);

  const grandTotalTeamWorkDays = filteredTeamWorkLogs.reduce((acc, curr) => acc + curr.workerCount, 0);
  const grandTotalTeamAdvances = filteredTeamAdvances.reduce((acc, curr) => acc + curr.amount, 0);

  const allWorkDays = grandTotalWorkDays + grandTotalTeamWorkDays;
  const allAdvances = grandTotalAdvances + grandTotalTeamAdvances;

  const employeeSummaries = employees.map(emp => {
    const empWork = filteredWorkLogs.filter(l => l.employeeId === emp.id);
    const empAdv = filteredAdvances.filter(a => a.employeeId === emp.id);
    
    return {
      ...emp,
      totalWorkDays: empWork.reduce((acc, curr) => acc + curr.workDayValue, 0),
      totalAdvances: empAdv.reduce((acc, curr) => acc + curr.amount, 0)
    };
  }).filter(s => s.totalWorkDays > 0 || s.totalAdvances > 0);

  const teamSummaries = teams.map(team => {
    const tWork = filteredTeamWorkLogs.filter(l => l.teamId === team.id);
    const tAdv = filteredTeamAdvances.filter(a => a.teamId === team.id);
    return {
      ...team,
      totalWorkDays: tWork.reduce((acc, curr) => acc + curr.workerCount, 0),
      totalAdvances: tAdv.reduce((acc, curr) => acc + curr.amount, 0)
    };
  }).filter(s => s.totalWorkDays > 0 || s.totalAdvances > 0);

  const projectStats: Record<string, { workDays: number, advances: number }> = {};
  
  filteredWorkLogs.forEach(log => {
    const p = log.project || '未分类';
    if (!projectStats[p]) projectStats[p] = { workDays: 0, advances: 0 };
    projectStats[p].workDays += log.workDayValue;
  });

  filteredTeamWorkLogs.forEach(log => {
    const p = log.project || '未分类';
    if (!projectStats[p]) projectStats[p] = { workDays: 0, advances: 0 };
    projectStats[p].workDays += log.workerCount;
  });

  filteredAdvances.forEach(adv => {
    const empWorkLogs = filteredWorkLogs.filter(l => l.employeeId === adv.employeeId);
    const empProjects = [...new Set(empWorkLogs.map(l => l.project).filter(Boolean))];
    const p = empProjects.length === 1 ? empProjects[0]! : '未分类';
    if (!projectStats[p]) projectStats[p] = { workDays: 0, advances: 0 };
    projectStats[p].advances += adv.amount;
  });

  filteredTeamAdvances.forEach(adv => {
    const teamWorkLogsForAdv = filteredTeamWorkLogs.filter(l => l.teamId === adv.teamId);
    const teamProjects = [...new Set(teamWorkLogsForAdv.map(l => l.project).filter(Boolean))];
    const p = teamProjects.length === 1 ? teamProjects[0]! : '未分类';
    if (!projectStats[p]) projectStats[p] = { workDays: 0, advances: 0 };
    projectStats[p].advances += adv.amount;
  });

  const projectEntries = Object.entries(projectStats).sort((a, b) => b[1].workDays - a[1].workDays);
  const maxProjectWorkDays = projectEntries.length > 0 ? projectEntries[0][1].workDays : 1;

  const employeePersonShifts = filteredWorkLogs.length;
  const teamPersonShifts = filteredTeamWorkLogs.reduce((sum, log) => {
    const team = teams.find(t => t.id === log.teamId);
    if (team?.mode === 'leader') {
      return sum + log.workerCount;
    }
    return sum + 1;
  }, 0);
  const totalPersonShifts = employeePersonShifts + teamPersonShifts;

  const employeeTotalWages = employeeSummaries.reduce((sum, s) => sum + (s.dailyWage || 0) * s.totalWorkDays, 0);
  const teamTotalWages = teamSummaries.reduce((sum, s) => sum + (s.dailyWage || 0) * s.totalWorkDays, 0);
  const totalWages = employeeTotalWages + teamTotalWages;
  const totalBalance = totalWages - allAdvances;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">统计报表</h2>
          <div className="flex items-center gap-3 mt-1">
            <button 
              onClick={() => setReportMode('boss')}
              className={cn(
                "text-[10px] font-bold transition-all pb-1 border-b-2",
                reportMode === 'boss' ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#5A5A40]/40 border-transparent"
              )}
            >
              老板报表
            </button>
            <button 
              onClick={() => setReportMode('worker')}
              className={cn(
                "text-[10px] font-bold transition-all pb-1 border-b-2",
                reportMode === 'worker' ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#5A5A40]/40 border-transparent"
              )}
            >
              工友报表
            </button>
            <button 
              onClick={() => setReportMode('team')}
              className={cn(
                "text-[10px] font-bold transition-all pb-1 border-b-2",
                reportMode === 'team' ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#5A5A40]/40 border-transparent"
              )}
            >
              班组报表
            </button>
            <button 
              onClick={() => setReportMode('project')}
              className={cn(
                "text-[10px] font-bold transition-all pb-1 border-b-2",
                reportMode === 'project' ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#5A5A40]/40 border-transparent"
              )}
            >
              工地统计
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-xl p-0.5 border border-black/5 shadow-sm">
            <button 
              onClick={() => setTimeMode('month')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                timeMode === 'month' ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]/40 hover:text-[#5A5A40]"
              )}
            >
              月            </button>
            <button 
              onClick={() => setTimeMode('year')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                timeMode === 'year' ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]/40 hover:text-[#5A5A40]"
              )}
            >
              年            </button>
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

      <AnimatePresence mode="wait">
        {reportMode === 'boss' ? (
          <motion.div 
            key="boss"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl p-4 text-white shadow-xl shadow-[#5A5A40]/20 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1 opacity-70">
                    <BarChart3 className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{timeMode === 'month' ? '本月' : '本年'}总工天</span>
                  </div>
                  <div className="text-2xl font-serif font-bold">{formatWorkDays(allWorkDays)}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">个人{formatWorkDays(grandTotalWorkDays)} + 班组{formatWorkDays(grandTotalTeamWorkDays)}</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#5A5A40]/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
                    <Wallet className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{timeMode === 'month' ? '本月' : '本年'}总借支</span>
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#1A1A1A]">¥{allAdvances.toLocaleString()}</div>
                  <div className="text-[9px] text-[#5A5A40]/40 mt-0.5">个人¥{grandTotalAdvances.toLocaleString()} + 班组¥{grandTotalTeamAdvances.toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-50 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
                    <Users className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">用工量(人次)</span>
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#1A1A1A]">{totalPersonShifts}</div>
                  <div className="text-[9px] text-[#5A5A40]/40 mt-0.5">个人{employeePersonShifts}人次 + 班组{teamPersonShifts}人次</div>
                </div>
              </div>
              <div className={cn("rounded-2xl p-4 shadow-xl relative overflow-hidden", totalBalance >= 0 ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white shadow-emerald-700/20" : "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-red-600/20")}>
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1 opacity-70">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">应结余额</span>
                  </div>
                  <div className="text-2xl font-serif font-bold">¥{totalBalance.toLocaleString()}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">应付¥{totalWages.toLocaleString()} - 已借¥{allAdvances.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/5 flex items-center justify-between bg-[#F5F5F0]/30">
                <h3 className="font-bold text-[10px] text-[#1A1A1A]">老板概览 (全员汇总)</h3>
                <span className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">共{employeeSummaries.length} 位活跃工友</span>
              </div>
              <div className="divide-y divide-black/5">
                {employeeSummaries.length === 0 ? (
                  <div className="p-8 text-center text-[#5A5A40]/30 text-[10px] font-medium">
                    {timeMode === 'month' ? '本月' : '本年'}暂无记录
                  </div>
                ) : (
                  employeeSummaries.map(summary => (
                    <div key={summary.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-[#F5F5F0]/20 transition-colors">
                      <div className="flex items-center gap-2.5">
                        {summary.avatar ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src={summary.avatar} alt={summary.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-[#F5F5F0] rounded-lg flex items-center justify-center text-[#5A5A40] font-bold text-xs">
                            {summary.name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-[10px] text-[#1A1A1A]">{summary.name}</h4>
                          <p className="text-[8px] text-[#5A5A40]/40">{summary.phone || '无电话'}</p>
                        </div>
                      </div>
                      <div className="flex gap-5 text-right items-center">
                        <div>
                          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">工天</div>
                          <div className="font-serif font-bold text-xs text-[#1A1A1A]">{formatWorkDays(summary.totalWorkDays)}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">借支</div>
                          <div className="font-serif font-bold text-xs text-orange-600">¥{summary.totalAdvances}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">应结</div>
                          <div className={cn("font-serif font-bold text-xs", (summary.dailyWage || 0) * summary.totalWorkDays - summary.totalAdvances >= 0 ? "text-emerald-600" : "text-red-500")}>¥{((summary.dailyWage || 0) * summary.totalWorkDays - summary.totalAdvances).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : reportMode === 'worker' ? (
          <motion.div 
            key="worker"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between bg-[#F5F5F0]/30">
                <h3 className="font-bold text-xs text-[#1A1A1A]">工友报表 (个人对账)</h3>
                <span className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">选择工友查看详细对账单</span>
              </div>
              <div className="divide-y divide-black/5">
                {employeeSummaries.length === 0 ? (
                  <div className="p-10 text-center text-[#5A5A40]/30 text-xs font-medium">
                    {timeMode === 'month' ? '本月' : '本年'}暂无记录
                  </div>
                ) : (
                  employeeSummaries.map(summary => (
                    <div 
                      key={summary.id} 
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#F5F5F0]/20 transition-colors cursor-pointer"
                      onClick={() => onViewStatement(summary.id)}
                    >
                      <div className="flex items-center gap-3">
                        {summary.avatar ? (
                          <div className="w-9 h-9 rounded-xl overflow-hidden">
                            <img src={summary.avatar} alt={summary.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 bg-[#5A5A40]/5 rounded-xl flex items-center justify-center text-[#5A5A40] font-bold text-sm">
                            {summary.name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-[#1A1A1A]">{summary.name}</h4>
                          <p className="text-[9px] text-[#5A5A40]/40 font-medium">点击查看对账单</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#5A5A40]/20" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : reportMode === 'team' ? (
          <motion.div 
            key="team"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl p-4 text-white shadow-xl shadow-[#5A5A40]/20">
                <div className="flex items-center gap-1 mb-1 opacity-70">
                  <BarChart3 className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">班组总工天</span>
                </div>
                <div className="text-2xl font-serif font-bold">{formatWorkDays(grandTotalTeamWorkDays)}</div>
                <div className="text-[9px] opacity-60 mt-0.5">{teamSummaries.length}个活跃班组</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5">
                <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
                  <Wallet className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">班组总借支</span>
                </div>
                <div className="text-2xl font-serif font-bold text-orange-600">¥{grandTotalTeamAdvances.toLocaleString()}</div>
                <div className="text-[9px] text-[#5A5A40]/40 mt-0.5">全部班组预支</div>
              </div>
              <div className={cn("rounded-2xl p-4 shadow-xl", teamTotalWages - grandTotalTeamAdvances >= 0 ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white shadow-emerald-700/20" : "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-red-600/20")}>
                <div className="flex items-center gap-1 mb-1 opacity-70">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">应结余额</span>
                </div>
                <div className="text-2xl font-serif font-bold">¥{(teamTotalWages - grandTotalTeamAdvances).toLocaleString()}</div>
                <div className="text-[9px] opacity-60 mt-0.5">应付¥{teamTotalWages.toLocaleString()} - 已借¥{grandTotalTeamAdvances.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/5 flex items-center justify-between bg-[#F5F5F0]/30">
                <h3 className="font-bold text-[10px] text-[#1A1A1A]">班组汇总</h3>
                <span className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">共{teamSummaries.length} 个活跃班组 · 点击查看明细</span>
              </div>
              <div className="divide-y divide-black/5">
                {teamSummaries.length === 0 ? (
                  <div className="p-8 text-center text-[#5A5A40]/30 text-[10px] font-medium">
                    {timeMode === 'month' ? '本月' : '本年'}暂无班组记录
                  </div>
                ) : (
                  teamSummaries.map(summary => {
                    const teamDetailWorkLogs = filteredTeamWorkLogs.filter(l => l.teamId === summary.id);
                    const teamDetailAdvances = filteredTeamAdvances.filter(a => a.teamId === summary.id);
                    const isLeaderMode = summary.mode === 'leader';
                    
                    const memberStats: Record<string, { name: string, workDays: number }> = {};
                    if (!isLeaderMode && summary.members) {
                      summary.members.forEach(m => {
                        memberStats[m.id] = { name: m.name, workDays: 0 };
                      });
                    }
                    teamDetailWorkLogs.forEach(log => {
                      if (!isLeaderMode && log.memberId) {
                        if (!memberStats[log.memberId]) memberStats[log.memberId] = { name: log.memberName || '未知', workDays: 0 };
                        memberStats[log.memberId].workDays += log.workerCount;
                      }
                    });

                    return (
                      <div key={summary.id}>
                        <div 
                          className="px-4 py-2.5 flex items-center justify-between hover:bg-[#F5F5F0]/20 transition-colors cursor-pointer"
                          onClick={() => setExpandedTeam(expandedTeam === summary.id ? null : summary.id)}
                        >
                          <div className="flex items-center gap-2.5">
                            {summary.avatar ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden">
                                <img src={summary.avatar} alt={summary.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-[#5A5A40]/10 rounded-lg flex items-center justify-center text-[#5A5A40] font-bold text-xs">
                                {summary.name[0]}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-[10px] text-[#1A1A1A]">{summary.name}</h4>
                              <p className="text-[8px] text-[#5A5A40]/40">{isLeaderMode ? '组长模式' : '员工模式'}{summary.members ? ` · ${summary.members.length}人` : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-5 text-right items-center">
                              <div>
                                <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">工天</div>
                                <div className="font-serif font-bold text-xs text-[#1A1A1A]">{formatWorkDays(summary.totalWorkDays)}</div>
                              </div>
                              <div>
                                <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">借支</div>
                                <div className="font-serif font-bold text-xs text-orange-600">¥{summary.totalAdvances}</div>
                              </div>
                              <div>
                                <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">应结</div>
                                <div className={cn("font-serif font-bold text-xs", (summary.dailyWage || 0) * summary.totalWorkDays - summary.totalAdvances >= 0 ? "text-emerald-600" : "text-red-500")}>¥{((summary.dailyWage || 0) * summary.totalWorkDays - summary.totalAdvances).toLocaleString()}</div>
                              </div>
                            </div>
                            <ChevronRight className={cn("w-3.5 h-3.5 text-[#5A5A40]/30 transition-transform", expandedTeam === summary.id && "rotate-90")} />
                          </div>
                        </div>
                        
                        {expandedTeam === summary.id && (
                          <div className="bg-[#F5F5F0]/20 border-t border-black/5">
                            {!isLeaderMode && Object.keys(memberStats).length > 0 && (
                              <div className="px-4 py-2">
                                <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1.5">成员明细</p>
                                <div className="space-y-1">
                                  {Object.entries(memberStats).map(([mId, mStat]) => (
                                    <div key={mId} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                                      <span className="text-[10px] font-medium text-[#1A1A1A]">{mStat.name}</span>
                                      <span className="text-[10px] font-serif font-bold text-[#5A5A40]">{formatWorkDays(mStat.workDays)}个工</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {isLeaderMode && (
                              <div className="px-4 py-2">
                                <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1.5">每日出工记录</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {teamDetailWorkLogs.sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                                    <div key={log.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                                      <span className="text-[9px] font-mono text-[#5A5A40]/60">{log.date}</span>
                                      <span className="text-[10px] font-serif font-bold text-[#5A5A40]">{log.workerCount}个工</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!isLeaderMode && (
                              <div className="px-4 py-2 border-t border-black/5">
                                <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1.5">上班记录</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {teamDetailWorkLogs.sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                                    <div key={log.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-mono text-[#5A5A40]/60">{log.date}</span>
                                        <span className="text-[9px] text-[#1A1A1A]">{log.memberName || '未知'}</span>
                                      </div>
                                      <span className="text-[10px] font-serif font-bold text-[#5A5A40]">{log.hours}h {formatWorkDays(log.workerCount)}个工</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {teamDetailAdvances.length > 0 && (
                              <div className="px-4 py-2 border-t border-black/5">
                                <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1.5">借支记录</p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {teamDetailAdvances.sort((a, b) => b.date.localeCompare(a.date)).map(adv => (
                                    <div key={adv.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                                      <span className="text-[9px] font-mono text-[#5A5A40]/60">{adv.date}</span>
                                      <span className="text-[10px] font-serif font-bold text-orange-600">¥{adv.amount}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : reportMode === 'project' ? (
          <motion.div 
            key="project"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl p-4 text-white shadow-xl shadow-[#5A5A40]/20">
                <div className="flex items-center gap-1 mb-1 opacity-70">
                  <BarChart3 className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">工地项目</span>
                </div>
                <div className="text-2xl font-serif font-bold">{projectEntries.length}</div>
                <div className="text-[9px] opacity-60 mt-0.5">{timeMode === 'month' ? '本月' : '本年'}活跃项目</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5">
                <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
                  <Users className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">总用工量</span>
                </div>
                <div className="text-2xl font-serif font-bold text-[#1A1A1A]">{formatWorkDays(allWorkDays)}个工</div>
                <div className="text-[9px] text-[#5A5A40]/40 mt-0.5">全部项目合计</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/5 bg-[#F5F5F0]/30">
                <h3 className="font-bold text-[10px] text-[#1A1A1A]">工地占比与用工量</h3>
              </div>
              <div className="divide-y divide-black/5">
                {projectEntries.length === 0 ? (
                  <div className="p-8 text-center text-[#5A5A40]/30 text-[10px] font-medium">
                    {timeMode === 'month' ? '本月' : '本年'}暂无工地数据
                  </div>
                ) : (
                  projectEntries.map(([proj, stats]) => {
                    const percent = allWorkDays > 0 ? Math.round((stats.workDays / allWorkDays) * 100) : 0;
                    const barWidth = Math.max(Math.round((stats.workDays / maxProjectWorkDays) * 100), 2);
                    return (
                      <div key={proj} className="px-4 py-2.5 hover:bg-[#F5F5F0]/20 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#5A5A40]/10 flex items-center justify-center">
                              <Info className="w-3 h-3 text-[#5A5A40]" />
                            </div>
                            <span className="font-bold text-[10px] text-[#1A1A1A]">{proj}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-serif font-bold text-[#5A5A40]">{formatWorkDays(stats.workDays)}个工</span>
                            {stats.advances > 0 && <span className="text-[10px] font-serif font-bold text-orange-600">借¥{stats.advances.toLocaleString()}</span>}
                            <span className="text-[9px] font-bold text-[#5A5A40]/40 bg-[#5A5A40]/5 px-1.5 py-0.5 rounded">{percent}%</span>
                          </div>
                        </div>
                        <div className="ml-8 h-1.5 bg-[#F5F5F0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#5A5A40] rounded-full transition-all" style={{width: `${barWidth}%`}} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
