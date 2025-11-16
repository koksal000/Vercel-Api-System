'use client';

import { useState, useEffect, useCallback } from 'react';

const SAVED_APPS_KEY = 'capupdate-saved-apps';

export function useSavedApps() {
  const [savedAppIds, setSavedAppIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let item;
    try {
      item = window.localStorage.getItem(SAVED_APPS_KEY);
      if (item) {
        setSavedAppIds(new Set(JSON.parse(item)));
      }
    } catch (error) {
      console.error('Error reading from localStorage', error);
      setSavedAppIds(new Set());
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const toggleSave = useCallback((appId: string) => {
    setSavedAppIds(prevIds => {
        const newIds = new Set(prevIds);
        if (newIds.has(appId)) {
            newIds.delete(appId);
        } else {
            newIds.add(appId);
        }
        
        try {
            window.localStorage.setItem(SAVED_APPS_KEY, JSON.stringify(Array.from(newIds)));
        } catch (error) {
            console.error('Error writing to localStorage', error);
        }

        return newIds;
    });
  }, []);

  return { savedAppIds: Array.from(savedAppIds), toggleSave, isLoaded };
}
