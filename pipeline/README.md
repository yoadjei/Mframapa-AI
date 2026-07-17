# Mframapa AI — Data Pipeline

Pulls new PM2.5 ground truth from OpenAQ, enriches with weather data, and produces an updated training dataset ready for Colab.

## Quick Start

```bash
cd pipeline
pip install -r requirements.txt
python run_pipeline.py
```

This runs three steps:

1. **Fetch OpenAQ** — discovers stations and pulls PM2.5 measurements from 29 African countries (Dec 2025 → today)
2. **Fetch Weather** — enriches each observation with historical weather from Open-Meteo (temp, humidity, pressure, wind, clouds, precip)
3. **Prepare Data** — applies feature engineering + QA cleaning + merges with existing `training_dataset.csv`

Output: `pipeline/output/training_dataset_updated.csv`

## After Running

1. Upload `output/training_dataset_updated.csv` to Google Drive (`mframapa/` folder)
2. Open `notebooks/train_pm25_model.ipynb` in Colab
3. Update `DATA_PATH` to point to the uploaded file
4. Run all cells to retrain

## Configuration

Edit `config.py` to change:

| Setting | Default | Description |
|---------|---------|-------------|
| `FETCH_START_DATE` | `2025-12-01` | Start date for new data |
| `FETCH_END_DATE` | today | End date for new data |
| `PM25_MAX` | 500 | Upper outlier threshold |
| `OPENAQ_API_KEY` | None | Optional, for higher rate limits |

## Skip Flags

```bash
python run_pipeline.py --skip-fetch     # reuse cached OpenAQ data
python run_pipeline.py --skip-weather   # reuse cached weather data
```

## Output Files

| File | Description |
|------|-------------|
| `data/openaq_raw.csv` | Raw PM2.5 measurements from OpenAQ |
| `data/with_weather.csv` | Observations enriched with weather |
| `data/cleaned_new.csv` | New data after QA cleaning |
| `output/training_dataset_updated.csv` | **Final merged dataset for Colab** |
