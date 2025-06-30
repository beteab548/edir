"use client";

import { addPenaltyType } from "@/lib/actions";
import React, { useState } from "react";

export default function AddNewPenaltyType() {
  const [newPenaltyType, setNewPenaltyType] = useState("");

  const handleAddPenaltyType = async () => {
    if (!newPenaltyType.trim()) return;
    try {
      await addPenaltyType(newPenaltyType.trim());
      setNewPenaltyType("");
    } catch (err) {
      console.error("Failed to add penalty type:", err);
    }
  };

  return (
    <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Add New Penalty Type
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Use this form to add a custom penalty type to the system.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter penalty type (e.g. Late attendance)"
          value={newPenaltyType}
          onChange={(e) => setNewPenaltyType(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleAddPenaltyType}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Add Type
        </button>
      </div>
    </div>
  );
}
