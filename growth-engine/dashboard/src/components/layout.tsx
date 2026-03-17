import type { ReactNode } from "react"
import { LayoutDashboard, Brain, MessageSquare, Megaphone, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Data & SEO', href: '/seo', icon: Brain },
  { name: 'Content Engine', href: '/content', icon: MessageSquare },
  { name: 'Ads Manager', href: '/ads', icon: Megaphone },
  { name: 'Lead Gen', href: '/leads', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

type AppLayoutProps = {
  currentPath: string
  children: ReactNode
}

export default function AppLayout({ currentPath, children }: AppLayoutProps) {

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-white font-bold text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-400" />
            Growth Agent
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-teal-500/10 text-teal-400" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-teal-400" : "text-slate-400")} />
                {item.name}
              </a>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">Culinary Block AI v1.0</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm">
          <div className="flex-1" />
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Agent Active
            </div>
            Admin
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
