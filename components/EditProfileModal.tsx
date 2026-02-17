import React, { useState } from 'react';
import { X, Save, Upload, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { Button } from './Button';
import { uploadAvatar } from '../services/api';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  onError?: (message: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave, onError }) => {
  const [name, setName] = useState(user.name);
  const [grade, setGrade] = useState(user.grade || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let finalAvatarUrl = avatarUrl;

    if (avatarFile) {
        try {
            finalAvatarUrl = await uploadAvatar(user.id, avatarFile);
        } catch (e) {
            console.error("Avatar upload failed", e);
            onError?.("Не вдалося завантажити фото");
            setLoading(false);
            return;
        }
    }

    onSave({
      ...user,
      name,
      grade,
      bio,
      avatar: finalAvatarUrl
    });
    setLoading(false);
    onClose();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          setAvatarFile(file);
          setAvatarUrl(URL.createObjectURL(file));
      }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Редагувати профіль</h2>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Avatar — зберігається в Supabase Storage (bucket images/avatars) */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer">
                <img src={avatarUrl} alt="Аватар" className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md" />
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="text-white" size={24} />
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
                </label>
            </div>
            <span className="text-xs text-slate-400 mt-2">Натисни для зміни — зберігається в хмарі</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ім'я та Прізвище</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Роль (незмінна)</label>
                 <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-500">
                     {user.role}
                 </div>
            </div>
            <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Клас</label>
                 <input 
                    type="text" 
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900"
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Про себе (Bio)</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 resize-none"
              placeholder="Напиши щось про себе..."
            />
          </div>

          <div className="pt-4">
             <Button type="submit" isLoading={loading} className="w-full gap-2">
                 <Save size={18} /> Зберегти зміни
             </Button>
          </div>

        </form>
      </div>
    </div>
  );
};