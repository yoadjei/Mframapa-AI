"""Export Crowd Reports for Retraining"""

import csv
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from backend.utils.database import get_all_reports

OUTPUT_DIR = Path(__file__).parent.parent / "data"


def export_reports():
    print("Exporting crowd reports...")
    
    reports = get_all_reports()
    if not reports:
        print("No reports to export")
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = OUTPUT_DIR / f"crowd_reports_{timestamp}.csv"
    
    quality_to_pm25 = {"good": 10, "moderate": 35, "bad": 75, "very_bad": 175}
    
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['datetime', 'lat', 'lon', 'perceived_quality', 'estimated_pm25', 'comment'])
        for r in reports:
            writer.writerow([
                r['created_at'], r['lat'], r['lon'], r['perceived_quality'],
                quality_to_pm25.get(r['perceived_quality'], 50), r.get('comment', '')
            ])
    
    print(f"Exported {len(reports)} reports to {output_file}")


if __name__ == "__main__":
    export_reports()
