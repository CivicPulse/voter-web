import { Link } from "@tanstack/react-router"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Users, Upload, Download, Shield } from "lucide-react"

/**
 * Admin navigation menu with dropdown submenu
 * Shows User Management, Imports, and Exports options
 */
export function AdminNavMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-9">
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-56 p-2 space-y-1">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/admin/users"
                    className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create and manage user accounts
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/admin/imports"
                    className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Imports</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload voter and boundary data
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/admin/exports"
                    className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Exports</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generate and download data exports
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

/**
 * Mobile-friendly admin navigation links (for sheet/drawer)
 */
export function AdminNavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
        Admin
      </div>
      <Link
        to="/admin/users"
        className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
        onClick={onLinkClick}
      >
        <Users className="h-4 w-4" />
        <span>User Management</span>
      </Link>
      <Link
        to="/admin/imports"
        className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
        onClick={onLinkClick}
      >
        <Upload className="h-4 w-4" />
        <span>Imports</span>
      </Link>
      <Link
        to="/admin/exports"
        className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
        onClick={onLinkClick}
      >
        <Download className="h-4 w-4" />
        <span>Exports</span>
      </Link>
    </div>
  )
}
