import pandas as pd
import json

df = pd.read_csv("data.csv")
df["Start_Time"] = pd.to_datetime(df["Start_Time"], format="mixed")

df["year"]  = df["Start_Time"].dt.year
df["month"] = df["Start_Time"].dt.month

agg = (
    df.groupby(["year", "month"])
    .agg(count=("ID", "count"), avg_severity=("Severity", "mean"))
    .reset_index()
)

agg["avg_severity"] = agg["avg_severity"].round(2)

records = agg.to_dict(orient="records")
with open("data/viz1_temporal.json", "w") as f:
    json.dump(records, f, indent=2)

print(f"Exported {len(records)} rows -> data/viz1_temporal.json")
