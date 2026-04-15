from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


app = FastAPI()


class OrderRequest(BaseModel):
    order_id: str
    amount: float


@app.post("/orders")
def create_order(payload: OrderRequest):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    return {"status": "created", "order_id": payload.order_id}
