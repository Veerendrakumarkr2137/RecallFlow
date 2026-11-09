import React, { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X
} from "lucide-react";
import API from "../services/api";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { MemoryConfidenceBadge } from "../components/StatusBadge";

export default function MemoryManagement() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit/Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [modalForm, setModalForm] = useState({
    category: "Device Information",
    content: "",
    confidence: 0.95
  });

  const categories = [
    "Device Information",
    "Support Preferences",
    "Reported Issues",
    "Troubleshooting History",
    "Resolutions",
    "Other Information"
  ];

  const loadMemories = async () => {
    setLoading(true);
    try {
      const res = await API.get("/memory/insights");
      setMemories(res.data.memories || []);
    } catch (err) {
      console.error("Failed to load memories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this remembered fact?")) return;
    try {
      await API.delete(`/memory/items/${id}`);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("Failed to delete memory record.");
    }
  };

  const openAddModal = () => {
    setEditingMemory(null);
    setModalForm({
      category: "Device Information",
      content: "",
      confidence: 0.95
    });
    setIsModalOpen(true);
  };

  const openEditModal = (mem) => {
    setEditingMemory(mem);
    setModalForm({
      category: mem.category,
      content: mem.content,
      confidence: mem.confidence
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMemory) {
        const res = await API.put(`/memory/items/${editingMemory.id}`, {
          category: modalForm.category,
          content: modalForm.content
        });
        setMemories((prev) => prev.map((m) => (m.id === editingMemory.id ? res.data : m)));
      } else {
        const res = await API.post("/memory/items", {
          category: modalForm.category,
          content: modalForm.content,
          confidence: modalForm.confidence
        });
        setMemories((prev) => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to save memory.");
    }
  };

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    const matchesCategory = categoryFilter === "All" || m.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && m.is_active && !m.is_outdated) ||
      (statusFilter === "outdated" && m.is_outdated);
    const matchesSearch =
      !search ||
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={20} className="text-purple-400" />
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Customer Memory Bank</h1>
          </div>
          <p className="text-sm text-slate-400">
            Inspect, correct, or remove structured memory facts retained by RecallFlow AI across your conversations.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="glow-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
        >
          <Plus size={16} />
          <span>Add Custom Memory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search remembered facts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select py-2 text-xs"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select py-2 text-xs"
          >
            <option value="all">All States</option>
            <option value="active">Active Only</option>
            <option value="outdated">Outdated / Superseded</option>
          </select>
        </div>
      </div>

      {/* Memory Cards Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredMemories.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Brain size={40} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Memories Found</h3>
          <p className="text-xs text-slate-400">No remembered records match your current filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className={`glass-card p-5 relative flex flex-col justify-between ${
                mem.is_outdated ? "opacity-60 border-amber-900/40" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800/40 text-purple-300">
                    {mem.category}
                  </span>

                  <div className="flex items-center gap-2">
                    {mem.is_outdated ? (
                      <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 flex items-center gap-1">
                        <AlertTriangle size={11} /> Outdated / Superseded
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Active Memory
                      </span>
                    )}
                    <MemoryConfidenceBadge confidence={mem.confidence} />
                  </div>
                </div>

                <p className="text-sm text-slate-200 mt-2 leading-relaxed">{mem.content}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Source: {mem.source.replace("_", " ")}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(mem)}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit fact"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(mem.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete fact"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingMemory ? "Edit Remembered Fact" : "Add Custom Memory Fact"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              RecallFlow AI will inject this information into future conversation contexts.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="form-label">Category</label>
                <select
                  value={modalForm.category}
                  onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                  className="form-select"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Remembered Fact</label>
                <textarea
                  value={modalForm.content}
                  onChange={(e) => setModalForm({ ...modalForm, content: e.target.value })}
                  placeholder="e.g., Customer uses Dell Inspiron 15 with 16GB RAM and prefers phone contact."
                  className="form-textarea h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glow-btn-secondary px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glow-btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
