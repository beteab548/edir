"use client";
import { createContext, useContext, useState } from "react";

type DataChangeContextType = {
  dataChanged: boolean;
  setDataChanged: (val: boolean) => void;
};

const DataChangeContext = createContext<DataChangeContextType | undefined>(
  undefined
);

export const DataChangeProvider = ({ children }: { children: React.ReactNode }) => {
  const [dataChanged, setDataChanged] = useState(false);
  return (
    <DataChangeContext.Provider value={{ dataChanged, setDataChanged }}>
      {children}
    </DataChangeContext.Provider>
  );
};

export const useDataChange = () => {
  const context = useContext(DataChangeContext);
  if (!context) {
    throw new Error("useDataChange must be used within a DataChangeProvider");
  }
  return context;
};
