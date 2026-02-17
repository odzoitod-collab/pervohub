import React, { useState } from 'react';
import { School, User as UserIcon, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';
import { UserRole, ROLE_CONFIRM_CODES } from '../types';
import { Button } from './Button';
import { supabase } from '../services/supabase';

interface AuthScreenProps {
  onLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [confirmCode, setConfirmCode] = useState('');

  const needsCode = !!ROLE_CONFIRM_CODES[role];
  const requiredCode = ROLE_CONFIRM_CODES[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!isLogin && needsCode && confirmCode !== requiredCode) {
      setErrorMsg('Невірний код підтвердження. Перевірте та спробуйте знову.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              grade: role === UserRole.STUDENT ? grade : null
            },
          }
        });
        if (error) throw error;
      }
      onLogin();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Сталася помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#171717] w-full max-w-md rounded-2xl border border-[#efefef] dark:border-[#262626] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0095f6] to-[#00376b] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <div className="absolute top-[-50px] left-[-50px] w-32 h-32 rounded-full bg-white blur-2xl"></div>
             <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 rounded-full bg-white blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl shadow-lg mb-4">
              <School size={32} className="text-[#0095f6]" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Pervoz<span className="text-white/80">Hub</span>
            </h1>
            <p className="text-white/70 text-sm mt-1">Первозванівський ліцей</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#fafafa] mb-6 text-center">
            {isLogin ? 'З поверненням!' : 'Створити акаунт'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4 animate-slide-up">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 text-slate-400 dark:text-[#737373]" size={18} />
                  <input 
                    type="text" 
                    placeholder="Прізвище та Ім'я"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900 dark:text-[#fafafa] placeholder-slate-400 dark:placeholder-[#737373]"
                  />
                </div>
                
                <div className="flex flex-col gap-3">
                    <select 
                      value={role}
                      onChange={e => { setRole(e.target.value as UserRole); setConfirmCode(''); setErrorMsg(null); }}
                      className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-xl py-3 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900 dark:text-[#fafafa]"
                    >
                        <option value={UserRole.STUDENT}>Учень</option>
                        <option value={UserRole.TEACHER}>Вчитель</option>
                        <option value={UserRole.SCHOOL_ADMIN}>Адміністрація закладу</option>
                        <option value={UserRole.PARENT}>Батько</option>
                    </select>
                    {role === UserRole.STUDENT && (
                        <input 
                            type="text" 
                            placeholder="Клас (наприклад 10-А)"
                            required
                            value={grade}
                            onChange={e => setGrade(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-xl py-3 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900 dark:text-[#fafafa] placeholder-slate-400 dark:placeholder-[#737373]"
                        />
                    )}
                    {needsCode && (
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3.5 text-slate-400 dark:text-[#737373]" size={18} />
                            <input 
                                type="password"
                                placeholder={`Код підтвердження для ролі "${role}"`}
                                required
                                value={confirmCode}
                                onChange={e => { setConfirmCode(e.target.value); setErrorMsg(null); }}
                                className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900 dark:text-[#fafafa] placeholder-slate-400 dark:placeholder-[#737373]"
                            />
                        </div>
                    )}
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400 dark:text-[#737373]" size={18} />
              <input 
                type="email" 
                placeholder="Email адреса"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900 dark:text-[#fafafa] placeholder-slate-400 dark:placeholder-[#737373]"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400 dark:text-[#737373]" size={18} />
              <input 
                type="password" 
                placeholder="Пароль"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#262626] border border-slate-200 dark:border-[#404040] rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-900 dark:text-[#fafafa] placeholder-slate-400 dark:placeholder-[#737373]"
              />
            </div>

            {errorMsg && (
              <div className="text-red-500 dark:text-red-400 text-sm text-center font-medium bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">
                {errorMsg}
              </div>
            )}

            <Button 
                type="submit" 
                isLoading={loading}
                className="w-full h-12 text-base shadow-xl shadow-indigo-200 mt-2"
            >
              {isLogin ? 'Увійти' : 'Зареєструватися'} <ArrowRight size={18} className="ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-[#a3a3a3]">
              {isLogin ? 'Ще немає акаунту?' : 'Вже є акаунт?'}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-[#0095f6] font-semibold hover:underline"
              >
                {isLogin ? 'Створити' : 'Увійти'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};