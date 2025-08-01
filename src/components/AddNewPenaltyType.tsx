"use client";

import React, { useEffect, useState } from "react";
import {
  addPenaltyTypeModel,
  deletePenaltyType,
  updatePenaltyType,
  getPenaltyTypesModel,
} from "@/lib/actions";
import { FiTrash2, FiEdit2, FiCheck, FiX, FiPlus } from "react-icons/fi";

interface PenaltyType {
  id: number;
  name: string;
}

export default function AddNewPenaltyType() {
  const [newPenaltyType, setNewPenaltyType] = useState("");
  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyType[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); // 👈 added loading state

  useEffect(() => {
    fetchPenaltyTypes();
  }, []);

  const fetchPenaltyTypes = async () => {
    try {
      setLoading(true); // 👈 show loading
      const types = await getPenaltyTypesModel();
      setPenaltyTypes(types);
    } catch (err) {
      console.error("Failed to fetch penalty types:", err);
    } finally {
      setLoading(false); // 👈 hide loading
    }
  };

  const handleAddPenaltyType = async () => {
    if (!newPenaltyType.trim()) return;
    try {
      await addPenaltyTypeModel(newPenaltyType.trim());
      setNewPenaltyType("");
      fetchPenaltyTypes();
    } catch (err) {
      console.error("Failed to add penalty type:", err);
    }
  };

  const confirmDelete = (id: number) => {
    setTypeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;
    try {
      await deletePenaltyType(typeToDelete);
      fetchPenaltyTypes();
    } catch (err) {
      console.error("Failed to delete penalty type:", err);
    } finally {
      setIsDeleteModalOpen(false);
      setTypeToDelete(null);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      await updatePenaltyType(id, editedName.trim());
      setEditingId(null);
      setEditedName("");
      fetchPenaltyTypes();
    } catch (err) {
      console.error("Failed to update penalty type:", err);
    }
  };

  return (
    <div className="mt-6 bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-600 mb-4">
        Manage Penalty Types
      </h3>

      {/* Add New Type */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter new penalty type"
          value={newPenaltyType}
          onChange={(e) => setNewPenaltyType(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyDown={(e) => e.key === "Enter" && handleAddPenaltyType()}
        />
        <button
          type="button"
          onClick={handleAddPenaltyType}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm"
        >
          <FiPlus className="w-5 h-5" />
          Add Penalty Type
        </button>
      </div>

      {/* Penalty Types List */}
      <div className="space-y-3 min-h-[100px]">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : penaltyTypes.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No penalty types added yet
          </div>
        ) : (
          penaltyTypes.map((type) => (
            <div
              key={type.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition"
            >
              {editingId === type.id ? (
                <div className="flex flex-1 items-center gap-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleEdit(type.id)}
                  />
                  <button
                    onClick={() => handleEdit(type.id)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition"
                    title="Save"
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full transition"
                    title="Cancel"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-gray-700">{type.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(type.id);
                        setEditedName(type.name);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition"
                      title="Edit"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => confirmDelete(type.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition"
                      title="Delete"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this penalty type? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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
