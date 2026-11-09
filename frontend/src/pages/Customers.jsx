import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  MessageSquare,
  Ticket,
  Brain,
  ArrowRight,
  Shield,
  Building
} from "lucide-react";
import API from "../services/api";
import { TableSkeleton } from "../components/LoadingSkeleton";

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/customers", {
        params: {
          search: search || undefined,
          tier: tierFilter || undefined
        }
      });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tierFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-purple-400" />
            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Customer 360 Management</h1>
          </div>
          <p className="text-sm text-slate-400">
            Inspect individual customer identities, cross-session memories, and unified support histories.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 text-xs"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="form-select py-1.5 text-xs"
          >
            <option value="">All Tiers</option>
            <option value="Standard">Standard Tier</option>
            <option value="Pro">Pro Tier</option>
            <option value="Enterprise">Enterprise Tier</option>
          </select>
        </div>
      </div>

      {/* Customer Directory Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : customers.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Customers Found</h3>
          <p className="text-xs text-slate-400">Try modifying your search or tier filters.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Tier</th>
                  <th className="py-3.5 px-4 text-center">Memories</th>
                  <th className="py-3.5 px-4 text-center">Chats</th>
                  <th className="py-3.5 px-4 text-center">Tickets</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{c.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {c.company || "Independent"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/80 border border-purple-800/40 text-purple-300">
                        {c.tier}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-purple-400">{c.memory_count}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-sky-400">{c.conversation_count}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-amber-400">{c.ticket_count}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {c.last_interaction ? new Date(c.last_interaction).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${c.id}`);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
