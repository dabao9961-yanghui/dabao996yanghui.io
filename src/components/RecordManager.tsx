import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn, formatWorkDays } from '../utils';
import { ImeInput, ImeTextarea } from './ImeInput';
import type { Employee, WorkLog, Advance } from '../types';
import { Clock, Wallet, Calendar, DollarSign, Info, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

function RecordManager({ 
  employees, 
  workLogs, 
  advances, 
  onAddWork, 
  onAddAdvance, 
  onDelete,
  initialEmployeeId,
  onClearInitial,
  standardHours,
  savedProjects,
  onAddProject,
  onDeleteProject
}: { 
  employees: Employee[], 
  workLogs: WorkLog[], 
  advances: Advance[], 
  onAddWork: (log: Omit<WorkLog, 'id' | 'ownerId'>) => Promise<void> | void,
  onAddAdvance: (adv: Omit<Advance, 'id' | 'ownerId'>) => Promise<void> | void,
  onDelete: (id: string, type: 'work' | 'advance') => Promise<void> | void,
  initialEmployeeId: string | null,
  onClearInitial: () => void,
  standardHours: number,
  savedProjects: string[],
  onAddProject: (name: string) => void,
  onDeleteProject: (name: string) => void
}) {
  const [type, setType] = useState<'work' | 'advance'>('work');
  const [selectedEmp, setSelectedEmp] = useState(initialEmployeeId || '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hours, setHours] = useState(standardHours.toString());
  const [project, setProject] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const currentEmpHoursPerDay = selectedEmp ? (employees.find(e => e.id === selectedEmp)?.hoursPerDay || standardHours) : standardHours;

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmp(initialEmployeeId);
      onClearInitial();
    }
  }, [initialEmployeeId, onClearInitial]);

  useEffect(() => {
    setHours(currentEmpHoursPerDay.toString());
  }, [currentEmpHoursPerDay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (type === 'work') {
      const h = parseFloat(hours) || 0;
      if (!h || !currentEmpHoursPerDay) return;
      onAddWork({
        employeeId: selectedEmp,
        date,
        hours: h,
        workDayValue: h / currentEmpHoursPerDay,
        project,
        description: desc
      });
    } else {
      const a = parseFloat(amount) || 0;
      if (!a) return;
      onAddAdvance({
        employeeId: selectedEmp,
        date,
        amount: a,
        description: desc
      });
    }
    setAmount('');
    setDesc('');
    setProject('');
  };

  const filteredWorkLogs = selectedEmp
    ? workLogs.filter(l => l.employeeId === selectedEmp).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const filteredAdvances = selectedEmp
    ? advances.filter(a => a.employeeId === selectedEmp).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-3">记一笔</h2>
      
      {selectedEmp && (() => {
        const emp = employees.find(e => e.id === selectedEmp);
        const empWorkDays = filteredWorkLogs.reduce((acc, l) => acc + l.workDayValue, 0);
        const empAdvances = filteredAdvances.reduce((acc, a) => acc + a.amount, 0);
        const empBalance = (emp?.dailyWage || 0) * empWorkDays - empAdvances;
        return (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white rounded-xl p-2.5 border border-black/5">
              <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">累计工天</p>
              <p className="text-lg font-serif font-bold text-[#1A1A1A]">{formatWorkDays(empWorkDays)} <span className="text-[8px] font-sans opacity-40">个工</span></p>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-black/5">
              <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">累计借支</p>
              <p className="text-lg font-serif font-bold text-orange-600">¥{empAdvances.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-600 rounded-xl p-2.5 shadow-lg shadow-emerald-600/20 text-white">
              <p className="text-[8px] font-bold opacity-70 uppercase tracking-widest">应结余额</p>
              <p className="text-lg font-serif font-bold">¥{empBalance.toLocaleString()}</p>
              {emp?.dailyWage && <p className="text-[7px] opacity-50">¥{emp.dailyWage}/天</p>}
            </div>
          </div>
        );
      })()}
      
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-3" style={{height: selectedEmp ? 'calc(100vh - 280px)' : 'calc(100vh - 160px)'}}>
        <div className="lg:col-span-4 bg-white rounded-2xl border border-black/5 shadow-xl shadow-black/5 flex flex-col overflow-hidden">
          <div className="flex bg-[#F5F5F0] p-1 rounded-lg m-3 mb-0">
            <button 
              onClick={() => setType('work')}
              className={cn("flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs", type === 'work' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/40 hover:text-[#5A5A40]/60")}
            >
              <Clock className="w-3 h-3" />
              记工天            </button>
            <button 
              onClick={() => setType('advance')}
              className={cn("flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs", type === 'advance' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/40 hover:text-[#5A5A40]/60")}
            >
              <Wallet className="w-3 h-3" />
              记借支
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {selectedEmp ? (
              <div className="flex items-center gap-2 bg-[#F5F5F0] rounded-lg px-3 py-2">
                {(() => {
                  const emp = employees.find(e => e.id === selectedEmp);
                  return emp ? (
                    <>
                      {emp.avatar ? (
                        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                          {emp.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-[10px] text-[#1A1A1A] truncate">{emp.name}</p>
                        <div className="flex items-center gap-2">
                          {emp.phone && (
                            <span className="text-[8px] text-[#5A5A40]/40 font-mono">{emp.phone}</span>
                          )}
                          {emp.dailyWage && (
                            <span className="text-[8px] text-[#5A5A40]/60">¥{emp.dailyWage}/</span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="bg-[#F5F5F0] rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-[#5A5A40]/40">请从工友管理中选择工友</p>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">日期</label>
              <div className="relative mt-0.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#F5F5F0] rounded-lg pl-9 pr-3 py-2 outline-none font-bold text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                  required
                />
              </div>
            </div>
            {type === 'work' ? (
              <div>
                <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">工时 ({currentEmpHoursPerDay}小时=1个工)</label>
                <div className="relative mt-0.5">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    className="w-full bg-[#F5F5F0] rounded-lg pl-9 pr-20 py-2 outline-none font-bold text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                    <button type="button" onClick={() => setHours(currentEmpHoursPerDay.toString())} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5 hover:bg-white/50 font-bold">全天</button>
                    <button type="button" onClick={() => setHours((currentEmpHoursPerDay/2).toString())} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5 hover:bg-white/50 font-bold">半天</button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">借支金额 (元)</label>
                <div className="relative mt-0.5">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                  <input 
                    type="number" 
                    placeholder="0.00"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-[#F5F5F0] rounded-lg pl-9 pr-3 py-2 outline-none font-bold text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {type === 'work' && (
              <div>
                <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">工地项目</label>
                <div className="relative mt-0.5">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                  <ImeInput 
                    placeholder="输入工地/项目名称"
                    value={project}
                    onChange={setProject}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && project.trim() && !savedProjects.includes(project.trim())) {
                        e.preventDefault();
                        onAddProject(project.trim());
                      }
                    }}
                    className="w-full bg-[#F5F5F0] rounded-lg pl-9 pr-3 py-2 outline-none font-bold text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                  />
                </div>
                {savedProjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {savedProjects.map(p => (
                      <div 
                        key={p} 
                        className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 group/proj",
                          project === p 
                            ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                            : "bg-white text-[#5A5A40]/60 border-black/5 hover:border-[#5A5A40]/30"
                        )}
                      >
                        <button 
                          type="button"
                          onClick={() => setProject(p)}
                          className="cursor-pointer"
                        >
                          {p}
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDeleteProject(p); }}
                          className="text-[#5A5A40]/20 hover:text-red-500 transition-colors opacity-0 group-hover/proj:opacity-100"
                        >
                          <Trash2 className="w-2 h-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">备注 (可选)</label>
              <ImeTextarea 
                placeholder="添加一些备注..."
                value={desc}
                onChange={setDesc}
                className="w-full bg-[#F5F5F0] rounded-lg px-3 py-2 outline-none font-medium text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all resize-none"
                rows={1}
              />
            </div>

            <button type="submit" className="w-full bg-[#5A5A40] text-white py-2 rounded-lg font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all active:scale-[0.98] text-xs">
              确认记录
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
            <Clock className="w-3 h-3 text-emerald-600" />
            <h3 className="font-bold text-[10px] text-[#1A1A1A]">上班记录</h3>
            {selectedEmp && <span className="text-[9px] text-[#5A5A40]/40 ml-auto">{filteredWorkLogs.length}条</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedEmp ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">请先选择工友</div>
            ) : filteredWorkLogs.length === 0 ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">暂无上班记录</div>
            ) : (
              <div className="divide-y divide-black/5">
                {filteredWorkLogs.map(rec => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  return (
                  <div key={rec.id} className="px-3 py-2 flex items-center justify-between group hover:bg-[#F5F5F0]/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-[#5A5A40]">{emp?.name || '未知'}</span>
                          <span className="text-[9px] font-mono text-[#5A5A40]/40">{rec.date}</span>
                        </div>
                        <p className="text-[10px] font-medium text-[#1A1A1A]">{rec.hours}小时 / {formatWorkDays(rec.workDayValue)}个工</p>
                        {rec.project && <p className="text-[8px] text-[#5A5A40]/40">{rec.project}</p>}
                      </div>
                    </div>
                    <button 
                      onClick={() => onDelete(rec.id, 'work')}
                      className="p-0.5 text-red-500/0 group-hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
            <Wallet className="w-3 h-3 text-orange-600" />
            <h3 className="font-bold text-[10px] text-[#1A1A1A]">借支记录</h3>
            {selectedEmp && <span className="text-[9px] text-[#5A5A40]/40 ml-auto">{filteredAdvances.length}条</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedEmp ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">请先选择工友</div>
            ) : filteredAdvances.length === 0 ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">暂无借支记录</div>
            ) : (
              <div className="divide-y divide-black/5">
                {filteredAdvances.map(rec => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  return (
                  <div key={rec.id} className="px-3 py-2 flex items-center justify-between group hover:bg-[#F5F5F0]/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Wallet className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-[#5A5A40]">{emp?.name || '未知'}</span>
                          <span className="text-[9px] font-mono text-[#5A5A40]/40">{rec.date}</span>
                        </div>
                        <p className="text-[10px] font-bold text-orange-600">¥{rec.amount}</p>
                        {rec.description && <p className="text-[8px] text-[#5A5A40]/40">{rec.description}</p>}
                      </div>
                    </div>
                    <button 
                      onClick={() => onDelete(rec.id, 'advance')}
                      className="p-0.5 text-red-500/0 group-hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default RecordManager;
