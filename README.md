# 🌊 Ocean Activity Forecast

A professional web application that provides real-time ocean activity recommendations based on current weather and marine conditions. Features a beautiful ocean-themed UI with animated wave backgrounds and intelligent condition analysis.

## Features

### Core Functionality

- **Real-time Activity Recommendations**: Get personalized recommendations for the best ocean activity based on current conditions
- **Activity Scoring System**: Each activity is scored (0-100) with suitability indicators:
  - **Recommended** (≥70): Excellent conditions
  - **Suitable** (50-69): Good conditions
  - **Do not go** (<50): Poor conditions

- **Multiple Activities**: Evaluates 4 different ocean activities:
  - 🏄 **Surfing**: Wave height, wind conditions, swell direction, tide levels
  - 🤿 **Scuba Diving**: Visibility, calm conditions, current strength, water temperature
  - 🧜 **Freediving**: Excellent visibility, very calm conditions, minimal current
  - 🏊 **Ocean Swimming**: Safety-focused conditions, visibility, current strength

### Interactive Features

- **Location Autocomplete**: Debounced search (300ms) with keyboard navigation
  - Google Maps Places API integration
  - Fallback to OpenWeatherMap geocoding
  - Keyboard navigation (Arrow keys, Enter, Escape)

- **Condition Highlighting**: Hover over any activity to highlight relevant ocean condition factors
  - Visual connection between activities and their key conditions
  - Smooth animations and color-coded highlights

- **Severe Conditions Warning**: Automatic popup alert when dangerous conditions are detected:
  - Very high waves (>10 ft)
  - Very strong currents (>4 knots)
  - Heavy precipitation
  - Extreme wind speeds (>30 mph)
  - Extreme UV index (≥11)
  - Very low visibility (<10 ft)

- **Collapsible Details**: "More" button to expand/collapse detailed conditions and all activities
- **Data Source Transparency**: Shows which APIs provided the data
- **Conditional Display**: Only shows condition factors that have available data

### Ocean Conditions Display

The app displays relevant ocean condition factors:
- Wave Height
- Wind Speed & Direction
- Swell Direction
- Water Temperature
- Air Temperature (when available)
- Visibility
- Tide Level
- Current Strength
- UV Index
- Cloud Cover
- Precipitation
- Barometric Pressure (when available)

## How It Works

### Activity Evaluation

The app evaluates ocean conditions and scores each activity based on specific criteria:

- **Surfing**: 
  - Ideal wave height (3-6 ft)
  - Moderate wind (10-20 mph)
  - Offshore winds preferred
  - Swell direction
  - Mid-tide conditions
  - Comfortable air temperature

- **Scuba Diving**: 
  - High visibility (50+ ft)
  - Calm conditions (wave height ≤2 ft)
  - Low wind speeds
  - Low current strength
  - Comfortable water temperature
  - Clear skies for better underwater light

- **Freediving**: 
  - Excellent visibility (60+ ft)
  - Very calm conditions (wave height ≤1 ft)
  - Minimal wind
  - Very low current
  - Warm water (usually no wetsuit)
  - Sunny conditions

- **Ocean Swimming**: 
  - Calm conditions essential for safety
  - Low wind speeds
  - Very low current
  - Good visibility
  - Comfortable water temperature
  - Clear skies

## Technical Architecture

### Backend (Python/Flask)

- **Framework**: Flask 3.0.0 (REST API)
- **Server**: Gunicorn (WSGI)
- **Architecture**: Microservices-style with clear separation of concerns
- **API Integration**: Multi-source data aggregation:
  - **OpenWeatherMap API**: Weather (temperature, wind, pressure, clouds, precipitation, UV)
  - **Stormglass API**: Marine (wave height/direction, water temperature, current speed)
  - **NOAA Tides & Currents API**: Tide predictions
  - **Google Maps Places API**: Location autocomplete (with OpenWeatherMap geocoding fallback)
- **Error Handling**: Graceful degradation with fallback to simulated data when APIs fail
- **Data Processing**: Custom scoring algorithms for 4 activities with dedicated evaluation functions
- **Environment Management**: python-dotenv for API key configuration
- **Containerization**: Docker with multi-stage optimization, Docker Compose for orchestration

### Frontend (Vanilla JavaScript)

- **No Frameworks**: Pure JavaScript (ES6+)
- **Architecture**: Client-side rendering with async API calls
- **Features**:
  - Debounced autocomplete (300ms delay)
  - Keyboard navigation for autocomplete
  - Dynamic DOM manipulation
  - Error handling and loading states
  - Data formatting (all numeric values to 2 decimal places)
  - Interactive hover highlighting
  - Severe conditions detection and warnings

### UI/Design

- **Theme**: Light green-blue ocean color palette
- **Style**: Professional forecast site with hand-crafted aesthetics
- **Visual Elements**:
  - Animated wave background (3 layered waves with CSS animations)
  - Glassmorphism effects (frosted glass on header/loading)
  - Card-based layout with shadows and borders
  - Color-coded status badges (Green: Recommended, Blue: Suitable, Red: Do not go)
