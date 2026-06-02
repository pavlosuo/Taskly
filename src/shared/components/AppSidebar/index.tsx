import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar className="p-2 border-none">
      <div className="grid grid-cols-[100%] grid-rows-[max-content_1fr_max-content] p-2 bg-primary/75 w-full h-full rounded-xl">
        <Link href="/" className="flex items-center justify-center">
          <Image src="/assets/logo.png" alt="Logo Taskly" width={180} height={60} />
        </Link>
        <nav>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </nav>
        <div>user</div>
      </div>
    </Sidebar>
  );
}

export const SidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 flex flex-col p-2">
          <header>
            <SidebarTrigger />
            <span>My Profile</span>
          </header>
          {children}
        </div>
      </SidebarProvider>
  );
};
