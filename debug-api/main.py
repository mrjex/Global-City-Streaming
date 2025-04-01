from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from flink_logs import get_flink_logs

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/flink/logs")
async def flink_logs(type: str = Query('raw', enum=['raw', 'db'])):
    logs = get_flink_logs(type)
    return logs 