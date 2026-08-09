// import LanguageSwitcher from '@/components/language-switcher'
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// import { Badge } from '@/components/ui/badge'
// import { Input } from '@/components/ui/input'
// import { Separator } from '@/components/ui/separator'
// import { SidebarTrigger } from '@/components/ui/sidebar'
// import { getInitials } from '@/lib/utils'
// import { Bell, SearchIcon } from 'lucide-react'

// export default function AppHeader() {
//   return (
//     <header className="flex justify-between border-b h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 px-4">

//       <div className="flex items-center gap-2">
//         <SidebarTrigger className="-ml-1" />
//         <Separator
//           orientation="vertical"
//           className="mr-2 data-[orientation=vertical]:h-4 my-auto"
//         />
//       </div>
//       {/* search */}
//       <div className="relative">
//         <Input
//           className="peer ps-8 pe-2"

//           placeholder="Search..."
//           type="search"
//         />
//         <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/80 peer-disabled:opacity-50">
//           <SearchIcon size={16} />
//         </div>
//       </div>


//       {/* user, notifications, lang */}
//       <div className="flex items-center gap-2">
//         <div className="relative">
//           <Bell />
//           <Badge className="-top-1.5 -translate-x-3.5 absolute left-full min-w-5 border-background px-1 bg-red-600">
//             6
//           </Badge>
//         </div>
//         <LanguageSwitcher className="bg-transparent " size="default" />
//         <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
//           <Avatar className="size-8 rounded-lg">
//             <AvatarImage src={"https://i.pravatar.cc/300"} alt={"Fady emad"} />
//             <AvatarFallback className="rounded-lg">
//               {getInitials("Fady emad")}
//             </AvatarFallback>
//           </Avatar>
//           {/* <div className="grid flex-1 text-left text-sm leading-tight">
//             <span className="truncate font-medium">{"Fady emad"}</span>
//             <span className="truncate text-xs">{"fady.emad@example.com"}</span>
//           </div> */}
//         </div>
//       </div>
//     </header>
//   )
// }

import LanguageSwitcher from '@/components/language-switcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { getInitials } from '@/lib/utils'
import { Bell, SearchIcon } from 'lucide-react'

export default function AppHeader() {
  return (
    <header className="relative flex justify-between border-b h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 px-4">
      
      <div className="flex items-center gap-2 flex-1 lg:flex-none">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 my-auto"
        />
        
        {/* Search */}
        <div className="relative flex-1 lg:absolute lg:left-1/2 lg:-translate-x-1/2  max-w-[230px]">
          <Input
            className="peer ps-8 pe-2 w-full"
            placeholder="Search..."
            type="search"
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/80 peer-disabled:opacity-50">
            <SearchIcon size={16} />
          </div>
        </div>
      </div>

      {/* user, notifications, lang */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <Bell className="size-4" />
          <Badge className="-top-3 -translate-x-2.5 absolute left-full min-w-5 border-background px-1 bg-red-600">
            1
          </Badge>
          {/* <Badge className="-top-1.5 -translate-x-2 absolute left-full min-w-4 border-background px-1 bg-red-600">
            1
          </Badge> */}
        </div>
        <LanguageSwitcher className="bg-transparent" size="default" />
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={"https://i.pravatar.cc/300"} alt={"Fady emad"} />
            <AvatarFallback className="rounded-lg">
              {getInitials("Fady emad")}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}