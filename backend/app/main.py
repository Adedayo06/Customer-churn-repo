"""FastAPI application exposing the customer-churn model.

Endpoints
---------
POST /predict            Single customer  -> churn prediction
POST /predict/batch      CSV upload       -> prediction per customer
GET  /analytics/daily    Churn vs non-churn counts grouped by day
GET  /analytics/weekly   ... grouped by week
GET  /analytics/monthly  ... grouped by month
GET  /analytics/summary  Grand totals across all stored predictions
GET  /health             Liveness + model-loaded check
"""
from __future__ import annotations

import io
from contextlib import asynccontextmanager

import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, ml
from .database import get_db, init_db
from .schemas import (
    BatchPredictionOut,
    CustomerIn,
    OverallSummaryOut,
    PeriodSummaryOut,
    PredictionOut,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and warm the model cache before serving traffic.
    init_db()
    ml.get_artifacts()
    yield


app = FastAPI(
    title="Customer Churn Prediction API",
    description=(
        "Serves a RandomForest churn model. Handles gender label-encoding, "
        "dropping of customer_id/country, and the balance_salary_ratio feature "
        "automatically, so clients send plain customer data."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Allow browser front-ends to call the API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
def health() -> dict:
    art = ml.get_artifacts()
    return {
        "status": "ok",
        "model": type(art.model).__name__,
        "n_features": len(art.feature_columns),
        "feature_columns": art.feature_columns,
    }


# ---------------------------------------------------------------------------
# Single prediction
# ---------------------------------------------------------------------------
@app.post("/predict", response_model=PredictionOut, tags=["prediction"])
def predict_single(
    customer: CustomerIn,
    threshold: float | None = Query(
        default=None, ge=0.0, le=1.0,
        description="Optional probability cut-off; defaults to 0.5.",
    ),
    db: Session = Depends(get_db),
) -> PredictionOut:
    record = customer.model_dump()
    try:
        result = ml.predict([record], threshold=threshold)[0]
    except ml.PreprocessingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    cust_id = None if record.get("customer_id") is None else str(record["customer_id"])
    crud.store_predictions(db, [{**result, "customer_id": cust_id}], source="single")

    return PredictionOut(**result, customer_id=cust_id)


# ---------------------------------------------------------------------------
# Batch prediction (CSV upload)
# ---------------------------------------------------------------------------
@app.post("/predict/batch", response_model=BatchPredictionOut, tags=["prediction"])
async def predict_batch(
    file: UploadFile = File(..., description="CSV file, one customer per row."),
    threshold: float | None = Query(default=None, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
) -> BatchPredictionOut:
    filename = (file.filename or "").lower()
    if not filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")

    raw = await file.read()
    if not raw.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:  # noqa: BLE001 - surface any parse error to client
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}") from exc

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV contains no data rows.")

    # Support 'tenure' or 'customer_retention' column headers transparently.
    records = df.to_dict(orient="records")
    try:
        results = ml.predict(records, threshold=threshold)
    except ml.PreprocessingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Attach caller customer_id (if the CSV had one) for storage + response.
    ids = df["customer_id"].tolist() if "customer_id" in df.columns else [None] * len(results)
    enriched = [
        {**res, "customer_id": (None if cid is None or pd.isna(cid) else str(cid))}
        for res, cid in zip(results, ids)
    ]
    crud.store_predictions(db, enriched, source="batch")

    churn_count = sum(r["churn"] for r in results)
    return BatchPredictionOut(
        count=len(results),
        churn_count=churn_count,
        no_churn_count=len(results) - churn_count,
        predictions=[PredictionOut(**e) for e in enriched],
    )


# ---------------------------------------------------------------------------
# Analytics (time-series churn counts)
# ---------------------------------------------------------------------------
def _period_summary(db: Session, granularity: str) -> PeriodSummaryOut:
    buckets = crud.aggregate_by_period(db, granularity)
    return PeriodSummaryOut(granularity=granularity, buckets=buckets)


@app.get("/analytics/daily", response_model=PeriodSummaryOut, tags=["analytics"])
def analytics_daily(db: Session = Depends(get_db)) -> PeriodSummaryOut:
    return _period_summary(db, "day")


@app.get("/analytics/weekly", response_model=PeriodSummaryOut, tags=["analytics"])
def analytics_weekly(db: Session = Depends(get_db)) -> PeriodSummaryOut:
    return _period_summary(db, "week")


@app.get("/analytics/monthly", response_model=PeriodSummaryOut, tags=["analytics"])
def analytics_monthly(db: Session = Depends(get_db)) -> PeriodSummaryOut:
    return _period_summary(db, "month")


@app.get("/analytics/summary", response_model=OverallSummaryOut, tags=["analytics"])
def analytics_summary(db: Session = Depends(get_db)) -> OverallSummaryOut:
    return OverallSummaryOut(**crud.overall_summary(db))
