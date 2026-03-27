import { FileText, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-12 border-b border-border bg-background flex items-center px-4 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 mr-3"
        onClick={onToggleSidebar}
      >
        <Menu className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">TextEditor</span>
      </div>
    </header>
  )
}
