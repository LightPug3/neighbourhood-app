# main_api.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI()
store = []  # In-memory store

class ATMStatus(BaseModel):
    TimeStamp: str
    ATM_Id: str
    Location: str
    Parish: str
    Deposit: str
    Status: str
    Last_Used: str

@app.post("/test-api/status")
async def receive_data(data: List[ATMStatus]):
    global store
    store = [entry.dict() for entry in data]
    return {"message": "Data received"}

@app.get("/test-api/status")
async def get_data():
    return JSONResponse(content=store)

if __name__ == '__main__':
    uvicorn.run("main_api:app", host="0.0.0.0", port=7000, reload=False)
