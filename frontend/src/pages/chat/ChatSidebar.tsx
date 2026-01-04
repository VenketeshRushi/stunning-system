"use client";

import { useState, useMemo, useCallback, memo } from "react";
import {
  Search,
  Plus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { ChatSession, ChatSidebarProps } from "@/types/chat.types";

interface GroupedSessions {
  period: string;
  sessions: ChatSession[];
}

// Helper to group sessions by time period
function groupSessionsByPeriod(sessions: ChatSession[]): GroupedSessions[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: Record<string, ChatSession[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    "Previous 30 Days": [],
    Older: [],
  };

  sessions.forEach(session => {
    const date = new Date(session.createdAt);
    if (date >= today) {
      groups["Today"].push(session);
    } else if (date >= yesterday) {
      groups["Yesterday"].push(session);
    } else if (date >= weekAgo) {
      groups["Previous 7 Days"].push(session);
    } else if (date >= monthAgo) {
      groups["Previous 30 Days"].push(session);
    } else {
      groups["Older"].push(session);
    }
  });

  return Object.entries(groups)
    .filter(([_, s]) => s.length > 0)
    .map(([period, s]) => ({ period, sessions: s }));
}

// Memoized session item component
const SessionItem = memo(
  ({
    session,
    isActive,
    isEditing,
    editTitle,
    onEditTitleChange,
    onSessionSelect,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDeleteClick,
  }: {
    session: ChatSession;
    isActive: boolean;
    isEditing: boolean;
    editTitle: string;
    onEditTitleChange: (title: string) => void;
    onSessionSelect: () => void;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDeleteClick: () => void;
  }) => {
    return (
      <div
        className={cn(
          "group relative flex items-center rounded-md transition-all duration-150",
          isActive ? "bg-accent/60 shadow-sm" : "hover:bg-muted/70"
        )}
      >
        {isEditing ? (
          <div className='flex items-center gap-1 w-full p-1'>
            <Input
              value={editTitle}
              onChange={e => onEditTitleChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              className='h-8 text-sm'
              autoFocus
            />
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 shrink-0'
              onClick={onSaveEdit}
            >
              <Check className='h-4 w-4' />
            </Button>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 shrink-0'
              onClick={onCancelEdit}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        ) : (
          <>
            <button
              onClick={onSessionSelect}
              className={cn(
                "flex-1 text-left px-3 py-2 text-sm truncate",
                isActive ? "text-accent-foreground" : "text-foreground/90"
              )}
            >
              {session.title || "New Chat"}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className={cn(
                    "h-8 w-8 shrink-0 mr-1",
                    "opacity-0 group-hover:opacity-100",
                    isActive && "opacity-100"
                  )}
                  onClick={e => e.stopPropagation()}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-40'>
                <DropdownMenuItem onClick={onStartEdit}>
                  <Pencil className='h-4 w-4 mr-2' />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDeleteClick}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    );
  }
);

SessionItem.displayName = "SessionItem";

/**
 * Updated ChatSidebar
 * - Removes `min-h-screen` and uses `h-full` for correct flex behavior
 * - Supports optional mobile control via `sidebarOpen` and `onClose` props
 * - Keeps scrolling stable using ScrollArea
 * - Does not force visibility on mobile unless `sidebarOpen` is provided
 */
export const ChatSidebar = memo(function ChatSidebar({
  sessions,
  activeSessionId,
  isLoading = false,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  // optional props for mobile control (backwards compatible)
  sidebarOpen,
  onClose,
}: ChatSidebarProps & { sidebarOpen?: boolean; onClose?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Filter and group sessions with memoization
  const groupedSessions = useMemo(() => {
    const filtered = sessions.filter(session =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Sort by most recent first
    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return groupSessionsByPeriod(sorted);
  }, [sessions, searchQuery]);

  // Handlers
  const handleStartEdit = useCallback((session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  }, [editingId, editTitle, onRenameSession]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
    }
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
    // close the sidebar on mobile after delete (optional)
    if (onClose) onClose();
  }, [sessionToDelete, onDeleteSession, onClose]);

  const handleDeleteClick = useCallback((sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  }, []);

  // Determine classes (responsive and mobile-controlled)
  const mobileControlled = typeof sidebarOpen !== "undefined";

  const asideClass = cn(
    // base
    "flex flex-col border bg-background h-full",
    // width
    "w-64 lg:w-72",
    // if mobile controlled, use fixed + transform for slide-in behavior, else keep hidden on small screens
    mobileControlled
      ? "fixed md:relative z-50 md:z-auto transition-transform duration-300"
      : "flex-1 w-full",
    // transform state when mobileControlled
    mobileControlled &&
      (sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")
  );

  return (
    <aside className={asideClass}>
      {/* Search */}
      <div className='p-4 bg-background border-b'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search chats...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9 bg-muted/40 border focus-visible:ring-2 focus-visible:ring-primary/50'
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className='flex-1 overflow-y-auto p-4'>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground text-sm'>
            {searchQuery ? "No chats found" : "No conversations yet"}
          </div>
        ) : (
          <div className='space-y-6 pb-4'>
            {groupedSessions.map(group => (
              <div key={group.period}>
                <h3 className='text-xs font-medium text-muted-foreground mb-2 px-2 uppercase tracking-wider'>
                  {group.period}
                </h3>
                <div className='space-y-1'>
                  {group.sessions.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={activeSessionId === session.id}
                      isEditing={editingId === session.id}
                      editTitle={editTitle}
                      onEditTitleChange={setEditTitle}
                      onSessionSelect={() => {
                        onSessionSelect(session.id);
                        // if mobile, close after selecting
                        if (onClose) onClose();
                      }}
                      onStartEdit={() => handleStartEdit(session)}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onDeleteClick={() => handleDeleteClick(session.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* New Chat Button */}
      <div className='p-4 border-t bg-background'>
        <Button
          variant='default'
          className='w-full'
          onClick={() => {
            onNewChat();
            if (onClose) onClose();
          }}
          disabled={isLoading}
        >
          <Plus className='h-4 w-4 mr-2' />
          New Chat
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its
              messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
});
