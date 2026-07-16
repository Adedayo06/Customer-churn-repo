# Customer Churn Prediction — Backend API

A FastAPI service that serves your trained **RandomForest** churn model. It
reproduces your training-time preprocessing on the fly, so callers send plain
customer data and never worry about encoding or feature engineering.

## What the API does for you automatically

For every incoming customer, before the model sees it, the API:

1. **Drops** `customer_id` and `country` (dropped during training). `customer_id`
   is kept only for traceability in the response/database.
2. **Renames** `tenure` → `customer_retention`.
3. **Label-encodes `gender`** using your saved `gender_encoder.pkl`
   (`Female → 0`, `Male → 1`). You may send gender as text (case-insensitive)
   *or* as the numeric code.
4. **Engineers `balance_salary_ratio = balance / (estimated_salary + 1)`**.
5. **Re-orders** columns to the exact list in `feature_columns.pkl`.

No scaling is applied — your saved model is a RandomForest trained on the raw,
unscaled features (and no scaler was saved).

Every prediction is stored in a local SQLite database (`churn.db`) with a
UTC timestamp, which powers the daily/weekly/monthly analytics endpoints.

## Setup & run

Use your existing `Customer-churn` conda environment (it has the matching
scikit-learn 1.9.0 the model was pickled with).

```bash
conda activate Customer-churn
cd backend
pip install -r requirements.txt      # first time only

python run.py
# or:  uvicorn app.main:app --reload --port 8000
```

Then open the interactive docs at **http://127.0.0.1:8000/docs** — you can test
every endpoint (including the CSV upload) right from the browser.

## Endpoints

| Method | Path                  | Purpose                                             |
|--------|-----------------------|-----------------------------------------------------|
| GET    | `/health`             | Liveness + which model/features are loaded          |
| POST   | `/predict`            | Score a **single** customer (JSON body)             |
| POST   | `/predict/batch`      | Score a **batch** via **CSV file upload**           |
| GET    | `/analytics/daily`    | Churn vs non-churn counts grouped **by day**        |
| GET    | `/analytics/weekly`   | ... grouped **by week**                             |
| GET    | `/analytics/monthly`  | ... grouped **by month**                            |
| GET    | `/analytics/summary`  | Grand totals across all stored predictions          |

Both prediction endpoints accept an optional `?threshold=` (0–1) query param to
override the default 0.5 probability cut-off.

### 1. Single prediction

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 15634602,
    "country": "France",
    "credit_score": 619,
    "gender": "Female",
    "age": 42,
    "tenure": 2,
    "balance": 0.0,
    "products_number": 1,
    "credit_card": 1,
    "active_member": 1,
    "estimated_salary": 101348.88
  }'
```

Response:

```json
{
  "churn": 1,
  "churn_label": "Churn",
  "churn_probability": 0.698967,
  "customer_id": "15634602"
}
```

`customer_id` and `country` are optional; if omitted, prediction still works.

### 2. Batch prediction (CSV upload)

Upload a CSV with one customer per row. Column headers should match the
single-prediction field names. `customer_id`, `country` are optional; `tenure`
may instead be named `customer_retention`. A ready-made
[`sample_customers.csv`](sample_customers.csv) is included.

```bash
curl -X POST http://127.0.0.1:8000/predict/batch \
  -F "file=@sample_customers.csv"
```

Response:

```json
{
  "count": 5,
  "churn_count": 3,
  "no_churn_count": 2,
  "predictions": [
    {"churn": 1, "churn_label": "Churn", "churn_probability": 0.6989, "customer_id": "15634602"},
    ...
  ]
}
```

### 3. Analytics (time-series churn counts)

```bash
curl http://127.0.0.1:8000/analytics/daily
```

```json
{
  "granularity": "day",
  "buckets": [
    {"period": "2026-07-16", "churn": 4, "no_churn": 1, "total": 5}
  ]
}
```

`weekly` buckets look like `2026-W28`; `monthly` like `2026-07`. The list is
ordered oldest → newest, so it plugs straight into a dashboard/chart.

## Required input fields

| Field              | Type          | Notes                                         |
|--------------------|---------------|-----------------------------------------------|
| `credit_score`     | number        |                                               |
| `gender`           | text or 0/1   | `"Male"`/`"Female"` (any case) or `1`/`0`      |
| `age`              | number        |                                               |
| `tenure`           | number        | a.k.a. `customer_retention`                   |
| `balance`          | number        |                                               |
| `products_number`  | number        |                                               |
| `credit_card`      | 0 or 1        |                                               |
| `active_member`    | 0 or 1        |                                               |
| `estimated_salary` | number        |                                               |
| `customer_id`      | optional      | ignored by model, stored for reference        |
| `country`          | optional      | ignored by model (dropped in training)        |

> Do **not** send `balance_salary_ratio` — the server always computes it so it
> exactly matches the training-time formula.

## Configuration (optional env vars)

| Variable          | Default            | Meaning                                  |
|-------------------|--------------------|------------------------------------------|
| `DATABASE_URL`    | `sqlite:///churn.db` | Swap in PostgreSQL etc.                |
| `CHURN_THRESHOLD` | `0.5`              | Default probability cut-off              |

## Project layout

```
backend/
├── app/
│   ├── config.py        # paths + settings
│   ├── ml.py            # model load + preprocessing + predict  ← core logic
│   ├── database.py      # SQLAlchemy engine + predictions table
│   ├── crud.py          # store predictions + time-bucket aggregation
│   ├── schemas.py       # Pydantic request/response models
│   └── main.py          # FastAPI app + all endpoints
├── requirements.txt
├── run.py               # `python run.py` launcher
└── sample_customers.csv
```
