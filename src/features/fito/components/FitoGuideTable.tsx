import React, { useState, useEffect, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    CircularProgress, Typography, Box, Button, Chip, TextField, Alert, LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
    Autocomplete, Divider, Stepper, Step, StepLabel, useMediaQuery, useTheme
} from '@mui/material';
import {
    Description as DocIcon,
    CheckCircle as CheckIcon,
    Settings as ConfigIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
    ArrowForward as NextIcon
} from '@mui/icons-material';
import useSWR from 'swr';
import { useFitoGuias, useFitoGuiasHijas } from '../hooks/useFito';
import { FitoGuide, FitoXmlConfig, PuertoEcuador, PuertoInternacional, ProductMapping, GuiaHijaAgregada } from '../types/fito.types';
import { ProductMappingStep, ProductMappingStepRef } from './ProductMappingStep';
import api from '../../../shared/services/api';

interface FitoGuideTableProps {
    onGenerate: (docNumero: number, config: FitoXmlConfig, productMappings: ProductMapping[], guiasHijas: GuiaHijaAgregada[]) => void;
    disabled?: boolean;
}

const fetchPuertosEcuador = () =>
    api.get<PuertoEcuador[]>('/catalogs/puertos?esEcuador=true').then(r => r.data);

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const STEPS = ['Configuración General', 'Mapeo de Productos', 'Generar'];

