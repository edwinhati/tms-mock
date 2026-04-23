import type { LucideIcon } from "lucide-react";
import { Box, FileX, Inbox, Package, Search, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  inbox: Inbox,
  package: Package,
  truck: Truck,
  search: Search,
  users: Users,
  box: Box,
  fileX: FileX,
};

interface EmptyStateProps {
  icon?: keyof typeof iconMap | LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const IconComponent =
    typeof icon === "string" ? iconMap[icon] || Inbox : icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

interface TableEmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  entityName?: string;
}

export function TableEmptyState({
  searchQuery,
  onClearSearch,
  onAdd,
  addLabel = "Add New",
  entityName = "items",
}: TableEmptyStateProps) {
  if (searchQuery) {
    return (
      <EmptyState
        icon="search"
        title="No results found"
        description={`No ${entityName} match your search for "${searchQuery}".`}
        actionLabel="Clear search"
        onAction={onClearSearch}
      />
    );
  }

  return (
    <EmptyState
      icon="inbox"
      title={`No ${entityName} yet`}
      description={`Get started by creating your first ${entityName.slice(0, -1)}.`}
      actionLabel={addLabel}
      onAction={onAdd}
    />
  );
}

interface ShipmentEmptyStateProps {
  onCreate?: () => void;
}

export function ShipmentEmptyState({ onCreate }: ShipmentEmptyStateProps) {
  return (
    <EmptyState
      icon="truck"
      title="No shipments yet"
      description="Create your first shipment to start tracking deliveries."
      actionLabel="Create Shipment"
      onAction={onCreate}
    />
  );
}
