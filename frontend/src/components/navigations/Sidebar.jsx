import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Calendar,
    CheckSquare,
    Briefcase,
    LayoutDashboard,
    Users,
    Building2,
    Layers,
    LogOut,
    ListTodo,
    BriefcaseBusiness,
    TrendingUpDown,
    ChevronsUpDown,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const SidebarComponent = () => {
    const location = useLocation();
    const { state, isMobile } = useSidebar();
    const authUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
    const authRoleId = authUser.role_id;

    const menuItems = [
        {
            header: "Main",
            items: [
                { to: "/calendar", name: "Time Charging", icon: Calendar },
                ...([2, 3].includes(authRoleId)
                    ? [
                        { to: "/projects/budget", name: "Project Budget", icon: BriefcaseBusiness },
                        { to: "/projects/etf", name: "ETF", icon: TrendingUpDown },
                    ]
                    : []),
            ],
        },
        ...([2, 3].includes(authRoleId)
            ? [
                {
                    header: "Manage",
                    items: [
                        { to: "/approval-list", name: "Approval List", icon: CheckSquare },
                        { to: "/projects/external", name: "Projects External", icon: Briefcase },
                        { to: "/projects/internal", name: "Projects Internal", icon: Layers },
                        { to: "/tasks/departmental", name: "Departmental Tasks", icon: ListTodo },
                    ],
                },
            ]
            : []),
        ...(authRoleId === 3
            ? [
                {
                    header: "Admin",
                    items: [
                        { to: "/users", name: "Users", icon: Users },
                        { to: "/departments", name: "Departments", icon: Building2 },
                        { to: "/holidays", name: "Holidays", icon: LayoutDashboard },
                    ],
                },
            ]
            : []),
    ];

    const initials = () => {
        if (!authUser.first_name) return "U";
        return `${authUser.first_name[0]}${authUser.last_name?.[0] || ""}`.toUpperCase();
    };

    const isTeams = window?.microsoftTeams !== undefined || window.self !== window.top;

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        if (window.indexedDB && indexedDB.databases) {
            indexedDB.databases().then((dbs) => {
                dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
            });
        }
        window.location.href = "/";
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent data-[state=open]:hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:!p-0">
                            <Link to="/calendar">
                                {/* Collapsed View: Icon Logo */}
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground hidden group-data-[collapsible=icon]:flex p-1">
                                    <img src="/assets/img/aidea-logo.png" alt="Aidea Icon" className="w-full h-full object-contain" />
                                </div>

                                {/* Expanded View: Full Logo */}
                                <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                                    <img src="/assets/img/logo.png" alt="Aidea Logo" className="h-8 w-auto object-contain" />
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {menuItems.map((group, idx) => (
                    <SidebarGroup key={idx}>
                        <SidebarGroupLabel>{group.header}</SidebarGroupLabel>
                        <SidebarMenu>
                            {group.items.map((item, itemIdx) => {
                                const isActive = location.pathname === item.to;
                                return (
                                    <SidebarMenuItem key={itemIdx}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={{
                                                children: item.name,
                                                className: "z-[100] bg-zinc-950 text-zinc-50 border-zinc-800"
                                            }}
                                        >
                                            <Link to={item.to}>
                                                <item.icon />
                                                <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        {authUser.profile ? (
                                            <AvatarImage src={`data:image/png;base64,${authUser.profile}`} alt={authUser.first_name} />
                                        ) : (
                                            <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">{initials()}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                        <span className="truncate font-semibold">{authUser.first_name} {authUser.last_name}</span>
                                        <span className="truncate text-xs">{authUser.email}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <div className="flex items-center gap-2 p-2">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        {authUser.profile ? (
                                            <AvatarImage src={`data:image/png;base64,${authUser.profile}`} alt={authUser.first_name} />
                                        ) : (
                                            <AvatarFallback className="rounded-lg">{initials()}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{authUser.first_name} {authUser.last_name}</span>
                                        <span className="truncate text-xs">{authUser.email}</span>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => (isTeams ? window.location.reload() : handleLogout())}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

        </Sidebar>
    );
};

export default SidebarComponent;
