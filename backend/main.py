from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import requests
import shutil
import os

app = FastAPI()  # ✅ Define app first

# ✅ Then add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔽 Rest of your code below (AssemblyAI setup, routes, etc.)
ASSEMBLYAI_API_KEY = "ef10213d10554de38d75539abf799e4a"
# ...

@app.get("/")
def root():
    return {"message": "FastAPI backend is running!"}

headers = {
    "authorization": ASSEMBLYAI_API_KEY,
    "content-type": "application/json"
}

upload_endpoint = "https://api.assemblyai.com/v2/upload"
transcript_endpoint = "https://api.assemblyai.com/v2/transcript"


def upload_to_assemblyai(file_path):
    with open(file_path, "rb") as f:
        response = requests.post(upload_endpoint, headers={"authorization": ASSEMBLYAI_API_KEY}, data=f)
    response.raise_for_status()
    return response.json()["upload_url"]


@app.post("/upload/")
async def upload_file(file: UploadFile = File(...), language_code: str = Form("en")):
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ✅ Correct: Upload raw binary, not multipart
    audio_url = upload_to_assemblyai(temp_filename)

    os.remove(temp_filename)

    # ✅ Submit transcript request
    transcript_config = {
        "audio_url": audio_url,
        "language_code": language_code
    }

    transcript_response = requests.post(transcript_endpoint, json=transcript_config, headers=headers)
    transcript_response.raise_for_status()
    transcript_id = transcript_response.json()['id']
    return {"id": transcript_id}


@app.get("/transcript/{transcript_id}")
def get_transcript(transcript_id: str):
    response = requests.get(f"{transcript_endpoint}/{transcript_id}", headers=headers)
    response.raise_for_status()
    return response.json()
