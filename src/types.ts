/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  profilePhoto?: string;
  bloodGroup: string;
  medicalNotes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priorityLevel: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface AlertLog {
  id: string;
  type: string;
  status: 'active' | 'resolved';
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  battery: number;
  network: string;
}

export interface Journey {
  id: string;
  destinationName: string;
  eta: string;
  startLocation: {
    lat: number;
    lng: number;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  endLocation?: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'completed' | 'alert';
  createdAt: string;
}

export interface UserSetting {
  theme: 'light' | 'dark';
  audioTriggerEnabled: boolean;
  shakeTriggerEnabled: boolean;
  pushNotificationsEnabled: boolean;
  emergencySOSCountdown: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  status: 'unread' | 'read';
}

export interface EvidenceItem {
  id: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  fileType: 'audio' | 'image' | 'video';
  fileSize: number;
  fileUrl: string;
  storageStatus: string;
  sosId?: string;
}
