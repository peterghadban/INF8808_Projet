import pandas as pd
import json

df = pd.read_csv("data.csv")
df["Start_Time"] = pd.to_datetime(df["Start_Time"], format="mixed")

df["hour"]      = df["Start_Time"].dt.hour
df["dayofweek"] = df["Start_Time"].dt.dayofweek  # 0=Monday, 6=Sunday

agg = (
    df.groupby(["dayofweek", "hour"])
    .agg(count=("ID", "count"))
    .reset_index()
)

records = agg.to_dict(orient="records")
with open("data/viz2_weekhour.json", "w") as f:
    json.dump(records, f, indent=2)

# Day/night summary
day_mask   = df["hour"].between(6, 19)
day_count  = int(day_mask.sum())
night_count = int((~day_mask).sum())
total      = day_count + night_count

summary = {
    "day_pct":   round(day_count   / total * 100, 1),
    "night_pct": round(night_count / total * 100, 1),
}
with open("data/viz2_daynight.json", "w") as f:
    json.dump(summary, f, indent=2)

print(f"Exported {len(records)} rows -> data/viz2_weekhour.json + data/viz2_daynight.json")
