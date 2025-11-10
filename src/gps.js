/**
 * GPS and Geolocation utilities
 */

/**
 * Get user's current position
 */
export function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Check if user is within range of a location
 */
export async function isWithinRange(locationCoords, maxDistance = 100) {
    try {
        const userPos = await getCurrentPosition();
        const distance = calculateDistance(
            userPos.latitude,
            userPos.longitude,
            locationCoords[0],
            locationCoords[1]
        );

        return {
            withinRange: distance <= maxDistance,
            distance: Math.round(distance),
            userPosition: userPos
        };
    } catch (error) {
        console.error('Error checking range:', error);
        throw error;
    }
}

/**
 * Format distance for display
 */
export function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Watch user position (continuous tracking)
 */
export function watchPosition(callback, errorCallback) {
    if (!navigator.geolocation) {
        errorCallback(new Error('Geolocation not supported'));
        return null;
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            });
        },
        errorCallback,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
        }
    );

    return watchId;
}

/**
 * Stop watching position
 */
export function clearWatch(watchId) {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
}
