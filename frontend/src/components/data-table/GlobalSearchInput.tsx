import * as React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
}

export function GlobalSearchInput({
  value: controlledValue,
  onChange,
  placeholder = "Search...",
  debounce = 300,
  className,
}: GlobalSearchInputProps) {
  const [localValue, setLocalValue] = React.useState(controlledValue);
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Sync local value with controlled value
  React.useEffect(() => {
    setLocalValue(controlledValue);
  }, [controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounce);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative w-full lg:max-w-sm", className)}>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
      <Input
        type='text'
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className='pl-9 pr-9 h-8'
      />
      {localValue && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent'
          onClick={handleClear}
        >
          <X className='h-3.5 w-3.5 text-muted-foreground hover:text-foreground' />
        </Button>
      )}
    </div>
  );
}
