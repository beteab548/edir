import UploadExcelForm from "@/components/ui/UploadExcelForm";

export default function ImportPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-bold mb-4">Import Members from Excel</h1>
      <UploadExcelForm />
    </div>
  );
}
