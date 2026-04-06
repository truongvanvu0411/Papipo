import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayCircularProgress, ClayLinearProgress } from '@/components/ui/ClayProgress';
import { ClayButton } from '@/components/ui/ClayButton';
import { Droplets, Moon, Zap, CheckCircle2, Trophy, Sparkles, Sun, Brain, Activity, Info, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InitialCheckInModal } from '@/components/dashboard/InitialCheckInModal';
import { DailyCheckInModal } from '@/components/dashboard/DailyCheckInModal';

export function Dashboard() {
  const { t } = useTranslation();
  const { user, dailyData, toggleHabit, toggleWaterStep, completeAllWater, addCustomWater } = useStore();
  const [showGemAnim, setShowGemAnim] = useState(false);
  const [showInitialCheckIn, setShowInitialCheckIn] = useState(false);
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);

  const waterProgress = (dailyData.waterConsumed / dailyData.waterTarget) * 100;

  const icons: Record<string, React.ElementType> = {
    sun: Sun,
    brain: Brain,
    activity: Activity,
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we need to show check-in modals
    if (!user?.lastCheckInDate) {
      setShowInitialCheckIn(true);
    } else if (user.lastCheckInDate !== today) {
      setShowDailyCheckIn(true);
    }
  }, [user?.lastCheckInDate]);

  useEffect(() => {
    if (dailyData.gems > 0) {
      setShowGemAnim(true);
      const timer = setTimeout(() => setShowGemAnim(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [dailyData.gems]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text-main)]">
            {t('dashboard.greeting', { name: user?.name || 'User' })}
          </h1>
          <p className="text-[var(--color-text-muted)] font-medium">{t('dashboard.ready_prompt')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-12 h-12 rounded-full shadow-clay border-4 border-white flex items-center justify-center bg-[var(--color-bg-base)] text-[var(--color-primary)]">
            <Trophy className="w-6 h-6" />
          </div>
          <motion.div 
            key={dailyData.gems}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            className="bg-yellow-400/20 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-yellow-200"
          >
            <Zap className="w-3 h-3 fill-yellow-500" />
            {dailyData.gems}
          </motion.div>
        </div>
      </div>

      {user?.aiWelcomeMessage && (
        <ClayCard className="p-4 bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20">
          <div className="flex gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-clay-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-main)] text-sm">Message from AI Coach</h3>
              <p className="text-sm text-[var(--color-text-muted)] font-medium mt-1 leading-relaxed">
                "{user.aiWelcomeMessage}"
              </p>
            </div>
          </div>
        </ClayCard>
      )}

      <div className="grid grid-cols-2 gap-6">
        <ClayCard className="p-6 flex flex-col items-center text-center gap-4">
          <ClayCircularProgress value={dailyData.readiness || 0} size={100} strokeWidth={10} colorClass="text-[var(--color-primary)]" />
          <div>
            <p className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-widest">{t('dashboard.readiness')}</p>
            <p className="text-2xl font-black text-[var(--color-text-main)]">{dailyData.readiness || 0}%</p>
          </div>
        </ClayCard>

        <ClayCard className="p-6 flex flex-col items-center text-center gap-4">
          <ClayCircularProgress value={dailyData.sleepScore || 0} size={100} strokeWidth={10} colorClass="text-[var(--color-secondary)]" />
          <div>
            <p className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-widest">{t('dashboard.sleep_score')}</p>
            <p className="text-2xl font-black text-[var(--color-text-main)]">{dailyData.sleepScore || 0}%</p>
          </div>
        </ClayCard>
      </div>

      {dailyData.dailyInsight && (
        <ClayCard className="p-4 bg-blue-50/50 border-blue-100">
          <div className="flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-blue-900 leading-relaxed">
              {dailyData.dailyInsight}
            </p>
          </div>
        </ClayCard>
      )}

      <ClayCard className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl shadow-clay-inset flex items-center justify-center text-blue-500">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-main)]">{t('dashboard.hydration')}</h3>
              <p className="text-xs font-bold text-[var(--color-text-muted)]">{dailyData.waterConsumed.toFixed(1)}L / {dailyData.waterTarget.toFixed(1)}L</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ClayButton variant="secondary" className="text-xs py-2 px-3" onClick={() => {
              const amount = parseFloat(window.prompt('Enter amount in Liters (e.g., 0.3):', '0.3') || '0');
              if (amount > 0) addCustomWater(amount);
            }}>
              <Plus className="w-4 h-4" />
            </ClayButton>
            <ClayButton variant="primary" className="text-xs py-2 px-4" onClick={completeAllWater}>
              Drink All
            </ClayButton>
          </div>
        </div>
        
        <div className="h-4 w-full bg-[var(--color-bg-base)] rounded-full shadow-clay-inset overflow-hidden">
          <motion.div 
            className="h-full bg-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${waterProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {(dailyData.waterSteps || []).map((step) => (
            <div 
              key={step.id}
              onClick={() => toggleWaterStep(step.id)}
              className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                step.completed ? 'bg-blue-100 text-blue-800 shadow-clay-inset' : 'clay-card text-[var(--color-text-muted)]'
              }`}
            >
              <span className="font-bold text-xs">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{step.amount}L</span>
                {step.completed && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
            </div>
          ))}
        </div>
      </ClayCard>

      <div className="space-y-4">
        <h3 className="font-bold text-xl ml-2">{t('dashboard.daily_habits')}</h3>
        <div className="space-y-4">
          {(dailyData.habits || []).map((habit) => {
            const Icon = icons[habit.icon] || Activity;
            return (
              <ClayCard 
                key={habit.id} 
                inset={habit.completed}
                className={`p-4 flex items-center justify-between cursor-pointer transition-all ${habit.completed ? 'opacity-60' : ''}`}
                onClick={() => toggleHabit(habit.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    habit.completed ? 'bg-[var(--color-surface)] shadow-clay text-[var(--color-primary)]' : 'shadow-clay-inset text-[var(--color-text-muted)]'
                  }`}>
                    {habit.completed ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={`font-bold ${habit.completed ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-main)]'}`}>
                    {habit.name}
                  </span>
                </div>
                {habit.completed && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 text-yellow-600 font-bold text-xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    +5 Gems
                  </motion.div>
                )}
              </ClayCard>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showGemAnim && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: -20, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 z-50"
          >
            <Zap className="w-4 h-4 fill-yellow-900" />
            {t('dashboard.gems_earned')}
          </motion.div>
        )}
      </AnimatePresence>

      {showInitialCheckIn && <InitialCheckInModal onClose={() => setShowInitialCheckIn(false)} />}
      {showDailyCheckIn && <DailyCheckInModal onClose={() => setShowDailyCheckIn(false)} />}
    </div>
  );
}
