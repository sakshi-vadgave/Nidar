/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Tv,
  Shield,
  Award,
  CheckCircle2,
  Bookmark,
  PhoneCall,
  Video,
  UserCheck,
  Compass,
  Trash2,
  Plus,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Heart,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  BookMarked,
  Layers,
  HelpCircle
} from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

// Types for Fearless
interface FearlessVideo {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  createdAt?: string;
  isCustom?: boolean;
}

interface FearlessState {
  points: number;
  completedChallenges: string[];
  readArticles: string[];
  watchedVideos: string[];
  badges: string[];
}

export default function Fearless() {
  const { profile, guardians, contacts, settings, addNotification } = useApp();
  const userId = auth.currentUser?.uid || 'guest_user';

  // State
  const [activeSection, setActiveSection] = useState<'all' | 'motivation' | 'tips' | 'rights' | 'selfdefense' | 'learn' | 'challenges'>('all');
  const [fearlessState, setFearlessState] = useState<FearlessState>({
    points: 100, // Initialize with starter points
    completedChallenges: [],
    readArticles: [],
    watchedVideos: [],
    badges: ['Knowledge Seeker']
  });

  const [videos, setVideos] = useState<FearlessVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // Video Form State
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoCategory, setNewVideoCategory] = useState('Self Defense');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoError, setNewVideoError] = useState('');

  // Article Modal State
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  // Active sub-tab inside Learn Center
  const [learnTab, setLearnTab] = useState<'videos' | 'articles' | 'tips' | 'resources'>('videos');
  // Video filter category
  const [videoCategoryFilter, setVideoCategoryFilter] = useState<string>('All');

  // Curated list of Quotes
  const [quoteIndex, setQuoteIndex] = useState(0);
  const quotes = [
    { text: "The question isn't who is going to let me; it's who is going to stop me.", author: "Ayn Rand", focus: "Courage" },
    { text: "Do not compromise yourself. You are all you have got. Trust your raw instincts; they are your inner shield.", author: "Safety Awareness", focus: "Confidence" },
    { text: "Courage startles because it represents a defiance of fear. We are strongest when we are prepared, informed, and united.", author: "Sisterhood Core", focus: "Courage" },
    { text: "Confidence is not 'will they like me?'. Confidence is 'I will be perfectly fine if they do not.' You are your own best guardian.", author: "Empowered Mind", focus: "Self-Belief" },
    { text: "Leadership is about making others better as a result of your presence and ensuring that impact lasts in your absence.", author: "Sheryl Sandberg", focus: "Leadership" },
    { text: "A fearless mind coupled with active situational awareness is the ultimate armor. Confidence is muscle memory.", author: "Self Protection", focus: "Independence" },
    { text: "Never apologize for being a powerful, self-reliant woman. Your safety habits are your assets, never your limitations.", author: "Modern Rights", focus: "Independence" }
  ];

  // Helper to extract YouTube Video ID for clean embeds
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      let videoId = '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url; // fallback
    } catch {
      return url;
    }
  };

  // Seed default videos
  const DEFAULT_VIDEOS: FearlessVideo[] = [
    {
      id: 'vid_1',
      title: '5 Crucial Self-Defense Strikes for Women',
      category: 'Self Defense',
      description: 'Master powerful and intuitive escape strikes including palm strikes, heel kicks, and hammer fists.',
      url: 'https://www.youtube.com/embed/k9Jn0OAbF6M'
    },
    {
      id: 'vid_2',
      title: 'Building Unshakable Situational Awareness',
      category: 'Women\'s Safety Awareness',
      description: 'An essential guide to public safety, environmental assessment, and learning to read baseline threats.',
      url: 'https://www.youtube.com/embed/A8g2_Z7gXfE'
    },
    {
      id: 'vid_3',
      title: 'Digital Privacy Shield & Thwarting Cyber Harassment',
      category: 'Cyber Safety',
      description: 'Actionable techniques to safeguard photos, freeze third-party track logs, and handle digital violations.',
      url: 'https://www.youtube.com/embed/G1N4pD67g_w'
    },
    {
      id: 'vid_4',
      title: 'Confidence Stance and Nonverbal Communication',
      category: 'Confidence Building',
      description: 'Learn how to use body language, vocal commands, and posture to project dominance and deter harassment.',
      url: 'https://www.youtube.com/embed/A1o3_7VnyK0'
    }
  ];

  // Load Fearless data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId === 'guest_user') {
          // Setup defaults for guest sessions
          setVideos(DEFAULT_VIDEOS);
          setLoading(false);
          return;
        }

        // 1. Get Fearless state
        const stateDocRef = doc(db, 'users', userId, 'fearless_state', 'main');
        const stateSnap = await getDoc(stateDocRef);
        
        let currentState: FearlessState = {
          points: 100,
          completedChallenges: [],
          readArticles: [],
          watchedVideos: [],
          badges: ['Knowledge Seeker']
        };

        if (stateSnap.exists()) {
          const loadedData = stateSnap.data() as Partial<FearlessState>;
          currentState = {
            points: typeof loadedData.points === 'number' ? loadedData.points : 100,
            completedChallenges: Array.isArray(loadedData.completedChallenges) ? loadedData.completedChallenges : [],
            readArticles: Array.isArray(loadedData.readArticles) ? loadedData.readArticles : [],
            watchedVideos: Array.isArray(loadedData.watchedVideos) ? loadedData.watchedVideos : [],
            badges: Array.isArray(loadedData.badges) ? loadedData.badges : ['Knowledge Seeker']
          };
          
          // Self-heal any legacy missing fields in firestore
          if (
            typeof loadedData.points !== 'number' || 
            !Array.isArray(loadedData.completedChallenges) ||
            !Array.isArray(loadedData.readArticles) ||
            !Array.isArray(loadedData.watchedVideos) ||
            !Array.isArray(loadedData.badges)
          ) {
            await setDoc(stateDocRef, currentState);
          }
        } else {
          // Initialize in firestore
          await setDoc(stateDocRef, currentState);
        }
        setFearlessState(currentState);

        // 2. Get Custom/Added Videos
        const videosCol = collection(db, 'users', userId, 'fearless_videos');
        const videosSnap = await getDocs(videosCol);
        
        let loadedVideos: FearlessVideo[] = [];
        videosSnap.forEach((doc) => {
          loadedVideos.push({
            id: doc.id,
            ...doc.data()
          } as FearlessVideo);
        });

        // Merge standard seed and user custom videos
        const merged = [...loadedVideos, ...DEFAULT_VIDEOS.map(v => ({ ...v, isCustom: false }))];
        // Ensure no duplicates by ID
        const uniqueVideos = Array.from(new Map(merged.map(item => [item.id, item])).values());
        setVideos(uniqueVideos);
        setLoading(false);
      } catch (err) {
        console.error('Error loading fearless resources:', err);
        setVideos(DEFAULT_VIDEOS);
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Dynamic computed states to handle real-time stats
  const isGuardianComplete = guardians.length > 0;
  const isProfileComplete = !!(profile?.fullName && profile?.phoneNumber);
  const isSettingsComplete = !!(settings?.shakeTriggerEnabled || settings?.audioTriggerEnabled);
  const isReadArticlesComplete = (fearlessState.readArticles || []).length > 0;
  const isWatchVideoComplete = (fearlessState.watchedVideos || []).length > 0;
  const isEmergencyNoComplete = (fearlessState.completedChallenges || []).includes('chal_emergency_no');

  const activeCompletedIds = [
    ...(isGuardianComplete ? ['chal_guardian'] : []),
    ...(isProfileComplete ? ['chal_profile'] : []),
    ...(isSettingsComplete ? ['chal_settings'] : []),
    ...(isEmergencyNoComplete ? ['chal_emergency_no'] : []),
    ...(isReadArticlesComplete ? ['chal_read_article'] : []),
    ...(isWatchVideoComplete ? ['chal_watch_video'] : [])
  ];

  // Point calculations
  const pointsFromArticles = (fearlessState.readArticles || []).length * 15;
  const pointsFromVideos = (fearlessState.watchedVideos || []).length * 15;
  const pointsFromCustomVideos = (videos || []).filter(v => v.isCustom).length * 20;

  const computedPoints = 100 
    + (isGuardianComplete ? 30 : 0) 
    + (isProfileComplete ? 30 : 0) 
    + (isSettingsComplete ? 20 : 0) 
    + (isEmergencyNoComplete ? 10 : 0)
    + pointsFromArticles 
    + pointsFromVideos 
    + pointsFromCustomVideos;

  // Sync state changes with Firestore
  const saveFearlessState = async (updatedState: FearlessState) => {
    setFearlessState(updatedState);
    if (userId === 'guest_user') return;
    try {
      const stateDocRef = doc(db, 'users', userId, 'fearless_state', 'main');
      await setDoc(stateDocRef, updatedState);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/fearless_state/main`);
    }
  };

  // Real-time synchronization of points, completed challenges, and badges to Firestore
  useEffect(() => {
    if (loading) return;

    const currentChallengesSorted = [...(fearlessState.completedChallenges || [])].sort();
    const activeCompletedSorted = [...activeCompletedIds].sort();

    const needsSync = 
      fearlessState.points !== computedPoints ||
      JSON.stringify(currentChallengesSorted) !== JSON.stringify(activeCompletedSorted);

    if (needsSync) {
      const updatedState = {
        ...fearlessState,
        points: computedPoints,
        completedChallenges: activeCompletedIds
      };
      saveFearlessState(updatedState);
    }
  }, [
    loading,
    userId,
    isGuardianComplete,
    isProfileComplete,
    isSettingsComplete,
    isEmergencyNoComplete,
    isReadArticlesComplete,
    isWatchVideoComplete,
    computedPoints,
    activeCompletedIds.join(',')
  ]);

  // Periodic Quote Rotator
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 15000); // changes every 15 seconds
    return () => clearInterval(timer);
  }, []);

  const rotateQuoteManually = () => {
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  // Add a Custom YouTube Video Link
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewVideoError('');

    if (!newVideoTitle.trim()) {
      setNewVideoError('Title is required');
      return;
    }
    if (!newVideoUrl.trim()) {
      setNewVideoError('YouTube URL is required');
      return;
    }

    const embedUrl = getYouTubeEmbedUrl(newVideoUrl);

    const videoId = `custom_vid_${Date.now()}`;
    const payload: FearlessVideo = {
      id: videoId,
      title: newVideoTitle,
      category: newVideoCategory,
      description: newVideoDesc || 'Custom shared support materials.',
      url: embedUrl,
      isCustom: true
    };

    try {
      if (userId !== 'guest_user') {
        const docRef = doc(db, 'users', userId, 'fearless_videos', videoId);
        await setDoc(docRef, payload);
      }

      setVideos([payload, ...videos]);
      setIsAddingVideo(false);
      setNewVideoTitle('');
      setNewVideoDesc('');
      setNewVideoUrl('');
      
      // Automatic real-time notification
      addNotification('Be Fearless', `Securely added: "${newVideoTitle}"`);
    } catch (err) {
      setNewVideoError('Failed to save to database. Check connection.');
      handleFirestoreError(err, OperationType.CREATE, `users/${userId}/fearless_videos/${videoId}`);
    }
  };

  // Delete/Remove Custom Video Link
  const handleRemoveVideo = async (vidId: string) => {
    try {
      if (userId !== 'guest_user') {
        const docRef = doc(db, 'users', userId, 'fearless_videos', vidId);
        await deleteDoc(docRef);
      }
      setVideos(videos.filter(v => v.id !== vidId));
      addNotification('Video Removed', 'Removed successfully from your learning log.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}/fearless_videos/${vidId}`);
    }
  };

  // Trigger Action towards challenge status
  const completeChallenge = async (challengeId: string, pointAward: number) => {
    if (fearlessState.completedChallenges.includes(challengeId)) return;

    const nextChallenges = [...fearlessState.completedChallenges, challengeId];
    const updatedState: FearlessState = {
      ...fearlessState,
      completedChallenges: nextChallenges
    };

    await saveFearlessState(updatedState);
  };

  // Marks article as read and triggers points
  const handleReadArticle = async (article: any) => {
    setSelectedArticle(article);
    
    // Add to read log
    if (!fearlessState.readArticles.includes(article.id)) {
      const nextRead = [...fearlessState.readArticles, article.id];
      const nextPoints = fearlessState.points + 15;
      
      const nextChallenges = [...fearlessState.completedChallenges];
      if (!nextChallenges.includes('chal_read_article')) {
        nextChallenges.push('chal_read_article');
      }

      let unlockedBadges = [...fearlessState.badges];
      if (!unlockedBadges.includes('Knowledge Seeker')) {
        unlockedBadges.push('Knowledge Seeker');
      }
      
      const updatedState = {
        ...fearlessState,
        points: nextPoints,
        readArticles: nextRead,
        completedChallenges: nextChallenges,
        badges: unlockedBadges
      };

      await saveFearlessState(updatedState);
    }
  };

  // Marks video as watched and triggers points
  const handleWatchVideoState = async (videoId: string) => {
    if (!fearlessState.watchedVideos.includes(videoId)) {
      const nextWatch = [...fearlessState.watchedVideos, videoId];
      const nextPoints = fearlessState.points + 15;
      
      const nextChallenges = [...fearlessState.completedChallenges];
      if (!nextChallenges.includes('chal_watch_video')) {
        nextChallenges.push('chal_watch_video');
      }

      let unlockedBadges = [...fearlessState.badges];
      if (!unlockedBadges.includes('Safety Vigilant')) {
        unlockedBadges.push('Safety Vigilant');
      }

      const updatedState = {
        ...fearlessState,
        points: nextPoints,
        watchedVideos: nextWatch,
        completedChallenges: nextChallenges,
        badges: unlockedBadges
      };

      await saveFearlessState(updatedState);
    }
  };

  // Safety Tips static structure with modern descriptions
  const safetyTipCategories = [
    {
      id: 'travel',
      icon: Compass,
      color: 'bg-rose-50 text-[#FF5A7A] border-rose-100',
      title: 'Travel Safety',
      tips: [
        'Always share your ride details with live GPS coordinate track links beforehand.',
        'Keep emergency dial tools at instant tactile accessibility on lock screens.',
        'Stay alert while boarding cabs, ensuring child safety locks are disengaged.',
        'Act with high, focused confidence, walking swiftly, keeping eye level upward.'
      ]
    },
    {
      id: 'public_transit',
      icon: Layers,
      color: 'bg-indigo-50 text-[#6366F1] border-indigo-100',
      title: 'Public Transport Safety',
      tips: [
        'Stand in crowded, well-illuminated central spaces near control panels.',
        'Avoid isolated carriages; prefer women-only sections or sit near conductors.',
        'Do not fall asleep on transit; keep backpack zippers zipped securely in front.',
        'Keep headphones turned OFF or at low volumes to preserve sound awareness.'
      ]
    },
    {
      id: 'night',
      icon: Sparkles,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
      title: 'Night Travel Safety',
      tips: [
        'Plan routes beforehand, strictly avoiding unmapped streets or dark dark shortcuts.',
        'Utilize active, well-lit petrol stations or major outlets to call secure transport.',
        'Maintain at least 40% phone battery and active location sharing.',
        'Keep tactile self-defense alarms ready; trigger immediate noise if stalked.'
      ]
    },
    {
      id: 'college',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      title: 'College Safety',
      tips: [
        'Familiarize yourself with campus safety guards and SOS kiosk points.',
        'Utilize campus escort walking services when departing after evening labs.',
        'Keep friends updated of your post-lecture schedules and destinations.',
        'Do not leave personal gadgets or drink containers unattended in public bays.'
      ]
    },
    {
      id: 'workplace',
      icon: Shield,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      title: 'Workplace Safety',
      tips: [
        'Understand office sexual harassment compliance channels and POSH policies.',
        'Schedule late-night meeting escorts or corporate-provided dispatch cabs.',
        'Keep absolute clear boundary limits on personal questions and workplace logs.',
        'Report subtle toxic, threatening behavior to HR directly without stalling.'
      ]
    },
    {
      id: 'online',
      icon: Lock,
      color: 'bg-violet-50 text-violet-600 border-violet-100',
      title: 'Online Safety',
      tips: [
        'Deploy Two-Factor Authentication on all web portals, email networks, and tools.',
        'Thoroughly screen privacy terms; avoid using generic shared Wi-Fi hubs.',
        'Check device application authorizations and block unnecessary location logs.',
        'Do not store payment codes or sensitive documents on open cloud sheets.'
      ]
    },
    {
      id: 'social',
      icon: HelpCircle,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      title: 'Social Media Safety',
      tips: [
        'Keep personal profiles private; do not post location-tag checkins in real-time.',
        'Restrict friend authorizations strictly to verified offline friends.',
        'Obscure background elements in posts that point to home/college addresses.',
        'Thwart cyberbullies instantly by utilizing blocking, reporting, and screenshot logs.'
      ]
    },
    {
      id: 'emergency_prep',
      icon: PhoneCall,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      title: 'Emergency Preparedness',
      tips: [
        'Pre-write SOS alerts and list high-priority emergency support speed dials.',
        'Maintain a compact emergency supply pouch in all travel bags.',
        'Rehearse physical escape stances: speed and noise are major force multipliers.',
        'Register local emergency responders, police centers, and helpline codes.'
      ]
    }
  ];

  // Know Your Rights static structure
  const rightsArticles = [
    {
      id: 'womens_rights',
      title: "Women's Core Constitutional Rights",
      category: "Women's Rights",
      icon: Shield,
      time: '3 min read',
      details: `In many nations, the constitution ensures equal treatment. Critical legal rights in India include:
      
1. **Right to Zero FIR**: A victim can file an FIR (First Information Report) at any police station regardless of where the incident occurred. The police must register it and transfer it to the local jurisdiction.
2. **Right to Non-Exposure**: A sexual violence victim's identity cannot be disclosed or published in any public files.
3. **Right to Medical Aid**: Free treatment must be provided by all government and private hospitals immediately in trauma cases.`
    },
    {
      id: 'cyber_safety',
      title: "Digital Defense & IT Act Protections",
      category: "Cyber Safety Rights",
      icon: Lock,
      time: '4 min read',
      details: `Safeguard your digital presence with absolute leverage of cyber-laws:

1. **Section 66E IPC/IT Act**: Punishes the intentional capturing, publishing, or transmitting of private area images without consent.
2. **Section 67 IT Act**: Prohibits transmitting obscene material globally.
3. **Cyber Defamation (Sec 499 IPC)**: Protects clean reputations from digital smear, blackmail, or morphed image distributions.
4. If defamed, document clean screenshots of all URLs and file an active report through www.cybercrime.gov.in.`
    },
    {
      id: 'work_rights',
      title: "The POSH Act & Workspace Safety",
      category: "Workplace Rights",
      icon: Award,
      time: '3 min read',
      details: `The POSH (Prevention of Sexual Harassment) Act, 2013 safeguards women at all workplaces:

1. **Mandatory ICC**: Every organization with 10 or more staff must form an Internal Complaints Committee (ICC) headed by a senior woman.
2. **Wide Scope**: Protects fulltime staff, interns, contractual workers, and even clients visiting corporate bays.
3. **No Retaliation**: Prevents companies from penalizing victims for filing a complaint. Restitution or leaves can be provided during probes.`
    },
    {
      id: 'legal_support',
      title: "How to Access Free Legal Aid (NALSA)",
      category: "Legal Support Information",
      icon: BookMarked,
      time: '5 min read',
      details: `Access legal protection free of cost:

1. **Section 12 of Legal Services Authorities Act**: Entitles ALL women to free, fully professional legal defense in any civil or criminal matters.
2. **NALSA Action**: Contact the National Legal Services Authority or local DLSA (District Legal Services Authority) in your district court list. They will instantly assign a qualified advocate to manage your defense entirely free.
3. **Toll-Free Aid**: Dial the national unified legal support directory code at 15100.`
    },
    {
      id: 'emergency_res',
      title: "National Emergency Response Framework (ERSS)",
      category: "Emergency Assistance Resources",
      icon: PhoneCall,
      time: '2 min read',
      details: `Familiarize with active responder lifelines:

1. **Unified Emergency Number (112)**: The singular, countrywide Emergency Response Support System (ERSS) operating 24x7 like 911.
2. **Women's Helpline (1091)**: Specifically designed for counseling, rescue operations, and rapid alert routing.
3. **Domestic Violence Line (181)**: Crucial, non-emergency and emergency protection for reporting violence and getting immediate help.`
    },
    {
      id: 'digital_priv',
      title: "Underlying Digital Privacy & Tracking Laws",
      category: "Digital Privacy Rights",
      icon: Compass,
      time: '4 min read',
      details: `Control who monitors your movements online:

1. **Anti-Stalking (Section 354D IPC)**: Criminalizes the act of repeatedly monitoring or attempting to contact a woman online (social media/email) when she has clearly indicated a lack of interest.
2. **Consent-Driven Profiling**: No platform can bundle and sell your live telemetry coordinates or private logs without written terms.
3. **Right to be Forgotten**: Seek manual removal of outdated personal search histories, listings, and leaked photos from search index engine providers.`
    }
  ];

  // Self Defense beginner topics
  const selfDefenseTopics = [
    {
      title: "Level 1: Situational Awareness",
      category: "Safety Mindset",
      content: "The foundation of all protection is awareness. Maintain focus by scanning surroundings. Avoid 'earphone-tunnel' where sound signals are lost. Trust your subconscious gut feel – if a space feels unsafe, exit immediately."
    },
    {
      title: "Level 2: Vocal Boundaries",
      category: "Emergency Response",
      content: "Body language speaks first. Maintain high erect posture. If approached, put your palms straight out in a hard 'STOP' stance level, and shout loudly: 'STAY BACK!' This alerts nearby citizens and forces the tracker to reassess."
    },
    {
      title: "Level 3: Tactical Target Zones",
      category: "Escape Strategies",
      content: "If physical escape is blocked, strike vulnerable anatomical points with extreme decision. Targets: EYES (swipe/strike), NOSE (open-palm thrust upwards), THROAT (finger strike), groin (kick or hard knee hook). Speed is your friend."
    },
    {
      title: "Level 4: Escape & Relocate",
      category: "Public Place Awareness",
      content: "Physical self-defense is not about winning a duel; it is about creating a 5-second exit window. Use a strike to stun, then sprint in the opposite direction toward well-lighted commercial centers or seek active support groups."
    }
  ];

  // Daily Challenges list setup
  const challengeChecklist = [
    {
      id: 'chal_guardian',
      title: 'Sync at least one Trusted Guardian',
      points: 30,
      description: 'Add a close friend or family member in your Guardian net tab.',
      statusText: guardians.length > 0 ? 'Verified Complete' : 'Awaiting Setup'
    },
    {
      id: 'chal_profile',
      title: 'Complete Profile Security Details',
      points: 30,
      description: 'Fill in essential profile details like full name and phone number.',
      statusText: (profile?.fullName && profile?.phoneNumber) ? 'Verified Complete' : 'Awaiting Setup'
    },
    {
      id: 'chal_read_article',
      title: 'Read one Educational Article',
      points: 15,
      description: 'Open and review any item under the Rights & Articles list.',
      statusText: fearlessState.completedChallenges.includes('chal_read_article') ? 'Complete' : 'Pending Action'
    },
    {
      id: 'chal_watch_video',
      title: 'Watch one Educational Video clip',
      points: 15,
      description: 'Play at least one awareness or self-defense video.',
      statusText: fearlessState.completedChallenges.includes('chal_watch_video') ? 'Complete' : 'Pending Action'
    },
    {
      id: 'chal_settings',
      title: 'Verify App Safety Triggers',
      points: 20,
      description: 'Ensure shake-sensors or SOS triggers are toggled active.',
      statusText: (settings?.shakeTriggerEnabled || settings?.audioTriggerEnabled) ? 'Verified Active' : 'Awaiting Setup'
    },
    {
      id: 'chal_emergency_no',
      title: 'Learn the ERSS Rescue Code (112)',
      points: 10,
      description: 'Memorize 112 as the unified emergency rescue helpline.',
      statusText: fearlessState.completedChallenges.includes('chal_emergency_no') ? 'Complete' : 'Interact to Learn'
    }
  ];

  // Achievements
  const achievementBadges = [
    {
      id: 'badge_1',
      name: 'Knowledge Seeker',
      desc: 'Opened and read your first educational rights article.',
      icon: BookOpen,
      requirement: 'Read any Article',
      isUnlocked: fearlessState.readArticles.length > 0 || fearlessState.badges.includes('Knowledge Seeker')
    },
    {
      id: 'badge_2',
      name: 'Safety Vigilant',
      desc: 'Complete at least one awareness or defense video.',
      icon: Tv,
      requirement: 'Watch a Video',
      isUnlocked: fearlessState.completedChallenges.includes('chal_watch_video') || fearlessState.badges.includes('Safety Vigilant')
    },
    {
      id: 'badge_3',
      name: 'Shield Guardian',
      desc: 'Onboarded at least one active guardian into safety net.',
      icon: Shield,
      requirement: 'Have a Guardian',
      isUnlocked: guardians.length > 0
    },
    {
      id: 'badge_4',
      name: 'Safety Curator',
      desc: 'Expanded the collective shield by adding a custom video log.',
      icon: Plus,
      requirement: 'Add custom video url',
      isUnlocked: videos.some(v => v.isCustom) || fearlessState.badges.includes('Safety Curator')
    },
    {
      id: 'badge_5',
      name: 'Fast Starter',
      desc: 'Completed at least one of the daily challenges today.',
      icon: Award,
      requirement: 'Complete 1 Challenge',
      isUnlocked: activeCompletedIds.length >= 1 || fearlessState.badges.includes('Fast Starter')
    },
    {
      id: 'badge_6',
      name: 'Fearless Champion',
      desc: 'Reached an elite state of confidence, education, and prep.',
      icon: Sparkles,
      requirement: 'Complete 5 Challenges',
      isUnlocked: activeCompletedIds.length >= 5 || fearlessState.badges.includes('Fearless Champion')
    }
  ];

  const currentQuote = quotes[quoteIndex];

  return (
    <div className="space-y-6 pb-24 text-slate-800" id="fearless-tab-content">
      {/* Visual Hero Intro Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF5A7A]/95 to-[#6366F1]/95 text-white p-7 shadow-lg">
        {/* Abstract floating shapes behind */}
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-indigo-200/10 rounded-full blur-xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-semibold mb-3">
            <Sparkles className="w-4.5 h-4.5 text-amber-200" />
            <span className="tracking-wide text-rose-50 font-bold uppercase">Empower & Protect</span>
          </div>
          
          <h1 className="text-3xl font-black tracking-tight font-display mb-1.5 flex items-center">
            🦋 NIDAR <span className="text-amber-200 ml-2">Fearless</span>
          </h1>
          <p className="text-xs text-rose-100/90 font-medium leading-relaxed max-w-sm mb-4">
            Step forward into confidence. Gear up with legal awareness, self-defense habits, and complete preparedness for daily life.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15 text-center mt-2">
            <div>
              <p className="text-[10px] text-rose-200 font-bold tracking-wider uppercase">My Points</p>
              <p className="text-lg font-black text-white">{computedPoints} PTS</p>
            </div>
            <div>
              <p className="text-[10px] text-rose-200 font-bold tracking-wider uppercase">Completed</p>
              <p className="text-lg font-black text-white">
                {activeCompletedIds.length} / {challengeChecklist.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-rose-200 font-bold tracking-wider uppercase">Badges</p>
              <p className="text-lg font-black text-amber-200">
                {achievementBadges.filter(b => b.isUnlocked).length} 🏅
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK JUMP NAVIGATION BAR - Filter categories */}
      <div className="flex space-x-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
            activeSection === 'all'
              ? 'bg-[#FF5A7A] text-white border-[#FF5A7A]'
              : 'bg-white text-slate-600 border-slate-100 font-semibold'
          }`}
        >
          🌟 All Sections
        </button>
        <button
          onClick={() => setActiveSection('motivation')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
            activeSection === 'motivation'
              ? 'bg-[#FF5A7A] text-white border-[#FF5A7A]'
              : 'bg-white text-slate-600 border-slate-100 font-semibold'
          }`}
        >
          💭 Daily Motivation
        </button>
        <button
          onClick={() => setActiveSection('tips')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
            activeSection === 'tips'
              ? 'bg-[#FF5A7A] text-white border-[#FF5A7A]'
              : 'bg-white text-slate-600 border-slate-100 font-semibold'
          }`}
        >
          💡 Safety Tips
        </button>
        <button
          onClick={() => setActiveSection('rights')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
            activeSection === 'rights'
              ? 'bg-[#FF5A7A] text-white border-[#FF5A7A]'
              : 'bg-white text-slate-600 border-slate-100 font-semibold'
          }`}
        >
          ⚖️ Know Your Rights
        </button>
        <button
          onClick={() => setActiveSection('selfdefense')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
            activeSection === 'selfdefense'
              ? 'bg-[#FF5A7A] text-white border-[#FF5A7A]'
              : 'bg-white text-slate-600 border-slate-100 font-semibold'
          }`}
        >
          🥋 Self-Defense
        </button>
        <button
          onClick={() => setActiveSection('learn')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
            activeSection === 'learn'
              ? 'bg-[#FF5A7A] text-white border-[#FF5A7A]'
              : 'bg-white text-slate-600 border-slate-100 font-semibold'
          }`}
        >
          🎓 Learning Centre
        </button>
        <button
          onClick={() => setActiveSection('challenges')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
            activeSection === 'challenges'
              ? 'bg-[#FF5A7A] text-white border-[#FF5A7A]'
              : 'bg-white text-slate-600 border-slate-100 font-semibold'
          }`}
        >
          🏅 Daily Challenges
        </button>
      </div>

      {/* SECTION 1: DAILY MOTIVATION */}
      {(activeSection === 'all' || activeSection === 'motivation') && (
        <section id="section-motivation" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black tracking-tight text-[#0F172A] flex items-center">
              <span className="p-1.5 bg-rose-50 text-[#FF5A7A] rounded-xl mr-2"><Sparkles className="w-4 h-4" /></span>
              Daily Motivation
            </h2>
            <button
              onClick={rotateQuoteManually}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full text-slate-600 hover:text-slate-800 transition-colors"
              title="Next Quote"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-50/75 rounded-2xl p-5 border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            {/* Visual quotes mark decorative */}
            <div className="absolute top-2 left-3 text-7xl text-[#FF5A7A]/10 font-serif pointer-events-none select-none">“</div>
            <div className="absolute right-3 bottom-0 text-7xl text-indigo-500/10 font-serif pointer-events-none select-none">”</div>

            <div className="relative z-10 mb-4">
              <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-[#FF5A7A]/10 text-[#FF5A7A] rounded-full uppercase tracking-wider">
                {currentQuote.focus}
              </span>
              <p className="text-[13px] text-slate-700 font-medium leading-relaxed italic mt-2.5">
                "{currentQuote.text}"
              </p>
            </div>
            
            <p className="text-[10px] text-slate-400 font-extrabold tracking-wide uppercase text-right relative z-10">
              — {currentQuote.author}
            </p>
          </div>
        </section>
      )}

      {/* SECTION 2: SAFETY TIPS */}
      {(activeSection === 'all' || activeSection === 'tips') && (
        <section id="section-safety-tips" className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tight text-[#0F172A] flex items-center">
              <span className="p-1.5 bg-rose-50 text-[#FF5A7A] rounded-xl mr-2"><Shield className="w-4 h-4" /></span>
              Active Safety Tips
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 ml-8">
              Interactive best practices categorized for your everyday safety.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {safetyTipCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className={`p-4 flex items-center space-x-3 border-b border-slate-50 ${category.color.split(' ')[0]}`}>
                    <div className={`p-2 rounded-xl bg-white border border-slate-100`}>
                      <Icon className="w-5 h-5 text-[#FF5A7A]" />
                    </div>
                    <span className="font-extrabold text-[#0F172A] text-sm tracking-tight">{category.title}</span>
                  </div>
                  <div className="p-4 space-y-2.5 flex-1 bg-slate-50/20">
                    {category.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs">
                        <span className="text-[#6366F1] font-bold text-xs mt-0.5">&#8226;</span>
                        <p className="text-slate-600 font-semibold leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 3: KNOW YOUR RIGHTS */}
      {(activeSection === 'all' || activeSection === 'rights') && (
        <section id="section-rights" className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tight text-[#0F172A] flex items-center">
              <span className="p-1.5 bg-rose-50 text-[#FF5A7A] rounded-xl mr-2"><BookOpen className="w-4 h-4" /></span>
              Know Your Rights
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 ml-8">
              Legal protections that empower you. Knowledge is your legal shield.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rightsArticles.map((article) => {
              const Icon = article.icon;
              const isRead = fearlessState.readArticles.includes(article.id);
              return (
                <div
                  key={article.id}
                  className={`bg-white rounded-2xl border ${isRead ? 'border-[#6366F1]/30 bg-indigo-50/5' : 'border-slate-100'} p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-indigo-50 text-[#6366F1] rounded-full uppercase tracking-wider border border-indigo-100">
                        {article.category}
                      </span>
                      {isRead && (
                        <span className="text-[9px] font-bold text-indigo-500 bg-white border border-indigo-200 rounded-full px-2 py-0.5 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Read</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-[#0F172A] leading-tight mb-2 tracking-tight">
                      {article.title}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {article.time}
                    </span>
                    <button
                      onClick={() => handleReadArticle(article)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#FF5A7A] hover:bg-[#E04E6A] text-white transition-all shadow-sm flex items-center space-x-1"
                    >
                      <span>Read Summary</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 4: SELF-DEFENSE AWARENESS */}
      {(activeSection === 'all' || activeSection === 'selfdefense') && (
        <section id="section-selfdefense" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex flex-col mb-4">
            <h2 className="text-lg font-black tracking-tight text-[#0F172A] flex items-center">
              <span className="p-1.5 bg-rose-50 text-[#FF5A7A] rounded-xl mr-2"><Award className="w-4 h-4" /></span>
              Self-Defense Awareness
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 ml-8">
              A beginner-friendly breakdown of emergency response mechanics and safety mindsets.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {selfDefenseTopics.map((topic, index) => (
              <div key={index} className="flex space-x-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-[#FF5A7A]/10 text-[#FF5A7A] font-black text-sm">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#6366F1]">
                    {topic.category}
                  </h4>
                  <h3 className="text-[14px] font-black text-[#0F172A] tracking-tight">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {topic.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 5: LEARN & STAY PREPARED - FULL SUB-TAB SECTOR */}
      {(activeSection === 'all' || activeSection === 'learn') && (
        <section id="section-learning-center" className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tight text-[#0F172A] flex items-center">
              <span className="p-1.5 bg-[#6366F1]/10 text-[#6366F1] rounded-xl mr-2"><Tv className="w-4 h-4" /></span>
              Learn & Stay Prepared
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 ml-8">
              Explore custom streams, curated files, and a rich dynamic video library.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Learning Subtabs Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 text-xs">
              <button
                onClick={() => setLearnTab('videos')}
                className={`flex-1 flex justify-center items-center py-2.5 rounded-xl font-extrabold space-x-1.5 transition-colors ${
                  learnTab === 'videos'
                    ? 'bg-white text-[#FF5A7A] shadow-sm font-black border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>📹 Videos</span>
              </button>
              <button
                onClick={() => setLearnTab('articles')}
                className={`flex-1 flex justify-center items-center py-2.5 rounded-xl font-extrabold space-x-1.5 transition-colors ${
                  learnTab === 'articles'
                    ? 'bg-white text-[#FF5A7A] shadow-sm font-black border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📖 Articles</span>
              </button>
              <button
                onClick={() => setLearnTab('tips')}
                className={`flex-1 flex justify-center items-center py-2.5 rounded-xl font-extrabold space-x-1.5 transition-colors ${
                  learnTab === 'tips'
                    ? 'bg-white text-[#FF5A7A] shadow-sm font-black border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BadgeCheckIcon />
                <span>💡 Tips Summary</span>
              </button>
              <button
                onClick={() => setLearnTab('resources')}
                className={`flex-1 flex justify-center items-center py-2.5 rounded-xl font-extrabold space-x-1.5 transition-colors ${
                  learnTab === 'resources'
                    ? 'bg-white text-[#FF5A7A] shadow-sm font-black border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>📚 Resources</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="p-5">
              {/* VIDEOS SUBTAB */}
              {learnTab === 'videos' && (
                <div className="space-y-5">
                  {/* Category Filter + Add video button */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none">
                      {['All', 'Self Defense', 'Women\'s Safety Awareness', 'Cyber Safety', 'Confidence Building'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setVideoCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border transition-all whitespace-nowrap ${
                            videoCategoryFilter === cat
                              ? 'bg-indigo-50 border-indigo-200 text-[#6366F1]'
                              : 'bg-white border-slate-100 text-slate-500'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsAddingVideo(!isAddingVideo)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-[11px] hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1 self-start"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Configure Shared Link</span>
                    </button>
                  </div>

                  {/* Add Video Drawer/Card Form */}
                  <AnimatePresence>
                    {isAddingVideo && (
                      <motion.form
                        onSubmit={handleAddVideo}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-3.5 overflow-hidden"
                      >
                        <h4 className="text-xs font-black text-[#0F172A] flex items-center uppercase tracking-wider">
                          <Plus className="w-3.5 h-3.5 mr-1 text-[#FF5A7A]" /> Add Educational Video Link
                        </h4>
                        
                        {newVideoError && (
                          <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2 border border-red-100 rounded-lg">{newVideoError}</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-semibold">
                          <div className="space-y-1">
                            <label className="text-slate-500">Video Title</label>
                            <input
                              type="text"
                              value={newVideoTitle}
                              onChange={(e) => setNewVideoTitle(e.target.value)}
                              placeholder="e.g. 5 Common Street Escapes"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-[#6366F1]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-500">YouTube Link/Url</label>
                            <input
                              type="text"
                              value={newVideoUrl}
                              onChange={(e) => setNewVideoUrl(e.target.value)}
                              placeholder="e.g. https://youtu.be/..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-[#6366F1]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-500">Streaming Category</label>
                            <select
                              value={newVideoCategory}
                              onChange={(e) => setNewVideoCategory(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-[#6366F1]"
                            >
                              <option value="Self Defense">Self Defense</option>
                              <option value="Women's Safety Awareness">Women's Safety Awareness</option>
                              <option value="Cyber Safety">Cyber Safety</option>
                              <option value="Travel Safety">Travel Safety</option>
                              <option value="Emergency Preparedness">Emergency Preparedness</option>
                              <option value="Confidence Building">Confidence Building</option>
                              <option value="Leadership & Personal Growth">Leadership & Personal Growth</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-500">Short Summary</label>
                            <input
                              type="text"
                              value={newVideoDesc}
                              onChange={(e) => setNewVideoDesc(e.target.value)}
                              placeholder="Describe core takeaway points..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-[#6366F1]"
                            />
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-1.5 self-end">
                          <button
                            type="button"
                            onClick={() => setIsAddingVideo(false)}
                            className="flex-1 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2 rounded-xl bg-[#6366F1] hover:bg-[#5254D1] text-white font-extrabold text-xs transition-all shadow-md shadow-indigo-150"
                          >
                            Save Stream Link
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Videos Grid */}
                  {loading ? (
                    <div className="py-12 text-center text-slate-400 font-black tracking-widest text-xs animate-pulse">
                      LOADING STREAMS INDEX...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {videos
                        .filter(v => videoCategoryFilter === 'All' || v.category === videoCategoryFilter)
                        .map((video) => {
                          const isWatched = fearlessState.watchedVideos.includes(video.id);
                          return (
                            <div key={video.id} className="bg-slate-55 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 shadow-none transition-all p-4.5 flex flex-col md:flex-row md:space-x-4">
                              {/* Thumbnail Mock Container */}
                              <div className="relative md:w-44 h-28 bg-[#0F172A] rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden mb-3.5 md:mb-0 border border-slate-200">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 to-rose-950/20" />
                                <div className="relative text-white z-10 flex flex-col items-center">
                                  <div className="w-10 h-10 rounded-full bg-[#FF5A7A] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shadow-lg cursor-pointer">
                                    <Play className="w-4 h-4 fill-white text-[#FF5A7A] translate-x-0.5" />
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-350 tracking-wider mt-1.5 uppercase font-mono uppercase bg-slate-900/70 py-0.5 px-2 rounded-md">
                                    YouTube Embed
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col justify-between space-y-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    <span className="text-[9px] font-extrabold px-2 py-0.5 bg-indigo-50 text-[#6366F1] border border-indigo-100 rounded-full uppercase">
                                      {video.category}
                                    </span>
                                    {isWatched && (
                                      <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center space-x-1">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        <span>Completed</span>
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-sm font-black text-[#0F172A] tracking-tight leading-tight">
                                    {video.title}
                                  </h3>
                                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                                    {video.description}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/50">
                                  <div className="space-x-1.5 flex items-center">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase font-mono">
                                      {video.isCustom ? 'Shared Link' : 'App Shield'}
                                    </span>
                                    {video.isCustom && (
                                      <button
                                        onClick={() => handleRemoveVideo(video.id)}
                                        className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1 rounded-md"
                                        title="Delete Link"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex space-x-2">
                                    <a
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => handleWatchVideoState(video.id)}
                                      className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm flex items-center space-x-1"
                                    >
                                      <span>Watch</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {videos.length === 0 && (
                        <p className="text-xs text-slate-400 font-semibold text-center py-6">No videos added in this category yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ARTICLES SUBTAB */}
              {learnTab === 'articles' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rightsArticles.map((art) => {
                    const isRead = fearlessState.readArticles.includes(art.id);
                    return (
                      <div key={art.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-[#FF5A7A] rounded-full uppercase">
                              {art.category}
                            </span>
                            {isRead && <span className="text-[9px] font-bold text-emerald-600 bg-white border border-emerald-150 px-2 py-0.5 rounded-full uppercase">Completed</span>}
                          </div>
                          <h4 className="text-sm font-black text-[#0F172A] leading-snug tracking-tight">
                            {art.title}
                          </h4>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100/50">
                          <span className="text-[10px] text-slate-400 font-semibold">{art.time}</span>
                          <button
                            onClick={() => handleReadArticle(art)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#6366F1] font-extrabold text-[11px] transition-colors flex items-center space-x-1"
                          >
                            <span>Read Article</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* QUICK SAFETY TIPS SUMMARY */}
              {learnTab === 'tips' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start space-x-3 text-xs">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700/90 font-medium leading-relaxed">
                      Physical escape tactics are designed precisely to buy crucial seconds. Always prioritize building distance over engaging in combat.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-semibold text-slate-700">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <span className="text-[9px] font-extrabold text-[#FF5A7A] uppercase tracking-wider">01. DE-ESCALATE</span>
                      <h4 className="font-extrabold text-[#0F172A] text-xs">Vocal Commands</h4>
                      <p className="text-slate-500 text-[11.5px] leading-relaxed">Using strong, crisp body language acts as a proactive barrier, indicating confidence and situational preparedness.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <span className="text-[9px] font-extrabold text-[#FF5A7A] uppercase tracking-wider">02. CREATE CHAOS</span>
                      <h4 className="font-extrabold text-[#0F172A] text-xs">Acoustic Shields</h4>
                      <p className="text-slate-500 text-[11.5px] leading-relaxed">Screaming commands or setting off a portable high-decibel alarm breaks attacker concentration immediately.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <span className="text-[9px] font-extrabold text-[#FF5A7A] uppercase tracking-wider">03. ESCAPE STRIKES</span>
                      <h4 className="font-extrabold text-[#0F172A] text-xs">Vulnerable Zones</h4>
                      <p className="text-slate-500 text-[11.5px] leading-relaxed">Deliver maximum force to high vulnerability areas like eyes, jaw, throat, or groin if exit is blocked.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <span className="text-[9px] font-extrabold text-[#FF5A7A] uppercase tracking-wider">04. SAFE HAVENS</span>
                      <h4 className="font-extrabold text-[#0F172A] text-xs">Relocate & Protect</h4>
                      <p className="text-slate-500 text-[11.5px] leading-relaxed">Sprint toward high occupancy, well-lit spaces like banks, fuel decks, or retail zones to call assistance.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* RESOURCES SUBTAB - HELPFULS & GUEST HELPLINE */}
              {learnTab === 'resources' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Emergency Support Lifelines</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex justify-between items-center select-none">
                      <div>
                        <p className="text-xs font-black text-[#0F172A]">ERSS Emergency Helpline</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Singular Unified Responder Line</p>
                      </div>
                      <span className="text-[#FF5A7A] font-black text-base px-3 py-1 bg-rose-50 border border-rose-100 rounded-xl">112</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex justify-between items-center select-none">
                      <div>
                        <p className="text-xs font-black text-[#0F172A]">National Women Helpline</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">24x7 Assistance & Protection</p>
                      </div>
                      <span className="text-[#6366F1] font-black text-base px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-xl">1091</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex justify-between items-center select-none">
                      <div>
                        <p className="text-xs font-black text-[#0F172A]">Student Crisis Support</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Campus Safety & Anti-Bullying</p>
                      </div>
                      <span className="text-sky-600 font-black text-base px-3 py-1 bg-sky-50 border border-sky-100 rounded-xl">181</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex justify-between items-center select-none">
                      <div>
                        <p className="text-xs font-black text-[#0F172A]">Cyber Crime Cell Portal</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Online Abuse & Morph Tracking</p>
                      </div>
                      <span className="text-violet-600 font-black text-base px-3 py-1 bg-violet-50 border border-violet-100 rounded-xl">1930</span>
                    </div>
                  </div>

                  <hr className="border-slate-100 my-4" />

                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Important Government Web Portals</h4>
                  <div className="flex flex-col space-y-2 text-xs">
                    <a
                      href="https://cybercrime.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-[#6366F1] font-bold"
                    >
                      <span className="text-[#0F172A]">National Cyber Crime reporting portal India</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href="http://ncw.nic.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-[#6366F1] font-bold"
                    >
                      <span className="text-[#0F172A]">National Commission for Women (NCW)</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: DAILY CONFIDENCE CHALLENGE */}
      {(activeSection === 'all' || activeSection === 'challenges') && (
        <section id="section-challenges" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#0F172A] flex items-center">
                <span className="p-1.5 bg-rose-50 text-[#FF5A7A] rounded-xl mr-2"><UserCheck className="w-4 h-4" /></span>
                Daily Confidence Challenge
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Simple everyday actions that build confidence and robust preparedness.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {challengeChecklist.map((challenge) => {
              const isChecked = activeCompletedIds.includes(challenge.id);

              return (
                <div
                  key={challenge.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isChecked
                      ? 'bg-emerald-50/20 border-emerald-100 shadow-none'
                      : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <button
                      type="button"
                      disabled={isChecked}
                      onClick={() => completeChallenge(challenge.id, challenge.points)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-slate-300 hover:border-slate-400 active:scale-95'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-white fill-emerald-500" />}
                    </button>
                    <div>
                      <h4 className={`text-xs font-black tracking-tight leading-tight ${isChecked ? 'text-slate-500 line-through' : 'text-[#0F172A]'}`}>
                        {challenge.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-0.5">
                        {challenge.description}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                        {challenge.statusText}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl whitespace-nowrap ${
                    isChecked ? 'bg-emerald-100/50 text-emerald-700' : 'bg-[#FF5A7A]/10 text-[#FF5A7A]'
                  }`}>
                    +{challenge.points} PTS
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 7: ACHIEVEMENT BADGES AND STATE */}
      <section id="section-badges" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[#0F172A] flex items-center">
            <span className="p-1.5 bg-rose-50 text-[#FF5A7A] rounded-xl mr-2"><Award className="w-4 h-4" /></span>
            Achievement Badges
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Earn premium medals by engaging in challenges, protecting guardians, and expanding safety awareness.
          </p>
        </div>

        {/* Dynamic Badge Grid */}
        <div className="grid grid-cols-2 gap-4">
          {achievementBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center space-y-2 relative overflow-hidden ${
                  badge.isUnlocked
                    ? 'border-[#FF5A7A]/20 bg-rose-50/10 shadow-sm'
                    : 'border-slate-100 bg-slate-50/50 opacity-60'
                }`}
              >
                <div className={`p-3 rounded-full border shadow-sm ${
                  badge.isUnlocked
                    ? 'bg-gradient-to-br from-[#FF5A7A] to-[#FF7A59] border-white text-white rotate-6'
                    : 'bg-white border-slate-150 text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-[#0F172A] leading-tight tracking-tight">
                    {badge.name}
                  </h4>
                  <p className="text-[10px] leading-relaxed text-slate-400 font-medium max-w-[120px]">
                    {badge.desc}
                  </p>
                </div>

                {badge.isUnlocked ? (
                  <span className="text-[9px] font-extrabold text-[#FF5A7A] uppercase bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    Unlocked 🏅
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-400 uppercase bg-white border border-slate-250 px-2 py-0.5 rounded-full">
                    {badge.requirement}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ARTICLE READER MODAL CONTAINER */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-rose-50/50 to-indigo-50/20">
                <div>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 bg-indigo-50 text-[#6366F1] border border-indigo-100 rounded-full uppercase">
                    {selectedArticle.category}
                  </span>
                  <h3 className="text-base font-black text-[#0F172A] tracking-tight mt-1 leading-tight">
                    {selectedArticle.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-650 font-black text-xs transition-colors self-start"
                >
                  X
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 font-semibold text-slate-650 text-xs leading-relaxed space-y-4">
                {selectedArticle.details.split('\n\n').map((para: string, idx: number) => {
                  if (para.startsWith('1.') || para.startsWith('2.') || para.startsWith('3.')) {
                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-slate-705">
                        {para}
                      </div>
                    );
                  }
                  return <p key={idx}>{para}</p>;
                })}
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-semibold">{selectedArticle.time}</span>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors"
                >
                  Mark as Read
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline replacement svg icon helper
function BadgeCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-badge-check">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.74z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
