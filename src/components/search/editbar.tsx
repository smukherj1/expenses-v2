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

const opAddTags = "Add";
const opRemoveTags = "Remove";
const opClearTags = "Clear";
const tagOpSelection = [opAddTags, opRemoveTags, opClearTags];

export type Props = {
  txnIDs: string[];
  className?: string;
};

export default function EditBar({ txnIDs, className }: Props) {
  const [op, setOp] = React.useState<string>(opAddTags);
  const [tags, setTags] = React.useState<string>("");

  React.useEffect(() => {
    if (op === opClearTags) {
      setTags("");
    }
  }, [op]);

  const onEdit = () => {
    console.log(
      `Editing ${txnIDs.length} transactions with op=${op}, tags=${tags}`
    );
  };

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-4 p-4 rounded-xl bg-card shadow-xl",
        className
      )}
    >
      <Label className="text-lg mx-4 gap-4">
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
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma-separated tags"
            disabled={op === opClearTags}
            className="w-[240px]"
          />
        </div>
        <Button onClick={onEdit}>Edit</Button>
      </div>
    </div>
  );
}
