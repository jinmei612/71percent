// Ocean Activity Recommender App

const ACTIVITIES = {
    surfing: {
        name: 'Surfing',
        icon: '🏄',
        description: 'Perfect waves and wind conditions for catching some great rides!',
        evaluate: (conditions) => {
            let score = 50;
            // Ideal wave height: 3-6 feet
            if (conditions.waveHeight >= 3 && conditions.waveHeight <= 6) score += 20;
            else if (conditions.waveHeight >= 2 && conditions.waveHeight <= 8) score += 10;
            // Moderate wind is good (10-20 mph), offshore wind is best
            if (conditions.windSpeed >= 10 && conditions.windSpeed <= 20) {
                score += 10;
                // Offshore wind (wind from land) is ideal
                if (['W', 'NW', 'SW'].includes(conditions.windDirection)) score += 5;
            } else if (conditions.windSpeed >= 5 && conditions.windSpeed <= 25) score += 5;
            // Swell direction matters - onshore swells are better
            if (['W', 'SW', 'NW'].includes(conditions.swellDirection)) score += 5;
            // Tide: mid-tide is often best for surfing
            if (Math.abs(conditions.tideValue) <= 1) score += 5;
            // Temperature should be comfortable
            if (conditions.temperature >= 65 && conditions.temperature <= 85) score += 3;
            // Rain reduces score
            if (conditions.hasPrecipitation) score -= 10;
            // High UV means good visibility but need protection
            if (conditions.uvIndex >= 6) score -= 2;
            return Math.min(100, Math.max(0, score));
        }
    },
    diving: {
        name: 'Scuba Diving',
        icon: '🤿',
        description: 'Excellent visibility and calm conditions for underwater exploration.',
        evaluate: (conditions) => {
            let score = 50;
            // Need good visibility
            if (conditions.visibility >= 50) score += 20;
            else if (conditions.visibility >= 30) score += 10;
            // Calm conditions preferred
            if (conditions.waveHeight <= 2) score += 15;
            else if (conditions.waveHeight <= 3) score += 5;
            // Low wind
            if (conditions.windSpeed <= 10) score += 10;
            // Low current strength for safety
            if (conditions.currentValue <= 1.5) score += 10;
            else if (conditions.currentValue <= 2.5) score += 5;
            // Water temperature comfort
            if (conditions.waterTemperature >= 70 && conditions.waterTemperature <= 80) score += 5;
            // Rain reduces visibility
            if (conditions.hasPrecipitation) score -= 15;
            // Cloud cover can reduce light underwater
            if (conditions.cloudValue <= 30) score += 5;
            // High pressure often means better conditions
            if (conditions.pressureValue >= 30.0) score += 5;
            return Math.min(100, Math.max(0, score));
        }
    },
    snorkeling: {
        name: 'Snorkeling',
        icon: '🥽',
        description: 'Clear waters and calm conditions make for perfect snorkeling.',
        evaluate: (conditions) => {
            let score = 50;
            // Good visibility
            if (conditions.visibility >= 40) score += 20;
            else if (conditions.visibility >= 25) score += 10;
            // Very calm conditions
            if (conditions.waveHeight <= 1.5) score += 20;
            else if (conditions.waveHeight <= 2.5) score += 10;
            // Low wind
            if (conditions.windSpeed <= 8) score += 10;
            // Warm water
            if (conditions.waterTemperature >= 70) score += 10;
            // Low current
            if (conditions.currentValue <= 1.5) score += 5;
            // Rain significantly reduces visibility
            if (conditions.hasPrecipitation) score -= 20;
            // Sunny conditions are better
            if (conditions.cloudValue <= 20) score += 5;
            // UV protection needed but good visibility
            if (conditions.uvIndex >= 6) score -= 3;
            return Math.min(100, Math.max(0, score));
        }
    },
    swimming: {
        name: 'Swimming',
        icon: '🏊',
        description: 'Perfect conditions for a refreshing swim in the ocean.',
        evaluate: (conditions) => {
            let score = 50;
            // Calm conditions essential
            if (conditions.waveHeight <= 1.5) score += 20;
            else if (conditions.waveHeight <= 2.5) score += 10;
            // Low wind
            if (conditions.windSpeed <= 10) score += 15;
            // Comfortable water temperature
            if (conditions.waterTemperature >= 70 && conditions.waterTemperature <= 80) score += 10;
            // Low current for safety
            if (conditions.currentValue <= 1.5) score += 10;
            // Rain makes it less pleasant
            if (conditions.hasPrecipitation) score -= 15;
            // Air temperature comfort
            if (conditions.temperature >= 70 && conditions.temperature <= 85) score += 5;
            // High UV needs protection
            if (conditions.uvIndex >= 8) score -= 3;
            return Math.min(100, Math.max(0, score));
        }
    },
    kayaking: {
        name: 'Kayaking',
        icon: '🛶',
        description: 'Great conditions for paddling along the coast.',
        evaluate: (conditions) => {
            let score = 50;
            // Moderate waves okay
            if (conditions.waveHeight <= 3) score += 15;
            else if (conditions.waveHeight <= 4) score += 8;
            // Moderate wind is fine, but headwinds are harder
            if (conditions.windSpeed <= 15) {
                score += 15;
                // Tailwind or crosswind is better than headwind
                if (!['E', 'NE', 'SE'].includes(conditions.windDirection)) score += 5;
            } else if (conditions.windSpeed <= 20) score += 8;
            // Moderate current is manageable
            if (conditions.currentValue <= 2.5) score += 10;
            // Temperature
            if (conditions.temperature >= 60) score += 8;
            if (conditions.waterTemperature >= 65) score += 5;
            // Rain reduces comfort
            if (conditions.hasPrecipitation) score -= 10;
            // High UV needs protection
            if (conditions.uvIndex >= 8) score -= 3;
            return Math.min(100, Math.max(0, score));
        }
    },
    sailing: {
        name: 'Sailing',
        icon: '⛵',
        description: 'Ideal wind conditions for a day out on the water.',
        evaluate: (conditions) => {
            let score = 50;
            // Need wind!
            if (conditions.windSpeed >= 10 && conditions.windSpeed <= 25) score += 25;
            else if (conditions.windSpeed >= 5 && conditions.windSpeed <= 30) score += 12;
            // Consistent wind direction is good
            if (conditions.windSpeed >= 8) score += 5;
            // Moderate waves okay
            if (conditions.waveHeight <= 4) score += 15;
            // Moderate current is fine
            if (conditions.currentValue <= 2.5) score += 5;
            // Temperature
            if (conditions.temperature >= 65) score += 8;
            // Rain reduces visibility and comfort
            if (conditions.hasPrecipitation) score -= 12;
            // High pressure often means stable conditions
            if (conditions.pressureValue >= 30.0) score += 5;
            // Cloud cover doesn't matter much
            return Math.min(100, Math.max(0, score));
        }
    },
    fishing: {
        name: 'Fishing',
        icon: '🎣',
        description: 'Calm conditions perfect for a relaxing day of fishing.',
        evaluate: (conditions) => {
            let score = 50;
            // Calm conditions
            if (conditions.waveHeight <= 2.5) score += 20;
            else if (conditions.waveHeight <= 3.5) score += 10;
            // Low to moderate wind
            if (conditions.windSpeed <= 15) score += 15;
            // Low current makes fishing easier
            if (conditions.currentValue <= 2) score += 10;
            // Temperature
            if (conditions.temperature >= 60) score += 8;
            // Barometric pressure affects fish behavior
            // Stable or rising pressure is often better
            if (conditions.pressureValue >= 30.0) score += 10;
            else if (conditions.pressureValue >= 29.8) score += 5;
            // Rain can actually help fishing sometimes
            if (conditions.hasPrecipitation) score -= 5;
            // Tide affects fish activity
            if (Math.abs(conditions.tideValue) <= 1.5) score += 5;
            // Cloud cover can be good for fishing
            if (conditions.cloudValue >= 30 && conditions.cloudValue <= 70) score += 5;
            return Math.min(100, Math.max(0, score));
        }
    },
    paddleboarding: {
        name: 'Paddleboarding',
        icon: '🏄‍♂️',
        description: 'Calm waters perfect for stand-up paddleboarding.',
        evaluate: (conditions) => {
            let score = 50;
            // Very calm conditions needed
            if (conditions.waveHeight <= 1.5) score += 25;
            else if (conditions.waveHeight <= 2.5) score += 12;
            // Low wind is essential
            if (conditions.windSpeed <= 10) score += 20;
            else if (conditions.windSpeed <= 15) score += 8;
            // Very low current preferred
            if (conditions.currentValue <= 1.5) score += 15;
            else if (conditions.currentValue <= 2) score += 8;
            // Temperature
            if (conditions.temperature >= 65) score += 8;
            if (conditions.waterTemperature >= 68) score += 5;
            // Rain makes it unpleasant
            if (conditions.hasPrecipitation) score -= 15;
            // High UV needs protection
            if (conditions.uvIndex >= 8) score -= 3;
            // Calm conditions at low tide can be good
            if (Math.abs(conditions.tideValue) <= 1) score += 5;
            return Math.min(100, Math.max(0, score));
        }
    }
};

