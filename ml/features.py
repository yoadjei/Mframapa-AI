"""
Feature column order for regional PM2.5 models — aligned with FeaturePipeline
and DataOrchestrator outputs.

``FEATURE_COLUMNS`` is the required base schema (existing datasets / smoke tests).
``ENRICHED_FEATURE_COLUMNS`` are optional: included at train time when the
dataset has enough non-null coverage (see ``ml.train_from_dataset``). Live
inference already resolves them via the orchestrator; models only use columns
listed in each export's ``manifest.json``.
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

# Optional meteo / aerosol enrichments (Open-Meteo + NASA POWER / CAMS dust).
ENRICHED_FEATURE_COLUMNS = [
    "surface_pressure",
    "precipitation",
    "dust_surface",
]

# Minimum fraction of non-null rows required before an enriched column is trained on.
ENRICHED_MIN_COVERAGE = 0.10
