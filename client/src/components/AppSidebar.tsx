import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Truck,
  Store,
  Package,
  BarChart3,
  Settings,
  MapPin,
  Gift,
  Sliders,
  UserPlus,
  Wallet
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Commandes",
    url: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Livreurs",
    url: "/deliverers",
    icon: Truck,
  },
  // {
  //   title: "Interface Livreur",
  //   url: "/deliverer-interface",
  //   icon: Truck,
  // },
  {
    title: "Prestataires",
    url: "/providers",
    icon: Store,
  },
  {
    title: "Sessions livreurs",
    url: "/deliverer-sessions",
    icon: Truck,
  },
  {
    title: "Produits",
    url: "/products",
    icon: Package,
  },
  {
    title: "Option Groups",
    url: "/OptionGroups",
    icon: Package,
  },
  {
    title: "All Options",
    url: "/AllOptions",
    icon: Package,
  },
  {
    title: "Zones",
    url: "/zones",
    icon: MapPin,
  },
  {
    title: "Promotions",
    url: "/promotions",
    icon: Gift,
  },
  {
    title: "Cash out/Cash In",
    url: "/cash-management",
    icon: Wallet,
  },
];

const secondaryItems = [
  {
    title: "Créer un administrateur",
    url: "/create-admin",
    icon: UserPlus,
  },
  {
    title: "Analytiques",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Configuration",
    url: "/configuration",
    icon: Sliders,
  },
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  // Get current user role
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUser.role === 'superAdmin';

  // Define allowed menu items for admin users
  const allowedMenuItemsForAdmin = [
    'Dashboard',
    'Commandes',
    'Clients',
    'Livreurs',
    'Sessions livreurs',
    'Produits',
    'Option Groups',
    'All Options',
    'Zones',
  ];

  // Filter primary menu items based on role
  const visibleMenuItems = isSuperAdmin
    ? menuItems
    : menuItems.filter(item => allowedMenuItemsForAdmin.includes(item.title));

  // Filter secondary items - only show Create Admin to superAdmins
  const visibleSecondaryItems = secondaryItems.filter(item => {
    if (item.title === "Créer un administrateur") {
      return isSuperAdmin;
    }
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <div>
            <h2 className="font-semibold text-base">AMIGOS Delivery</h2>
            <p className="text-xs text-muted-foreground">Dashboard Admin</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Autres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSecondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
