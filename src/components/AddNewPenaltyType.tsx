"use client";

import { addPenaltyType } from "@/lib/actions";
import React, { useState } from "react";

export default function AddNewPenaltyType() {
  const [newPenaltyType, setNewPenaltyType] = useState("");
  const handleAddPenaltyType = async () => {
    if (!newPenaltyType.trim()) return;
    try {
      const result = await addPenaltyType(newPenaltyType);
      setNewPenaltyType("");
    } catch (err) {
      console.error("Failed to add penalty type:", err);
    }
  };
  return (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        placeholder="Add new type"
        value={newPenaltyType}
        onChange={(e) => setNewPenaltyType(e.target.value)}
        className="flex-1 p-2 border rounded"
      />
      <button
        type="button"
        onClick={handleAddPenaltyType}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        Add
      </button>
    </div>
  );
}
