"""Model loading and the inference-time preprocessing pipeline.

This reproduces, for a *raw* customer record, exactly the transformations that
were applied during training (see training/preprocess.ipynb):

    1. Drop the columns that were dropped before training: ``customer_id`` and
       ``country`` (silently ignored if the caller didn't send them).
    2. Rename ``tenure`` -> ``customer_retention`` (the training data renamed it).
    3. Label-encode ``gender`` with the *saved* encoder  (Female -> 0, Male -> 1).
    4. Engineer ``balance_salary_ratio = balance / (estimated_salary + 1)``.
    5. Re-order the columns to the exact list the model was trained on
       (training/models/feature_columns.pkl).

The saved model is a RandomForestClassifier that was trained on the *raw,
unscaled* features, so no StandardScaler is applied here (and none was saved).
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any

import joblib
import numpy as np
import pandas as pd

from . import config

# Columns that were dropped during training and must never reach the model.
DROPPED_COLUMNS = ["customer_id", "country"]

# Raw fields a caller must provide (human-friendly names). ``tenure`` may be
# supplied either as ``tenure`` or already as ``customer_retention``.
REQUIRED_RAW_FIELDS = [
    "credit_score",
    "gender",
    "age",
    "balance",
    "products_number",
    "credit_card",
    "active_member",
    "estimated_salary",
]


class PreprocessingError(ValueError):
    """Raised when a record cannot be turned into model-ready features."""


class _Artifacts:
    """Lazily-loaded, cached bundle of the trained artifacts."""

    def __init__(self) -> None:
        self.model = joblib.load(config.MODEL_PATH)
        self.feature_columns: list[str] = list(joblib.load(config.FEATURE_COLUMNS_PATH))
        self.gender_encoder = joblib.load(config.GENDER_ENCODER_PATH)
        # e.g. {"female": 0, "male": 1} for case-insensitive lookup
        self.gender_map = {
            str(cls).strip().lower(): int(code)
            for code, cls in enumerate(self.gender_encoder.classes_)
        }


@lru_cache(maxsize=1)
def get_artifacts() -> _Artifacts:
    """Load the model artifacts once and reuse them for every request."""
    return _Artifacts()


# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------
def _encode_gender(series: pd.Series, art: _Artifacts) -> pd.Series:
    """Map gender values to the codes the model expects.

    Accepts strings (``"Male"``/``"female"`` – case & whitespace insensitive) as
    well as records that already contain the numeric code (0/1).
    """
    def _map(value: Any) -> int:
        if value is None or (isinstance(value, float) and np.isnan(value)):
            raise PreprocessingError("Missing value for 'gender'.")
        # Already encoded numerically?
        if isinstance(value, (int, np.integer)) or (
            isinstance(value, float) and float(value).is_integer()
        ):
            code = int(value)
            if code in self_valid_codes:
                return code
            raise PreprocessingError(
                f"Numeric gender code {code} is not one of {sorted(self_valid_codes)}."
            )
        key = str(value).strip().lower()
        if key in art.gender_map:
            return art.gender_map[key]
        raise PreprocessingError(
            f"Unknown gender {value!r}. Expected one of "
            f"{list(art.gender_encoder.classes_)}."
        )

    self_valid_codes = set(art.gender_map.values())
    return series.map(_map)


def build_feature_frame(records: list[dict]) -> pd.DataFrame:
    """Turn a list of raw customer dicts into a model-ready DataFrame.

    The returned frame has exactly ``art.feature_columns`` in the correct order.
    Raises :class:`PreprocessingError` with an actionable message on bad input.
    """
    if not records:
        raise PreprocessingError("No customer records were provided.")

    art = get_artifacts()
    df = pd.DataFrame(records)

    # 1. Drop columns dropped during training (ignore if absent).
    df = df.drop(columns=[c for c in DROPPED_COLUMNS if c in df.columns])

    # 2. tenure -> customer_retention.
    if "customer_retention" not in df.columns and "tenure" in df.columns:
        df = df.rename(columns={"tenure": "customer_retention"})

    # 3. Validate required raw fields are present.
    needed = set(REQUIRED_RAW_FIELDS) | {"customer_retention"}
    missing = sorted(needed - set(df.columns))
    if missing:
        # Show 'tenure' in the message since that's the friendly name.
        pretty = ["tenure" if m == "customer_retention" else m for m in missing]
        raise PreprocessingError(f"Missing required field(s): {', '.join(pretty)}.")

    # 4. Encode gender.
    df["gender"] = _encode_gender(df["gender"], art)

    # 5. Coerce numeric fields; surface a clear error on non-numeric input.
    numeric_fields = [
        "credit_score", "age", "customer_retention", "balance",
        "products_number", "credit_card", "active_member", "estimated_salary",
    ]
    for col in numeric_fields:
        coerced = pd.to_numeric(df[col], errors="coerce")
        bad = df[col][coerced.isna() & df[col].notna()]
        if not bad.empty:
            raise PreprocessingError(
                f"Field '{col}' has non-numeric value(s): {list(bad.unique())[:5]}."
            )
        if coerced.isna().any():
            raise PreprocessingError(f"Field '{col}' has missing value(s).")
        df[col] = coerced

    # 6. Feature engineering: balance_salary_ratio (recomputed even if supplied,
    #    so it always matches the training-time formula).
    df["balance_salary_ratio"] = df["balance"] / (df["estimated_salary"] + 1)

    # 7. Re-order to the exact training feature list.
    try:
        features = df[art.feature_columns]
    except KeyError as exc:  # pragma: no cover - guarded by checks above
        raise PreprocessingError(f"Could not assemble feature columns: {exc}") from exc

    return features


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------
def predict(records: list[dict], threshold: float | None = None) -> list[dict]:
    """Preprocess ``records`` and return one prediction dict per record.

    Each item: ``{"churn": 0|1, "churn_probability": float,
    "churn_label": "Churn"|"No Churn"}``.
    """
    art = get_artifacts()
    thr = config.DEFAULT_THRESHOLD if threshold is None else float(threshold)

    features = build_feature_frame(records)
    proba = art.model.predict_proba(features)[:, 1]
    preds = (proba >= thr).astype(int)

    return [
        {
            "churn": int(p),
            "churn_probability": round(float(pr), 6),
            "churn_label": "Churn" if p == 1 else "No Churn",
        }
        for p, pr in zip(preds, proba)
    ]
