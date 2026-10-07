import React, { useMemo, useRef, useState } from 'react';
import {
    Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Paper, Stack,
    Step, StepLabel, Stepper, Typography, useMediaQuery, useTheme
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    ArrowForward as NextIcon,
    CalendarToday as CalendarIcon,
    Description as DocIcon,
    Place as PlaceIcon,
    SwapVert as ChangeIcon
} from '@mui/icons-material';
import useSWR from 'swr';
import { DataTable, DataTableColumn } from '../../../shared/components/ui/DataTable';
import { formatDate, toIsoDate } from '../../../shared/utils/format';
import { useFitoGuias, useFitoGuiasHijas } from '../hooks/useFito';
import { useProductMappings } from '../hooks/useProductMappings';
import { fitoCatalogService, fitoService } from '../services/fito.service';
import {
    FitoGuide, FitoGuiaHija, FitoXmlConfig, GuiaHijaAgregada, ProductMapping, PuertoEcuador, PuertoInternacional
} from '../types/fito.types';
import {
    aggregateHijas, CONFIG_GROUPS, ConfigGroupKey, DEFAULT_FITO_CONFIG, distinctProductCodes, formatNumber,
    getMissingConfigFields, parseMarFito, sumHijas, toProductMappings
} from '../utils/fito.utils';
import { ProductMappingStep } from './ProductMappingStep';
import { FitoConfigStep } from './FitoConfigStep';
import { FitoSummaryStep } from './FitoSummaryStep';

interface FitoGuideTableProps {
    onGenerate: (docNumero: number, config: FitoXmlConfig, productMappings: ProductMapping[], guiasHijas: GuiaHijaAgregada[]) => void;
    disabled?: boolean;
}

const STEPS = ['Datos del certificado', 'Productos', 'Confirmar'];

const CLOSED_GROUPS: Record<ConfigGroupKey, boolean> = { ruta: false, consignatario: false, solicitud: false };

const guiaDestino = (g: FitoGuide) => g.docFITODestino || g.docDestino || '';

const GUIA_COLUMNS: DataTableColumn<FitoGuide>[] = [
    { key: 'guia', label: 'Guía', value: g => g.docNumGuia, pinned: true, mobile: 'title' },
    { key: 'fecha', label: 'Fecha', value: g => formatDate(g.docFecha) },
    {
        key: 'destino',
        label: 'Destino',
        description: 'Destino FITO de la guía (o destino general si no tiene)',
        value: guiaDestino,
        render: g => (guiaDestino(g) ? <Chip label={guiaDestino(g)} size="small" variant="outlined" /> : '—')
    },
    { key: 'consignatario', label: 'Consignatario', value: g => g.consignatarioNombre ?? '', defaultHidden: true }
];

const HIJA_COLUMNS: DataTableColumn<FitoGuiaHija>[] = [
    { key: 'det', label: '# Det.', value: h => h.detNumero, mobile: 'hidden' },
    { key: 'producto', label: 'Producto', value: h => h.proCodigo, mobile: 'title' },
    { key: 'marca', label: 'Marca', value: h => h.marNombre || h.marCodigo, mobile: 'subtitle' },
    { key: 'finca', label: 'Finca', value: h => h.plaNombre ?? '' },
    { key: 'ruc', label: 'RUC finca', value: h => h.plaRUC ?? '', defaultHidden: true },
    { key: 'cajas', label: 'Cajas', align: 'right', value: h => h.detCajas, render: h => formatNumber(h.detCajas) },
    { key: 'stems', label: 'Stems', align: 'right', value: h => h.detNumStems, render: h => formatNumber(h.detNumStems) }
];

const HOW_TO_STEPS = [
    { title: 'Elige una guía madre', text: 'Búscala en la lista por número de guía o destino.' },
    { title: 'Revisa los datos', text: 'Ruta, consignatario y productos vienen precargados de Access; corrige solo lo marcado.' },
    { title: 'Genera el FITO', text: 'El XML para Agrocalidad se descarga automáticamente al terminar.' }
];

const HowToPanel: React.FC = () => (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <Typography variant="subtitle1" fontWeight={600}>Cómo generar un certificado</Typography>
        <Stack spacing={2.5} sx={{ mt: 2.5 }}>
            {HOW_TO_STEPS.map((s, i) => (
                <Stack key={s.title} direction="row" spacing={2} alignItems="flex-start">
                    <Box
                        sx={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'action.selected', color: 'text.primary', fontWeight: 600, fontSize: 14
                        }}
                    >
                        {i + 1}
                    </Box>
                    <Box>
                        <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{s.text}</Typography>
                    </Box>
                </Stack>
            ))}
        </Stack>
    </Paper>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="h6" component="div" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
        </Typography>
    </Box>
);

