/**
 * KloGame API TypeScript Types
 *
 * Use these types in your client application for type safety.
 */

// ============================================
// Edition Types
// ============================================

export type EditionType = 'free' | 'premium' | 'seasonal';

export interface UnlockConditions {
  payment_required: boolean;
  date_range: {
    start: string; // ISO date string
    end: string;   // ISO date string
  } | null;
  requires_editions: string[]; // Edition IDs
}

export interface EditionMetadata {
  id: string;
  name: string;
  description: string;
  type: EditionType;
  version: string;
  icon: string;
  unlock_conditions: UnlockConditions;
  parent_editions: string[];
  locations_count: number;
}

export interface Location {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  metadata: Record<string, any>;
  points: {
    pee: number;
    poop: number;
  };
}

export interface Edition extends EditionMetadata {
  locations: Location[];
}

// ============================================
// API Response Types
// ============================================

export interface EditionsResponse {
  editions: EditionMetadata[];
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  status: string;
  endpoints: {
    editions: string;
    edition_details: string;
    edition_download: string;
    analytics_track: string;
    analytics_stats: string;
    health: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
}

// ============================================
// Analytics Types
// ============================================

export type VisitType = 'pinkeln' | 'kacken';

export interface AnalyticsEvent {
  event: string;
  edition_id?: string;
  location?: string;
  type?: VisitType;
  points?: number;
  timestamp?: string;
  [key: string]: any; // Allow additional fields
}

export interface SavedAnalyticsEvent extends AnalyticsEvent {
  id: string;
  timestamp: string; // Always present in saved events
}

export interface AnalyticsStats {
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_edition: Record<string, number>;
  recent_events: SavedAnalyticsEvent[];
}

export interface TrackEventResponse {
  success: boolean;
  error?: string;
}

// ============================================
// Client Helper Class
// ============================================

export class KloGameClient {
  private apiUrl: string;

  constructor(apiUrl: string = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  /**
   * Get API info
   */
  async getApiInfo(): Promise<ApiInfoResponse> {
    const res = await fetch(`${this.apiUrl}/`);
    return await res.json();
  }

  /**
   * Health check
   */
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${this.apiUrl}/health`);
    return await res.json();
  }

  /**
   * Get all editions (metadata only)
   */
  async getEditions(): Promise<EditionMetadata[]> {
    const res = await fetch(`${this.apiUrl}/api/editions`);
    const data: EditionsResponse = await res.json();
    return data.editions;
  }

  /**
   * Get edition details (metadata only, no locations)
   */
  async getEditionDetails(editionId: string): Promise<EditionMetadata> {
    const res = await fetch(`${this.apiUrl}/api/editions/${editionId}`);
    if (!res.ok) {
      const error: ErrorResponse = await res.json();
      throw new Error(error.error);
    }
    return await res.json();
  }

  /**
   * Download full edition with all locations
   */
  async downloadEdition(editionId: string): Promise<Edition> {
    const res = await fetch(`${this.apiUrl}/api/editions/${editionId}/download`);
    if (!res.ok) {
      const error: ErrorResponse = await res.json();
      throw new Error(error.error);
    }
    return await res.json();
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<TrackEventResponse> {
    const res = await fetch(`${this.apiUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return await res.json();
  }

  /**
   * Get analytics statistics
   */
  async getStats(): Promise<AnalyticsStats> {
    const res = await fetch(`${this.apiUrl}/api/analytics/stats`);
    return await res.json();
  }

  /**
   * Helper: Record a visit
   */
  async recordVisit(
    editionId: string,
    locationId: string,
    locationName: string,
    type: VisitType,
    points: number
  ): Promise<TrackEventResponse> {
    return this.trackEvent({
      event: 'visit_recorded',
      edition_id: editionId,
      location_id: locationId,
      location: locationName,
      type,
      points
    });
  }

  /**
   * Helper: Track edition download
   */
  async trackEditionDownload(editionId: string): Promise<TrackEventResponse> {
    return this.trackEvent({
      event: 'edition_downloaded',
      edition_id: editionId
    });
  }

  /**
   * Helper: Track edition activation
   */
  async trackEditionActivation(editionId: string): Promise<TrackEventResponse> {
    return this.trackEvent({
      event: 'edition_activated',
      edition_id: editionId
    });
  }
}

// ============================================
// Example Usage
// ============================================

/*
// Initialize client
const client = new KloGameClient('http://localhost:3000');

// Get all editions
const editions = await client.getEditions();
console.log(editions);

// Download specific edition
const bundesliga = await client.downloadEdition('bundesliga-2024-25');
console.log(bundesliga.locations);

// Record a visit
await client.recordVisit(
  'bundesliga-2024-25',
  'allianz-arena',
  'Allianz Arena',
  'kacken',
  25
);

// Get stats
const stats = await client.getStats();
console.log(`Total events: ${stats.total_events}`);
*/
