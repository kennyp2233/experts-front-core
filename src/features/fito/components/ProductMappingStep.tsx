import React, { useMemo, useRef, useState } from 'react';
import {
    Alert, Autocomplete, Box, Button, Chip, CircularProgress, Divider, FormControl, LinearProgress,
    MenuItem, Paper, Select, SelectChangeEvent, Stack, TextField, Typography
} from '@mui/material';
import {
    AutoFixHigh as AutoMatchIcon,
    CheckCircle as CheckIcon,
    History as RememberedIcon,
    Search as SearchIcon,
    WarningAmber as WarningIcon
} from '@mui/icons-material';
import useSWR from 'swr';
import { ProductCatalogItem, ProductMappingRow } from '../types/fito.types';
import { fitoCatalogService } from '../services/fito.service';
import { MappingRowUpdater } from '../hooks/useProductMappings';
import { getErrorMessage } from '../../../shared/utils/errors';
import { logger } from '../../../shared/utils/logger';

const log = logger.createChild('FITO');

const NO_SUBTIPOS: string[] = [];

const rowGrid = {
    display: 'grid',
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '150px 200px minmax(0, 1fr) 130px' },
    columnGap: 1.5,
    rowGap: 1,
    alignItems: 'center',
    px: { xs: 1.5, md: 2 }
} as const;

// ─── Estado de la fila ───────────────────────────────────────────────────────

const StatusChip: React.FC<{ row: ProductMappingRow }> = ({ row }) => {
    if (row.autoMatching) {
        return <Chip size="small" color="info" variant="outlined" icon={<CircularProgress size={12} />} label="Buscando…" />;
    }
    if (row.codigoAgrocalidad) {
        if (row.source === 'recordado') {
            return <Chip size="small" color="success" variant="outlined" icon={<RememberedIcon />} label="Recordado" />;
        }
        return (
            <Chip
                size="small"
                color="success"
                icon={row.source === 'auto' ? <AutoMatchIcon /> : <CheckIcon />}
                label={row.source === 'auto' ? 'Auto' : 'Manual'}
            />
        );
    }
    if (row.notFound) {
        return <Chip size="small" color="warning" variant="outlined" icon={<WarningIcon />} label="Sin coincidencias" />;
    }
    return <Chip size="small" variant="outlined" label="Pendiente" />;
};

// ─── Fila ────────────────────────────────────────────────────────────────────

interface MappingRowItemProps {
    row: ProductMappingRow;
    subtipos: string[];
    subtiposLoading: boolean;
    onSubtipoChange: (code: string, subtipo: string) => void;
    onSelectProduct: (code: string, product: ProductCatalogItem | null) => void;
}

