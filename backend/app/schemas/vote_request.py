from typing import Literal

from pydantic import BaseModel


class VoteRequest(BaseModel):
    vote: Literal["up", "down"] | None
