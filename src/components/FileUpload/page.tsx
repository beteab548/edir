"use client";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";

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
    const isImage = file.type.startsWith("image/");

    try {
      if (isImage) {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.7,
        });
        setSelectedFile(compressedFile);
      } else {
        setSelectedFile(file); // PDF or other supported types
      }
    } catch (err) {
      console.error("Compression failed", err);
      setError("Image optimization failed.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setImageReady(false);

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
          type: ["profile", "receipt", "document"].includes(text)
            ? text
            : "others",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.Url || !data?.fileId) {
        throw new Error("Invalid response from server");
      }

      setUploadedUrl(data.Url);
      getImageUrl(data);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setImageReady(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setImageReady(false);
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
    <div className="max-w-md mx-auto">
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="block w-full text-sm hover:cursor-pointer text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {selectedFile && (
        <p className="text-sm text-gray-600 mt-1">
          Ready to upload:{" "}
          <span className="font-medium">{selectedFile.name}</span> (
          {(selectedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !selectedFile}
        className={`w-40 py-2 mt-2 text-white rounded-lg transition ${
          loading || !selectedFile
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {uploadedUrl && selectedFile?.type.startsWith("image/") && (
        <div className="mt-4">
          <h2 className="text-lg font-medium text-gray-800">Your Image</h2>
          <Image
            width={50}
            height={50}
            unoptimized
            loading="lazy"
            src={uploadedUrl}
            alt="Uploaded"
            className="mt-2 w-24 h-auto rounded border"
          />
        </div>
      )}

      {uploadedUrl && selectedFile?.type === "application/pdf" && (
        <div className="mt-4">
          <h2 className="text-lg font-medium text-gray-800">Your PDF</h2>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm"
          >
            View uploaded PDF
          </a>
        </div>
      )}
    </div>
  );
}
