import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MaskedInput } from "@/components/ui/masked-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

/* ─── helpers ─── */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-6">
    <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
    <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">{children}</div>
  </section>
);

const Swatch = ({ name, cssVar, hex, usage }: { name: string; cssVar: string; hex: string; usage: string }) => (
  <div className="flex items-start gap-3">
    <div className="h-12 w-12 rounded-md border shrink-0" style={{ background: `hsl(var(--${cssVar}))` }} />
    <div className="text-sm space-y-0.5">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="font-mono text-muted-foreground text-xs">{hex}</p>
      <p className="text-muted-foreground text-xs">{usage}</p>
    </div>
  </div>
);

/* ─── page ─── */
const Components = () => {
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [phone, setPhone] = useState("");
  const [selectVal, setSelectVal] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const simulateLoading = () => {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  };

  const selectOptions = [
    { value: "sp", label: "São Paulo" },
    { value: "rj", label: "Rio de Janeiro" },
    { value: "mg", label: "Minas Gerais" },
    { value: "ba", label: "Bahia" },
    { value: "pr", label: "Paraná" },
    { value: "rs", label: "Rio Grande do Sul" },
    { value: "pe", label: "Pernambuco" },
    { value: "ce", label: "Ceará" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-bold text-foreground">Design System — Componentes</h1>
        </div>
      </header>

      <main className="container py-10 space-y-14">
        {/* 1 — TIPOGRAFIA */}
        <Section title="1. Tipografia">
          <div className="space-y-4">
            {([
              ["Heading 1", "font-display text-4xl font-bold", "Títulos de página"],
              ["Heading 2", "font-display text-3xl font-bold", "Seções principais"],
              ["Heading 3", "font-display text-2xl font-semibold", "Sub-seções"],
              ["Heading 4", "font-display text-xl font-semibold", "Cards e blocos"],
              ["Body Large", "text-lg", "Destaques de texto"],
              ["Body Default", "text-base", "Texto padrão do sistema"],
              ["Body Small", "text-sm", "Texto secundário"],
              ["Label", "text-sm font-medium", "Labels de formulário"],
              ["Caption", "text-xs text-muted-foreground", "Legendas e informações auxiliares"],
            ] as const).map(([name, cls, usage]) => (
              <div key={name} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-b pb-3 last:border-0">
                <span className="text-xs font-mono text-muted-foreground w-32 shrink-0">{name}</span>
                <span className={cls}>{name} — {usage}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 2 — CORES */}
        <Section title="2. Cores">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Swatch name="Primary" cssVar="primary" hex="#0F2A44" usage="Azul profundo — segurança e autoridade" />
            <Swatch name="Secondary" cssVar="secondary" hex="#2F80ED" usage="Azul tecnologia — links e destaques" />
            <Swatch name="Success / Accent" cssVar="accent" hex="#27AE60" usage="Verde — aprovação e garantia" />
            <Swatch name="Warning" cssVar="warning" hex="#F2A900" usage="Alertas e atenção" />
            <Swatch name="Error / Destructive" cssVar="destructive" hex="#EB5757" usage="Erros e ações destrutivas" />
            <Swatch name="Background" cssVar="background" hex="#F5F7FA" usage="Fundo geral das páginas" />
            <Swatch name="Card" cssVar="card" hex="#FFFFFF" usage="Fundo de cards e painéis" />
            <Swatch name="Border" cssVar="border" hex="#E2E8F0" usage="Bordas e divisores" />
            <Swatch name="Foreground" cssVar="foreground" hex="#1B3A50" usage="Texto principal" />
            <Swatch name="Muted Foreground" cssVar="muted-foreground" hex="#4F4F4F" usage="Texto secundário" />
          </div>
        </Section>

        {/* 3 — BOTÕES */}
        <Section title="3. Botões">
          <p className="text-sm text-muted-foreground">Variantes, tamanhos e estados do componente Button.</p>

          {/* variantes */}
          <div>
            <p className="text-sm font-medium mb-3">Variantes</p>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* tamanhos */}
          <div>
            <p className="text-sm font-medium mb-3">Tamanhos</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          {/* estados */}
          <div>
            <p className="text-sm font-medium mb-3">Estados</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button onClick={simulateLoading} disabled={loadingBtn}>
                {loadingBtn && <Loader2 className="animate-spin" />}
                {loadingBtn ? "Carregando..." : "Clique para loading"}
              </Button>
            </div>
          </div>
        </Section>

        {/* 4 — FORMULÁRIOS */}
        <Section title="4. Formulários">
          <p className="text-sm text-muted-foreground">Estrutura base de formulário com label, input, hint e validação.</p>
          <form
            className="max-w-md space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setFormSubmitted(true);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="demo-name">Nome completo</Label>
              <Input id="demo-name" placeholder="Seu nome" value={formName} onChange={(e) => setFormName(e.target.value)} />
              {formSubmitted && !formName && <p className="text-sm text-destructive">Nome é obrigatório</p>}
              <p className="text-xs text-muted-foreground">Informe como aparece nos documentos.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" type="email" placeholder="email@exemplo.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              {formSubmitted && !formEmail && <p className="text-sm text-destructive">Email é obrigatório</p>}
            </div>
            <Button type="submit">Enviar</Button>
            {formSubmitted && formName && formEmail && (
              <p className="text-sm text-accent">✓ Formulário válido!</p>
            )}
          </form>
        </Section>

        {/* 5 — CAMPOS COM MÁSCARA */}
        <Section title="5. Campos com máscara">
          <p className="text-sm text-muted-foreground">Inputs com máscara automática durante a digitação.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div className="space-y-2">
              <Label>CPF</Label>
              <MaskedInput mask="999.999.999-99" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <MaskedInput mask="99.999.999/9999-99" placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <MaskedInput mask="99999-999" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <MaskedInput mask="(99) 99999-9999" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="max-w-xs space-y-2 pt-2">
            <Label>CPF com erro</Label>
            <MaskedInput mask="999.999.999-99" placeholder="000.000.000-00" error />
            <p className="text-sm text-destructive">CPF inválido</p>
          </div>
        </Section>

        {/* 6 — SELECTS COM BUSCA */}
        <Section title="6. Selects com busca">
          <p className="text-sm text-muted-foreground">Select com pesquisa por texto, scroll e seleção única.</p>
          <div className="max-w-xs space-y-2">
            <Label>Estado</Label>
            <SearchableSelect options={selectOptions} value={selectVal} onChange={setSelectVal} placeholder="Selecione um estado" />
            {selectVal && <p className="text-xs text-muted-foreground">Selecionado: {selectOptions.find((o) => o.value === selectVal)?.label}</p>}
          </div>
        </Section>

        {/* 7 — CHECKBOXES */}
        <Section title="7. Checkboxes">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-start gap-3">
              <Checkbox id="cb1" />
              <div>
                <Label htmlFor="cb1">Desmarcado</Label>
                <p className="text-xs text-muted-foreground">Estado padrão do checkbox.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="cb2" defaultChecked />
              <div>
                <Label htmlFor="cb2">Marcado</Label>
                <p className="text-xs text-muted-foreground">Checkbox selecionado.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="cb3" disabled />
              <div>
                <Label htmlFor="cb3" className="opacity-50">Desabilitado</Label>
                <p className="text-xs text-muted-foreground opacity-50">Não pode ser alterado.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="cb4" className="border-destructive data-[state=checked]:bg-destructive" />
              <div>
                <Label htmlFor="cb4">Com erro</Label>
                <p className="text-xs text-destructive">Campo obrigatório.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 8 — VALIDAÇÕES */}
        <Section title="8. Validações">
          <p className="text-sm text-muted-foreground">Padrão visual para estados de validação.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            <div className="space-y-2">
              <Label>Normal</Label>
              <Input placeholder="Campo neutro" />
            </div>
            <div className="space-y-2">
              <Label>Válido</Label>
              <Input placeholder="Tudo certo" className="border-accent focus-visible:ring-accent" defaultValue="email@exemplo.com" />
              <p className="text-sm text-accent">✓ Email válido</p>
            </div>
            <div className="space-y-2">
              <Label>Com erro</Label>
              <Input placeholder="Corrigir" className="border-destructive focus-visible:ring-destructive" defaultValue="email@" />
              <p className="text-sm text-destructive">Email inválido</p>
            </div>
          </div>
        </Section>

        {/* 9 — MODAIS */}
        <Section title="9. Modais">
          <p className="text-sm text-muted-foreground">Componente Dialog reutilizável com título, descrição, conteúdo e ações.</p>
          <div className="flex flex-wrap gap-3">
            {/* modal simples */}
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">Modal simples</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Título do modal</DialogTitle>
                  <DialogDescription>Descrição opcional para contextualizar a ação.</DialogDescription>
                </DialogHeader>
                <p className="text-sm text-foreground">Conteúdo livre do modal.</p>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Confirmar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* modal de confirmação */}
            <Dialog>
              <DialogTrigger asChild><Button variant="destructive">Modal de confirmação</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tem certeza?</DialogTitle>
                  <DialogDescription>Essa ação não pode ser desfeita. O registro será removido permanentemente.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button variant="destructive">Excluir</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* modal com formulário */}
            <Dialog>
              <DialogTrigger asChild><Button variant="secondary">Modal com formulário</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo registro</DialogTitle>
                  <DialogDescription>Preencha os campos abaixo para criar um novo registro.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@exemplo.com" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Section>

        {/* 10 — SHEETS */}
        <Section title="10. Sheets">
          <p className="text-sm text-muted-foreground">Painel lateral ou inferior para ações rápidas.</p>
          <div className="flex flex-wrap gap-3">
            <Sheet>
              <SheetTrigger asChild><Button variant="outline">Sheet lateral direita</Button></SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Detalhes do registro</SheetTitle>
                  <SheetDescription>Informações e ações rápidas.</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Nome" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="Email" />
                  </div>
                </div>
                <SheetFooter>
                  <Button className="w-full">Salvar alterações</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild><Button variant="outline">Sheet inferior</Button></SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Ações rápidas</SheetTitle>
                  <SheetDescription>Escolha uma ação para continuar.</SheetDescription>
                </SheetHeader>
                <div className="py-6 flex flex-wrap gap-3">
                  <Button variant="outline">Editar</Button>
                  <Button variant="outline">Duplicar</Button>
                  <Button variant="destructive">Excluir</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </Section>
      </main>
    </div>
  );
};

export default Components;
