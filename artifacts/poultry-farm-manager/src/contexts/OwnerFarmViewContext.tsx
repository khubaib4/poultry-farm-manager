import React, { createContext, useContext } from "react";

export interface OwnerFarmViewContextValue {
  farmId: number;
}

const OwnerFarmViewContext = createContext<OwnerFarmViewContextValue | null>(null);

export function OwnerFarmViewProvider({
  farmId,
  children,
}: {
  farmId: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <OwnerFarmViewContext.Provider value={{ farmId }}>{children}</OwnerFarmViewContext.Provider>
  );
}

export function useOwnerFarmViewContext(): OwnerFarmViewContextValue | null {
  return useContext(OwnerFarmViewContext);
}
