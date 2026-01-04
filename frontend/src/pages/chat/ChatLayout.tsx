import { useRef, useState, useCallback, useMemo } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatSidebar } from "@/pages/chat/ChatSidebar";
import { ChatInput } from "@/pages/chat/ChatInput";
import { ChatMessages } from "@/pages/chat/ChatMessages";
import type { ChatSettings, ChatInputData } from "@/types/chat.types";
import { DATASETS, MODELS, STYLES } from "@/constants/chat";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ChatLayout() {
  const {
    messages,
    sessions,
    currentSession,
    isLoading,
    isStreaming,
    sendMessageWithStream,
    regenerate,
    stopGenerating,
    editMessage,
    deleteMessage,
    reactToMessage,
    // loadSessions,
    loadSession,
    createSession,
    updateSession,
    deleteSession,
  } = useChat();

  const [settings, setSettings] = useState<ChatSettings>({
    model: MODELS[0],
    datasets: [],
    style: STYLES[0],
    webSearch: false,
    extendedThinking: false,
  });

  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // useEffect(() => {
  //   loadSessions();
  // }, [loadSessions]);

  const handleLoadSession = useCallback(
    async (id: string) => {
      await loadSession(id);
    },
    [loadSession]
  );

  const handleCreateSession = useCallback(async () => {
    await createSession();
  }, [createSession]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
    },
    [deleteSession]
  );

  const handleRenameSession = useCallback(
    async (id: string, title: string) => {
      await updateSession(id, title);
    },
    [updateSession]
  );

  const handleSubmit = useCallback(
    async (data: ChatInputData) => {
      if (!data.message?.trim() || isLoading || isStreaming) return;

      if (!currentSession?.id) {
        await createSession();
      }

      setInputValue("");

      try {
        await sendMessageWithStream({
          message: data.message,
          model: data.model.name,
          style: data.style?.name,
          webSearch: data.webSearch,
          thinkingMode: data.extendedThinking,
        });
      } catch (err) {
        console.error("Send message failed", err);
      }
    },
    [
      isLoading,
      isStreaming,
      sendMessageWithStream,
      createSession,
      currentSession?.id,
    ]
  );

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const maxBytes = 10 * 1024 * 1024;
    if (f.size > maxBytes) {
      console.warn("File too large (>10MB).");
      e.target.value = "";
      return;
    }
    if (f.type.startsWith("image/")) {
      console.log("Preview image URL:", URL.createObjectURL(f));
    } else {
      console.log("Attached file:", f.name, f.size, f.type);
    }
    e.target.value = "";
  }, []);

  const sidebarIsLoading = useMemo(
    () => isLoading && sessions.length === 0,
    [isLoading, sessions.length]
  );

  return (
    <div className='animate-(--animate-fade-slide-in) flex flex-1 w-full h-full min-h-full bg-background shadow-xl'>
      {/* SIDEBAR - md+ */}
      <aside className='hidden md:flex md:flex-col md:w-72 border-r bg-background z-0'>
        <ChatSidebar
          sessions={sessions}
          activeSessionId={currentSession?.id || null}
          isLoading={sidebarIsLoading}
          onSessionSelect={handleLoadSession}
          onNewChat={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
        />
      </aside>

      {/* MAIN AREA */}
      <div className='flex flex-col flex-1 min-w-0 relative'>
        {/* MOBILE/TBLET TABS */}
        <div className='flex flex-col flex-1 lg:hidden'>
          <Tabs defaultValue='chat' className='flex-1 min-h-0'>
            <TabsList className='w-full grid grid-cols-2'>
              <TabsTrigger value='chat' className='text-center'>
                Chat
              </TabsTrigger>
              <TabsTrigger value='sessions' className='text-center'>
                Chat History
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value='chat'
              className='flex flex-col h-full min-h-0 animate-(--animate-fade-slide-in)'
            >
              <div className='flex-1 min-h-0 overflow-y-auto p-4'>
                <ChatMessages
                  messages={messages}
                  isStreaming={isStreaming}
                  onRegenerate={regenerate}
                  onDelete={deleteMessage}
                  onEdit={editMessage}
                  onReact={reactToMessage}
                />
              </div>

              <div className='px-4 py-3 border-t bg-background'>
                <ChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleSubmit}
                  settings={settings}
                  onSettingsChange={s => setSettings(p => ({ ...p, ...s }))}
                  availableDatasets={DATASETS}
                  onAttachFile={() => fileInputRef.current?.click()}
                  disabled={isLoading || isStreaming}
                  isLoading={isLoading || isStreaming}
                />
              </div>
            </TabsContent>

            <TabsContent
              value='sessions'
              className='h-full min-h-0 overflow-y-auto animate-(--animate-fade-slide-in)'
            >
              <ChatSidebar
                sessions={sessions}
                activeSessionId={currentSession?.id || null}
                isLoading={sidebarIsLoading}
                onSessionSelect={handleLoadSession}
                onNewChat={handleCreateSession}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Chat */}
        <main className='hidden lg:border lg:flex-1 lg:flex lg:flex-col lg:min-h-0 lg:overflow-y-auto pb-4'>
          <ChatMessages
            messages={messages}
            isStreaming={isStreaming}
            onRegenerate={regenerate}
            onDelete={deleteMessage}
            onEdit={editMessage}
            onReact={reactToMessage}
          />
          <div className='px-4 py-3 border-t bg-background'>
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              settings={settings}
              onSettingsChange={s => setSettings(p => ({ ...p, ...s }))}
              availableDatasets={DATASETS}
              onAttachFile={() => fileInputRef.current?.click()}
              disabled={isLoading || isStreaming}
              isLoading={!sidebarIsLoading && (isLoading || isStreaming)}
              stopGenerating={stopGenerating}
            />
          </div>
        </main>

        {/* hidden file input */}
        <input
          type='file'
          ref={fileInputRef}
          className='hidden'
          onChange={onFileChange}
          accept='image/*,.pdf,.txt,.doc,.docx'
        />
      </div>
    </div>
  );
}
