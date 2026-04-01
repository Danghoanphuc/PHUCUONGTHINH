// Real-time sync service using BroadcastChannel API
// Enables cross-tab and cross-device communication for product form updates

type EventCallback = (payload: any) => void;

interface ProductFormEvent {
  type: 'media_upload_start' | 'media_upload_progress' | 'media_upload_complete' | 
        'media_upload_error' | 'product_saved' | 'product_publish' | 
        'media_delete' | 'product_sync_request' | 'product_sync_response';
  productId: string;
  payload: any;
  timestamp: number;
  userId?: string;
  tabId: string;
}

class RealtimeService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private tabId: string;
  private userId: string | undefined;
  
  constructor() {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') || undefined : undefined;
    
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('phucuongthinh_product_form');
      this.channel.onmessage = (event) => this.handleMessage(event.data);
    }
  }
  
  private handleMessage(event: ProductFormEvent) {
    // Ignore messages from same tab
    if (event.tabId === this.tabId) return;
    
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(event.payload);
        } catch (err) {
          console.error('[RealtimeService] Callback error:', err);
        }
      });
    }
  }
  
  subscribe(eventType: ProductFormEvent['type'], callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }
  
  publish(type: ProductFormEvent['type'], productId: string, payload: any) {
    if (!this.channel) return;
    
    const event: ProductFormEvent = {
      type,
      productId,
      payload,
      timestamp: Date.now(),
      userId: this.userId,
      tabId: this.tabId,
    };
    
    this.channel.postMessage(event);
  }
  
  // Broadcast media upload started
  broadcastMediaUploadStart(productId: string, mediaData: { clientId: string; fileName: string; mediaType: string }) {
    this.publish('media_upload_start', productId, mediaData);
  }
  
  // Broadcast media upload progress
  broadcastMediaUploadProgress(productId: string, mediaData: { clientId: string; progress: number }) {
    this.publish('media_upload_progress', productId, mediaData);
  }
  
  // Broadcast media upload complete
  broadcastMediaUploadComplete(productId: string, mediaData: { clientId: string; url: string; mediaId: string }) {
    this.publish('media_upload_complete', productId, mediaData);
  }
  
  // Broadcast media upload error
  broadcastMediaUploadError(productId: string, mediaData: { clientId: string; error: string }) {
    this.publish('media_upload_error', productId, mediaData);
  }
  
  // Broadcast product saved
  broadcastProductSaved(productId: string, productData: any) {
    this.publish('product_saved', productId, productData);
  }
  
  // Broadcast media deleted
  broadcastMediaDelete(productId: string, mediaId: string) {
    this.publish('media_delete', productId, { mediaId });
  }
  
  // Request sync from other tabs
  requestSync(productId: string) {
    this.publish('product_sync_request', productId, { requestTabId: this.tabId });
  }
  
  destroy() {
    this.channel?.close();
    this.listeners.clear();
  }
}

// Singleton instance
export const realtimeService = typeof window !== 'undefined' ? new RealtimeService() : null;

// Hook for using realtime events
export function useRealtime(productId?: string) {
  return {
    onMediaUploadStart: (cb: (data: any) => void) => 
      realtimeService?.subscribe('media_upload_start', (data) => {
        if (data.productId === productId) cb(data);
      }),
    onMediaUploadComplete: (cb: (data: any) => void) => 
      realtimeService?.subscribe('media_upload_complete', (data) => {
        if (data.productId === productId) cb(data);
      }),
    onProductSaved: (cb: (data: any) => void) => 
      realtimeService?.subscribe('product_saved', (data) => {
        if (data.productId === productId) cb(data);
      }),
    onMediaDelete: (cb: (data: any) => void) => 
      realtimeService?.subscribe('media_delete', (data) => {
        if (data.productId === productId) cb(data);
      }),
    broadcastMediaUploadStart: (data: any) => productId && realtimeService?.broadcastMediaUploadStart(productId, data),
    broadcastMediaUploadComplete: (data: any) => productId && realtimeService?.broadcastMediaUploadComplete(productId, data),
    broadcastProductSaved: (data: any) => productId && realtimeService?.broadcastProductSaved(productId, data),
  };
}
