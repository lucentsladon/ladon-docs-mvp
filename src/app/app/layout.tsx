import AppNavigation from "@/components/common/app-navigation"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full">
      <div className="pb-20">
        <AppNavigation />
      </div>
      <main>{children}</main>
    </div>
  )
}
