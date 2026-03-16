import pandas as pd
import json

df = pd.read_csv("data.csv")

agg = (
    df.groupby("State")
    .agg(count=("ID", "count"), avg_severity=("Severity", "mean"))
    .reset_index()
)

agg["avg_severity"] = agg["avg_severity"].round(2)

# Result: { "CA": { "count": 750000, "avg_severity": 2.1 }, ... }
result = {
    row["State"]: {
        "count":        int(row["count"]),
        "avg_severity": row["avg_severity"],
    }
    for _, row in agg.iterrows()
}

with open("data/viz3_states.json", "w") as f:
    json.dump(result, f, indent=2)

print(f"Exported {len(result)} states -> data/viz3_states.json")
