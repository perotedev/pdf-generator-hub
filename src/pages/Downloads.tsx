import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Monitor,
  FileText,
  Calendar,
  HardDrive,
  BookOpen,
  Video,
} from "lucide-react";

const Downloads = () => {
  const latestVersion = {
    version: "2.5.3",
    releaseDate: "08/01/2026",
    size: "125 MB",
    changelog: [
      "Nova engine de renderização mais rápida",
      "Suporte a novos templates de relatórios",
      "Correção de bugs menores",
      "Melhorias de performance",
    ],
  };

  const previousVersions = [
    {
      version: "2.5.2",
      releaseDate: "15/12/2025",
      size: "122 MB",
    },
    {
      version: "2.5.1",
      releaseDate: "01/12/2025",
      size: "120 MB",
    },
    {
      version: "2.5.0",
      releaseDate: "15/11/2025",
      size: "118 MB",
    },
    {
      version: "2.4.5",
      releaseDate: "01/11/2025",
      size: "115 MB",
    },
    {
      version: "2.4.4",
      releaseDate: "15/10/2025",
      size: "112 MB",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Downloads</h1>
        <p className="text-muted-foreground">
          Baixe a versão mais recente do PDF Generator ou versões anteriores
        </p>
      </div>

      {/* Latest Version */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Última Versão</CardTitle>
              <Badge className="bg-primary text-primary-foreground">
                v{latestVersion.version}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium text-foreground">
                  {latestVersion.releaseDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tamanho</p>
                <p className="font-medium text-foreground">
                  {latestVersion.size}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium text-foreground">Instalador</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Novidades nesta versão:
            </h4>
            <ul className="space-y-1">
              {latestVersion.changelog.map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Instalador:
              </h4>
              <Button className="gap-2">
                <Monitor className="h-4 w-4" />
                Windows (64-bit)
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Recursos Adicionais:
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Manual do Usuário (PDF)
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Documentação Técnica (PDF)
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  <Video className="h-4 w-4" />
                  Vídeo Instrutivo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Versions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Versões Anteriores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {previousVersions.map((version) => (
              <div
                key={version.version}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">v{version.version}</Badge>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {version.releaseDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-4 w-4" />
                      {version.size}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Monitor className="h-4 w-4" />
                  Windows
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Requirements */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Requisitos do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Windows
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Windows 10 (64-bit) ou superior</li>
              <li>• 4 GB de RAM (8 GB recomendado)</li>
              <li>• 500 MB de espaço em disco</li>
              <li>• Processador Intel Core i3 ou equivalente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Downloads;
