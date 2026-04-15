import pandas as pd
import json

df = pd.read_csv("data.csv")

weather_map = {
    "Clear":            "Dégagé",
    "Fair":             "Dégagé",
    "Mostly Cloudy":    "Nuageux",
    "Cloudy":           "Nuageux",
    "Overcast":         "Nuageux",
    "Partly Cloudy":    "Part. nuageux",
    "Scattered Clouds": "Part. nuageux",
    "Light Rain":       "Pluie légère",
    "Light Drizzle":    "Pluie légère",
    "Rain":             "Pluie",
    "Heavy Rain":       "Pluie",
    "Fog":              "Brouillard",
    "Mist":             "Brouillard",
    "Haze":             "Brouillard",
    "Light Snow":       "Neige",
    "Snow":             "Neige",
    "Heavy Snow":       "Neige",
    "Thunderstorm":     "Orage",
    "Thunder":          "Orage",
    "T-Storm":          "Orage",
}

# ── Q11 : stacked by weather category × severity ────────────────────────────
df["weather_cat"] = df["Weather_Condition"].map(weather_map)
df_w = df.dropna(subset=["weather_cat"])

totals = df_w.groupby("weather_cat")["ID"].count().rename("total")

agg = (
    df_w.groupby(["weather_cat", "Severity"])
    .size()
    .reset_index(name="count")
)
agg = agg.merge(totals, on="weather_cat")
agg = agg.sort_values("total", ascending=False)

stacked_records = [
    {
        "category": row["weather_cat"],
        "severity": int(row["Severity"]),
        "count":    int(row["count"]),
    }
    for _, row in agg.iterrows()
]

with open("data/viz4_weather_stacked.json", "w", encoding="utf-8") as f:
    json.dump(stacked_records, f, indent=2, ensure_ascii=False)

# ── Q13 : temperature bins 5°F wide, -20 to 120°F ───────────────────────────
df_t = df.dropna(subset=["Temperature(F)"])
total_rows = len(df_t)

bins   = list(range(-20, 121, 5))
labels = [f"{lo}–{lo+5}" for lo in bins[:-1]]

df_t = df_t.copy()
df_t["temp_bin"] = pd.cut(df_t["Temperature(F)"], bins=bins, labels=labels, right=False)
df_t = df_t.dropna(subset=["temp_bin"])

temp_agg = df_t.groupby("temp_bin", observed=True).size().reset_index(name="accident_count")
temp_agg["exposure_pct"] = (temp_agg["accident_count"] / total_rows * 100).round(3)

temp_records = [
    {
        "bin_label":      str(row["temp_bin"]),
        "accident_count": int(row["accident_count"]),
        "exposure_pct":   row["exposure_pct"],
    }
    for _, row in temp_agg.iterrows()
]

with open("data/viz4_temperature.json", "w", encoding="utf-8") as f:
    json.dump(temp_records, f, indent=2, ensure_ascii=False)

print("Exported -> data/viz4_weather_stacked.json + data/viz4_temperature.json")
