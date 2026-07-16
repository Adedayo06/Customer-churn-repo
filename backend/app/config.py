"""Central configuration and filesystem paths.

Everything is resolved relative to the project root so the app works no matter
what directory uvicorn is launched from.
"""
from __future__ import annotations

import os
from pathlib import Path

# backend/app/config.py  ->  backend/app  ->  backend  ->  <project root>
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

# ---------------------------------------------------------------------------
# Model artifacts produced by the training notebooks
# ---------------------------------------------------------------------------
MODELS_DIR = PROJECT_ROOT / "training" / "models"
MODEL_PATH = MODELS_DIR / "churn_model.pkl"
FEATURE_COLUMNS_PATH = MODELS_DIR / "feature_columns.pkl"
GENDER_ENCODER_PATH = MODELS_DIR / "gender_encoder.pkl"

# ---------------------------------------------------------------------------
# Database (SQLite by default; override with the DATABASE_URL env var)
# ---------------------------------------------------------------------------
_default_sqlite = f"sqlite:///{(BACKEND_DIR / 'churn.db').as_posix()}"
DATABASE_URL = os.getenv("DATABASE_URL", _default_sqlite)

# ---------------------------------------------------------------------------
# Classification threshold (probability >= threshold  ->  predicted churn)
# ---------------------------------------------------------------------------
DEFAULT_THRESHOLD = float(os.getenv("CHURN_THRESHOLD", "0.5"))
