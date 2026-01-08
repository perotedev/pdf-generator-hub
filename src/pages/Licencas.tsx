import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Key, Copy, Monitor, Laptop, Smartphone, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Licencas = () => {
  const { toast } = useToast();

  const licenses = [
    {
      id: "LIC-001",
      code: "PDFG-PRO-X8K2-M9P4-L3N7",
      status: "Ativa",
      device: "Desktop Windows",
      deviceType: "desktop",
      computerUid: "PC-DESKTOP-4A7B2C",
      activatedAt: "15/01/2025",
      expiresAt: "15/02/2026",
      plan: "Pro",
    },
    {
      id: "LIC-002",
      code: "PDFG-PRO-Z3J8-K7F2-W5M9",
      status: "Ativa",
      device: "MacBook Pro",
      deviceType: "laptop",
      computerUid: "MAC-BOOK-7D8E3F",
      activatedAt: "20/01/2025",
      expiresAt: "15/02/2026",
      plan: "Pro",
    },
    {
      id: "LIC-003",
      code: "PDFG-PRO-Q4R9-T2V6-Y8N1",
      status: "Disponível",
      device: "—",
      deviceType: null,
      computerUid: "—",
      activatedAt: "—",
      expiresAt: "15/02/2026",
      plan: "Pro",
    },
  ];

  const copyLicenseCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "O código da licença foi copiado para a área de transferência.",
    });
  };

  const handleDeactivate = (licenseId: string) => {
    toast({
      title: "Licença desativada",
      description: "O dispositivo foi desvinculado e a licença está disponível novamente.",
    });
  };

  const getDeviceIcon = (type: string | null) => {
    switch (type) {
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      case "laptop":
        return <Laptop className="h-4 w-4" />;
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  const maskLicenseCode = (code: string) => {
    const parts = code.split("-");
    return `${parts[0]}-${parts[1]}-****-****-${parts[4]}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Licenças</h1>
        <p className="text-muted-foreground">
          Gerencie as licenças do PDF Generator vinculadas à sua conta
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Licenças</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
                <Monitor className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Uso</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <Key className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Licenses Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Todas as Licenças</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Código da Licença</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>UID Computador</TableHead>
                  <TableHead>Ativação</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                          {maskLicenseCode(license.code)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyLicenseCode(license.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          license.status === "Ativa"
                            ? "default"
                            : license.status === "Disponível"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {license.device !== "—" ? (
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(license.deviceType)}
                          <span className="text-sm">{license.device}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {license.computerUid !== "—" ? (
                        <code className="text-xs font-mono text-muted-foreground">
                          {license.computerUid}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{license.activatedAt}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{license.expiresAt}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {license.status === "Ativa" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Desativar Licença
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Deseja realmente desativar esta licença do
                                dispositivo "{license.device}"? A licença ficará
                                disponível para uso em outro dispositivo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeactivate(license.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Desativar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-border bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Como ativar uma licença</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Baixe e instale o PDF Generator no seu computador.</p>
          <p>
            2. Ao abrir o aplicativo pela primeira vez, será solicitado o código
            da licença.
          </p>
          <p>
            3. Copie o código de uma licença disponível e cole no campo
            indicado.
          </p>
          <p>
            4. Clique em "Ativar" e aguarde a confirmação. A licença será
            vinculada ao dispositivo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Licencas;
