/**
 * Cookie Polling Manager
 * 
 * Purpose: Waits for Meta cookies (_fbp, _fbc) before firing CAPI events.
 * Implements event queueing for events fired before cookies are ready.
 */

interface QueuedEvent {
  eventName: string;
  userData?: any;
  timestamp: number;
}

class CookiePollingManager {
  private isPolling = false;
  private cookiesReady = false;
  private eventQueue: QueuedEvent[] = [];
  private pollingInterval: number | null = null;
  private checkCount = 0;
  private readonly maxChecks = 20;
  private readonly checkIntervalMs = 100;

  getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(name + '=')) {
        return trimmed.substring(name.length + 1);
      }
    }
    return undefined;
  }

  areCookiesReady(): boolean {
    const fbp = this.getCookie('_fbp');
    const fbc = this.getCookie('_fbc');
    return !!(fbp || fbc);
  }

  startPolling(onReady: () => void): void {
    if (this.isPolling || this.cookiesReady) {
      return;
    }

    if (this.areCookiesReady()) {
      this.cookiesReady = true;
      onReady();
      return;
    }

    this.isPolling = true;
    this.checkCount = 0;

    this.pollingInterval = window.setInterval(() => {
      this.checkCount++;

      if (this.areCookiesReady()) {
        this.stopPolling();
        this.cookiesReady = true;
        onReady();
        return;
      }

      if (this.checkCount >= this.maxChecks) {
        this.stopPolling();
        this.cookiesReady = true;
        onReady();
      }
    }, this.checkIntervalMs);
  }

  stopPolling(): void {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
    }
  }

  queueEvent(eventName: string, userData?: any): void {
    this.eventQueue.push({
      eventName,
      userData,
      timestamp: Date.now()
    });
  }

  getQueuedEvents(): QueuedEvent[] {
    return [...this.eventQueue];
  }

  clearQueue(): void {
    this.eventQueue = [];
  }

  isCookiesReady(): boolean {
    return this.cookiesReady;
  }
}

export const cookiePolling = new CookiePollingManager();
