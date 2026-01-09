"""
Ocean Activity Recommender App - Python Backend
Flask application that provides ocean activity recommendations based on forecast conditions
"""

import os
import random
import requests
from datetime import datetime
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for API requests

# Activity definitions with evaluation functions
ACTIVITIES = {
    'surfing': {
        'name': 'Surfing',
        'icon': '🏄',
        'description': 'Perfect waves and wind conditions for catching some great rides!',
        'evaluate': lambda conditions: evaluate_surfing(conditions)
    },
    'diving': {
        'name': 'Scuba Diving',
        'icon': '🤿',
        'description': 'Excellent visibility and calm conditions for underwater exploration.',
        'evaluate': lambda conditions: evaluate_diving(conditions)
    },
    'freediving': {
        'name': 'Freediving',
        'icon': '🧜',
        'description': 'Ideal conditions for breath-hold diving with excellent visibility and calm waters.',
        'evaluate': lambda conditions: evaluate_freediving(conditions)
    },
    'fishing': {
        'name': 'Fishing',
        'icon': '🎣',
        'description': 'Calm conditions perfect for a relaxing day of fishing.',
        'evaluate': lambda conditions: evaluate_fishing(conditions)
    }
}


def evaluate_surfing(conditions):
    """Evaluate conditions for surfing"""
    score = 50
    # Ideal wave height: 3-6 feet
    if 3 <= conditions['waveHeight'] <= 6:
        score += 20
    elif 2 <= conditions['waveHeight'] <= 8:
        score += 10
    # Moderate wind is good (10-20 mph), offshore wind is best
    if 10 <= conditions['windSpeed'] <= 20:
        score += 10
        # Offshore wind (wind from land) is ideal
        if conditions['windDirection'] in ['W', 'NW', 'SW']:
            score += 5
    elif 5 <= conditions['windSpeed'] <= 25:
        score += 5
    # Swell direction matters - onshore swells are better
    if conditions['swellDirection'] in ['W', 'SW', 'NW']:
        score += 5
    # Tide: mid-tide is often best for surfing
    if abs(conditions['tideValue']) <= 1:
        score += 5
    # Temperature should be comfortable
    if 65 <= conditions['temperature'] <= 85:
        score += 3
    # Rain reduces score
    if conditions['hasPrecipitation']:
        score -= 10
    # High UV means good visibility but need protection
    if conditions['uvIndex'] >= 6:
        score -= 2
    return min(100, max(0, score))


def evaluate_diving(conditions):
    """Evaluate conditions for scuba diving"""
    score = 50
    # Need good visibility
    if conditions['visibility'] >= 50:
        score += 20
    elif conditions['visibility'] >= 30:
        score += 10
    # Calm conditions preferred
    if conditions['waveHeight'] <= 2:
        score += 15
    elif conditions['waveHeight'] <= 3:
        score += 5
    # Low wind
    if conditions['windSpeed'] <= 10:
        score += 10
    # Low current strength for safety
    if conditions['currentValue'] <= 1.5:
        score += 10
    elif conditions['currentValue'] <= 2.5:
        score += 5
    # Water temperature comfort
    if 70 <= conditions['waterTemperature'] <= 80:
        score += 5
    # Rain reduces visibility
    if conditions['hasPrecipitation']:
        score -= 15
    # Cloud cover can reduce light underwater
    if conditions['cloudValue'] <= 30:
        score += 5
    # High pressure often means better conditions
    if conditions['pressureValue'] >= 30.0:
        score += 5
    return min(100, max(0, score))


