import { StorefrontLogo } from "@repo/brand";
import DesktopHeaderActions from "@/components/PLP/Header/DesktopActions";
import PLPDesktopSearch from "@/components/Search/PLPDesktopSearch";
import { StorefrontContainer } from "@/components/storefront";

/**
 * Desktop storefront header row — Figma `header` / `desktop-model2` (10151:23342).
 * RTL grid: actions on the right (start), logo center, search on the left (end).
 */
export default function PLPDesktopHeaderTopBar() {
  return (
    <div className="py-3">
      <StorefrontContainer>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="justify-self-start">
            <DesktopHeaderActions />
          </div>
          <div className="justify-self-center">
            <StorefrontLogo width={92} height={58} />
          </div>
          <div className="flex items-center justify-self-end">
            <PLPDesktopSearch />
          </div>
        </div>
      </StorefrontContainer>
    </div>
  );
}
