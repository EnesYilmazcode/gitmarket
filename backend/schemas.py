from pydantic import BaseModel


class CreateBountyRequest(BaseModel):
    repo_id: int
    issue_number: int
    issue_title: str
    issue_url: str
    amount: int


class CreateSubmissionRequest(BaseModel):
    pr_url: str
    comment: str | None = None
