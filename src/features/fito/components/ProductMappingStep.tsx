import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, TextField, Autocomplete, CircularProgress, Alert
} from '@mui/material';
import { CheckCircle as CheckIcon, Warning as WarningIcon, Search as SearchIcon } from '@mui/icons-material';
import { ProductMapping, ProductMatchResult, ProductCatalogItem, FitoGuiaHija } from '../types/fito.types';
import api from '../../../shared/services/api';

export interface ProductMappingStepRef {
    getMappings: () => ProductMapping[];
    isValid: () => boolean;
}

interface ProductMappingStepProps {
    hijas: FitoGuiaHija[];
    onValidityChange?: (isValid: boolean) => void;
}

export const ProductMappingStep = forwardRef<ProductMappingStepRef, ProductMappingStepProps>(
    ({ hijas, onValidityChange }, ref) => {
        const [mappings, setMappings] = useState<ProductMapping[]>([]);
        const [loading, setLoading] = useState(true);
        const [searchResults, setSearchResults] = useState<{ [key: string]: ProductCatalogItem[] }>({});
        const [searchLoading, setSearchLoading] = useState<{ [key: string]: boolean }>({});

        const allMapped = mappings.every(m => m.codigoAgrocalidad);
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

        // Extract unique product codes from hijas
        useEffect(() => {
            const productCodes = [...new Set(hijas.map(h => h.proCodigo))];

            const fetchMatches = async () => {
                setLoading(true);
                try {
                    const result = await api.post<ProductMatchResult[]>('/catalogs/productos/auto-match', {
                        productCodes
                    });

                    const initialMappings: ProductMapping[] = result.data.map(r => ({
                        originalCode: r.originalCode,
                        codigoAgrocalidad: r.catalogMatch?.codigoAgrocalidad || '',
                        nombreComun: r.catalogMatch?.nombreComun || '',
                        matched: r.matched,
                        confidence: r.confidence
                    }));

                    setMappings(initialMappings);
                } catch (error) {
                    console.error('Error auto-matching products:', error);
                    setMappings(productCodes.map(code => ({
                        originalCode: code,
                        codigoAgrocalidad: '',
                        nombreComun: '',
                        matched: false,
                        confidence: 0
                    })));
                } finally {
                    setLoading(false);
                }
            };

            fetchMatches();
        }, [hijas]);

        const handleSearch = async (originalCode: string, query: string) => {
            if (query.length < 2) {
                setSearchResults(prev => ({ ...prev, [originalCode]: [] }));
                return;
            }

            setSearchLoading(prev => ({ ...prev, [originalCode]: true }));
            try {
                const result = await api.get<ProductCatalogItem[]>(`/catalogs/productos/autocomplete?q=${encodeURIComponent(query)}`);
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

        if (loading) {
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Buscando coincidencias automáticas...</Typography>
                </Box>
            );
        }

        return (
            <Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600}>Mapeo de Productos</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Confirme o corrija el código Agrocalidad para cada producto
                        </Typography>
                    </Box>
                    <Chip
                        label={`${mappedCount}/${mappings.length} mapeados`}
                        color={allMapped ? 'success' : 'warning'}
                    />
                </Box>

                {!allMapped && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Hay productos sin mapear. Complete el mapeo antes de continuar.
                    </Alert>
                )}

                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                        maxHeight: { xs: 250, md: 300 },
                        overflow: 'auto',
                        '& .MuiTable-root': {
                            minWidth: { xs: 500, md: 'auto' }
                        }
                    }}
                >
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Código Original</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell sx={{ minWidth: 350 }}>Código Agrocalidad</TableCell>
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
                                        {mapping.codigoAgrocalidad ? (
                                            <Chip
                                                icon={<CheckIcon />}
                                                label={mapping.confidence >= 0.9 ? 'Auto' : 'Manual'}
                                                color="success"
                                                size="small"
                                            />
                                        ) : (
                                            <Chip
                                                icon={<WarningIcon />}
                                                label="Pendiente"
                                                color="warning"
                                                size="small"
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
                                            onInputChange={(_, value) => handleSearch(mapping.originalCode, value)}
                                            loading={searchLoading[mapping.originalCode]}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Buscar producto..."
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
                                            noOptionsText="Escriba para buscar"
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
