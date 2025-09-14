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
        "flex flex-col items-center justify-center gap-4 p-4 rounded-xl bg-card shadow-xl",
        className
      )}
    >
      <Label className="text-lg mx-4 gap-4">
        Edit tags for {txnIDs.length} selected transaction(s)
      </Label>
      <div className="flex flex-row items-center gap-2">
        <Select onValueChange={(v) => setOp(v)} defaultValue={op}>
          <SelectTrigger className="w-[120px]">
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
        <Input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="comma-separated tags"
          disabled={op === opClearTags}
          className="w-[240px]"
        />
        <Button onClick={onEdit}>Edit</Button>
      </div>
    </div>
  );
}
