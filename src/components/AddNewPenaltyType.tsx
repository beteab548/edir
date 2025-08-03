"use client";

import React, { useEffect, useState } from "react";
import {
  addPenaltyTypeModel,
  deletePenaltyType,
  updatePenaltyType,
  getPenaltyTypesModel,
} from "@/lib/actions";
import {
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiPlus,
  FiAlertTriangle,
} from "react-icons/fi";
import { FolderOpenIcon } from "@heroicons/react/24/outline";

interface PenaltyType {
  id: number;
  name: string;
  amount: number;
}

export default function AddNewPenaltyType() {
  // State for data and loading
  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyType[]>([]);
  const [loading, setLoading] = useState(true);

  // State for modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isloading, setIsloading] = useState<boolean>(false);

  const [editingType, setEditingType] = useState<PenaltyType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<PenaltyType | null>(null);

  // State for the form inputs
  const [formData, setFormData] = useState({
    name: "",
    amount: "" as number | "",
  });

  useEffect(() => {
    fetchPenaltyTypes();
  }, []);

  const fetchPenaltyTypes = async () => {
    try {
      setLoading(true);
      const types = await getPenaltyTypesModel();
      setPenaltyTypes(types);
    } catch (err) {
      console.error("Failed to fetch penalty types:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingType(null);
    setFormData({ name: "", amount: "" });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (type: PenaltyType) => {
    setEditingType(type);
    setFormData({ name: type.name, amount: type.amount });
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (type: PenaltyType) => {
    setTypeToDelete(type);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || formData.amount === "") return;

    try {
      if (editingType) {
        setIsloading(true);
        // Update existing penalty type
        await updatePenaltyType(
          editingType.id,
          formData.name.trim(),
          Number(formData.amount)
        );
      } else {
        setIsloading(true);
        // Add new penalty type
        await addPenaltyTypeModel(
          formData.name.trim(),
          Number(formData.amount)
        );
      }
      setIsloading(false);
      fetchPenaltyTypes();
      setIsFormModalOpen(false);
    } catch (err) {
      setIsloading(false);
      console.error("Failed to save penalty type:", err);
    }
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;
    try {
      await deletePenaltyType(typeToDelete.id);
      fetchPenaltyTypes();
    } catch (err) {
      console.error("Failed to delete penalty type:", err);
    } finally {
      setIsDeleteModalOpen(false);
      setTypeToDelete(null);
    }
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  return (
    <div className="mt-8">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Manage Penalty Types
          </h2>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <FiPlus className="w-5 h-5" />
            Add New Type
          </button>
        </div>

        {/* Penalty Types Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Penalty Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : penaltyTypes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FolderOpenIcon className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        No Penalty Types Found
                      </h3>
                      <p>Click &rdquo;Add New Type&rdquo; to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                penaltyTypes.map((type) => (
                  <tr
                    key={type.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {type.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {type.amount.toFixed(2)} birr
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenEditModal(type)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-all duration-200"
                          title="Edit"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(type)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-all duration-200"
                          title="Delete"
                        >
                          <FiTrash2 className="w-5 h-5" />
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

      {/* Add/Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 m-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingType ? "Edit Penalty Type" : "Add New Penalty Type"}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Penalty Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Late Fee"
                  value={formData.name}
                  onChange={handleFormInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Base Amount (birr)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="e.g., 500.00"
                  value={formData.amount}
                  onChange={handleFormInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isloading}
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  {isloading
                    ? "Saving..."
                    : editingType
                    ? "Save Changes"
                    : "Add Penalty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 m-4 text-center">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the penalty type &quot;
              {typeToDelete?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors w-28"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm w-28"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
