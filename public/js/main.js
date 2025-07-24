// Main JavaScript for Weather & UV Protection App

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Check if user has location stored
    checkStoredLocation();
    
    // Add loading states
    setupLoadingStates();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    const locationForm = document.getElementById('locationForm');
    const locationInput = document.getElementById('locationInput');
    
    if (locationForm) {
        locationForm.addEventListener('submit', handleLocationSearch);
    }
    
    if (locationInput) {
        // Add autocomplete functionality
        locationInput.addEventListener('input', debounce(handleLocationInput, 300));
        // Add keyboard navigation for autocomplete
        locationInput.addEventListener('keydown', handleKeyboardNavigation);
        // Clear the field only on the first mouse click
        let clearedOnce = false;
        locationInput.addEventListener('mousedown', function() {
            if (!clearedOnce) {
                locationInput.value = '';
                clearedOnce = true;
            }
        });
    }
    
    // Add click event for current location button
    const currentLocationBtn = document.getElementById('currentLocationBtn');
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', getCurrentLocation);
    }
}

/**
 * Handle location search form submission
 * @param {Event} event - Form submission event
 */
async function handleLocationSearch(event) {
    event.preventDefault();
    
    const locationInput = document.getElementById('locationInput');
    const location = locationInput.value.trim();
    
    if (!location) {
        showError('Please enter a location');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        // Check if input is coordinates
        if (isCoordinateFormat(location)) {
            const [lat, lon] = parseCoordinates(location);
            await fetchWeatherData(lat, lon, location);
        } else {
            // Geocode the location
            const coordinates = await geocodeLocation(location);
            if (coordinates) {
                await fetchWeatherData(coordinates.lat, coordinates.lon, location);
            } else {
                showError('Location not found. Please try a different search term.');
            }
        }
    } catch (error) {
        // Error handling for failed search
        showError('Failed to fetch weather data. Please try again.');
    } finally {
        hideLoading();
    }
}

/**
 * Handle location input for autocomplete
 * @param {Event} event - Input event
 */
function handleLocationInput(event) {
    const input = event.target.value.trim();
    
    if (input.length < 3) {
        hideAutocomplete();
        return;
    }
    
    // Here you could implement autocomplete functionality
    // For now, we'll just show a simple suggestion
    showAutocomplete(input);
}

/**
 * Handle keyboard navigation
 * @param {Event} event - Keydown event
 */
function handleKeyboardNavigation(event) {
    const autocompleteList = document.querySelector('.autocomplete-list');
    
    if (!autocompleteList) return;
    
    const items = autocompleteList.querySelectorAll('.autocomplete-item');
    const currentIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            navigateAutocomplete(items, currentIndex, 1);
            break;
        case 'ArrowUp':
            event.preventDefault();
            navigateAutocomplete(items, currentIndex, -1);
            break;
        case 'Enter':
            event.preventDefault();
            selectAutocompleteItem();
            break;
        case 'Escape':
            hideAutocomplete();
            break;
    }
}

/**
 * Navigate autocomplete list
 * @param {NodeList} items - Autocomplete items
 * @param {number} currentIndex - Current active index
 * @param {number} direction - Direction to navigate (1 for down, -1 for up)
 */
function navigateAutocomplete(items, currentIndex, direction) {
    items.forEach(item => item.classList.remove('active'));
    
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) {
        newIndex = items.length - 1;
    } else if (newIndex >= items.length) {
        newIndex = 0;
    }
    
    if (items[newIndex]) {
        items[newIndex].classList.add('active');
        items[newIndex].scrollIntoView({ block: 'nearest' });
    }
}

/**
 * Select autocomplete item
 */
function selectAutocompleteItem() {
    const activeItem = document.querySelector('.autocomplete-item.active');
    if (activeItem) {
        document.getElementById('locationInput').value = activeItem.textContent;
        hideAutocomplete();
        document.getElementById('locationForm').dispatchEvent(new Event('submit'));
    }
}

/**
 * Show autocomplete suggestions
 * @param {string} input - User input
 */
