# mframapa ai data pipeline

pulls fresh pm2.5 readings from openaq, adds weather, and writes an updated training dataset for colab.

## run

```
cd pipeline
pip install -r requirements.txt
python run_pipeline.py
```

three steps:
1. **fetch openaq**: finds stations and pulls pm2.5 across 54 african countries (dec 2025 to today).
2. **fetch weather**: attaches open-meteo history to each reading (temp, humidity, pressure, wind, cloud, precip).
3. **prepare**: feature engineering, qa cleaning, then merges into the existing `training_dataset.csv`.

output: `pipeline/output/training_dataset_updated.csv`

## retrain

upload the output to google drive (`mframapa/`), open your colab training notebook, point `DATA_PATH` at the uploaded file, and run all cells.

## config

edit `config.py`:

| setting | default | notes |
|---|---|---|
| `FETCH_START_DATE` | 2025-12-01 | window start |
| `FETCH_END_DATE` | today | window end |
| `PM25_MAX` | 500 | outlier cutoff |
| `OPENAQ_API_KEY` | none | optional, higher rate limits |

skip a step by reusing cached data:
```
python run_pipeline.py --skip-fetch      # reuse openaq
python run_pipeline.py --skip-weather    # reuse weather
```

## outputs

| file | what |
|---|---|
| `data/openaq_raw.csv` | raw openaq measurements |
| `data/with_weather.csv` | readings + weather |
| `data/cleaned_new.csv` | after qa |
| `output/training_dataset_updated.csv` | final merged dataset |
