"""Simple deal-stage transition policy."""

from app.schemas import DealStage

ALLOWED_STAGE_TRANSITIONS: dict[DealStage, set[DealStage]] = {
    DealStage.NEW: {DealStage.QUALIFIED, DealStage.REJECTED},
    DealStage.QUALIFIED: {
        DealStage.CONSULTATION_SCHEDULED,
        DealStage.REJECTED,
    },
    DealStage.CONSULTATION_SCHEDULED: {DealStage.REJECTED},
    DealStage.REJECTED: set(),
}


def is_stage_transition_allowed(
    current_stage: DealStage,
    new_stage: DealStage,
) -> bool:
    """Allow a no-op, forward progress, or rejection from active stages."""
    return (
        current_stage == new_stage
        or new_stage in ALLOWED_STAGE_TRANSITIONS[current_stage]
    )
