"""
DDREMS AI Recommendation Service (root entry point)
Trains on real-estate-ai/data.csv — no database required.
Endpoint: POST /recommend  { price, bedrooms, location }
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import pandas as pd
import pickle
import os

DATA_FILE  = os.path.join("real-estate-ai", "data.csv")
MODEL_FILE = os.path.join("real-estate-ai", "model.pkl")

app = Flask(__name__)
CORS(app)  # allow all origins

# ── model lifecycle ───────────────────────────────────────────────────────────

def train_and_save():
    data = pd.read_csv(DATA_FILE)
    action_score = {"view": 1, "click": 2, "save": 3, "buy": 5}
    data["score"] = data["action"].map(action_score).fillna(1)

    le = LabelEncoder()
    data["location_enc"] = le.fit_transform(data["location"])

    scaler = MinMaxScaler()
    X = scaler.fit_transform(data[["price", "bedrooms", "location_enc"]])

    k = min(10, len(data))
    model = NearestNeighbors(n_neighbors=k, metric="euclidean")
    model.fit(X)

    with open(MODEL_FILE, "wb") as f:
        pickle.dump({"model": model, "le": le, "scaler": scaler, "data": data}, f)

    print(f"✅ Model trained on {len(data)} records. Locations: {list(le.classes_)}")
    return model, le, scaler, data


def load_artifacts():
    if not os.path.exists(MODEL_FILE):
        print("⚙️  model.pkl not found — training now...")
        return train_and_save()
    with open(MODEL_FILE, "rb") as f:
        bundle = pickle.load(f)
    return bundle["model"], bundle["le"], bundle["scaler"], bundle["data"]


model, le, scaler, dataset = load_artifacts()
KNOWN_LOCATIONS = list(le.classes_)

# ── recommendation logic ──────────────────────────────────────────────────────

def get_recommendations(price, bedrooms, location, top_n=5):
    loc_enc = int(le.transform([location])[0])
    user_vec = scaler.transform([[price, bedrooms, loc_enc]])
    _, indices = model.kneighbors(user_vec)

    rows = dataset.iloc[indices[0]]
    rows = rows.sort_values("score", ascending=False).drop_duplicates("property_id")

    results = []
    for _, row in rows.head(top_n).iterrows():
        results.append({
            "property_id": int(row["property_id"]),
            "id":          int(row["property_id"]),
            "location":    row["location"],
            "price":       float(row["price"]),
            "bedrooms":    int(row["bedrooms"]),
            "action":      row["action"],
            "score":       int(row["score"]),
        })
    return results

# ── routes ────────────────────────────────────────────────────────────────────

@app.route("/recommend", methods=["POST"])
def recommend():
    body = request.get_json(silent=True) or {}
    price    = body.get("price")
    bedrooms = body.get("bedrooms")
    location = body.get("location")

    if price is None or bedrooms is None or not location:
        return jsonify({"error": "Missing required fields: price, bedrooms, location"}), 400

    try:
        price    = float(price)
        bedrooms = int(bedrooms)
    except (ValueError, TypeError):
        return jsonify({"error": "price must be a number, bedrooms must be an integer"}), 400

    if location not in KNOWN_LOCATIONS:
        return jsonify({
            "error": f"Unknown location '{location}'. Valid: {KNOWN_LOCATIONS}"
        }), 400

    return jsonify(get_recommendations(price, bedrooms, location))


@app.route("/locations", methods=["GET"])
def locations():
    return jsonify({"locations": KNOWN_LOCATIONS})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "records": len(dataset), "locations": KNOWN_LOCATIONS})


@app.route("/retrain", methods=["POST"])
def retrain():
    global model, le, scaler, dataset, KNOWN_LOCATIONS
    model, le, scaler, dataset = train_and_save()
    KNOWN_LOCATIONS = list(le.classes_)
    return jsonify({"status": "retrained", "records": len(dataset)})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
