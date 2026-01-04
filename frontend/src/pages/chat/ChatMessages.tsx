import { useState, useCallback, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Copy,
  RotateCcw,
  Check,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Message, MessageListProps } from "@/types/chat.types";
import { Spinner } from "@/components/ui/spinner";

export function ChatMessages({
  messages,
  isStreaming = false,
  onRegenerate,
  onDelete,
  onEdit,
  onReact,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-center px-4'>
        <Bot className='h-12 w-12 text-muted-foreground mb-4' />
        <h2 className='text-xl font-semibold mb-2'>
          How can I help you today?
        </h2>
        <p className='text-muted-foreground max-w-md'>
          Start a conversation by typing a message below.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='max-w-4xl mx-auto py-6 px-4 space-y-6'>
        {messages.map((msg, index) => {
          const isLast = index === messages.length - 1;
          const isStreamingThis =
            isStreaming && isLast && msg.role === "assistant";

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isStreamingThis}
              onCopy={() => navigator.clipboard.writeText(msg.content)}
              onRegenerate={
                onRegenerate ? () => onRegenerate(msg.id) : undefined
              }
              onDelete={onDelete ? () => onDelete(msg.id) : undefined}
              onEdit={onEdit ? content => onEdit(msg.id, content) : undefined}
              onReact={
                onReact ? reaction => onReact(msg.id, reaction) : undefined
              }
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </TooltipProvider>
  );
}

// Individual Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onCopy: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
  onReact?: (reaction: "like" | "dislike" | null) => void;
}

function MessageBubble({
  message,
  isStreaming,
  onCopy,
  onRegenerate,
  onDelete,
  onEdit,
  onReact,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Handle copy with feedback
  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  // Handle edit start
  const handleStartEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(true);
  }, [message.content]);

  // Handle edit save
  const handleSaveEdit = useCallback(() => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(editContent.trim());
    }
    setIsEditing(false);
  }, [editContent, message.content, onEdit]);

  // Handle edit cancel
  const handleCancelEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(false);
  }, [message.content]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.setSelectionRange(
        editContent.length,
        editContent.length
      );
    }
  }, [isEditing, editContent.length]);

  // Handle reaction toggle
  const handleReaction = useCallback(
    (reaction: "like" | "dislike") => {
      const newReaction = message.reaction === reaction ? null : reaction;
      onReact?.(newReaction);
    },
    [message.reaction, onReact]
  );

  return (
    <div
      className={cn(
        "flex gap-3 sm:gap-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1'>
          <Bot className='w-5 h-5 text-primary' />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[85%] sm:max-w-[80%]",
          isUser && "items-end"
        )}
      >
        {/* Message Content */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {isEditing ? (
            // Edit Mode
            <div className='space-y-2'>
              <Textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && e.metaKey) handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className='min-h-[80px] bg-background text-foreground'
                placeholder='Edit your message...'
              />
              <div className='flex items-center gap-2 justify-end'>
                <Button size='sm' variant='ghost' onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button size='sm' onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className='text-sm leading-relaxed whitespace-pre-wrap'>
              {message.content}
              {isStreaming && !message.content && (
                <span className='inline-flex items-center gap-2'>
                  <Spinner className='h-4 w-4' />
                  <span className='text-muted-foreground'>Thinking...</span>
                </span>
              )}
              {isStreaming && message.content && (
                <span className='inline-block w-2 h-4 bg-current animate-pulse ml-0.5' />
              )}
            </div>
          )}
        </div>

        {/* Message Actions */}
        {!isEditing && !isStreaming && message.content && (
          <div
            className={cn(
              "flex items-center gap-1",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {/* Copy Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-7 w-7'
                  onClick={handleCopy}
                  aria-label='Copy message'
                >
                  {copied ? (
                    <Check className='h-3.5 w-3.5 text-green-500' />
                  ) : (
                    <Copy className='h-3.5 w-3.5' />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Copied!" : "Copy"}</p>
              </TooltipContent>
            </Tooltip>

            {/* User Message Actions */}
            {isUser && onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7'
                    onClick={handleStartEdit}
                    aria-label='Edit message'
                  >
                    <Pencil className='h-3.5 w-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Assistant Message Actions */}
            {isAssistant && (
              <>
                {/* Like */}
                {onReact && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-7 w-7'
                        onClick={() => handleReaction("like")}
                        aria-label='Like response'
                      >
                        <ThumbsUp
                          className={cn(
                            "h-3.5 w-3.5",
                            message.reaction === "like" &&
                              "fill-current text-green-500"
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Good response</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Dislike */}
                {onReact && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-7 w-7'
                        onClick={() => handleReaction("dislike")}
                        aria-label='Dislike response'
                      >
                        <ThumbsDown
                          className={cn(
                            "h-3.5 w-3.5",
                            message.reaction === "dislike" &&
                              "fill-current text-red-500"
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bad response</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Regenerate */}
                {onRegenerate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='h-7 w-7'
                        onClick={onRegenerate}
                        aria-label='Regenerate response'
                      >
                        <RotateCcw className='h-3.5 w-3.5' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regenerate</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}

            {/* Delete Button (for both) */}
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7 text-muted-foreground hover:text-destructive'
                    onClick={onDelete}
                    aria-label='Delete message'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Timestamp */}
        {!isStreaming && (
          <span className='text-xs text-muted-foreground px-1'>
            {formatTimestamp(message.createdAt)}
          </span>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1'>
          <User className='w-5 h-5' />
        </div>
      )}
    </div>
  );
}

// Helper to format timestamps
function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default ChatMessages;
