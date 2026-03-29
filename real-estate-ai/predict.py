import pickle
import pandas as pd

# Load model and encoder
model, le = pickle.load(open("model.pkl", "rb"))

# Load dataset
data = pd.read_csv("data.csv")

# Example user input
location = le.transform(["DireDawa"])[0]
user_input = [[2000000, 3, location]]

# Get nearest neighbors
distances, indices = model.kneighbors(user_input)

print("Recommended Properties for the user input:")
print(data.iloc[indices[0]])