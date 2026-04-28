import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  BarChart3,
  TrendingUp,
  Zap,
} from "lucide-react";
import "./Sidebar.css";

function Sidebar({ userRole }) {
  const teacherMenuItems = [
    { id: 1, label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { id: 2, label: "Generate Paper", icon: FileText, href: "/generate-paper" },
    { id: 3, label: "My Exams", icon: BookOpen, href: "/my-exams" },
    { id: 4, label: "Students", icon: Users, href: "/students" },
    { id: 5, label: "Analytics", icon: BarChart3, href: "/analytics" },
  ];

  const studentMenuItems = [
    { id: 1, label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { id: 2, label: "My Exams", icon: BookOpen, href: "/my-exams" },
    { id: 3, label: "Quiz", icon: FileText, href: "/quiz" },
    { id: 4, label: "Performance", icon: TrendingUp, href: "/performance" },
    { id: 5, label: "Recommendations", icon: Zap, href: "/recommendations" },
  ];

  const menuItems =
    userRole === "teacher" ? teacherMenuItems : studentMenuItems;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.id} to={item.href} className="sidebar-item">
              <IconComponent size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
