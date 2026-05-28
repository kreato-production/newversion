'use client';

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
import { UserCircle } from 'lucide-react';
import type { JanelaApiItem } from '@/modules/satops/satops.api.repository';

// ─── WhatsApp icon (SVG inline — lucide não inclui) ───────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// ─── WhatsApp helpers ─────────────────────────────────────────────────────────

function buildWhatsAppUrl(phone: string, janela: JanelaApiItem): string {
  // strip everything except digits and leading +
  const clean = phone.replace(/[^\d+]/g, '');
  const evento =
    (janela.tipoEvento === 'Grelha de Programas' ? janela.programaNome : janela.tituloEvento) ||
    janela.canal ||
    '—';

  const lines = [
    `Precisamos de apoio no Evento: ${evento}`,
    `• Satélite: ${janela.sateliteNome || '—'}`,
    `• Abertura Prevista: ${janela.aberturaPrevia || '—'} UTC`,
    `• Fecho Previsto: ${janela.fechoPrevisto || '—'} UTC`,
  ];

  return `https://wa.me/${clean}?text=${encodeURIComponent(lines.join('\n'))}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  janela: JanelaApiItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JanelaResponsaveisModal({ janela, isOpen, onClose }: Props) {
  const responsaveis = janela?.responsaveis ?? [];

  const formatDate = (d: string) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

  const subtitle = janela
    ? [
        janela.dataEvento ? formatDate(janela.dataEvento) : null,
        janela.canal || null,
        janela.sateliteNome || null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[620px] max-w-[620px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Responsáveis da Janela</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        {responsaveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <UserCircle className="h-12 w-12 mb-3 opacity-25" />
            <p className="text-sm font-medium">Sem responsáveis registados</p>
            <p className="text-xs mt-1">Edite a janela para adicionar responsáveis.</p>
          </div>
        ) : (
          <div className="space-y-0 mt-1">
            {responsaveis.map((r, idx) => (
              <div key={r.id}>
                {idx > 0 && <Separator className="my-4" />}
                <div className="flex items-start gap-4">
                  <Avatar className="h-11 w-11 shrink-0 mt-0.5">
                    <AvatarImage src={r.foto ?? undefined} />
                    <AvatarFallback className="text-sm font-bold bg-accent text-accent-foreground">
                      {r.recursoHumanoNome?.charAt(0)?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.recursoHumanoNome || '—'}</span>
                      {r.disponibilidade && (
                        <Badge variant="secondary" className="text-xs">
                          {r.disponibilidade}
                        </Badge>
                      )}
                    </div>

                    {r.recursoTecnicoNome && (
                      <p className="text-xs text-muted-foreground">
                        Recurso Técnico:{' '}
                        <span className="font-medium text-foreground">{r.recursoTecnicoNome}</span>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      {r.telefone && janela && (
                        <span className="flex items-center gap-1.5">
                          <span>Telefone:</span>
                          <span className="font-mono text-foreground">{r.telefone}</span>
                          <a
                            href={buildWhatsAppUrl(r.telefone, janela)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Abrir WhatsApp com ${r.recursoHumanoNome || 'responsável'}`}
                            className="inline-flex items-center text-[#25D366] hover:text-[#128C7E] transition-colors"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </a>
                        </span>
                      )}
                      {r.email && (
                        <span className="truncate">
                          E-mail: <span className="text-foreground">{r.email}</span>
                        </span>
                      )}
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

export default JanelaResponsaveisModal;
