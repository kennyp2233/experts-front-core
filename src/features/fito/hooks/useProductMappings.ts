import { useCallback, useMemo, useState } from 'react';
import { FitoGuiaHija, ProductMappingRow } from '../types/fito.types';
import { useRememberedMappings } from './useFito';
import { distinctProductCodes, emptyMappingRow, rememberedMappingRow } from '../utils/fito.utils';

export type MappingRowUpdater = (row: ProductMappingRow) => ProductMappingRow;

const normalizeCode = (code: string) => code.trim().toUpperCase();

/**
 * Estado del mapeo de productos del asistente FITO.
 *
 * Cada fila = un código de producto distinto de las hijas. La fila efectiva es
 * (en orden): lo que el usuario cambió en esta sesión > el mapeo recordado por
 * el back > vacía. Se deriva sin efectos, así que no hay sincronizaciones ni
 * renders en cascada, y el trabajo no se pierde al volver de un paso a otro.
 */
export function useProductMappings(hijas: FitoGuiaHija[], enabled: boolean) {
    const codes = useMemo(() => distinctProductCodes(hijas), [hijas]);
    const { remembered, isLoading } = useRememberedMappings(codes, enabled);
    const [overrides, setOverrides] = useState<Record<string, ProductMappingRow>>({});

    const baseRows = useMemo(() => {
        const byCode = new Map(
            remembered
                .filter(m => m && m.proCodigo && m.codigoAgrocalidad)
                .map(m => [normalizeCode(m.proCodigo), m] as const)
        );
        const base: Record<string, ProductMappingRow> = {};
        codes.forEach(code => {
            const m = byCode.get(normalizeCode(code));
            base[code] = m ? { ...rememberedMappingRow(m), originalCode: code } : emptyMappingRow(code);
        });
        return base;
    }, [codes, remembered]);

    const rows = useMemo(
        () => codes.map(code => overrides[code] ?? baseRows[code]),
        [codes, overrides, baseRows]
    );

    const updateRow = useCallback((code: string, updater: MappingRowUpdater) => {
        setOverrides(prev => {
            const current = prev[code] ?? baseRows[code] ?? emptyMappingRow(code);
            const next = updater(current);
            return next === current ? prev : { ...prev, [code]: next };
        });
    }, [baseRows]);

    const reset = useCallback(() => setOverrides({}), []);

    const readyCount = rows.filter(r => r.codigoAgrocalidad).length;

    return {
        rows,
        readyCount,
        allMapped: rows.length > 0 && readyCount === rows.length,
        loadingRemembered: isLoading,
        updateRow,
        reset
    };
}
