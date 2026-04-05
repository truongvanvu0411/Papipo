import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { auth, signOut } from '@/firebase';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { Settings, User, Activity, Target, LogOut, Globe, Ruler, Weight, Calendar, ChevronRight, Trophy, Zap, Droplets, Scale, Info, X } from 'lucide-react';

export function Profile() {
  const { t, i18n } = useTranslation();
  const { user, logout, language, setLanguage, setUser, dailyData } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showRewardsHelp, setShowRewardsHelp] = useState(false);

  const handleLanguageChange = () => {
    const langs = ['ja', 'vi', 'en'];
    const nextLang = langs[(langs.indexOf(language) + 1) % langs.length];
    setLanguage(nextLang);
    i18n.changeLanguage(nextLang);
  };

  const updateMetric = (key: string, value: any) => {
    setUser({ [key]: value });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">{t('profile.title')}</h1>
        </div>
        <ClayButton variant="icon" className="rounded-full" onClick={() => setIsEditing(!isEditing)}>
          <Settings className={`w-5 h-5 transition-transform ${isEditing ? 'rotate-90' : ''}`} />
        </ClayButton>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full shadow-clay border-4 border-[var(--color-surface)] flex items-center justify-center bg-[var(--color-bg-base)] mb-4">
            <User className="w-10 h-10 text-[var(--color-text-muted)]" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[var(--color-primary)] text-white p-2 rounded-full shadow-lg">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold">{user?.name || 'User'}</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="bg-yellow-400/20 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 fill-yellow-600" />
            {dailyData.gems} {t('profile.gems')}
          </div>
          <span className="text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-xs">{t('profile.premium_member')}</span>
        </div>
      </div>

      {/* Rewards & Badges */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 ml-2">
          <h3 className="font-bold text-lg">{t('profile.rewards')}</h3>
          <button onClick={() => setShowRewardsHelp(true)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-center gap-4 overflow-x-auto pb-2 px-2 no-scrollbar">
          {(dailyData.badges || []).map((badge) => (
            <div key={badge.id} className={`flex-shrink-0 w-20 flex flex-col items-center gap-2 opacity-${badge.unlocked ? '100' : '30'}`}>
              <div className={`w-16 h-16 rounded-full shadow-clay flex items-center justify-center ${badge.unlocked ? 'bg-white' : 'bg-gray-200'}`}>
                {badge.id === 'water-warrior' && <Droplets className="w-8 h-8 text-blue-500" />}
                {badge.id === 'consistency-king' && <Zap className="w-8 h-8 text-yellow-500" />}
                {badge.id === 'balance-master' && <Scale className="w-8 h-8 text-green-500" />}
              </div>
              <span className="text-[10px] font-bold text-center leading-tight">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body Metrics */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg ml-2">{t('profile.personal_info')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <ClayCard className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Ruler className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{t('profile.height')}</span>
            </div>
            {isEditing ? (
              <input 
                type="number" 
                className="w-full bg-transparent font-bold text-lg outline-none border-b-2 border-[var(--color-primary)]"
                value={user?.height || 0}
                onChange={(e) => updateMetric('height', parseInt(e.target.value))}
              />
            ) : (
              <p className="text-xl font-extrabold">{user?.height || '--'} <span className="text-sm font-bold text-[var(--color-text-muted)]">cm</span></p>
            )}
          </ClayCard>
          <ClayCard className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Weight className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{t('profile.weight')}</span>
            </div>
            {isEditing ? (
              <input 
                type="number" 
                className="w-full bg-transparent font-bold text-lg outline-none border-b-2 border-[var(--color-primary)]"
                value={user?.weight || 0}
                onChange={(e) => updateMetric('weight', parseInt(e.target.value))}
              />
            ) : (
              <p className="text-xl font-extrabold">{user?.weight || '--'} <span className="text-sm font-bold text-[var(--color-text-muted)]">kg</span></p>
            )}
          </ClayCard>
          <ClayCard className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{t('profile.age')}</span>
            </div>
            {isEditing ? (
              <input 
                type="number" 
                className="w-full bg-transparent font-bold text-lg outline-none border-b-2 border-[var(--color-primary)]"
                value={user?.age || 0}
                onChange={(e) => updateMetric('age', parseInt(e.target.value))}
              />
            ) : (
              <p className="text-xl font-extrabold">{user?.age || '--'}</p>
            )}
          </ClayCard>
          <ClayCard className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <User className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{t('profile.gender')}</span>
            </div>
            {isEditing ? (
              <select 
                className="w-full bg-transparent font-bold text-lg outline-none border-b-2 border-[var(--color-primary)]"
                value={user?.gender || 'male'}
                onChange={(e) => updateMetric('gender', e.target.value)}
              >
                <option value="male">{t('profile.male')}</option>
                <option value="female">{t('profile.female')}</option>
                <option value="other">{t('profile.other')}</option>
              </select>
            ) : (
              <p className="text-xl font-extrabold capitalize">{t(`profile.${user?.gender || 'male'}`)}</p>
            )}
          </ClayCard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg ml-2">{t('profile.settings')}</h3>
        <ClayCard className="p-2">
          <div onClick={handleLanguageChange} className="flex items-center gap-4 p-4 border-b border-white/20 last:border-0 cursor-pointer hover:bg-white/10 rounded-2xl transition-colors">
            <div className="w-10 h-10 rounded-full shadow-clay-inset flex items-center justify-center text-[var(--color-text-muted)]">
              <Globe className="w-5 h-5" />
            </div>
            <span className="font-bold flex-1">{t('profile.language')}</span>
            <span className="font-bold text-[var(--color-primary)] uppercase">{language}</span>
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
          </div>
          <div className="flex items-center gap-4 p-4 border-b border-white/20 last:border-0 cursor-pointer hover:bg-white/10 rounded-2xl transition-colors">
            <div className="w-10 h-10 rounded-full shadow-clay-inset flex items-center justify-center text-[var(--color-text-muted)]">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-bold flex-1">{t('profile.workout_prefs')}</span>
            <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
          </div>
        </ClayCard>
      </div>

      <ClayButton variant="secondary" className="w-full flex items-center justify-center gap-2 text-white" onClick={handleLogout}>
        <LogOut className="w-5 h-5" /> {t('profile.sign_out')}
      </ClayButton>

      {/* Rewards Help Modal */}
      {showRewardsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <ClayCard className="w-full max-w-sm p-6 space-y-4 relative">
            <button 
              onClick={() => setShowRewardsHelp(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full shadow-clay-inset flex items-center justify-center text-[var(--color-text-muted)]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-extrabold text-center pr-8">About Rewards</h3>
            <div className="space-y-4 text-sm font-medium text-[var(--color-text-main)]">
              <p>
                <strong>Gems (<Zap className="w-3 h-3 inline fill-yellow-600 text-yellow-600" />):</strong> Earn gems by completing daily habits, logging meals, and finishing workouts. Use gems to unlock premium features and AI insights!
              </p>
              <p>
                <strong>Badges:</strong>
              </p>
              <ul className="space-y-2 pl-2">
                <li className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white shadow-clay flex items-center justify-center shrink-0"><Droplets className="w-4 h-4 text-blue-500" /></div>
                  <span><strong>Water Warrior:</strong> Hit your daily water target 7 days in a row.</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white shadow-clay flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-yellow-500" /></div>
                  <span><strong>Consistency King:</strong> Complete all daily habits for a full week.</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white shadow-clay flex items-center justify-center shrink-0"><Scale className="w-4 h-4 text-green-500" /></div>
                  <span><strong>Balance Master:</strong> Hit your exact macro targets (Protein, Carbs, Fat) in a single day.</span>
                </li>
              </ul>
            </div>
            <ClayButton variant="primary" className="w-full mt-4" onClick={() => setShowRewardsHelp(false)}>
              Got it!
            </ClayButton>
          </ClayCard>
        </div>
      )}
    </div>
  );
}
