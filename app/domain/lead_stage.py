"""Deal-stage transition policy kept outside transport and storage layers."""

from app.schemas import DealStage

ALLOWED_STAGE_TRANSITIONS: dict[DealStage, set[DealStage]] = {
    DealStage.NEW: {DealStage.QUALIFIED, DealStage.REJECTED},
    DealStage.QUALIFIED: {
        DealStage.CONSULTATION_SCHEDULED,
        DealStage.REJECTED,
    },
    DealStage.CONSULTATION_SCHEDULED: {DealStage.REJECTED},
    DealStage.REJECTED: {DealStage.NEW},
}


def is_stage_transition_allowed(
    current_stage: DealStage,
    new_stage: DealStage,
) -> bool:
    """Allow a no-op or an explicitly listed workflow transition."""
    return (
        current_stage == new_stage
        or new_stage in ALLOWED_STAGE_TRANSITIONS[current_stage]
    )
