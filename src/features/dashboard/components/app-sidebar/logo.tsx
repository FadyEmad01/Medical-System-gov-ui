import { ChevronsUpDown, Heart } from "lucide-react"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

export function Logo() {

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground font-bold font-almarai text-nowrap"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <Heart className="size-4" />
                            </div>
                            التأمين الصحي
                        </SidebarMenuButton>
                    
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
