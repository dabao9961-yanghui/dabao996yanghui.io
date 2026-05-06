import React, { useState, useRef, useEffect } from 'react';
import { cn, formatWorkDays } from '../utils';
import { ImeInput } from './ImeInput';
import AvatarCropper from './AvatarCropper';
import { Employee, WorkLog, Advance } from '../types';
import { Users, Plus, Search, UserPlus, Camera, Pencil, Trash2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function EmployeeList({ employees, workLogs, advances, onAdd, onDelete, onUpdateAvatar, onUpdateEmployee, resetTrigger, onRecord, onShowDeleteConfirm }: { 
  employees: Employee[], 
  workLogs: WorkLog[],
  advances: Advance[],
  onAdd: (name: string, phone: string, dailyWage?: number, hoursPerDay?: number, avatar?: string) => Promise<void> | void,
  onDelete: (id: string) => Promise<void> | void,
  onUpdateAvatar: (id: string, avatar: string) => Promise<void> | void,
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void> | void,
  resetTrigger: number,
  onRecord: (id: string) => void,
  onShowDeleteConfirm: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWage, setEditWage] = useState('');
  const [editHoursPerDay, setEditHoursPerDay] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWage, setNewWage] = useState('');
  const [newHoursPerDay, setNewHoursPerDay] = useState('8');
  const [newAvatar, setNewAvatar] = useState('');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'newEmp' | string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setIsAdding(false);
    setEditingId(null);
  }, [resetTrigger]);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.phone?.includes(search)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName, newPhone, newWage ? parseFloat(newWage) : undefined, newHoursPerDay ? parseFloat(newHoursPerDay) : undefined, newAvatar || undefined);
    setNewName('');
    setNewPhone('');
    setNewWage('');
    setNewHoursPerDay('8');
    setNewAvatar('');
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-serif font-bold text-[#1A1A1A]">工友管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/40" />
            <input 
              type="text" 
              placeholder="搜索姓名或电话..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border border-black/5 focus:ring-2 ring-[#5A5A40]/10 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-[#5A5A40] text-white p-3 rounded-2xl hover:bg-[#4A4A30] transition-all shadow-lg shadow-[#5A5A40]/20 active:scale-95"
          >
            <Plus className={cn("w-6 h-6 transition-transform duration-300", isAdding && "rotate-45")} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-[32px] p-8 border border-black/5 overflow-hidden shadow-xl shadow-black/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#5A5A40]/10 rounded-lg flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-[#5A5A40]" />
              </div>
              <h3 className="font-bold text-[#1A1A1A]">添加新工友</h3>
            </div>
            <div className="flex justify-center mb-6">
              <label className="relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setCropImage(ev.target?.result as string);
                      setCropTarget('newEmp');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {newAvatar ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-black/10 group-hover:shadow-xl transition-all">
                    <img src={newAvatar} alt="头像预览" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-[#F5F5F0] rounded-2xl flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#5A5A40]/20 group-hover:border-[#5A5A40]/40 transition-all">
                    <Camera className="w-5 h-5 text-[#5A5A40]/30" />
                    <span className="text-[9px] text-[#5A5A40]/30 font-medium">上传头像</span>
                  </div>
                )}
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">姓名</label>
                <ImeInput 
                  placeholder="输入工友姓名" 
                  value={newName}
                  onChange={setNewName}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">联系电话</label>
                <ImeInput 
                  type="tel"
                  placeholder="输入联系电话" 
                  value={newPhone}
                  onChange={setNewPhone}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">工费 (元)</label>
                <input 
                  type="number" 
                  placeholder="输入工费" 
                  value={newWage}
                  onChange={e => setNewWage(e.target.value)}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">小时/天</label>
                <input 
                  type="number" 
                  placeholder="8" 
                  value={newHoursPerDay}
                  onChange={e => setNewHoursPerDay(e.target.value)}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all active:scale-[0.98]">
              确认添加
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full bg-white/40 border-2 border-dashed border-[#5A5A40]/10 rounded-[40px] py-20 flex flex-col items-center justify-center text-[#5A5A40]/40">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">{search ? '没有找到匹配的工友' : '还没有添加工友，点击右上角加号开始吧'}</p>
          </div>
        ) : (
          filteredEmployees.map(emp => (
            <motion.div 
              layout
              key={emp.id} 
              className="bg-white rounded-[32px] p-4 border border-black/5 flex flex-col group hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer relative"
              onClick={() => editingId !== emp.id && onRecord(emp.id)}
            >
              <div className="absolute top-3 right-3 flex gap-1 z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editingId === emp.id) {
                      setEditingId(null);
                    } else {
                      setEditingId(emp.id);
                      setEditWage(emp.dailyWage?.toString() || '');
                      setEditHoursPerDay(emp.hoursPerDay?.toString() || '');
                      setEditPhone(emp.phone || '');
                    }
                  }}
                  className="p-2 text-[#5A5A40]/20 hover:text-[#5A5A40] hover:bg-[#5A5A40]/5 rounded-xl transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDeleteConfirm(emp.id);
                  }}
                  className="p-2 text-red-500/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {editingId === emp.id ? (
                <div className="space-y-2 mt-6" onClick={e => e.stopPropagation()}>
                  <div>
                    <label className="text-[8px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">电话</label>
                    <input 
                      type="tel"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-[#5A5A40]/10 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">工费 (元)</label>
                    <input 
                      type="number"
                      value={editWage}
                      onChange={e => setEditWage(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-[#5A5A40]/10 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">小时/天</label>
                    <input 
                      type="number"
                      value={editHoursPerDay}
                      onChange={e => setEditHoursPerDay(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-[#5A5A40]/10 text-xs mt-0.5"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const updates: Partial<Employee> = {};
                      if (editPhone !== (emp.phone || '')) updates.phone = editPhone;
                      if (editWage && editWage !== (emp.dailyWage?.toString() || '')) updates.dailyWage = parseFloat(editWage);
                      if (editHoursPerDay && editHoursPerDay !== (emp.hoursPerDay?.toString() || '')) updates.hoursPerDay = parseFloat(editHoursPerDay);
                      if (Object.keys(updates).length > 0) onUpdateEmployee(emp.id, updates);
                      setEditingId(null);
                    }}
                    className="w-full bg-[#5A5A40] text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-[#4A4A30] transition-all"
                  >
                    保存修改
                  </button>
                </div>
              ) : (
              <>
              <div className="flex flex-col items-center text-center gap-3 mt-2">
                <label className="relative cursor-pointer group/avatar" onClick={e => e.stopPropagation()}>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setCropImage(ev.target?.result as string);
                        setCropTarget(emp.id);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {emp.avatar ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner relative">
                      <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 transition-all flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-all" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-inner relative">
                      {emp.name[0]}
                      <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 rounded-2xl transition-all flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-all" />
                      </div>
                    </div>
                  )}
                </label>
                <div>
                  <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#5A5A40] transition-colors line-clamp-1">{emp.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Phone className="w-2.5 h-2.5 text-[#5A5A40]/40" />
                    <p className="text-[10px] text-[#5A5A40]/40 font-mono">{emp.phone || '无电话'}</p>
                  </div>
                  {emp.dailyWage && (
                    <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-2 inline-block">
                      ¥{emp.dailyWage}/天                    </p>
                  )}
                  {emp.hoursPerDay && (
                    <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-1 inline-block">
                      {emp.hoursPerDay}小时/天                    </p>
                  )}
                </div>
                <div className="w-full mt-2 pt-2 border-t border-black/5">
                  {(() => {
                    const empWorkDays = workLogs.filter(l => l.employeeId === emp.id).reduce((acc, l) => acc + l.workDayValue, 0);
                    const empAdvances = advances.filter(a => a.employeeId === emp.id).reduce((acc, a) => acc + a.amount, 0);
                    const empBalance = (emp.dailyWage || 0) * empWorkDays - empAdvances;
                    return (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-center">
                          <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">工天</p>
                          <p className="text-[10px] font-serif font-bold text-[#1A1A1A]">{formatWorkDays(empWorkDays)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">借支</p>
                          <p className="text-[10px] font-serif font-bold text-orange-600">¥{empAdvances.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">余额</p>
                          <p className="text-[10px] font-serif font-bold text-emerald-600">¥{empBalance.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-black/5 flex justify-center">
                <div className="w-7 h-7 rounded-full bg-[#5A5A40]/5 flex items-center justify-center text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white transition-all">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
              </>
              )}
            </motion.div>
          ))
        )}
      </div>
      {cropImage && (
        <AvatarCropper
          imageSrc={cropImage}
          onCrop={(result) => {
            if (cropTarget === 'newEmp') {
              setNewAvatar(result);
            } else if (cropTarget) {
              onUpdateAvatar(cropTarget, result);
            }
            setCropImage(null);
            setCropTarget(null);
          }}
          onCancel={() => { setCropImage(null); setCropTarget(null); }}
        />
      )}
    </motion.div>
  );
}

export default EmployeeList;
