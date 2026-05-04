"""
Feature column order for regional PM2.5 models — aligned with FeaturePipeline
and DataOrchestrator outputs.
"""

TARGET_COLUMN = "pm25_surface"

FEATURE_COLUMNS = [
    "pblh",
    "temperature_2m",
    "relative_humidity",
    "u_component_of_wind_10m",
    "v_component_of_wind_10m",
    "no2_tropospheric_column",
    "aerosol_optical_depth",
    "so2_total_column",
    "co_total_column",
    "pm10_surface",
    "population_density",
    "elevation",
]
