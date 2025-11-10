/**
 * KloGame API Client
 */

const API_URL = 'http://localhost:3000';

/**
 * Get all available editions (metadata only)
 */
export async function getEditions() {
    try {
        const response = await fetch(`${API_URL}/api/editions`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.editions;
    } catch (error) {
        console.error('Error fetching editions:', error);
        throw error;
    }
}

/**
 * Get edition details (metadata only, no locations)
 */
export async function getEditionDetails(editionId) {
    try {
        const response = await fetch(`${API_URL}/api/editions/${editionId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching edition details:', error);
        throw error;
    }
}

/**
 * Download full edition with all locations
 */
export async function downloadEdition(editionId) {
    try {
        const response = await fetch(`${API_URL}/api/editions/${editionId}/download`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error downloading edition:', error);
        throw error;
    }
}

/**
 * Track an analytics event
 */
export async function trackEvent(event) {
    try {
        const response = await fetch(`${API_URL}/api/analytics/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error tracking event:', error);
        throw error;
    }
}

/**
 * Record a visit to a location
 */
export async function recordVisit(editionId, locationId, locationName, type, points) {
    return trackEvent({
        event: 'visit_recorded',
        edition_id: editionId,
        location_id: locationId,
        location: locationName,
        type: type,
        points: points,
        timestamp: new Date().toISOString()
    });
}

/**
 * Get analytics statistics
 */
export async function getStats() {
    try {
        const response = await fetch(`${API_URL}/api/analytics/stats`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
}

/**
 * Health check
 */
export async function healthCheck() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error checking health:', error);
        throw error;
    }
}
