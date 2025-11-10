/**
 * KloGame Main Application
 */

import { getEditions, downloadEdition, recordVisit } from './api.js';
import { initMap, loadEditionOnMap, updateMarkerAfterVisit } from './map.js';
import {
    saveActiveEdition,
    getActiveEdition,
    saveEdition,
    getEdition,
    saveVisit,
    getLocationVisits,
    getStats,
    getSettings,
    saveSettings,
    isLocationComplete
} from './storage.js';
import { isWithinRange, formatDistance } from './gps.js';

// State
let activeEdition = null;
let selectedLocation = null;
let availableEditions = [];

// DOM Elements
const editionsList = document.getElementById('editions-list');
const activeEditionEl = document.getElementById('active-edition');
const modal = document.getElementById('visit-modal');
const modalLocationName = document.getElementById('modal-location-name');
const modalLocationInfo = document.getElementById('modal-location-info');
const visitHistory = document.getElementById('visit-history');
const peeBtn = document.getElementById('pee-btn');
const poopBtn = document.getElementById('poop-btn');
const closeModalBtn = document.getElementById('close-modal');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Stats elements
const totalPointsEl = document.getElementById('total-points');
const totalVisitsEl = document.getElementById('total-visits');
const peeCountEl = document.getElementById('pee-count');
const poopCountEl = document.getElementById('poop-count');
const locationsCountEl = document.getElementById('locations-count');

/**
 * Initialize the application
 */
async function init() {
    console.log('🚽 Initializing KloGame...');

    // Initialize map
    initMap();

    // Update stats display
    updateStatsDisplay();

    // Load editions from API
    await loadEditions();

    // Restore active edition from storage
    const savedEdition = getActiveEdition();
    if (savedEdition) {
        activeEdition = savedEdition;
        displayActiveEdition();
        loadEditionOnMap(activeEdition, handleLocationClick);
    }

    // Setup event listeners
    setupEventListeners();

    console.log('✅ KloGame initialized');
}

/**
 * Load editions from API
 */
