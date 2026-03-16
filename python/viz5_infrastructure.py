import pandas as pd
import numpy as np
import json

df = pd.read_csv("data.csv")

features = {
    "Junction":       "Intersection",
    "Traffic_Signal": "Feux de circ.",
    "Crossing":       "Passage piéton",
    "Stop":           "Stop / Céder",
    "Railway":        "Passage à niv.",
    "Amenity":        "Point d'intérêt",
}

total = len(df)
records = []

for col, label in features.items():
    if col not in df.columns:
        continue

    present = df[col] == True
    absent  = ~present

    p_count = int(present.sum())
    a_count = int(absent.sum())

    # Odds ratio: (accidents with feature / without) vs (non-accidents with / without)
    # Simplified here as rate present / rate absent (relative risk)
    rate_present = p_count / total
    rate_absent  = a_count / total
    odds_ratio   = round((p_count / a_count) / ((total - p_count) / (total - a_count)), 3) if a_count > 0 else None

    records.append({
        "feature":        label,
        "present_count":  p_count,
        "absent_count":   a_count,
        "present_pct":    round(p_count / total * 100, 2),
        "absent_pct":     round(a_count / total * 100, 2),
        "odds_ratio":     odds_ratio,
    })

with open("data/viz5_infrastructure.json", "w") as f:
    json.dump(records, f, indent=2)

print(f"Exported {len(records)} features -> data/viz5_infrastructure.json")
