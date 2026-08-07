import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Wallet, CalendarCheck, IndianRupee, FileBarChart,
  Settings as SettingsIcon, LogOut, Sun, Moon, GraduationCap, ChevronDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const items = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
  { to: "/students", label: "Students", icon: <Users size={18} /> },
  { to: "/fees", label: "Fees", icon: <Wallet size={18} /> },
  { to: "/attendance", label: "Attendance", icon: <CalendarCheck size={18} /> },
  { to: "/expenses", label: "Expenses", icon: <IndianRupee size={18} /> },
  { to: "/reports", label: "Reports", icon: <FileBarChart size={18} /> },
  { to: "/settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];

export default function Sidebar({ instituteName, theme, toggleTheme }) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={"tms-sidebar" + (collapsed ? " tms-sidebar-collapsed" : "")}>
      <div className="tms-sidebar-top">
        <div className="tms-sidebar-brand">
          <div className="tms-login-mark tms-sidebar-mark"><GraduationCap size={18} /></div>
          {!collapsed && <span>{instituteName || "TMS"}</span>}
        </div>
        <button className="tms-icon-btn tms-sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          <ChevronDown size={16} style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(90deg)" }} />
        </button>
      </div>
      <nav className="tms-nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => "tms-nav-item" + (isActive ? " tms-nav-item-active" : "")}
          >
            {it.icon}{!collapsed && <span>{it.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="tms-sidebar-bottom">
        <button className="tms-nav-item" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>
        <button className="tms-nav-item" onClick={logout}>
          <LogOut size={18} />{!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}
