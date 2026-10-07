import React, { useEffect, useState } from 'react';
import {
    Autocomplete, Box, Button, Chip, FormControl, FormHelperText, InputLabel, MenuItem, Paper, Select,
    Stack, TextField, Typography
} from '@mui/material';
import {
    Check as DoneIcon,
    EditOutlined as EditIcon,
    FlightTakeoff as RouteIcon,
    Person as ConsigneeIcon,
    Search as SearchIcon,
    Assignment as RequestIcon
} from '@mui/icons-material';
import useSWR from 'swr';
import { fitoCatalogService } from '../services/fito.service';
import { FitoGuide, FitoXmlConfig, PuertoEcuador, PuertoInternacional, USOS_PREVISTOS } from '../types/fito.types';
import { ConfigGroupKey, PUERTO_DESTINO_LABEL, puertoLabel, usoPrevistoLabel } from '../utils/fito.utils';
import { formatDate } from '../../../shared/utils/format';
import { SummaryItem } from './SummaryItem';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// ─── Grupo con resumen de solo lectura + edición ─────────────────────────────

interface ConfigGroupProps {
    title: string;
    icon: React.ReactNode;
    missing: string[];
    open: boolean;
    onToggle: (open: boolean) => void;
    summary: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
}

const ConfigGroup: React.FC<ConfigGroupProps> = ({ title, icon, missing, open, onToggle, summary, footer, children }) => {
    const incomplete = missing.length > 0;
    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 1.5, sm: 2 },
                borderColor: incomplete ? 'warning.main' : 'divider',
                borderLeftWidth: incomplete ? 4 : 1
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', color: incomplete ? 'warning.main' : 'text.secondary' }}>{icon}</Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1, minWidth: 0 }}>
                    {title}
                </Typography>
                {incomplete && <Chip size="small" color="warning" variant="outlined" label="Incompleto" />}
                <Button
                    size="small"
                    startIcon={open ? <DoneIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    onClick={() => onToggle(!open)}
                >
                    {open ? 'Listo' : incomplete ? 'Completar' : 'Editar'}
                </Button>
            </Stack>
            {open ? <Stack spacing={2}>{children}</Stack> : summary}
            {footer}
        </Paper>
    );
};

const summaryGrid = {
    display: 'grid',
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' },
    gap: 1.5
} as const;

// ─── Autocomplete de puerto destino ──────────────────────────────────────────

interface DestinoAutocompleteProps {
    value: PuertoInternacional | null;
    suggestions: PuertoInternacional[];
    resolving: boolean;
    onSelect: (puerto: PuertoInternacional | null) => void;
}

const DestinoAutocomplete: React.FC<DestinoAutocompleteProps> = ({ value, suggestions, resolving, onSelect }) => {
    // Texto que escribió el usuario (no el label de la opción elegida): solo eso dispara búsquedas.
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query.trim(), 300);
    const { data: results, isLoading } = useSWR<PuertoInternacional[]>(
        debouncedQuery.length >= 2 ? ['/catalogs/puertos/search', debouncedQuery] : null,
        () => fitoCatalogService.searchPuertosInternacionales(debouncedQuery),
        { keepPreviousData: true }
    );

    const base = query.trim().length >= 2 ? results ?? [] : suggestions;
    const options = value && !base.some(p => p.codigoPuerto === value.codigoPuerto) ? [value, ...base] : base;

    return (
        <Autocomplete
            options={options}
            value={value}
            onChange={(_, v) => onSelect(v)}
            onInputChange={(_, v, reason) => {
                if (reason === 'input' || reason === 'clear') setQuery(reason === 'clear' ? '' : v);
            }}
            filterOptions={(x) => x}
            getOptionLabel={puertoLabel}
            isOptionEqualToValue={(opt, val) => opt.codigoPuerto === val.codigoPuerto}
            loading={isLoading || resolving}
            noOptionsText={query.trim().length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin resultados'}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Puerto destino (internacional)"
                    placeholder="Buscar puerto o ciudad…"
                    size="small"
                    required
                    error={!value && !resolving}
                    helperText={resolving ? 'Buscando el puerto del destino FITO…' : undefined}
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                        }
                    }}
                />
            )}
        />
    );
};

