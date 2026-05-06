import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Users, Wallet, DollarSign, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn, formatWorkDays } from '../utils';
import type { Employee, WorkLog, Advance, Team, TeamWorkLog, TeamAdvance } from '../types';

interface Props {
  employees: Employee[];
  workLogs: WorkLog[];
  advances: Advance[];
  teams: Team[];
  teamWorkLogs: TeamWorkLog[];
  teamAdvances: TeamAdvance[];
}

export default function Dashboard({ employees, workLogs, advances, teams, teamWorkLogs, teamAdvances }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayStats = useMemo(() => {
    const todayWork = workLogs.filter(l => l.date === today);
    const todayTeamWork = teamWorkLogs.filter(l => l.date === today);
    const totalTodayWorkers = todayWork.length;
    const totalTodayTeamWorkers = todayTeamWork.reduce((sum, log) => {
      const team = teams.find(t => t.id === log.teamId);
      return sum + (team?.mode === 'leader' ? log.workerCount : 1);
    }, 0);

    const todayRecords = [
      ...todayWork.map(l => {
        const emp = employees.find(e => e.id === l.employeeId);
        return { name: emp?.name || '未知', project: l.project || '未分类', count: l.workDayValue, type: '个人' as const };
      }),
      ...todayTeamWork.map(l => {
        const team = teams.find(t => t.id === l.teamId);
        const isLeader = team?.mode === 'leader';
        return { name: team?.name || '未知班组', project: l.project || '未分类', count: isLeader ? l.workerCount : 1, type: '班组' as const };
      })
    ];

    return { totalPersonal: totalTodayWorkers, totalTeam: totalTodayTeamWorkers, total: totalTodayWorkers + totalTodayTeamWorkers, records: todayRecords };
  }, [today, workLogs, teamWorkLogs, employees, teams]);

  const monthStats = useMemo(() => {
    const now = new Date();
    const monthPrefix = format(now, 'yyyy-MM');

    const monthWork = workLogs.filter(l => l.date.startsWith(monthPrefix));
    const monthTeamWork = teamWorkLogs.filter(l => l.date.startsWith(monthPrefix));
    const monthAdvances = advances.filter(a => a.date.startsWith(monthPrefix));
    const monthTeamAdvances = teamAdvances.filter(a => a.date.startsWith(monthPrefix));

    const totalWorkDays = monthWork.reduce((s, l) => s + l.workDayValue, 0) + monthTeamWork.reduce((s, l) => s + l.workerCount, 0);
    const totalAdvances = monthAdvances.reduce((s, a) => s + a.amount, 0) + monthTeamAdvances.reduce((s, a) => s + a.amount, 0);

    const employeeTotalWages = employees.reduce((sum, emp) => {
      const empWorkDays = monthWork.filter(l => l.employeeId === emp.id).reduce((s, l) => s + l.workDayValue, 0);
      return sum + (emp.dailyWage || 0) * empWorkDays;
    }, 0);

    const teamTotalWages = teams.reduce((sum, team) => {
      const tWorkDays = monthTeamWork.filter(l => l.teamId === team.id).reduce((s, l) => s + l.workerCount, 0);
      return sum + (team.dailyWage || 0) * tWorkDays;
    }, 0);

    const totalWages = employeeTotalWages + teamTotalWages;

    return { workDays: totalWorkDays, advances: totalAdvances, wages: totalWages, balance: totalWages - totalAdvances };
  }, [workLogs, teamWorkLogs, advances, teamAdvances, employees, teams]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">今日概览</h2>
          <p className="text-[10px] text-[#5A5A40]/40 mt-0.5">{format(new Date(), 'yyyy年MM月dd日')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl p-4 text-white shadow-xl shadow-[#5A5A40]/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-1 opacity-70">
              <Calendar className="w-3 h-3" />
              <span className="text-[8px] font-bold uppercase tracking-widest">今日出工</span>
            </div>
            <div className="text-2xl font-serif font-bold">{todayStats.total}</div>
            <div className="text-[9px] opacity-60 mt-0.5">
              {todayStats.totalPersonal > 0 && `工友${todayStats.totalPersonal}人`}
              {todayStats.totalPersonal > 0 && todayStats.totalTeam > 0 && ' + '}
              {todayStats.totalTeam > 0 && `班组${todayStats.totalTeam}人`}
              {todayStats.total === 0 && '暂无出工记录'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#5A5A40]/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
              <BarChart3 className="w-3 h-3" />
              <span className="text-[8px] font-bold uppercase tracking-widest">本月工天</span>
            </div>
            <div className="text-2xl font-serif font-bold text-[#1A1A1A]">{formatWorkDays(monthStats.workDays)}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-orange-50 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
              <Wallet className="w-3 h-3" />
              <span className="text-[8px] font-bold uppercase tracking-widest">本月已支出</span>
            </div>
            <div className="text-2xl font-serif font-bold text-orange-600">¥{monthStats.advances.toLocaleString()}</div>
          </div>
        </div>

        <div className={cn(
          "rounded-2xl p-4 shadow-xl relative overflow-hidden",
          monthStats.balance >= 0
            ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white shadow-emerald-700/20"
            : "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-red-600/20"
        )}>
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-1 opacity-70">
              <DollarSign className="w-3 h-3" />
              <span className="text-[8px] font-bold uppercase tracking-widest">应结余额</span>
            </div>
            <div className="text-2xl font-serif font-bold">¥{monthStats.balance.toLocaleString()}</div>
            <div className="text-[9px] opacity-60 mt-0.5">应付¥{monthStats.wages.toLocaleString()} - 已借¥{monthStats.advances.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-black/5 flex items-center justify-between bg-[#F5F5F0]/30">
          <h3 className="font-bold text-[10px] text-[#1A1A1A]">今日出工明细</h3>
          <span className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">{todayStats.records.length}条记录</span>
        </div>
        <div className="divide-y divide-black/5">
          {todayStats.records.length === 0 ? (
            <div className="p-8 text-center text-[#5A5A40]/30 text-[10px] font-medium">
              今日暂无记录
            </div>
          ) : (
            todayStats.records.map((rec, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-center justify-between hover:bg-[#F5F5F0]/20 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    rec.type === '个人' ? 'bg-[#5A5A40]' : 'bg-emerald-500'
                  )} />
                  <div>
                    <h4 className="font-bold text-[10px] text-[#1A1A1A]">{rec.name}</h4>
                    <p className="text-[8px] text-[#5A5A40]/40">{rec.project}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] font-bold text-[#5A5A40]/40 uppercase">{rec.type}</span>
                  <div className="font-serif font-bold text-xs text-[#1A1A1A]">
                    {rec.type === '个人' ? `${formatWorkDays(rec.count)}天` : `${rec.count}人`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
