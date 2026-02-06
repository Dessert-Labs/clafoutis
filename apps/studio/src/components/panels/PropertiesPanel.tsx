import type { DesignNode, SceneNode } from "@clafoutis/studio-core";

import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface PropertiesPanelProps {
  selectedNode: DesignNode | null;
  onUpdateProp: (id: string, key: string, value: unknown) => void;
}

export function PropertiesPanel({
  selectedNode,
  onUpdateProp,
}: Readonly<PropertiesPanelProps>) {
  if (!selectedNode) {
    return (
      <div className="p-4 text-center text-sm text-studio-text-muted">
        Select a layer to view properties
      </div>
    );
  }

  const scene = selectedNode as SceneNode;

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label className="text-xs text-studio-text-muted">Name</Label>
        <Input
          value={scene.name}
          onChange={(e) =>
            onUpdateProp(selectedNode.id, "name", e.target.value)
          }
          className="mt-1 h-8 text-xs"
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-studio-text-muted">X</Label>
          <Input
            type="number"
            value={Math.round(scene.x)}
            onChange={(e) =>
              onUpdateProp(selectedNode.id, "x", Number(e.target.value))
            }
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-studio-text-muted">Y</Label>
          <Input
            type="number"
            value={Math.round(scene.y)}
            onChange={(e) =>
              onUpdateProp(selectedNode.id, "y", Number(e.target.value))
            }
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-studio-text-muted">W</Label>
          <Input
            type="number"
            value={Math.round(scene.width)}
            onChange={(e) =>
              onUpdateProp(selectedNode.id, "width", Number(e.target.value))
            }
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-studio-text-muted">H</Label>
          <Input
            type="number"
            value={Math.round(scene.height)}
            onChange={(e) =>
              onUpdateProp(selectedNode.id, "height", Number(e.target.value))
            }
            className="mt-1 h-8 text-xs"
          />
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-xs text-studio-text-muted">Rotation</Label>
        <Input
          type="number"
          value={Math.round(scene.rotation)}
          onChange={(e) =>
            onUpdateProp(selectedNode.id, "rotation", Number(e.target.value))
          }
          className="mt-1 h-8 text-xs"
        />
      </div>

      <div>
        <Label className="text-xs text-studio-text-muted">Opacity</Label>
        <Input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={scene.opacity}
          onChange={(e) =>
            onUpdateProp(selectedNode.id, "opacity", Number(e.target.value))
          }
          className="mt-1 h-8 text-xs"
        />
      </div>

      <div>
        <Label className="text-xs text-studio-text-muted">Corner Radius</Label>
        <Input
          type="number"
          min={0}
          value={scene.cornerRadius}
          onChange={(e) =>
            onUpdateProp(
              selectedNode.id,
              "cornerRadius",
              Number(e.target.value),
            )
          }
          className="mt-1 h-8 text-xs"
        />
      </div>
    </div>
  );
}
