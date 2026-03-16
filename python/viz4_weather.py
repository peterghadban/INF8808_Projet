import pandas as pd
import numpy as np
import json

df = pd.read_csv("data.csv")

# Group the 144 Weather_Condition values into broad categories
weather_map = {
    "Clear":              "Dégagé",
    "Fair":               "Dégagé",
    "Mostly Cloudy":      "Nuageux",
    "Cloudy":             "Nuageux",
    "Overcast":           "Nuageux",
    "Partly Cloudy":      "Part. nuageux",
    "Scattered Clouds":   "Part. nuageux",
    "Light Rain":         "Pluie légère",
    "Light Drizzle":      "Pluie légère",
    "Rain":               "Pluie",
    "Heavy Rain":         "Pluie",
    "Fog":                "Brouillard",
    "Mist":               "Brouillard",
    "Haze":               "Brouillard",
    "Light Snow":         "Neige",
    "Snow":               "Neige",
    "Heavy Snow":         "Neige",
    "Thunderstorm":       "Orage",
    "Thunder":            "Orage",
    "T-Storm":            "Orage",
}

df["weather_cat"] = df["Weather_Condition"].map(weather_map)
df = df.dropna(subset=["weather_cat"])

def quantiles(series):
    return {
        "min":    round(float(series.quantile(0.05)), 3),
        "q1":     round(float(series.quantile(0.25)), 3),
        "median": round(float(series.median()),       3),
        "q3":     round(float(series.quantile(0.75)), 3),
        "max":    round(float(series.quantile(0.95)), 3),
        "count":  int(len(series)),
    }

records = []
for cat, group in df.groupby("weather_cat"):
    records.append({
        "category":      cat,
        "severity":      quantiles(group["Severity"]),
        "precipitation": quantiles(group["Precipitation(in)"].fillna(0)),
        "count":         int(len(group)),
    })

records.sort(key=lambda r: -r["count"])

with open("data/viz4_weather.json", "w") as f:
    json.dump(records, f, indent=2)

print(f"Exported {len(records)} categories -> data/viz4_weather.json")
