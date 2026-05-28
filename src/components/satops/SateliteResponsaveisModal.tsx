'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, UserCircle } from 'lucide-react';
import {
  ApiSatOpsRepository,
  type JanelaApiItem,
  type JanelaResponsavel,
} from '@/modules/satops/satops.api.repository';
import type { SateliteItem } from '@/views/satops/Satelites';

interface Props {
  satelite: SateliteItem | null;
  isOpen: boolean;
  onClose: () => void;
}

type ResponsavelComContexto = JanelaResponsavel & {
  janelaId: string;
  janelaData: string;
  janelaCanal: string;
  janelaTipo: string;
};

const repository = new ApiSatOpsRepository();

export function SateliteResponsaveisModal({ satelite, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [responsaveis, setResponsaveis] = useState<ResponsavelComContexto[]>([]);

  useEffect(() => {
    if (!isOpen || !satelite) return;

    setLoading(true);
    repository
      .listJanelas()
      .then((res) => {
        const janelasDoSatelite = res.data.filter((j) => j.sateliteId === satelite.id);

        const lista: ResponsavelComContexto[] = janelasDoSatelite.flatMap((j: JanelaApiItem) =>
          (j.responsaveis ?? []).map((r) => ({
            ...r,
            janelaId: j.id,
            janelaData: j.dataEvento,
            janelaCanal: j.canal,
            janelaTipo: j.tipoEvento,
          })),
        );

        setResponsaveis(lista);
      })
      .catch(() => setResponsaveis([]))
      .finally(() => setLoading(false));
  }, [isOpen, satelite]);

  const formatDate = (d: string) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[680px] max-w-[680px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Responsáveis — {satelite?.nome}</DialogTitle>
          <DialogDescription>
            Responsáveis registados nas janelas de transmissão deste satélite.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : responsaveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <UserCircle className="h-12 w-12 mb-3 opacity-25" />
            <p className="text-sm font-medium">Sem responsáveis registados</p>
            <p className="text-xs mt-1">
              Adicione responsáveis nas janelas associadas a este satélite.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-1">
            {responsaveis.map((r, idx) => (
              <div key={`${r.janelaId}-${r.id}`}>
                {idx > 0 && <Separator className="my-3" />}
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                    <AvatarImage src={r.foto ?? undefined} />
                    <AvatarFallback className="text-sm font-bold">
                      {r.recursoHumanoNome?.charAt(0)?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{r.recursoHumanoNome || '—'}</span>
                      {r.disponibilidade && (
                        <Badge variant="secondary" className="text-xs">
                          {r.disponibilidade}
                        </Badge>
                      )}
                    </div>

                    {r.recursoTecnicoNome && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recurso Técnico:{' '}
                        <span className="font-medium text-foreground">{r.recursoTecnicoNome}</span>
                      </p>
                    )}

                    <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {r.telefone && (
                        <span>
                          📞 <span className="font-mono">{r.telefone}</span>
                        </span>
                      )}
                      {r.email && <span className="truncate">✉️ {r.email}</span>}
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Janela:</span>
                      <Badge variant="outline" className="text-xs font-normal py-0">
                        {formatDate(r.janelaData)}
                        {r.janelaCanal && ` · ${r.janelaCanal}`}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SateliteResponsaveisModal;
