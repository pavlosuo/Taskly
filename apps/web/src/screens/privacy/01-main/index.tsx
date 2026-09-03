import { PolicyData } from "@shared/types";
import parse from "html-react-parser";
import { formatDate } from "@/utils/formatDate";

export const Main = ({ data }: { data: PolicyData }) => {
  return (
    <section className="w-full px-4 py-10">
      <div className="max-w-3xl m-auto">
        <div className="flex flex-col align-center justify-center gap-2 mb-6">
          <h1 className="text-3xl font-bold text-center">{data.policyTitle}</h1>
          {data.updatedAt && (
            <h2 className="text-sm text-center">
              Last updated: {formatDate(new Date(data.updatedAt))}
            </h2>
          )}
        </div>
        <div className="text-wrapper">
          {data.policyContent && parse(data.policyContent)}
        </div>
      </div>
    </section>
  );
};
