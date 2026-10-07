export interface DaeListItem {
  /** Valores por nombre de columna del portal (ver `DaeListPage.columns`). */
  raw: Record<string, string>;
  /**
   * Estado de vigencia, si el back lo expone fuera de `raw`. Se acepta
   * 'Sí'/'No', 'SI'/'NO', true/false, '1'/'0'.
   */
  vigente?: boolean | string | null;
}

export interface DaeListPage {
  items: DaeListItem[];
  page: number;
  hasNextPage: boolean;
  columns: string[];
  retrievedAt: string;
}
