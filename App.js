import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import "./index.css";

function App() {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("en");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language_code", language);

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/upload/", formData);
      const { id } = res.data;

      const pollInterval = setInterval(async () => {
        const transcriptRes = await axios.get(
          `http://127.0.0.1:8000/transcript/${id}`
        );
        if (transcriptRes.data.status === "completed") {
          setTranscript(transcriptRes.data.text || "No transcript found.");
          setLoading(false);
          clearInterval(pollInterval);
        } else if (transcriptRes.data.status === "error") {
          alert("Transcription failed.");
          setLoading(false);
          clearInterval(pollInterval);
        }
      }, 4000);
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl w-full text-center">
        <h2 className="text-5x3 font-bold text-blue-600 mb-6">
          <span>🎬</span> Upload Audio/Video to Generate Captions
        </h2>

        <input
          type="file"
          accept="audio/*,video/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 w-full p-2 border border-gray-300 rounded"
        />

        <div className="flex justify-center items-center mb-4 gap-2">
          <label className="font-medium">Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <button
          onClick={handleUpload}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded"
          disabled={loading}
        >
          {loading ? "Processing..." : "Upload & Generate"}
        </button>

        {loading && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <div className="loader" />
            <span>Transcribing... Please wait ⏳</span>
          </div>
        )}

        {transcript && (
          <div className="mt-8 text-left">
            <h3 className="text-xl font-semibold mb-2">📝 Transcript:</h3>
            <p className="whitespace-pre-wrap">{transcript}</p>

            <button
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([transcript], { type: "text/plain" });
                element.href = URL.createObjectURL(file);
                element.download = "transcript.txt";
                document.body.appendChild(element);
                element.click();
              }}
              className="mt-6 w-full py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded"
            >
              <span>🎬</span> Download Transcript (.txt)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
