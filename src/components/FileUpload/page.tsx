import { useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { toast } from "react-toastify";
import { FiLoader } from "react-icons/fi";

interface UploadFileProps {
  text: string;
  getImageUrl: (newImage: { Url: string; fileId: string }) => void;
  setImageReady: (ready: boolean) => void;
  accept?: string; // Make it optional with a default value
}

export default function UploadFile({
  text,
  getImageUrl,
  setImageReady,
  accept = "image/*,application/pdf", // Default value
}: UploadFileProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];

    // Validate file type based on accept prop
    const acceptedTypes = accept.split(",");
    const isValidType = acceptedTypes.some((type) => {
      if (type === "*/*") return true;
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.split("/*")[0]);
      }
      return file.type === type || file.name.endsWith(type.replace(".", ""));
    });

    if (!isValidType) {
      toast.error(`Invalid file type. Accepted types: ${accept}`);
      e.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("File size must be less than 3MB");
      e.target.value = "";
      return;
    }

    const isImage = file.type.startsWith("image/");
    try {
      setIsCompressing(true);
      if (isImage) {
        if (text === "profile") {
          setSelectedFile(file);
        } else {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 800,
            initialQuality: 0.85,
            useWebWorker: true,
            fileType: "image/webp",
          });
          setSelectedFile(compressedFile);
        }
      } else {
        setSelectedFile(file);
      }
    } catch (err) {
      console.error("Compression failed", err);
      toast.error("Image optimization failed.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setImageReady(false);

    try {
      const base64 = await convertToBase64(selectedFile);
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        next: { revalidate: 0 },
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
      toast.error(err.message || "Upload failed");
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
        accept={accept}
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
        className={`w-44 py-2 mt-2 flex items-center justify-center gap-2 text-white rounded-lg transition ${
          loading || !selectedFile
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {(isCompressing || loading) && (
          <FiLoader className="animate-spin w-5 h-5" />
        )}
        {isCompressing ? "Compressing..." : loading ? "Uploading..." : "Upload"}
      </button>

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
