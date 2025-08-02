"use client";
import { deleteFamily } from "@/lib/actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";
const deleteActionMap = { member: deleteFamily };
const MemberForm = dynamic(() => import("./form/MemberForm"), {
  loading: () => <h1>Loading...</h1>,
});
const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  member: (setOpen, type, data) => (
    <MemberForm type={type} data={data} setOpen={setOpen} />
  ),
};
const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-yellow-200"
      : type === "update"
      ? "bg-sky-200"
      : "bg-purple-200";
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Form = () => {
    const handleDeleteSubmit = (formData: FormData) => {
      startTransition(async () => {
        const action = deleteActionMap[table];
        const currentState = {
          id: formData.get("id"),
          success: false,
          error: false,
        };
        const result = await action(currentState, formData);
        if (result.success) {
          toast.success(`${table} has been deleted!`);
          setOpen(false);
          router.refresh();
        } else {
          toast.error(`Failed to delete ${table}`);
        }
      });
    };

    return type === "delete" && id ? (
      <form action={handleDeleteSubmit} className="p-4 flex flex-col gap-4">
        <input type="text" name="id" value={id} hidden readOnly />
        <span className="text-center font-medium">
          All data will be lost.
          <br />
          Are you sure you want to delete this {table}?
        </span>

        <button
          type="submit"
          className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? "Deleting..." : "Delete"}
        </button>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>

      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div
            className={`${
              type === "delete"
                ? "bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]"
                : ""
            }`}
          >
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default FormModal;
