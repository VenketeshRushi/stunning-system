import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TabItem } from "@/interface/DynamicTabs";

interface DynamicTabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  tabClassName?: string;
  tabsListClassName?: string;
  tabsContentClassName?: string;
  onTabChange?: (tabId: string) => void;
}

export const DynamicTabs: React.FC<DynamicTabsProps> = ({
  tabs,
  defaultTabId,
  tabClassName,
  tabsListClassName,
  tabsContentClassName,
  onTabChange,
}) => {
  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <Tabs
      defaultValue={defaultTabId || tabs[0]?.id}
      className={cn("w-full flex flex-col group", tabClassName)}
      onValueChange={onTabChange}
    >
      <div className='w-full overflow-x-auto no-scrollbar pb-1'>
        <TabsList
          className={cn(
            "inline-flex justify-start h-auto p-1 flex-nowrap gap-1 flex-1 w-auto bg-muted/50 rounded-lg",
            tabsListClassName
          )}
        >
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              className={cn(
                // LAYOUT
                "shrink-0 px-4 py-2 rounded-md",

                // TYPOGRAPHY
                "text-sm font-medium text-muted-foreground",

                // MICRO-INTERACTIONS (The Smoothness)
                "transition-all duration-300 ease-in-out", // Smooth color/bg transition
                "hover:text-foreground", // Gentle hover state

                // ACTIVE STATE
                "data-[state=active]:bg-background",
                "data-[state=active]:text-foreground",
                "data-[state=active]:shadow-sm",

                // OPTIONAL: Subtle scale up on active for 'pop' effect
                // "data-[state=active]:scale-[1.02]",

                // ACCESSIBILITY
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map(tab => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className={cn(
            "mt-4 ring-offset-background focus-visible:outline-none",

            // ANIMATION: This triggers the keyframes when the tab mounts
            "animate-tab-in motion-reduce:animate-none",

            // FILL MODE: Ensures animation doesn't flicker
            "fill-mode-forwards",

            tabsContentClassName
          )}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
