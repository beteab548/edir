import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table: "member";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};
const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  if (type !== "delete") {
    switch (table) {
      case "member":
        const members = await prisma.member.findMany({
          select: { id: true, first_name: true, second_name: true },
        });
        break;
      default:
        break;
    }
  }
  return (
    <FormModal
      table={table}
      type={type}
      data={data}
      id={id}
      relatedData={relatedData}
    />
  );
};
export default FormContainer;
