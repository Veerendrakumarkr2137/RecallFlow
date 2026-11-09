import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";

import API from "./services/api";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Tickets from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import MemoryManagement from "./pages/MemoryManagement";
import KnowledgeBase from "./pages/KnowledgeBase";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";
import Analytics from "./pages/Analytics";
import AgentDashboard from "./pages/AgentDashboard";
import Settings from "./pages/Settings";

function ProtectedLayout({ user, onLogout, onUpdateUser, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        user={user}
        onLogout={onLogout}
      />

      <div className="main-content">
        <Navbar
          user={user}
          onToggleMobileMenu={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="page-wrapper">{children}</main>
      </div>
    </div>
  );
}

function ProtectedRoute({ user, requireAgent = false, children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (requireAgent && user && user.role !== "agent" && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      API.get("/me")
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        });
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const handleUpdateUser = (updated) => {
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard & Operations */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <Dashboard user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute user={user}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <Chat user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets"
          element={
            <ProtectedRoute user={user}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <Tickets user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/:ticketId"
          element={
            <ProtectedRoute user={user}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <TicketDetail user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/memory"
          element={
            <ProtectedRoute user={user}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <MemoryManagement user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/knowledge"
          element={
            <ProtectedRoute user={user}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <KnowledgeBase user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute user={user} requireAgent={true}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <Customers user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers/:customerId"
          element={
            <ProtectedRoute user={user} requireAgent={true}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <CustomerProfile user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute user={user} requireAgent={true}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <Analytics user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/agent"
          element={
            <ProtectedRoute user={user} requireAgent={true}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <AgentDashboard user={user} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute user={user}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
                <Settings user={user} onUpdateUser={handleUpdateUser} />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
