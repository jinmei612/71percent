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
    
    predictions.forEach((prediction) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        
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

function getSuitabilityIndicator(score) {
    // Determine suitability indicator based on score
    const numScore = typeof score === 'number' ? score : 0;
    
    if (numScore >= 70) {
        return { text: 'Recommended', class: 'suitability-recommended' };
    } else if (numScore >= 50) {
        return { text: 'Suitable', class: 'suitability-suitable' };
    } else {
        return { text: 'Do not go', class: 'suitability-do-not-go' };
    }
}

function checkSevereConditions(conditions) {
    // Check for severe/dangerous conditions
    const severeReasons = [];
    
    // Very high waves (>10 ft)
    if (conditions.waveHeight && conditions.waveHeight > 10) {
        severeReasons.push(`Extremely high waves (${conditions.waveHeight.toFixed(2)} ft) - Dangerous surf conditions`);
    }
    
    // Very strong currents (>4 knots)
    if (conditions.currentValue && conditions.currentValue > 4) {
        severeReasons.push(`Very strong currents (${conditions.currentValue.toFixed(2)} knots) - High risk of being swept away`);
    }
    
    // Severe weather (heavy precipitation)
    if (conditions.hasPrecipitation && conditions.precipitation) {
        const precipValue = parseFloat(conditions.precipitation.replace(/[^0-9.]/g, ''));
        if (precipValue > 0.5) {
            severeReasons.push(`Heavy precipitation (${conditions.precipitation}) - Poor visibility and safety risks`);
        }
    }
    
    // Extreme wind speeds (>30 mph)
    if (conditions.windSpeed && conditions.windSpeed > 30) {
        severeReasons.push(`Extreme wind speeds (${conditions.windSpeed.toFixed(2)} mph) - Dangerous conditions`);
    }
    
    // Very high UV (>11 - extreme)
    if (conditions.uvIndex && conditions.uvIndex >= 11) {
        severeReasons.push(`Extreme UV index (${conditions.uvIndex}) - Severe sun exposure risk`);
    }
    
    // Very low visibility (<10 ft)
    if (conditions.visibility && conditions.visibility < 10) {
        severeReasons.push(`Very low visibility (${conditions.visibility.toFixed(2)} ft) - Dangerous conditions`);
    }
    
    // Very high waves combined with strong currents
    if (conditions.waveHeight && conditions.waveHeight > 8 && conditions.currentValue && conditions.currentValue > 3) {
        severeReasons.push(`High waves combined with strong currents - Extremely dangerous conditions`);
    }
    
    return severeReasons;
}

function showSevereWarning(reasons) {
    const popup = document.getElementById('severeWarningPopup');
    const reasonsContainer = document.getElementById('severeWarningReasons');
    
    if (reasons.length > 0) {
        reasonsContainer.innerHTML = '<p><strong>Reasons:</strong></p><ul>' + 
            reasons.map(reason => `<li>${reason}</li>`).join('') + 
            '</ul>';
        popup.classList.remove('hidden');
    }
}

function displayResults(conditions, activities) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    
    loadingDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    resultsDiv.classList.remove('hidden');
    
    // Check for severe conditions and show warning
    const severeReasons = checkSevereConditions(conditions);
    if (severeReasons.length > 0) {
        showSevereWarning(severeReasons);
    }
    
    // Helper function to check if a value has data
    function hasData(value) {
        if (value === null || value === undefined || value === '' || value === '--') {
            return false;
        }
        // For numeric values, check if it's a valid number (including 0)
        if (typeof value === 'number') {
            return !isNaN(value);
        }
        // For strings that might represent numbers, check if they're valid
        if (typeof value === 'string' && value.trim() !== '') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                return true;
            }
        }
        return true; // Non-empty string or other valid type
    }
    
    // Helper function to show/hide condition item based on data availability
    function setConditionVisibility(elementId, value, formatter) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const conditionItem = element.closest('.condition-item');
        if (!conditionItem) return;
        
        if (hasData(value)) {
            element.textContent = formatter ? formatter(value) : value;
            conditionItem.style.display = '';
        } else {
            conditionItem.style.display = 'none';
        }
    }
    
    // Display conditions (formatted to 2 decimal places) - only show if data exists
    setConditionVisibility('waveHeight', conditions.waveHeight, (v) => `${parseFloat(v).toFixed(2)} ft`);
    setConditionVisibility('windSpeed', conditions.windSpeed, (v) => `${parseFloat(v).toFixed(2)} mph`);
    setConditionVisibility('windDirection', conditions.windDirection);
    setConditionVisibility('swellDirection', conditions.swellDirection);
    setConditionVisibility('waterTemperature', conditions.waterTemperature, (v) => `${parseFloat(v).toFixed(2)}°F`);
    setConditionVisibility('temperature', conditions.temperature, (v) => `${parseFloat(v).toFixed(2)}°F`);
    setConditionVisibility('visibility', conditions.visibility, (v) => `${parseFloat(v).toFixed(2)} ft`);
    setConditionVisibility('tideLevel', conditions.tideLevel);
    setConditionVisibility('currentStrength', conditions.currentStrength);
    setConditionVisibility('pressure', conditions.pressure);
    
    // UV Index with warning styling
    const uvElement = document.getElementById('uvIndex');
    const uvConditionItem = uvElement?.closest('.condition-item');
    if (hasData(conditions.uvIndex)) {
        uvElement.textContent = conditions.uvIndex;
        uvConditionItem.style.display = '';
        // Reset styles first
        uvConditionItem.style.background = '';
        uvElement.style.color = '';
        if (conditions.uvIndex >= 8) {
            uvConditionItem.style.background = '#fff3cd';
            uvElement.style.color = '#856404';
        } else if (conditions.uvIndex >= 6) {
            uvConditionItem.style.background = '#fff8e1';
            uvElement.style.color = '#f57c00';
        }
    } else {
        uvConditionItem.style.display = 'none';
    }
    
    setConditionVisibility('cloudCover', conditions.cloudCover);
    
    // Precipitation with warning styling
    const precipElement = document.getElementById('precipitation');
    const precipConditionItem = precipElement?.closest('.condition-item');
    if (hasData(conditions.precipitation)) {
        precipElement.textContent = conditions.precipitation;
        precipConditionItem.style.display = '';
        // Reset styles first
        precipConditionItem.style.background = '';
        precipElement.style.color = '';
        if (conditions.hasPrecipitation) {
            precipConditionItem.style.background = '#e3f2fd';
            precipElement.style.color = '#1976d2';
        }
    } else {
        precipConditionItem.style.display = 'none';
    }
    
    // Display data source
    const dataSourceInfo = document.getElementById('dataSourceInfo');
    if (dataSourceInfo) {
        if (conditions.dataSource) {
            dataSourceInfo.textContent = `Data source: ${conditions.dataSource}`;
            dataSourceInfo.classList.remove('hidden');
        } else {
            dataSourceInfo.classList.add('hidden');
        }
    }
    
    // Current strength warning for high currents (only if data exists)
    const currentElement = document.getElementById('currentStrength');
    const currentConditionItem = currentElement?.closest('.condition-item');
    if (hasData(conditions.currentStrength) && currentConditionItem) {
        // Reset styles first
        currentConditionItem.style.background = '';
        currentElement.style.color = '';
        if (conditions.currentValue >= 3) {
            currentConditionItem.style.background = '#ffebee';
            currentElement.style.color = '#c62828';
        }
    }
    
    // Display best activity
    if (!activities || activities.length === 0) {
        console.error('No activities returned from API');
        return;
    }
    
    const bestActivity = activities[0];
    if (!bestActivity) {
        console.error('bestActivity is undefined');
        return;
    }
    
    document.getElementById('bestActivityIcon').textContent = bestActivity.icon || '🌊';
    document.getElementById('bestActivityName').textContent = bestActivity.name || '--';
    document.getElementById('bestActivityDescription').textContent = bestActivity.description || '--';
    const baseScoreDisplay = typeof bestActivity.score === 'number' ? bestActivity.score.toFixed(2) : '0.00';
    document.getElementById('scoreBadge').textContent = `${baseScoreDisplay}/100`;
    
    // Add suitability indicator to best activity score badge
    const suitability = getSuitabilityIndicator(bestActivity.score);
    let suitabilityBadge = document.getElementById('suitabilityBadge');
    if (!suitabilityBadge) {
        const scoreBadgeContainer = document.createElement('div');
        scoreBadgeContainer.style.display = 'flex';
        scoreBadgeContainer.style.alignItems = 'center';
        scoreBadgeContainer.style.gap = '12px';
        const scoreBadge = document.getElementById('scoreBadge');
        scoreBadge.parentNode.insertBefore(scoreBadgeContainer, scoreBadge);
        scoreBadgeContainer.appendChild(scoreBadge);
        
        suitabilityBadge = document.createElement('div');
        suitabilityBadge.id = 'suitabilityBadge';
        suitabilityBadge.className = `suitability-indicator ${suitability.class}`;
        scoreBadgeContainer.appendChild(suitabilityBadge);
    }
    suitabilityBadge.textContent = suitability.text;
    suitabilityBadge.className = `suitability-indicator ${suitability.class}`;
    
    // Map activity keys to relevant condition IDs
    const activityConditionsMap = {
        'surfing': ['waveHeight', 'windSpeed', 'windDirection', 'swellDirection', 'tideLevel', 'temperature', 'precipitation', 'uvIndex'],
        'diving': ['visibility', 'waveHeight', 'windSpeed', 'currentStrength', 'waterTemperature', 'precipitation', 'cloudCover', 'pressure'],
        'freediving': ['visibility', 'waveHeight', 'windSpeed', 'currentStrength', 'waterTemperature', 'precipitation', 'cloudCover', 'uvIndex', 'pressure'],
        'swimming': ['waveHeight', 'windSpeed', 'currentStrength', 'visibility', 'waterTemperature', 'precipitation', 'cloudCover', 'uvIndex', 'pressure']
    };
    
    // Function to highlight relevant conditions
    function highlightConditions(conditionIds) {
        conditionIds.forEach(conditionId => {
            const conditionElement = document.getElementById(conditionId);
            if (conditionElement) {
                const conditionItem = conditionElement.closest('.condition-item');
                if (conditionItem && conditionItem.style.display !== 'none') {
                    conditionItem.classList.add('condition-highlighted');
                }
            }
        });
    }
    
    // Function to remove highlights
    function removeHighlights() {
        document.querySelectorAll('.condition-item').forEach(item => {
            item.classList.remove('condition-highlighted');
        });
    }
    
    // Display all activities
    const activitiesGrid = document.getElementById('activitiesGrid');
    activitiesGrid.innerHTML = '';
    
    activities.forEach((activity) => {
        const activityCard = document.createElement('div');
        activityCard.className = 'activity-card';
        
        const scoreColor = activity.score >= 70 ? '#26a69a' : 
                          activity.score >= 50 ? '#f57c00' : '#d32f2f';
        
        const suitability = getSuitabilityIndicator(activity.score);
        
        activityCard.innerHTML = `
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-info">
                <h3>${activity.name}</h3>
                <p>${activity.description}</p>
                <div class="activity-meta">
                    <div class="activity-score" style="color: ${scoreColor}">
                        Score: ${(typeof activity.score === 'number' ? activity.score.toFixed(2) : '0.00')}/100
                    </div>
                    <div class="suitability-indicator ${suitability.class}">
                        ${suitability.text}
                    </div>
                </div>
            </div>
        `;
        
        // Add hover event listeners
        const relevantConditions = activityConditionsMap[activity.key] || [];
        if (relevantConditions.length > 0) {
            activityCard.addEventListener('mouseenter', () => {
                highlightConditions(relevantConditions);
            });
            
            activityCard.addEventListener('mouseleave', () => {
                removeHighlights();
            });
        }
        
        activitiesGrid.appendChild(activityCard);
    });
    
    // Also add hover to best activity card
    const bestActivityCard = document.getElementById('bestActivity');
    if (bestActivityCard && bestActivity) {
        const bestRelevantConditions = activityConditionsMap[bestActivity.key] || [];
        if (bestRelevantConditions.length > 0) {
            bestActivityCard.addEventListener('mouseenter', () => {
                highlightConditions(bestRelevantConditions);
            });
            
            bestActivityCard.addEventListener('mouseleave', () => {
                removeHighlights();
            });
        }
    }
    
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

