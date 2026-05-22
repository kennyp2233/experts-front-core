export type SyncStatus =
  | 'SYNCED'
  | 'ONLY_ACCESS'
  | 'ONLY_EBF'
  | 'MISMATCH'
  | 'MANUAL_REVIEW'
  | 'IGNORED';

export type SyncStatusFilter = SyncStatus | 'ALL';

export type MatchStrategy =
  | 'AWB_EXACT'
  | 'DAE_ONLY'
  | 'COMPOSITE'
  | 'MANUAL'
  | 'NONE';

/** Snapshot del lado access para una coordinación EBF (1 detalleId → N filas access). */
export interface EbfDetalleAccessLink {
  id: number;
  accessBodCodigo: number;
  accessDocTipo: string;
  accessDocNumero: number;
  accessDetNumero: number | null;
  accessHawb: string | null; // BigInt comes back as string in JSON
  accessPlaCodigo: number | null;
  accessProCodigo: string | null;
  accessFue: string | null;
  matchReason: string;
  createdAt: string;
}

/** Fila del side-car. */
export interface EbfCoordinacionSync {
  id: number;
  ebfDetalleId: number;
  ebfHawbCode: string | null;
  ebfAwbCustomerId: number | null;
  awbNumber: string;
  daeNumber: string | null;
  exportadorEbf: string;
  consigneeAlias: string | null;
  productoEbf: string | null;
  productoEbfId: number | null;
  fechaVuelo: string | null;
  destinoFinal: string | null;
  ebfFbCoo: number | null;
  ebfHbCoo: number | null;
  ebfQbCoo: number | null;
  ebfEbCoo: number | null;
  ebfBxsCoo: number | null;
  ebfPcsCoo: number | null;
  ebfBxsWh: number | null;
  ebfPcsWh: number | null;
  matchStrategy: MatchStrategy;
  matchConfidence: number;
  status: SyncStatus;
  isOwnedByExperts: boolean;
  discrepancies: Record<string, { access: unknown; ebf: unknown }> | null;
  lastSyncAt: string | null;
  lastChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
  accessLinks: EbfDetalleAccessLink[];
}

/** Conteos por bucket. */
export interface SyncStats {
  total: number;
  byStatus: Partial<Record<SyncStatus, number>>;
}

/** Resultado de un ciclo (manual trigger). */
export interface SyncCycleReport {
  startedAt: string;
  endedAt: string;
  durationMs: number;
  totals: {
    accessRows: number;
    ebfRows: number;
    matched: number;
    onlyAccess: number;
    onlyEbf: number;
    mismatches: number;
    ignored: number;
    upserted: number;
  };
  errors: Array<{ stage: string; message: string }>;
}
