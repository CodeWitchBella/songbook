import type { ReactNode } from "react";

import { BackArrow, BackButton } from "./back-button";

export function PageHeader({
  backTo,
  children,
}: {
  backTo?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 mt-8 flex items-center">
      <BackButton to={backTo} className="py-4 pr-2">
        <BackArrow />
      </BackButton>
      <div className="text-xl">{children}</div>
    </div>
  );
}
