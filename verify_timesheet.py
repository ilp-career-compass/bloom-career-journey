import csv
from datetime import timedelta

def parse_duration(duration_str):
    try:
        if not duration_str: return timedelta(0)
        parts = list(map(int, duration_str.split(':')))
        if len(parts) == 3:
            return timedelta(hours=parts[0], minutes=parts[1], seconds=parts[2])
    except ValueError:
        pass
    return timedelta(0)

total_duration = timedelta(0)
with open('timesheet.csv', 'r') as f:
    reader = csv.reader(f)
    header = next(reader) # Skip header
    for row in reader:
        if not row: continue
        if row[0] == 'Total': continue # Skip the total row itself if present
        if len(row) > 4:
            total_duration += parse_duration(row[4])

total_seconds = int(total_duration.total_seconds())
hours = total_seconds // 3600
minutes = (total_seconds % 3600) // 60
seconds = total_seconds % 60

print(f"Total Hours: {hours}")
print(f"Total Time: {hours}:{minutes:02d}:{seconds:02d}")
