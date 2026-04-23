"use client";

import { format } from "date-fns";
import { ArrowLeft, Clock, Package, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageErrorState } from "@/components/ui/error-state";
import { Progress } from "@/components/ui/progress";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import {
  useShipment,
  useUpdateShipmentStatus,
  useUpdateLegStatus,
} from "@/hooks/use-shipments";

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: shipment, isLoading, isError, refetch } = useShipment(id);
  const updateStatus = useUpdateShipmentStatus();
  const updateLegStatus = useUpdateLegStatus();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <DetailPageSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <PageErrorState
          title="Failed to load shipment"
          message="Unable to load shipment details. Please check your connection and try again."
          onRetry={refetch}
          onBack={() => router.push("/shipments")}
          backLabel="Back to Shipments"
        />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <PageErrorState
          title="Shipment not found"
          message="The shipment you're looking for doesn't exist or has been deleted."
          onBack={() => router.push("/shipments")}
          backLabel="Back to Shipments"
        />
      </div>
    );
  }

  const handleStatusUpdate = (newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Shipment marked as ${newStatus.replace("_", " ")}`);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update status");
        },
      },
    );
  };

  const handleLegStatusUpdate = (legId: string, newStatus: string) => {
    updateLegStatus.mutate(
      { shipmentId: id, legId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Leg marked as ${newStatus.replace("_", " ")}`);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update leg status");
        },
      },
    );
  };

  const allLegsCompleted =
    shipment.legs &&
    shipment.legs.length > 0 &&
    shipment.legs.every((leg) => leg.status === "completed");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild className="flex-shrink-0">
          <Link href="/shipments">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">
            {shipment.shipmentNumber}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Created {format(new Date(shipment.createdAt), "MMM dd, yyyy")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={shipment.status} />
          {shipment.status !== "planned" && shipment.status !== "cancelled" && (
            <div className="w-32 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Progress</span>
                <span>{shipment.calculatedProgress || 0}%</span>
              </div>
              <Progress
                value={shipment.calculatedProgress || 0}
                className="h-1.5"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Shipment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Origin</p>
                  <p className="font-medium">{shipment.originName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium">
                    {shipment.destinationName || "-"}
                  </p>
                </div>
              </div>
              {shipment.scheduledDate && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Scheduled Date
                  </p>
                  <p className="font-medium">
                    {format(
                      new Date(shipment.scheduledDate),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </p>
                </div>
              )}
              {shipment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{shipment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Journey Legs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.legs && shipment.legs.length > 0 ? (
                <div className="space-y-4">
                  {shipment.legs.map((leg, index) => {
                    const isFirstLeg = leg.legNumber === 1;
                    const prevLeg =
                      index > 0 ? shipment.legs![index - 1] : null;
                    const canStart =
                      isFirstLeg || prevLeg?.status === "completed";

                    return (
                      <div key={leg.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                          <div>
                            <p className="font-semibold">Leg {leg.legNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {leg.originName} → {leg.destinationName}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <LegStatusBadge status={leg.status} />
                            {leg.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() =>
                                  handleLegStatusUpdate(leg.id, "in_progress")
                                }
                                disabled={
                                  !canStart || updateLegStatus.isPending
                                }
                              >
                                Start Leg
                              </Button>
                            )}
                            {leg.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() =>
                                  handleLegStatusUpdate(leg.id, "completed")
                                }
                                disabled={updateLegStatus.isPending}
                              >
                                Mark Completed
                              </Button>
                            )}
                          </div>
                        </div>
                        {leg.vehicle && (
                          <p className="text-sm">
                            Vehicle:{" "}
                            {leg.vehicle.licensePlate || leg.vehicle.type}
                          </p>
                        )}
                        {leg.driver && (
                          <p className="text-sm">Driver: {leg.driver.name}</p>
                        )}
                        <div className="mt-4 space-y-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Leg Progress</span>
                            <span>
                              {leg.status === "completed"
                                ? "100%"
                                : leg.status === "in_progress"
                                  ? "50%"
                                  : "0%"}
                            </span>
                          </div>
                          <Progress
                            value={
                              leg.status === "completed"
                                ? 100
                                : leg.status === "in_progress"
                                  ? 50
                                  : 0
                            }
                            className="h-1.5"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon="truck"
                  title="No journey legs"
                  description="No legs have been defined for this shipment yet."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.items && shipment.items.length > 0 ? (
                <div className="space-y-2">
                  {shipment.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b last:border-0 gap-2"
                    >
                      <div>
                        <p className="font-medium">{item.goods?.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {item.goods?.materialCode}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-medium">
                          {item.quantity} {item.goods?.unit}
                        </p>
                        {item.weight && (
                          <p className="text-sm text-muted-foreground">
                            {item.weight} kg
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="package"
                  title="No items"
                  description="No items have been added to this shipment."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.statusHistory && shipment.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {shipment.statusHistory.map((history) => (
                    <div key={history.id} className="flex gap-3">
                      <div className="mt-1 flex-shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{history.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(history.createdAt), "MMM dd, HH:mm")}
                        </p>
                        {history.notes && (
                          <p className="text-sm mt-1 break-words">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="inbox"
                  title="No history"
                  description="No status changes have been recorded."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {shipment.status === "planned" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate("in_transit")}
                  disabled={updateStatus.isPending}
                >
                  Start Shipment
                </Button>
              )}
              {shipment.status === "in_transit" && (
                <div className="space-y-1">
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("delivered")}
                    disabled={updateStatus.isPending || !allLegsCompleted}
                  >
                    Mark Delivered
                  </Button>
                  {!allLegsCompleted && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Finish all legs first
                    </p>
                  )}
                </div>
              )}
              <Button variant="outline" className="w-full">
                Generate BAST
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    planned: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    in_transit: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    delivered: "bg-green-100 text-green-800 hover:bg-green-100",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
  };

  return (
    <Badge className={variants[status] || "bg-gray-100"} variant="outline">
      {status.replace("_", " ")}
    </Badge>
  );
}

function LegStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <Badge variant="outline" className={variants[status] || "bg-gray-100"}>
      {status.replace("_", " ")}
    </Badge>
  );
}
