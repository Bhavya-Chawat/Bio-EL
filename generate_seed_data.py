import json
import random

curated_districts = {
    "Kerala": ["Ernakulam", "Thrissur", "Alappuzha", "Idukki", "Kottayam", "Wayanad"],
    "Assam": ["Cachar", "Nagaon", "Barpeta", "Dhemaji", "Morigaon", "Lakhimpur"],
    "Tamil Nadu": ["Chennai", "Kancheepuram", "Cuddalore", "Tiruvallur", "Nagapattinam"],
    "Bihar": ["Darbhanga", "Muzaffarpur", "Purnia", "Katihar", "Saharsa"],
    "Odisha": ["Puri", "Balasore", "Kendrapara", "Ganjam", "Jagatsinghpur"],
    "West Bengal": ["Malda", "Murshidabad", "Howrah", "North 24 Parganas", "Cooch Behar"],
    "Uttar Pradesh": ["Gorakhpur", "Ballia", "Varanasi"],
    "Telangana": ["Hyderabad"],
    "Maharashtra": ["Kolhapur"],
    "Gujarat": ["Vadodara"]
}

base_lat_lng = {
    "Kerala": (10.0, 76.5),
    "Assam": (26.0, 92.5),
    "Tamil Nadu": (12.5, 80.0),
    "Bihar": (26.0, 86.0),
    "Odisha": (20.0, 85.5),
    "West Bengal": (24.0, 88.0),
    "Uttar Pradesh": (26.5, 82.5),
    "Telangana": (17.3, 78.4),
    "Maharashtra": (16.7, 74.2),
    "Gujarat": (22.3, 73.1)
}

districts_data = []
lgd_counter = 1

for state, districts in curated_districts.items():
    lat, lng = base_lat_lng[state]
    for d in districts:
        districts_data.append({
            "lgd_code": f"{lgd_counter:03d}",
            "name": d,
            "state": state,
            "centroid_lat": lat + random.uniform(-0.5, 0.5),
            "centroid_lng": lng + random.uniform(-0.5, 0.5),
            "population": random.randint(100000, 5000000),
            "open_defecation_pct": random.uniform(5.0, 40.0),
            "elderly_child_pct": random.uniform(15.0, 45.0),
            "hospital_density_per_100k": random.uniform(10.0, 100.0),
            "river_danger_mark_m": random.uniform(5.0, 30.0),
            "historical_flood_freq_per_decade": random.randint(1, 10)
        })
        lgd_counter += 1

import os
os.makedirs("backend/app/seed/data", exist_ok=True)
with open("backend/app/seed/data/curated_districts.json", "w") as f:
    json.dump(districts_data, f, indent=2)

def generate_historical(event_name, state, start_date):
    event_data = {
        "event": event_name,
        "start_date": start_date,
        "outbreak_markers": [
            {"district": curated_districts[state][0], "date": f"{start_date}T12:00:00Z", "disease": "Cholera"}
        ],
        "series": []
    }
    os.makedirs("backend/app/seed/historical", exist_ok=True)
    with open(f"backend/app/seed/historical/{event_name}.json", "w") as f:
        json.dump(event_data, f, indent=2)

generate_historical("kerala_2018", "Kerala", "2018-08-10")
generate_historical("chennai_2015", "Tamil Nadu", "2015-11-20")
generate_historical("assam_2022", "Assam", "2022-06-15")

print("Mock data generated")
