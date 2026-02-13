import os
import datetime
import csv
from pathlib import Path

# Path to Antigravity brain
brain_path = r"C:\Users\harsh\.gemini\antigravity\brain"

def get_session_times():
    sessions = []
    
    if not os.path.exists(brain_path):
        print(f"Error: Path {brain_path} does not exist.")
        return []

    for entry in os.scandir(brain_path):
        if entry.is_dir():
            folder_path = Path(entry.path)
            creation_time = folder_path.stat().st_ctime
            
            # Find the latest modification time of any file in the folder
            latest_mtime = creation_time
            try:
                files = list(folder_path.glob('*'))
                if files:
                    latest_mtime = max(f.stat().st_mtime for f in files)
            except Exception as e:
                print(f"Error reading {folder_path}: {e}")
                continue

            # Calculate duration
            start_dt = datetime.datetime.fromtimestamp(creation_time)
            end_dt = datetime.datetime.fromtimestamp(latest_mtime)
            raw_duration = (end_dt - start_dt).total_seconds() / 3600.0 # Hours
            
            # Heuristic: Cap at 8 hours (standard work day) to handle multi-day sessions
            # where the user didn't close the session.
            duration = min(raw_duration, 8.0)
            
            # Minimal session time
            if duration < (5/60): 
                duration = 5/60
            
            sessions.append({
                'date': start_dt.date(),
                'start': start_dt,
                'end': end_dt,
                'duration': duration,
                'id': entry.name
            })
            
    return sessions

import subprocess

# ... (omitted: brain_path definition)

def get_git_sessions():
    sessions = []
    try:
        # Get all commit timestamps
        cmd = ["git", "log", "--format=%ad", "--date=iso-strict"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        timestamps = result.stdout.strip().split('\n')
        
        daily_commits = {}
        for ts_str in timestamps:
            if not ts_str: continue
            try:
                dt = datetime.datetime.fromisoformat(ts_str)
                date_key = dt.date()
                if date_key not in daily_commits:
                    daily_commits[date_key] = []
                daily_commits[date_key].append(dt)
            except ValueError:
                continue
                
        # Estimate duration from commits
        for date_key, commits in daily_commits.items():
            commits.sort()
            if not commits: continue
            
            # Heuristic: Time between first and last commit + 1 hour buffer
            # If only one commit, assume 1 hour.
            first_commit = commits[0]
            last_commit = commits[-1]
            duration = (last_commit - first_commit).total_seconds() / 3600.0 + 1.0
            
            # Cap at 8 hours
            duration = min(duration, 8.0)
            
            sessions.append({
                'date': date_key,
                'start': first_commit,
                'end': last_commit, # Approximate
                'duration': duration,
                'source': 'Git History'
            })
            
    except Exception as e:
        print(f"Error getting git sessions: {e}")
        
    return sessions

def get_manual_sessions():
    sessions = []
    manual_file = 'manual_log.csv'
    if not os.path.exists(manual_file):
        return sessions
        
    try:
        with open(manual_file, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or len(row) < 2: continue
                date_str = row[0].strip()
                duration_str = row[1].strip()
                
                try:
                    dt = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                    # Parse HH:MM:SS
                    h, m, s = map(int, duration_str.split(':'))
                    duration = h + m/60.0 + s/3600.0
                    
                    sessions.append({
                        'date': dt,
                        'duration': duration,
                        'source': 'Manual Log'
                    })
                except ValueError:
                    continue
    except Exception as e:
        print(f"Error reading manual log: {e}")
        
    return sessions

def merge_sessions(antigravity_sessions, git_sessions, manual_sessions):
    # Create a map by date
    merged_data = {}
    
    # Priority 1: Manual Data (Highest)
    for s in manual_sessions:
        d = s['date']
        merged_data[d] = {
            'hours': s['duration'],
            'sessions': 1,
            'sources': {'Manual Log'}
        }
    
    # Priority 2: Antigravity Data
    for s in antigravity_sessions:
        d = s['date']
        if d not in merged_data:
             merged_data[d] = {'hours': 0, 'sessions': 0, 'sources': set()}
             merged_data[d]['hours'] += s['duration']
             merged_data[d]['sessions'] += 1
             merged_data[d]['sources'].add('Antigravity')
        # If manual data exists, we ignore Antigravity for that day to avoid double counting
        # or conflicts, assuming manual log is the source of truth.

    # Priority 3: Git Data (fill gaps)
    for s in git_sessions:
        d = s['date']
        if d not in merged_data:
            merged_data[d] = {
                'hours': s['duration'], 
                'sessions': 1, 
                'sources': {'Git'}
            }
            
    return merged_data

def format_duration(hours):
    total_seconds = int(hours * 3600)
    h = total_seconds // 3600
    m = (total_seconds % 3600) // 60
    s = total_seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"

def generate_csv(daily_stats, start_date_str=None):
    sorted_dates = sorted(daily_stats.keys())
    
    # Filter by start date if provided
    if start_date_str:
        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        sorted_dates = [d for d in sorted_dates if d >= start_date]
    
    with open('timesheet_v2.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Day', 'Start Time', 'End Time', 'Duration', 'Description'])
        
        total_hours = 0
        for d in sorted_dates:
            stats = daily_stats[d]
            day_name = d.strftime('%A')
            hours = stats['hours']
            
            # Format Duration
            duration_str = format_duration(hours)
            
            # Synthesize Start/End times for timesheet consistency
            # Default start: 09:00:00
            start_dt = datetime.datetime.combine(d, datetime.time(9, 0, 0))
            end_dt = start_dt + datetime.timedelta(hours=hours)
            
            start_str = start_dt.strftime('%H:%M:%S')
            end_str = end_dt.strftime('%H:%M:%S')
            
            sources = ", ".join(sorted(stats.get('sources', [])))
            desc = "Software Development"
            
            total_hours += hours
            # Format date as DD-MM-YYYY for better Excel compatibility in IN locale
            date_str = d.strftime('%d-%m-%Y')
            writer.writerow([date_str, day_name, start_str, end_str, duration_str, desc])
            
        # Total row
        writer.writerow([])
        writer.writerow(['Total', '', '', '', format_duration(total_hours), ''])
        
    print(f"Generated timesheet.csv with {len(sorted_dates)} active days.")

if __name__ == "__main__":
    ag_data = get_session_times()
    git_data = get_git_sessions()
    manual_data = get_manual_sessions()
    
    merged = merge_sessions(ag_data, git_data, manual_data)
    
    # Generate full history without start date filter to include earliest manual entries
    generate_csv(merged, start_date_str=None)
