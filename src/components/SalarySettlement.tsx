import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Wallet, Download, ChevronRight, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { cn, formatWorkDays } from '../utils';
import type { Employee, WorkLog, Advance, Team, TeamWorkLog, TeamAdvance } from '../types';

interface Props {
  employees: Employee[];
  workLogs: WorkLog[];
  advances: Advance[];
  teams: Team[];
  teamWorkLogs: TeamWorkLog[];
  teamAdvances: TeamAdvance[];
  onBack: () => void;
}

export default function SalarySettlement({ employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, onBack }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeMode, setTimeMode] = useState<'month' | 'year'>('month');

  const periodStart = timeMode === 'month' ? startOfMonth(currentMonth) : startOfYear(currentMonth);
  const periodEnd = timeMode === 'month' ? endOfMonth(currentMonth) : endOfYear(currentMonth);

  const employeeStats = useMemo(() => {
    return employees.map(emp => {
      const empWork = workLogs.filter(l =>
        l.employeeId === emp.id &&
        isWithinInterval(parseISO(l.date), { start: periodStart, end: periodEnd })
      );
      const empAdv = advances.filter(a =>
        a.employeeId === emp.id &&
        isWithinInterval(parseISO(a.date), { start: periodStart, end: periodEnd })
      );
      const workDays = empWork.reduce((s, l) => s + l.workDayValue, 0);
      const advTotal = empAdv.reduce((s, a) => s + a.amount, 0);
      const payable = (emp.dailyWage || 0) * workDays;
      const actual = payable - advTotal;
      return { ...emp, workDays, advTotal, payable, actual };
    }).filter(s => s.workDays > 0 || s.advTotal > 0);
  }, [employees, workLogs, advances, periodStart, periodEnd]);

  const teamStats = useMemo(() => {
    return teams.map(team => {
      const tWork = teamWorkLogs.filter(l =>
        l.teamId === team.id &&
        isWithinInterval(parseISO(l.date), { start: periodStart, end: periodEnd })
      );
      const tAdv = teamAdvances.filter(a =>
        a.teamId === team.id &&
        isWithinInterval(parseISO(a.date), { start: periodStart, end: periodEnd })
      );
      const workDays = tWork.reduce((s, l) => s + l.workerCount, 0);
      const advTotal = tAdv.reduce((s, a) => s + a.amount, 0);
      const payable = (team.dailyWage || 0) * workDays;
      const actual = payable - advTotal;
      return { ...team, workDays, advTotal, payable, actual };
    }).filter(s => s.workDays > 0 || s.advTotal > 0);
  }, [teams, teamWorkLogs, teamAdvances, periodStart, periodEnd]);

  const allStats = [...employeeStats.map(s => ({ ...s, type: '工友' as const })), ...teamStats.map(s => ({ ...s, type: '班组' as const }))];

  const totalWorkDays = allStats.reduce((s, st) => s + st.workDays, 0);
  const totalPayable = allStats.reduce((s, st) => s + st.payable, 0);
  const totalAdvances = allStats.reduce((s, st) => s + st.advTotal, 0);
  const totalActual = totalPayable - totalAdvances;

  const handleExport = () => {
    const header = '姓名,类型,工天,日薪,应发,借支,实发';
    const rows = allStats.map(s =>
      `${s.name},${s.type},${s.workDays},${(s as Employee).dailyWage || (s as Team).dailyWage || 0},${s.payable},${s.advTotal},${s.actual}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `工资结算单_${format(currentMonth, timeMode === 'month' ? 'yyyy年MM月' : 'yyyy年')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">工资结算单</h2>
            <p className="text-[9px] text-[#5A5A40]/40">应发 = 工天 × 日薪，实发 = 应发 − 借支</p>
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
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Download className="w-3 h-3" />
            导出CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg">
          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-1">总工天</div>
          <div className="text-xl font-serif font-bold">{formatWorkDays(totalWorkDays)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg">
          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-1">应发合计</div>
          <div className="text-xl font-serif font-bold text-[#5A5A40]">¥{totalPayable.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg">
          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-1">借支合计</div>
          <div className="text-xl font-serif font-bold text-orange-600">¥{totalAdvances.toLocaleString()}</div>
        </div>
        <div className={cn(
          "rounded-2xl p-4 shadow-xl",
          totalActual >= 0 ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white" : "bg-gradient-to-br from-red-600 to-red-500 text-white"
        )}>
          <div className="text-[8px] font-bold opacity-70 uppercase mb-1">实发合计</div>
          <div className="text-xl font-serif font-bold">¥{totalActual.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#F5F5F0]/50 text-[#5A5A40]/60">
                <th className="text-left px-4 py-2 font-bold">姓名</th>
                <th className="text-left px-2 py-2 font-bold">类型</th>
                <th className="text-right px-2 py-2 font-bold">工天</th>
                <th className="text-right px-2 py-2 font-bold">日薪</th>
                <th className="text-right px-2 py-2 font-bold">应发</th>
                <th className="text-right px-2 py-2 font-bold">借支</th>
                <th className="text-right px-4 py-2 font-bold">实发</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              <AnimatePresence>
                {allStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#5A5A40]/30">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  allStats.map(stat => (
                    <motion.tr
                      key={stat.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[#F5F5F0]/20"
                    >
                      <td className="px-4 py-2.5 font-bold text-[#1A1A1A]">{stat.name}</td>
                      <td className="px-2 py-2.5">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold",
                          stat.type === '工友' ? "bg-[#5A5A40]/10 text-[#5A5A40]" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {stat.type}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right font-serif">{formatWorkDays(stat.workDays)}</td>
                      <td className="px-2 py-2.5 text-right text-[#5A5A40]/60">
                        ¥{(stat as Employee).dailyWage ?? (stat as Team).dailyWage ?? '-'}
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold text-[#5A5A40]">¥{stat.payable.toLocaleString()}</td>
                      <td className="px-2 py-2.5 text-right font-bold text-orange-600">¥{stat.advTotal.toLocaleString()}</td>
                      <td className={cn(
                        "px-4 py-2.5 text-right font-bold",
                        stat.actual >= 0 ? "text-emerald-600" : "text-red-500"
                      )}>
                        ¥{stat.actual.toLocaleString()}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
            {allStats.length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F5F0]/30 font-bold text-[10px]">
                  <td className="px-4 py-2 text-[#1A1A1A]">合计</td>
                  <td className="px-2 py-2">{allStats.length}项</td>
                  <td className="px-2 py-2 text-right">{formatWorkDays(totalWorkDays)}</td>
                  <td className="px-2 py-2 text-right">-</td>
                  <td className="px-2 py-2 text-right text-[#5A5A40]">¥{totalPayable.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right text-orange-600">¥{totalAdvances.toLocaleString()}</td>
                  <td className={cn("px-4 py-2 text-right", totalActual >= 0 ? "text-emerald-600" : "text-red-500")}>
                    ¥{totalActual.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </motion.div>
  );
}
