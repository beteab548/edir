import ConfigureExistingContribution from "./ConfigureExistingContribution";
import { updateContribution } from "../../lib/actions"; // import CreateNewContribution from "./configure-new-contribution";
export default function CombinedPage() {
  async function fetchContributionTypes() {
    const response = await fetch("/api/contribution/fetchTypes");
    const { data } = await response.json();
    return data;
  }
  const data = fetchContributionTypes();
  return (
    <div className="min-h-screen bg-base-200 p-8 space-y-8">
      <ConfigureExistingContribution
        contributionTypes={data}
        formAction={updateContribution}
      />
      {/* <CreateNewContribution /> */}
    </div>
  );
}
