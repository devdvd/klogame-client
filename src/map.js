/**
 * Map Management with Leaflet
 */

import { isLocationComplete } from './storage.js';

let map = null;
let markers = [];
let currentEdition = null;

/**
 * Initialize the map
 */
export function initMap() {
    // Create map centered on Germany
    map = L.map('map').setView([51.1657, 10.4515], 6);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    return map;
}

/**
 * Create custom marker icon
 */
function createMarkerIcon(visited = false) {
    const color = visited ? '#10b981' : '#6366f1';
    const html = `
        <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                font-size: 16px;
            ">🚽</div>
        </div>
    `;

    return L.divIcon({
        html: html,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
}

/**
 * Load edition on map
 */
export function loadEditionOnMap(edition, onLocationClick) {
    currentEdition = edition;

    // Clear existing markers
    clearMarkers();

    // Add markers for each location
    edition.locations.forEach(location => {
        const visited = isLocationComplete(edition.id, location.id);
        const icon = createMarkerIcon(visited);

        const marker = L.marker(location.coordinates, { icon })
            .addTo(map);

        // Create popup content
        const popupContent = createPopupContent(location, visited);
        marker.bindPopup(popupContent);

        // Add click handler
        marker.on('click', () => {
            if (onLocationClick) {
                onLocationClick(location);
            }
        });

        markers.push({
            marker,
            location,
            visited
        });
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map(m => m.marker.getLatLng()));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

/**
 * Create popup content for a location
 */
function createPopupContent(location, visited) {
    const metadata = Object.entries(location.metadata)
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join('<br>');

    return `
        <div style="min-width: 200px;">
            <h3 style="margin: 0 0 0.5rem 0; color: #1e293b;">${location.name}</h3>
            ${metadata ? `<div style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #475569;">${metadata}</div>` : ''}
            <div style="display: flex; gap: 1rem; margin-top: 0.75rem;">
                <div>
                    <div style="font-size: 0.8rem; color: #64748b;">Pinkeln</div>
                    <div style="font-weight: 600; color: #f59e0b;">${location.points.pee} Punkte</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: #64748b;">Kacken</div>
                    <div style="font-weight: 600; color: #8b5cf6;">${location.points.poop} Punkte</div>
                </div>
            </div>
            ${visited ? '<div style="margin-top: 0.5rem; color: #10b981; font-weight: 600;">✓ Besucht</div>' : ''}
        </div>
    `;
}

/**
 * Update marker after visit
 */
export function updateMarkerAfterVisit(locationId) {
    if (!currentEdition) return;

    const markerData = markers.find(m => m.location.id === locationId);
    if (!markerData) return;

    // Update marker icon to visited
    const newIcon = createMarkerIcon(true);
    markerData.marker.setIcon(newIcon);
    markerData.visited = true;

    // Update popup content
    const popupContent = createPopupContent(markerData.location, true);
    markerData.marker.setPopupContent(popupContent);
}

/**
 * Clear all markers from map
 */
export function clearMarkers() {
    markers.forEach(({ marker }) => {
        map.removeLayer(marker);
    });
    markers = [];
}

/**
 * Zoom to location
 */
export function zoomToLocation(locationId) {
    const markerData = markers.find(m => m.location.id === locationId);
    if (markerData) {
        map.setView(markerData.marker.getLatLng(), 15);
        markerData.marker.openPopup();
    }
}

/**
 * Get map instance
 */
export function getMap() {
    return map;
}

/**
 * Resize map (useful after container resize)
 */
export function resizeMap() {
    if (map) {
        map.invalidateSize();
    }
}
