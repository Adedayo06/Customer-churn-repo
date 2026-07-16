"""Request/response models. Inputs use human-friendly field names; all
encoding, column-dropping and feature engineering happens server-side.
"""
from __future__ import annotations

from typing import Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class CustomerIn(BaseModel):
    """A single raw customer record as sent by a client.

    ``customer_id`` and ``country`` are accepted but ignored by the model (they
    were dropped during training); ``customer_id`` is stored for traceability.
    ``gender`` may be text ("Male"/"Female") or the numeric code (0/1).
    ``balance_salary_ratio`` is NOT accepted — the server always computes it.
    """

    model_config = ConfigDict(extra="ignore")

    credit_score: float = Field(..., examples=[619])
    gender: Union[str, int] = Field(..., examples=["Female"])
    age: float = Field(..., examples=[42])
    tenure: float = Field(..., description="Years as a customer (a.k.a. customer_retention)", examples=[2])
    balance: float = Field(..., examples=[0.0])
    products_number: float = Field(..., examples=[1])
    credit_card: int = Field(..., ge=0, le=1, examples=[1])
    active_member: int = Field(..., ge=0, le=1, examples=[1])
    estimated_salary: float = Field(..., examples=[101348.88])

    # Optional / ignored-by-model fields.
    customer_id: Optional[Union[str, int]] = Field(default=None, examples=[15634602])
    country: Optional[str] = Field(default=None, examples=["France"])


class PredictionOut(BaseModel):
    churn: int = Field(..., description="1 = likely to churn, 0 = not")
    churn_label: str
    churn_probability: float = Field(..., description="Model probability of churn")
    customer_id: Optional[str] = None


class BatchPredictionOut(BaseModel):
    count: int
    churn_count: int
    no_churn_count: int
    predictions: list[PredictionOut]


class PeriodCount(BaseModel):
    period: str
    churn: int
    no_churn: int
    total: int


class PeriodSummaryOut(BaseModel):
    granularity: str
    buckets: list[PeriodCount]


class OverallSummaryOut(BaseModel):
    total_predictions: int
    churn: int
    no_churn: int
