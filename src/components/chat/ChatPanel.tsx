import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Trash2, Mic, Square, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  message: string;
  created_at: string;
  chat_type: string;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ChatPanelProps {
  chatType: string;
  user: any;
  isAdmin: boolean;
  displayName: string;
  profiles: Map<string, UserProfile>;
}

// Parse message content for media
const parseMessage = (msg: string) => {
  if (msg.startsWith("__IMG__")) return { type: "image" as const, url: msg.slice(6) };
  if (msg.startsWith("__AUDIO__")) return { type: "audio" as const, url: msg.slice(9) };
  return { type: "text" as const, text: msg };
};

const ChatPanel = ({ chatType, user, isAdmin, displayName, profiles }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_type", chatType)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) setMessages(data as ChatMessage[]);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${chatType}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_type=eq.${chatType}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, chatType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Upload file to storage
  const uploadMedia = useCallback(async (file: Blob, ext: string): Promise<string | null> => {
    const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(fileName, file, {
      contentType: ext === "webm" ? "audio/webm" : ext === "ogg" ? "audio/ogg" : file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(fileName);
    return urlData.publicUrl;
  }, [user]);

  // Send a chat message (text, image, or audio)
  const sendChatMessage = useCallback(async (messageContent: string) => {
    if (!user) return;
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      user_name: displayName,
      user_email: user.email,
      message: messageContent,
      chat_type: chatType,
    } as any);
    if (error) {
      toast.error("Erro ao enviar mensagem");
      return;
    }
    // Push notifications
    if (chatType.startsWith("admin-") && !isAdmin) {
      supabase.functions.invoke("send-push", {
        body: { type: "to_admin", title: `💬 Nova mensagem de ${displayName}`, body: messageContent.startsWith("__") ? "📎 Mídia" : messageContent.slice(0, 100), url: "/dashboard/chat" },
      }).catch(() => {});
    }
    if (chatType === "friends-group") {
      supabase.functions.invoke("send-push", {
        body: { type: "to_all", title: `💬 ${displayName} no Grupo`, body: messageContent.startsWith("__") ? "📎 Mídia" : messageContent.slice(0, 100), url: "/dashboard/chat" },
      }).catch(() => {});
    }
    if (chatType.startsWith("admin-") && isAdmin) {
      supabase.functions.invoke("send-push", {
        body: { type: "to_user", user_id: chatType.replace("admin-", ""), title: `💬 Resposta do Suporte`, body: messageContent.startsWith("__") ? "📎 Mídia" : messageContent.slice(0, 100), url: "/dashboard/chat" },
      }).catch(() => {});
    }
  }, [user, displayName, chatType, isAdmin]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    await sendChatMessage(newMessage.trim());
    setNewMessage("");
    setSending(false);
  };

  // Photo handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSendPhoto = async () => {
    if (!photoFile || !user) return;
    setSending(true);
    const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const url = await uploadMedia(photoFile, ext);
    if (url) {
      await sendChatMessage(`__IMG__${url}`);
    } else {
      toast.error("Erro ao enviar imagem");
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSending(false);
  };

  const cancelPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          // Too short, ignore
          setIsRecording(false);
          setRecordingTime(0);
          return;
        }
        setSending(true);
        const ext = mimeType === "audio/webm" ? "webm" : "ogg";
        const url = await uploadMedia(blob, ext);
        if (url) {
          await sendChatMessage(`__AUDIO__${url}`);
        } else {
          toast.error("Erro ao enviar áudio");
        }
        setSending(false);
        setIsRecording(false);
        setRecordingTime(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error("Permissão de microfone negada");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleDelete = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("id", id);
  };

  const getInitials = (name: string | null) =>
    (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const getProfile = (userId: string) => profiles.get(userId);

  // Render message content
  const renderContent = (msg: ChatMessage) => {
    const parsed = parseMessage(msg.message);
    const isMe = msg.user_id === user?.id;

    if (parsed.type === "image") {
      return (
        <a href={parsed.url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={parsed.url}
            alt="Foto"
            className="max-w-[240px] max-h-[240px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </a>
      );
    }

    if (parsed.type === "audio") {
      return (
        <div className="flex items-center gap-2 min-w-[180px]">
          <audio controls preload="metadata" className="h-8 w-full max-w-[220px]" style={{ minWidth: 160 }}>
            <source src={parsed.url} />
          </audio>
        </div>
      );
    }

    return <span>{parsed.text}</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              const profile = getProfile(msg.user_id);
              const avatarUrl = profile?.avatar_url;
              const name = profile?.display_name || msg.user_name;
              const parsed = parseMessage(msg.message);
              const isMedia = parsed.type !== "text";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={name || "User"} />}
                    <AvatarFallback className={`text-xs font-bold ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className={`text-[11px] font-semibold ${isMe ? "text-primary" : "text-foreground"}`}>
                        {isMe ? "Você" : name || "Usuário"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {(isMe || isAdmin) && (
                        <button onClick={() => handleDelete(msg.id)} className="text-destructive/50 hover:text-destructive" title="Apagar para todos">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`rounded-2xl text-sm overflow-hidden ${
                        isMedia
                          ? isMe ? "bg-primary/10 rounded-tr-md p-1.5" : "bg-muted/80 rounded-tl-md p-1.5"
                          : isMe
                            ? "bg-primary text-primary-foreground rounded-tr-md px-3 py-2"
                            : "bg-muted rounded-tl-md px-3 py-2"
                      }`}
                    >
                      {renderContent(msg)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Photo preview */}
      {photoPreview && (
        <div className="flex items-center gap-3 px-3 py-2 border-t border-border bg-muted/30">
          <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
          <div className="flex-1 text-xs text-muted-foreground">Foto selecionada</div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelPhoto}>
            <X className="w-4 h-4" />
          </Button>
          <Button size="sm" className="h-8 gap-1.5" onClick={handleSendPhoto} disabled={sending}>
            <Send className="w-3.5 h-3.5" />
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {isRecording ? (
          /* Recording UI */
          <div className="flex items-center gap-3 flex-1 bg-destructive/5 rounded-xl px-4 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-destructive">{formatTime(recordingTime)}</span>
            <span className="text-xs text-muted-foreground flex-1">Gravando...</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={cancelRecording}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="icon" className="h-8 w-8 bg-destructive hover:bg-destructive/90" onClick={stopRecording}>
              <Square className="w-3.5 h-3.5 fill-current" />
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={sending}
            />
            {newMessage.trim() ? (
              <Button onClick={handleSend} disabled={sending} size="icon" className="rounded-xl shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-primary"
                onClick={startRecording}
                disabled={sending}
              >
                <Mic className="w-5 h-5" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
export type { UserProfile };
