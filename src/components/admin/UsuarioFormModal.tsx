import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import type { Usuario } from '@/pages/admin/Usuarios';
import { UnidadesNegocioTab } from './UnidadesNegocioTab';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, X, Plus, Trash2, Users, Tv } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Usuario) => void;
  data?: Usuario | null;
  readOnly?: boolean;
}

export const UsuarioFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}: UsuarioFormModalProps) => {
  const { user, session } = useAuth();
  const [perfis, setPerfis] = useState<{ id: string; nome: string }[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<{ id: string; nome: string; sobrenome: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Equipe tab state
  const [equipes, setEquipes] = useState<{ id: string; codigo: string; descricao: string }[]>([]);
  const [usuarioEquipes, setUsuarioEquipes] = useState<{ id: string; equipe_id: string; equipe_codigo: string; equipe_descricao: string }[]>([]);
  const [selectedEquipeId, setSelectedEquipeId] = useState('');

  // Programas tab state
  const [allProgramas, setAllProgramas] = useState<{ id: string; nome: string; unidade_negocio_id: string | null }[]>([]);
  const [usuarioProgramas, setUsuarioProgramas] = useState<{ id: string; programa_id: string; programa_nome: string }[]>([]);
  const [selectedProgramaId, setSelectedProgramaId] = useState('');

  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    email: '',
    usuario: '',
    senha: '',
    foto: '',
    perfil: '',
    perfilId: '',
    descricao: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    tipoAcesso: 'Operacional',
    recursoHumanoId: '',
  });

  // Fetch perfis from Supabase
  const fetchPerfis = useCallback(async () => {
    if (!session) return;
    
    try {
      const { data: perfisData, error } = await supabase
        .from('perfis_acesso')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      setPerfis(perfisData || []);
    } catch (err) {
      console.error('Error fetching perfis:', err);
    }
  }, [session]);

  // Fetch recursos humanos
  const fetchRecursosHumanos = useCallback(async () => {
    if (!session) return;
    try {
      const { data: rhData, error } = await supabase
        .from('recursos_humanos')
        .select('id, nome, sobrenome')
        .order('nome');
      if (error) throw error;
      setRecursosHumanos(rhData || []);
    } catch (err) {
      console.error('Error fetching recursos humanos:', err);
    }
  }, [session]);

  // Fetch equipes
  const fetchEquipes = useCallback(async () => {
    if (!session) return;
    try {
      const { data: eqData, error } = await supabase
        .from('equipes')
        .select('id, codigo, descricao')
        .order('descricao');
      if (error) throw error;
      setEquipes(eqData || []);
    } catch (err) {
      console.error('Error fetching equipes:', err);
    }
  }, [session]);

  // Fetch all programas
  const fetchAllProgramas = useCallback(async () => {
    if (!session) return;
    try {
      const { data: pData, error } = await supabase
        .from('programas')
        .select('id, nome, unidade_negocio_id')
        .order('nome');
      if (error) throw error;
      setAllProgramas(pData || []);
    } catch (err) {
      console.error('Error fetching programas:', err);
    }
  }, [session]);

  // Fetch usuario programas
  const fetchUsuarioProgramas = useCallback(async (usuarioId: string) => {
    try {
      const { data: upData, error } = await supabase
        .from('usuario_programas')
        .select('id, programa_id, programas:programa_id(nome)')
        .eq('usuario_id', usuarioId);
      if (error) throw error;
      setUsuarioProgramas((upData || []).map((up: any) => ({
        id: up.id,
        programa_id: up.programa_id,
        programa_nome: up.programas?.nome || '',
      })));
    } catch (err) {
      console.error('Error fetching usuario programas:', err);
    }
  }, []);

  // Fetch usuario equipes
  const fetchUsuarioEquipes = useCallback(async (usuarioId: string) => {
    try {
      const { data: ueData, error } = await supabase
        .from('usuario_equipes')
        .select('id, equipe_id, equipes:equipe_id(codigo, descricao)')
        .eq('usuario_id', usuarioId);
      if (error) throw error;
      setUsuarioEquipes((ueData || []).map((ue: any) => ({
        id: ue.id,
        equipe_id: ue.equipe_id,
        equipe_codigo: ue.equipes?.codigo || '',
        equipe_descricao: ue.equipes?.descricao || '',
      })));
    } catch (err) {
      console.error('Error fetching usuario equipes:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPerfis();
      fetchRecursosHumanos();
      fetchEquipes();
      fetchAllProgramas();
    }
  }, [isOpen, fetchPerfis, fetchRecursosHumanos, fetchEquipes, fetchAllProgramas]);

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        email: data.email,
        usuario: data.usuario,
        senha: data.senha || '',
        foto: data.foto || '',
        perfil: data.perfil,
        perfilId: data.perfilId || '',
        descricao: data.descricao,
        status: data.status || 'Ativo',
        tipoAcesso: data.tipoAcesso || 'Operacional',
        recursoHumanoId: data.recursoHumanoId || '',
      });
      setFotoPreview(data.foto || null);
      fetchUsuarioEquipes(data.id);
      fetchUsuarioProgramas(data.id);
    } else {
      setFormData({
        codigoExterno: '',
        nome: '',
        email: '',
        usuario: '',
        senha: '',
        foto: '',
        perfil: '',
        perfilId: '',
        descricao: '',
        status: 'Ativo',
        tipoAcesso: 'Operacional',
        recursoHumanoId: '',
      });
      setFotoPreview(null);
      setUsuarioEquipes([]);
      setUsuarioProgramas([]);
    }
    setSelectedEquipeId('');
    setSelectedProgramaId('');
  }, [data, isOpen, fetchUsuarioEquipes, fetchUsuarioProgramas]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFotoPreview(base64);
        setFormData({ ...formData, foto: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = () => {
    setFotoPreview(null);
    setFormData({ ...formData, foto: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddEquipe = async () => {
    if (!selectedEquipeId || !data) return;
    if (usuarioEquipes.some(ue => ue.equipe_id === selectedEquipeId)) {
      toast.error('Equipe já adicionada.');
      return;
    }
    try {
      const { data: inserted, error } = await supabase
        .from('usuario_equipes')
        .insert({ usuario_id: data.id, equipe_id: selectedEquipeId })
        .select('id, equipe_id, equipes:equipe_id(codigo, descricao)')
        .single();
      if (error) throw error;
      setUsuarioEquipes(prev => [...prev, {
        id: inserted.id,
        equipe_id: inserted.equipe_id,
        equipe_codigo: (inserted as any).equipes?.codigo || '',
        equipe_descricao: (inserted as any).equipes?.descricao || '',
      }]);
      setSelectedEquipeId('');
      toast.success('Equipe adicionada!');
    } catch (err) {
      console.error('Error adding equipe:', err);
      toast.error('Erro ao adicionar equipe.');
    }
  };

  const handleRemoveEquipe = async (id: string) => {
    try {
      const { error } = await supabase.from('usuario_equipes').delete().eq('id', id);
      if (error) throw error;
      setUsuarioEquipes(prev => prev.filter(ue => ue.id !== id));
      toast.success('Equipe removida!');
    } catch (err) {
      console.error('Error removing equipe:', err);
      toast.error('Erro ao remover equipe.');
    }
  };

  const handleAddPrograma = async () => {
    if (!selectedProgramaId || !data) return;
    if (usuarioProgramas.some(up => up.programa_id === selectedProgramaId)) {
      toast.error('Programa já adicionado.');
      return;
    }
    try {
      const { data: inserted, error } = await supabase
        .from('usuario_programas')
        .insert({ usuario_id: data.id, programa_id: selectedProgramaId })
        .select('id, programa_id, programas:programa_id(nome)')
        .single();
      if (error) throw error;
      setUsuarioProgramas(prev => [...prev, {
        id: inserted.id,
        programa_id: inserted.programa_id,
        programa_nome: (inserted as any).programas?.nome || '',
      }]);
      setSelectedProgramaId('');
      toast.success('Programa adicionado!');
    } catch (err) {
      console.error('Error adding programa:', err);
      toast.error('Erro ao adicionar programa.');
    }
  };

  const handleRemovePrograma = async (id: string) => {
    try {
      const { error } = await supabase.from('usuario_programas').delete().eq('id', id);
      if (error) throw error;
      setUsuarioProgramas(prev => prev.filter(up => up.id !== id));
      toast.success('Programa removido!');
    } catch (err) {
      console.error('Error removing programa:', err);
      toast.error('Erro ao remover programa.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios para novos usuários
    if (!data) {
      if (!formData.email || !formData.senha || !formData.nome || !formData.usuario) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }
    }
    
    const saveData = {
      id: data?.id || crypto.randomUUID(),
      ...formData,
      perfilId: formData.perfilId || undefined,
      recursoHumanoId: formData.recursoHumanoId || undefined,
      // Manter senha atual se estiver editando e não preencheu nova senha
      senha: formData.senha || data?.senha || '',
      foto: formData.foto || data?.foto || '',
      status: formData.status,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    };
    onSave(saveData);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isCoordenacao = formData.tipoAcesso === 'Coordenação';
  const tabCount = 3 + (isCoordenacao && data ? 1 : 0);

  const gridColsClass = tabCount === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do usuário.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className={`grid w-full ${gridColsClass}`}>
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="unidades" disabled={!data}>Unidades de Negócio</TabsTrigger>
            <TabsTrigger value="programas" disabled={!data}>Programas</TabsTrigger>
            {isCoordenacao && data && (
              <TabsTrigger value="equipes">Equipes</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Foto do usuário */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    <AvatarImage src={fotoPreview || undefined} alt={formData.nome} />
                    <AvatarFallback className="text-lg bg-muted">
                      {formData.nome ? getInitials(formData.nome) : <Camera className="h-6 w-6 text-muted-foreground" />}
                    </AvatarFallback>
                  </Avatar>
                  {fotoPreview && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                      onClick={handleRemoveFoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Foto do Usuário</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {fotoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Máximo 2MB.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuário <span className="text-destructive">*</span></Label>
                  <Input
                    id="usuario"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha <span className="text-destructive">*</span></Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  maxLength={50}
                  required={!data}
                  placeholder={data ? '••••••••' : ''}
                />
                {data && (
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para manter a senha atual
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  <Select
                    value={formData.perfilId}
                    onValueChange={(value) => {
                      const perfilSelecionado = perfis.find(p => p.id === value);
                      setFormData({ 
                        ...formData, 
                        perfilId: value,
                        perfil: perfilSelecionado?.nome || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {perfis.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Acesso</Label>
                  <Select
                    value={formData.tipoAcesso}
                    onValueChange={(value) => setFormData({ ...formData, tipoAcesso: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operacional">Operacional</SelectItem>
                      <SelectItem value="Coordenação">Coordenação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as 'Ativo' | 'Inativo' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recurso Humano</Label>
                  <Select
                    value={formData.recursoHumanoId}
                    onValueChange={(value) => setFormData({ ...formData, recursoHumanoId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a um recurso humano..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {recursosHumanos.map((rh) => (
                        <SelectItem key={rh.id} value={rh.id}>{rh.nome} {rh.sobrenome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  {readOnly ? 'Fechar' : 'Cancelar'}
                </Button>
                {!readOnly && (
                  <Button type="submit" className="gradient-primary hover:opacity-90">
                    Salvar
                  </Button>
                )}
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="unidades">
            {data && <UnidadesNegocioTab usuarioId={data.id} />}
          </TabsContent>

          <TabsContent value="programas">
            {data && (
              <div className="space-y-4 mt-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Selecionar Programa</Label>
                    <SearchableSelect
                      options={allProgramas
                        .filter(p => !usuarioProgramas.some(up => up.programa_id === p.id))
                        .map(p => ({ value: p.id, label: p.nome }))}
                      value={selectedProgramaId}
                      onValueChange={setSelectedProgramaId}
                      placeholder="Selecione um programa..."
                      searchPlaceholder="Pesquisar programa..."
                      emptyMessage="Nenhum programa encontrado."
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddPrograma}
                    disabled={!selectedProgramaId}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {usuarioProgramas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Tv className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum programa vinculado a este usuário.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Programa</TableHead>
                        <TableHead className="w-16">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarioProgramas.map((up) => (
                        <TableRow key={up.id}>
                          <TableCell>{up.programa_nome}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemovePrograma(up.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </TabsContent>

          {isCoordenacao && data && (
            <TabsContent value="equipes">
              <div className="space-y-4 mt-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Selecionar Equipe</Label>
                    <Select value={selectedEquipeId} onValueChange={setSelectedEquipeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma equipe..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipes
                          .filter(eq => !usuarioEquipes.some(ue => ue.equipe_id === eq.id))
                          .map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.codigo} - {eq.descricao}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddEquipe}
                    disabled={!selectedEquipeId}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {usuarioEquipes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma equipe vinculada a este usuário.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-16">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarioEquipes.map((ue) => (
                        <TableRow key={ue.id}>
                          <TableCell className="font-mono">{ue.equipe_codigo}</TableCell>
                          <TableCell>{ue.equipe_descricao}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveEquipe(ue.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
