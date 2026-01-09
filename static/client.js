// Client-side JavaScript for Ocean Activity Guide
// Calls Python Flask backend API

let autocompleteTimeout = null;
let selectedIndex = -1;

async function fetchAutocomplete(query) {
    try {
        const response = await fetch(`/api/autocomplete?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && data.predictions) {
            return data.predictions;
        }
        return [];
    } catch (error) {
        return [];
    }
}

function showAutocompleteDropdown(predictions) {
    const dropdown = document.getElementById('autocompleteDropdown');
    dropdown.innerHTML = '';
    
    if (predictions.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }
    
    predictions.forEach((prediction, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.dataset.index = index;
        
        const mainText = prediction.structured_formatting?.main_text || prediction.description.split(',')[0];
        const secondaryText = prediction.structured_formatting?.secondary_text || prediction.description.split(',').slice(1).join(',').trim();
        
        item.innerHTML = `
            <div class="autocomplete-item-main">${mainText}</div>
            ${secondaryText ? `<div class="autocomplete-item-secondary">${secondaryText}</div>` : ''}
        `;
        
        item.addEventListener('click', () => {
            document.getElementById('locationInput').value = prediction.description;
            dropdown.classList.add('hidden');
            selectedIndex = -1;
            searchLocation();
        });
        
        dropdown.appendChild(item);
    });
    
    dropdown.classList.remove('hidden');
}

function handleLocationInput() {
    const input = document.getElementById('locationInput');
    const query = input.value.trim();
    
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
    }
    
    if (query.length < 2) {
        document.getElementById('autocompleteDropdown').classList.add('hidden');
        selectedIndex = -1;
        return;
    }
    
    autocompleteTimeout = setTimeout(async () => {
        const predictions = await fetchAutocomplete(query);
        showAutocompleteDropdown(predictions);
    }, 300);
}

async function searchLocation() {
    const locationInput = document.getElementById('locationInput');
    const location = locationInput.value.trim();
    
    if (!location) {
        alert('Please enter a location');
        return;
    }
    
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');
    
    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    resultsDiv.classList.add('hidden');
    
    try {
        // Call Python backend API
        const response = await fetch(`/api/conditions?location=${encodeURIComponent(location)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch conditions');
        }
        
        // Display results
        displayResults(data.conditions, data.activities);
    } catch (error) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.classList.remove('hidden');
    }
}

function displayResults(conditions, activities) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    
    loadingDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    resultsDiv.classList.remove('hidden');
    
    // Display conditions
    document.getElementById('temperature').textContent = `${conditions.temperature}°F`;
    document.getElementById('waterTemperature').textContent = `${conditions.waterTemperature}°F`;
    document.getElementById('waveHeight').textContent = `${conditions.waveHeight} ft`;
    document.getElementById('swellDirection').textContent = conditions.swellDirection;
    document.getElementById('windSpeed').textContent = `${conditions.windSpeed} mph`;
    document.getElementById('windDirection').textContent = conditions.windDirection;
    document.getElementById('visibility').textContent = `${conditions.visibility} ft`;
    document.getElementById('tideLevel').textContent = conditions.tideLevel;
    document.getElementById('currentStrength').textContent = conditions.currentStrength;
    
    // UV Index with warning styling
    const uvElement = document.getElementById('uvIndex');
    uvElement.textContent = conditions.uvIndex;
    // Reset styles first
    uvElement.parentElement.style.background = '';
    uvElement.style.color = '';
    if (conditions.uvIndex >= 8) {
        uvElement.parentElement.style.background = '#fff3cd';
        uvElement.style.color = '#856404';
    } else if (conditions.uvIndex >= 6) {
        uvElement.parentElement.style.background = '#fff8e1';
        uvElement.style.color = '#f57c00';
    }
    
    document.getElementById('cloudCover').textContent = conditions.cloudCover;
    
    // Precipitation with warning styling
    const precipElement = document.getElementById('precipitation');
    precipElement.textContent = conditions.precipitation;
    // Reset styles first
    precipElement.parentElement.style.background = '';
    precipElement.style.color = '';
    if (conditions.hasPrecipitation) {
        precipElement.parentElement.style.background = '#e3f2fd';
        precipElement.style.color = '#1976d2';
    }
    
    document.getElementById('pressure').textContent = conditions.pressure;
    
    // Current strength warning for high currents
    const currentElement = document.getElementById('currentStrength');
    // Reset styles first
    currentElement.parentElement.style.background = '';
    currentElement.style.color = '';
    if (conditions.currentValue >= 3) {
        currentElement.parentElement.style.background = '#ffebee';
        currentElement.style.color = '#c62828';
    }
    
    // Display best activity
    const bestActivity = activities[0];
    document.getElementById('bestActivityIcon').textContent = bestActivity.icon;
    document.getElementById('bestActivityName').textContent = bestActivity.name;
    document.getElementById('bestActivityDescription').textContent = bestActivity.description;
    document.getElementById('scoreBadge').textContent = `${bestActivity.score}/100`;
    
    // Display all activities
    const activitiesGrid = document.getElementById('activitiesGrid');
    activitiesGrid.innerHTML = '';
    
    activities.forEach(activity => {
        const activityCard = document.createElement('div');
        activityCard.className = 'activity-card';
        
        const scoreColor = activity.score >= 70 ? '#26a69a' : 
                          activity.score >= 50 ? '#f57c00' : '#d32f2f';
        
        activityCard.innerHTML = `
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-info">
                <h3>${activity.name}</h3>
                <p>${activity.description}</p>
                <div class="activity-score" style="color: ${scoreColor}">
                    Score: ${activity.score}/100
                </div>
            </div>
        `;
        
        activitiesGrid.appendChild(activityCard);
    });
    
    // Add timestamp
    const timestamp = new Date().toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
    
    // Add timestamp to conditions card if it doesn't exist
    let timestampEl = document.getElementById('timestamp');
    if (!timestampEl) {
        timestampEl = document.createElement('div');
        timestampEl.id = 'timestamp';
        timestampEl.className = 'timestamp';
        document.querySelector('.conditions-card').appendChild(timestampEl);
    }
    timestampEl.textContent = `Last updated: ${timestamp}`;
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click', () => {
    document.getElementById('autocompleteDropdown').classList.add('hidden');
    searchLocation();
});

const locationInput = document.getElementById('locationInput');
locationInput.addEventListener('input', handleLocationInput);
locationInput.addEventListener('focus', () => {
    const query = locationInput.value.trim();
    if (query.length >= 2) {
        handleLocationInput();
    }
});
locationInput.addEventListener('keydown', (e) => {
    const dropdown = document.getElementById('autocompleteDropdown');
    const items = dropdown.querySelectorAll('.autocomplete-item');
    
    if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
            items[selectedIndex].click();
        } else {
            dropdown.classList.add('hidden');
            searchLocation();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelectedItem(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelectedItem(items);
    } else if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
        selectedIndex = -1;
    }
});

function updateSelectedItem(items) {
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.style.background = '#e0f2f1';
        } else {
            item.style.background = '';
        }
    });
    if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const locationSection = document.querySelector('.location-input-wrapper');
    if (!locationSection.contains(e.target)) {
        document.getElementById('autocompleteDropdown').classList.add('hidden');
        selectedIndex = -1;
    }
});

// Load default location on page load
window.addEventListener('DOMContentLoaded', () => {
    searchLocation();
});

