import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { YjsProvider } from '@/lib/yjsProvider';
import { useAuthStore } from '@/stores/authStore';

export const useYjsCollaboration = (pageId: string | undefined) => {
  const { token } = useAuthStore();
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<YjsProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const [connected, setConnected] = useState(false);
  const providerRef = useRef<YjsProvider | null>(null);

  useEffect(() => {
    if (!pageId || !token) {
      return;
    }

    // Create Y.Doc
    const doc = new Y.Doc();
    setYdoc(doc);

    // Create provider
    const newProvider = new YjsProvider(pageId, doc, token);
    setProvider(newProvider);
    providerRef.current = newProvider;

    // Poll connection status
    const interval = setInterval(() => {
      if (newProvider) {
        setSynced(newProvider.isSynced());
        setConnected(newProvider.isConnected());
      }
    }, 500);

    // Cleanup
    return () => {
      clearInterval(interval);
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      doc.destroy();
      setYdoc(null);
      setProvider(null);
      setSynced(false);
      setConnected(false);
    };
  }, [pageId, token]);

  return {
    ydoc,
    provider,
    synced,
    connected,
  };
};