const MappingRowItem: React.FC<MappingRowItemProps> = ({ row, subtipos, subtiposLoading, onSubtipoChange, onSelectProduct }) => {
    const [results, setResults] = useState<ProductCatalogItem[]>([]);
    const [searching, setSearching] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestRef = useRef(0);

    // Valor estable: si cambiara de identidad en cada render, el Autocomplete
    // reescribiría el texto que el usuario está tipeando.
    const value = useMemo<ProductCatalogItem | null>(
        () => (row.codigoAgrocalidad ? { codigoAgrocalidad: row.codigoAgrocalidad, nombreComun: row.nombreComun } : null),
        [row.codigoAgrocalidad, row.nombreComun]
    );
    const options = useMemo(
        () => (value && !results.some(o => o.codigoAgrocalidad === value.codigoAgrocalidad) ? [value, ...results] : results),
        [value, results]
    );
    // Un subtipo recordado que ya no está en el catálogo igual se muestra.
    const subtipoOptions = row.subtipo && !subtipos.includes(row.subtipo) ? [row.subtipo, ...subtipos] : subtipos;

    const search = (text: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        const query = text.trim();
        const subtipo = row.subtipo;
        if (query.length < 2 || !subtipo) {
            requestRef.current += 1;
            setResults([]);
            setSearching(false);
            return;
        }
        timerRef.current = setTimeout(async () => {
            const requestId = ++requestRef.current;
            setSearching(true);
            try {
                const data = await fitoCatalogService.autocompleteProductos(query, subtipo);
                if (requestId === requestRef.current) setResults(data);
            } catch (error) {
                log.warn('Búsqueda de producto falló', error);
                if (requestId === requestRef.current) setResults([]);
            } finally {
                if (requestId === requestRef.current) setSearching(false);
            }
        }, 250);
    };

    const handleSubtipo = (subtipo: string) => {
        setResults([]);
        onSubtipoChange(row.originalCode, subtipo);
    };

    return (
        <Box sx={{ ...rowGrid, py: 1.25 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap title={row.originalCode}>
                    {row.originalCode}
                </Typography>
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <StatusChip row={row} />
                </Box>
            </Stack>
            <FormControl size="small" fullWidth>
                <Select
                    value={row.subtipo}
                    onChange={(e: SelectChangeEvent) => handleSubtipo(e.target.value)}
                    displayEmpty
                    disabled={subtiposLoading && subtipoOptions.length === 0}
                    inputProps={{ 'aria-label': `Subtipo de ${row.originalCode}` }}
                >
                    <MenuItem value="" disabled>
                        <em>{subtiposLoading ? 'Cargando subtipos…' : 'Elegir subtipo…'}</em>
                    </MenuItem>
                    {subtipoOptions.map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Autocomplete
                size="small"
                options={options}
                value={value}
                filterOptions={(x) => x}
                getOptionLabel={(opt) => `${opt.codigoAgrocalidad} - ${opt.nombreComun}`}
                isOptionEqualToValue={(opt, val) => opt.codigoAgrocalidad === val.codigoAgrocalidad}
                onChange={(_, newValue) => onSelectProduct(row.originalCode, newValue)}
                onInputChange={(_, text, reason) => {
                    if (reason === 'input') search(text);
                }}
                loading={searching}
                disabled={!row.subtipo || row.autoMatching}
                noOptionsText={row.subtipo ? 'Escribe para buscar' : 'Elige el subtipo primero'}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={row.subtipo ? 'Buscar código o nombre…' : 'Elige el subtipo primero'}
                        slotProps={{
                            htmlInput: { ...params.inputProps, 'aria-label': `Código Agrocalidad de ${row.originalCode}` },
                            input: {
                                ...params.InputProps,
                                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5 }} fontSize="small" />,
                                endAdornment: (
                                    <>
                                        {searching ? <CircularProgress size={16} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                )
                            }
                        }}
                    />
                )}
            />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <StatusChip row={row} />
            </Box>
        </Box>
    );
};

// ─── Paso 2 ──────────────────────────────────────────────────────────────────

interface ProductMappingStepProps {
    rows: ProductMappingRow[];
    readyCount: number;
    loadingRemembered: boolean;
    onUpdateRow: (code: string, updater: MappingRowUpdater) => void;
}

