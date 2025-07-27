"use client";

import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR from "swr";
import { format } from "date-fns";
import { penaltyFormSchema } from "@/lib/formValidationSchemas";
import { createPenalty, getPenaltyTypes } from "@/lib/actions";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import {
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  FolderOpenIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { FiSearch } from "react-icons/fi";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaHandshake,
  FaHourglassHalf,
} from "react-icons/fa";
import Image from "next/image";
export const dynamic = "force-dynamic";
type Member = {
  id: number;
  first_name: string;
  second_name: string;
  last_name: string;
  id_number: string | null;
  phone_number: string;
  profile_image: string;
};
type Penalty = {
  id: number;
  member: {
    id: number;
    custom_id: string;
    first_name: string;
    second_name: string;
    last_name: string;
    image_url: string;
  };
  penalty_type: string;
  reason: string;
  amount: number;
  paid_amount: number;
  missed_month: string;
  is_paid: boolean;
  applied_at: Date;
  resolved_at: Date | null;
  waived: boolean | null;
  generated: "automatically" | "manually" | null;
};

export default function ManualPenaltyManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isWaiveModalOpen, setIsWaiveModalOpen] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({ key: "", direction: "ascending" });
  const router = useRouter();
  const form = useForm<z.infer<typeof penaltyFormSchema>>({
    resolver: zodResolver(penaltyFormSchema),
    defaultValues: {
      member_id: 0,
      amount: 0,
      missed_month: new Date().toISOString().split("T")[0],
      generated: "manually",
    },
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [penaltyTypes, setPenaltyTypes] = useState<string[]>([]);
  const [isloading, setIsloading] = useState<boolean>(false);

  const fetchSettingDatas = async () => {
    const res = await fetch("/api/fetchSettingDatas", {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error("Failed to fetch data");
    return res.json();
  };
  const { data, error, isLoading, mutate } = useSWR(
    "/api/fetchSettingDatas",
    fetchSettingDatas
  );
  const penaltiesWithNumberAmount = useMemo(() => {
    return data?.penalties ?? [];
  }, [data?.penalties]);
  const allMembers = data?.allMembers ?? [];
  const [state, formAction] = useFormState(createPenalty, {
    success: false,
    error: false,
  });
  useEffect(() => {
    getPenaltyTypes().then((types) =>
      setPenaltyTypes(types.map((t) => t.name))
    );
  }, []);
  const handleDeletePenalty = async (penaltyId: number) => {
    setIsloading(true);
    try {
      const response = await fetch(`/api/penalty`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          penaltyId,
          deletePaymentRecord: true,
        }),
      });
      setIsloading(false);

      if (!response.ok) {
        throw new Error("Failed to delete penalty");
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
  const handleWaivePenalty = async (penaltyId: number) => {
    setIsloading(true);
    try {
      const response = await fetch("/api/penalty", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ penaltyId }),
      });
      setIsloading(false);
      if (!response.ok) {
        throw new Error("Failed to waive penalty");
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const handleSearch = (term: string) => {
    if (term === "") {
      setFilteredMembers(allMembers);
      return;
    }
    const searchTermLower = term.toLowerCase();

    const filtered = allMembers.filter((member: Member) => {
      const fullName =
        `${member.first_name} ${member.second_name} ${member.last_name}`.toLowerCase();
      const firstNameLastName =
        `${member.first_name} ${member.last_name}`.toLowerCase();
      const firstNameSecondName =
        `${member.first_name} ${member.second_name}`.toLowerCase();
      const secondNameLastName =
        `${member.second_name} ${member.last_name}`.toLowerCase();

      return (
        fullName.includes(searchTermLower) ||
        firstNameLastName.includes(searchTermLower) ||
        firstNameSecondName.includes(searchTermLower) ||
        secondNameLastName.includes(searchTermLower) ||
        member.id_number?.toLowerCase().includes(searchTermLower) ||
        member.phone_number.toLowerCase().includes(searchTermLower)
      );
    });

    setFilteredMembers(filtered);
  };

  // Add this function to calculate the penalty amount
  const calculatePenaltyAmount = (unpaidCount: number): number => {
    if (unpaidCount === 0) return 500;
    if (unpaidCount >= 5) return 500 * 5; // Cap at 5 levels (2500 birr)
    return 500 * (unpaidCount + 1);
  };

  // Modify your handleMemberSelect function to include the penalty calculation
  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    form.setValue("member_id", member.id);

    // Check for unpaid penalties for this member
    const unpaidPenalties = penaltiesWithNumberAmount.filter(
      (p: Penalty) => p.member.id === member.id && !p.is_paid && !p.waived
    );

    // Calculate the new penalty amount
    const newAmount = calculatePenaltyAmount(unpaidPenalties.length);
    form.setValue("amount", newAmount);
  };
  const onSubmit: SubmitHandler<z.infer<typeof penaltyFormSchema>> = async (
    data
  ) => {
    setIsloading(true);
    await formAction({
      ...data,
      missed_month: new Date(data.missed_month),
    });
  };

  useEffect(() => {
    if (state.success) {
      setIsloading(false);
      toast.success(`penalty has been created`);
      setSelectedMember(null);
      setMemberSearchTerm("");
      setIsModalOpen(false);
      setShowMembersList(false);
      form.reset();
      mutate();
    }
    if (state.error) {
      setIsloading(false);
      toast.error("Something went wrong");
    }
  }, [state, router, form, mutate]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".member-search-container")) {
        setShowMembersList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const sortedPenalties = useMemo(() => {
    let sortableItems = [...penaltiesWithNumberAmount];

    // Apply search filter if search term exists
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();

      sortableItems = sortableItems.filter((penalty) => {
        const fullName =
          `${penalty.member.first_name} ${penalty.member.second_name} ${penalty.member.last_name}`.toLowerCase();
        const firstNameLastName =
          `${penalty.member.first_name} ${penalty.member.last_name}`.toLowerCase();
        const firstNameSecondName =
          `${penalty.member.first_name} ${penalty.member.second_name}`.toLowerCase();
        const secondNameLastName =
          `${penalty.member.second_name} ${penalty.member.last_name}`.toLowerCase();

        return (
          fullName.includes(searchTermLower) ||
          firstNameLastName.includes(searchTermLower) ||
          firstNameSecondName.includes(searchTermLower) ||
          secondNameLastName.includes(searchTermLower) ||
          penalty.member.custom_id.toLowerCase().includes(searchTermLower)
        );
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === "member") {
          aValue = `${a.member.first_name} ${a.member.last_name}`.toLowerCase();
          bValue = `${b.member.first_name} ${b.member.last_name}`.toLowerCase();
        } else if (sortConfig.key === "missed_month") {
          aValue = new Date(a.missed_month).getTime();
          bValue = new Date(b.missed_month).getTime();
        } else if (sortConfig.key === "status") {
          aValue = getStatusValue(a);
          bValue = getStatusValue(b);
        } else {
          aValue = a[sortConfig.key as keyof Penalty];
          bValue = b[sortConfig.key as keyof Penalty];
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [penaltiesWithNumberAmount, sortConfig, searchTerm]);

  // Helper function for status sorting
  function getStatusValue(penalty: Penalty) {
    if (penalty.is_paid) return 2;
    if (penalty.waived) return 1;
    return 0;
  }

  // Sort request function
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  const headers = [
    { key: "id", label: "ID", sortable: false },
    { key: "member", label: "Member", sortable: true },
    { key: "penalty_type", label: "Type", sortable: true },
    { key: "amount", label: "Expected Amount", sortable: true },
    { key: "paid_amount", label: "Paid Amount", sortable: true },
    { key: "missed_month", label: "Penalty Month", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 animate-pulse space-y-4">
        {/* Skeleton for header */}
        <div className="flex justify-end mt-4">
          <div className="h-8 bg-gray-300 rounded w-[150px]" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/3 " />
        <div className="h-4 bg-gray-100 rounded w-1/4 " />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-gray-200 shadow-sm space-y-2"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-6 bg-gray-300 rounded w-2/3" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 mt-6">
          <div className="h-10 bg-gray-100 rounded-t px-4 py-2" />
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center px-6 py-4 space-x-20">
                {[...Array(6)].map((__, j) => (
                  <div
                    key={j}
                    className="h-4 bg-gray-100 rounded w-full max-w-[100px]"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">{error.message}</div>
    );
  }
  return (
    <div className="container mx-auto p-2">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Penalty Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track all penalty records
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setShowMembersList(false);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Penalty
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Penalties"
          value={penaltiesWithNumberAmount.length}
          icon={<FaExclamationCircle className="text-blue-500" size={24} />}
        />
        <StatCard
          title="Unpaid"
          value={
            penaltiesWithNumberAmount.filter(
              (p: { is_paid: any; waived: any }) => !p.is_paid && !p.waived
            ).length
          }
          icon={<FaHourglassHalf className="text-yellow-500" size={24} />}
        />
        <StatCard
          title="Paid"
          value={
            penaltiesWithNumberAmount.filter((p: { is_paid: any }) => p.is_paid)
              .length
          }
          icon={<FaCheckCircle className="text-green-500" size={24} />}
        />
        <StatCard
          title="Waived"
          value={
            penaltiesWithNumberAmount.filter((p: { waived: any }) => p.waived)
              .length
          }
          icon={<FaHandshake className="text-purple-500" size={24} />}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="font-semibold text-gray-800">Recent Penalties</h2>
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-x-hidden cursor-pointer hover:bg-gray-100"
                    onClick={() => header.sortable && requestSort(header.key)}
                  >
                    <div className="flex items-center">
                      {header.label}
                      {sortConfig.key === header.key && (
                        <span className="ml-1">
                          {sortConfig.direction === "ascending" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className=" bg-white divide-y divide-gray-200">
              {penaltiesWithNumberAmount.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FolderOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No penalties found
                      </h3>
                      <p className="text-gray-500 max-w-md">
                        {searchTerm
                          ? "No penalties match your search criteria"
                          : "Get started by adding a new penalty."}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setMemberSearchTerm("")}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : sortedPenalties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FolderOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No penalties match your search
                      </h3>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedPenalties.map((penalty: Penalty) => (
                  <tr
                    key={penalty.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className=" px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {penalty.member.custom_id}
                    </td>
                    <td className=" py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {penalty?.member?.image_url ? (
                            <>
                              <Image
                                src={penalty?.member?.image_url}
                                alt={`${penalty?.member?.first_name} ${penalty.member.second_name} `}
                                width={32}
                                height={32}
                                className="rounded-full object-cover border border-gray-300"
                                unoptimized
                              />
                            </>
                          ) : (
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {penalty.member.first_name}{" "}
                            {penalty.member.second_name}{" "}
                            {penalty.member.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {penalty.member.custom_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {penalty.penalty_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {penalty.amount.toFixed(2)} birr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {penalty.paid_amount.toFixed(2)} birr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(penalty.missed_month), "MMM dd yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        isPaid={penalty.is_paid}
                        isWaived={penalty.waived}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedPenalty(penalty);
                            setIsWaiveModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          disabled={penalty.is_paid || !!penalty.waived}
                        >
                          Waive
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPenalty(penalty);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Penalty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Add New Penalty
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    form.reset();
                    setSelectedMember(null);
                    setMemberSearchTerm("");
                    setShowMembersList(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-search-container">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Search Member <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="name or phone number..."
                            value={
                              selectedMember
                                ? `${selectedMember.first_name} ${selectedMember.second_name} ${selectedMember.last_name}`
                                : memberSearchTerm
                            }
                            onChange={(e) => {
                              setSelectedMember(null);
                              setMemberSearchTerm(e.target.value);
                              handleSearch(e.target.value);
                              setShowMembersList(true);
                            }}
                            onClick={() => {
                              if (!memberSearchTerm && !selectedMember) {
                                setFilteredMembers(allMembers);
                                setShowMembersList(true);
                              }
                            }}
                            className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!!selectedMember}
                          />
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          {selectedMember && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMember(null);
                                setMemberSearchTerm("");
                                form.setValue("member_id", 0);
                                setShowMembersList(false);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-500"
                            >
                              <XIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        {showMembersList &&
                          (searchTerm || (!searchTerm && !selectedMember)) && (
                            <div className="absolute z-10 mt-1 w-full border border-gray-200 rounded-lg shadow-lg bg-white max-h-48 overflow-y-auto">
                              {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                    onClick={() => {
                                      handleMemberSelect(member);
                                      setShowMembersList(false);
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium">
                                          {member.first_name}{" "}
                                          {member.second_name}{" "}
                                          {member.last_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {member.id_number} •{" "}
                                          {member.phone_number}
                                        </div>
                                      </div>
                                      <svg
                                        className="h-5 w-5 text-blue-500 shrink-0 ml-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-gray-500 text-center">
                                  No members found
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      {form.formState.errors.member_id && (
                        <p className="mt-1 text-sm text-red-600">
                          {form.formState.errors.member_id.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <InputField
                    label="Penalty Date"
                    name="missed_month"
                    required
                    type="date"
                    register={form.register}
                    error={form.formState.errors.missed_month}
                    icon={<CalendarIcon className="text-gray-400" />}
                  />
                </div>

                {/* Second Row: Amount + Penalty Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Amount"
                    name="amount"
                    type="number"
                    required
                    register={form.register}
                    registerOptions={{
                      setValueAs: (value: string) =>
                        value === "" ? undefined : Number(value),
                      required: "Amount is required",
                      min: {
                        value: 1,
                        message: "Amount must be greater than 0",
                      },
                    }}
                    error={form.formState.errors.amount}
                    icon={<CurrencyDollarIcon className="text-gray-400" />}
                  />

                  <SelectField
                    label="Penalty Type"
                    name="penalty_type"
                    required
                    register={form.register}
                    registerOptions={{ required: "Penalty type is required" }}
                    error={form.formState.errors.penalty_type}
                    options={[
                      { value: "", label: "Select Penalty type" },
                      ...penaltyTypes.map((type) => ({
                        value: type,
                        label: type,
                      })),
                    ]}
                    icon={
                      <ClipboardDocumentCheckIcon className="text-gray-400" />
                    }
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      form.reset();
                      setSelectedMember(null);
                      setMemberSearchTerm("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    disabled={isloading}
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    {isloading ? "Processing..." : "Create Penalty"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Delete Penalty Modal */}
      {isDeleteModalOpen && selectedPenalty && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Delete Penalty
                </h2>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedPenalty.member.first_name}{" "}
                      {selectedPenalty.member.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {selectedPenalty.member.custom_id}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">
                      {selectedPenalty.amount.toFixed(2)} birr
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Month</p>
                    <p className="font-medium">
                      {format(
                        new Date(selectedPenalty.missed_month),
                        "MMM yyyy"
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-medium">
                    Are you sure you want to delete this penalty? This action
                    cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isloading}
                  onClick={async () => {
                    if (!selectedPenalty) return;
                    try {
                      const result = await handleDeletePenalty(
                        selectedPenalty.id
                      );
                      if (result.success) {
                        toast.success(
                          `Penalty deleted for ${selectedPenalty.member.first_name}`
                        );
                        mutate();
                      } else {
                        toast.error(result.error || "Failed to delete penalty");
                      }
                    } catch (error) {
                      toast.error("Failed to delete penalty");
                    } finally {
                      setIsDeleteModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  {isloading ? "Processing..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Waive Penalty Modal */}
      {isWaiveModalOpen && selectedPenalty && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Waive Penalty
                </h2>
                <button
                  onClick={() => setIsWaiveModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedPenalty.member.first_name}{" "}
                      {selectedPenalty.member.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {selectedPenalty.member.custom_id}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">
                      {selectedPenalty.amount.toFixed(2)} birr
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Month</p>
                    <p className="font-medium">
                      {format(
                        new Date(selectedPenalty.missed_month),
                        "MMM yyyy"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setIsWaiveModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isloading}
                  onClick={async () => {
                    if (!selectedPenalty) return;
                    try {
                      const result = await handleWaivePenalty(
                        selectedPenalty.id
                      );
                      if (result.success) {
                        toast.success(
                          `Penalty waived for ${selectedPenalty.member.first_name}`
                        );
                        mutate();
                      } else {
                        toast.error(result.error || "Failed to waive penalty");
                      }
                    } catch (error) {
                      toast.error("Failed to waive penalty");
                    } finally {
                      setIsWaiveModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  {isloading ? "Processing..." : " Confirm Waive"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper components
  function StatCard({
    title,
    value,
    icon,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
  }) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          <div className="p-3 rounded-full bg-gray-50">{icon}</div>
        </div>
      </div>
    );
  }

  function StatusBadge({
    isPaid,
    isWaived,
  }: {
    isPaid: boolean;
    isWaived: boolean | null;
  }) {
    if (isPaid) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
          Paid
        </span>
      );
    }
    if (isWaived) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-purple-100 text-purple-800">
          Waived
        </span>
      );
    }
    return (
      <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-yellow-100 text-yellow-800">
        upPaid
      </span>
    );
  }

  function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    );
  }

  function XIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  }
}
