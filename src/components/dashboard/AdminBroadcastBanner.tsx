import { useState, useEffect } from "react";
import { X, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

const AdminBroadcastBanner = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("dismissed-broadcasts");
    if (stored) setDismissed(new Set(JSON.parse(stored)));

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("admin_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setMessages(data as AdminMessage[]);
    };
    fetchMessages();

    // Real-time subscription for new admin messages
    const channel = supabase
      .channel("admin-broadcasts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_messages" },
        (payload) => {
          const newMsg = payload.new as AdminMessage;
          setMessages((prev) => [newMsg, ...prev]);
          // Show toast popup immediately
          toast.info(`📢 ${newMsg.title}`, {
            description: newMsg.message,
            duration: 10000,
          });
          // Also send browser push notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`📢 ${newMsg.title}`, { body: newMsg.message, icon: "/favicon.ico" });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("dismissed-broadcasts", JSON.stringify(Array.from(next)));
  };

  const visible = messages.filter(m => !dismissed.has(m.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      <AnimatePresence>
        {visible.map(msg => (
          <motion.div key={msg.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Megaphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{msg.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{msg.message}</p>
            </div>
            <button onClick={() => dismiss(msg.id)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AdminBroadcastBanner;
