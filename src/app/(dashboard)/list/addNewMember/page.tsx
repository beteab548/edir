import MemberForm from "@/components/form/MemberForm";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
const AddNewMember = async () => {
  const user = await currentUser();

  if (!user) {
   return redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;
  if (role !== "secretary") {
   return redirect("/dashboard");
  }
  return <MemberForm type="create" />;
};
export default AddNewMember;
