import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareFilterButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ShareFilterButton({
  variant = "outline",
  size = "sm",
  className,
}: ShareFilterButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleCopyUrlWithoutFilters = async () => {
    try {
      const baseUrl = window.location.origin + window.location.pathname;
      await navigator.clipboard.writeText(baseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant={variant} size={size} className={className}>
                {copied ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Share2 className='h-4 w-4' />
                )}
                {size !== "icon" && (
                  <span className='ml-2 hidden sm:inline'>Share</span>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share filtered view</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align='end' className='w-[220px]'>
          <DropdownMenuLabel>Share Options</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleCopyUrl}>
            <Copy className='mr-2 h-4 w-4' />
            Copy current view
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyUrlWithoutFilters}>
            <Copy className='mr-2 h-4 w-4' />
            Copy without filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
