"""SQLite Database for Crowd-Sourced Reports"""

import sqlite3
from pathlib import Path
from typing import Optional, List, Dict

DB_PATH = Path(__file__).parent.parent / "data" / "reports.db"


def init_db() -> None:
    """Create the reports table if it doesn't exist."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            perceived_quality TEXT NOT NULL,
            comment TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at)
    """)
    
    conn.commit()
    conn.close()


def save_report(
    lat: float, 
    lon: float, 
    perceived_quality: str, 
    comment: Optional[str] = None,
    ip_address: Optional[str] = None
) -> int:
    """Save a crowd-sourced air quality report."""
    
    valid_qualities = ['good', 'moderate', 'bad', 'very_bad']
    if perceived_quality not in valid_qualities:
        raise ValueError(f"Invalid quality. Must be one of: {valid_qualities}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO reports (lat, lon, perceived_quality, comment, ip_address)
        VALUES (?, ?, ?, ?, ?)
    """, (lat, lon, perceived_quality, comment, ip_address))
    
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return report_id


def get_all_reports() -> List[Dict]:
    """Get all reports for export."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, lat, lon, perceived_quality, comment, created_at
        FROM reports ORDER BY created_at DESC
    """)
    
    reports = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return reports


def get_report_count() -> int:
    """Get total number of reports."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM reports")
    count = cursor.fetchone()[0]
    conn.close()
    return count


init_db()
