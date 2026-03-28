import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileIcon, Trash2, Download, Loader2, File, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fornecedoresRepository } from '@/modules/fornecedores/fornecedores.repository.provider';
import type { FornecedorArquivo } from '@/modules/fornecedores/fornecedores.types';

interface FornecedorArquivosTabProps {
  fornecedorId: string;
  readOnly?: boolean;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (tipo: string | null) => {
  if (!tipo) return <File className="w-4 h-4" />;
  if (tipo.startsWith('image/')) return 'IMG';
  if (tipo.includes('pdf')) return 'PDF';
  if (tipo.includes('spreadsheet') || tipo.includes('excel')) return 'XLS';
  if (tipo.includes('document') || tipo.includes('word')) return 'DOC';
  if (tipo.includes('video')) return 'VID';
  if (tipo.includes('audio')) return 'AUD';
  if (tipo.includes('zip') || tipo.includes('rar') || tipo.includes('compressed')) return 'ZIP';
  return <File className="w-4 h-4" />;
};

const canPreview = (tipo: string | null): boolean => {
  if (!tipo) return false;
  return tipo.startsWith('image/') || tipo === 'application/pdf';
};

export const FornecedorArquivosTab = ({
  fornecedorId,
  readOnly = false,
}: FornecedorArquivosTabProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [arquivos, setArquivos] = useState<FornecedorArquivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FornecedorArquivo | null>(null);

  const fetchArquivos = useCallback(async () => {
    setIsLoading(true);
    try {
      setArquivos(await fornecedoresRepository.listArquivos(fornecedorId));
    } catch (error) {
      console.error('Error fetching arquivos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar arquivos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fornecedorId, toast]);

  useEffect(() => {
    void fetchArquivos();
  }, [fetchArquivos]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        await fornecedoresRepository.addArquivo(fornecedorId, {
          nome: file.name,
          url: dataUrl,
          tipo: file.type,
          tamanho: file.size,
        });
      }

      toast({ title: 'Sucesso', description: 'Arquivo(s) enviado(s) com sucesso!' });
      await fetchArquivos();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: 'Erro', description: 'Erro ao enviar arquivo', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (arquivo: FornecedorArquivo) => {
    if (!confirm(`Deseja excluir o arquivo "${arquivo.nome}"?`)) return;

    try {
      await fornecedoresRepository.removeArquivo(fornecedorId, arquivo.id);
      toast({ title: 'Excluído', description: 'Arquivo removido com sucesso!' });
      await fetchArquivos();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir arquivo', variant: 'destructive' });
    }
  };

  const handleDownload = (arquivo: FornecedorArquivo) => {
    const link = document.createElement('a');
    link.href = arquivo.url;
    link.download = arquivo.nome;
    link.click();
  };

  const handlePreview = (arquivo: FornecedorArquivo) => {
    if (canPreview(arquivo.tipo)) {
      setPreviewFile(arquivo);
      return;
    }

    handleDownload(arquivo);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Arquivos</h3>
        {!readOnly && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Arquivo
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : arquivos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum arquivo cadastrado</p>
          <p className="text-sm">Clique em "Adicionar Arquivo" para enviar</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24">Tamanho</TableHead>
              <TableHead className="w-32">Data</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {arquivos.map((arquivo) => (
              <TableRow
                key={arquivo.id}
                onDoubleClick={() => handlePreview(arquivo)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>
                  <span className="text-xs font-medium">{getFileIcon(arquivo.tipo)}</span>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {arquivo.nome}
                    {canPreview(arquivo.tipo) && <Eye className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(arquivo.tamanho)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {arquivo.createdAt
                    ? new Date(arquivo.createdAt).toLocaleDateString('pt-BR')
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {canPreview(arquivo.tipo) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePreview(arquivo)}
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(arquivo)}
                      title="Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {!readOnly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(arquivo)}
                        className="text-destructive hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewFile?.nome}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto max-h-[calc(90vh-100px)]">
            {previewFile?.tipo?.startsWith('image/') ? (
              <img
                src={previewFile.url}
                alt={previewFile.nome}
                className="max-w-full h-auto mx-auto"
              />
            ) : previewFile?.tipo === 'application/pdf' ? (
              <iframe src={previewFile.url} className="w-full h-[70vh]" title={previewFile.nome} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