def evaluate_freediving(conditions):
    """Evaluate conditions for freediving"""
    score = 50
    # Excellent visibility is critical for freediving
    if conditions['visibility'] >= 60:
        score += 25
    elif conditions['visibility'] >= 40:
        score += 15
    elif conditions['visibility'] >= 30:
        score += 8
    # Very calm conditions essential (surface conditions matter for entry/exit)
    if conditions['waveHeight'] <= 1:
        score += 20
    elif conditions['waveHeight'] <= 1.5:
        score += 12
    elif conditions['waveHeight'] <= 2:
        score += 5
    # Low wind is critical
    if conditions['windSpeed'] <= 5:
        score += 15
    elif conditions['windSpeed'] <= 8:
        score += 10
    elif conditions['windSpeed'] <= 12:
        score += 5
    # Very low current is essential for safety
    if conditions['currentValue'] <= 1:
        score += 15
    elif conditions['currentValue'] <= 1.5:
        score += 8
    elif conditions['currentValue'] <= 2:
        score += 3
    # Warm water is more important (usually no wetsuit)
    if conditions['waterTemperature'] >= 75:
        score += 10
    elif conditions['waterTemperature'] >= 72:
        score += 7
    elif conditions['waterTemperature'] >= 70:
        score += 4
    # Rain significantly reduces visibility and surface conditions
    if conditions['hasPrecipitation']:
        score -= 20
    # Sunny conditions provide better light underwater
    if conditions['cloudValue'] <= 20:
        score += 8
    elif conditions['cloudValue'] <= 40:
        score += 4
    # High UV means good visibility but need protection
    if conditions['uvIndex'] >= 6:
        score -= 2
    # Stable pressure conditions
    if conditions['pressureValue'] >= 30.0:
        score += 5
    return min(100, max(0, score))


def evaluate_fishing(conditions):
    """Evaluate conditions for fishing"""
    score = 50
    # Calm conditions
    if conditions['waveHeight'] <= 2.5:
        score += 20
    elif conditions['waveHeight'] <= 3.5:
        score += 10
    # Low to moderate wind
    if conditions['windSpeed'] <= 15:
        score += 15
    # Low current makes fishing easier
    if conditions['currentValue'] <= 2:
        score += 10
    # Temperature
    if conditions['temperature'] >= 60:
        score += 8
    # Barometric pressure affects fish behavior
    # Stable or rising pressure is often better
    if conditions['pressureValue'] >= 30.0:
        score += 10
    elif conditions['pressureValue'] >= 29.8:
        score += 5
    # Rain can actually help fishing sometimes
    if conditions['hasPrecipitation']:
        score -= 5
    # Tide affects fish activity
    if abs(conditions['tideValue']) <= 1.5:
        score += 5
    # Cloud cover can be good for fishing
    if 30 <= conditions['cloudValue'] <= 70:
        score += 5
    return min(100, max(0, score))


def get_weather_data_openweather(location):
    """Get weather data from OpenWeatherMap API"""
    api_key = os.getenv('OPENWEATHER_API_KEY')
    if not api_key:
        return None
    
    try:
        # Geocoding to get coordinates
        geo_url = 'http://api.openweathermap.org/geo/1.0/direct'
        geo_params = {'q': location, 'limit': 1, 'appid': api_key}
        geo_response = requests.get(geo_url, params=geo_params, timeout=5)
        
        if geo_response.status_code != 200:
            return None
        
        geo_data = geo_response.json()
        if not geo_data:
            return None
        
        lat = geo_data[0]['lat']
        lon = geo_data[0]['lon']
        
        # Get current weather
        weather_url = 'https://api.openweathermap.org/data/2.5/weather'
        weather_params = {
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'imperial'
        }
        weather_response = requests.get(weather_url, params=weather_params, timeout=5)
        
        if weather_response.status_code == 200:
            data = weather_response.json()
            data['_lat'] = lat
            data['_lon'] = lon
            return data
        return None
    except Exception as e:
        print(f"OpenWeatherMap API error: {e}")
        return None


def get_tide_data_noaa(location):
    """Get tide data from NOAA API (requires station ID)"""
    try:
        station_id = os.getenv('NOAA_STATION_ID', '9410170')  # Default to San Diego
        today = datetime.now().strftime('%Y%m%d')
        
        url = f'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'
        params = {
            'product': 'predictions',
            'application': 'NOS.COOPS.TAC.WL',
            'datum': 'MLLW',
            'station': station_id,
            'time_zone': 'lst_ldt',
            'units': 'english',
            'interval': 'h',
            'format': 'json',
            'date': 'today'
        }
        
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if 'predictions' in data and data['predictions']:
                latest = data['predictions'][-1]
                return float(latest['v'])
        return None
    except Exception as e:
        print(f"NOAA API error: {e}")
        return None


def get_marine_data_stormglass(lat, lon):
    """Get marine data from Stormglass API"""
    api_key = os.getenv('STORMGLASS_API_KEY')
    if not api_key:
        return None
    
    try:
        url = 'https://api.stormglass.io/v2/weather/point'
        params = {
            'lat': lat,
            'lng': lon,
            'params': 'waveHeight,waveDirection,swellHeight,swellDirection,swellPeriod,waterTemperature,currentSpeed,currentDirection'
        }
        headers = {'Authorization': api_key}
        
        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Stormglass API error: {e}")
        return None


