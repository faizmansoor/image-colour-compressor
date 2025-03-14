// src/App.jsx
import React, { useState } from "react";
import "./App.css";
import { FileUploader } from "./components/FileUploader";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { StatusMessage } from "./components/StatusMessage";
import { Loader } from "./components/Loader";
import axios from "axios";


function App() {
  const [file, setFile] = useState(null);
  const [colours, setcolours] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      // Check file size (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (selectedFile.size > MAX_FILE_SIZE) {
        setStatus({
          type: "error",
          message:
            "File size exceeds the 5MB limit. Please select a smaller file.",
        });
        setFile(null);
        return;
      }

      // Check file type
      if (!selectedFile.type.startsWith("image/")) {
        setStatus({
          type: "error",
          message: "Please select a valid image file (JPEG, PNG, etc.).",
        });
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setStatus({ type: "", message: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatus({
        type: "error",
        message: "Please select an image file to compress.",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "info", message: "Processing your image..." });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("colours", colours);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/compress`,
        formData,
        {
          responseType: "blob", //receive the image as a blob
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      // Get the blob from the response
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      // Create a download link, trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get filename from headers or set a default
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") ||
          `compressed_image_${Date.now()}.png`
        : `compressed_image_${Date.now()}.png`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setStatus({
        type: "success",
        message: "Image compressed successfully and downloaded!",
      });
    } catch (error) {
      console.error("Error compressing image:", error);
      setStatus({
        type: "error",
        message: `Error: ${
          error.response?.data?.message || "Failed to compress image"
        }`,
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className="content">
        <div className="card">
          <div className="info-box">
            <h2>About This Tool</h2>
            <p>
              This tool compresses images by reducing the number of colours
              using K-means clustering. Upload an image and specify how many
              colours you want in the compressed version.
            </p>
            <p className="constraints">
              Max file size: <strong>5MB</strong> | Supported formats:{" "}
              <strong>JPG, PNG, GIF, BMP</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <FileUploader onFileChange={handleFileChange} selectedFile={file} />

            <div className="form-group">
              <label htmlFor="colours">
                Number of colours:{" "}
                <span className="colours-value">{colours}</span>
              </label>
              <div className="slider-container">
                <span className="range-label">1</span>
                <input
                  type="range"
                  id="colours"
                  name="colours"
                  min="1"
                  max="64"
                  value={colours}
                  onChange={(e) => setcolours(Number(e.target.value))}
                  className="slider"
                />
                <span className="range-label">64</span>
              </div>
              <p className="slider-description">
                Fewer colours = smaller file size, more compression
              </p>
            </div>

            {status.message && (
              <StatusMessage type={status.type} message={status.message} />
            )}

            {isLoading ? (
              <Loader progress={uploadProgress} />
            ) : (
              <button type="submit" className="submit-button" disabled={!file}>
                Compress & Download
              </button>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
