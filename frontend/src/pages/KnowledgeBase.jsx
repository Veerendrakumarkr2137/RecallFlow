import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Upload,
  FileText,
  Search,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  X
} from "lucide-react";
import API from "../services/api";
import { TableSkeleton } from "../components/LoadingSkeleton";

export default function KnowledgeBase({ user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload Form
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Semantic Search Test Console
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const isAgent = user?.role === "agent" || user?.role === "admin";

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await API.get("/knowledge/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim() || uploading) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("file", file);

    try {
      const res = await API.post("/knowledge/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocuments((prev) => [res.data, ...prev]);
      setIsUploadOpen(false);
      setTitle("");
      setFile(null);
      alert("Document indexed successfully with semantic chunks!");
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document and all its indexed chunks?")) return;
    try {
      await API.delete(`/knowledge/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  const handleTestSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    try {
      const res = await API.post("/knowledge/search", { query: searchQuery.trim() });
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error("Search test failed:", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-sky-400" />
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Company Knowledge Base (RAG)</h1>
          </div>
          <p className="text-sm text-slate-400">
            Upload hardware documentation, policy manuals, and troubleshooting guides for AI-grounded retrieval.
          </p>
        </div>

        {isAgent && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="glow-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-2 glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider">
              Indexed Documents ({documents.length})
            </h2>
            <span className="text-xs text-slate-500 font-mono">Semantic RAG Pipeline</span>
          </div>

          {loading ? (
            <TableSkeleton rows={4} />
          ) : documents.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
              <FileText size={36} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-300">No knowledge documents indexed yet</p>
              <p className="text-xs text-slate-500 mt-1">Upload a markdown, text, or PDF manual to ground AI responses.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="glass-card p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{doc.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono">
                          {doc.file_type}
                        </span>
                        <span>{doc.chunk_count} indexed chunks</span>
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>

                  {isAgent && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Semantic Search Test Console */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-purple-400" />
            <h2 className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider">
              Semantic Search Console
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Test how the RAG retriever identifies relevant document chunks for customer queries.
          </p>

          <form onSubmit={handleTestSearch} className="space-y-2">
            <input
              type="text"
              placeholder="e.g. laptop battery drain or F12 diagnostic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input text-xs py-2"
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="glow-btn-primary w-full py-2 rounded-lg text-xs font-semibold"
            >
              {searching ? "Searching Chunks..." : "Run Semantic Test"}
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {searchResults.length > 0 ? (
              searchResults.map((res, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-sky-400 font-semibold mb-1">
                    <span>{res.document_title}</span>
                    <span className="text-[10px] bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800">
                      Score: {res.similarity_score}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-3 leading-relaxed">{res.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                Enter a query above to inspect matching knowledge chunks and scores.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="modal-overlay">
          <div className="modal-content relative">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Upload Knowledge Document</h3>
            <p className="text-xs text-slate-400 mb-4">
              Supported formats: Markdown (.md), Plain Text (.txt), PDF (.pdf), or JSON (.json).
            </p>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="form-label">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Inspiron Hardware Diagnostic Standard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Select File</label>
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.pdf,.json"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="form-input file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-900 file:text-purple-200 hover:file:bg-purple-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="glow-btn-secondary px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="glow-btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  {uploading ? "Chunking & Indexing..." : "Upload & Index"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
