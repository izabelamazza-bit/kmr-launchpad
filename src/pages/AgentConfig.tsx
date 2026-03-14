import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import logoKMR from "@/assets/Logo_KMR.png";
import {
  ArrowLeft, LogOut, Save, Plus, Trash2, Pencil, Bot,
  MessageSquare, Users, Calendar, Brain, ShieldCheck, ShieldX, Loader2,
} from "lucide-react";

type KnowledgeItem = { title: string; content: string; category: string };
type ActionItem = { name: string; label: string; enabled: boolean };

interface AgentConfig {
  id: string;
  system_prompt: string;
  knowledge_base: KnowledgeItem[];
  allowed_actions: ActionItem[];
  restricted_topics: string[];
  personality: string;
  greeting_message: string;
  max_response_length: number;
  model: string;
  is_active: boolean;
  updated_at: string;
}

const MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Rápido)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Equilibrado)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Avançado)" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini (Equilibrado)" },
  { value: "openai/gpt-5", label: "GPT-5 (Avançado)" },
];

const KNOWLEDGE_CATEGORIES = [
  "Produtos e Serviços",
  "Preços e Condições",
  "FAQ",
  "Políticas",
  "Processos",
  "Outro",
];

const AgentConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Knowledge modal
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [editingKnowledgeIdx, setEditingKnowledgeIdx] = useState<number | null>(null);
  const [knowledgeForm, setKnowledgeForm] = useState<KnowledgeItem>({ title: "", content: "", category: "FAQ" });

  // Restriction modal
  const [newRestriction, setNewRestriction] = useState("");

  // Metrics
  const [metrics, setMetrics] = useState({ total: 0, qualified: 0, scheduled: 0 });
  const [recentLeads, setRecentLeads] = useState<Array<{ id: string; name: string | null; status: string; created_at: string }>>([]);

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from("agent_config")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("Error loading config:", error);
      toast({ title: "Erro ao carregar configurações", variant: "destructive" });
      setLoading(false);
      return;
    }

    setConfig({
      ...data,
      knowledge_base: (data.knowledge_base as unknown as KnowledgeItem[]) || [],
      allowed_actions: (data.allowed_actions as unknown as ActionItem[]) || [],
      restricted_topics: (data.restricted_topics as unknown as string[]) || [],
    });
    setLoading(false);
  }, [toast]);

  const fetchMetrics = useCallback(async () => {
    const [totalRes, qualifiedRes, scheduledRes, recentRes] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "qualificado"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "agendado"),
      supabase.from("leads").select("id, name, status, created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    setMetrics({
      total: totalRes.count || 0,
      qualified: qualifiedRes.count || 0,
      scheduled: scheduledRes.count || 0,
    });
    setRecentLeads(recentRes.data || []);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      fetchConfig();
      fetchMetrics();
    });
  }, [navigate, fetchConfig, fetchMetrics]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    const { error } = await supabase
      .from("agent_config")
      .update({
        system_prompt: config.system_prompt,
        knowledge_base: config.knowledge_base as unknown as Record<string, unknown>[],
        allowed_actions: config.allowed_actions as unknown as Record<string, unknown>[],
        restricted_topics: config.restricted_topics as unknown as string[],
        personality: config.personality,
        greeting_message: config.greeting_message,
        max_response_length: config.max_response_length,
        model: config.model,
        is_active: config.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas com sucesso!" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Knowledge handlers
  const openAddKnowledge = () => {
    setEditingKnowledgeIdx(null);
    setKnowledgeForm({ title: "", content: "", category: "FAQ" });
    setKnowledgeOpen(true);
  };

  const openEditKnowledge = (idx: number) => {
    setEditingKnowledgeIdx(idx);
    setKnowledgeForm({ ...config!.knowledge_base[idx] });
    setKnowledgeOpen(true);
  };

  const saveKnowledge = () => {
    if (!config || !knowledgeForm.title.trim() || !knowledgeForm.content.trim()) return;
    const updated = [...config.knowledge_base];
    if (editingKnowledgeIdx !== null) {
      updated[editingKnowledgeIdx] = { ...knowledgeForm };
    } else {
      updated.push({ ...knowledgeForm });
    }
    setConfig({ ...config, knowledge_base: updated });
    setKnowledgeOpen(false);
  };

  const removeKnowledge = (idx: number) => {
    if (!config) return;
    setConfig({ ...config, knowledge_base: config.knowledge_base.filter((_, i) => i !== idx) });
  };

  // Actions handler
  const toggleAction = (idx: number) => {
    if (!config) return;
    const updated = [...config.allowed_actions];
    updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
    setConfig({ ...config, allowed_actions: updated });
  };

  // Restriction handlers
  const addRestriction = () => {
    if (!config || !newRestriction.trim()) return;
    setConfig({ ...config, restricted_topics: [...config.restricted_topics, newRestriction.trim()] });
    setNewRestriction("");
  };

  const removeRestriction = (idx: number) => {
    if (!config) return;
    setConfig({ ...config, restricted_topics: config.restricted_topics.filter((_, i) => i !== idx) });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <p className="text-muted-foreground">Configuração não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoKMR} alt="KMR" className="h-8 w-auto hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} className="min-h-[44px]">
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Gestão do Agente de IA</h1>
            <p className="text-muted-foreground text-sm">Configure, treine e gerencie o comportamento do assistente virtual.</p>
          </div>
        </div>

        <Tabs defaultValue="prompt" className="space-y-6">
          <TabsList className="w-full sm:w-auto flex flex-wrap">
            <TabsTrigger value="prompt" className="flex-1 sm:flex-none gap-1.5">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Prompt &</span> Personalidade
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex-1 sm:flex-none gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Conhecimento
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex-1 sm:flex-none gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Regras
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-1 sm:flex-none gap-1.5">
              <Users className="h-4 w-4" />
              Métricas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Prompt & Personalidade */}
          <TabsContent value="prompt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prompt de Sistema</CardTitle>
                <CardDescription>Instruções principais que definem o comportamento do agente. Edite com cuidado.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.system_prompt}
                  onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                  rows={14}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personalidade</CardTitle>
                  <CardDescription>Tom de voz e estilo de comunicação do agente.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={config.personality}
                    onChange={(e) => setConfig({ ...config, personality: e.target.value })}
                    rows={3}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mensagem de Saudação</CardTitle>
                  <CardDescription>Mensagem exibida quando o chat é aberto pela primeira vez.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={config.greeting_message}
                    onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Modelo de IA</CardTitle>
                  <CardDescription>Escolha o modelo que melhor atende sua necessidade.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={config.model} onValueChange={(v) => setConfig({ ...config, model: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Limite de Resposta</CardTitle>
                  <CardDescription>Máximo de caracteres por resposta do agente.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={100}
                      max={2000}
                      value={config.max_response_length}
                      onChange={(e) => setConfig({ ...config, max_response_length: parseInt(e.target.value) || 500 })}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">caracteres</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Base de Conhecimento */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Base de Conhecimento</CardTitle>
                    <CardDescription>
                      Adicione informações sobre seus produtos, preços, políticas e FAQ. O agente usará esses dados para responder seus clientes.
                    </CardDescription>
                  </div>
                  <Dialog open={knowledgeOpen} onOpenChange={setKnowledgeOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openAddKnowledge} className="min-h-[44px]">
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          {editingKnowledgeIdx !== null ? "Editar Conhecimento" : "Adicionar Conhecimento"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label>Título</Label>
                          <Input
                            value={knowledgeForm.title}
                            onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
                            placeholder="Ex: Planos de garantia"
                          />
                        </div>
                        <div>
                          <Label>Categoria</Label>
                          <Select
                            value={knowledgeForm.category}
                            onValueChange={(v) => setKnowledgeForm({ ...knowledgeForm, category: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {KNOWLEDGE_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Conteúdo</Label>
                          <Textarea
                            value={knowledgeForm.content}
                            onChange={(e) => setKnowledgeForm({ ...knowledgeForm, content: e.target.value })}
                            rows={6}
                            placeholder="Descreva em detalhes as informações que o agente deve saber..."
                          />
                        </div>
                        <Button onClick={saveKnowledge} disabled={!knowledgeForm.title.trim() || !knowledgeForm.content.trim()} className="w-full min-h-[44px]">
                          Salvar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {config.knowledge_base.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>Nenhum conhecimento adicionado ainda.</p>
                    <p className="text-sm mt-1">Adicione informações para que o agente possa responder melhor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {config.knowledge_base.map((item, idx) => (
                      <div key={idx} className="border rounded-lg p-4 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEditKnowledge(idx)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeKnowledge(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Capacidades & Restrições */}
          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  O que o agente PODE fazer
                </CardTitle>
                <CardDescription>Ative ou desative as capacidades do agente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.allowed_actions.map((action, idx) => (
                  <div key={action.name} className="flex items-center justify-between">
                    <Label htmlFor={`action-${idx}`} className="cursor-pointer">{action.label}</Label>
                    <Switch
                      id={`action-${idx}`}
                      checked={action.enabled}
                      onCheckedChange={() => toggleAction(idx)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldX className="h-5 w-5 text-destructive" />
                  O que o agente NÃO pode fazer
                </CardTitle>
                <CardDescription>Restrições de comportamento do agente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.restricted_topics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground">{topic}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeRestriction(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Separator />
                <div className="flex gap-2">
                  <Input
                    value={newRestriction}
                    onChange={(e) => setNewRestriction(e.target.value)}
                    placeholder="Nova restrição..."
                    onKeyDown={(e) => e.key === "Enter" && addRestriction()}
                    className="min-h-[44px]"
                  />
                  <Button onClick={addRestriction} disabled={!newRestriction.trim()} variant="outline" className="min-h-[44px]">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Status & Métricas */}
          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status do Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Agente {config.is_active ? "Ativo" : "Inativo"}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.is_active ? "O assistente está respondendo visitantes." : "O assistente está desligado."}
                    </p>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(v) => setConfig({ ...config, is_active: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold text-foreground">{metrics.total}</p>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold text-foreground">{metrics.qualified}</p>
                  <p className="text-sm text-muted-foreground">Qualificados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold text-foreground">{metrics.scheduled}</p>
                  <p className="text-sm text-muted-foreground">Reuniões Agendadas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Leads Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentLeads.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhum lead ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-foreground">{lead.name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <Badge variant={lead.status === "agendado" ? "default" : "secondary"}>
                          {lead.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AgentConfig;
