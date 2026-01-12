import { useState, useEffect } from "react";
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
  RefreshCw,
} from "lucide-react";
import { db, type SystemVersion } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const Downloads = () => {
  const { toast } = useToast();
  const [latestVersion, setLatestVersion] = useState<SystemVersion | null>(null);
  const [previousVersions, setPreviousVersions] = useState<SystemVersion[]>([]);
  const [systemSettings, setSystemSettings] = useState<{
    userManualUrl: string;
    systemDocUrl: string;
    infoVideoUrl: string;
  }>({
    userManualUrl: "",
    systemDocUrl: "",
    infoVideoUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load versions
      const allVersions = await db.systemVersions.getAll();
      const activeVersions = allVersions.filter((v) => v.is_active);

      const latest = activeVersions.find((v) => v.is_latest);
      const previous = activeVersions
        .filter((v) => !v.is_latest)
        .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
        .slice(0, 5);

      setLatestVersion(latest || null);
      setPreviousVersions(previous);

      // Load system settings
      const settings = await db.systemSettings.getAll();
      const userManual = settings.find((s) => s.key === "user_manual_url");
      const systemDoc = settings.find((s) => s.key === "system_documentation_url");
      const infoVideo = settings.find((s) => s.key === "info_video_url");

      setSystemSettings({
        userManualUrl: userManual?.value || "",
        systemDocUrl: systemDoc?.value || "",
        infoVideoUrl: infoVideo?.value || "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!latestVersion) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Downloads</h1>
          <p className="text-muted-foreground">
            Baixe a versão mais recente do PDF Generator ou versões anteriores
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma versão disponível para download no momento.
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Última Versão</CardTitle>
              <Badge className="bg-primary text-primary-foreground">
                v{latestVersion.version}
              </Badge>
            </div>
            <Button
              className="gap-2"
              onClick={() => window.open(latestVersion.download_url, "_blank")}
            >
              <Download className="h-4 w-4" />
              Baixar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Grid - Compacta */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {new Date(latestVersion.release_date).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {latestVersion.file_size || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Windows (64-bit)
              </span>
            </div>
          </div>

          {/* Release Notes - Colapsável */}
          {latestVersion.release_notes && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <details className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold">
                  <span>Novidades nesta versão</span>
                  <span className="text-muted-foreground group-open:rotate-90 transition-transform">▶</span>
                </summary>
                <div className="mt-3 prose prose-sm max-w-none text-muted-foreground [&>*]:text-sm [&_ul]:mt-2 [&_ul]:mb-0">
                  <ReactMarkdown>{latestVersion.release_notes}</ReactMarkdown>
                </div>
              </details>
            </div>
          )}

          {/* Recursos Adicionais */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Recursos Adicionais
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => systemSettings.userManualUrl
                  ? window.open(systemSettings.userManualUrl, "_blank")
                  : null}
                disabled={!systemSettings.userManualUrl}
              >
                <BookOpen className="h-4 w-4" />
                Manual
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => systemSettings.systemDocUrl
                  ? window.open(systemSettings.systemDocUrl, "_blank")
                  : null}
                disabled={!systemSettings.systemDocUrl}
              >
                <FileText className="h-4 w-4" />
                Documentação
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => systemSettings.infoVideoUrl
                  ? window.open(systemSettings.infoVideoUrl, "_blank")
                  : null}
                disabled={!systemSettings.infoVideoUrl}
              >
                <Video className="h-4 w-4" />
                Vídeo
              </Button>
            </div>
            {!systemSettings.userManualUrl && !systemSettings.systemDocUrl && !systemSettings.infoVideoUrl && (
              <p className="text-xs text-muted-foreground mt-2">
                Recursos serão disponibilizados em breve
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Previous Versions */}
      {previousVersions.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Versões Anteriores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previousVersions.map((version) => (
                <div
                  key={version.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">v{version.version}</Badge>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(version.release_date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        {version.file_size || "N/A"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(version.download_url, "_blank")}
                  >
                    <Monitor className="h-4 w-4" />
                    Windows
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Requirements */}
      {(latestVersion.minimum_os || latestVersion.minimum_processor || latestVersion.minimum_ram || latestVersion.minimum_storage || latestVersion.minimum_requirements) && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Requisitos do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl">
              <div className="space-y-2 text-sm text-muted-foreground">
                {latestVersion.minimum_os && (
                  <div>
                    <strong>Sistema Operacional:</strong> {latestVersion.minimum_os}
                  </div>
                )}
                {latestVersion.minimum_processor && (
                  <div>
                    <strong>Processador:</strong> {latestVersion.minimum_processor}
                  </div>
                )}
                {latestVersion.minimum_ram && (
                  <div>
                    <strong>Memória RAM:</strong> {latestVersion.minimum_ram}
                  </div>
                )}
                {latestVersion.minimum_storage && (
                  <div>
                    <strong>Armazenamento:</strong> {latestVersion.minimum_storage}
                  </div>
                )}
                {latestVersion.minimum_requirements && (
                  <div>
                    <strong>Outros:</strong> {latestVersion.minimum_requirements}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Downloads;