- **Typography**: System font stack for optimal performance
- **Responsive Design**: Mobile-first approach with breakpoint at 768px
- **Accessibility**: Semantic HTML, keyboard navigation, ARIA attributes

## Usage

1. Install Python dependencies (see Setup below)
2. Run the Flask server: `python app.py`
3. Open your browser to `http://localhost:5000`
4. Enter a location (default: San Diego, CA)
5. Click "Search" or press Enter
6. View the recommended best activity with suitability indicator
7. Hover over activities to see relevant conditions highlighted
8. Click "More" to expand detailed conditions and all activities
9. Review severe condition warnings if present

## Setup

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Docker (optional, for containerized deployment)

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application**:
   ```bash
   python app.py
   ```

3. **Open in browser**:
   Navigate to `http://localhost:5000`

### Docker Setup

The easiest way to run the application is using Docker:

1. **Build the Docker image** (multi-stage build for optimization):
   ```bash
   docker build -t ocean-activity-app .
   ```

2. **Run with Docker**:
   ```bash
   docker run -d -p 5000:5000 --env-file .env --name ocean-activity ocean-activity-app
   ```
   
   Or with environment variables inline:
   ```bash
   docker run -d -p 5000:5000 \
     -e OPENWEATHER_API_KEY=your_key \
     -e STORMGLASS_API_KEY=your_key \
     -e GOOGLE_MAPS_API_KEY=your_key \
     --name ocean-activity ocean-activity-app
   ```

3. **Using Docker Compose** (Recommended):
   ```bash
   # Create .env file with your API keys first
   docker-compose up -d
   ```
   
   To view logs:
   ```bash
   docker-compose logs -f
   ```
   
   To stop:
   ```bash
   docker-compose down
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5000`

### API Configuration

The app integrates with multiple ocean condition APIs. Configure API keys for real data:

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Get API keys** (all have free tiers):
   
   **OpenWeatherMap** (Required for basic weather data):
   - Sign up at: https://openweathermap.org/api
   - Free tier: 60 calls/minute, 1,000,000 calls/month
   - Add to `.env`: `OPENWEATHER_API_KEY=your_key_here`
   
   **Stormglass** (Optional - for marine data: wave height, water temp, currents):
   - Sign up at: https://stormglass.io/
   - Free tier: 50 requests/day
   - Add to `.env`: `STORMGLASS_API_KEY=your_key_here`
   
   **Google Maps** (Optional - for location autocomplete):
   - Sign up at: https://console.cloud.google.com/
   - Free tier: $200 credit/month
   - Enable "Places API" in Google Cloud Console
   - Add to `.env`: `GOOGLE_MAPS_API_KEY=your_key_here`
   
   **NOAA Tides & Currents** (Optional - for tide data):
   - Free, no API key needed
   - Find station ID at: https://tidesandcurrents.noaa.gov/
   - Add to `.env`: `NOAA_STATION_ID=9410170` (example: San Diego)

3. **Edit `.env` with your API keys**:
   ```env
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   STORMGLASS_API_KEY=your_stormglass_api_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   NOAA_STATION_ID=9410170
   PORT=5000
   FLASK_DEBUG=false
   ```

4. **Run the app** - it will automatically use real APIs when keys are configured, or fall back to simulated data.

### API Data Sources

The app fetches data from:
- **OpenWeatherMap**: Air temperature, wind speed/direction, pressure, cloud cover, precipitation, UV index
- **Stormglass**: Wave height, swell direction, water temperature, current strength
- **Google Maps Places API**: Location autocomplete suggestions (fallback to OpenWeatherMap geocoding if not configured)
- **NOAA**: Tide levels and predictions
- **Fallback**: Simulated data if APIs are unavailable or unconfigured

The app displays the data source in the conditions response for transparency.

## Project Structure

```
.
├── app.py                 # Flask backend (Python)
├── requirements.txt       # Python dependencies
├── Dockerfile             # Multi-stage Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── .dockerignore          # Files to exclude from Docker build
├── .env.example           # Example environment variables
├── templates/
│   └── index.html         # Main HTML template
└── static/
    ├── styles.css         # CSS styling with animations
    └── client.js          # Client-side JavaScript
```

## Technologies

- **Backend**: Python 3.11, Flask 3.0.0, Gunicorn
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **API**: RESTful API with JSON responses
- **Containerization**: Docker (multi-stage build), Docker Compose
- **Environment**: python-dotenv for configuration

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## Safety Features

- **Severe Conditions Detection**: Automatic warnings for dangerous ocean conditions
- **Conditional Data Display**: Only shows available data, hides missing information
- **Clear Suitability Indicators**: Color-coded recommendations for user safety
- **Real-time Updates**: Current conditions with timestamp display

## License

Free to use and modify.
