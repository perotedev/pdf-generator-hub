import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { systemApi, type SystemVersion } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, RefreshCw, Save, Edit, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from "react-markdown";

const VersoesDoSistema = () => {
  const { toast } = useToast();
  const { getAccessToken } = useAuth();
  const [versions, setVersions] = useState<SystemVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<SystemVersion | null>(null);

  // Form values
  const [formVersion, setFormVersion] = useState("");
  const [formReleaseDate, setFormReleaseDate] = useState("");
  const [formDownloadUrl, setFormDownloadUrl] = useState("");
  const [formFileSize, setFormFileSize] = useState("");
  const [formReleaseNotes, setFormReleaseNotes] = useState("");
  const [formMinRequirements, setFormMinRequirements] = useState("");
  const [formMinProcessor, setFormMinProcessor] = useState("");
  const [formMinRam, setFormMinRam] = useState("");
  const [formMinStorage, setFormMinStorage] = useState("");
  const [formMinOs, setFormMinOs] = useState("");
  const [formIsLatest, setFormIsLatest] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      const response = await systemApi.getAllVersions(token);
      setVersions(response.versions || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar versões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormVersion("");
    setFormReleaseDate("");
    setFormDownloadUrl("");
    setFormFileSize("");
    setFormReleaseNotes("");
    setFormMinRequirements("");
    setFormMinProcessor("");
    setFormMinRam("");
    setFormMinStorage("");
    setFormMinOs("");
    setFormIsLatest(false);
    setFormIsActive(true);
    setEditingVersion(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (version: SystemVersion) => {
    setEditingVersion(version);
    setFormVersion(version.version);
    setFormReleaseDate(version.release_date.split('T')[0]); // Format for date input
    setFormDownloadUrl(version.download_url);
    setFormFileSize(version.file_size || "");
    setFormReleaseNotes(version.release_notes || "");
    setFormMinRequirements(version.minimum_requirements || "");
    setFormMinProcessor(version.minimum_processor || "");
    setFormMinRam(version.minimum_ram || "");
    setFormMinStorage(version.minimum_storage || "");
    setFormMinOs(version.minimum_os || "");
    setFormIsLatest(version.is_latest);
    setFormIsActive(version.is_active);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      const versionData = {
        version: formVersion,
        release_date: formReleaseDate,
        download_url: formDownloadUrl,
        file_size: formFileSize || null,
        release_notes: formReleaseNotes || null,
        minimum_requirements: formMinRequirements || null,
        minimum_processor: formMinProcessor || null,
        minimum_ram: formMinRam || null,
        minimum_storage: formMinStorage || null,
        minimum_os: formMinOs || null,
        is_latest: formIsLatest,
        is_active: formIsActive,
      };

      if (editingVersion) {
        await systemApi.updateVersion(token, editingVersion.id, versionData);
        toast({
          title: "Versão atualizada!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        await systemApi.createVersion(token, versionData as any);
        toast({
          title: "Versão criada!",
          description: "A nova versão foi adicionada com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadVersions();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar versão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta versão?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      await systemApi.deleteVersion(token, id);
      toast({
        title: "Versão excluída!",
        description: "A versão foi removida com sucesso.",
      });
      await loadVersions();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir versão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Versões do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie as versões disponíveis para download
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Versão
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Versões</h2>
          <Button variant="outline" size="sm" onClick={loadVersions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {versions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma versão cadastrada
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {versions.map((version) => (
              <Card
                key={version.id}
                className={version.is_latest ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent" : ""}
              >
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {/* Header with Version and Actions */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">v{version.version}</h3>
                        {version.is_latest && (
                          <Badge className="bg-primary text-primary-foreground">
                            Mais Recente
                          </Badge>
                        )}
                        {version.is_active ? (
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-400 text-gray-400">
                            Inativa
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(version)}
                          title="Editar versão"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(version.id)}
                          title="Excluir versão"
                          disabled={isDeleting === version.id}
                        >
                          {isDeleting === version.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Date and Size */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Data:</span>
                        {new Date(version.release_date).toLocaleDateString('pt-BR')}
                      </div>
                      {version.file_size && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Tamanho:</span>
                          {version.file_size}
                        </div>
                      )}
                    </div>

                    {/* Collapsible Release Notes */}
                    {version.release_notes && (
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <details className="group">
                          <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold">
                            <span>Notas de Lançamento</span>
                            <span className="text-muted-foreground group-open:rotate-90 transition-transform">▶</span>
                          </summary>
                          <div className="mt-3 prose prose-sm max-w-none text-muted-foreground [&>*]:text-sm [&_ul]:mt-2 [&_ul]:mb-0">
                            <ReactMarkdown>{version.release_notes}</ReactMarkdown>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog para criar/editar versão */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVersion ? "Editar Versão" : "Adicionar Nova Versão"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versão *</Label>
                <Input
                  id="version"
                  placeholder="Ex: 1.0.0"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseDate">Data de Lançamento *</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={formReleaseDate}
                  onChange={(e) => setFormReleaseDate(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="downloadUrl">URL de Download *</Label>
              <Input
                id="downloadUrl"
                type="url"
                placeholder="https://exemplo.com/download/versao.exe"
                value={formDownloadUrl}
                onChange={(e) => setFormDownloadUrl(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileSize">Tamanho do Arquivo</Label>
              <Input
                id="fileSize"
                placeholder="Ex: 45 MB"
                value={formFileSize}
                onChange={(e) => setFormFileSize(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseNotes">Notas de Lançamento (Markdown)</Label>
              <Textarea
                id="releaseNotes"
                placeholder="## Novidades&#10;- Nova funcionalidade X&#10;- Correção do bug Y&#10;&#10;## Melhorias&#10;- Performance aprimorada"
                value={formReleaseNotes}
                onChange={(e) => setFormReleaseNotes(e.target.value)}
                disabled={isSaving}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Markdown para formatar as notas de lançamento
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minOs">Sistema Operacional</Label>
                <Input
                  id="minOs"
                  type="text"
                  placeholder="Windows 10 ou superior"
                  value={formMinOs}
                  onChange={(e) => setFormMinOs(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minProcessor">Processador</Label>
                <Input
                  id="minProcessor"
                  type="text"
                  placeholder="Intel Core i3 ou equivalente"
                  value={formMinProcessor}
                  onChange={(e) => setFormMinProcessor(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRam">Memória RAM</Label>
                <Input
                  id="minRam"
                  type="text"
                  placeholder="4 GB"
                  value={formMinRam}
                  onChange={(e) => setFormMinRam(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStorage">Armazenamento</Label>
                <Input
                  id="minStorage"
                  type="text"
                  placeholder="500 MB"
                  value={formMinStorage}
                  onChange={(e) => setFormMinStorage(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minRequirements">Outros Requisitos (Opcional)</Label>
              <Input
                id="minRequirements"
                type="text"
                placeholder="Placa de vídeo dedicada, DirectX 11, etc."
                value={formMinRequirements}
                onChange={(e) => setFormMinRequirements(e.target.value)}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Requisitos adicionais não contemplados acima
              </p>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLatest"
                  checked={formIsLatest}
                  onCheckedChange={(checked) => setFormIsLatest(checked as boolean)}
                  disabled={isSaving}
                />
                <Label htmlFor="isLatest" className="cursor-pointer">
                  Marcar como versão mais recente
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formIsActive}
                  onCheckedChange={(checked) => setFormIsActive(checked as boolean)}
                  disabled={isSaving}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Versão ativa (visível para usuários)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingVersion ? "Salvar Alterações" : "Criar Versão"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VersoesDoSistema;