def get_simulated_conditions(location):
    """Fallback: Simulate ocean conditions when APIs are unavailable"""
    base_temp = 65 + random.random() * 15
    water_temp = base_temp - 5 + random.random() * 10
    wave_height = round((1 + random.random() * 5) * 10) / 10
    wind_speed = round(5 + random.random() * 20)
    visibility = round(20 + random.random() * 60)
    
    directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    wind_direction = random.choice(directions)
    swell_direction = random.choice(directions)
    
    tide_level = round(random.random() * 4 - 2, 1)
    if tide_level > 0.5:
        tide_status = 'High'
    elif tide_level < -0.5:
        tide_status = 'Low'
    else:
        tide_status = 'Medium'
    
    current_strength = round(0.5 + random.random() * 3, 1)
    uv_index = round(random.random() * 11)
    cloud_cover = round(random.random() * 100)
    precipitation = round(random.random() * 0.5, 2)
    has_rain = precipitation > 0.1
    pressure = round(29.5 + random.random(), 2)
    
    return {
        'temperature': round(base_temp),
        'waterTemperature': round(water_temp),
        'waveHeight': wave_height,
        'swellDirection': swell_direction,
        'windSpeed': wind_speed,
        'windDirection': wind_direction,
        'visibility': visibility,
        'tideLevel': f"{tide_status} ({'+' if tide_level > 0 else ''}{tide_level}ft)",
        'tideValue': tide_level,
        'currentStrength': f"{current_strength} knots",
        'currentValue': current_strength,
        'uvIndex': uv_index,
        'cloudCover': f"{cloud_cover}%",
        'cloudValue': cloud_cover,
        'precipitation': f'{precipitation}"' if has_rain else 'None',
        'hasPrecipitation': has_rain,
        'pressure': f"{pressure} inHg",
        'pressureValue': pressure,
        'location': location,
        'dataSource': 'Simulated'
    }


