import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db, type SystemVersion } from "@/lib/supabase";
import { Plus, RefreshCw, Save, Edit, Trash2, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const VersoesDoSistema = () => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<SystemVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  const [formIsLatest, setFormIsLatest] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const data = await db.systemVersions.getAll();
      setVersions(data);
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
    setFormIsLatest(version.is_latest);
    setFormIsActive(version.is_active);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const versionData = {
        version: formVersion,
        release_date: formReleaseDate,
        download_url: formDownloadUrl,
        file_size: formFileSize || null,
        release_notes: formReleaseNotes || null,
        minimum_requirements: formMinRequirements || null,
        minimum_processor: formMinProcessor || null,
        is_latest: formIsLatest,
        is_active: formIsActive,
      };

      if (editingVersion) {
        await db.systemVersions.update(editingVersion.id, versionData);
        toast({
          title: "Versão atualizada!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        await db.systemVersions.create(versionData);
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

    try {
      await db.systemVersions.delete(id);
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
    <div className="container py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Versões do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as versões disponíveis para download
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Versão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Versões</CardTitle>
            <Button variant="outline" size="sm" onClick={loadVersions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versão</TableHead>
                <TableHead>Data de Lançamento</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead className="text-center">Mais Recente</TableHead>
                <TableHead className="text-center">Ativa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma versão cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">{version.version}</TableCell>
                    <TableCell>
                      {new Date(version.release_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{version.file_size || "-"}</TableCell>
                    <TableCell className="text-center">
                      {version.is_latest ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {version.is_active ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(version)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(version.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

            <div className="space-y-2">
              <Label htmlFor="minProcessor">Processador Mínimo</Label>
              <Input
                id="minProcessor"
                type="text"
                placeholder="Intel Core i3 ou equivalente"
                value={formMinProcessor}
                onChange={(e) => setFormMinProcessor(e.target.value)}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Requisitos mínimos do processador
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minRequirements">Outros Requisitos Mínimos</Label>
              <Textarea
                id="minRequirements"
                placeholder="Windows 10 ou superior, 4 GB RAM, 500 MB espaço em disco (separados por vírgula ou linha)"
                value={formMinRequirements}
                onChange={(e) => setFormMinRequirements(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Sistema operacional, RAM, espaço em disco, etc.
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