// More button toggle functionality
const moreButton = document.getElementById('moreButton');
const moreContent = document.getElementById('moreContent');

if (moreButton && moreContent) {
    moreButton.addEventListener('click', () => {
        const isExpanded = moreButton.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            moreContent.classList.add('collapsed');
            moreButton.setAttribute('aria-expanded', 'false');
        } else {
            moreContent.classList.remove('collapsed');
            moreButton.setAttribute('aria-expanded', 'true');
        }
    });
}

// Initialize severe warning popup close functionality
function initSevereWarningPopup() {
    const severeWarningClose = document.getElementById('severeWarningClose');
    const severeWarningPopup = document.getElementById('severeWarningPopup');

    if (severeWarningClose && severeWarningPopup) {
        severeWarningClose.addEventListener('click', () => {
            severeWarningPopup.classList.add('hidden');
        });
        
        // Also close when clicking outside the popup
        severeWarningPopup.addEventListener('click', (e) => {
            if (e.target === severeWarningPopup) {
                severeWarningPopup.classList.add('hidden');
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !severeWarningPopup.classList.contains('hidden')) {
                severeWarningPopup.classList.add('hidden');
            }
        });
    }
}

// Load default location on page load
window.addEventListener('DOMContentLoaded', () => {
    initSevereWarningPopup();
    searchLocation();
});

