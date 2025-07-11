from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

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
    geo_resp = requests.get(geo_url)
    geo_data = geo_resp.json()

    if not geo_data['results']:
        return jsonify({'error': 'Location not found'}), 404

    lat = geo_data['results'][0]['geometry']['lat']
    lon = geo_data['results'][0]['geometry']['lng']

    # NASA API
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M,PRECTOT",
        "start": "20250710",
        "end": "20250710",
        "latitude": lat,
        "longitude": lon,
        "format": "JSON"
    }

    nasa_resp = requests.get(NASA_API_BASE, params=params)
    if nasa_resp.status_code != 200:
        return jsonify({'error': 'Failed to fetch NASA data'}), 500

    result = nasa_resp.json()['properties']['parameter']

    return jsonify({
        "location": f"{city}, {country}",
        "latitude": lat,
        "longitude": lon,
        "data": result
    })

if __name__ == '__main__':
    app.run(debug=True)
