/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut, signInWithPopup } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from '../firebase';
import { UserProfile, Guardian, EmergencyContact, AlertLog, Journey, UserSetting, NotificationItem } from '../types';

interface AppContextType {
  user: User | null;
  profile: UserProfile | null;
  guardians: Guardian[];
  contacts: EmergencyContact[];
  alerts: AlertLog[];
  journeys: Journey[];
  notifications: NotificationItem[];
  settings: UserSetting;
  loading: boolean;
  needsOnboarding: boolean;
  isOffline: boolean;
  batteryStatus: number;
  networkType: string;
  activeSOS: AlertLog | null;
  activeJourney: Journey | null;
  fakeCallActive: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<void>;
  triggerSOS: (type: string) => Promise<void>;
  resolveSOS: (alertId: string) => Promise<void>;
  addGuardian: (guardian: Omit<Guardian, 'id' | 'createdAt'>) => Promise<void>;
  updateGuardian: (id: string, guardian: Partial<Guardian>) => Promise<void>;
  deleteGuardian: (id: string) => Promise<void>;
  addContact: (contact: Omit<EmergencyContact, 'id' | 'createdAt'>) => Promise<void>;
  updateContact: (id: string, contact: Partial<EmergencyContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSetting>) => Promise<void>;
  addNotification: (title: string, body: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  startJourney: (destinationName: string, eta: string, startLocation: { lat: number; lng: number }) => Promise<void>;
  stopJourney: (journeyId: string, success: boolean) => Promise<void>;
  setFakeCallActive: (active: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<UserSetting>({
    theme: 'light',
    audioTriggerEnabled: false,
    shakeTriggerEnabled: false,
    pushNotificationsEnabled: true,
    emergencySOSCountdown: 5,
  });

  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [batteryStatus, setBatteryStatus] = useState(88);
  const [networkType, setNetworkType] = useState('4G LTE');
  const [activeSOS, setActiveSOS] = useState<AlertLog | null>(null);
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [fakeCallActive, setFakeCallActive] = useState(false);

  // Connection tracking
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setNetworkType('4G LTE');
      addNotification('Connection Restored', 'You are back online. Safety triggers are live.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      setNetworkType('Offline Mode');
      addNotification('Offline Safety Mode', 'Internet disconnected. Local offline safety metrics activated.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery API simulation or hook
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryStatus(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryStatus(Math.round(battery.level * 100));
        });
      });
    } else {
      // Simulate slow battery changes in application life
      const interval = setInterval(() => {
        setBatteryStatus(prev => (prev > 15 ? prev - 1 : 85));
      }, 300000);
      return () => clearInterval(interval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch User Profile
        const profilePath = `users/${currentUser.uid}`;
        try {
          const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (profileDoc.exists()) {
            setProfile({ uid: currentUser.uid, ...profileDoc.data() } as UserProfile);
            setNeedsOnboarding(false);
          } else {
            setProfile(null);
            setNeedsOnboarding(true);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setNeedsOnboarding(true); // Default to on-boarding
        }
      } else {
        setProfile(null);
        setGuardians([]);
        setContacts([]);
        setAlerts([]);
        setJourneys([]);
        setNotifications([]);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Realtime Sync
  useEffect(() => {
    if (!user || needsOnboarding) return;

    const userRef = doc(db, 'users', user.uid);

    // Sync profile live updates
    const unsubProfile = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile({ uid: user.uid, ...snapshot.data() } as UserProfile);
      }
    }, (error) => {
      console.error('Error in profile snap listener:', error);
    });

    // 1. Guardians subcollection
    const guardiansCol = collection(db, 'users', user.uid, 'guardians');
    const unsubGuardians = onSnapshot(guardiansCol, (snapshot) => {
      const list: Guardian[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Guardian);
      });
      setGuardians(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/guardians`);
    });

    // 2. Emergency Contacts subcollection
    const contactsCol = collection(db, 'users', user.uid, 'emergencyContacts');
    const unsubContacts = onSnapshot(contactsCol, (snapshot) => {
      const list: EmergencyContact[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as EmergencyContact);
      });
      setContacts(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/emergencyContacts`);
    });

