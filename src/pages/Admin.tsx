import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useStore } from '@/store';
import { Navigate, useNavigate } from 'react-router-dom';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { ArrowLeft, Users, ShieldAlert, Trash2 } from 'lucide-react';

export function Admin() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user?.role]);

  const handleDelete = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-6 pb-32 animate-in fade-in duration-500">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <ClayButton variant="icon" className="w-10 h-10 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </ClayButton>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-main)] flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              Admin Panel
            </h1>
            <p className="text-[var(--color-text-muted)] font-bold text-sm">Manage registered users</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 rounded-full border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-bold px-2">
              <Users className="w-4 h-4" />
              <span>Total Users: {users.length}</span>
            </div>
            
            {users.map(u => (
              <ClayCard key={u.id} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg text-[var(--color-text-main)]">{u.name || 'Unnamed User'}</h3>
                    <p className="text-sm font-bold text-[var(--color-text-muted)]">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role || 'user'}
                    </span>
                    {confirmDeleteId === u.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(u.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">Confirm</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(u.id)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Goals</span>
                    <p className="text-xs font-bold text-[var(--color-text-main)]">{u.goals?.join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Plan</span>
                    <p className="text-xs font-bold text-[var(--color-text-main)]">{u.planDuration || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Joined</span>
                    <p className="text-xs font-bold text-[var(--color-text-main)]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </ClayCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
