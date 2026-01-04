import {
  BrainCircuit as IconBrainCircuit,
  ArrowUp as IconArrowUp,
  Paperclip as IconPaperclip,
  Plus as IconPlus,
  Globe as IconWorld,
  X as IconX,
  AtSign as IconAt,
  Settings as IconSettings,
  SlidersHorizontal as IconSlidersHorizontal,
  PenTool,
  ChevronDown as IconChevronDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { MODELS, STYLES, DATASET_TYPE_ORDER } from "@/constants/chat";
import type {
  Dataset,
  DatasetType,
  ChatInputProps,
  ChatInputData,
} from "@/types/chat.types";

function getTypeHeading(type: DatasetType): string {
  if (type === "md") return "MARKDOWN Files";
  return `${type.toUpperCase()} Files`;
}

function DatasetIcon({
  item,
  className,
}: {
  item: Dataset;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden>
      {item.image ?? <IconPaperclip className='h-4 w-4' />}
    </span>
  );
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  settings,
  onSettingsChange,
  availableDatasets,
  onAttachFile,
  disabled = false,
  isLoading = false,
  stopGenerating,
}: ChatInputProps) {
  const canSubmit = value.trim().length > 0 && !disabled && !isLoading;
  const hasDatasets = settings.datasets.length > 0;

  // Keep useMemo only for expensive computations
  // This is a simple filter, so React Compiler handles it, but keeping for clarity
  const filteredDatasets = availableDatasets.filter(
    d => !settings.datasets.some(s => s.title === d.title)
  );

  // React Compiler handles memoization automatically - no useCallback needed
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const data: ChatInputData = {
      message: value,
      model: settings.model,
      datasets: settings.datasets,
      style: settings.style,
      webSearch: settings.webSearch,
      extendedThinking: settings.extendedThinking,
    };

    onSubmit(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) handleSubmit(e);
    }
  };

  const addDataset = (dataset: Dataset) => {
    onSettingsChange({ datasets: [...settings.datasets, dataset] });
  };

  const removeDataset = (title: string) => {
    onSettingsChange({
      datasets: settings.datasets.filter(d => d.title !== title),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='lg:p-4 flex-1 bg-background [--radius:1.2rem]'
    >
      <Field>
        <FieldLabel htmlFor='chat-prompt' className='sr-only'>
          Prompt
        </FieldLabel>
        <InputGroup className='bg-background dark:bg-background shadow-none'>
          <InputGroupTextarea
            id='chat-prompt'
            placeholder='Ask, search, or make anything...'
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            className='min-h-11 max-h-40 text-base sm:text-sm'
          />

          {/* Top addon: Dataset context */}
          <InputGroupAddon
            align='block-start'
            className='flex-wrap gap-1.5 sm:gap-1'
          >
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <InputGroupButton
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-9 min-w-11 rounded-full transition-transform sm:h-8'
                      disabled={disabled || isLoading}
                    >
                      <IconAt className='h-4 w-4' />
                      <span className={hasDatasets ? "sr-only" : "xs:inline"}>
                        Add context
                      </span>
                    </InputGroupButton>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Add a dataset for context</TooltipContent>
              </Tooltip>

              <PopoverContent
                className='w-[calc(100vw-2rem)] max-w-sm p-0 [--radius:1.2rem] sm:w-80'
                align='start'
              >
                <Command>
                  <CommandInput placeholder='Search datasets...' />
                  <CommandList className='max-h-[50vh] sm:max-h-[300px]'>
                    <CommandEmpty>No datasets found</CommandEmpty>
                    {DATASET_TYPE_ORDER.map(type => {
                      const items = filteredDatasets.filter(
                        d => d.type === type
                      );
                      if (!items.length) return null;

                      return (
                        <CommandGroup key={type} heading={getTypeHeading(type)}>
                          {items.map(item => (
                            <CommandItem
                              key={item.title}
                              value={item.title}
                              onSelect={() => addDataset(item)}
                              className='min-h-11 sm:min-h-0'
                            >
                              <div className='flex items-center gap-2'>
                                <DatasetIcon
                                  item={item}
                                  className='text-sm leading-4'
                                />
                                <span>{item.title}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      );
                    })}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected datasets */}
            {hasDatasets && (
              <div className='no-scrollbar flex max-w-full flex-1 gap-1.5 overflow-x-auto sm:flex-wrap sm:gap-1'>
                {settings.datasets.map(dataset => (
                  <InputGroupButton
                    key={dataset.title}
                    type='button'
                    size='sm'
                    variant='secondary'
                    className='h-9 shrink-0 rounded-full pl-2 pr-2 sm:h-8 sm:pr-1.5'
                    onClick={() => removeDataset(dataset.title)}
                    disabled={disabled || isLoading}
                  >
                    <DatasetIcon item={dataset} className='text-sm' />
                    <span className='max-w-[120px] truncate sm:max-w-[150px]'>
                      {dataset.title}
                    </span>
                    <IconX className='h-3 w-3 shrink-0' />
                  </InputGroupButton>
                ))}
              </div>
            )}
          </InputGroupAddon>

          {/* Bottom addon: Actions */}
          <InputGroupAddon align='block-end' className='gap-1 sm:gap-1.5'>
            {/* Attach file */}
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  type='button'
                  size='icon-sm'
                  className='h-9 w-9 shrink-0 rounded-full sm:h-8 sm:w-8'
                  aria-label='Attach file'
                  disabled={disabled || isLoading}
                  onClick={onAttachFile}
                >
                  <IconPaperclip className='h-4 w-4' />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>

            {/* Model selector */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton
                      type='button'
                      size='sm'
                      className='h-9 shrink-0 rounded-full px-2 sm:h-8 sm:px-3'
                      disabled={disabled || isLoading}
                    >
                      {settings.model.name !== "Auto" && (
                        <settings.model.icon className='h-4 w-4' />
                      )}
                      <span className='hidden sm:inline'>
                        {settings.model.name}
                      </span>
                      <span className='sm:hidden'>
                        {settings.model.name === "Auto"
                          ? "Auto"
                          : settings.model.name.split(" ")[0]}
                      </span>
                      <IconChevronDown className='h-3 w-3 opacity-50' />
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Select AI model</TooltipContent>
              </Tooltip>

              <DropdownMenuContent
                side='top'
                align='start'
                className='w-[calc(100vw-2rem)] max-w-[280px] [--radius:1.2rem] sm:w-72'
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='text-muted-foreground text-xs'>
                    Select AI model
                  </DropdownMenuLabel>
                  {MODELS.map(model => (
                    <DropdownMenuCheckboxItem
                      key={model.name}
                      checked={model.name === settings.model.name}
                      onCheckedChange={checked => {
                        if (checked) {
                          onSettingsChange({ model });
                        }
                      }}
                      className='min-h-11 pl-2 sm:min-h-0 *:[span:first-child]:right-2 *:[span:first-child]:left-auto'
                    >
                      <model.icon className='h-4 w-4' />
                      {model.name}
                      {model.badge && (
                        <Badge
                          variant='secondary'
                          className='h-5 rounded-sm bg-blue-100 px-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        >
                          {model.badge}
                        </Badge>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton
                      type='button'
                      size='sm'
                      className='h-9 shrink-0 rounded-full px-2 sm:h-8 sm:px-3'
                      disabled={disabled || isLoading}
                    >
                      <IconSlidersHorizontal className='h-4 w-4' />
                      <span className='hidden md:inline'>Settings</span>
                      <IconChevronDown className='hidden h-3 w-3 opacity-50 sm:inline' />
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent className='sm:hidden'>Settings</TooltipContent>
              </Tooltip>

              <DropdownMenuContent
                side='top'
                align='end'
                className='w-[calc(100vw-2rem)] max-w-[280px] [--radius:1.2rem] sm:w-72'
              >
                {/* Style selector */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className='flex min-h-11 flex-1 items-center gap-2 sm:min-h-0'>
                    <PenTool className='mr-2 h-4 w-4' />
                    Use Style
                    {settings.style && (
                      <span className='ml-auto text-xs font-medium'>
                        {settings.style.name}
                      </span>
                    )}
                  </DropdownMenuSubTrigger>

                  <DropdownMenuSubContent className='w-[calc(100vw-2rem)] max-w-[280px] p-0 [--radius:1.2rem] sm:w-72'>
                    <Command>
                      <CommandInput placeholder='Find or use styles...' />
                      <CommandList className='max-h-[40vh] sm:max-h-[200px]'>
                        <CommandEmpty>No styles found</CommandEmpty>
                        <CommandGroup heading='Styles'>
                          {STYLES.map(style => {
                            const isActive =
                              settings.style?.name === style.name;
                            return (
                              <CommandItem
                                key={style.name}
                                value={style.name}
                                onSelect={() => onSettingsChange({ style })}
                                className='flex min-h-11 items-center gap-2 sm:min-h-0'
                              >
                                <span className='flex-1 text-sm font-medium'>
                                  {style.name}
                                </span>
                                {style.badge && (
                                  <Badge
                                    variant='secondary'
                                    className='rounded-sm text-xs'
                                  >
                                    {style.badge}
                                  </Badge>
                                )}
                                {isActive && (
                                  <Badge
                                    variant='secondary'
                                    className='rounded-sm text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                  >
                                    Active
                                  </Badge>
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* Toggles */}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    asChild
                    onSelect={e => e.preventDefault()}
                    className='min-h-11 sm:min-h-0'
                  >
                    <label
                      htmlFor='web-search'
                      className='flex w-full cursor-pointer items-center'
                    >
                      <IconWorld className='mr-2 h-4 w-4 shrink-0' />
                      <span className='flex-1'>Web Search</span>
                      <Switch
                        id='web-search'
                        checked={settings.webSearch}
                        onCheckedChange={webSearch =>
                          onSettingsChange({ webSearch })
                        }
                      />
                    </label>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    asChild
                    onSelect={e => e.preventDefault()}
                    className='min-h-11 sm:min-h-0'
                  >
                    <label
                      htmlFor='extended-thinking'
                      className='flex w-full cursor-pointer items-center'
                    >
                      <IconBrainCircuit className='mr-2 h-4 w-4 shrink-0' />
                      <span className='flex-1'>Extended thinking</span>
                      <Switch
                        id='extended-thinking'
                        checked={settings.extendedThinking}
                        onCheckedChange={extendedThinking =>
                          onSettingsChange({ extendedThinking })
                        }
                      />
                    </label>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Connectors */}
                <DropdownMenuGroup>
                  <DropdownMenuItem className='min-h-11 sm:min-h-0'>
                    <IconSettings className='mr-2 h-4 w-4' />
                    <span className='flex-1'>Manage connectors</span>
                    <Badge
                      variant='outline'
                      className='h-4 shrink-0 rounded-2xl border-0 bg-[#2c84db]/8 px-2 text-[0.5625rem] font-medium uppercase text-[#2c84db]'
                    >
                      pro
                    </Badge>
                  </DropdownMenuItem>

                  <DropdownMenuItem className='min-h-11 sm:min-h-0'>
                    <IconPlus className='mr-2 h-4 w-4' />
                    <span className='flex-1'>Add connectors</span>
                    <Badge
                      variant='outline'
                      className='h-4 shrink-0 rounded-2xl border-0 bg-[#2c84db]/8 px-2 text-[0.5625rem] font-medium uppercase text-[#2c84db]'
                    >
                      pro
                    </Badge>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className='text-muted-foreground text-xs'>
                  Settings apply to this conversation.
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  type='submit'
                  aria-label={isLoading ? "Stop generation" : "Send message"}
                  className='ml-auto h-9 w-9 shrink-0 rounded-full sm:h-8 sm:w-8'
                  variant='default'
                  size='icon-sm'
                  disabled={!canSubmit && !isLoading}
                  onClick={e => {
                    if (isLoading) {
                      e.preventDefault();
                      stopGenerating?.();
                    }
                  }}
                >
                  <IconArrowUp className='h-4 w-4' />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>
                {isLoading
                  ? "Stop generation"
                  : canSubmit
                    ? "Send message"
                    : "Enter a message to send"}
              </TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </form>
  );
}
