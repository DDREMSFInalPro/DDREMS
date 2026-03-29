"""
Train the KNN recommendation model from data.csv
Run: python train_model.py
"""
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import pickle

DATA_FILE = "data.csv"
MODEL_FILE = "model.pkl"

def train():
    data = pd.read_csv(DATA_FILE)

    # Action weights: buy > save > click > view
    action_score = {"view": 1, "click": 2, "save": 3, "buy": 5}
    data["score"] = data["action"].map(action_score).fillna(1)

    # Encode location
    le = LabelEncoder()
    data["location_enc"] = le.fit_transform(data["location"])

    # Scale features so price doesn't dominate
    scaler = MinMaxScaler()
    X = scaler.fit_transform(data[["price", "bedrooms", "location_enc"]])

    # Train KNN — use enough neighbors to always return 5
    k = min(10, len(data))
    model = NearestNeighbors(n_neighbors=k, metric="euclidean")
    model.fit(X)

    with open(MODEL_FILE, "wb") as f:
        pickle.dump({"model": model, "le": le, "scaler": scaler, "data": data}, f)

    print(f"✅ Model trained on {len(data)} records and saved to {MODEL_FILE}")
    print(f"   Locations: {list(le.classes_)}")

if __name__ == "__main__":
    train()
