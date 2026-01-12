
import sys
import json
import os

try:
    import pandas as pd
except ImportError:
    print(json.dumps({"error": "pandas not installed"}))
    sys.exit(1)

try:
    import openpyxl
except ImportError:
    print(json.dumps({"error": "openpyxl not installed"}))
    sys.exit(1)

file_path = r"d:\OneDrive - Quadrobay Technologies Pvt Ltd\bloom-career-journey\Assessments\my_inspiration.xlsx"

if not os.path.exists(file_path):
    print(json.dumps({"error": f"File not found at {file_path}"}))
    sys.exit(1)

try:
    # Read the Excel file
    # Assuming the first sheet contains the data
    df = pd.read_excel(file_path, engine='openpyxl')
    
    # Clean up keys: lower case and replace spaces with underscores
    df.columns = [str(col).strip().lower().replace(" ", "_") for col in df.columns]
    
    # Convert to list of dicts
    data = df.to_dict(orient='records')

    # Write to file with UTF-8 encoding
    output_path = os.path.join(os.path.dirname(file_path), '../scripts/my_inspiration_data.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully wrote to {output_path}")

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
