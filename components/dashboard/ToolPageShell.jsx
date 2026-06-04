"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import Sidebar from "@/components/dashboard/Sidebar";

export default function ToolPageShell({ children }) {
  const sidebarOpen = true;
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Sidebar
        isOpen={sidebarOpen}
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />

      <main
        className={`min-h-screen flex-1 overflow-y-auto p-6 pt-24 transition-all duration-300 ${
          sidebarOpen ? (sidebarExpanded ? "lg:ml-72" : "lg:ml-16") : "lg:ml-0"
        }`}
      >
        <div className="mx-auto max-w-[1500px]">{children}</div>
      </main>
    </DashboardLayout>
  );
}