def get_ocean_conditions(location):
    """
    Get ocean conditions from real APIs with fallback to simulation.
    Tries multiple APIs in order of preference.
    """
    conditions = {}
    lat = None
    lon = None
    
    # Step 1: Get weather data from OpenWeatherMap
    weather_data = get_weather_data_openweather(location)
    
    if weather_data:
        try:
            lat = weather_data.get('_lat') or weather_data.get('coord', {}).get('lat')
            lon = weather_data.get('_lon') or weather_data.get('coord', {}).get('lon')
            
            main = weather_data.get('main', {})
            wind = weather_data.get('wind', {})
            clouds = weather_data.get('clouds', {})
            rain = weather_data.get('rain', {})
            
            conditions['temperature'] = round(main.get('temp', 70))
            conditions['pressure'] = round(main.get('pressure', 1013) * 0.02953, 2)
            conditions['pressureValue'] = conditions['pressure']
            conditions['pressure'] = f"{conditions['pressure']} inHg"
            
            wind_speed_mps = wind.get('speed', 0)
            conditions['windSpeed'] = round(wind_speed_mps * 2.237, 1)
            wind_deg = wind.get('deg', 0)
            directions_map = {
                (0, 22.5): 'N', (22.5, 67.5): 'NE', (67.5, 112.5): 'E',
                (112.5, 157.5): 'SE', (157.5, 202.5): 'S', (202.5, 247.5): 'SW',
                (247.5, 292.5): 'W', (292.5, 337.5): 'NW', (337.5, 360): 'N'
            }
            wind_direction = 'N'
            for (start, end), direction in directions_map.items():
                if start <= wind_deg < end or (wind_deg >= 337.5 and direction == 'N'):
                    wind_direction = direction
                    break
            conditions['windDirection'] = wind_direction
            
            conditions['cloudValue'] = clouds.get('all', 0)
            conditions['cloudCover'] = f"{conditions['cloudValue']}%"
            
            rain_1h = rain.get('1h', 0) if rain else 0
            rain_3h = rain.get('3h', 0) if rain else 0
            precipitation = max(rain_1h, rain_3h) * 0.03937
            conditions['hasPrecipitation'] = precipitation > 0.1
            conditions['precipitation'] = f'{round(precipitation, 2)}"' if conditions['hasPrecipitation'] else 'None'
            
            hour = datetime.now().hour
            if 10 <= hour <= 14:
                conditions['uvIndex'] = round(5 + random.random() * 4)
            else:
                conditions['uvIndex'] = round(random.random() * 5)
            
            conditions['dataSource'] = 'OpenWeatherMap'
        except Exception as e:
            print(f"Error parsing OpenWeatherMap data: {e}")
            weather_data = None
    
    # Step 2: Get marine data from Stormglass
    marine_data = None
    if lat and lon:
        marine_data = get_marine_data_stormglass(lat, lon)
        
        if marine_data and 'hours' in marine_data and marine_data['hours']:
            try:
                current_hour = marine_data['hours'][0]
                
                if 'waveHeight' in current_hour:
                    wave_height_m = current_hour['waveHeight'].get('noaa', 0)
                    conditions['waveHeight'] = round(wave_height_m * 3.281, 1)
                
                if 'waveDirection' in current_hour:
                    wave_dir = current_hour['waveDirection'].get('noaa', 0)
                    directions_map = {
                        (0, 22.5): 'N', (22.5, 67.5): 'NE', (67.5, 112.5): 'E',
                        (112.5, 157.5): 'SE', (157.5, 202.5): 'S', (202.5, 247.5): 'SW',
                        (247.5, 292.5): 'W', (292.5, 337.5): 'NW', (337.5, 360): 'N'
                    }
                    for (start, end), direction in directions_map.items():
                        if start <= wave_dir < end or (wave_dir >= 337.5 and direction == 'N'):
                            conditions['swellDirection'] = direction
                            break
                
                if 'waterTemperature' in current_hour:
                    water_temp_c = current_hour['waterTemperature'].get('noaa', 0)
                    conditions['waterTemperature'] = round(water_temp_c * 9/5 + 32)
                
                if 'currentSpeed' in current_hour:
                    current_speed_ms = current_hour['currentSpeed'].get('noaa', 0)
                    conditions['currentValue'] = round(current_speed_ms * 1.944, 1)
                    conditions['currentStrength'] = f"{conditions['currentValue']} knots"
                
                if 'waveHeight' in conditions:
                    wave_ht = conditions.get('waveHeight', 2)
                    wind_spd = conditions.get('windSpeed', 10)
                    if wave_ht < 2 and wind_spd < 10:
                        conditions['visibility'] = round(40 + random.random() * 40)
                    else:
                        conditions['visibility'] = round(20 + random.random() * 30)
                
                if 'dataSource' not in conditions:
                    conditions['dataSource'] = 'Stormglass'
                else:
                    conditions['dataSource'] += ' + Stormglass'
            except Exception as e:
                print(f"Error parsing Stormglass data: {e}")
    
    # Step 3: Get tide data from NOAA
    tide_level = get_tide_data_noaa(location)
    if tide_level is not None:
        conditions['tideValue'] = round(tide_level, 1)
        if tide_level > 0.5:
            tide_status = 'High'
        elif tide_level < -0.5:
            tide_status = 'Low'
        else:
            tide_status = 'Medium'
        conditions['tideLevel'] = f"{tide_status} ({'+' if tide_level > 0 else ''}{tide_level}ft)"
        if 'dataSource' in conditions:
            conditions['dataSource'] += ' + NOAA'
        else:
            conditions['dataSource'] = 'NOAA'
    
    # Fill in missing data with defaults
    if 'temperature' not in conditions:
        conditions['temperature'] = 70
    if 'waterTemperature' not in conditions:
        conditions['waterTemperature'] = max(conditions['temperature'] - 7 + random.random() * 5, 60)
    if 'waveHeight' not in conditions:
        conditions['waveHeight'] = round(1 + random.random() * 4, 1)
    if 'swellDirection' not in conditions:
        conditions['swellDirection'] = random.choice(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])
    if 'windSpeed' not in conditions:
        conditions['windSpeed'] = round(5 + random.random() * 15)
    if 'windDirection' not in conditions:
        conditions['windDirection'] = random.choice(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])
    if 'visibility' not in conditions:
        conditions['visibility'] = round(25 + random.random() * 45)
    if 'tideLevel' not in conditions:
        tide_level = round(random.random() * 4 - 2, 1)
        if tide_level > 0.5:
            tide_status = 'High'
        elif tide_level < -0.5:
            tide_status = 'Low'
        else:
            tide_status = 'Medium'
        conditions['tideLevel'] = f"{tide_status} ({'+' if tide_level > 0 else ''}{tide_level}ft)"
        conditions['tideValue'] = tide_level
    if 'currentStrength' not in conditions:
        current_strength = round(0.5 + random.random() * 2.5, 1)
        conditions['currentValue'] = current_strength
        conditions['currentStrength'] = f"{current_strength} knots"
    if 'uvIndex' not in conditions:
        conditions['uvIndex'] = round(random.random() * 11)
    if 'cloudCover' not in conditions:
        conditions['cloudValue'] = round(random.random() * 100)
        conditions['cloudCover'] = f"{conditions['cloudValue']}%"
    if 'precipitation' not in conditions:
        conditions['hasPrecipitation'] = False
        conditions['precipitation'] = 'None'
    if 'pressure' not in conditions:
        conditions['pressureValue'] = round(29.5 + random.random(), 2)
        conditions['pressure'] = f"{conditions['pressureValue']} inHg"
    
    conditions['location'] = location
    
    if 'dataSource' not in conditions:
        return get_simulated_conditions(location)
    
    return conditions


