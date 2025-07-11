from flask import Flask, request, jsonify
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

app = Flask(__name__)

# ========== Load and Train Model at Startup ==========
print("🔄 Loading dataset and training model...")
data = pd.read_csv("/content/Eartquakes-1990-2023.csv", on_bad_lines='skip')
data = data.dropna(subset=['magnitudo', 'latitude', 'longitude', 'depth', 'place', 'date'])
data['date'] = pd.to_datetime(data['date'], errors='coerce')
data = data[data['date'].notnull()]
data['state'] = data['place'].str.extract(r',\s*([\w\s]+)$')
data = data.dropna(subset=['state'])

# Model features and training
features = ["magnitudo", "depth", "latitude", "longitude"]
data_numeric = data[features]
X = data_numeric.drop(columns=["magnitudo"])
y = data_numeric["magnitudo"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

mse = mean_squared_error(y_test, model.predict(X_test))
print("✅ Model trained. Ready to serve requests.")

# ========== API Endpoint ==========
@app.route('/predict', methods=['POST'])
def predict_magnitude():
    try:
        req_data = request.get_json()

        # Validate input
        if not all(k in req_data for k in ("depth", "latitude", "longitude")):
            return jsonify({"error": "Missing one or more required fields: depth, latitude, longitude"}), 400

        depth = float(req_data["depth"])
        latitude = float(req_data["latitude"])
        longitude = float(req_data["longitude"])

        input_df = pd.DataFrame([[depth, latitude, longitude]], columns=["depth", "latitude", "longitude"])
        prediction = model.predict(input_df)[0]

        return jsonify({
            "input": {
                "depth": depth,
                "latitude": latitude,
                "longitude": longitude
            },
            "prediction": {
                "magnitude": float(round(prediction, 2))
            },
            "model_metrics": {
                "mean_squared_error": float(round(mse, 4))
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========== Run App ==========
if __name__ == '__main__':
    app.run(debug=True)
