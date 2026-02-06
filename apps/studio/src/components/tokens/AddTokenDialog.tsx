import type { DTCGTokenType } from "@clafoutis/studio-core";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AddTokenDialogProps {
  category: string;
  tokenFiles: string[];
  onAddToken: (
    path: string,
    type: string,
    value: unknown,
    filePath: string,
  ) => void;
}

const TOKEN_TYPES: DTCGTokenType[] = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "duration",
  "cubicBezier",
  "number",
  "strokeStyle",
  "border",
  "transition",
  "shadow",
  "gradient",
  "typography",
];

const CATEGORY_TYPE_MAP: Record<string, DTCGTokenType> = {
  colors: "color",
  typography: "typography",
  dimensions: "dimension",
  shadows: "shadow",
};

export default function AddTokenDialog({
  category,
  tokenFiles,
  onAddToken,
}: AddTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(`${category}.`);
  const [type, setType] = useState<DTCGTokenType>(
    CATEGORY_TYPE_MAP[category] || "color",
  );
  const [value, setValue] = useState("");
  const [filePath, setFilePath] = useState(() => {
    const matchingFile = tokenFiles.find((f) =>
      f.toLowerCase().includes(category.toLowerCase()),
    );
    return matchingFile || tokenFiles[0] || "";
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim() || !value.trim() || !filePath) return;

    onAddToken(path.trim(), type, value.trim(), filePath);
    setOpen(false);
    setPath(`${category}.`);
    setType(CATEGORY_TYPE_MAP[category] || "color");
    setValue("");
    setFilePath(
      tokenFiles.find((f) =>
        f.toLowerCase().includes(category.toLowerCase()),
      ) ||
        tokenFiles[0] ||
        "",
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1" />
          Add Token
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add New Token</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="token-path">Path</Label>
            <Input
              id="token-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder={`${category}.newToken`}
              required
            />
            <p className="mt-1 text-xs text-studio-text-muted">
              Token path (e.g., colors.primary.500)
            </p>
          </div>

          <div>
            <Label htmlFor="token-type">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as DTCGTokenType)}
            >
              <SelectTrigger id="token-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="token-value">Value</Label>
            <Input
              id="token-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                type === "color"
                  ? "#ff0000 or {colors.slate.100}"
                  : type === "dimension"
                    ? "16px"
                    : "Enter value"
              }
              required
            />
            <p className="mt-1 text-xs text-studio-text-muted">
              Initial token value or reference
            </p>
          </div>

          <div>
            <Label htmlFor="token-file">File</Label>
            <Select value={filePath} onValueChange={setFilePath}>
              <SelectTrigger id="token-file">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokenFiles.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-studio-text-muted">
              Token file to add this token to
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!path.trim() || !value.trim() || !filePath}
            >
              Add Token
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
