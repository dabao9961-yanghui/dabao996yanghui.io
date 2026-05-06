import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatWorkDays } from '../utils';
import { ChevronRight, Phone, Clock, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { ImeInput } from './ImeInput';
import type { Employee, WorkLog, Advance } from '../types';

function StatementView({ employee, workLogs, advances, onBack }: { 
  employee: Employee, 
  workLogs: WorkLog[], 
  advances: Advance[],
  onBack: () => void
}) {
  const totalWorkDays = workLogs.reduce((sum, l) => sum + l.workDayValue, 0);
  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
  const estimatedWage = employee.dailyWage ? (totalWorkDays * employee.dailyWage) : 0;
  const balance = estimatedWage - totalAdvances;

  const projectStats = workLogs.reduce((acc, log) => {
    const p = log.project || '未分类';
    acc[p] = (acc[p] || 0) + log.workDayValue;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-black/5 text-[#5A5A40] hover:bg-[#F5F5F0] transition-all">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        {employee.avatar ? (
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-inner">
            <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-xl flex items-center justify-center text-white font-serif font-bold text-sm shadow-inner">
            {employee.name[0]}
          </div>
        )}
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">{employee.name} 的对账单</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="w-2.5 h-2.5 text-[#5A5A40]/40" />
            <span className="text-[9px] text-[#5A5A40]/40 font-mono">{employee.phone || '未设置电话'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">累计工天</p>
          <p className="text-2xl font-serif font-bold text-[#1A1A1A]">{formatWorkDays(totalWorkDays)} <span className="text-[10px] font-sans opacity-40">个工</span></p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">累计借支</p>
          <p className="text-2xl font-serif font-bold text-orange-600">¥{totalAdvances.toLocaleString()}</p>
        </div>
        <div className="bg-[#5A5A40] rounded-2xl p-4 shadow-lg shadow-[#5A5A40]/20 text-white">
          <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mb-1">应结余额</p>
          <p className="text-2xl font-serif font-bold">¥{balance.toLocaleString()}</p>
          {employee.dailyWage && <p className="text-[9px] opacity-40 mt-0.5">¥{employee.dailyWage}/天计算</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col" style={{maxHeight: 'calc(100vh - 340px)'}}>
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
            <Clock className="w-3 h-3 text-[#5A5A40]" />
            <h3 className="font-bold text-[10px] text-[#1A1A1A]">工时明细</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F5F0] text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">
                  <th className="px-3 py-2">日期</th>
                  <th className="px-3 py-2">项目</th>
                  <th className="px-3 py-2">工时</th>
                  <th className="px-3 py-2">折合</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {workLogs.map(log => (
                  <tr key={log.id} className="text-[10px]">
                    <td className="px-3 py-2 font-mono">{log.date}</td>
                    <td className="px-3 py-2 text-[#5A5A40]">{log.project || '-'}</td>
                    <td className="px-3 py-2">{log.hours}h</td>
                    <td className="px-3 py-2 font-bold">{formatWorkDays(log.workDayValue)}个工</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col" style={{maxHeight: 'calc((100vh - 340px) / 2)'}}>
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
              <Wallet className="w-3 h-3 text-[#5A5A40]" />
              <h3 className="font-bold text-[10px] text-[#1A1A1A]">借支明细</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F0] text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">
                    <th className="px-3 py-2">日期</th>
                    <th className="px-3 py-2">金额</th>
                    <th className="px-3 py-2">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {advances.map(adv => (
                    <tr key={adv.id} className="text-[10px]">
                      <td className="px-3 py-2 font-mono">{adv.date}</td>
                      <td className="px-3 py-2 font-bold text-orange-600">¥{adv.amount}</td>
                      <td className="px-3 py-2 text-[#5A5A40]/60">{adv.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-black/5 p-4">
            <h4 className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-3">项目汇总</h4>
            <div className="space-y-2">
              {Object.entries(projectStats).map(([proj, val]) => (
                <div key={proj} className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#1A1A1A]">{proj}</span>
                  <span className="font-serif font-bold text-xs text-[#5A5A40]">{formatWorkDays(val)} 个工</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default StatementView;
