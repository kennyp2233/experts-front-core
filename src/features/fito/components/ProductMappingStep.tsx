import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, TextField, Autocomplete, CircularProgress, Alert, FormControl,
    Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import { CheckCircle as CheckIcon, Warning as WarningIcon, Search as SearchIcon, AutoFixHigh as AutoMatchIcon } from '@mui/icons-material';
import { ProductMapping, ProductCatalogItem, FitoGuiaHija } from '../types/fito.types';
import api from '../../../shared/services/api';

export interface ProductMappingStepRef {
    getMappings: () => ProductMapping[];
    isValid: () => boolean;
}

interface ProductMappingStepProps {
    hijas: FitoGuiaHija[];
    onValidityChange?: (isValid: boolean) => void;
}

interface ProductWithSubtipo extends ProductMapping {
    selectedSubtipo: string;
    autoMatching: boolean;
}

export const ProductMappingStep = forwardRef<ProductMappingStepRef, ProductMappingStepProps>(
    ({ hijas, onValidityChange }, ref) => {
        const [mappings, setMappings] = useState<ProductWithSubtipo[]>([]);
        const [loading, setLoading] = useState(true);
        const [subtipos, setSubtipos] = useState<string[]>([]);
        const [subtiposLoading, setSubtiposLoading] = useState(true);
        const [globalSubtipo, setGlobalSubtipo] = useState<string>('');
        const [searchResults, setSearchResults] = useState<{ [key: string]: ProductCatalogItem[] }>({});
        const [searchLoading, setSearchLoading] = useState<{ [key: string]: boolean }>({});

        const allMapped = mappings.every(m => m.codigoAgrocalidad);
        const allHaveSubtipo = mappings.every(m => m.selectedSubtipo);
        const mappedCount = mappings.filter(m => m.codigoAgrocalidad).length;

        // Expose methods to parent
        useImperativeHandle(ref, () => ({
            getMappings: () => mappings,
            isValid: () => allMapped
        }));

        // Notify parent of validity changes
        useEffect(() => {
            onValidityChange?.(allMapped);
        }, [allMapped, onValidityChange]);

        // Load available subtipos
        useEffect(() => {
            const fetchSubtipos = async () => {
                setSubtiposLoading(true);
                try {
                    const { data } = await api.get<string[]>('/catalogs/productos/subtipos');
                    setSubtipos(data);
                } catch (error) {
                    console.error('Error fetching subtipos:', error);
                    setSubtipos([]);
                } finally {
                    setSubtiposLoading(false);
                }
            };
            fetchSubtipos();
        }, []);

        // Create stable product codes string for comparison
        const productCodesKey = hijas.map(h => h.proCodigo).join(',');

        // Initialize mappings with product codes (only when product codes actually change)
        useEffect(() => {
            if (productCodesKey === '') return;

            const codes = [...new Set(productCodesKey.split(','))];
            const initialMappings: ProductWithSubtipo[] = codes.map(code => ({
                originalCode: code,
                codigoAgrocalidad: '',
                nombreComun: '',
                matched: false,
                confidence: 0,
                selectedSubtipo: '',
                autoMatching: false
            }));

            setMappings(initialMappings);
            setLoading(false);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [productCodesKey]);

        // Auto-match function - searches for product by code filtered by subtipo
        const autoMatch = useCallback(async (originalCode: string, subtipo: string) => {
            if (!subtipo) return;

            // Mark as auto-matching
            setMappings(prev => prev.map(m =>
                m.originalCode === originalCode ? { ...m, autoMatching: true } : m
            ));

            try {
                // Search using the original code as query, filtered by subtipo
                const result = await api.get<ProductCatalogItem[]>(
                    `/catalogs/productos/autocomplete?q=${encodeURIComponent(originalCode)}&subtipo=${encodeURIComponent(subtipo)}`
                );

                if (result.data.length > 0) {
                    // Take the best match (first result)
                    const bestMatch = result.data[0];
                    setMappings(prev => prev.map(m =>
                        m.originalCode === originalCode
                            ? {
                                ...m,
                                codigoAgrocalidad: bestMatch.codigoAgrocalidad,
                                nombreComun: bestMatch.nombreComun,
                                matched: true,
                                confidence: 0.9, // Auto-matched
                                autoMatching: false
                            }
                            : m
                    ));
                } else {
                    setMappings(prev => prev.map(m =>
                        m.originalCode === originalCode ? { ...m, autoMatching: false } : m
                    ));
                }
            } catch (error) {
                console.error('Auto-match error:', error);
                setMappings(prev => prev.map(m =>
                    m.originalCode === originalCode ? { ...m, autoMatching: false } : m
                ));
            }
        }, []);

        // Handle individual subtipo change - then auto-match
        const handleSubtipoChange = useCallback((originalCode: string, subtipo: string) => {
            setMappings(prev => prev.map(m =>
                m.originalCode === originalCode
                    ? { ...m, selectedSubtipo: subtipo, codigoAgrocalidad: '', nombreComun: '', matched: false, confidence: 0 }
                    : m
            ));
            // Clear previous search results
            setSearchResults(prev => ({ ...prev, [originalCode]: [] }));
            // Trigger auto-match
            autoMatch(originalCode, subtipo);
        }, [autoMatch]);

        // Handle global subtipo change - apply to all and auto-match all
        const handleGlobalSubtipoChange = useCallback((subtipo: string) => {
            setGlobalSubtipo(subtipo);
            if (!subtipo) return;

            // Update all mappings with the global subtipo
            setMappings(prev => prev.map(m => ({
                ...m,
                selectedSubtipo: subtipo,
                codigoAgrocalidad: '',
                nombreComun: '',
                matched: false,
                confidence: 0
            })));

            // Clear all search results
            setSearchResults({});

            // Trigger auto-match for all products
            mappings.forEach(m => {
                autoMatch(m.originalCode, subtipo);
            });
        }, [autoMatch, mappings]);

        const handleSearch = async (originalCode: string, query: string, subtipo: string) => {
            if (query.length < 2 || !subtipo) {
                setSearchResults(prev => ({ ...prev, [originalCode]: [] }));
                return;
            }

            setSearchLoading(prev => ({ ...prev, [originalCode]: true }));
            try {
                const result = await api.get<ProductCatalogItem[]>(
                    `/catalogs/productos/autocomplete?q=${encodeURIComponent(query)}&subtipo=${encodeURIComponent(subtipo)}`
                );
                setSearchResults(prev => ({ ...prev, [originalCode]: result.data }));
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setSearchLoading(prev => ({ ...prev, [originalCode]: false }));
            }
        };

        const handleSelectProduct = (originalCode: string, product: ProductCatalogItem | null) => {
            setMappings(prev => prev.map(m =>
                m.originalCode === originalCode
                    ? {
                        ...m,
                        codigoAgrocalidad: product?.codigoAgrocalidad || '',
                        nombreComun: product?.nombreComun || '',
                        matched: !!product,
                        confidence: product ? 1.0 : 0
                    }
                    : m
            ));
        };

        if (loading || subtiposLoading) {
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Cargando configuración...</Typography>
                </Box>
            );
        }

        return (
            <Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600}>Mapeo de Productos</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Seleccione subtipo para auto-mapear, o busque manualmente
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Global subtipo selector */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select
                                value={globalSubtipo}
                                onChange={(e: SelectChangeEvent) => handleGlobalSubtipoChange(e.target.value)}
                                displayEmpty
                                startAdornment={<AutoMatchIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />}
                            >
                                <MenuItem value="">
                                    <em>Aplicar subtipo a todos...</em>
                                </MenuItem>
                                {subtipos.map(s => (
                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Chip
                            label={`${mappedCount}/${mappings.length} mapeados`}
                            color={allMapped ? 'success' : 'warning'}
                        />
                    </Box>
                </Box>

                {!allHaveSubtipo && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Seleccione el subtipo para cada producto o use el selector global para aplicar a todos.
                    </Alert>
                )}

                {!allMapped && allHaveSubtipo && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Hay productos sin mapear. Complete el mapeo antes de continuar.
                    </Alert>
                )}

                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                        maxHeight: { xs: 300, md: 350 },
                        overflow: 'auto',
                        '& .MuiTable-root': {
                            minWidth: { xs: 700, md: 'auto' }
                        }
                    }}
                >
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Código Original</TableCell>
                                <TableCell sx={{ minWidth: 180 }}>Subtipo</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell sx={{ minWidth: 300 }}>Código Agrocalidad</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mappings.map((mapping) => (
                                <TableRow key={mapping.originalCode}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {mapping.originalCode}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <FormControl size="small" fullWidth>
                                            <Select
                                                value={mapping.selectedSubtipo}
                                                onChange={(e: SelectChangeEvent) =>
                                                    handleSubtipoChange(mapping.originalCode, e.target.value)
                                                }
                                                displayEmpty
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>Seleccionar...</em>
                                                </MenuItem>
                                                {subtipos.map(s => (
                                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        {mapping.autoMatching ? (
                                            <Chip
                                                icon={<CircularProgress size={12} />}
                                                label="Buscando..."
                                                color="info"
                                                size="small"
                                            />
                                        ) : mapping.codigoAgrocalidad ? (
                                            <Chip
                                                icon={<CheckIcon />}
                                                label={mapping.confidence >= 0.9 ? 'Auto' : 'Manual'}
                                                color="success"
                                                size="small"
                                            />
                                        ) : mapping.selectedSubtipo ? (
                                            <Chip
                                                icon={<WarningIcon />}
                                                label="No encontrado"
                                                color="warning"
                                                size="small"
                                            />
                                        ) : (
                                            <Chip
                                                label="Sin subtipo"
                                                color="default"
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Autocomplete
                                            size="small"
                                            options={searchResults[mapping.originalCode] || []}
                                            getOptionLabel={(opt) => `${opt.codigoAgrocalidad} - ${opt.nombreComun}`}
                                            value={mapping.codigoAgrocalidad ? {
                                                codigoAgrocalidad: mapping.codigoAgrocalidad,
                                                nombreComun: mapping.nombreComun
                                            } : null}
                                            onChange={(_, newValue) => handleSelectProduct(mapping.originalCode, newValue)}
                                            onInputChange={(_, value) => handleSearch(mapping.originalCode, value, mapping.selectedSubtipo)}
                                            loading={searchLoading[mapping.originalCode]}
                                            disabled={!mapping.selectedSubtipo}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder={mapping.selectedSubtipo ? "Buscar o editar..." : "Seleccione subtipo primero"}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5 }} fontSize="small" />,
                                                        endAdornment: (
                                                            <>
                                                                {searchLoading[mapping.originalCode] ? <CircularProgress size={16} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        )
                                                    }}
                                                />
                                            )}
                                            noOptionsText={mapping.selectedSubtipo ? "Escriba para buscar" : "Seleccione subtipo primero"}
                                            isOptionEqualToValue={(opt, val) => opt.codigoAgrocalidad === val.codigoAgrocalidad}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    });
