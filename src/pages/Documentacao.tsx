import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Book,
  FileSpreadsheet,
  FileText,
  Settings,
  Zap,
  HelpCircle,
  ChevronRight,
  Download,
  Layers,
} from "lucide-react";

const Documentacao = () => {
  const [activeSection, setActiveSection] = useState("introducao");

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sections = [
    { id: "introducao", label: "Introdução", icon: Book },
    { id: "como-funciona", label: "Como Funciona", icon: Zap },
    { id: "perfil-planilha", label: "Perfil de Planilha", icon: FileSpreadsheet },
    { id: "perfil-documento", label: "Perfil de Documento", icon: FileText },
    { id: "geracao", label: "Geração em Lote", icon: Layers },
    { id: "configuracoes", label: "Configurações", icon: Settings },
    { id: "faq", label: "Perguntas Frequentes", icon: HelpCircle },
  ];

  const content: Record<string, { title: string; content: React.ReactNode }> = {
    introducao: {
      title: "Introdução ao PDF Generator v2.0",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            O PDF Generator v2.0 é um sistema desktop projetado para eliminar tarefas manuais,
            permitindo que você gere centenas de documentos personalizados a partir de uma planilha
            Excel e um modelo PDF.
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            O desafio diário
          </h3>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Tempo Desperdiçado:</strong> Horas gastas preenchendo contratos,
                certificados, relatórios e propostas manualmente.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Erros Humanos:</strong> Alta probabilidade de erros de digitação
                e inconsistências ao copiar e colar dados.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Falta de Padrão:</strong> Documentos com formatações diferentes
                que enfraquecem a identidade visual da sua marca.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Desorganização:</strong> Arquivos gerados espalhados em diversas
                pastas, dificultando a busca e o gerenciamento.
              </div>
            </li>
          </ul>
          <h3 className="text-lg font-semibold text-foreground mt-6">
            A solução definitiva
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Agilidade
                </h4>
                <p className="text-sm text-muted-foreground">
                  Gere documentos em lote com um único clique.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Precisão
                </h4>
                <p className="text-sm text-muted-foreground">
                  Elimine erros humanos. Os dados são inseridos exatamente como estão na planilha.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Profissionalismo
                </h4>
                <p className="text-sm text-muted-foreground">
                  Mantenha a consistência da marca com formatação e estilos padronizados.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    "como-funciona": {
      title: "Como Funciona? Uma jornada simplificada em 3 passos",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Nosso sistema foi construído sobre uma base de simplicidade. Com apenas três configurações
            iniciais, você estará pronto para automatizar todo o seu fluxo de trabalho de documentos.
          </p>
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    1
                  </div>
                  <CardTitle className="text-xl">Crie o Perfil da Planilha</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Ensine o sistema a ler suas planilhas Excel.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Selecione o arquivo Excel de exemplo
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Informe em qual linha começa o cabeçalho
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Mapeie cada coluna: nome original, nome personalizado e tipo de dado
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Você só precisa fazer isso uma vez por tipo de planilha
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    2
                  </div>
                  <CardTitle className="text-xl">Crie o Perfil do Documento</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Aqui é onde a mágica visual acontece. Carregue seu modelo PDF e simplesmente
                  clique nos locais onde as informações da planilha devem ser inseridas.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Importe seu template PDF
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Clique visualmente onde cada informação deve aparecer
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Personalize fonte, tamanho, cor, negrito, itálico e sublinhado
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Visualize em tempo real como o texto ficará antes de salvar
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    3
                  </div>
                  <CardTitle className="text-xl">Gere em Lote</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Com os perfis configurados, o trabalho pesado acabou. Agora, a geração de
                  documentos é um processo instantâneo e automático.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Selecione o perfil de planilha e documento
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Clique em "Gerar PDFs"
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Todos os PDFs são salvos automaticamente em estrutura organizada
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Formato: Documentos/PDF_GENERATOR/ANO/MES/
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    "perfil-planilha": {
      title: "Passo 1: Perfil de Planilha",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            O primeiro passo é configurar como o sistema irá interpretar seus arquivos Excel.
            Você só precisa fazer isso uma vez por cada tipo de planilha.
          </p>

          {/* Screenshot da tela de Perfil de Planilha */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-0">
              <img
                src="/screenshots/perfil-planilha.png"
                alt="Interface de Perfil de Planilha do PDF Generator"
                className="w-full h-auto object-cover"
              />
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold text-foreground">
            Configuração do Perfil
          </h3>

          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  1. Selecione o arquivo Excel
                </h4>
                <p className="text-sm text-muted-foreground">
                  Escolha uma planilha de exemplo que contenha a estrutura que você
                  usará regularmente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  2. Defina a linha do cabeçalho
                </h4>
                <p className="text-sm text-muted-foreground">
                  Informe em qual linha estão os nomes das colunas (geralmente linha 1).
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  3. Mapeie as colunas
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Para cada coluna da planilha, defina:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Coluna Original:</strong> O nome
                      da coluna no Excel (ex: "customer_name")
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Nome Personalizado:</strong> Como
                      você quer chamá-la no sistema (ex: "Nome do Cliente")
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Tipo de Valor:</strong> Formato
                      dos dados (texto, CPF, monetário, data, etc.)
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  4. Salve o perfil
                </h4>
                <p className="text-sm text-muted-foreground">
                  Dê um nome descritivo ao perfil e salve. Você poderá reutilizá-lo
                  quantas vezes quiser.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              <strong>💡 Dica:</strong> Crie perfis diferentes para cada tipo de documento
              que você trabalha (clientes, funcionários, produtos, etc.).
            </p>
          </div>
        </div>
      ),
    },
    "perfil-documento": {
      title: "Passo 2: Perfil de Documento",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Aqui é onde a mágica visual acontece. Carregue seu modelo PDF e simplesmente
            clique nos locais onde as informações da planilha devem ser inseridas.
          </p>

          {/* Screenshot da tela de Perfil de Documento */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-0">
              <img
                src="/screenshots/perfil-documento.png"
                alt="Interface de Perfil de Documento do PDF Generator mostrando editor visual"
                className="w-full h-auto object-cover"
              />
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold text-foreground">
            Editor Visual de Template
          </h3>

          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  1. Carregue seu template PDF
                </h4>
                <p className="text-sm text-muted-foreground">
                  Importe o modelo de documento que você deseja preencher automaticamente.
                  Pode ser um contrato, certificado, relatório, etiqueta ou qualquer PDF.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  2. Selecione a coluna
                </h4>
                <p className="text-sm text-muted-foreground">
                  Escolha qual campo da planilha você quer inserir (baseado no perfil
                  de planilha que você criou).
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  3. Clique no PDF onde o texto deve aparecer
                </h4>
                <p className="text-sm text-muted-foreground">
                  Simplesmente clique na posição exata do documento onde você quer que
                  aquela informação seja inserida.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  4. Personalize o estilo do texto
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Configure a aparência para cada campo:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <strong className="text-foreground">Fonte:</strong> Arial, Times New Roman ou Courier
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <strong className="text-foreground">Tamanho:</strong> Ajuste de 8 a 72 pontos
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <strong className="text-foreground">Formatação:</strong> Negrito, Itálico e Sublinhado
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <strong className="text-foreground">Cor:</strong> Qualquer cor com seletor visual
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  5. Preview em tempo real
                </h4>
                <p className="text-sm text-muted-foreground">
                  Veja como o texto ficará antes mesmo de salvar. Ajuste até ficar perfeito.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              <strong>💡 Dica:</strong> Assuma o controle total da aparência do seu texto.
              Você pode aplicar estilos diferentes para cada campo no mesmo documento.
            </p>
          </div>
        </div>
      ),
    },
    geracao: {
      title: "Passo 3: Geração em Lote",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Com os perfis configurados, o trabalho pesado acabou. Agora, a geração de
            documentos é um processo instantâneo e automático.
          </p>

          {/* Screenshot da tela de Geração em Lote */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-0">
              <img
                src="/screenshots/geracao-pdfs-lote.png"
                alt="Interface de geração em lote de PDFs"
                className="w-full h-auto object-cover"
              />
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Execute a mágica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    1. Selecione o Perfil de Planilha
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Escolha qual perfil de planilha você quer usar.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    2. Selecione o Perfil de Documento
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Escolha qual modelo de PDF será preenchido.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    3. Clique em "Gerar PDFs"
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Pronto! O sistema processará todos os registros da planilha e gerará
                    os PDFs automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold text-foreground">
            Resultado: Organização Automática
          </h3>
          <p className="text-muted-foreground">
            Os PDFs gerados são salvos automaticamente em uma estrutura de pastas organizada:
          </p>
          <Card className="border-border">
            <CardContent className="p-4">
              <code className="text-sm text-foreground">
                Documentos/PDF_GENERATOR/ANO/MÊS/
              </code>
              <p className="text-sm text-muted-foreground mt-3">
                Exemplo: Documentos/PDF_GENERATOR/2026/Janeiro/
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Diga adeus às pastas confusas. Seus documentos ficam organizados por ano
                e mês, prontos para serem enviados ou arquivados.
              </p>
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold text-foreground mt-6">
            Gerenciamento de Documentos
          </h3>
          <p className="text-muted-foreground mb-4">
            O PDF Generator oferece uma interface dedicada para visualizar e gerenciar
            todos os documentos que você já criou:
          </p>

          {/* Screenshot da tela de PDFs Gerados */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden mb-4">
            <CardContent className="p-0">
              <img
                src="/screenshots/pdfs-gerados.png"
                alt="Tela de gerenciamento mostrando lista de PDFs gerados com filtros e ações"
                className="w-full h-auto object-cover"
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  🔍 Busca Rápida
                </h4>
                <p className="text-sm text-muted-foreground">
                  Encontre qualquer documento por nome ou data.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  📅 Filtros Inteligentes
                </h4>
                <p className="text-sm text-muted-foreground">
                  Filtre por ano e mês para localizar rapidamente.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  👁️ Ações Rápidas
                </h4>
                <p className="text-sm text-muted-foreground">
                  Visualize, abra na pasta ou exclua com um clique.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  📊 Histórico Completo
                </h4>
                <p className="text-sm text-muted-foreground">
                  Veja data de criação e acesse tudo facilmente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    configuracoes: {
      title: "Configurações e Portabilidade",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Seus perfis de planilha e documento são o cérebro da sua automação. O PDF Generator
            permite que você os gerencie como ativos valiosos, garantindo segurança e facilitando
            a colaboração.
          </p>

          <h3 className="text-lg font-semibold text-foreground">
            Governança e Portabilidade
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Exportar Perfis (ZIP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Crie um backup completo de todas as suas configurações em um único arquivo ZIP.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Ideal para segurança
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Migrar para novo computador
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Fazer backup periódico
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Importar Perfis (ZIP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Restaure suas configurações ou compartilhe perfis padronizados com outras
                  equipes de forma rápida e segura.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Restaurar backup
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Compartilhar com equipe
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    Padronizar processos
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              <strong>💡 Dica:</strong> Faça backups regulares dos seus perfis. Eles contêm
              todo o trabalho de configuração e são fáceis de restaurar em caso de necessidade.
            </p>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6">
            Formatos e Orientações Suportados
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Formatos de Papel</h4>
              <div className="grid grid-cols-2 gap-2">
                {["A1", "A2", "A3", "A4", "A5", "A6", "Letter", "Legal"].map((format) => (
                  <div key={format} className="rounded border border-border bg-card px-3 py-2 text-center text-sm">
                    {format}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Orientações</h4>
              <div className="space-y-2">
                <div className="rounded border border-border bg-card px-3 py-2 text-sm">
                  📄 Retrato (Vertical)
                </div>
                <div className="rounded border border-border bg-card px-3 py-2 text-sm">
                  📃 Paisagem (Horizontal)
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            O PDF Generator se adapta às suas necessidades. Gere desde pequenos certificados
            e etiquetas até grandes plantas de projeto e relatórios detalhados, tudo com a
            mesma ferramenta e a mesma facilidade.
          </p>
        </div>
      ),
    },
    faq: {
      title: "Perguntas Frequentes",
      content: (
        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">
                Preciso de conexão com a internet para usar?
              </h4>
              <p className="text-sm text-muted-foreground">
                O PDF Generator é um sistema desktop que funciona localmente no seu computador.
                Você só precisa de internet para ativar e verificar a licença. Depois disso,
                pode trabalhar offline normalmente.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">
                Quantos documentos posso gerar de uma vez?
              </h4>
              <p className="text-sm text-muted-foreground">
                Não há limite! O sistema processa quantas linhas sua planilha tiver. Se você
                tem 100, 1.000 ou 10.000 registros, o PDF Generator irá gerar todos os
                documentos automaticamente.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">
                Posso usar fontes personalizadas?
              </h4>
              <p className="text-sm text-muted-foreground">
                Atualmente o sistema suporta três fontes padrão (Arial, Times New Roman e
                Courier), que cobrem a maioria dos casos de uso profissional. Suporte a fontes
                personalizadas está planejado para versões futuras.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">
                Como ativo minha licença?
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Após adquirir seu plano, você receberá uma chave de licença por email. Na
                primeira vez que abrir o PDF Generator, ele solicitará esta chave. Insira-a
                e clique em "Ativar". A licença ficará vinculada ao seu computador.
              </p>
              {/* Screenshot do dialog de ativação */}
              <div className="rounded-lg border border-border overflow-hidden">
                <img
                  src="/screenshots/ativacao-licenca.png"
                  alt="Dialog de ativação de licença do PDF Generator"
                  className="w-full h-auto object-cover"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">
                Posso usar em mais de um computador?
              </h4>
              <p className="text-sm text-muted-foreground">
                Cada licença é vinculada a um computador específico. Se você precisa usar
                em múltiplos computadores, você pode adquirir licenças adicionais ou usar
                a função de desvincular dispositivo no painel de assinaturas para transferir
                a licença.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">
                Meus dados ficam seguros?
              </h4>
              <p className="text-sm text-muted-foreground">
                Sim! O PDF Generator processa tudo localmente no seu computador. Suas planilhas,
                PDFs e documentos gerados nunca saem da sua máquina. Apenas a validação da
                licença é feita online.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">
                Existe compatibilidade entre versões?
              </h4>
              <p className="text-sm text-muted-foreground">
                Sim! Os perfis criados em versões anteriores do sistema são 100% compatíveis
                e carregados automaticamente. Nenhuma perda de dados, nenhuma reconfiguração
                necessária.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-2">
                Como funciona o suporte?
              </h4>
              <p className="text-sm text-muted-foreground">
                Oferecemos suporte por email para todos os planos, o tempo de resposta é de até 24h em dias úteis.
                NÃO é oferecido suporte das 18h de sexta-feira até as 18h de sábado.
              </p>
            </CardContent>
          </Card>
        </div>
      ),
    },
  };

  return (
    <div className="lg:container py-8">
      <div className="mb-8 px-4 lg:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Documentação</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Aprenda a usar o PDF Generator e automatize a criação dos seus documentos.
        </p>
      </div>

      <div className="lg:grid lg:gap-6 lg:grid-cols-[250px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20 border-border">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden mb-4 overflow-x-auto">
          <div className="flex gap-2 px-4 pb-2 min-w-max">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-accent border border-border"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 lg:px-0">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl break-words">{content[activeSection].title}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">{content[activeSection].content}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Documentacao;
