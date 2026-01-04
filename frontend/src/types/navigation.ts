export interface NavigationItem {
  id: string;
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  roles?: string[];
}

export interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}
