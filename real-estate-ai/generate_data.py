import pandas as pd
import random

locations = ["DireDawa", "AddisAbaba", "Hawassa", "BahirDar", "Adama"]
actions = ["view", "click", "save", "buy"]

data = []

for i in range(1000):  # 1000 rows
    user_id = random.randint(1, 100)
    price = random.randint(800000, 4000000)
    location = random.choice(locations)
    bedrooms = random.randint(1, 5)
    property_id = random.randint(100, 500)
    action = random.choice(actions)
    data.append([user_id, price, location, bedrooms, property_id, action])

df = pd.DataFrame(data, columns=["user_id","price","location","bedrooms","property_id","action"])
df.to_csv("data.csv", index=False)

print("✅ Sample dataset generated as data.csv")