def evaluate_activities(conditions):
    """Evaluate all activities and return sorted by score"""
    scored_activities = []
    
    for key, activity in ACTIVITIES.items():
        score = activity['evaluate'](conditions)
        scored_activities.append({
            'key': key,
            'name': activity['name'],
            'icon': activity['icon'],
            'description': activity['description'],
            'score': score
        })
    
    # Sort by score descending
    scored_activities.sort(key=lambda x: x['score'], reverse=True)
    
    return scored_activities


@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')


@app.route('/api/autocomplete', methods=['GET'])
def autocomplete_location():
    """API endpoint for location autocomplete using Google Maps Places API"""
    query = request.args.get('query', '')
    
    if not query or len(query) < 2:
        return jsonify({'success': True, 'predictions': []})
    
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        # Fallback: Use OpenWeatherMap geocoding for basic suggestions
        try:
            openweather_key = os.getenv('OPENWEATHER_API_KEY')
            if openweather_key:
                url = 'http://api.openweathermap.org/geo/1.0/direct'
                params = {'q': query, 'limit': 5, 'appid': openweather_key}
                response = requests.get(url, params=params, timeout=3)
                if response.status_code == 200:
                    data = response.json()
                    predictions = []
                    for item in data:
                        name = f"{item.get('name', '')}, {item.get('state', '')}, {item.get('country', '')}"
                        predictions.append({
                            'description': name,
                            'place_id': f"owm_{item.get('lat')}_{item.get('lon')}",
                            'structured_formatting': {'main_text': item.get('name', ''), 'secondary_text': f"{item.get('state', '')}, {item.get('country', '')}"}
                        })
                    return jsonify({'success': True, 'predictions': predictions})
        except Exception as e:
            print(f"OpenWeatherMap autocomplete error: {e}")
        return jsonify({'success': True, 'predictions': []})
    
    # Use Google Maps Places API
    try:
        url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
        params = {
            'input': query,
            'key': api_key,
            'types': '(cities)',
            'components': 'country:us|country:mx|country:ca'  # Focus on North America coastal areas
        }
        response = requests.get(url, params=params, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'OK':
                return jsonify({
                    'success': True,
                    'predictions': data.get('predictions', [])
                })
        return jsonify({'success': True, 'predictions': []})
    except Exception as e:
        print(f"Google Maps API error: {e}")
        return jsonify({'success': True, 'predictions': []})


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Docker"""
    return jsonify({'status': 'healthy', 'service': 'ocean-activity-forecast'}), 200


@app.route('/api/conditions', methods=['GET'])
def get_conditions():
    """API endpoint to get ocean conditions and activity recommendations"""
    location = request.args.get('location', 'San Diego, CA')
    
    try:
        # Get ocean conditions
        conditions = get_ocean_conditions(location)
        
        # Evaluate activities
        activities = evaluate_activities(conditions)
        
        return jsonify({
            'success': True,
            'conditions': conditions,
            'activities': activities
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, host='0.0.0.0', port=port)

