import { useState, useEffect, useRef } from 'react';
import { UI_CONFIG } from '../config/app.config';
import { checkApiHealth } from '../utils/apiHealth';

interface ColdStartState {
  isLoading: boolean;
  showColdStartMessage: boolean;
  requestCount: number;
  serverState: 'unknown' | 'awake' | 'sleeping' | 'warming-up';
  lastWarmupTime: number;
}

let globalColdStartState: ColdStartState = {
  isLoading: false,
  showColdStartMessage: false,
  requestCount: 0,
  serverState: 'unknown',
  lastWarmupTime: 0
};

let listeners: Set<() => void> = new Set();
let warmupPromise: Promise<void> | null = null;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Warm up the server proactively
const warmupServer = async (): Promise<void> => {
  if (warmupPromise) return warmupPromise;
  
  warmupPromise = (async () => {
    try {
      globalColdStartState.serverState = 'warming-up';
      globalColdStartState.lastWarmupTime = Date.now();
      notifyListeners();
      
      const healthCheck = await checkApiHealth();
      
      if (healthCheck.isHealthy) {
        globalColdStartState.serverState = 'awake';
      } else {
        globalColdStartState.serverState = 'sleeping';
      }
    } catch (error) {
      globalColdStartState.serverState = 'sleeping';
    } finally {
      notifyListeners();
      warmupPromise = null;
    }
  })();
  
  return warmupPromise;
};

// Check if server needs warmup (hasn't been warmed up in the last 5 minutes)
const shouldWarmupServer = (): boolean => {
  const timeSinceLastWarmup = Date.now() - globalColdStartState.lastWarmupTime;
  const fiveMinutes = 5 * 60 * 1000;
  
  return globalColdStartState.serverState === 'unknown' || 
         globalColdStartState.serverState === 'sleeping' ||
         timeSinceLastWarmup > fiveMinutes;
};

export const useColdStartLoader = () => {
  const [state, setState] = useState(globalColdStartState);
  const coldStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const listener = () => setState({ ...globalColdStartState });
    listeners.add(listener);
    
    // Warmup server when hook first loads (app startup)
    if (shouldWarmupServer()) {
      warmupServer();
    }
    
    return () => {
      listeners.delete(listener);
      if (coldStartTimeoutRef.current) {
        clearTimeout(coldStartTimeoutRef.current);
      }
    };
  }, []);

  const startLoading = () => {
    globalColdStartState.isLoading = true;
    globalColdStartState.requestCount++;
    
    // Clear any existing timeout
    if (coldStartTimeoutRef.current) {
      clearTimeout(coldStartTimeoutRef.current);
    }
    
    // Only show cold start message if server is known to be sleeping or we detect a slow response pattern
    const shouldShowColdStart = globalColdStartState.serverState === 'sleeping' ||
                               (globalColdStartState.serverState === 'unknown' && globalColdStartState.requestCount === 1);
    
    if (shouldShowColdStart) {
      coldStartTimeoutRef.current = setTimeout(() => {
        // Double-check server state before showing loader
        if (globalColdStartState.serverState === 'sleeping' || globalColdStartState.serverState === 'unknown') {
          globalColdStartState.showColdStartMessage = true;
          notifyListeners();
        }
      }, UI_CONFIG.COLD_START_THRESHOLD);
    }
    
    (window as any).lastRequestTime = Date.now();
    notifyListeners();
  };

  const stopLoading = () => {
    globalColdStartState.isLoading = false;
    globalColdStartState.showColdStartMessage = false;
    
    // If a request completed successfully, mark server as awake
    if (globalColdStartState.serverState !== 'awake') {
      globalColdStartState.serverState = 'awake';
    }
    
    if (coldStartTimeoutRef.current) {
      clearTimeout(coldStartTimeoutRef.current);
    }
    
    notifyListeners();
  };

  return {
    isLoading: state.isLoading,
    showColdStartMessage: state.showColdStartMessage,
    serverState: state.serverState,
    startLoading,
    stopLoading,
    warmupServer: () => warmupServer()
  };
};

// Export functions for use in API service
export const apiLoadingHelpers = {
  startLoading: () => {
    globalColdStartState.isLoading = true;
    globalColdStartState.requestCount++;
    
    // Smarter cold start detection based on server state
    const shouldShowColdStart = globalColdStartState.serverState === 'sleeping' ||
                               (globalColdStartState.serverState === 'unknown' && globalColdStartState.requestCount === 1);
    
    if (shouldShowColdStart) {
      setTimeout(() => {
        if (globalColdStartState.serverState === 'sleeping' || globalColdStartState.serverState === 'unknown') {
          globalColdStartState.showColdStartMessage = true;
          notifyListeners();
        }
      }, UI_CONFIG.COLD_START_THRESHOLD);
    }
    
    (window as any).lastRequestTime = Date.now();
    notifyListeners();
  },
  
  stopLoading: () => {
    globalColdStartState.isLoading = false;
    globalColdStartState.showColdStartMessage = false;
    
    // Mark server as awake when requests succeed
    if (globalColdStartState.serverState !== 'awake') {
      globalColdStartState.serverState = 'awake';
    }
    
    notifyListeners();
  },
  
  markServerSleeping: () => {
    globalColdStartState.serverState = 'sleeping';
    notifyListeners();
  }
};
