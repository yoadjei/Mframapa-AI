"""
fetch_weather.py - enrich observations with historical weather from Open-Meteo

takes the raw openaq data and adds weather columns (temp, humidity, pressure,
wind_speed, clouds, precip) by querying the Open-Meteo archive API.

includes rate-limit handling with exponential backoff.
groups requests by unique location to minimize total API calls.

outputs: pipeline/data/with_weather.csv
"""

import time
import requests
import pandas as pd
import numpy as np
from config import (
    OPENMETEO_ARCHIVE_URL, WEATHER_VARIABLES, WEATHER_COLUMN_MAP,
    RAW_OPENAQ_FILE, WITH_WEATHER_FILE,
    OPENMETEO_DELAY_SECONDS, OPENMETEO_RETRY_DELAY, OPENMETEO_MAX_RETRIES
)


def safe_meteo_request(params):
    """
    make a GET request to Open-Meteo with rate-limit handling and backoff.
    returns (response_json, success).
    """
    for attempt in range(OPENMETEO_MAX_RETRIES + 1):
        try:
            resp = requests.get(OPENMETEO_ARCHIVE_URL, params=params, timeout=60)

            if resp.status_code == 200:
                return resp.json(), True

            if resp.status_code == 429:
                wait = OPENMETEO_RETRY_DELAY * (2 ** attempt)
                print(f"    rate limited (429), waiting {wait}s (attempt {attempt+1})...")
                time.sleep(wait)
                continue

            if resp.status_code in (502, 503, 504):
                wait = OPENMETEO_RETRY_DELAY * (2 ** attempt)
                print(f"    server error ({resp.status_code}), waiting {wait}s...")
                time.sleep(wait)
                continue

            print(f"    weather API error {resp.status_code}")
            return None, False

        except requests.exceptions.Timeout:
            wait = 10 * (2 ** attempt)
            print(f"    timeout, waiting {wait}s...")
            time.sleep(wait)
            continue

        except requests.exceptions.RequestException as e:
            print(f"    request error: {e}")
            return None, False

    print(f"    max retries exhausted for weather request")
    return None, False


def fetch_weather_for_location(lat, lon, start_date, end_date):
    """
    fetch hourly weather data for a single location from Open-Meteo archive.
    returns a dataframe with datetime and weather columns.
    """
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "start_date": start_date,
        "end_date": end_date,
        "hourly": ",".join(WEATHER_VARIABLES),
        "timezone": "UTC"
    }

    data, ok = safe_meteo_request(params)
    if not ok or data is None:
        return None

    hourly = data.get("hourly", {})
    if not hourly or "time" not in hourly:
        return None

    weather_df = pd.DataFrame({"datetime": pd.to_datetime(hourly["time"], utc=True)})

    for api_var, col_name in WEATHER_COLUMN_MAP.items():
        weather_df[col_name] = hourly.get(api_var)

    return weather_df


def enrich_with_weather():
    """main entry point: load raw openaq data and add weather features"""
    print("=" * 60)
    print("STEP 2: Enriching observations with weather data")
    print(f"  Rate limit: {OPENMETEO_DELAY_SECONDS}s between requests, "
          f"{OPENMETEO_RETRY_DELAY}s backoff on 429")
    print("=" * 60)

    # load raw data
    try:
        df = pd.read_csv(RAW_OPENAQ_FILE)
    except FileNotFoundError:
        print(f"  ERROR: {RAW_OPENAQ_FILE} not found. Run fetch_openaq.py first.")
        return None

    if len(df) == 0:
        print("  No data to enrich. Skipping.")
        df.to_csv(WITH_WEATHER_FILE, index=False)
        return df

    df["datetime"] = pd.to_datetime(df["datetime"], utc=True)

    # group by unique locations (round to 2 decimals ~ 1km to reduce API calls)
    df["_lat_r"] = df["lat"].round(2)
    df["_lon_r"] = df["lon"].round(2)
    unique_locs = df.groupby(["_lat_r", "_lon_r"]).size().reset_index()[["_lat_r", "_lon_r"]]
    print(f"  Unique locations (rounded): {len(unique_locs)}")

    # figure out date range
    date_min = df["datetime"].min().strftime("%Y-%m-%d")
    date_max = df["datetime"].max().strftime("%Y-%m-%d")
    print(f"  Date range: {date_min} to {date_max}")

    # initialize weather columns with NaN
    for col_name in WEATHER_COLUMN_MAP.values():
        df[col_name] = np.nan

    # fetch weather per unique location
    for i, row in unique_locs.iterrows():
        lat_r, lon_r = row["_lat_r"], row["_lon_r"]
        print(f"  [{i+1}/{len(unique_locs)}] Weather for ({lat_r:.2f}, {lon_r:.2f})...", end=" ")

        weather_df = fetch_weather_for_location(lat_r, lon_r, date_min, date_max)

        if weather_df is not None and len(weather_df) > 0:
            # match observations at this location by nearest hour
            mask = (df["_lat_r"] == lat_r) & (df["_lon_r"] == lon_r)

            obs_hours = df.loc[mask, "datetime"].dt.floor("h")
            weather_df["_hour"] = weather_df["datetime"].dt.floor("h")

            # build a lookup dict from hour -> weather row
            weather_lookup = weather_df.set_index("_hour")

            matched = 0
            for idx in df.index[mask]:
                obs_hour = df.at[idx, "datetime"].floor("h")
                if obs_hour in weather_lookup.index:
                    for col_name in WEATHER_COLUMN_MAP.values():
                        val = weather_lookup.at[obs_hour, col_name]
                        if pd.notna(val):
                            df.at[idx, col_name] = val
                    matched += 1

            print(f"{matched}/{mask.sum()} matched")
        else:
            print("no data")

        # rate limit pause between locations
        time.sleep(OPENMETEO_DELAY_SECONDS)

    # drop helper columns
    df = df.drop(columns=["_lat_r", "_lon_r"])

    # report coverage
    total = len(df)
    print(f"\n  Weather coverage:")
    for col in WEATHER_COLUMN_MAP.values():
        filled = df[col].notna().sum()
        print(f"    {col:12s}: {filled:>8,}/{total:,} ({100*filled/total:.1f}%)")

    df.to_csv(WITH_WEATHER_FILE, index=False)
    print(f"\n  Saved {len(df):,} rows to {WITH_WEATHER_FILE}")

    return df


if __name__ == "__main__":
    enrich_with_weather()
