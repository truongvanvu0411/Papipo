/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Layout } from '@/components/layout/Layout';
import { Auth } from '@/pages/Auth';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { AICoach } from '@/pages/AICoach';
import { Workout } from '@/pages/Workout';
import { Nutrition } from '@/pages/Nutrition';
import { Profile } from '@/pages/Profile';
import { Admin } from '@/pages/Admin';

function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode, requireOnboarding?: boolean }) {
  const { isAuthenticated, isOnboarded, user } = useStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (requireOnboarding && !isOnboarded && user?.role !== 'admin') {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const { language, setAuthReady, setAuthenticatedUser, isAuthReady } = useStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthenticatedUser(true, user.isAnonymous);
        if (!user.isAnonymous) {
          try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              useStore.getState().setUser(data as any);
              useStore.getState().completeOnboarding();
            } else if (user.email === 'vu24107@gmail.com') {
              const adminData = {
                email: user.email,
                role: 'admin',
                name: 'Admin',
                createdAt: new Date().toISOString()
              };
              await setDoc(docRef, adminData);
              useStore.getState().setUser(adminData as any);
              useStore.getState().completeOnboarding();
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
      } else {
        // Only set to unauthenticated if not a guest
        if (!useStore.getState().isGuest) {
          setAuthenticatedUser(false);
        }
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setAuthenticatedUser, setAuthReady]);

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={
          useStore.getState().isAuthenticated ? <Onboarding /> : <Navigate to="/auth" replace />
        } />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="workout" element={<Workout />} />
          <Route path="coach" element={<AICoach />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/admin" element={
          <ProtectedRoute requireOnboarding={false}>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

