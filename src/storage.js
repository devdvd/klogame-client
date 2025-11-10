/**
 * LocalStorage Management for KloGame
 */

const STORAGE_KEYS = {
    ACTIVE_EDITION: 'klogame_active_edition',
    EDITIONS: 'klogame_editions',
    VISITS: 'klogame_visits',
    STATS: 'klogame_stats',
    SETTINGS: 'klogame_settings'
};

/**
 * Save active edition to localStorage
 */
export function saveActiveEdition(edition) {
    try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_EDITION, JSON.stringify(edition));
    } catch (error) {
        console.error('Error saving active edition:', error);
    }
}

/**
 * Get active edition from localStorage
 */
export function getActiveEdition() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_EDITION);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting active edition:', error);
        return null;
    }
}

/**
 * Save edition to localStorage
 */
export function saveEdition(edition) {
    try {
        const editions = getEditions();
        editions[edition.id] = edition;
        localStorage.setItem(STORAGE_KEYS.EDITIONS, JSON.stringify(editions));
    } catch (error) {
        console.error('Error saving edition:', error);
    }
}

/**
 * Get all saved editions
 */
export function getEditions() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.EDITIONS);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error getting editions:', error);
        return {};
    }
}

/**
 * Get a specific edition by ID
 */
export function getEdition(editionId) {
    const editions = getEditions();
    return editions[editionId] || null;
}

/**
 * Save a visit
 */
export function saveVisit(visit) {
    try {
        const visits = getVisits();
        visits.push({
            ...visit,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
        updateStats(visit);
    } catch (error) {
        console.error('Error saving visit:', error);
    }
}

/**
 * Get all visits
 */
export function getVisits() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.VISITS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting visits:', error);
        return [];
    }
}

/**
 * Get visits for a specific location
 */
export function getLocationVisits(editionId, locationId) {
    const visits = getVisits();
    return visits.filter(v => v.editionId === editionId && v.locationId === locationId);
}

/**
 * Check if location has been visited
 */
export function hasVisited(editionId, locationId) {
    const visits = getLocationVisits(editionId, locationId);
    return visits.length > 0;
}

/**
 * Update statistics
 */
function updateStats(visit) {
    try {
        const stats = getStats();

        // Update total points
        stats.totalPoints = (stats.totalPoints || 0) + visit.points;

        // Update total visits
        stats.totalVisits = (stats.totalVisits || 0) + 1;

        // Update visit type counts
        if (visit.type === 'pinkeln') {
            stats.peeCount = (stats.peeCount || 0) + 1;
        } else if (visit.type === 'kacken') {
            stats.poopCount = (stats.poopCount || 0) + 1;
        }

        // Track unique locations
        if (!stats.visitedLocations) {
            stats.visitedLocations = {};
        }
        const key = `${visit.editionId}:${visit.locationId}`;
        if (!stats.visitedLocations[key]) {
            stats.visitedLocations[key] = true;
            stats.locationsCount = Object.keys(stats.visitedLocations).length;
        }

        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

/**
 * Get statistics
 */
export function getStats() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.STATS);
        return data ? JSON.parse(data) : {
            totalPoints: 0,
            totalVisits: 0,
            peeCount: 0,
            poopCount: 0,
            locationsCount: 0,
            visitedLocations: {}
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return {
            totalPoints: 0,
            totalVisits: 0,
            peeCount: 0,
            poopCount: 0,
            locationsCount: 0,
            visitedLocations: {}
        };
    }
}

/**
 * Clear all data
 */
export function clearAll() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

/**
 * Export data (for backup)
 */
export function exportData() {
    return {
        activeEdition: getActiveEdition(),
        editions: getEditions(),
        visits: getVisits(),
        stats: getStats()
    };
}

/**
 * Import data (from backup)
 */
export function importData(data) {
    try {
        if (data.activeEdition) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_EDITION, JSON.stringify(data.activeEdition));
        }
        if (data.editions) {
            localStorage.setItem(STORAGE_KEYS.EDITIONS, JSON.stringify(data.editions));
        }
        if (data.visits) {
            localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(data.visits));
        }
        if (data.stats) {
            localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
        }
    } catch (error) {
        console.error('Error importing data:', error);
    }
}

/**
 * Get game settings
 */
export function getSettings() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            geoMode: false,
            hardcoreMode: false,
            maxDistance: 100 // meters
        };
    } catch (error) {
        console.error('Error getting settings:', error);
        return {
            geoMode: false,
            hardcoreMode: false,
            maxDistance: 100
        };
    }
}

/**
 * Save game settings
 */
export function saveSettings(settings) {
    try {
        // If hardcore mode is enabled, it cannot be disabled
        const currentSettings = getSettings();
        if (currentSettings.hardcoreMode && !settings.hardcoreMode) {
            console.warn('Cannot disable hardcore mode once enabled');
            settings.hardcoreMode = true;
        }

        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

/**
 * Check if location has been visited with specific type
 */
export function hasVisitedWithType(editionId, locationId, type) {
    const visits = getLocationVisits(editionId, locationId);
    return visits.some(v => v.type === type);
}

/**
 * Check if location is fully visited (can't visit anymore)
 */
export function isLocationComplete(editionId, locationId) {
    const visits = getLocationVisits(editionId, locationId);
    // Location is complete if any visit exists (one-time visit rule)
    return visits.length > 0;
}
