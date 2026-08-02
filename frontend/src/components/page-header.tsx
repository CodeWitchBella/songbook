import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";

import { BackButton } from "./back-button";

export function PageHeader({ backTo, children }: { backTo?: string; children: ReactNode }) {
  return (
    <div className="mb-4 mt-8 flex items-center">
      <BackButton to={backTo} className="py-4 pr-2">
        <ArrowLeftIcon size={24} />
      </BackButton>
      <div className="text-xl">{children}</div>
    </div>
  );
}