// ─── Paso 1 ──────────────────────────────────────────────────────────────────

interface FitoConfigStepProps {
    madre: FitoGuide;
    config: FitoXmlConfig;
    onChange: (patch: Partial<FitoXmlConfig>) => void;
    missing: Record<ConfigGroupKey, string[]>;
    openGroups: Record<ConfigGroupKey, boolean>;
    onToggleGroup: (group: ConfigGroupKey, open: boolean) => void;
    puertosEc?: PuertoEcuador[];
    selectedDestino: PuertoInternacional | null;
    suggestedDestinos: PuertoInternacional[];
    resolvingDestino: boolean;
    onSelectDestino: (puerto: PuertoInternacional | null) => void;
}

export const FitoConfigStep: React.FC<FitoConfigStepProps> = ({
    madre, config, onChange, missing, openGroups, onToggleGroup, puertosEc,
    selectedDestino, suggestedDestinos, resolvingDestino, onSelectDestino
}) => {
    const empty = (v?: string) => !v || !v.trim();
    // Mientras se resuelve el puerto destino de la guía no se marca como faltante.
    const rutaMissing = resolvingDestino ? missing.ruta.filter(f => f !== PUERTO_DESTINO_LABEL) : missing.ruta;
    const puertosEcOptions = puertosEc ?? [];
    const origenNombre = puertosEcOptions.find(p => p.codigoPuerto === config.codigoPuertoEc)?.nombrePuerto;

    return (
        <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
                Estos datos se tomaron de la guía {madre.docNumGuia}. Edita solo lo que haga falta.
            </Typography>

            <ConfigGroup
                title="Ruta"
                icon={<RouteIcon fontSize="small" />}
                missing={rutaMissing}
                open={openGroups.ruta}
                onToggle={(open) => onToggleGroup('ruta', open)}
                summary={
                    <Box sx={summaryGrid}>
                        <SummaryItem
                            label="Puerto destino"
                            value={selectedDestino ? puertoLabel(selectedDestino) : resolvingDestino ? 'Buscando…' : config.codigoPuertoDestino}
                            missing={empty(config.codigoPuertoDestino) && !resolvingDestino}
                        />
                        <SummaryItem
                            label="Puerto origen"
                            value={origenNombre ? `${origenNombre} (${config.codigoPuertoEc})` : config.codigoPuertoEc}
                            missing={empty(config.codigoPuertoEc)}
                        />
                        <SummaryItem
                            label="Fecha de embarque"
                            value={formatDate(config.fechaEmbarque)}
                            missing={empty(config.fechaEmbarque)}
                        />
                    </Box>
                }
                footer={
                    madre.docFITODestino ? (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                            Destino FITO registrado en la guía: <strong>{madre.docFITODestino}</strong>
                        </Typography>
                    ) : null
                }
            >
                <DestinoAutocomplete
                    value={selectedDestino}
                    suggestions={suggestedDestinos}
                    resolving={resolvingDestino}
                    onSelect={onSelectDestino}
                />
                <FormControl fullWidth size="small" required error={empty(config.codigoPuertoEc)}>
                    <InputLabel>Puerto Ecuador (origen)</InputLabel>
                    <Select
                        value={config.codigoPuertoEc}
                        label="Puerto Ecuador (origen)"
                        onChange={(e) => onChange({ codigoPuertoEc: e.target.value })}
                    >
                        {config.codigoPuertoEc && !origenNombre && (
                            <MenuItem value={config.codigoPuertoEc}>{config.codigoPuertoEc}</MenuItem>
                        )}
                        {puertosEcOptions.map(p => (
                            <MenuItem key={p.codigoPuerto} value={p.codigoPuerto}>{p.nombrePuerto}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    label="Fecha de embarque"
                    type="date"
                    value={config.fechaEmbarque}
                    onChange={(e) => onChange({ fechaEmbarque: e.target.value })}
                    size="small"
                    fullWidth
                    required
                    error={empty(config.fechaEmbarque)}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
            </ConfigGroup>

            <ConfigGroup
                title="Consignatario"
                icon={<ConsigneeIcon fontSize="small" />}
                missing={missing.consignatario}
                open={openGroups.consignatario}
                onToggle={(open) => onToggleGroup('consignatario', open)}
                summary={
                    <Box sx={summaryGrid}>
                        <SummaryItem label="Nombre" value={config.nombreConsignatario} missing={empty(config.nombreConsignatario)} />
                        <Box sx={{ gridColumn: { sm: 'span 2' }, minWidth: 0 }}>
                            <SummaryItem label="Dirección" value={config.direccionConsignatario} missing={empty(config.direccionConsignatario)} />
                        </Box>
                    </Box>
                }
            >
                <TextField
                    label="Consignatario"
                    value={config.nombreConsignatario}
                    onChange={(e) => onChange({ nombreConsignatario: e.target.value })}
                    size="small"
                    fullWidth
                    required
                    error={empty(config.nombreConsignatario)}
                />
                <TextField
                    label="Dirección del consignatario"
                    value={config.direccionConsignatario}
                    onChange={(e) => onChange({ direccionConsignatario: e.target.value })}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    required
                    error={empty(config.direccionConsignatario)}
                />
            </ConfigGroup>

            <ConfigGroup
                title="Solicitud"
                icon={<RequestIcon fontSize="small" />}
                missing={missing.solicitud}
                open={openGroups.solicitud}
                onToggle={(open) => onToggleGroup('solicitud', open)}
                summary={
                    <Box sx={summaryGrid}>
                        <SummaryItem label="Tipo de solicitud" value={config.tipoSolicitud} missing={empty(config.tipoSolicitud)} />
                        <SummaryItem label="Nombre marca" value={config.nombreMarca} missing={empty(config.nombreMarca)} />
                        <SummaryItem
                            label="Uso previsto"
                            value={usoPrevistoLabel(config.codigoUsoPrevisto)}
                            missing={empty(config.codigoUsoPrevisto)}
                        />
                        <SummaryItem label="Información adicional" value={config.informacionAdicional} wide />
                    </Box>
                }
            >
                <TextField
                    label="Tipo de solicitud"
                    value={config.tipoSolicitud}
                    onChange={(e) => onChange({ tipoSolicitud: e.target.value })}
                    size="small"
                    fullWidth
                    required
                    error={empty(config.tipoSolicitud)}
                    helperText="Por defecto: ORNAMENTALES"
                />
                <TextField
                    label="Nombre marca"
                    value={config.nombreMarca}
                    onChange={(e) => onChange({ nombreMarca: e.target.value })}
                    size="small"
                    fullWidth
                    required
                    error={empty(config.nombreMarca)}
                    helperText="Por defecto: LAS DEL EXPORTADOR"
                />
                <FormControl fullWidth size="small" required error={empty(config.codigoUsoPrevisto)}>
                    <InputLabel>Uso previsto</InputLabel>
                    <Select
                        value={config.codigoUsoPrevisto}
                        label="Uso previsto"
                        onChange={(e) => onChange({ codigoUsoPrevisto: e.target.value })}
                    >
                        {USOS_PREVISTOS.map(u => (
                            <MenuItem key={u.codigo} value={u.codigo}>{u.nombre} ({u.codigo})</MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>Obligatorio para Agrocalidad. Por defecto: Consumo.</FormHelperText>
                </FormControl>
                <TextField
                    label="Información adicional (opcional)"
                    value={config.informacionAdicional || ''}
                    onChange={(e) => onChange({ informacionAdicional: e.target.value })}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                />
            </ConfigGroup>
        </Stack>
    );
};
