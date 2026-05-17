export interface DaeListItem {
  raw: Record<string, string>;
}

export interface DaeListPage {
  items: DaeListItem[];
  page: number;
  hasNextPage: boolean;
  columns: string[];
  retrievedAt: string;
}
