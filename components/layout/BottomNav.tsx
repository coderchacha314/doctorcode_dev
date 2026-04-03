"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Activity, FolderOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/metrics", label: "Metrics", icon: Activity },
  { href: "/records", label: "Records", icon: FolderOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b1628]/95 backdrop-blur-md border-t border-blue-500/10 pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors duration-150 min-w-[60px]",
                isActive
                  ? "text-blue-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon
                size={22}
                className={cn(isActive && "drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]")}
              />
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isActive ? "text-blue-400" : "text-slate-500"
                )}
              >
                {label.toUpperCase()}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
