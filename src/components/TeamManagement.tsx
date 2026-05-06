import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, UserCog, Camera, Trash2 } from 'lucide-react';
import { cn, generateId, formatWorkDays } from '../utils';
import { ImeInput } from './ImeInput';
import { AvatarCropper } from './AvatarCropper';
import type { Team, TeamMember, TeamMode, TeamWorkLog, TeamAdvance } from '../types';

function TeamManagement({ 
  teams, 
  teamWorkLogs, 
  teamAdvances,
  onAdd, 
  onDelete, 
  onUpdateTeam,
  onShowDeleteConfirm,
  onViewDetail 
}: { 
  teams: Team[], 
  teamWorkLogs: TeamWorkLog[],
  teamAdvances: TeamAdvance[],
  onAdd: (name: string, mode: TeamMode, hoursPerDay?: number, dailyWage?: number, avatar?: string, members?: TeamMember[]) => Promise<void> | void,
  onDelete: (id: string) => Promise<void> | void,
  onUpdateTeam: (id: string, updates: Partial<Team>) => Promise<void> | void,
  onShowDeleteConfirm: (id: string) => void,
  onViewDetail: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState<TeamMode>('leader');
  const [newHoursPerDay, setNewHoursPerDay] = useState('8');
  const [newWage, setNewWage] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newMembers, setNewMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [search, setSearch] = useState('');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'newTeam' | string | null>(null);

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const members = newMode === 'employee' ? newMembers : undefined;
    onAdd(newName, newMode, newHoursPerDay ? parseFloat(newHoursPerDay) : undefined, newWage ? parseFloat(newWage) : undefined, newAvatar || undefined, members);
    setNewName('');
    setNewMode('leader');
    setNewHoursPerDay('8');
    setNewWage('');
    setNewAvatar('');
    setNewMembers([]);
    setNewMemberName('');
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-serif font-bold text-[#1A1A1A]">班组管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/40" />
            <input 
              type="text" 
              placeholder="搜索班组..." 
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
                <UserCog className="w-4 h-4 text-[#5A5A40]" />
              </div>
              <h3 className="font-bold text-[#1A1A1A]">添加新班组</h3>
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
                      setCropTarget('newTeam');
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
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">班组名称</label>
                <ImeInput 
                  placeholder="输入班组名称" 
                  value={newName}
                  onChange={setNewName}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">管理模式</label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setNewMode('leader')}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold text-sm transition-all border-2",
                      newMode === 'leader' 
                        ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-lg shadow-[#5A5A40]/20" 
                        : "bg-[#F5F5F0] text-[#5A5A40]/60 border-transparent hover:border-[#5A5A40]/20"
                    )}
                  >
                    <div className="font-bold">组长模式</div>
                    <div className="text-[10px] mt-1 opacity-70">按天记人数</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewMode('employee')}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold text-sm transition-all border-2",
                      newMode === 'employee' 
                        ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-lg shadow-[#5A5A40]/20" 
                        : "bg-[#F5F5F0] text-[#5A5A40]/60 border-transparent hover:border-[#5A5A40]/20"
                    )}
                  >
                    <div className="font-bold">员工模式</div>
                    <div className="text-[10px] mt-1 opacity-70">逐人记工天</div>
                  </button>
                </div>
              </div>
              {newMode === 'employee' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">班组成员</label>
                  <div className="flex gap-2">
                    <ImeInput 
                      placeholder="输入成员姓名" 
                      value={newMemberName}
                      onChange={setNewMemberName}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newMemberName.trim()) {
                          e.preventDefault();
                          setNewMembers([...newMembers, { id: generateId(), name: newMemberName.trim() }]);
                          setNewMemberName('');
                        }
                      }}
                      className="flex-1 bg-[#F5F5F0] rounded-2xl px-5 py-3 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newMemberName.trim()) {
                          setNewMembers([...newMembers, { id: generateId(), name: newMemberName.trim() }]);
                          setNewMemberName('');
                        }
                      }}
                      className="bg-[#5A5A40] text-white px-4 py-3 rounded-2xl text-sm font-bold hover:bg-[#4A4A30] transition-all"
                    >
                      添加
                    </button>
                  </div>
                  {newMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newMembers.map(m => (
                        <span key={m.id} className="bg-[#5A5A40]/10 text-[#5A5A40] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5">
                          {m.name}
                          <button 
                            type="button"
                            onClick={() => setNewMembers(newMembers.filter(nm => nm.id !== m.id))}
                            className="text-[#5A5A40]/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
            <button type="submit" className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all active:scale-[0.98]">
              确认添加
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full bg-white/40 border-2 border-dashed border-[#5A5A40]/10 rounded-[40px] py-20 flex flex-col items-center justify-center text-[#5A5A40]/40">
            <UserCog className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">{search ? '没有找到匹配的班组' : '还没有添加班组，点击右上角加号开始吧'}</p>
          </div>
        ) : (
          filteredTeams.map(team => {
            const teamLogs = teamWorkLogs.filter(l => l.teamId === team.id);
            const teamAdvs = teamAdvances.filter(a => a.teamId === team.id);
            const totalWorkDays = teamLogs.reduce((sum, l) => sum + l.workerCount, 0);
            const totalAdvances = teamAdvs.reduce((sum, a) => sum + a.amount, 0);
            const balance = (team.dailyWage || 0) * totalWorkDays - totalAdvances;
            return (
              <motion.div 
                layout
                key={team.id} 
                className="bg-white rounded-[32px] p-4 border border-black/5 flex flex-col group hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer relative"
                onClick={() => onViewDetail(team.id)}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDeleteConfirm(team.id);
                  }}
                  className="absolute top-3 right-3 p-2 text-red-500/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
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
                          setCropTarget(team.id);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {team.avatar ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner relative">
                        <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 transition-all flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-all" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-inner relative">
                        {team.name[0]}
                        <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 rounded-2xl transition-all flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-all" />
                        </div>
                      </div>
                    )}
                  </label>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#5A5A40] transition-colors line-clamp-1">{team.name}</h3>
                    <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-2 inline-block">
                      {team.mode === 'leader' ? '组长模式' : '员工模式'}
                    </p>
                    {team.dailyWage && (
                      <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-1 inline-block">
                        ¥{team.dailyWage}/天                      </p>
                    )}
                    {team.hoursPerDay && (
                      <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-1 inline-block">
                        {team.hoursPerDay}小时/天                      </p>
                    )}
                  </div>
                </div>
                
                <div className="w-full mt-2 pt-2 border-t border-black/5">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-center">
                      <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">工天</p>
                      <p className="text-[10px] font-serif font-bold text-[#1A1A1A]">{formatWorkDays(totalWorkDays)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">借支</p>
                      <p className="text-[10px] font-serif font-bold text-orange-600">¥{totalAdvances.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">余额</p>
                      <p className="text-[10px] font-serif font-bold text-emerald-600">¥{balance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      {cropImage && (
        <AvatarCropper
          imageSrc={cropImage}
          onCrop={(result) => {
            if (cropTarget === 'newTeam') {
              setNewAvatar(result);
            } else if (cropTarget) {
              onUpdateTeam(cropTarget, { avatar: result });
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

export default TeamManagement;
