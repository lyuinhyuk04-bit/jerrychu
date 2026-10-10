'use client';

import { useState, useEffect } from 'react';
import { ScheduleItem, NoticeItem, FanArtItem, EventItem, AdminUser } from './types';
import { INITIAL_SCHEDULES, INITIAL_NOTICES, INITIAL_FANARTS, INITIAL_EVENTS } from './mockData';
import { getCurrentUser, setCurrentUser as saveCurrentUser, isAdminUser } from './auth';

const STORAGE_KEYS = {
  schedules: 'jerry_schedules_v1',
  notices: 'jerry_notices_v1',
  fanarts: 'jerry_fanarts_v1',
  events: 'jerry_events_v1',
};

export function useAppState() {
  const [currentUser, setUserState] = useState<AdminUser | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [fanarts, setFanarts] = useState<FanArtItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage or Mock Data
  useEffect(() => {
    try {
      const user = getCurrentUser();
      setUserState(user);

      const savedSchedules = localStorage.getItem(STORAGE_KEYS.schedules);
      setSchedules(savedSchedules ? JSON.parse(savedSchedules) : INITIAL_SCHEDULES);

      const savedNotices = localStorage.getItem(STORAGE_KEYS.notices);
      setNotices(savedNotices ? JSON.parse(savedNotices) : INITIAL_NOTICES);

            const savedFanarts = localStorage.getItem(STORAGE_KEYS.fanarts);
      if (savedFanarts) {
        setFanarts(JSON.parse(savedFanarts));
      } else {
        // Attempt to load fanarts from the SOOP JSON file
        fetch('/soop-fanart.json')
          .then(res => res.ok ? res.json() : [])
          .then((data) => setFanarts(data))
          .catch(() => setFanarts(INITIAL_FANARTS));
      }
      if (savedFanarts) {
      setFanarts(JSON.parse(savedFanarts));
    } else {
      // Attempt to load fanarts from the SOOP JSON file
      fetch('/soop-fanart.json')
        .then(res => (res.ok ? res.json() : []))
        .then((data) => setFanarts(data))
        .catch(() => setFanarts(INITIAL_FANARTS));
    }

      const savedEvents = localStorage.getItem(STORAGE_KEYS.events);
      setEvents(savedEvents ? JSON.parse(savedEvents) : INITIAL_EVENTS);
    } catch (e) {
      console.error('Failed to load local state:', e);
      setSchedules(INITIAL_SCHEDULES);
      setNotices(INITIAL_NOTICES);
      setFanarts(INITIAL_FANARTS);
      setEvents(INITIAL_EVENTS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to LocalStorage helpers
  const login = (user: AdminUser) => {
    setUserState(user);
    saveCurrentUser(user);
  };

  const logout = () => {
    setUserState(null);
    saveCurrentUser(null);
  };

  // Schedule CRUD
  const addSchedule = (item: Omit<ScheduleItem, 'id' | 'createdAt'>) => {
    const newItem: ScheduleItem = {
      ...item,
      id: `sched-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...schedules];
    setSchedules(updated);
    localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(updated));
    return newItem;
  };

  const updateSchedule = (id: string, updates: Partial<ScheduleItem>) => {
    const updated = schedules.map((item) => (item.id === id ? { ...item, ...updates } : item));
    setSchedules(updated);
    localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(updated));
  };

  const deleteSchedule = (id: string) => {
    const updated = schedules.filter((item) => item.id !== id);
    setSchedules(updated);
    localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(updated));
  };

  // Notice CRUD
  const addNotice = (item: Omit<NoticeItem, 'id' | 'createdAt'>) => {
    const newItem: NoticeItem = {
      ...item,
      id: `notice-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...notices];
    setNotices(updated);
    localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(updated));
    return newItem;
  };

  const updateNotice = (id: string, updates: Partial<NoticeItem>) => {
    const updated = notices.map((item) => (item.id === id ? { ...item, ...updates } : item));
    setNotices(updated);
    localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(updated));
  };

  const deleteNotice = (id: string) => {
    const updated = notices.filter((item) => item.id !== id);
    setNotices(updated);
    localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(updated));
  };

  // FanArt CRUD
  const addFanArt = (item: Omit<FanArtItem, 'id' | 'createdAt' | 'likes'>) => {
    const newItem: FanArtItem = {
      ...item,
      id: `fanart-${Date.now()}`,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...fanarts];
    setFanarts(updated);
    localStorage.setItem(STORAGE_KEYS.fanarts, JSON.stringify(updated));
    return newItem;
  };

  const deleteFanArt = (id: string) => {
    const updated = fanarts.filter((item) => item.id !== id);
    setFanarts(updated);
    localStorage.setItem(STORAGE_KEYS.fanarts, JSON.stringify(updated));
  };

  const toggleFanArtLike = (id: string) => {
    const updated = fanarts.map((item) =>
      item.id === id ? { ...item, likes: item.likes + 1 } : item
    );
    setFanarts(updated);
    localStorage.setItem(STORAGE_KEYS.fanarts, JSON.stringify(updated));
  };

  // Event CRUD
  const addEvent = (item: Omit<EventItem, 'id' | 'createdAt'>) => {
    const newItem: EventItem = {
      ...item,
      id: `event-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...events];
    setEvents(updated);
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(updated));
    return newItem;
  };

  const updateEvent = (id: string, updates: Partial<EventItem>) => {
    const updated = events.map((item) => (item.id === id ? { ...item, ...updates } : item));
    setEvents(updated);
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(updated));
  };

  const deleteEvent = (id: string) => {
    const updated = events.filter((item) => item.id !== id);
    setEvents(updated);
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(updated));
  };

  // Reset to initial mock data
  const resetToDefault = () => {
    setSchedules(INITIAL_SCHEDULES);
    setNotices(INITIAL_NOTICES);
    setFanarts(INITIAL_FANARTS);
    setEvents(INITIAL_EVENTS);
    localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(INITIAL_SCHEDULES));
    localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(INITIAL_NOTICES));
    localStorage.setItem(STORAGE_KEYS.fanarts, JSON.stringify(INITIAL_FANARTS));
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(INITIAL_EVENTS));
  };

  return {
    isLoaded,
    currentUser,
    isAdmin: isAdminUser(currentUser),
    login,
    logout,
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    notices,
    addNotice,
    updateNotice,
    deleteNotice,
    fanarts,
    addFanArt,
    deleteFanArt,
    toggleFanArtLike,
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    resetToDefault,
  };
}
