import type { ResolvedToken } from "@clafoutis/studio-core";
import { Link } from "@tanstack/react-router";
import { Palette, Ruler, Sparkles, Type } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const categories = [
  {
    id: "colors",
    label: "Colors",
    icon: Palette,
    description: "Color primitives, semantics, and component colors",
  },
  {
    id: "typography",
    label: "Typography",
    icon: Type,
    description: "Font families, weights, and sizes",
  },
  {
    id: "dimensions",
    label: "Dimensions",
    icon: Ruler,
    description: "Spacing, border radius, and sizing",
  },
  {
    id: "shadows",
    label: "Shadows",
    icon: Sparkles,
    description: "Box shadows and elevation tokens",
  },
];

interface TokenCatalogViewProps {
  projectId: string;
  tokens: ResolvedToken[];
  categoryCounts: Record<string, number>;
}

const TokenCatalogView = ({
  projectId,
  tokens,
  categoryCounts,
}: TokenCatalogViewProps) => (
  <div className="space-y-6 overflow-y-auto p-6">
    <h1 className="text-2xl font-bold text-studio-text">Design Tokens</h1>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categories.map(({ id, label, icon: Icon, description }) => (
        <Link
          key={id}
          to="/projects/$projectId/tokens/$category"
          params={{ projectId, category: id }}
        >
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon size={18} className="text-studio-accent" />
                {label}
                <span className="ml-auto text-sm font-normal text-studio-text-muted">
                  {categoryCounts[id] ?? 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>{description}</CardContent>
          </Card>
        </Link>
      ))}
    </div>

    <p className="text-sm text-studio-text-muted">
      Total tokens: {tokens.length}
    </p>
  </div>
);

export default TokenCatalogView;
