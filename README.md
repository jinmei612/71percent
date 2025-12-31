# 🌊 Ocean Activity Guide

A beautiful web application that helps you find the best ocean activity for the day based on current weather and ocean conditions.

## Features

- **Real-time Recommendations**: Get personalized recommendations for the best ocean activity based on current conditions
- **Multiple Activities**: Evaluates 4 different ocean activities:
  - 🏄 Surfing
  - 🤿 Scuba Diving
  - 🧜 Freediving
  - 🎣 Fishing

- **Condition Analysis**: Displays current ocean conditions including:
  - Water temperature
  - Wave height
  - Wind speed
  - Visibility

- **Activity Scoring**: Each activity is scored (0-100) based on how ideal the conditions are
- **Beautiful UI**: Modern, responsive design with gradient backgrounds and smooth animations

## How It Works

The app evaluates ocean conditions and scores each activity based on:
- **Surfing**: Ideal wave height (3-6 ft), moderate wind (10-20 mph), offshore winds preferred
- **Scuba Diving**: High visibility (50+ ft), calm conditions, low current, comfortable water temperature
- **Freediving**: Excellent visibility (60+ ft), very calm conditions, minimal current, warm water (no wetsuit)
- **Fishing**: Calm conditions, stable barometric pressure, moderate wind, favorable tide conditions

## Usage

1. Install Python dependencies (see Setup below)
2. Run the Flask server: `python app.py`
3. Open your browser to `http://localhost:5000`
4. Enter a location (default: San Diego, CA)
5. Click "Search" or press Enter
6. View the recommended best activity and see scores for all activities

## Setup

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

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
   
   **Stormglass** (Optional - for wave height, water temp, currents):
   - Sign up at: https://stormglass.io/
   - Free tier: 50 requests/day
   - Add to `.env`: `STORMGLASS_API_KEY=your_key_here`
   
   **NOAA Tides & Currents** (Optional - for tide data):
   - Free, no API key needed
   - Find station ID at: https://tidesandcurrents.noaa.gov/
   - Add to `.env`: `NOAA_STATION_ID=9410170` (example: San Diego)

3. **Edit `.env` file** with your API keys:
   ```env
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   STORMGLASS_API_KEY=your_stormglass_api_key_here
   NOAA_STATION_ID=9410170
   ```

4. **Run the app** - it will automatically use real APIs when keys are configured, or fall back to simulated data.

### API Data Sources

The app fetches data from:
- **OpenWeatherMap**: Air temperature, wind speed/direction, pressure, cloud cover, precipitation
- **Stormglass**: Wave height, swell direction, water temperature, current strength
- **NOAA**: Tide levels and predictions
- **Fallback**: Simulated data if APIs are unavailable or unconfigured

The app displays the data source in the conditions response.

## Project Structure

```
.
├── app.py                 # Flask backend (Python)
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html         # Main HTML template
└── static/
    ├── styles.css         # CSS styling
    └── client.js          # Client-side JavaScript
```

## Technologies

- **Backend**: Python 3, Flask
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: RESTful API with JSON responses

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

Free to use and modify.

