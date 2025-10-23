"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("overview")

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "alerts", label: "Alerts", icon: "🚨" },
    { id: "forensic", label: "Forensic", icon: "🔍" },
    { id: "actions", label: "Actions", icon: "⚡" },
    { id: "scanner", label: "Scanner", icon: "🔄" },
    { id: "reports", label: "Reports", icon: "📄" },
    { id: "cspm", label: "CSPM & SSPM", icon: "☁️" },
    { id: "playbooks", label: "Playbooks", icon: "📖" },
  ]

  return (
    <div className="w-64 bg-[#252836] border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-white font-bold text-xl">SENTINEL-X</span>
        </div>
      </div>

      {/* User Badge */}
      <div className="p-4">
        <div className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium text-center">CLASSIFIED</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1",
              activeItem === item.id
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-gray-400 hover:bg-gray-700/50 hover:text-white",
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Install Button */}
      <div className="p-4 border-t border-gray-700">
        <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <span>📥</span>
          <span>Install</span>
        </button>
      </div>
    </div>
  )
}