    // 3. Alerts (recent ones)
    const alertsCol = collection(db, 'users', user.uid, 'alerts');
    const qAlerts = query(alertsCol, orderBy('timestamp', 'desc'));
    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      const list: AlertLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AlertLog);
      });
      setAlerts(list);
      // Determine if there is an active SOS
      const active = list.find(a => a.status === 'active');
      setActiveSOS(active || null);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/alerts`);
    });

    // 4. Journeys (recent)
    const journeysCol = collection(db, 'users', user.uid, 'journeys');
    const qJourneys = query(journeysCol, orderBy('createdAt', 'desc'));
    const unsubJourneys = onSnapshot(qJourneys, (snapshot) => {
      const list: Journey[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Journey);
      });
      setJourneys(list);
      const activeJ = list.find(j => j.status === 'active');
      setActiveJourney(activeJ || null);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/journeys`);
    });

    // 5. Notifications
    const notificationsCol = collection(db, 'users', user.uid, 'notifications');
    const qNotifs = query(notificationsCol, orderBy('timestamp', 'desc'));
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      const list: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
      });
      setNotifications(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/notifications`);
    });

    // 6. Settings (stored in local single settings doc or subcollection)
    const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
    const unsubSettings = onSnapshot(settingsDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as UserSetting);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/settings/userSettings`);
    });

    return () => {
      unsubProfile();
      unsubGuardians();
      unsubContacts();
      unsubAlerts();
      unsubJourneys();
      unsubNotifs();
      unsubSettings();
    };
  }, [user, needsOnboarding]);

  // Auth Functions
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google Popup:', error);
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      setLoading(false);
    }
  };

  // Complete Onboarding on first authentication
  const completeOnboarding = async (data: Omit<UserProfile, 'uid' | 'createdAt'>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const payload = {
        ...data,
        createdAt: new Date().toISOString(),
        currentStatus: 'Safe',
        batteryStatus,
        networkStatus: networkType,
        lastLocation: { lat: 19.076, lng: 72.8777 } // default elegant default location (Mumbai coordinates as placeholder)
      };
      await setDoc(doc(db, 'users', user.uid), payload);
      setProfile({ uid: user.uid, ...payload } as UserProfile);
      setNeedsOnboarding(false);

      // Seed initial dummy setting
      await setDoc(doc(db, 'users', user.uid, 'settings', 'userSettings'), {
        theme: 'light',
        audioTriggerEnabled: false,
        shakeTriggerEnabled: false,
        pushNotificationsEnabled: true,
        emergencySOSCountdown: 5,
      });

      // Send initial welcome notification
      await addNotification('Safety Engine Ready', 'NIDAR Safety setup complete. Your guardians will be alerted on any warning trigger.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), { ...data, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // SOS Operations
  const triggerSOS = async (type: string) => {
    if (!user) return;
    const path = `users/${user.uid}/alerts`;
    try {
      const alertPayload = {
        type,
        status: 'active',
        timestamp: new Date().toISOString(),
        location: profile?.lastLocation || { lat: 19.076, lng: 72.8777, address: 'Current Device Location' },
        battery: batteryStatus,
        network: networkType,
      };

      // 1. Add Alert in Firestore
      await addDoc(collection(db, 'users', user.uid, 'alerts'), alertPayload);

      // 2. Update user status
      await updateDoc(doc(db, 'users', user.uid), { currentStatus: 'SOS Emergency Triggered' });

      // 3. Create push notifications mimicking SMS or push alerts dispatch
      await addNotification('ALERT: Emergency Dispatch Initiated', `An SOS emergency has been triggered. Notifications have been dispatched mapping to Priority Guardians.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const resolveSOS = async (alertId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/alerts/${alertId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'alerts', alertId), { status: 'resolved' });
      await updateDoc(doc(db, 'users', user.uid), { currentStatus: 'Safe' });
      await addNotification('SOS Threat Resolved', 'Your SOS emergency status has been marked resolved. Your connection is back to safe state.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Guardian Management
  const addGuardian = async (guardian: Omit<Guardian, 'id' | 'createdAt'>) => {
    if (!user) return;
    const path = `users/${user.uid}/guardians`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'guardians'), {
        ...guardian,
        createdAt: new Date().toISOString(),
      });
      await addNotification('Guardian Added', `${guardian.name} is now your secondary protective dynamic contact.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateGuardian = async (id: string, guardian: Partial<Guardian>) => {
    if (!user) return;
    const path = `users/${user.uid}/guardians/${id}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'guardians', id), guardian);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteGuardian = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/guardians/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'guardians', id));
      await addNotification('Guardian Removed', 'A trusted safety contact was deleted from your alerts list.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Emergency Contacts
  const addContact = async (contact: Omit<EmergencyContact, 'id' | 'createdAt'>) => {
    if (!user) return;
    const path = `users/${user.uid}/emergencyContacts`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'emergencyContacts'), {
        ...contact,
        createdAt: new Date().toISOString(),
      });
      await addNotification('Safety Contact Registered', `Quick dialing registered support profile for ${contact.name}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateContact = async (id: string, contact: Partial<EmergencyContact>) => {
    if (!user) return;
    const path = `users/${user.uid}/emergencyContacts/${id}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'emergencyContacts', id), contact);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/emergencyContacts/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'emergencyContacts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Settings
  const updateSettings = async (newSettings: Partial<UserSetting>) => {
    if (!user) return;
    const path = `users/${user.uid}/settings/userSettings`;
    try {
      const updated = { ...settings, ...newSettings };
      await setDoc(doc(db, 'users', user.uid, 'settings', 'userSettings'), updated);
      setSettings(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Notifications
  const addNotification = async (title: string, body: string) => {
    if (!user) return;
    const path = `users/${user.uid}/notifications`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'notifications'), {
        title,
        body,
        timestamp: new Date().toISOString(),
        status: 'unread',
      });
    } catch (error) {
      console.error('Error adding local notification:', error);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/notifications/${id}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { status: 'read' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;
    // For safety prototype simulator, we can empty them locally or delete documents. Let's just track this elegantly.
    addNotification('Alert Cleanup', 'Notification inbox cleared.');
  };

  // Journey Monitoring Operations
  const startJourney = async (destinationName: string, eta: string, startLocation: { lat: number; lng: number }) => {
    if (!user) return;
    const path = `users/${user.uid}/journeys`;
    try {
      const journeyPayload = {
        destinationName,
        eta,
        startLocation,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'users', user.uid, 'journeys'), journeyPayload);
      await addNotification('Journey Initiated', `Now tracking path safety status to ${destinationName}. Safe guardian ping timer activated.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const stopJourney = async (journeyId: string, success: boolean) => {
    if (!user) return;
    const path = `users/${user.uid}/journeys/${journeyId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'journeys', journeyId), {
        status: success ? 'completed' : 'alert',
      });
      const alertMsg = success
        ? 'Journey completed successfully, tracking stopped.'
        : 'Journey warning flagged! Notification dispatched.';
      await addNotification(success ? 'Journey Safe End' : 'JOURNEY WARNING FLAGS', alertMsg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        guardians,
        contacts,
        alerts,
        journeys,
        notifications,
        settings,
        loading,
        needsOnboarding,
        isOffline,
        batteryStatus,
        networkType,
        activeSOS,
        activeJourney,
        fakeCallActive,
        signInWithGoogle,
        logOut,
        updateProfileData,
        completeOnboarding,
        triggerSOS,
        resolveSOS,
        addGuardian,
        updateGuardian,
        deleteGuardian,
        addContact,
        updateContact,
        deleteContact,
        updateSettings,
        addNotification,
        markNotificationRead,
        clearNotifications,
        startJourney,
        stopJourney,
        setFakeCallActive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used inside an AppProvider context hierarchy.');
  }
  return context;
};
