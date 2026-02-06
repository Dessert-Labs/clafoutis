import type { ResolvedToken } from "@clafoutis/studio-core";
import { useCallback, useState } from "react";

import { AccordionPreview } from "../preview/AccordionPreview";
import { AlertPreview } from "../preview/AlertPreview";
import { AvatarPreview } from "../preview/AvatarPreview";
import { BadgePreview } from "../preview/BadgePreview";
import { ButtonPreview } from "../preview/ButtonPreview";
import { CardPreview } from "../preview/CardPreview";
import { ColorPalettePreview } from "../preview/ColorPalettePreview";
import { DialogPreview } from "../preview/DialogPreview";
import { DropdownPreview } from "../preview/DropdownPreview";
import { FormPreview } from "../preview/FormPreview";
import { PaginationPreview } from "../preview/PaginationPreview";
import { ProgressPreview } from "../preview/ProgressPreview";
import { SkeletonPreview } from "../preview/SkeletonPreview";
import { SliderPreview } from "../preview/SliderPreview";
import { SpacingPreview } from "../preview/SpacingPreview";
import { TablePreview } from "../preview/TablePreview";
import { TabsPreview } from "../preview/TabsPreview";
import { ToastPreview } from "../preview/ToastPreview";
import { ToggleSwitchPreview } from "../preview/ToggleSwitchPreview";
import { TooltipPopoverPreview } from "../preview/TooltipPopoverPreview";
import { TypographyPreview } from "../preview/TypographyPreview";
import { Button } from "../ui/button";

/* ------------------------------------------------------------------ */
/*  Sidebar navigation structure                                       */
/* ------------------------------------------------------------------ */

interface NavItem {
  id: string;
  label: string;
}

