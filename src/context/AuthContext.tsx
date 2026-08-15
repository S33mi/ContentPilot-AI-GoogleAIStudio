import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile, PlanTier, UsageStatus, SavedItem } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  usageStatus: UsageStatus;
  recordGeneration: () => Promise<boolean>;
  updatePlan: (newPlan: PlanTier) => Promise<void>;
  // Cloud Library
  cloudSavedItems: SavedItem[];
  saveCloudItem: (item: SavedItem) => Promise<void>;
  deleteCloudItem: (id: string) => Promise<void>;
  clearAllCloudItems: () => Promise<void>;
  syncLocalToCloud: (localItems: SavedItem[]) => Promise<number>;
  isPaidUser: boolean;
}

const LOCAL_STORAGE_GUEST_KEY = 'contentpilot_guest_usage_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [guestUsage, setGuestUsage] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_GUEST_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [cloudSavedItems, setCloudSavedItems] = useState<SavedItem[]>([]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setCloudSavedItems([]);
        setLoading(false);
        return;
      }

      // Sync or fetch user profile from Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      const todayStr = new Date().toISOString().split('T')[0];
      const currentMonthStr = new Date().toISOString().slice(0, 7);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          plan: 'free',
          bonusGenerations: 3,
          dailyGenerationsCount: 0,
          lastGenerationDate: todayStr,
          monthlyGenerationsCount: 0,
          lastGenerationMonth: currentMonthStr,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      } else {
        const existingData = userSnap.data() as UserProfile;
        // Check if day or month needs resetting
        let needsUpdate = false;
        let updatedDaily = existingData.dailyGenerationsCount;
        let updatedDate = existingData.lastGenerationDate;
        let updatedMonthly = existingData.monthlyGenerationsCount;
        let updatedMonth = existingData.lastGenerationMonth;

        if (existingData.lastGenerationDate !== todayStr) {
          updatedDaily = 0;
          updatedDate = todayStr;
          needsUpdate = true;
        }

        if (existingData.lastGenerationMonth !== currentMonthStr) {
          updatedMonthly = 0;
          updatedMonth = currentMonthStr;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(userRef, {
            dailyGenerationsCount: updatedDaily,
            lastGenerationDate: updatedDate,
            monthlyGenerationsCount: updatedMonthly,
            lastGenerationMonth: updatedMonth,
          });
        }

        setUserProfile({
          ...existingData,
          dailyGenerationsCount: updatedDaily,
          lastGenerationDate: updatedDate,
          monthlyGenerationsCount: updatedMonthly,
          lastGenerationMonth: updatedMonth,
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for user profile updates
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      }
    });
    return () => unsub();
  }, [user]);

  // Real-time listener for Cloud Saved Library if paid user
  const isPaidUser = Boolean(userProfile && (userProfile.plan === 'starter' || userProfile.plan === 'pro' || userProfile.plan === 'unlimited'));

  useEffect(() => {
    if (!user || !isPaidUser) {
      setCloudSavedItems([]);
      return;
    }

    const itemsRef = collection(db, 'users', user.uid, 'savedItems');
    const unsub = onSnapshot(itemsRef, (snapshot) => {
      const items: SavedItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          createdAt: data.createdAt || new Date().toISOString(),
          type: data.type || data.mode || 'social',
          businessName: data.businessName || '',
          title: data.title || '',
          content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
          isCloud: true,
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCloudSavedItems(items);
    });

    return () => unsub();
  }, [user, isPaidUser]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Calculate usage status
  const getUsageStatus = (): UsageStatus => {
    if (!user || !userProfile) {
      // Guest
      const canGen = guestUsage < 1;
      return {
        canGenerate: canGen,
        remainingCount: Math.max(0, 1 - guestUsage),
        remainingText: canGen ? '1 free try remaining' : '0 free tries remaining',
        limitType: 'guest',
        reason: canGen ? undefined : 'You have used your free trial generation. Sign in with Google to get 3 bonus generations!',
      };
    }

    const plan = userProfile.plan;

    if (plan === 'unlimited') {
      return {
        canGenerate: true,
        remainingCount: 'unlimited',
        remainingText: 'Unlimited generations',
        limitType: 'unlimited',
      };
    }

    if (plan === 'free') {
      if (userProfile.bonusGenerations > 0) {
        return {
          canGenerate: true,
          remainingCount: userProfile.bonusGenerations,
          remainingText: `${userProfile.bonusGenerations} Welcome Bonus left`,
          limitType: 'bonus',
        };
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const dailyCount = userProfile.lastGenerationDate === todayStr ? userProfile.dailyGenerationsCount : 0;
      const dailyRemaining = Math.max(0, 2 - dailyCount);
      const canGen = dailyRemaining > 0;

      return {
        canGenerate: canGen,
        remainingCount: dailyRemaining,
        remainingText: `${dailyRemaining}/2 free daily generations left`,
        limitType: 'daily',
        reason: canGen
          ? undefined
          : "You've reached your 2 free daily generations limit for today. Upgrade to Starter, Pro, or Unlimited for higher limits!",
      };
    }

    if (plan === 'starter') {
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      const monthlyCount = userProfile.lastGenerationMonth === currentMonthStr ? userProfile.monthlyGenerationsCount : 0;
      const monthlyRemaining = Math.max(0, 60 - monthlyCount);
      const canGen = monthlyRemaining > 0;

      return {
        canGenerate: canGen,
        remainingCount: monthlyRemaining,
        remainingText: `${monthlyRemaining}/60 monthly generations left`,
        limitType: 'monthly',
        reason: canGen
          ? undefined
          : "You've reached your Starter plan monthly limit (60 generations). Upgrade to Pro or Unlimited!",
      };
    }

    if (plan === 'pro') {
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      const monthlyCount = userProfile.lastGenerationMonth === currentMonthStr ? userProfile.monthlyGenerationsCount : 0;
      const monthlyRemaining = Math.max(0, 200 - monthlyCount);
      const canGen = monthlyRemaining > 0;

      return {
        canGenerate: canGen,
        remainingCount: monthlyRemaining,
        remainingText: `${monthlyRemaining}/200 monthly generations left`,
        limitType: 'monthly',
        reason: canGen
          ? undefined
          : "You've reached your Pro plan monthly limit (200 generations). Upgrade to Unlimited!",
      };
    }

    return {
      canGenerate: true,
      remainingCount: 'unlimited',
      remainingText: 'Active Plan',
      limitType: 'unlimited',
    };
  };

  const usageStatus = getUsageStatus();

  // Record generation count after successful generation
  const recordGeneration = async (): Promise<boolean> => {
    if (!user || !userProfile) {
      const newGuestUsage = guestUsage + 1;
      setGuestUsage(newGuestUsage);
      localStorage.setItem(LOCAL_STORAGE_GUEST_KEY, String(newGuestUsage));
      return true;
    }

    const userRef = doc(db, 'users', user.uid);
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    if (userProfile.plan === 'unlimited') {
      return true;
    }

    if (userProfile.plan === 'free') {
      if (userProfile.bonusGenerations > 0) {
        await updateDoc(userRef, {
          bonusGenerations: Math.max(0, userProfile.bonusGenerations - 1),
        });
        return true;
      } else {
        const newDaily = (userProfile.lastGenerationDate === todayStr ? userProfile.dailyGenerationsCount : 0) + 1;
        await updateDoc(userRef, {
          dailyGenerationsCount: newDaily,
          lastGenerationDate: todayStr,
        });
        return true;
      }
    }

    // Starter or Pro
    const newMonthly = (userProfile.lastGenerationMonth === currentMonthStr ? userProfile.monthlyGenerationsCount : 0) + 1;
    await updateDoc(userRef, {
      monthlyGenerationsCount: newMonthly,
      lastGenerationMonth: currentMonthStr,
    });
    return true;
  };

  // Switch or upgrade plan
  const updatePlan = async (newPlan: PlanTier) => {
    if (!user || !userProfile) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      plan: newPlan,
    });
    setUserProfile((prev) => (prev ? { ...prev, plan: newPlan } : null));
  };

  // Cloud Library Save
  const saveCloudItem = async (item: SavedItem) => {
    if (!user || !isPaidUser) return;
    const itemRef = doc(db, 'users', user.uid, 'savedItems', item.id);
    await setDoc(itemRef, {
      id: item.id,
      createdAt: item.createdAt,
      type: item.type,
      businessName: item.businessName,
      title: item.title,
      content: JSON.stringify(item.content),
    });
  };

  // Cloud Library Delete
  const deleteCloudItem = async (id: string) => {
    if (!user || !isPaidUser) return;
    const itemRef = doc(db, 'users', user.uid, 'savedItems', id);
    await deleteDoc(itemRef);
  };

  // Clear all Cloud items
  const clearAllCloudItems = async () => {
    if (!user || !isPaidUser) return;
    const batch = writeBatch(db);
    cloudSavedItems.forEach((item) => {
      const itemRef = doc(db, 'users', user.uid, 'savedItems', item.id);
      batch.delete(itemRef);
    });
    await batch.commit();
  };

  // Sync local items to cloud
  const syncLocalToCloud = async (localItems: SavedItem[]): Promise<number> => {
    if (!user || !isPaidUser || localItems.length === 0) return 0;
    let count = 0;
    for (const item of localItems) {
      await saveCloudItem(item);
      count++;
    }
    return count;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signOut,
        usageStatus,
        recordGeneration,
        updatePlan,
        cloudSavedItems,
        saveCloudItem,
        deleteCloudItem,
        clearAllCloudItems,
        syncLocalToCloud,
        isPaidUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