async function showAutocomplete(input) {
    // Hole echte Vorschläge von Nominatim
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&addressdetails=1&limit=5`);
    const data = await response.json();

    // Vorherige Liste entfernen
    hideAutocomplete();

    const autocompleteList = document.createElement('div');
    autocompleteList.className = 'autocomplete-list';

    data.forEach(place => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = place.display_name;
        item.addEventListener('click', () => {
            document.getElementById('locationInput').value = place.display_name;
            hideAutocomplete();
            document.getElementById('locationForm').dispatchEvent(new Event('submit'));
        });
        autocompleteList.appendChild(item);
    });

    const locationInput = document.getElementById('locationInput');
    const rect = locationInput.getBoundingClientRect();

    autocompleteList.style.position = 'fixed';
    autocompleteList.style.left = rect.left + 'px';
    autocompleteList.style.top = (rect.bottom + window.scrollY) + 'px';
    autocompleteList.style.width = rect.width + 'px';
    autocompleteList.style.zIndex = '99999';

    document.body.appendChild(autocompleteList);
}

/**
 * Hide autocomplete suggestions
 */
function hideAutocomplete() {
    const autocompleteList = document.querySelector('.autocomplete-list');
    if (autocompleteList) {
        autocompleteList.remove();
    }
}

/**
 * Check if input is in coordinate format
 * @param {string} input - Input string
 * @returns {boolean} True if coordinates format
 */
function isCoordinateFormat(input) {
    const coordinateRegex = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
    return coordinateRegex.test(input);
}

/**
 * Parse coordinates from string
 * @param {string} coordinates - Coordinate string
 * @returns {Array} [latitude, longitude]
 */
function parseCoordinates(coordinates) {
    const [lat, lon] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    return [lat, lon];
}

/**
 * Geocode location using OpenStreetMap Nominatim API
 * @param {string} location - Location string
 * @returns {Object|null} Coordinates object or null
 */
async function geocodeLocation(location) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Fetch weather data for coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} location - Location name
 */
async function fetchWeatherData(lat, lon, location) {
    try {
        // Kein Speichern mehr:
        // localStorage.setItem('lastLocation', JSON.stringify({ lat, lon, name: location }));
        // Redirect to weather page with coordinates
        window.location.href = `/weather?lat=${lat}&lon=${lon}&location=${encodeURIComponent(location)}`;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

/**
 * Get current location using browser geolocation
 */
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Reverse geocode to get location name
                const locationName = await reverseGeocode(latitude, longitude);
                await fetchWeatherData(latitude, longitude, locationName);
            } catch (error) {
                console.error('Error getting current location:', error);
                showError('Failed to get current location. Please try searching manually.');
            } finally {
                hideLoading();
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            hideLoading();
            
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    showError('Location access denied. Please search manually.');
                    break;
                case error.POSITION_UNAVAILABLE:
                    showError('Location information unavailable. Please search manually.');
                    break;
                case error.TIMEOUT:
                    showError('Location request timed out. Please search manually.');
                    break;
                default:
                    showError('An unknown error occurred. Please search manually.');
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

/**
 * Reverse geocode coordinates to location name
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Location name
 */
async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
        const data = await response.json();
        
        if (data && data.display_name) {
            return data.display_name.split(',')[0]; // Return city name
        }
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
}

/**
 * Check for stored location
 */
function checkStoredLocation() {}

/**
 * Show loading state
 */
function showLoading() {
    const searchBtn = document.querySelector('#locationForm button[type="submit"]');
    if (searchBtn) {
        searchBtn.innerHTML = 'Searching...';
        searchBtn.disabled = true;
    }
}

/**
 * Hide loading state
 */
function hideLoading() {
    const searchBtn = document.querySelector('#locationForm button[type="submit"]');
    if (searchBtn) {
        searchBtn.innerHTML = '<i class="fas fa-search me-2"></i>Search';
        searchBtn.disabled = false;
    }
}

/**
 * Setup loading states
 */
function setupLoadingStates() {
    // Add loading state to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                this.classList.add('loading');
            }
        });
    });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    // Remove existing error alerts
    const existingAlert = document.querySelector('.alert-danger');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create new error alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for autocomplete
const autocompleteCSS = `
    .autocomplete-list {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 10px 10px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .autocomplete-item {
        padding: 10px 15px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s;
    }
    
    .autocomplete-item:hover,
    .autocomplete-item.active {
        background-color: #f8f9fa;
    }
    
    .autocomplete-item:last-child {
        border-bottom: none;
    }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = autocompleteCSS;
document.head.appendChild(style);
