"use client";
import Image from "next/image";
import { ChangeEvent } from "react";
interface TableSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounce?: number;
}
const TableSearch = ({
  onSearch,
  placeholder = "Search...",
  className = "",
  debounce = 300,
}: TableSearchProps) => {
  let debounceTimer: NodeJS.Timeout;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    clearTimeout(debounceTimer);
    const value = e.target.value;
    
    debounceTimer = setTimeout(() => {
      onSearch(value);
    }, debounce);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    const value = (e.currentTarget as HTMLFormElement).querySelector("input")?.value || "";
    onSearch(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2 ${className} mb-4`}
    >
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder={placeholder}
        onChange={handleChange}
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </form>
  );
};

export default TableSearch;