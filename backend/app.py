from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime, timedelta


app = Flask(__name__)
CORS(app)

OPENCAGE_API_KEY = "fbdc716045004cdfab2f5ddb825cd0de"
NASA_API_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"

#X-RapidAPI-Key
#9ae47a33famshf7d530901ff2e44p1b9ca9jsnb5facb76285d

@app.route('/api/disaster-info', methods=['POST'])
def get_disaster_info():
    data = request.json
    city = data.get('city')
    country = data.get('country')

    # Geocoding
    geo_url = f"https://api.opencagedata.com/geocode/v1/json?q={city},{country}&key={OPENCAGE_API_KEY}"
    print(geo_url)
    geo_resp = requests.get(geo_url)
    geo_data = geo_resp.json()

    if not geo_data['results']:
        return jsonify({'error': 'Location not found'}), 404

    lat = geo_data['results'][0]['geometry']['lat']
    lon = geo_data['results'][0]['geometry']['lng']

    print(f"Coordinates for {city}, {country}: {lat}, {lon}")

    # NASA API
    params = {
        "parameters": "T2M, RH2M",
        "community": "AG",
        "start": "20250710",
        "end": "20250710",
        "latitude": lat,
        "longitude": lon,
        "format": "JSON"
    }

    response = weather_alerts(lat, lon)

    print(response)

    return response

#50befe7f614e4696b9493630251107

# WeatherAPI Config
WEATHER_API_KEY = "50befe7f614e4696b9493630251107"  # Replace with your actual WeatherAPI key
WEATHER_API_URL = "http://api.weatherapi.com/v1/current.json"

# USGS Earthquake API Config
USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

# Rain detection logic
RAIN_KEYWORDS = ["rain", "shower", "drizzle", "thunder"]


def get_weather_data(lat, lon):
    location = f"{lat},{lon}"
    params = {
        "key": WEATHER_API_KEY,
        "q": location,
        "aqi": "no"
    }

    response = requests.get(WEATHER_API_URL, params=params)
    if response.status_code != 200:
        return None, response.json()

    data = response.json()
    current = data["current"]
    condition_text = current["condition"]["text"].lower()
    precip_mm = current.get("precip_mm", 0)

    is_rain_expected = any(word in condition_text for word in RAIN_KEYWORDS)
    is_heavy_rain = precip_mm > 10
    is_flood_risk = precip_mm > 25 and is_rain_expected

    weather = {
        "location": data["location"]["name"],
        "region": data["location"]["region"],
        "country": data["location"]["country"],
        "temperature_celsius": current["temp_c"],
        "condition": current["condition"]["text"],
        "feels_like_celsius": current["feelslike_c"],
        "humidity": current["humidity"],
        "wind_kph": current["wind_kph"],
        "precip_mm": precip_mm,
        "is_rain_expected": is_rain_expected,
        "is_heavy_rain": is_heavy_rain,
        "is_flood_risk": is_flood_risk
    }
    print(weather)
    return weather, None


def get_earthquake_data(lat, lon, radius_km=300):
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)

    params = {
        "format": "geojson",
        "latitude": lat,
        "longitude": lon,
        "maxradiuskm": radius_km,
        "starttime": yesterday.isoformat(),
        "endtime": now.isoformat()
    }

    response = requests.get(USGS_API_URL, params=params)
    if response.status_code != 200:
        return []

    data = response.json()
    print(data)
    earthquakes = []
    for feature in data.get("features", []):
        props = feature["properties"]
        earthquakes.append({
            "place": props.get("place"),
            "magnitude": props.get("mag"),
            "time": datetime.utcfromtimestamp(props["time"] / 1000).isoformat() + "Z"
        })
    print(earthquakes)
    return earthquakes



def weather_alerts(lat, lon):
    #lat = request.args.get("lat", type=float)
    #lon = request.args.get("lon", type=float)

    if lat is None or lon is None:
        return jsonify({"error": "Missing lat or lon parameters"}), 400

    weather_data, error = get_weather_data(lat, lon)
    if error:
        return jsonify({"error": "Weather API failed", "details": error}), 500

    earthquake_data = get_earthquake_data(lat, lon)
    print(earthquake_data)

    return jsonify({
    "weather": weather_data,
    "earthquake_alerts": earthquake_data or "No recent earthquakes in the area."
    })


if __name__ == "__main__":
    app.run(debug=True)
