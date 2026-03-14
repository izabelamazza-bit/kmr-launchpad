import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import logoKMR from "@/assets/Logo_KMR.png";
import {
  ArrowLeft,
  Bot,
  Clock,
  Headset,
  CheckCircle2,
  Send,
  User,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  channel_status: string;
  assigned_to: string | null;
  conversation_history: Array<{ role: string; content: string }> | null;
  created_at: string;
  updated_at: string;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  ai_active: { label: "IA", color: "bg-blue-100 text-blue-800" },
  queue: { label: "Fila", color: "bg-amber-100 text-amber-800" },
  human_active: { label: "Atendimento", color: "bg-green-100 text-green-800" },
  closed: { label: "Encerrado", color: "bg-muted text-muted-foreground" },
};

function ConversationCard({
  lead,
  action,
  actionLabel,
  actionIcon: ActionIcon,
  onClick,
}: {
  lead: Lead;
  action?: () => void;
  actionLabel?: string;
  actionIcon?: typeof Bot;
  onClick?: () => void;
}) {
  const history = lead.conversation_history || [];
  const lastMsg = history.length > 0 ? history[history.length - 1] : null;
  const timeAgo = getTimeAgo(lead.updated_at);

  return (
    <div
      className={`bg-card border rounded-lg p-4 hover:border-primary/40 transition-colors ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-foreground truncate">
              {lead.name || "Visitante anônimo"}
            </p>
            <Badge variant="secondary" className={statusLabels[lead.channel_status]?.color}>
              {statusLabels[lead.channel_status]?.label}
            </Badge>
          </div>
          {lead.company && (
            <p className="text-xs text-muted-foreground mb-1">{lead.company}</p>
          )}
          {lastMsg && (
            <p className="text-sm text-muted-foreground truncate">
              {lastMsg.role === "user" ? "👤 " : lastMsg.role === "assistant" ? "🤖 " : "👨‍💼 "}
              {lastMsg.content.slice(0, 80)}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo} · {history.length} msgs
          </p>
        </div>
        {action && actionLabel && (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); action(); }}>
            {ActionIcon && <ActionIcon className="w-4 h-4 mr-1" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function ChatPanel({
  lead,
  onSend,
  onClose,
  sending,
}: {
  lead: Lead;
  onSend: (msg: string) => void;
  onClose: () => void;
  sending: boolean;
}) {
  const [input, setInput] = useState("");
  const history = lead.conversation_history || [];

  const handleSend = () => {
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div>
          <p className="font-medium text-foreground">{lead.name || "Visitante"}</p>
          <p className="text-xs text-muted-foreground">{lead.email || lead.phone || ""}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={onClose}>
          <CheckCircle2 className="w-4 h-4 mr-1" /> Encerrar
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.map((msg, i) => {
          const isUser = msg.role === "user";
          const isAgent = msg.role === "agent";
          return (
            <div key={i} className={`flex gap-2 items-start ${isUser ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : isAgent
                    ? "bg-green-600 text-white"
                    : "bg-muted"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : isAgent ? <Headset className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : isAgent
                    ? "bg-green-50 border border-green-200 text-foreground rounded-tl-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Digite sua resposta..."
            disabled={sending}
            className="flex-1 min-h-[44px]"
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon" className="min-h-[44px] min-w-[44px]">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const Atendimento = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupaUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
    });
  }, [navigate]);

  // Fetch leads with conversations
  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .not("conversation_history", "is", null)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setLeads(data as unknown as Lead[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("leads-atendimento")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (payload) => {
        if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          const updated = payload.new as unknown as Lead;
          setLeads((prev) => {
            const idx = prev.findIndex((l) => l.id === updated.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            }
            if (updated.conversation_history) return [updated, ...prev];
            return prev;
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateLeadStatus = async (leadId: string, channelStatus: string, assignedTo?: string | null) => {
    const updateData: Record<string, unknown> = {
      channel_status: channelStatus,
      updated_at: new Date().toISOString(),
    };
    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;

    const { error } = await supabase.from("leads").update(updateData).eq("id", leadId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAssume = async (leadId: string) => {
    if (!user) return;
    const ok = await updateLeadStatus(leadId, "human_active", user.id);
    if (ok) {
      setSelectedLeadId(leadId);
      toast({ title: "Conversa assumida", description: "Você está atendendo esta conversa agora." });
    }
  };

  const handleAttend = async (leadId: string) => {
    if (!user) return;
    const ok = await updateLeadStatus(leadId, "human_active", user.id);
    if (ok) {
      setSelectedLeadId(leadId);
      toast({ title: "Atendimento iniciado" });
    }
  };

  const handleClose = async (leadId: string) => {
    const ok = await updateLeadStatus(leadId, "closed");
    if (ok) {
      setSelectedLeadId(null);
      toast({ title: "Atendimento encerrado" });
    }
  };

  const handleSendMessage = async (leadId: string, message: string) => {
    setSending(true);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) { setSending(false); return; }

    const history = [...(lead.conversation_history || []), { role: "agent", content: message }];
    const { error } = await supabase
      .from("leads")
      .update({
        conversation_history: history as unknown as import("@/integrations/supabase/types").Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    }
    setSending(false);
  };

  const aiLeads = leads.filter((l) => l.channel_status === "ai_active");
  const queueLeads = leads.filter((l) => l.channel_status === "queue");
  const activeLeads = leads.filter((l) => l.channel_status === "human_active");
  const closedLeads = leads.filter((l) => l.channel_status === "closed");
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoKMR} alt="KMR" className="h-8 w-auto" />
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">Atendimento</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="ia">
          <TabsList className="mb-6">
            <TabsTrigger value="ia" className="gap-1.5">
              <Bot className="w-4 h-4" />
              IA
              {aiLeads.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{aiLeads.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="fila" className="gap-1.5">
              <Clock className="w-4 h-4" />
              Fila
              {queueLeads.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{queueLeads.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="atendimento" className="gap-1.5">
              <Headset className="w-4 h-4" />
              Atendimento
              {activeLeads.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeLeads.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="encerrado" className="gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Encerrado
            </TabsTrigger>
          </TabsList>

          {/* IA Tab */}
          <TabsContent value="ia">
            {aiLeads.length === 0 ? (
              <EmptyState icon={Bot} message="Nenhuma conversa ativa com a IA no momento." />
            ) : (
              <div className="grid gap-3">
                {aiLeads.map((lead) => (
                  <ConversationCard
                    key={lead.id}
                    lead={lead}
                    action={() => handleAssume(lead.id)}
                    actionLabel="Assumir"
                    actionIcon={UserCheck}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Fila Tab */}
          <TabsContent value="fila">
            {queueLeads.length === 0 ? (
              <EmptyState icon={Clock} message="Nenhuma conversa na fila de espera." />
            ) : (
              <div className="grid gap-3">
                {queueLeads.map((lead) => (
                  <ConversationCard
                    key={lead.id}
                    lead={lead}
                    action={() => handleAttend(lead.id)}
                    actionLabel="Atender"
                    actionIcon={Headset}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Atendimento Tab */}
          <TabsContent value="atendimento">
            {activeLeads.length === 0 && !selectedLead ? (
              <EmptyState icon={Headset} message="Nenhum atendimento em andamento." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: "70vh" }}>
                {/* Conversation list */}
                <div className="lg:col-span-1 space-y-2 overflow-y-auto">
                  {activeLeads.map((lead) => (
                    <ConversationCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => setSelectedLeadId(lead.id)}
                    />
                  ))}
                </div>

                {/* Chat panel */}
                <div className="lg:col-span-2 border rounded-lg bg-card overflow-hidden">
                  {selectedLead && selectedLead.channel_status === "human_active" ? (
                    <ChatPanel
                      lead={selectedLead}
                      onSend={(msg) => handleSendMessage(selectedLead.id, msg)}
                      onClose={() => handleClose(selectedLead.id)}
                      sending={sending}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Selecione uma conversa para atender</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Encerrado Tab */}
          <TabsContent value="encerrado">
            {closedLeads.length === 0 ? (
              <EmptyState icon={CheckCircle2} message="Nenhum atendimento encerrado." />
            ) : (
              <div className="grid gap-3">
                {closedLeads.map((lead) => (
                  <ConversationCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => setSelectedLeadId(lead.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function EmptyState({ icon: Icon, message }: { icon: typeof Bot; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="w-12 h-12 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default Atendimento;
