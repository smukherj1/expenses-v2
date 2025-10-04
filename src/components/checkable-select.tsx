import * as React from "react";
import Select, {
  components,
  MenuProps,
  MultiValue,
  OptionProps,
} from "react-select";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  id: string;
  values: (string | null)[];
  onSelectionChanged?: (values: (string | null)[]) => void;
  placeholder?: string;
}

function removeNull(s: string | null): string {
  return s === null ? "<unspecified>" : s;
}

type OptionType = { value: string | null; label: string };

export default function CheckableSelect({
  values,
  onSelectionChanged,
  placeholder = "Select values",
  id: instanceId,
}: Props) {
  const options = React.useMemo(
    () => values.map((v) => ({ value: v, label: removeNull(v) })),
    [values]
  );

  const [selectedOptions, setSelectedOptions] =
    React.useState<MultiValue<OptionType>>(options);

  React.useEffect(() => {
    setSelectedOptions(options);
  }, [options]);

  React.useEffect(() => {
    if (onSelectionChanged) {
      onSelectionChanged(selectedOptions.map((o) => o.value));
    }
  }, [selectedOptions, onSelectionChanged]);

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedOptions(options);
  };

  const handleSelectNone = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedOptions([]);
  };

  const CustomOption = (props: OptionProps<OptionType, true>) => {
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={props.isSelected}
            // The checkbox is controlled by the selection state
          />
          <span>{props.label}</span>
        </div>
      </components.Option>
    );
  };

  const CustomMenu = (props: MenuProps<OptionType, true>) => {
    return (
      <components.Menu {...props}>
        <div>
          <div className="p-2 flex justify-between">
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSelectNone}>
              Select None
            </Button>
          </div>
          {props.children}
        </div>
      </components.Menu>
    );
  };

  const getDisplayValue = () => {
    if (selectedOptions.length === options.length) {
      return "All selected";
    }
    if (selectedOptions.length === 0) {
      return "None selected";
    }
    return `${selectedOptions.length} of ${options.length} selected`;
  };

  return (
    <div className="w-[280px]">
      <Select
        options={options}
        isMulti
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        value={selectedOptions}
        onChange={setSelectedOptions}
        components={{
          Option: CustomOption,
          Menu: CustomMenu,
        }}
        controlShouldRenderValue={false}
        placeholder={`${placeholder}: ${getDisplayValue()}`}
        instanceId={instanceId}
      />
    </div>
  );
}
