import UploadExcelForm from "@/components/ui/UploadExcelForm";

export default function ImportPage() {
  return (
    <>
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-bold mb-4">Import Members from Excel</h1>
      <UploadExcelForm url="/api/import-members" />
      <h1 className="text-xl font-bold mb-4">Import paymnets from Excel</h1>
      <UploadExcelForm url="/api/import-payments"/>
    </div>
  </>
  );
}