interface NavCategory {
  label: string;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    label: "Foundation",
    items: [
      { id: "colors", label: "Color Palettes" },
      { id: "typography", label: "Typography" },
      { id: "spacing", label: "Spacing" },
    ],
  },
  {
    label: "Forms",
    items: [
      { id: "buttons", label: "Buttons" },
      { id: "inputs", label: "Inputs" },
      { id: "toggle-switch", label: "Toggle & Switch" },
      { id: "slider", label: "Slider" },
    ],
  },
  {
    label: "Data Display",
    items: [
      { id: "table", label: "Table" },
      { id: "badges", label: "Badges" },
      { id: "cards", label: "Cards" },
      { id: "avatar", label: "Avatar" },
      { id: "skeleton", label: "Skeleton" },
      { id: "accordion", label: "Accordion" },
    ],
  },
  {
    label: "Feedback",
    items: [
      { id: "alerts", label: "Alerts" },
      { id: "toast", label: "Toast" },
      { id: "progress", label: "Progress" },
      { id: "tooltip-popover", label: "Tooltip & Popover" },
      { id: "dialog", label: "Dialog" },
      { id: "dropdown", label: "Dropdown" },
    ],
  },
  {
    label: "Navigation",
    items: [
      { id: "tabs", label: "Tabs" },
      { id: "pagination", label: "Pagination" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface ComponentsPreviewViewProps {
  darkMode: boolean;
  colorTokens: ResolvedToken[];
  onToggleDarkMode: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const ComponentsPreviewView = ({
  darkMode,
  colorTokens,
  onToggleDarkMode,
}: ComponentsPreviewViewProps) => {
  // Sidebar selection
  const [activeItem, setActiveItem] = useState("colors");

  // Interactive component state (container owns all state)
  const [toggleBold, setToggleBold] = useState(false);
  const [toggleItalic, setToggleItalic] = useState(false);
  const [switchNotifications, setSwitchNotifications] = useState(true);
  const [switchDarkMode, setSwitchDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sliderVolume, setSliderVolume] = useState(75);
  const [sliderBrightness, setSliderBrightness] = useState(50);
  const [accordionOpen, setAccordionOpen] = useState<Set<number>>(new Set([0]));
  const [currentPage, setCurrentPage] = useState(3);

  const handleAccordionToggle = useCallback((index: number) => {
    setAccordionOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Map item id to rendered preview
  function renderContent() {
    switch (activeItem) {
      case "colors":
        return <ColorPalettePreview tokens={colorTokens} />;
      case "typography":
        return <TypographyPreview />;
      case "spacing":
        return <SpacingPreview />;
      case "buttons":
        return <ButtonPreview />;
      case "inputs":
        return <FormPreview />;
      case "toggle-switch":
        return (
          <ToggleSwitchPreview
            toggleBold={toggleBold}
            onToggleBoldChange={setToggleBold}
            toggleItalic={toggleItalic}
            onToggleItalicChange={setToggleItalic}
            switchNotifications={switchNotifications}
            onSwitchNotificationsChange={setSwitchNotifications}
            switchDarkMode={switchDarkMode}
            onSwitchDarkModeChange={setSwitchDarkMode}
          />
        );
      case "slider":
        return (
          <SliderPreview
            volume={sliderVolume}
            onVolumeChange={setSliderVolume}
            brightness={sliderBrightness}
            onBrightnessChange={setSliderBrightness}
          />
        );
      case "table":
        return <TablePreview />;
      case "badges":
        return <BadgePreview />;
      case "cards":
        return <CardPreview />;
      case "avatar":
        return <AvatarPreview />;
      case "skeleton":
        return <SkeletonPreview />;
      case "accordion":
        return (
          <AccordionPreview
            openItems={accordionOpen}
            onToggleItem={handleAccordionToggle}
          />
        );
      case "alerts":
        return <AlertPreview />;
      case "toast":
        return <ToastPreview />;
      case "progress":
        return <ProgressPreview />;
      case "tooltip-popover":
        return (
          <TooltipPopoverPreview
            popoverOpen={popoverOpen}
            onPopoverOpenChange={setPopoverOpen}
          />
        );
      case "dialog":
        return <DialogPreview open={dialogOpen} onOpenChange={setDialogOpen} />;
      case "dropdown":
        return (
          <DropdownPreview open={dropdownOpen} onOpenChange={setDropdownOpen} />
        );
      case "tabs":
        return <TabsPreview activeTab={activeTab} onTabChange={setActiveTab} />;
      case "pagination":
        return (
          <PaginationPreview
            currentPage={currentPage}
            totalPages={7}
            onPageChange={setCurrentPage}
          />
        );
      default:
        return null;
    }
  }

  const activeLabel =
    navCategories.flatMap((c) => c.items).find((i) => i.id === activeItem)
      ?.label ?? "";

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-studio-border px-6 py-4">
        <h1 className="text-xl font-bold text-studio-text">
          Design System Preview
        </h1>
        <Button variant="outline" size="sm" onClick={onToggleDarkMode}>
          {darkMode ? "Light" : "Dark"} Mode
        </Button>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <nav className="w-52 shrink-0 overflow-y-auto border-r border-studio-border bg-studio-sidebar px-3 py-4">
          {navCategories.map((category) => (
            <div key={category.label} className="mb-4">
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-studio-text-muted">
                {category.label}
              </p>
              {category.items.map((item) => (
                <button
                  key={item.id}
                  className={`block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    activeItem === item.id
                      ? "bg-studio-accent/10 font-medium text-studio-accent"
                      : "text-studio-text-secondary hover:bg-studio-hover hover:text-studio-text"
                  }`}
                  onClick={() => setActiveItem(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Content panel */}
        <div className="flex-1 overflow-y-auto">
          <div
            id="studio-preview-root"
            className={darkMode ? "dark" : ""}
            style={{
              backgroundColor: "rgb(var(--colors-background-secondary))",
              color: "rgb(var(--colors-text-primary))",
              minHeight: "100%",
            }}
          >
            <div className="px-8 py-6">
              <h2
                className="mb-6 text-2xl font-semibold"
                style={{ color: "rgb(var(--colors-text-primary))" }}
              >
                {activeLabel}
              </h2>
              <div
                className="rounded-lg border p-6"
                style={{
                  backgroundColor: "rgb(var(--colors-surface-primary))",
                  borderColor: "rgb(var(--colors-border-primary))",
                }}
              >
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentsPreviewView;