async function loadEditions() {
    try {
        editionsList.innerHTML = '<div class="loading">Lade Editionen...</div>';

        availableEditions = await getEditions();

        editionsList.innerHTML = '';

        availableEditions.forEach(edition => {
            const card = createEditionCard(edition);
            editionsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading editions:', error);
        editionsList.innerHTML = '<div class="loading">Fehler beim Laden der Editionen</div>';
        showToast('Fehler beim Laden der Editionen', 'error');
    }
}

/**
 * Create edition card element
 */
function createEditionCard(edition) {
    const card = document.createElement('div');
    card.className = 'edition-card';
    if (activeEdition && activeEdition.id === edition.id) {
        card.classList.add('active');
    }

    card.innerHTML = `
        <div class="edition-header">
            <span class="edition-icon">${edition.icon}</span>
            <span class="edition-name">${edition.name}</span>
            <span class="edition-badge ${edition.type}">${edition.type}</span>
        </div>
        <div class="edition-description">${edition.description}</div>
        <div class="edition-meta">
            <span>Version ${edition.version}</span>
            <span>${edition.locations_count} Locations</span>
        </div>
    `;

    card.addEventListener('click', () => handleEditionSelect(edition));

    return card;
}

/**
 * Handle edition selection
 */
async function handleEditionSelect(editionMeta) {
    try {
        // Check if we have the full edition cached
        let edition = getEdition(editionMeta.id);

        if (!edition || !edition.locations) {
            // Download full edition
            showToast('Lade Edition...');
            edition = await downloadEdition(editionMeta.id);
            saveEdition(edition);
        }

        // Set as active
        activeEdition = edition;
        saveActiveEdition(edition);

        // Update UI
        displayActiveEdition();
        loadEditionOnMap(edition, handleLocationClick);

        // Update edition cards
        document.querySelectorAll('.edition-card').forEach(card => {
            card.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        showToast(`Edition "${edition.name}" geladen`);
    } catch (error) {
        console.error('Error loading edition:', error);
        showToast('Fehler beim Laden der Edition', 'error');
    }
}

/**
 * Display active edition info
 */
function displayActiveEdition() {
    if (!activeEdition) {
        activeEditionEl.innerHTML = '<p class="no-selection">Keine Edition ausgewählt</p>';
        return;
    }

    const stats = getStats();
    const editionVisits = getLocationVisits(activeEdition.id);
    const visitedCount = new Set(editionVisits.map(v => v.locationId)).size;
    const progress = (visitedCount / activeEdition.locations.length) * 100;

    activeEditionEl.innerHTML = `
        <div class="active-edition-info">
            <h3>${activeEdition.icon} ${activeEdition.name}</h3>
            <p>${activeEdition.description}</p>
            <div style="margin-top: 0.75rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                    <span>Fortschritt</span>
                    <span>${visitedCount} / ${activeEdition.locations.length}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Handle location click
 */
function handleLocationClick(location) {
    selectedLocation = location;
    showLocationModal(location);
}

/**
 * Show location modal
 */
async function showLocationModal(location) {
    // Set location name
    modalLocationName.textContent = location.name;

    // Set location info
    const metadata = Object.entries(location.metadata)
        .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
        .join('');
    modalLocationInfo.innerHTML = metadata;

    // Check if location is already visited
    const alreadyVisited = isLocationComplete(activeEdition.id, location.id);

    // Set points (Kacken includes Pinkeln)
    const peePoints = location.points.pee;
    const poopPoints = location.points.pee + location.points.poop; // Combined!

    document.getElementById('pee-points').textContent = `+${peePoints}`;
    document.getElementById('poop-points').textContent = `+${poopPoints}`;

    // Check GPS if geo mode is enabled
    const settings = getSettings();
    const geoModeActive = settings.geoMode || settings.hardcoreMode;

    let withinRange = true;
    let distanceInfo = '';

    if (geoModeActive) {
        try {
            const result = await isWithinRange(location.coordinates, settings.maxDistance);
            withinRange = result.withinRange;
            distanceInfo = `<p style="margin-top: 0.5rem; color: ${withinRange ? 'var(--success)' : 'var(--warning)'};">
                📍 Entfernung: ${formatDistance(result.distance)}
                ${withinRange ? '✓ In Reichweite' : '✗ Zu weit entfernt'}
            </p>`;
        } catch (error) {
            console.error('GPS Error:', error);
            distanceInfo = '<p style="margin-top: 0.5rem; color: var(--error);">📍 GPS nicht verfügbar</p>';
            withinRange = false;
        }
    }

    modalLocationInfo.innerHTML += distanceInfo;

    // Disable buttons if already visited or not in range
    peeBtn.disabled = alreadyVisited || !withinRange;
    poopBtn.disabled = alreadyVisited || !withinRange;

    if (alreadyVisited) {
        modalLocationInfo.innerHTML += '<p style="margin-top: 0.5rem; color: var(--success); font-weight: 600;">✓ Bereits besucht</p>';
    }

    // Load visit history
    loadVisitHistory(location);

    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Load visit history for location
 */
function loadVisitHistory(location) {
    const visits = getLocationVisits(activeEdition.id, location.id);

    if (visits.length === 0) {
        visitHistory.innerHTML = '<p style="color: var(--text-dim); font-size: 0.9rem;">Noch keine Besuche</p>';
        return;
    }

    visitHistory.innerHTML = '<h4>Besuchshistorie</h4>';
    visits.forEach(visit => {
        const entry = document.createElement('div');
        entry.className = 'visit-entry';
        entry.innerHTML = `
            <span class="visit-type">${visit.type === 'pinkeln' ? '🟡 Pinkeln' : '🟤 Kacken'}</span>
            <span class="visit-points">+${visit.points}</span>
        `;
        visitHistory.appendChild(entry);
    });
}

/**
 * Handle visit action
 */
async function handleVisit(type) {
    if (!selectedLocation || !activeEdition) return;

    // Check if already visited
    if (isLocationComplete(activeEdition.id, selectedLocation.id)) {
        showToast('Location bereits besucht!', 'error');
        return;
    }

    // Calculate points: Kacken = Pinkeln + Kacken points
    let points;
    if (type === 'pinkeln') {
        points = selectedLocation.points.pee;
    } else {
        // Kacken includes both!
        points = selectedLocation.points.pee + selectedLocation.points.poop;
    }

    try {
        // Save visit locally
        saveVisit({
            editionId: activeEdition.id,
            locationId: selectedLocation.id,
            locationName: selectedLocation.name,
            type,
            points
        });

        // Track to server (async, don't wait)
        recordVisit(
            activeEdition.id,
            selectedLocation.id,
            selectedLocation.name,
            type,
            points
        ).catch(err => console.error('Failed to track visit on server:', err));

        // Update UI
        updateStatsDisplay();
        displayActiveEdition();
        updateMarkerAfterVisit(selectedLocation.id);

        // Close modal and show success
        modal.classList.add('hidden');

        // Show success message
        const emoji = type === 'pinkeln' ? '🟡' : '🟤';
        showToast(`${emoji} +${points} Punkte! Location abgehakt! 🎉`);
    } catch (error) {
        console.error('Error recording visit:', error);
        showToast('Fehler beim Speichern', 'error');
    }
}

/**
 * Update stats display
 */
function updateStatsDisplay() {
    const stats = getStats();
    totalPointsEl.textContent = stats.totalPoints.toLocaleString();
    totalVisitsEl.textContent = stats.totalVisits.toLocaleString();
    peeCountEl.textContent = stats.peeCount.toLocaleString();
    poopCountEl.textContent = stats.poopCount.toLocaleString();
    locationsCountEl.textContent = stats.locationsCount.toLocaleString();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Close modal
    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Visit buttons
    peeBtn.addEventListener('click', () => handleVisit('pinkeln'));
    poopBtn.addEventListener('click', () => handleVisit('kacken'));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.add('hidden');
        }
    });

    // Settings toggles
    const geoModeToggle = document.getElementById('geo-mode-toggle');
    const hardcoreModeToggle = document.getElementById('hardcore-mode-toggle');

    // Load settings
    const settings = getSettings();
    geoModeToggle.checked = settings.geoMode;
    hardcoreModeToggle.checked = settings.hardcoreMode;

    // Disable geo mode toggle if hardcore is on
    if (settings.hardcoreMode) {
        geoModeToggle.checked = true;
        geoModeToggle.disabled = true;
    }

    // Geo mode toggle
    geoModeToggle.addEventListener('change', (e) => {
        const newSettings = getSettings();
        newSettings.geoMode = e.target.checked;
        saveSettings(newSettings);
        showToast(e.target.checked ? '📍 Geo-Modus aktiviert' : 'Geo-Modus deaktiviert');
    });

    // Hardcore mode toggle
    hardcoreModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Confirm hardcore mode
            if (confirm('🔥 Hardcore-Modus aktivieren?\n\nDies aktiviert den Geo-Modus permanent und kann NICHT mehr deaktiviert werden!')) {
                const newSettings = getSettings();
                newSettings.hardcoreMode = true;
                newSettings.geoMode = true;
                saveSettings(newSettings);
                geoModeToggle.checked = true;
                geoModeToggle.disabled = true;
                showToast('🔥 Hardcore-Modus aktiviert! Geo-Modus ist nun permanent an!', 'warning');
            } else {
                e.target.checked = false;
            }
        } else {
            // Cannot disable hardcore mode
            e.target.checked = true;
            showToast('Hardcore-Modus kann nicht deaktiviert werden!', 'error');
        }
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
