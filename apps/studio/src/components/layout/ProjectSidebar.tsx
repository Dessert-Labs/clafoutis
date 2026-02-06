import { Link } from "@tanstack/react-router";
import { LayoutGrid, Paintbrush, Palette, Upload } from "lucide-react";

interface ProjectSidebarProps {
  projectId: string;
}

export function ProjectSidebar({ projectId }: Readonly<ProjectSidebarProps>) {
  const base = `/projects/${projectId}`;

  const links = [
    { to: `${base}/canvas`, label: "Canvas", icon: Paintbrush },
    { to: `${base}/components`, label: "Components", icon: LayoutGrid },
    { to: `${base}/tokens`, label: "Tokens", icon: Palette },
    { to: `${base}/publish`, label: "Publish", icon: Upload },
  ];

  return (
    <nav className="flex w-52 flex-col border-r border-studio-border bg-studio-bg-secondary p-3">
      <div className="mb-4 px-2 text-xs font-medium uppercase tracking-wider text-studio-text-muted">
        Project
      </div>
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-studio-text-secondary hover:bg-studio-bg-tertiary hover:text-studio-text"
          activeProps={{
            className: "bg-studio-bg-tertiary text-studio-text font-medium",
          }}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
