"""Persistence helpers: store predictions and aggregate them over time."""
from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import Prediction

# SQLite strftime patterns for each bucket granularity.
_PERIOD_FORMATS = {
    "day": "%Y-%m-%d",
    "week": "%Y-W%W",   # ISO-ish year + week number (00-53, Monday-based)
    "month": "%Y-%m",
}


def store_predictions(
    db: Session,
    items: list[dict],
    source: str,
) -> None:
    """Persist a batch of prediction results.

    ``items`` elements look like the dicts returned by :func:`ml.predict`, each
    optionally carrying a ``customer_id`` for traceability.
    """
    rows = [
        Prediction(
            customer_id=(str(it["customer_id"]) if it.get("customer_id") is not None else None),
            churn=int(it["churn"]),
            churn_probability=float(it["churn_probability"]),
            source=source,
        )
        for it in items
    ]
    db.add_all(rows)
    db.commit()


def aggregate_by_period(db: Session, period: str) -> list[dict]:
    """Return churner / non-churner counts grouped by ``period``.

    ``period`` is one of ``"day"``, ``"week"`` or ``"month"``. Result is ordered
    oldest -> newest, e.g.::

        [{"period": "2026-07-16", "churn": 12, "no_churn": 88, "total": 100}, ...]
    """
    if period not in _PERIOD_FORMATS:
        raise ValueError(f"period must be one of {list(_PERIOD_FORMATS)}")

    bucket = func.strftime(_PERIOD_FORMATS[period], Prediction.created_at).label("period")

    rows = (
        db.query(
            bucket,
            func.sum(Prediction.churn).label("churn"),
            func.count(Prediction.id).label("total"),
        )
        .group_by(bucket)
        .order_by(bucket)
        .all()
    )

    result = []
    for r in rows:
        churn = int(r.churn or 0)
        total = int(r.total or 0)
        result.append(
            {
                "period": r.period,
                "churn": churn,
                "no_churn": total - churn,
                "total": total,
            }
        )
    return result


def overall_summary(db: Session) -> dict:
    """Grand totals across every stored prediction."""
    total = db.query(func.count(Prediction.id)).scalar() or 0
    churn = db.query(func.coalesce(func.sum(Prediction.churn), 0)).scalar() or 0
    return {
        "total_predictions": int(total),
        "churn": int(churn),
        "no_churn": int(total) - int(churn),
    }
