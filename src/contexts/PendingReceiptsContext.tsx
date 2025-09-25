import React, { createContext, useContext, useCallback, useState } from 'react';

interface PendingReceiptsContextType {
  refreshPendingCount: () => void;
  decrementPendingCount: (receiptId?: string) => void;
  registerRefreshCallback: (callback: () => Promise<void>) => void;
  registerDecrementCallback: (callback: (receiptId?: string) => void) => void;
}

const PendingReceiptsContext = createContext<PendingReceiptsContextType | undefined>(undefined);

export const PendingReceiptsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshCallback, setRefreshCallback] = useState<(() => Promise<void>) | null>(null);
  const [decrementCallback, setDecrementCallback] = useState<((receiptId?: string) => void) | null>(null);

  const refreshPendingCount = useCallback(async () => {
    if (refreshCallback) {
      await refreshCallback();
    }
  }, [refreshCallback]);

  const decrementPendingCount = useCallback((receiptId?: string) => {
    if (decrementCallback) {
      decrementCallback(receiptId);
    }
  }, [decrementCallback]);

  const registerRefreshCallback = useCallback((callback: () => Promise<void>) => {
    setRefreshCallback(() => callback);
  }, []);

  const registerDecrementCallback = useCallback((callback: (receiptId?: string) => void) => {
    setDecrementCallback(() => callback);
  }, []);

  return (
    <PendingReceiptsContext.Provider
      value={{
        refreshPendingCount,
        decrementPendingCount,
        registerRefreshCallback,
        registerDecrementCallback,
      }}
    >
      {children}
    </PendingReceiptsContext.Provider>
  );
};

export const usePendingReceiptsContext = () => {
  const context = useContext(PendingReceiptsContext);
  if (context === undefined) {
    // Provide a fallback instead of throwing an error to prevent crashes
    return {
      refreshPendingCount: async () => {},
      decrementPendingCount: () => {},
      registerRefreshCallback: () => {},
      registerDecrementCallback: () => {},
    };
  }
  return context;
};