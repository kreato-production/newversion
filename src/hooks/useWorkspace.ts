'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiUnidadesRepository } from '@/modules/unidades/unidades.api.repository';
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';

const STORAGE_KEY = 'kreato_active_unit';

const repo = new ApiUnidadesRepository();

export function useWorkspace() {
  const { user, isAuthenticated } = useAuth();
  const [units, setUnits] = useState<UnidadeNegocio[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch units when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnits([]);
      setActiveUnitId(null);
      return;
    }

    setIsLoading(true);

    repo
      .list()
      .then((allUnits) => {
        const isGlobalAdmin = user.role === 'GLOBAL_ADMIN';
        const userUnits =
          isGlobalAdmin || !user.unidadeIds?.length
            ? allUnits
            : allUnits.filter((u) => user.unidadeIds!.includes(u.id));

        setUnits(userUnits);

        // Restore stored unit or default to first
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        const restoredValid = stored && userUnits.some((u) => u.id === stored);

        if (restoredValid) {
          setActiveUnitId(stored);
        } else if (userUnits.length > 0) {
          const firstId = userUnits[0].id;
          setActiveUnitId(firstId);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, firstId);
          }
        }
      })
      .catch(() => {
        // Workspace switcher is non-critical — fail silently
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, user]);

  const switchUnit = useCallback((unitId: string) => {
    setActiveUnitId(unitId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, unitId);
    }
  }, []);

  const activeUnit = units.find((u) => u.id === activeUnitId) ?? units[0] ?? null;

  return { activeUnit, units, switchUnit, isLoading };
}