// Simulate ocean conditions based on weather data
// In a real app, you'd use a marine weather API
async function getOceanConditions(location) {
    // For demo purposes, we'll simulate conditions
    // In production, you'd fetch from a real API like:
    // - OpenWeatherMap (with marine weather extension)
    // - Stormglass API
    // - NOAA API
    
    // Simulate realistic ocean conditions
    const baseTemp = 65 + Math.random() * 15; // 65-80°F
    const waterTemp = baseTemp - 5 + Math.random() * 10; // Water is usually cooler
    const waveHeight = 1 + Math.random() * 5; // 1-6 feet
    const windSpeed = 5 + Math.random() * 20; // 5-25 mph
    const visibility = 20 + Math.random() * 60; // 20-80 feet
    
    // Additional forecast factors
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const windDirection = directions[Math.floor(Math.random() * directions.length)];
    const swellDirection = directions[Math.floor(Math.random() * directions.length)];
    
    // Tide: -2 to +2 feet relative to mean sea level
    const tideLevel = (Math.random() * 4 - 2).toFixed(1);
    const tideStatus = parseFloat(tideLevel) > 0.5 ? 'High' : 
                      parseFloat(tideLevel) < -0.5 ? 'Low' : 'Medium';
    
    // Current strength: 0.5 to 3.5 knots
    const currentStrength = (0.5 + Math.random() * 3).toFixed(1);
    
    // UV Index: 0-11
    const uvIndex = Math.round(Math.random() * 11);
    
    // Cloud cover: 0-100%
    const cloudCover = Math.round(Math.random() * 100);
    
    // Precipitation: 0-0.5 inches
    const precipitation = (Math.random() * 0.5).toFixed(2);
    const hasRain = parseFloat(precipitation) > 0.1;
    
    // Barometric pressure: 29.5-30.5 inHg
    const pressure = (29.5 + Math.random()).toFixed(2);
    
    return {
        temperature: Math.round(baseTemp),
        waterTemperature: Math.round(waterTemp),
        waveHeight: Math.round(waveHeight * 10) / 10,
        swellDirection: swellDirection,
        windSpeed: Math.round(windSpeed),
        windDirection: windDirection,
        visibility: Math.round(visibility),
        tideLevel: `${tideStatus} (${tideLevel > 0 ? '+' : ''}${tideLevel}ft)`,
        tideValue: parseFloat(tideLevel),
        currentStrength: `${currentStrength} knots`,
        currentValue: parseFloat(currentStrength),
        uvIndex: uvIndex,
        cloudCover: `${cloudCover}%`,
        cloudValue: cloudCover,
        precipitation: hasRain ? `${precipitation}"` : 'None',
        hasPrecipitation: hasRain,
        pressure: `${pressure} inHg`,
        pressureValue: parseFloat(pressure),
        location: location
    };
}

function evaluateActivities(conditions) {
    const scoredActivities = Object.entries(ACTIVITIES).map(([key, activity]) => ({
        key,
        ...activity,
        score: activity.evaluate(conditions)
    }));
    
    // Sort by score descending
    scoredActivities.sort((a, b) => b.score - a.score);
    
    return scoredActivities;
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
    if (conditions.hasPrecipitation) {
        precipElement.parentElement.style.background = '#e3f2fd';
        precipElement.style.color = '#1976d2';
    }
    
    document.getElementById('pressure').textContent = conditions.pressure;
    
    // Current strength warning for high currents
    const currentElement = document.getElementById('currentStrength');
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
        
        const scoreColor = activity.score >= 70 ? '#10b981' : 
                          activity.score >= 50 ? '#f59e0b' : '#ef4444';
        
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
        // Get ocean conditions
        const conditions = await getOceanConditions(location);
        
        // Evaluate activities
        const activities = evaluateActivities(conditions);
        
        // Display results
        displayResults(conditions, activities);
    } catch (error) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.classList.remove('hidden');
    }
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click', searchLocation);
document.getElementById('locationInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchLocation();
    }
});

// Load default location on page load
window.addEventListener('DOMContentLoaded', () => {
    searchLocation();
});

