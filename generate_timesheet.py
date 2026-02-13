import subprocess
import datetime
import csv
import sys

try:
    # Git log command
    cmd = ["git", "log", "--date=short", "--format=%ad"]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    dates = result.stdout.strip().split('\n')
    
    # Process dates
    date_counts = {}
    for d in dates:
        if d:
            date_counts[d] = date_counts.get(d, 0) + 1
            
    sorted_dates = sorted(date_counts.keys())
    
    # Write CSV
    with open('timesheet.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Day', 'Commits', 'Hours', 'Description'])
        for d_str in sorted_dates:
            dt = datetime.datetime.strptime(d_str, '%Y-%m-%d')
            day_name = dt.strftime('%A')
            writer.writerow([d_str, day_name, date_counts[d_str], '', ''])
            
    print("Successfully generated timesheet.csv")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
