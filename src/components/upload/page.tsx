"use client";
import { useState } from "react";
import imageCompression from "browser-image-compression";

export default function UploadFile({
  text,
  getImageUrl,
  setImageReady,
}: {
  text: string;
  getImageUrl: (newImage: { Url: string; fileId: string }) => void;
  setImageReady: (ready: boolean) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.7,
      });
      setSelectedFile(compressedFile);
    } catch (err) {
      console.error("Compression failed", err);
      setError("Image optimization failed.");
    }
  };

  const handleUpload = async () => {
  if (!selectedFile) return;
  setLoading(true);
  setError(null);
  setImageReady(false); // 👈 Block submit

  try {
    const base64 = await convertToBase64(selectedFile);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: base64,
        fileName: selectedFile.name,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data?.Url || !data?.fileId) {
      throw new Error("Invalid response from server");
    }

    setUploadedUrl(data.Url);
    getImageUrl(data);
    setImageReady(true); // ✅ Only ready now
  } catch (err: any) {
    console.error(err);
    setError(err.message);
    setImageReady(false); // ❌ Something went wrong
  } finally {
    setLoading(false);
  }
};

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };
  return (
    <div style={{ maxWidth: 500 }}>
      <h1>Upload Optimized {text === "profile" ? "Image" : "Document"}</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <br />
      {selectedFile && (
        <p>
          Ready to upload: {selectedFile.name} (
          {(selectedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}
      <button onClick={handleUpload} disabled={loading || !selectedFile}>
        {loading ? "Uploading..." : "Upload"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {uploadedUrl && (
        <>
          <h2>Your Image</h2>
          <img src={uploadedUrl} alt="Uploaded" style={{ maxWidth: "100%" }} />
        </>
      )}
    </div>
  );
}
