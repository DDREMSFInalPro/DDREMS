import requests

data = {
    "price": 2000000,
    "bedrooms": 3,
    "location": "DireDawa"
}

response = requests.post("http://127.0.0.1:5000/recommend", json=data)
print(response.json())