"use client";

import { useState } from "react";

export default function UploadExcelForm({url}: { url: string }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fileInput = (e.currentTarget as HTMLFormElement).querySelector(
      'input[name="file"]'
    ) as HTMLInputElement | null;

    if (!fileInput?.files?.length) return;

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    setUploading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data.message || "Upload complete");
    } catch (error) {
      setResult("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
      <input type="file" name="file" accept=".xlsx" required />
      <button
        type="submit"
        disabled={uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {uploading ? "Uploading..." : "Upload & Import"}
      </button>
      {result && <p className="text-green-600">{result}</p>}
    </form>
  );
}
