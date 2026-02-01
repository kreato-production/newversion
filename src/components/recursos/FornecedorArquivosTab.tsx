import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileIcon, Trash2, Download, Loader2, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FornecedorArquivo {
  id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  created_at: string;
}

interface FornecedorArquivosTabProps {
  fornecedorId: string;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (tipo: string | null) => {
  if (!tipo) return <File className="w-4 h-4" />;
  if (tipo.startsWith('image/')) return '🖼️';
  if (tipo.includes('pdf')) return '📄';
  if (tipo.includes('spreadsheet') || tipo.includes('excel')) return '📊';
  if (tipo.includes('document') || tipo.includes('word')) return '📝';
  if (tipo.includes('video')) return '🎬';
  if (tipo.includes('audio')) return '🎵';
  if (tipo.includes('zip') || tipo.includes('rar') || tipo.includes('compressed')) return '📦';
  return <File className="w-4 h-4" />;
};

export const FornecedorArquivosTab = ({ fornecedorId }: FornecedorArquivosTabProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [arquivos, setArquivos] = useState<FornecedorArquivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchArquivos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fornecedor_arquivos')
        .select('*')
        .eq('fornecedor_id', fornecedorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArquivos(data || []);
    } catch (error) {
      console.error('Error fetching arquivos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar arquivos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArquivos();
  }, [fornecedorId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${fornecedorId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('fornecedores')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('fornecedores')
          .getPublicUrl(fileName);

        // Save reference to database
        const { error: dbError } = await supabase
          .from('fornecedor_arquivos')
          .insert({
            fornecedor_id: fornecedorId,
            nome: file.name,
            url: urlData.publicUrl,
            tipo: file.type,
            tamanho: file.size,
          });

        if (dbError) throw dbError;
      }

      toast({ title: 'Sucesso', description: 'Arquivo(s) enviado(s) com sucesso!' });
      fetchArquivos();
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
      // Extract file path from URL
      const urlParts = arquivo.url.split('/fornecedores/');
      const filePath = urlParts[1] ? decodeURIComponent(urlParts[1]) : null;

      if (filePath) {
        // Delete from storage
        await supabase.storage.from('fornecedores').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('fornecedor_arquivos')
        .delete()
        .eq('id', arquivo.id);

      if (error) throw error;

      toast({ title: 'Excluído', description: 'Arquivo removido com sucesso!' });
      fetchArquivos();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir arquivo', variant: 'destructive' });
    }
  };

  const handleDownload = (arquivo: FornecedorArquivo) => {
    window.open(arquivo.url, '_blank');
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Arquivos</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
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
              <TableRow key={arquivo.id}>
                <TableCell>
                  <span className="text-lg">{getFileIcon(arquivo.tipo)}</span>
                </TableCell>
                <TableCell className="font-medium">{arquivo.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(arquivo.tamanho)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(arquivo.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(arquivo)}
                      title="Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(arquivo)}
                      className="text-destructive hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
