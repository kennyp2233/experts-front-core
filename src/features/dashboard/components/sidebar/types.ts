export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  children?: MenuItem[];
  roles?: string[];
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export interface MenuItemContextValue {
  expandedItems: Record<string, boolean>;
  toggleExpand: (key: string) => void;
  isActive: (href?: string) => boolean;
  isChildActive: (children?: MenuItem[]) => boolean;
  user?: any;
}
