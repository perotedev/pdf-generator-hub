import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, DollarSign, Package, Link as LinkIcon, Trash2, Edit2, Plus, Save, Users, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface SystemVersion {
  id: string;
  version: string;
  releaseDate: string;
  downloadUrl: string;
  changelog: string;
  size: string;
}

interface ResourceLink {
  id: string;
  type: "manual" | "documentation" | "video";
  name: string;
  url: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [editingPrices, setEditingPrices] = useState(false);
  const [addVersionDialog, setAddVersionDialog] = useState(false);
  const [editVersionDialog, setEditVersionDialog] = useState(false);
  const [addResourceDialog, setAddResourceDialog] = useState(false);
  const [editResourceDialog, setEditResourceDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<SystemVersion | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceLink | null>(null);

  // Preços dos planos
  const [monthlyPrice, setMonthlyPrice] = useState("49");
  const [annualPrice, setAnnualPrice] = useState("39");
  const [maxInstallments, setMaxInstallments] = useState("12");

  // Valores iniciais dos preços (para restaurar ao cancelar)
  const [initialMonthlyPrice, setInitialMonthlyPrice] = useState("49");
  const [initialAnnualPrice, setInitialAnnualPrice] = useState("39");
  const [initialMaxInstallments, setInitialMaxInstallments] = useState("12");

  // Versões do sistema
  const [versions, setVersions] = useState<SystemVersion[]>([
    {
      id: "1",
      version: "2.5.3",
      releaseDate: "08/01/2026",
      downloadUrl: "https://example.com/download/v2.5.3",
      changelog: "Correções de bugs e melhorias de performance",
      size: "125 MB",
    },
    {
      id: "2",
      version: "2.5.2",
      releaseDate: "15/12/2025",
      downloadUrl: "https://example.com/download/v2.5.2",
      changelog: "Novas funcionalidades de templates",
      size: "123 MB",
    },
  ]);

  // Links de recursos
  const [resources, setResources] = useState<ResourceLink[]>([
    {
      id: "1",
      type: "manual",
      name: "Manual do Usuário",
      url: "https://example.com/manual.pdf",
    },
    {
      id: "2",
      type: "documentation",
      name: "Documentação Técnica",
      url: "https://example.com/docs.pdf",
    },
    {
      id: "3",
      type: "video",
      name: "Vídeo Instrutivo",
      url: "https://youtube.com/watch?v=example",
    },
  ]);

  // Form states
  const [versionForm, setVersionForm] = useState({
    version: "",
    releaseDate: "",
    downloadUrl: "",
    changelog: "",
    size: "",
  });

  const [resourceForm, setResourceForm] = useState({
    type: "manual" as "manual" | "documentation" | "video",
    name: "",
    url: "",
  });

  const handleStartEditingPrices = () => {
    setInitialMonthlyPrice(monthlyPrice);
    setInitialAnnualPrice(annualPrice);
    setInitialMaxInstallments(maxInstallments);
    setEditingPrices(true);
  };

  const handleSavePrices = () => {
    toast({
      title: "Preços atualizados!",
      description: "Os novos valores foram salvos com sucesso.",
    });
    setEditingPrices(false);
  };

  const handleCancelPricesEdit = () => {
    setMonthlyPrice(initialMonthlyPrice);
    setAnnualPrice(initialAnnualPrice);
    setMaxInstallments(initialMaxInstallments);
    setEditingPrices(false);
  };

  const handleAddVersion = () => {
    const newVersion: SystemVersion = {
      id: Date.now().toString(),
      ...versionForm,
    };
    setVersions([newVersion, ...versions]);
    setAddVersionDialog(false);
    setVersionForm({ version: "", releaseDate: "", downloadUrl: "", changelog: "", size: "" });
    toast({
      title: "Versão adicionada!",
      description: `Versão ${newVersion.version} foi cadastrada com sucesso.`,
    });
  };

  const handleEditVersion = () => {
    if (selectedVersion) {
      setVersions(
        versions.map((v) =>
          v.id === selectedVersion.id ? { ...selectedVersion, ...versionForm } : v
        )
      );
      setEditVersionDialog(false);
      setSelectedVersion(null);
      setVersionForm({ version: "", releaseDate: "", downloadUrl: "", changelog: "", size: "" });
      toast({
        title: "Versão atualizada!",
        description: "As informações foram atualizadas com sucesso.",
      });
    }
  };

  const handleDeleteVersion = (id: string) => {
    setVersions(versions.filter((v) => v.id !== id));
    toast({
      title: "Versão removida!",
      description: "A versão foi excluída com sucesso.",
    });
  };

  const handleAddResource = () => {
    const newResource: ResourceLink = {
      id: Date.now().toString(),
      ...resourceForm,
    };
    setResources([...resources, newResource]);
    setAddResourceDialog(false);
    setResourceForm({ type: "manual", name: "", url: "" });
    toast({
      title: "Recurso adicionado!",
      description: `${newResource.name} foi cadastrado com sucesso.`,
    });
  };

  const handleEditResource = () => {
    if (selectedResource) {
      setResources(
        resources.map((r) =>
          r.id === selectedResource.id ? { ...selectedResource, ...resourceForm } : r
        )
      );
      setEditResourceDialog(false);
      setSelectedResource(null);
      setResourceForm({ type: "manual", name: "", url: "" });
      toast({
        title: "Recurso atualizado!",
        description: "As informações foram atualizadas com sucesso.",
      });
    }
  };

  const handleDeleteResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
    toast({
      title: "Recurso removido!",
      description: "O recurso foi excluído com sucesso.",
    });
  };

