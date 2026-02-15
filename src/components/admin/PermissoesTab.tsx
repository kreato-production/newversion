import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  PermissionItem,
  PerfilPermissoes,
  getPermissionsMatrixWithIds,
  getPerfilPermissionsAsync,
  savePerfilPermissionsAsync,
  createDefaultPermissions,
  getModulos,
} from '@/data/permissionsMatrix';

interface PermissoesTabProps {
  perfilId: string;
  perfilNome: string;
}

interface TreeNode {
  id: string;
  label: string;
  tipo: 'modulo' | 'submodulo1' | 'submodulo2' | 'campo';
  permission: PermissionItem;
  children: TreeNode[];
}

const PermissoesTab = ({ perfilId, perfilNome }: PermissoesTabProps) => {
  const [permissions, setPermissions] = useState<PerfilPermissoes | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!perfilId) return;

    const loadPermissions = async () => {
      let perfilPermissions = await getPerfilPermissionsAsync(perfilId);
      if (!perfilPermissions) {
        perfilPermissions = createDefaultPermissions(perfilId);
        await savePerfilPermissionsAsync(perfilPermissions);
      }

      // Merge missing items from base matrix
      const matrix = getPermissionsMatrixWithIds();
      const existingIds = new Set(perfilPermissions.permissoes.map((p) => p.id));
      const missing = matrix.filter((p) => !existingIds.has(p.id));

      if (missing.length > 0) {
        perfilPermissions = {
          ...perfilPermissions,
          permissoes: [...perfilPermissions.permissoes, ...missing],
        };
        await savePerfilPermissionsAsync(perfilPermissions);
      }

      setPermissions(perfilPermissions);

      // Expande todos os módulos por padrão
      const modulos = getModulos();
      setExpandedNodes(new Set(modulos.map((m) => `modulo_${m}`)));
    };

    loadPermissions();
  }, [perfilId]);

  const buildTree = useMemo((): TreeNode[] => {
    if (!permissions) return [];

    const tree: TreeNode[] = [];
    const modulosMap = new Map<string, TreeNode>();
    const subModulo1Map = new Map<string, TreeNode>();
    const subModulo2Map = new Map<string, TreeNode>();

    permissions.permissoes.forEach((perm) => {
      const moduloKey = perm.modulo;
      const subModulo1Key = `${perm.modulo}_${perm.subModulo1}`;
      const subModulo2Key = `${perm.modulo}_${perm.subModulo1}_${perm.subModulo2}`;

      // Módulo
      if (perm.tipo === 'modulo') {
        const node: TreeNode = {
          id: `modulo_${moduloKey}`,
          label: perm.modulo,
          tipo: 'modulo',
          permission: perm,
          children: [],
        };
        modulosMap.set(moduloKey, node);
        tree.push(node);
      }

      // Sub-módulo 1
      if (perm.tipo === 'submodulo1') {
        const parentNode = modulosMap.get(moduloKey);
        if (parentNode) {
          const node: TreeNode = {
            id: `submodulo1_${subModulo1Key}`,
            label: perm.subModulo1,
            tipo: 'submodulo1',
            permission: perm,
            children: [],
          };
          subModulo1Map.set(subModulo1Key, node);
          parentNode.children.push(node);
        }
      }

      // Sub-módulo 2
      if (perm.tipo === 'submodulo2') {
        const parentNode = subModulo1Map.get(subModulo1Key);
        if (parentNode) {
          const node: TreeNode = {
            id: `submodulo2_${subModulo2Key}`,
            label: perm.subModulo2,
            tipo: 'submodulo2',
            permission: perm,
            children: [],
          };
          subModulo2Map.set(subModulo2Key, node);
          parentNode.children.push(node);
        }
      }

      // Campo
      if (perm.tipo === 'campo') {
        // Determina o pai correto
        let parentNode: TreeNode | undefined;
        
        if (perm.subModulo2 !== '-') {
          parentNode = subModulo2Map.get(subModulo2Key);
        } else if (perm.subModulo1 !== '-') {
          parentNode = subModulo1Map.get(subModulo1Key);
        }

        if (parentNode) {
          const node: TreeNode = {
            id: `campo_${perm.id}`,
            label: perm.campo,
            tipo: 'campo',
            permission: perm,
            children: [],
          };
          parentNode.children.push(node);
        }
      }
    });

    return tree;
  }, [permissions]);

  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return buildTree;

    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map((node) => {
          const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase());
          const filteredChildren = filterNodes(node.children);

          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((node): node is TreeNode => node !== null);
    };

    return filterNodes(buildTree);
  }, [buildTree, searchTerm]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const updatePermission = (
    permissionId: string,
    field: keyof PermissionItem,
    value: boolean | 'visible' | 'invisible'
  ) => {
    if (!permissions) return;

    const updatedPermissions = permissions.permissoes.map((p) =>
      p.id === permissionId ? { ...p, [field]: value } : p
    );

    const newPerfilPermissions: PerfilPermissoes = {
      ...permissions,
      permissoes: updatedPermissions,
    };

    setPermissions(newPerfilPermissions);
    savePerfilPermissionsAsync(newPerfilPermissions);
  };

  const renderPermissionControls = (permission: PermissionItem) => {
    const isSubmodulo = permission.tipo === 'submodulo1' || permission.tipo === 'submodulo2';
    const isCampo = permission.tipo === 'campo';

    return (
      <div className="flex items-center gap-4 ml-auto">
        {/* Ação (Visible/Invisible) - todos os níveis */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              updatePermission(
                permission.id,
                'acao',
                permission.acao === 'visible' ? 'invisible' : 'visible'
              )
            }
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
              permission.acao === 'visible'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {permission.acao === 'visible' ? (
              <>
                <Eye className="h-3 w-3" />
                Visível
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                Invisível
              </>
            )}
          </button>
        </div>

        {/* Incluir / Alterar / Excluir - apenas para sub-módulos */}
        {isSubmodulo && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Switch
                id={`incluir_${permission.id}`}
                checked={permission.incluir}
                onCheckedChange={(checked) =>
                  updatePermission(permission.id, 'incluir', checked)
                }
                className="h-4 w-7"
              />
              <Label htmlFor={`incluir_${permission.id}`} className="text-xs text-muted-foreground">
                Incluir
              </Label>
            </div>

            <div className="flex items-center gap-1.5">
              <Switch
                id={`alterar_${permission.id}`}
                checked={permission.alterar}
                onCheckedChange={(checked) =>
                  updatePermission(permission.id, 'alterar', checked)
                }
                className="h-4 w-7"
              />
              <Label htmlFor={`alterar_${permission.id}`} className="text-xs text-muted-foreground">
                Alterar
              </Label>
            </div>

            <div className="flex items-center gap-1.5">
              <Switch
                id={`excluir_${permission.id}`}
                checked={permission.excluir}
                onCheckedChange={(checked) =>
                  updatePermission(permission.id, 'excluir', checked)
                }
                className="h-4 w-7"
              />
              <Label htmlFor={`excluir_${permission.id}`} className="text-xs text-muted-foreground">
                Excluir
              </Label>
            </div>
          </div>
        )}

        {/* Só Leitura - apenas para campos */}
        {isCampo && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Switch
                id={`readonly_${permission.id}`}
                checked={permission.somenteLeitura}
                onCheckedChange={(checked) =>
                  updatePermission(permission.id, 'somenteLeitura', checked)
                }
                className="h-4 w-7"
              />
              <Label htmlFor={`readonly_${permission.id}`} className="text-xs text-muted-foreground">
                Só Leitura
              </Label>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const paddingLeft = level * 24;

    const getBadgeVariant = (tipo: string) => {
      switch (tipo) {
        case 'modulo':
          return 'default';
        case 'submodulo1':
          return 'secondary';
        case 'submodulo2':
          return 'outline';
        default:
          return 'outline';
      }
    };

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center py-2 px-3 hover:bg-muted/50 rounded-md transition-colors',
            level === 0 && 'bg-muted/30'
          )}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              className="mr-2 p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex items-center gap-2 min-w-0">
            {node.tipo !== 'campo' && (
              <Badge variant={getBadgeVariant(node.tipo)} className="text-[10px] px-1.5 py-0">
                {node.tipo === 'modulo' ? 'Módulo' : node.tipo === 'submodulo1' ? 'Sub 1' : 'Sub 2'}
              </Badge>
            )}
            <span
              className={cn(
                'text-sm truncate',
                node.tipo === 'modulo' && 'font-semibold',
                node.tipo === 'submodulo1' && 'font-medium',
                node.tipo === 'campo' && 'text-muted-foreground'
              )}
            >
              {node.label}
            </span>
          </div>

          {renderPermissionControls(node.permission)}
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (!permissions) {
    return <div className="p-4 text-muted-foreground">Carregando permissões...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matriz de Permissões</h3>
          <p className="text-sm text-muted-foreground">
            Configure as permissões de acesso para o perfil "{perfilNome}"
          </p>
        </div>
        <Input
          placeholder="Buscar módulo ou campo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="border rounded-lg">
        <div className="bg-muted/50 px-4 py-2 border-b">
          <div className="flex items-center text-xs font-medium text-muted-foreground">
            <div className="flex-1">Módulo / Sub-módulo / Campo</div>
            <div className="flex items-center gap-4 ml-auto">
              <span className="w-20 text-center">Ação</span>
              <span className="text-center">Incluir / Alterar / Excluir (Módulos) · Só Leitura (Campos)</span>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="p-2">
            {filteredTree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredTree.map((node) => renderTreeNode(node))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PermissoesTab;