export const FitoGuideTable: React.FC<FitoGuideTableProps> = ({ onGenerate, disabled }) => {
    const { guias, isLoading, isError } = useFitoGuias();
    const [selectedMadre, setSelectedMadre] = useState<FitoGuide | null>(null);
    const { hijas, isLoading: isLoadingHijas } = useFitoGuiasHijas(selectedMadre?.docNumero ?? null);

    // Responsive
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [productMappings, setProductMappings] = useState<ProductMapping[]>([]);
    const mappingRef = useRef<ProductMappingStepRef>(null);
    const [isMappingValid, setIsMappingValid] = useState(false);

    // Config state
    const [config, setConfig] = useState<FitoXmlConfig>({
        tipoSolicitud: 'ORNAMENTALES',
        codigoIdioma: 'SPA',
        codigoTipoProduccion: 'CONV',
        fechaEmbarque: '',
        codigoPuertoEc: 'AEECUIO',
        codigoPuertoDestino: '',
        nombreMarca: 'LAS DEL EXPORTADOR',
        nombreConsignatario: '',
        direccionConsignatario: '',
        informacionAdicional: ''
    });

    // Puerto destino search state
    const [destinoSearch, setDestinoSearch] = useState('');
    const [destinoOptions, setDestinoOptions] = useState<PuertoInternacional[]>([]);
    const [destinoLoading, setDestinoLoading] = useState(false);
    const [selectedDestino, setSelectedDestino] = useState<PuertoInternacional | null>(null);
    const debouncedSearch = useDebounce(destinoSearch, 300);

    const { data: puertosEc } = useSWR<PuertoEcuador[]>('/catalogs/puertos-ec', fetchPuertosEcuador);

    // Search destination ports
    useEffect(() => {
        if (debouncedSearch.length >= 2) {
            setDestinoLoading(true);
            api.get<PuertoInternacional[]>(`/catalogs/puertos/search?q=${encodeURIComponent(debouncedSearch)}&esEcuador=false`)
                .then(r => setDestinoOptions(r.data))
                .catch(() => setDestinoOptions([]))
                .finally(() => setDestinoLoading(false));
        } else {
            setDestinoOptions([]);
        }
    }, [debouncedSearch]);

    // Auto-populate config when madre is selected
    useEffect(() => {
        if (selectedMadre) {
            const date = new Date(selectedMadre.docFecha);
            const fechaStr = !isNaN(date.getTime())
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                : '';

            setConfig(prev => ({
                ...prev,
                fechaEmbarque: fechaStr,
                nombreConsignatario: selectedMadre.consignatarioNombre || ''
            }));

            // Auto-buscar puerto usando docFITODestino
            // First, resolve the destination code to get the name
            const fitoDestino = selectedMadre.docFITODestino;
            if (fitoDestino) {
                // Resolve destination code from PIN_auxDestinos via backend
                api.get<{ desCodigo: string; desNombre: string; desAeropuerto: string; desPais: string } | null>(`/fito/destino/${encodeURIComponent(fitoDestino)}`)
                    .then(r => {
                        const destino = r.data;
                        // Special case: TSE -> search for ASTANA
                        let searchTerm: string;
                        if (fitoDestino.toUpperCase() === 'TSE') {
                            searchTerm = 'ASTANA';
                        } else {
                            searchTerm = destino?.desNombre || destino?.desAeropuerto || fitoDestino;
                        }
                        setDestinoSearch(searchTerm);

                        // Now search for ports using the resolved name
                        return api.get<PuertoInternacional[]>(`/catalogs/puertos/search?q=${encodeURIComponent(searchTerm)}&esEcuador=false`);
                    })
                    .then(r => {
                        if (r.data.length > 0) {
                            // Auto-seleccionar el primer match
                            handleDestinoSelect(r.data[0]);
                            // También mostrar todas las opciones por si el usuario quiere cambiar
                            setDestinoOptions(r.data);
                        }
                    })
                    .catch(() => { /* ignore errors */ });
            }
        }
    }, [selectedMadre]);

    // Auto-populate nombreConsignatario and direccionConsignatario from hijas marFITO
    // Format: "CONSIGNATARIO NAME||ADDRESS PART 1||ADDRESS PART 2"
    // -> Name = before first ||, Address = everything after first ||
    useEffect(() => {
        if (hijas.length > 0 && hijas[0].marFITO) {
            const raw = hijas[0].marFITO;
            const parts = raw.split('||');
            // Name is the first part (before first ||)
            const name = parts[0]?.trim() || '';
            // Address is everything after the first ||
            const address = parts.length > 1
                ? parts.slice(1).join(' ').trim()
                : ''; // If no ||, there's no address
            setConfig(prev => ({
                ...prev,
                nombreConsignatario: name || prev.nombreConsignatario,
                direccionConsignatario: address || prev.direccionConsignatario
            }));
        }
    }, [hijas]);

    const handleSelectMadre = (guia: FitoGuide) => {
        setSelectedMadre(selectedMadre?.docNumero === guia.docNumero ? null : guia);
    };

    const handleOpenWizard = () => {
        setActiveStep(0);
        setProductMappings([]);
        setWizardOpen(true);
    };

    const handleDestinoSelect = (puerto: PuertoInternacional | null) => {
        setSelectedDestino(puerto);
        setConfig(prev => ({ ...prev, codigoPuertoDestino: puerto?.codigoPuerto || '' }));
        // Update inputValue to show selected option's label
        if (puerto) {
            const label = `${puerto.nombrePuerto} (${puerto.codigoPuerto})${puerto.nombrePais ? ` - ${puerto.nombrePais}` : ''}`;
            setDestinoSearch(label);
            // Ensure the selected option is in options for Autocomplete to display correctly
            setDestinoOptions(prev => prev.some(p => p.codigoPuerto === puerto.codigoPuerto) ? prev : [puerto, ...prev]);
        } else {
            setDestinoSearch('');
        }
    };

    const handleNextStep = () => {
        if (activeStep === 1 && mappingRef.current) {
            // Capture mappings before going to step 3
            setProductMappings(mappingRef.current.getMappings());
        }
        if (activeStep < STEPS.length - 1) {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBackStep = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev - 1);
        }
    };

    const handleGenerate = () => {
        if (selectedMadre) {
            // Clean mappings to only include backend-expected fields
            const cleanedMappings: ProductMapping[] = productMappings.map(({ originalCode, codigoAgrocalidad, nombreComun, matched, confidence }) => ({
                originalCode,
                codigoAgrocalidad,
                nombreComun,
                matched,
                confidence
            }));

            // Build mapping lookup for quick access
            const mappingLookup = new Map<string, string>();
            cleanedMappings.forEach(m => mappingLookup.set(m.originalCode, m.codigoAgrocalidad));

            // Filter hijas with bulto/cantidad > 0, then aggregate by plaRUC + proCodigo
            const filteredHijas = hijas.filter(h => h.detCajas > 0 || h.detNumStems > 0);

            const aggregationMap = new Map<string, GuiaHijaAgregada>();
            filteredHijas.forEach(h => {
                const key = `${h.plaRUC || 'SIN_RUC'}|${h.proCodigo}`;
                const existing = aggregationMap.get(key);
                const codigoAgrocalidad = mappingLookup.get(h.proCodigo) || h.proCodigo;

                if (existing) {
                    existing.detCajas += h.detCajas || 0;
                    existing.detNumStems += h.detNumStems || 0;
                } else {
                    aggregationMap.set(key, {
                        plaRUC: h.plaRUC || 'SIN_RUC',
                        plaNombre: h.plaNombre || '',
                        proCodigo: h.proCodigo,
                        codigoAgrocalidad,
                        detCajas: h.detCajas || 0,
                        detNumStems: h.detNumStems || 0
                    });
                }
            });

            const aggregatedHijas = Array.from(aggregationMap.values());

            onGenerate(selectedMadre.docNumero, config, cleanedMappings, aggregatedHijas);
            setWizardOpen(false);
        }
    };

    const isStep1Valid = config.fechaEmbarque && config.codigoPuertoEc && config.codigoPuertoDestino
        && config.nombreMarca && config.nombreConsignatario && config.direccionConsignatario;

    if (isLoading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={48} />
                <Typography sx={{ mt: 2 }} color="text.secondary">Cargando guías desde Access...</Typography>
            </Box>
        );
    }

    if (isError) {
        return <Alert severity="error" sx={{ m: 2 }}>Error al conectar con la base de datos Access.</Alert>;
    }

    if (!guias || guias.length === 0) {
        return <Alert severity="info" sx={{ m: 2 }}>No hay guías disponibles.</Alert>;
    }

    return (
        <>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                height: { xs: 'auto', md: 'calc(100vh - 180px)' },
                overflow: { xs: 'visible', md: 'hidden' }
            }}>
                {/* Left Panel - Guías List */}
                <Paper variant="outlined" sx={{
                    flex: { xs: '0 0 auto', md: '0 0 400px' },
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    maxHeight: { xs: '300px', md: 'none' }
                }}>
                    <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight={600}>Guías Disponibles</Typography>
                    </Box>
                    <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>No. Guía</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Destino</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {guias.map((row) => {
                                    const isSelected = selectedMadre?.docNumero === row.docNumero;
                                    return (
                                        <TableRow key={row.docNumero} hover onClick={() => handleSelectMadre(row)} selected={isSelected} sx={{ cursor: 'pointer' }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>{row.docNumGuia}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.docFecha?.split('T')[0]}</TableCell>
                                            <TableCell>
                                                <Chip label={row.docFITODestino || row.docDestino || '-'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Right Panel */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                    {/* Actions Toolbar */}
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {selectedMadre && (
                                <>
                                    <Chip icon={<CheckIcon />} label={`Guía: ${selectedMadre.docNumGuia}`} color="primary" variant="outlined" size="small" />
                                    {hijas.length > 0 && <Chip label={`${hijas.length} items`} size="small" variant="outlined" />}
                                </>
                            )}
                        </Box>
                        <Button
                            variant="contained"
                            disabled={!selectedMadre || hijas.length === 0 || disabled}
                            onClick={handleOpenWizard}
                            startIcon={<ConfigIcon />}
                            size={isMobile ? 'small' : 'medium'}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            {isMobile ? 'Generar' : 'Configurar y Generar'}
                        </Button>
                    </Paper>

                    {/* Guías Hijas Table */}
                    <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                            <Typography variant="subtitle1" fontWeight={600}>Detalle de Guía (Hijas)</Typography>
                        </Box>

                        {!selectedMadre ? (
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                                <Typography variant="body2">Seleccione una guía madre</Typography>
                            </Box>
                        ) : isLoadingHijas ? (
                            <LinearProgress />
                        ) : hijas.length === 0 ? (
                            <Alert severity="warning" sx={{ m: 2 }}>No hay registros hijos.</Alert>
                        ) : (
                            <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell># Det.</TableCell>
                                            <TableCell>Marca</TableCell>
                                            <TableCell>Producto</TableCell>
                                            <TableCell align="right">Cajas</TableCell>
                                            <TableCell align="right">Stems</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {hijas.map((hija, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>{hija.detNumero}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{hija.marNombre || hija.marCodigo}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={hija.proCodigo} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell align="right">{hija.detCajas}</TableCell>
                                                <TableCell align="right">{hija.detNumStems}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Box>
            </Box>

            {/* Wizard Dialog - fullScreen on mobile */}
            <Dialog
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle>
                    <Stepper activeStep={activeStep} sx={{ mb: 1 }}>
                        {STEPS.map((label) => (
                            <Step key={label}><StepLabel>{label}</StepLabel></Step>
                        ))}
                    </Stepper>
                </DialogTitle>
                <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {activeStep === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            {selectedMadre?.docFITODestino && (
                                <Alert severity="info" sx={{ py: 0.5 }}>FITO Destino: <strong>{selectedMadre.docFITODestino}</strong></Alert>
                            )}
                            <Autocomplete
                                options={destinoOptions}
                                getOptionLabel={(opt) => `${opt.nombrePuerto} (${opt.codigoPuerto})${opt.nombrePais ? ` - ${opt.nombrePais}` : ''}`}
                                value={selectedDestino}
                                onChange={(_, v) => handleDestinoSelect(v)}
                                inputValue={destinoSearch}
                                onInputChange={(_, v) => setDestinoSearch(v)}
                                loading={destinoLoading}
                                renderInput={(params) => (
                                    <TextField {...params} label="Puerto Destino (Internacional)" placeholder="Buscar..." size="small"
                                        InputProps={{ ...params.InputProps, startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
                                    />
                                )}
                                noOptionsText={destinoSearch.length < 2 ? "Escriba al menos 2 caracteres" : "No encontrado"}
                            />
                            <Divider />
                            <TextField label="Fecha de Embarque" type="date" value={config.fechaEmbarque} onChange={(e) => setConfig({ ...config, fechaEmbarque: e.target.value })} InputLabelProps={{ shrink: true }} size="small" fullWidth />
                            <FormControl fullWidth size="small">
                                <InputLabel>Puerto Ecuador (Origen)</InputLabel>
                                <Select value={config.codigoPuertoEc} label="Puerto Ecuador (Origen)" onChange={(e) => setConfig({ ...config, codigoPuertoEc: e.target.value })}>
                                    {puertosEc?.map(p => <MenuItem key={p.codigoPuerto} value={p.codigoPuerto}>{p.nombrePuerto}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField label="Tipo de Solicitud" value={config.tipoSolicitud} onChange={(e) => setConfig({ ...config, tipoSolicitud: e.target.value })} size="small" fullWidth />
                            <TextField label="Nombre Marca" value={config.nombreMarca} onChange={(e) => setConfig({ ...config, nombreMarca: e.target.value })} size="small" fullWidth required helperText="Requerido - Por defecto: LAS DEL EXPORTADOR" />
                            <TextField label="Consignatario" value={config.nombreConsignatario} onChange={(e) => setConfig({ ...config, nombreConsignatario: e.target.value })} size="small" fullWidth required />
                            <TextField label="Dirección Consignatario" value={config.direccionConsignatario} onChange={(e) => setConfig({ ...config, direccionConsignatario: e.target.value })} size="small" fullWidth multiline rows={2} required />
                            <TextField label="Información Adicional (Opcional)" value={config.informacionAdicional || ''} onChange={(e) => setConfig({ ...config, informacionAdicional: e.target.value })} size="small" fullWidth multiline rows={2} />
                        </Box>
                    )}
                    {activeStep === 1 && (
                        <ProductMappingStep
                            ref={mappingRef}
                            hijas={hijas}
                            onValidityChange={setIsMappingValid}
                        />
                    )}
                    {activeStep === 2 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                            <Typography variant="h6">¡Configuración Completa!</Typography>
                            <Typography color="text.secondary">
                                {hijas.length} productos listos para generar archivo FITO con {productMappings.length} mapeos.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWizardOpen(false)}>Cancelar</Button>
                    {activeStep > 0 && (
                        <Button onClick={handleBackStep} startIcon={<BackIcon />}>
                            Atrás
                        </Button>
                    )}
                    {activeStep === 0 && (
                        <Button variant="contained" onClick={handleNextStep} disabled={!isStep1Valid} endIcon={<NextIcon />}>
                            Siguiente
                        </Button>
                    )}
                    {activeStep === 1 && (
                        <Button variant="contained" onClick={handleNextStep} disabled={!isMappingValid} endIcon={<NextIcon />}>
                            Siguiente
                        </Button>
                    )}
                    {activeStep === 2 && (
                        <Button variant="contained" onClick={handleGenerate} startIcon={<DocIcon />}>
                            Generar FITO
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};