  const openEditVersion = (version: SystemVersion) => {
    setSelectedVersion(version);
    setVersionForm({
      version: version.version,
      releaseDate: version.releaseDate,
      downloadUrl: version.downloadUrl,
      changelog: version.changelog,
      size: version.size,
    });
    setEditVersionDialog(true);
  };

  const openEditResource = (resource: ResourceLink) => {
    setSelectedResource(resource);
    setResourceForm({
      type: resource.type,
      name: resource.name,
      url: resource.url,
    });
    setEditResourceDialog(true);
  };

  const getResourceTypeName = (type: string) => {
    const types = {
      manual: "Manual do Usuário",
      documentation: "Documentação Técnica",
      video: "Vídeo Instrutivo",
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground">
          Gerencie configurações do sistema, preços e versões
        </p>
      </div>

      {/* Acesso Rápido */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/dashboard/admin/usuarios">
          <Card className="border-border hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Gerenciar Usuários</CardTitle>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie usuários, permissões, licenças e dispositivos vinculados
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Settings className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Configurações</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure preços, versões do sistema e recursos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuração de Preços */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Preços dos Planos</CardTitle>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {editingPrices && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelPricesEdit}
                >
                  Cancelar
                </Button>
              )}
              <Button
                variant={editingPrices ? "default" : "outline"}
                size="sm"
                onClick={() => (editingPrices ? handleSavePrices() : handleStartEditingPrices())}
              >
                {editingPrices ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Plano Mensal (R$)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                disabled={!editingPrices}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualPrice">Plano Anual (R$/mês)</Label>
              <Input
                id="annualPrice"
                type="number"
                value={annualPrice}
                onChange={(e) => setAnnualPrice(e.target.value)}
                disabled={!editingPrices}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxInstallments">Máximo de Parcelas</Label>
              <Input
                id="maxInstallments"
                type="number"
                value={maxInstallments}
                onChange={(e) => setMaxInstallments(e.target.value)}
                disabled={!editingPrices}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Versões do Sistema */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Versões do Sistema</CardTitle>
            </div>
            <Button size="sm" onClick={() => setAddVersionDialog(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Versão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {versions.map((version) => (
              <Card key={version.id} className="border-border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="secondary" className="text-sm">{version.version}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">{version.releaseDate}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{version.size}</div>
                    </div>
                    <div className="text-xs text-muted-foreground break-all">
                      <span className="font-medium">Link:</span>{" "}
                      <a
                        href={version.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {version.downloadUrl}
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditVersion(version)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteVersion(version.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Versão</TableHead>
                  <TableHead>Data de Lançamento</TableHead>
                  <TableHead className="hidden lg:table-cell">Tamanho</TableHead>
                  <TableHead className="hidden lg:table-cell">Link de Download</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      <Badge variant="secondary">{version.version}</Badge>
                    </TableCell>
                    <TableCell>{version.releaseDate}</TableCell>
                    <TableCell className="hidden lg:table-cell">{version.size}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <a
                        href={version.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm truncate block max-w-xs"
                      >
                        {version.downloadUrl}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditVersion(version)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVersion(version.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Links de Recursos */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Links de Recursos</CardTitle>
            </div>
            <Button size="sm" onClick={() => setAddResourceDialog(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Recurso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="border-border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Badge variant="outline" className="text-xs mb-2">{getResourceTypeName(resource.type)}</Badge>
                        <p className="text-sm font-medium">{resource.name}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground break-all">
                      <span className="font-medium">URL:</span>{" "}
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {resource.url}
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditResource(resource)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteResource(resource.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden lg:table-cell">URL</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{getResourceTypeName(resource.type)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm truncate block max-w-xs"
                      >
                        {resource.url}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditResource(resource)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResource(resource.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Versão */}
      <Dialog open={addVersionDialog} onOpenChange={setAddVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Versão</DialogTitle>
            <DialogDescription>
              Cadastre uma nova versão do sistema com link de download.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newVersion">Versão</Label>
              <Input
                id="newVersion"
                placeholder="Ex: 2.6.0"
                value={versionForm.version}
                onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newReleaseDate">Data de Lançamento</Label>
              <Input
                id="newReleaseDate"
                placeholder="Ex: 15/02/2026"
                value={versionForm.releaseDate}
                onChange={(e) => setVersionForm({ ...versionForm, releaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newSize">Tamanho</Label>
              <Input
                id="newSize"
                placeholder="Ex: 130 MB"
                value={versionForm.size}
                onChange={(e) => setVersionForm({ ...versionForm, size: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newDownloadUrl">Link de Download</Label>
              <Input
                id="newDownloadUrl"
                placeholder="https://..."
                value={versionForm.downloadUrl}
                onChange={(e) => setVersionForm({ ...versionForm, downloadUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newChangelog">Changelog</Label>
              <Textarea
                id="newChangelog"
                placeholder="Descreva as mudanças desta versão..."
                value={versionForm.changelog}
                onChange={(e) => setVersionForm({ ...versionForm, changelog: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVersionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddVersion}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Versão */}
      <Dialog open={editVersionDialog} onOpenChange={setEditVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Versão</DialogTitle>
            <DialogDescription>
              Atualize as informações da versão {selectedVersion?.version}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editVersion">Versão</Label>
              <Input
                id="editVersion"
                value={versionForm.version}
                onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editReleaseDate">Data de Lançamento</Label>
              <Input
                id="editReleaseDate"
                value={versionForm.releaseDate}
                onChange={(e) => setVersionForm({ ...versionForm, releaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSize">Tamanho</Label>
              <Input
                id="editSize"
                value={versionForm.size}
                onChange={(e) => setVersionForm({ ...versionForm, size: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDownloadUrl">Link de Download</Label>
              <Input
                id="editDownloadUrl"
                value={versionForm.downloadUrl}
                onChange={(e) => setVersionForm({ ...versionForm, downloadUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editChangelog">Changelog</Label>
              <Textarea
                id="editChangelog"
                value={versionForm.changelog}
                onChange={(e) => setVersionForm({ ...versionForm, changelog: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVersionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditVersion}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Adicionar Recurso */}
      <Dialog open={addResourceDialog} onOpenChange={setAddResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Recurso</DialogTitle>
            <DialogDescription>
              Cadastre um novo link de recurso para os usuários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newResourceType">Tipo</Label>
              <select
                id="newResourceType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={resourceForm.type}
                onChange={(e) =>
                  setResourceForm({
                    ...resourceForm,
                    type: e.target.value as "manual" | "documentation" | "video",
                  })
                }
              >
                <option value="manual">Manual do Usuário</option>
                <option value="documentation">Documentação Técnica</option>
                <option value="video">Vídeo Instrutivo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newResourceName">Nome</Label>
              <Input
                id="newResourceName"
                placeholder="Ex: Manual Completo v2.0"
                value={resourceForm.name}
                onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newResourceUrl">URL</Label>
              <Input
                id="newResourceUrl"
                placeholder="https://..."
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddResourceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddResource}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Recurso */}
      <Dialog open={editResourceDialog} onOpenChange={setEditResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Recurso</DialogTitle>
            <DialogDescription>
              Atualize as informações do recurso {selectedResource?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editResourceType">Tipo</Label>
              <select
                id="editResourceType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={resourceForm.type}
                onChange={(e) =>
                  setResourceForm({
                    ...resourceForm,
                    type: e.target.value as "manual" | "documentation" | "video",
                  })
                }
              >
                <option value="manual">Manual do Usuário</option>
                <option value="documentation">Documentação Técnica</option>
                <option value="video">Vídeo Instrutivo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editResourceName">Nome</Label>
              <Input
                id="editResourceName"
                value={resourceForm.name}
                onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editResourceUrl">URL</Label>
              <Input
                id="editResourceUrl"
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditResourceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditResource}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
