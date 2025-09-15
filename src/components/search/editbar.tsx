import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const opSetTag = "Set";
const opClearTag = "Clear";
const tagOpSelection = [opSetTag, opClearTag];

export type Props = {
  txnIDs: string[];
  className?: string;
};

const opToPlaceholder = (op: string) => {
  if (op === opSetTag) {
    return "Enter tag to set";
  }
  return "";
};

const opToButtonLabel = (op: string) => {
  if (op === opSetTag) {
    return "Set";
  } else if (op === opClearTag) {
    return "Clear";
  }
  return "Edit";
};

export default function EditBar({ txnIDs, className }: Props) {
  const [op, setOp] = React.useState<string>(opSetTag);
  const [tag, setTag] = React.useState<string>("");

  React.useEffect(() => {
    if (op === opClearTag && tag.length > 0) {
      setTag("");
    }
  }, [op]);

  const onEdit = () => {
    console.log(
      `Editing ${txnIDs.length} transactions with op=${op}, tag=${tag}`
    );
    toast.error("rekt");
  };

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-4 p-4 rounded-xl bg-card shadow-xl",
        className
      )}
    >
      <Label className="text-lg mx-4 gap-4 w-[260px]">
        Edit tags for {txnIDs.length} transaction(s)
      </Label>
      <div className="flex flex-1 flex-row items-end justify-center gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tag-op">Operation</Label>
          <Select onValueChange={(v) => setOp(v)} defaultValue={op}>
            <SelectTrigger className="w-[120px]" id="tag-op">
              <SelectValue placeholder="Select op" />
            </SelectTrigger>
            <SelectContent>
              {tagOpSelection.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder={opToPlaceholder(op)}
            disabled={op === opClearTag}
            className="w-[240px]"
          />
        </div>
        <Button
          className="w-[66px]"
          disabled={op === opSetTag && tag.length === 0}
          variant={op === opClearTag ? "destructive" : "default"}
          onClick={onEdit}
        >
          {opToButtonLabel(op)}
        </Button>
      </div>
    </div>
  );
}
