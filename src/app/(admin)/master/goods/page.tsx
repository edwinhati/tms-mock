"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormInput, FormSelect } from "@/components/ui/form-wrapper";
import { useCreateGood, useDeleteGood, useGoods } from "@/hooks/use-goods";
import { type GoodsFormValues, goodsSchema } from "@/lib/schemas";
import type { Good } from "@/types/tms";

const goodsUnits = [
  { value: "set", label: "Set" },
  { value: "unit", label: "Unit" },
  { value: "pcs", label: "Pieces" },
];

export default function GoodsPage() {
  const { data: goods, isLoading } = useGoods();
  const deleteGood = useDeleteGood();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: ColumnDef<Good>[] = [
    {
      accessorKey: "materialCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Material Code" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("materialCode")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.getValue("description")}</div>
      ),
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("unit")}</div>
      ),
    },
    {
      accessorKey: "defaultWeight",
      header: "Weight (kg)",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.defaultWeight || "-"}
        </div>
      ),
    },
    {
      accessorKey: "defaultVolume",
      header: "Volume (m³)",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.defaultVolume || "-"}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DataTableRowActions>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {}}
              >
                <IconEdit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(item.id)}
              >
                <IconTrash className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </DataTableRowActions>
        );
      },
    },
  ];

  const handleDelete = () => {
    if (deleteId) {
      deleteGood.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Goods item deleted successfully");
          setDeleteId(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete goods");
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goods</h1>
          <p className="text-sm text-muted-foreground">
            Manage your goods catalog and materials.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Goods
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Goods</DialogTitle>
              <DialogDescription>
                Create a new goods item. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <GoodsForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={goods || []}
        searchKey="description"
        searchPlaceholder="Search goods..."
        isLoading={isLoading}
        enableRowSelection
        enableColumnVisibility
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              goods item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GoodsForm({ onSuccess }: { onSuccess: () => void }) {
  const createGood = useCreateGood();

  const form = useForm<GoodsFormValues>({
    resolver: zodResolver(goodsSchema),
    defaultValues: {
      materialCode: "",
      description: "",
      unit: "pcs",
    },
  });

  const onSubmit = (data: GoodsFormValues) => {
    createGood.mutate(data, {
      onSuccess: () => {
        toast.success("Goods created successfully");
        onSuccess();
        form.reset();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create goods");
      },
    });
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormInput
        name="materialCode"
        label="Material Code"
        placeholder="e.g. MAT-001"
        required
      />
      <FormInput
        name="description"
        label="Description"
        placeholder="Goods description"
        required
      />
      <FormSelect
        name="unit"
        label="Unit"
        options={goodsUnits}
        placeholder="Select unit"
        required
      />
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={createGood.isPending}>
          {createGood.isPending ? "Creating..." : "Create Goods"}
        </Button>
      </DialogFooter>
    </Form>
  );
}