export const FitoGuideTable: React.FC<FitoGuideTableProps> = ({ onGenerate, disabled }) => {
    const { guias, isLoading, isError, mutate: reloadGuias } = useFitoGuias();
    const [selectedMadre, setSelectedMadre] = useState<FitoGuide | null>(null);
    const {
        hijas, isLoading: isLoadingHijas, isError: hijasError, mutate: reloadHijas
    } = useFitoGuiasHijas(selectedMadre?.docNumero ?? null);

    // Responsive
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const listRef = useRef<HTMLDivElement>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    /** docNumero para el que ya se precargó la configuración (null = precargar al abrir). */
    const [initializedFor, setInitializedFor] = useState<number | null>(null);
    const [config, setConfig] = useState<FitoXmlConfig>(DEFAULT_FITO_CONFIG);
    const [openGroups, setOpenGroups] = useState<Record<ConfigGroupKey, boolean>>(CLOSED_GROUPS);

    // Puerto destino: se resuelve desde docFITODestino al elegir la guía
    const [selectedDestino, setSelectedDestino] = useState<PuertoInternacional | null>(null);
    const [suggestedDestinos, setSuggestedDestinos] = useState<PuertoInternacional[]>([]);
    const [resolvingDestino, setResolvingDestino] = useState(false);
    const destinoRequestRef = useRef(0);

    const { data: puertosEc } = useSWR<PuertoEcuador[]>('/catalogs/puertos-ec', fitoCatalogService.getPuertosEcuador);

    const mapping = useProductMappings(hijas, wizardOpen);
    const resetMappings = mapping.reset;

    const missing = useMemo(() => getMissingConfigFields(config), [config]);
    const isStep1Valid = CONFIG_GROUPS.every(g => missing[g].length === 0);
    const hijasTotals = useMemo(() => sumHijas(hijas), [hijas]);
    const productCount = useMemo(() => distinctProductCodes(hijas).length, [hijas]);
    const aggregatedHijas = useMemo(
        () => aggregateHijas(hijas, toProductMappings(mapping.rows)),
        [hijas, mapping.rows]
    );

    const patchConfig = (patch: Partial<FitoXmlConfig>) => setConfig(prev => ({ ...prev, ...patch }));

    const selectDestino = (puerto: PuertoInternacional | null) => {
        setSelectedDestino(puerto);
        setConfig(prev => ({ ...prev, codigoPuertoDestino: puerto?.codigoPuerto || '' }));
    };

    // Auto-buscar el puerto destino a partir de docFITODestino (PIN_auxDestinos -> catálogo de puertos)
    const resolveDestino = (madre: FitoGuide) => {
        const requestId = ++destinoRequestRef.current;
        setSuggestedDestinos([]);
        selectDestino(null);
        const fitoDestino = madre.docFITODestino;
        if (!fitoDestino) {
            setResolvingDestino(false);
            return;
        }
        setResolvingDestino(true);
        fitoService.getDestino(fitoDestino)
            .then(destino => {
                // Caso especial: TSE -> buscar ASTANA
                const searchTerm = fitoDestino.toUpperCase() === 'TSE'
                    ? 'ASTANA'
                    : destino?.desNombre || destino?.desAeropuerto || fitoDestino;
                return fitoCatalogService.searchPuertosInternacionales(searchTerm);
            })
            .then(ports => {
                if (requestId !== destinoRequestRef.current) return;
                // Todas las coincidencias quedan como opciones por si el usuario quiere cambiar
                setSuggestedDestinos(ports);
                if (ports.length > 0) {
                    selectDestino(ports[0]);
                } else {
                    setOpenGroups(prev => ({ ...prev, ruta: true }));
                }
            })
            .catch(() => {
                if (requestId === destinoRequestRef.current) setOpenGroups(prev => ({ ...prev, ruta: true }));
            })
            .finally(() => {
                if (requestId === destinoRequestRef.current) setResolvingDestino(false);
            });
    };

    const handleSelectMadre = (guia: FitoGuide) => {
        if (selectedMadre?.docNumero !== guia.docNumero) {
            setSelectedMadre(guia);
            setInitializedFor(null);
            resetMappings();
            resolveDestino(guia);
        }
        if (isMobile) {
            // Tras el render, llevar al detalle (en móvil va debajo de la lista)
            setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        }
    };

    const handleOpenWizard = () => {
        if (!selectedMadre) return;
        if (initializedFor !== selectedMadre.docNumero) {
            // Precarga: fecha de la guía; consignatario desde marFITO de las hijas
            // ("NOMBRE||DIRECCIÓN..."), con el nombre de la marca de la guía como respaldo.
            const fito = parseMarFito(hijas[0]?.marFITO);
            const next: FitoXmlConfig = {
                ...config,
                fechaEmbarque: toIsoDate(selectedMadre.docFecha),
                nombreConsignatario: fito.nombre || selectedMadre.consignatarioNombre || '',
                direccionConsignatario: fito.direccion
            };
            const nextMissing = getMissingConfigFields(next);
            setConfig(next);
            // Los grupos con datos faltantes se abren en modo edición.
            // El puerto destino no cuenta como faltante mientras se sigue resolviendo.
            setOpenGroups({
                ruta: !next.fechaEmbarque || !next.codigoPuertoEc || (!next.codigoPuertoDestino && !resolvingDestino),
                consignatario: nextMissing.consignatario.length > 0,
                solicitud: nextMissing.solicitud.length > 0
            });
            setInitializedFor(selectedMadre.docNumero);
        }
        setActiveStep(0);
        setWizardOpen(true);
    };

    const handleNextStep = () => setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
    const handleBackStep = () => setActiveStep(prev => Math.max(prev - 1, 0));

    const handleGenerate = () => {
        if (!selectedMadre) return;
        // Solo los campos que el back acepta (incluye el subtipo para que lo recuerde)
        const productMappings = toProductMappings(mapping.rows);
        onGenerate(selectedMadre.docNumero, config, productMappings, aggregateHijas(hijas, productMappings));
        setWizardOpen(false);
    };

    const scrollToList = () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const pendingProducts = mapping.rows.length - mapping.readyCount;
    const canContinue = activeStep === 0 ? isStep1Valid : activeStep === 1 ? mapping.allMapped : !disabled;
    const blockedReason = canContinue
        ? ''
        : activeStep === 0
            ? 'Completa los datos marcados para continuar.'
            : activeStep === 1
                ? `Falta${pendingProducts === 1 ? '' : 'n'} ${pendingProducts} producto${pendingProducts === 1 ? '' : 's'} por mapear.`
                : 'Hay una generación en curso.';

    const consignatarioGuia = parseMarFito(hijas[0]?.marFITO).nombre || selectedMadre?.consignatarioNombre;
    const canGenerate = Boolean(selectedMadre) && hijas.length > 0 && !isLoadingHijas && !disabled;

    return (
        <>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '400px minmax(0, 1fr)', lg: '440px minmax(0, 1fr)' },
                    gap: { xs: 2, md: 2.5 },
                    alignItems: 'start'
                }}
            >
                {/* Guías madre */}
                <Box ref={listRef} sx={{ minWidth: 0, scrollMarginTop: 80 }}>
                    {isMobile && !selectedMadre && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Elige una guía madre para ver su detalle y generar el certificado.
                        </Typography>
                    )}
                    <DataTable<FitoGuide>
                        id="fito-guias"
                        columns={GUIA_COLUMNS}
                        rows={guias ?? []}
                        getRowId={(g) => String(g.docNumero)}
                        loading={isLoading}
                        error={isError}
                        onRefresh={() => reloadGuias()}
                        onRowClick={handleSelectMadre}
                        selectedRowId={selectedMadre ? String(selectedMadre.docNumero) : null}
                        searchable
                        searchPlaceholder="Buscar guía o destino…"
                        emptyMessage="No hay guías madre disponibles en Access."
                        maxHeight="calc(100vh - 330px)"
                    />
                </Box>

                {/* Detalle */}
                {(selectedMadre || !isMobile) && (
                    <Box ref={detailRef} sx={{ minWidth: 0, scrollMarginTop: 80 }}>
                        {!selectedMadre ? (
                            <HowToPanel />
                        ) : (
                            <Stack spacing={2}>
                                <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={2}
                                        justifyContent="space-between"
                                        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="caption" color="text.secondary">Guía madre</Typography>
                                            <Typography variant="h6" component="h2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                                                {selectedMadre.docNumGuia}
                                            </Typography>
                                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                                                <Chip size="small" variant="outlined" icon={<CalendarIcon />} label={formatDate(selectedMadre.docFecha)} />
                                                {guiaDestino(selectedMadre) && (
                                                    <Chip size="small" variant="outlined" icon={<PlaceIcon />} label={`Destino ${guiaDestino(selectedMadre)}`} />
                                                )}
                                            </Stack>
                                            {consignatarioGuia && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    Consignatario: {consignatarioGuia}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Stack spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }} sx={{ flexShrink: 0 }}>
                                            <Button
                                                variant="contained"
                                                size="large"
                                                startIcon={<DocIcon />}
                                                onClick={handleOpenWizard}
                                                disabled={!canGenerate}
                                            >
                                                {disabled ? 'Generando…' : 'Generar FITO'}
                                            </Button>
                                            {isMobile && (
                                                <Button size="small" startIcon={<ChangeIcon />} onClick={scrollToList}>
                                                    Elegir otra guía
                                                </Button>
                                            )}
                                        </Stack>
                                    </Stack>
                                    <Divider sx={{ my: 2 }} />
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                                            gap: 2
                                        }}
                                    >
                                        <Stat label="Líneas" value={isLoadingHijas ? '…' : formatNumber(hijas.length)} />
                                        <Stat label="Productos" value={isLoadingHijas ? '…' : formatNumber(productCount)} />
                                        <Stat label="Cajas" value={isLoadingHijas ? '…' : formatNumber(hijasTotals.cajas)} />
                                        <Stat label="Stems" value={isLoadingHijas ? '…' : formatNumber(hijasTotals.stems)} />
                                    </Box>
                                    {!isLoadingHijas && !hijasError && hijas.length === 0 && (
                                        <Typography variant="body2" color="warning.dark" sx={{ mt: 2 }}>
                                            Esta guía no tiene líneas con cajas y stems, así que no se puede generar el FITO.
                                        </Typography>
                                    )}
                                </Paper>

                                <DataTable<FitoGuiaHija>
                                    id="fito-hijas"
                                    columns={HIJA_COLUMNS}
                                    rows={hijas}
                                    getRowId={(h, index) => `${h.docNumero}-${h.detNumero}-${index}`}
                                    loading={isLoadingHijas}
                                    error={hijasError}
                                    onRetry={() => reloadHijas()}
                                    searchable
                                    searchPlaceholder="Buscar producto, marca o finca…"
                                    totals={{
                                        cajas: formatNumber(hijasTotals.cajas),
                                        stems: formatNumber(hijasTotals.stems)
                                    }}
                                    emptyMessage="La guía no tiene líneas con cajas y stems."
                                    maxHeight="max(240px, calc(100vh - 560px))"
                                />
                            </Stack>
                        )}
                    </Box>
                )}
            </Box>

            {/* Asistente - pantalla completa en móvil */}
            <Dialog
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle component="div" sx={{ pb: 1 }}>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
                        <Typography variant="h6" component="h2" fontWeight={600}>Generar FITO</Typography>
                        {selectedMadre && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                                Guía {selectedMadre.docNumGuia}
                            </Typography>
                        )}
                    </Stack>
                    <Stepper activeStep={activeStep} alternativeLabel={isMobile} sx={{ mt: 2 }}>
                        {STEPS.map((label) => (
                            <Step key={label}><StepLabel>{label}</StepLabel></Step>
                        ))}
                    </Stepper>
                </DialogTitle>
                <DialogContent dividers>
                    {activeStep === 0 && selectedMadre && (
                        <FitoConfigStep
                            madre={selectedMadre}
                            config={config}
                            onChange={patchConfig}
                            missing={missing}
                            openGroups={openGroups}
                            onToggleGroup={(group, open) => setOpenGroups(prev => ({ ...prev, [group]: open }))}
                            puertosEc={puertosEc}
                            selectedDestino={selectedDestino}
                            suggestedDestinos={suggestedDestinos}
                            resolvingDestino={resolvingDestino}
                            onSelectDestino={selectDestino}
                        />
                    )}
                    {activeStep === 1 && (
                        <ProductMappingStep
                            rows={mapping.rows}
                            readyCount={mapping.readyCount}
                            loadingRemembered={mapping.loadingRemembered}
                            onUpdateRow={mapping.updateRow}
                        />
                    )}
                    {activeStep === 2 && selectedMadre && (
                        <FitoSummaryStep
                            madre={selectedMadre}
                            config={config}
                            destino={selectedDestino}
                            productCount={mapping.rows.length}
                            guiasHijas={aggregatedHijas}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                    {blockedReason ? (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ flex: 1, minWidth: { xs: '100%', sm: 0 } }}
                        >
                            {blockedReason}
                        </Typography>
                    ) : (
                        <Box sx={{ flex: 1 }} />
                    )}
                    <Button onClick={() => setWizardOpen(false)} color="inherit">Cancelar</Button>
                    {activeStep > 0 && (
                        <Button onClick={handleBackStep} startIcon={<BackIcon />}>Atrás</Button>
                    )}
                    {activeStep < STEPS.length - 1 ? (
                        <Button variant="contained" onClick={handleNextStep} disabled={!canContinue} endIcon={<NextIcon />}>
                            Siguiente
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={handleGenerate} disabled={!canContinue} startIcon={<DocIcon />}>
                            Generar FITO
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};
