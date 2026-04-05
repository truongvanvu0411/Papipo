import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { User, ShieldAlert, ArrowLeft, Globe } from 'lucide-react';

export function Auth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, language, setLanguage } = useStore();
  const [loginType, setLoginType] = useState<'select' | 'user' | 'admin'>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleGuestLogin = () => {
    login(true);
    navigate('/onboarding');
  };

  const verifyAdminAndNavigate = async (uid: string, userEmail: string | null) => {
    const docSnap = await getDoc(doc(db, 'users', uid));
    let role = 'user';
    if (docSnap.exists()) {
      role = docSnap.data().role || 'user';
    } else if (userEmail === 'vu24107@gmail.com') {
      role = 'admin';
    }

    if (loginType === 'admin' && role !== 'admin') {
      setError('Access denied. You do not have admin privileges.');
      await signOut(auth);
      return;
    }

    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/onboarding');
    }
  };

  const handleEmailAuth = async () => {
    setError('');
    try {
      let userCred;
      if (isSignUp && loginType === 'user') {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      }
      await verifyAdminAndNavigate(userCred.user.uid, userCred.user.email);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      await verifyAdminAndNavigate(userCred.user.uid, userCred.user.email);
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    }
  };

  const renderSelection = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4">
      <ClayButton variant="primary" className="w-full py-8 text-lg flex items-center justify-center gap-3" onClick={() => setLoginType('user')}>
        <User className="w-6 h-6" /> User Portal
      </ClayButton>
      <ClayButton variant="secondary" className="w-full py-8 text-lg flex items-center justify-center gap-3 bg-red-50 text-red-700 border-red-200 hover:bg-red-100" onClick={() => setLoginType('admin')}>
        <ShieldAlert className="w-6 h-6" /> Admin Portal
      </ClayButton>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => { setLoginType('select'); setError(''); }} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
        </button>
        <h2 className="text-xl font-extrabold text-[var(--color-text-main)]">
          {loginType === 'admin' ? 'Admin Login' : 'User Login'}
        </h2>
      </div>

      {error && <div className="text-red-500 text-sm text-center font-bold bg-red-50 p-3 rounded-xl">{error}</div>}
      
      <div className="space-y-4">
        <input
          type="email"
          className="clay-input w-full"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="clay-input w-full"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        {loginType === 'user' && (
          <div className="flex justify-between">
            <button 
              className="text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign up'}
            </button>
            {!isSignUp && (
              <button className="text-sm font-bold text-[var(--color-primary)] hover:underline">
                {t('auth.forgot_password')}
              </button>
            )}
          </div>
        )}
      </div>

      <ClayButton variant="primary" className="w-full" onClick={handleEmailAuth}>
        {loginType === 'user' && isSignUp ? 'Sign Up' : t('auth.login')}
      </ClayButton>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-white/40"></div>
        <span className="flex-shrink-0 mx-4 text-[var(--color-text-muted)] text-sm font-bold">
          {t('auth.or_continue_with')}
        </span>
        <div className="flex-grow border-t border-white/40"></div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ClayButton variant="secondary" className="w-full flex items-center justify-center gap-2 bg-white text-black border-gray-200" onClick={handleGoogleLogin}>
          <span className="font-bold text-lg">G</span> Continue with Google
        </ClayButton>
      </div>

      {loginType === 'user' && (
        <div className="pt-4">
          <ClayButton variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={handleGuestLogin}>
            <User className="w-5 h-5" /> {t('auth.guest_mode')}
          </ClayButton>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 relative">
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full shadow-sm">
        <Globe className="w-4 h-4 text-[var(--color-text-muted)]" />
        <select
          className="bg-transparent font-bold text-sm text-[var(--color-text-main)] outline-none cursor-pointer"
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            i18n.changeLanguage(e.target.value);
          }}
        >
          <option value="en">English</option>
          <option value="vi">Tiếng Việt</option>
          <option value="ja">日本語</option>
        </select>
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-[var(--color-text-main)]">{t('auth.welcome')}</h1>
          <p className="text-[var(--color-text-muted)] font-medium">{t('auth.subtitle')}</p>
        </div>

        <ClayCard className="p-8">
          {loginType === 'select' ? renderSelection() : renderForm()}
        </ClayCard>
      </div>
    </div>
  );
}
