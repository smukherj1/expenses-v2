import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface Props {
  values: (string | null)[];
  onSelectionChanged?: (values: (string | null)[]) => void;
  placeholder?: string;
}

function removeNull(s: string | null): string {
  return s === null ? "<unspecified>" : s;
}

export default function CheckableSelect({
  values,
  onSelectionChanged,
  placeholder = "Select values",
}: Props) {
  const [selectedValues, setSelectedValues] =
    React.useState<(string | null)[]>(values);

  React.useEffect(() => {
    setSelectedValues(values);
  }, [values]);

  React.useEffect(() => {
    if (onSelectionChanged) {
      onSelectionChanged(selectedValues);
    }
  }, [selectedValues, onSelectionChanged]);

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedValues(values);
  };

  const handleSelectNone = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedValues([]);
  };

  const toggleSelection = (value: string | null) => {
    setSelectedValues((prev) => {
      const newValues = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
      return newValues.sort();
    });
  };

  const getDisplayValue = () => {
    if (selectedValues.length === values.length) {
      return "All selected";
    }
    if (selectedValues.length === 0) {
      return "None selected";
    }
    return `${selectedValues.length} of ${values.length} selected`;
  };

  return (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder={`${placeholder}: ${getDisplayValue()}`} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 flex justify-between">
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSelectNone}>
            Select None
          </Button>
        </div>
        <SelectGroup>
          {values.map((value) => (
            <SelectItem
              key={removeNull(value)}
              value={removeNull(value)}
              onSelect={(e) => {
                e.preventDefault();
                toggleSelection(value);
              }}
              className="focus:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedValues.includes(value)}
                  // The checkbox is controlled by the selection state
                />
                <span>{value}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