export const ProductMappingStep: React.FC<ProductMappingStepProps> = ({ rows, readyCount, loadingRemembered, onUpdateRow }) => {
    const {
        data: subtiposData,
        error: subtiposError,
        isLoading: subtiposLoading,
        mutate: reloadSubtipos
    } = useSWR<string[]>('/catalogs/productos/subtipos', fitoCatalogService.getSubtipos);
    const subtipos = subtiposData ?? NO_SUBTIPOS;

    const total = rows.length;
    const allMapped = total > 0 && readyCount === total;
    const pendingRows = rows.filter(r => !r.codigoAgrocalidad);
    const rememberedCount = rows.filter(r => r.source === 'recordado' && r.codigoAgrocalidad).length;
    const globalTargets = pendingRows.length > 0 ? pendingRows : rows;

    // Busca el producto por su código original dentro del subtipo y toma el primer resultado.
    const autoMatch = async (code: string, subtipo: string) => {
        onUpdateRow(code, r => ({ ...r, autoMatching: true, notFound: false }));
        let best: ProductCatalogItem | undefined;
        let failed = false;
        try {
            const results = await fitoCatalogService.autocompleteProductos(code, subtipo);
            best = results[0];
        } catch (error) {
            failed = true;
            log.warn('Auto-mapeo falló', error);
        }
        onUpdateRow(code, r => {
            // Respuesta vieja: el usuario cambió el subtipo o eligió el producto a mano.
            if (!r.autoMatching || r.subtipo !== subtipo) return r;
            if (!best) return { ...r, autoMatching: false, notFound: !failed };
            return {
                ...r,
                codigoAgrocalidad: best.codigoAgrocalidad,
                nombreComun: best.nombreComun,
                matched: true,
                confidence: 0.9,
                source: 'auto',
                autoMatching: false,
                notFound: false
            };
        });
    };

    const handleSubtipoChange = (code: string, subtipo: string) => {
        onUpdateRow(code, r => ({
            ...r,
            subtipo,
            codigoAgrocalidad: '',
            nombreComun: '',
            matched: false,
            confidence: 0,
            source: null,
            notFound: false
        }));
        if (subtipo) void autoMatch(code, subtipo);
    };

    const handleGlobalSubtipo = (subtipo: string) => {
        if (!subtipo) return;
        globalTargets.forEach(r => handleSubtipoChange(r.originalCode, subtipo));
    };

    const handleSelectProduct = (code: string, product: ProductCatalogItem | null) => {
        onUpdateRow(code, r => ({
            ...r,
            codigoAgrocalidad: product?.codigoAgrocalidad || '',
            nombreComun: product?.nombreComun || '',
            matched: !!product,
            confidence: product ? 1.0 : 0,
            source: product ? 'manual' : null,
            autoMatching: false,
            notFound: false
        }));
    };

    const progress = total > 0 ? (readyCount / total) * 100 : 0;

    return (
        <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
            >
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                    Elige el subtipo para buscar el código Agrocalidad o búscalo a mano; el mapeo se recuerda al generar.
                </Typography>
                <FormControl size="small" sx={{ minWidth: 230, flexShrink: 0 }}>
                    <Select
                        value=""
                        displayEmpty
                        onChange={(e: SelectChangeEvent) => handleGlobalSubtipo(e.target.value)}
                        disabled={subtipos.length === 0 || total === 0}
                        inputProps={{ 'aria-label': 'Aplicar subtipo a varios productos' }}
                        renderValue={() => (
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <AutoMatchIcon fontSize="small" color="primary" />
                                <span>{pendingRows.length > 0 ? 'Subtipo para pendientes…' : 'Subtipo para todos…'}</span>
                            </Stack>
                        )}
                    >
                        {subtipos.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>

            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                    <Typography variant="body2" fontWeight={600}>
                        {readyCount} de {total} listos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {loadingRemembered
                            ? 'Buscando mapeos recordados…'
                            : rememberedCount > 0
                                ? `${rememberedCount} recordado${rememberedCount === 1 ? '' : 's'} de generaciones anteriores`
                                : ''}
                    </Typography>
                </Stack>
                <LinearProgress
                    variant={loadingRemembered ? 'indeterminate' : 'determinate'}
                    value={progress}
                    color={allMapped ? 'success' : 'primary'}
                    sx={{ mt: 0.75, height: 6, borderRadius: 3 }}
                />
            </Box>

            {subtiposError && (
                <Alert
                    severity="error"
                    action={<Button color="inherit" size="small" onClick={() => reloadSubtipos()}>Reintentar</Button>}
                >
                    {getErrorMessage(subtiposError, 'No se pudieron cargar los subtipos de producto.')}
                </Alert>
            )}

            <Paper variant="outlined">
                <Box sx={{ ...rowGrid, py: 1, display: { xs: 'none', md: 'grid' }, bgcolor: 'action.hover' }}>
                    {['Código original', 'Subtipo', 'Código Agrocalidad', 'Estado'].map(h => (
                        <Typography key={h} variant="caption" color="text.secondary" fontWeight={600}>{h}</Typography>
                    ))}
                </Box>
                {rows.map((row, index) => (
                    <React.Fragment key={row.originalCode}>
                        {index > 0 && <Divider />}
                        <MappingRowItem
                            row={row}
                            subtipos={subtipos}
                            subtiposLoading={subtiposLoading}
                            onSubtipoChange={handleSubtipoChange}
                            onSelectProduct={handleSelectProduct}
                        />
                    </React.Fragment>
                ))}
                {rows.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                        La guía no tiene productos para mapear.
                    </Typography>
                )}
            </Paper>
        </Stack>
    );
};
