"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { FormSkeleton, StepIndicatorSkeleton } from "@/components/ui/skeletons";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/use-customers";
import { useDrivers } from "@/hooks/use-drivers";
import { useGoods } from "@/hooks/use-goods";
import { useSites, type SiteType } from "@/hooks/use-sites";
import { useCreateShipment } from "@/hooks/use-shipments";
import { useVehicles } from "@/hooks/use-vehicles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schemas
const shipmentItemSchema = z.object({
  goodsId: z.string().min(1, "Please select goods"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  weight: z.number().optional(),
  volume: z.number().optional(),
  notes: z.string().optional(),
});

const siteTypeEnum = z.enum([
  "warehouse",
  "hub",
  "port",
  "school",
  "vendor",
  "customer",
]);

const shipmentLegSchema = z.object({
  legNumber: z.number(),
  originType: siteTypeEnum,
  originId: z.string().min(1, "Please select origin location"),
  destinationType: siteTypeEnum,
  destinationId: z.string().min(1, "Please select destination location"),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  plannedDeparture: z.string().optional(),
  plannedArrival: z.string().optional(),
  notes: z.string().optional(),
});

const formSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  originType: siteTypeEnum,
  originId: z.string().min(1, "Please select origin location"),
  destinationType: siteTypeEnum,
  destinationId: z.string().min(1, "Please select destination location"),
  scheduledDate: z.string().optional(),
  slaDeadline: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(shipmentItemSchema).min(1, "Add at least one item"),
  legs: z.array(shipmentLegSchema).min(1, "Add at least one leg"),
});

type FormData = z.infer<typeof formSchema>;

const siteTypes: { value: SiteType; label: string }[] = [
  { value: "warehouse", label: "Warehouse" },
  { value: "hub", label: "Hub" },
  { value: "port", label: "Port" },
  { value: "school", label: "School" },
  { value: "vendor", label: "Vendor" },
  { value: "customer", label: "Customer" },
];

export default function CreateShipmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const createShipment = useCreateShipment();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      originType: "warehouse",
      originId: "",
      destinationType: "customer",
      destinationId: "",
      scheduledDate: "",
      slaDeadline: "",
      notes: "",
      items: [{ goodsId: "", quantity: 1 }],
      legs: [
        {
          legNumber: 1,
          originType: "warehouse",
          originId: "",
          destinationType: "customer",
          destinationId: "",
        },
      ],
    },
    mode: "onChange",
  });

  const {
    data: customers,
    isLoading: customersLoading,
    isError: customersError,
    refetch: refetchCustomers,
  } = useCustomers();

  const {
    data: vehicles,
    isLoading: vehiclesLoading,
    isError: vehiclesError,
    refetch: refetchVehicles,
  } = useVehicles();

  const {
    data: drivers,
    isLoading: driversLoading,
    isError: driversError,
    refetch: refetchDrivers,
  } = useDrivers();

  const {
    data: goods,
    isLoading: goodsLoading,
    isError: goodsError,
    refetch: refetchGoods,
  } = useGoods();

  const isStep1Loading = customersLoading;
  const isStep1Error = customersError;
  const isStep2Loading = goodsLoading;
  const isStep2Error = goodsError;
  const isStep3Loading = vehiclesLoading || driversLoading;
  const isStep3Error = vehiclesError || driversError;

  const handleSubmit = (data: FormData) => {
    const payload = {
      ...data,
      items: data.items.filter((i) => i.goodsId && i.quantity > 0),
      legs: data.legs.filter((l) => l.originId && l.destinationId),
    };

    createShipment.mutate(payload, {
      onSuccess: () => {
        toast.success("Shipment created successfully");
        router.push("/shipments");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create shipment");
      },
    });
  };

  const canProceedToStep2 = () => {
    const { customerId, originId, destinationId } = form.getValues();
    return customerId && originId && destinationId;
  };

  const canProceedToStep3 = () => {
    const { items } = form.getValues();
    return (
      items.length > 0 &&
      items.every((item) => item.goodsId && item.quantity > 0)
    );
  };

  const getStepError = () => {
    if (step === 1 && isStep1Error) {
      return {
        title: "Failed to load data",
        message: "Unable to load customers. Please try again.",
        onRetry: () => {
          refetchCustomers();
        },
      };
    }
    if (step === 2 && isStep2Error) {
      return {
        title: "Failed to load data",
        message: "Unable to load goods catalog. Please try again.",
        onRetry: refetchGoods,
      };
    }
    if (step === 3 && isStep3Error) {
      return {
        title: "Failed to load data",
        message: "Unable to load vehicles or drivers. Please try again.",
        onRetry: () => {
          refetchVehicles();
          refetchDrivers();
        },
      };
    }
    return null;
  };

  const stepError = getStepError();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Create New Shipment</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the shipment details across three steps
        </p>
      </div>

      <div className="mb-6 sm:mb-8">
        {(step === 1 && isStep1Loading) ||
        (step === 2 && isStep2Loading) ||
        (step === 3 && isStep3Loading) ? (
          <StepIndicatorSkeleton stepCount={3} />
        ) : (
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {["Order Details", "Items", "Routing"].map((label, index) => (
              <div key={label} className="flex items-center">
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 transition-colors ${
                    step > index + 1
                      ? "bg-green-600 text-white"
                      : step === index + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > index + 1 ? "✓" : index + 1}
                </div>
                <span className="ml-2 text-sm font-medium whitespace-nowrap">
                  {label}
                </span>
                {index < 2 && (
                  <div className="w-8 sm:w-16 lg:w-24 h-px bg-border mx-2 sm:mx-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {stepError ? (
        <ErrorState
          title={stepError.title}
          message={stepError.message}
          onRetry={stepError.onRetry}
        />
      ) : (
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {step === 1 && (
            <>
              {isStep1Loading ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormSkeleton fieldCount={6} />
                  </CardContent>
                </Card>
              ) : (
                <OrderDetailsStep form={form} customers={customers || []} />
              )}
            </>
          )}

          {step === 2 && (
            <>
              {isStep2Loading ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Shipment Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormSkeleton fieldCount={4} />
                  </CardContent>
                </Card>
              ) : (
                <ItemsStep form={form} goods={goods || []} />
              )}
            </>
          )}

          {step === 3 && (
            <>
              {isStep3Loading ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Routing & Legs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormSkeleton fieldCount={6} />
                  </CardContent>
                </Card>
              ) : (
                <RoutingStep
                  form={form}
                  vehicles={vehicles || []}
                  drivers={drivers || []}
                />
              )}
            </>
          )}

          <div className="flex flex-col sm:flex-row justify-between mt-8 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="size-4 mr-2" data-icon="inline-start" />
              Previous
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && !canProceedToStep2()) {
                    toast.error("Please fill in all required fields");
                    return;
                  }
                  if (step === 2 && !canProceedToStep3()) {
                    toast.error(
                      "Please add at least one item with valid details",
                    );
                    return;
                  }
                  setStep(step + 1);
                }}
                disabled={
                  (step === 1 && isStep1Loading) ||
                  (step === 2 && isStep2Loading) ||
                  (step === 3 && isStep3Loading)
                }
                className="w-full sm:w-auto"
              >
                Next
                <ArrowRight className="size-4 ml-2" data-icon="inline-end" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createShipment.isPending || isStep3Loading}
                className="w-full sm:w-auto"
              >
                {createShipment.isPending ? (
                  <>
                    <Loader2
                      className="size-4 mr-2 animate-spin"
                      data-icon="inline-start"
                    />
                    Creating...
                  </>
                ) : (
                  "Create Shipment"
                )}
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function OrderDetailsStep({
  form,
  customers,
}: {
  form: ReturnType<typeof useForm<FormData>>;
  customers: { id: string; name: string }[];
}) {
  const originType = useWatch({ control: form.control, name: "originType" });
  const destinationType = useWatch({
    control: form.control,
    name: "destinationType",
  });

  const { data: originSites, isLoading: originLoading } = useSites(
    originType as SiteType,
  );
  const { data: destinationSites, isLoading: destinationLoading } = useSites(
    destinationType as SiteType,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
        <CardDescription>
          Select customer and shipment locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Controller
            name="customerId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="customer">Customer *</FieldLabel>
                <Combobox
                  items={customers}
                  value={customers.find((c) => c.id === field.value) ?? null}
                  onValueChange={(v) => field.onChange(v?.id ?? "")}
                  itemToStringLabel={(c) => c.name}
                  itemToStringValue={(c) => c.id}
                  isItemEqualToValue={(a, b) => a.id === b.id}
                >
                  <ComboboxInput
                    id="customer"
                    placeholder="Select customer"
                    aria-invalid={fieldState.invalid}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No customer found.</ComboboxEmpty>
                    <ComboboxList>
                      {(c) => (
                        <ComboboxItem key={c.id} value={c}>
                          {c.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="originType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Origin Type *</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {siteTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="originId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="origin">Origin Location *</FieldLabel>
                  <Combobox
                    value={
                      originSites.find((l) => l.id === field.value) ?? null
                    }
                    onValueChange={(v) => field.onChange(v?.id ?? "")}
                    items={originSites}
                    itemToStringLabel={(l) => l.name}
                    itemToStringValue={(l) => l.id}
                    isItemEqualToValue={(a, b) => a.id === b.id}
                  >
                    <ComboboxInput
                      id="origin"
                      placeholder={
                        originLoading ? "Loading..." : "Select origin"
                      }
                      disabled={originLoading}
                      aria-invalid={fieldState.invalid}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No location found.</ComboboxEmpty>
                      <ComboboxList>
                        {(l) => (
                          <ComboboxItem key={l.id} value={l}>
                            {l.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="destinationType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Destination Type *</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {siteTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="destinationId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="destination">
                    Destination Location *
                  </FieldLabel>
                  <Combobox
                    value={
                      destinationSites.find((l) => l.id === field.value) ?? null
                    }
                    onValueChange={(v) => field.onChange(v?.id ?? "")}
                    items={destinationSites}
                    itemToStringLabel={(l) => l.name}
                    itemToStringValue={(l) => l.id}
                    isItemEqualToValue={(a, b) => a.id === b.id}
                  >
                    <ComboboxInput
                      id="destination"
                      placeholder={
                        destinationLoading ? "Loading..." : "Select destination"
                      }
                      disabled={destinationLoading}
                      aria-invalid={fieldState.invalid}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No location found.</ComboboxEmpty>
                      <ComboboxList>
                        {(l) => (
                          <ComboboxItem key={l.id} value={l}>
                            {l.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="scheduledDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="scheduled">Scheduled Date</FieldLabel>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    id="scheduled"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    When the shipment should start
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="slaDeadline"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sla">SLA Deadline</FieldLabel>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    id="sla"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Service level agreement deadline
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  {...field}
                  id="notes"
                  aria-invalid={fieldState.invalid}
                  placeholder="Additional notes or special instructions..."
                  className="min-h-[100px]"
                />
                <FieldDescription>
                  Any additional information about this shipment
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function ItemsStep({
  form,
  goods,
}: {
  form: ReturnType<typeof useForm<FormData>>;
  goods: { id: string; description: string; materialCode: string }[];
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Items</CardTitle>
        <CardDescription>
          Add items to be shipped (at least one required)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet className="gap-4">
          <FieldGroup className="gap-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2
                        className="size-4 text-destructive"
                        data-icon="inline-start"
                      />
                      Remove
                    </Button>
                  )}
                </div>

                <FieldGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name={`items.${index}.goodsId`}
                      control={form.control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`goods-${index}`}>
                            Goods *
                          </FieldLabel>
                          <Combobox
                            value={
                              goods.find(
                                (g) => g.id === controllerField.value,
                              ) ?? null
                            }
                            onValueChange={(v) =>
                              controllerField.onChange(v?.id ?? "")
                            }
                            items={goods}
                            itemToStringLabel={(g) => g.description}
                            itemToStringValue={(g) => g.id}
                            isItemEqualToValue={(a, b) => a.id === b.id}
                          >
                            <ComboboxInput
                              id={`goods-${index}`}
                              placeholder="Select goods"
                              aria-invalid={fieldState.invalid}
                            />
                            <ComboboxContent>
                              <ComboboxEmpty>No goods found.</ComboboxEmpty>
                              <ComboboxList>
                                {(g) => (
                                  <ComboboxItem key={g.id} value={g}>
                                    {g.description} ({g.materialCode})
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name={`items.${index}.quantity`}
                      control={form.control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`quantity-${index}`}>
                            Quantity *
                          </FieldLabel>
                          <Input
                            {...controllerField}
                            id={`quantity-${index}`}
                            type="number"
                            min={1}
                            aria-invalid={fieldState.invalid}
                            onChange={(e) =>
                              controllerField.onChange(
                                parseInt(e.target.value) || 1,
                              )
                            }
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name={`items.${index}.weight`}
                      control={form.control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`weight-${index}`}>
                            Weight (kg)
                          </FieldLabel>
                          <Input
                            {...controllerField}
                            id={`weight-${index}`}
                            type="number"
                            step="0.01"
                            aria-invalid={fieldState.invalid}
                            onChange={(e) =>
                              controllerField.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              )
                            }
                            value={controllerField.value || ""}
                          />
                          <FieldDescription>Optional</FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name={`items.${index}.volume`}
                      control={form.control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={`volume-${index}`}>
                            Volume (m³)
                          </FieldLabel>
                          <Input
                            {...controllerField}
                            id={`volume-${index}`}
                            type="number"
                            step="0.01"
                            aria-invalid={fieldState.invalid}
                            onChange={(e) =>
                              controllerField.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              )
                            }
                            value={controllerField.value || ""}
                          />
                          <FieldDescription>Optional</FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </FieldGroup>
              </div>
            ))}
          </FieldGroup>

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ goodsId: "", quantity: 1 })}
            className="w-full"
          >
            <Plus className="size-4 mr-2" data-icon="inline-start" />
            Add Item
          </Button>
        </FieldSet>
      </CardContent>
    </Card>
  );
}

function RoutingStep({
  form,
  vehicles,
  drivers,
}: {
  form: ReturnType<typeof useForm<FormData>>;
  vehicles: {
    id: string;
    licensePlate?: string | null | undefined;
    type: string;
  }[];
  drivers: { id: string; name: string; phone?: string | null }[];
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "legs",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Routing & Legs</CardTitle>
        <CardDescription>
          Define the route with one or more legs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet className="gap-4">
          <FieldGroup className="gap-6">
            {fields.map((field, index) => (
              <LegItem
                key={field.id}
                index={index}
                form={form}
                vehicles={vehicles}
                drivers={drivers}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}
          </FieldGroup>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                legNumber: fields.length + 1,
                originType: "warehouse",
                originId: "",
                destinationType: "customer",
                destinationId: "",
              })
            }
            className="w-full"
          >
            <Plus className="size-4 mr-2" data-icon="inline-start" />
            Add Leg
          </Button>
        </FieldSet>
      </CardContent>
    </Card>
  );
}

function LegItem({
  index,
  form,
  vehicles,
  drivers,
  onRemove,
  canRemove,
}: {
  index: number;
  form: ReturnType<typeof useForm<FormData>>;
  vehicles: {
    id: string;
    licensePlate?: string | null | undefined;
    type: string;
  }[];
  drivers: { id: string; name: string; phone?: string | null }[];
  onRemove: () => void;
  canRemove: boolean;
}) {
  const originType = useWatch({
    control: form.control,
    name: `legs.${index}.originType` as const,
  });
  const destinationType = useWatch({
    control: form.control,
    name: `legs.${index}.destinationType` as const,
  });

  const { data: originSites, isLoading: originLoading } = useSites(
    originType as SiteType,
  );
  const { data: destinationSites, isLoading: destinationLoading } = useSites(
    destinationType as SiteType,
  );

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Leg {index + 1}</h4>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2
              className="size-4 text-destructive"
              data-icon="inline-start"
            />
            Remove
          </Button>
        )}
      </div>

      <FieldGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name={`legs.${index}.originType` as const}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Origin Type *</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {siteTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name={`legs.${index}.originId` as const}
            control={form.control}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`leg-origin-${index}`}>
                  Origin *
                </FieldLabel>
                <Combobox
                  value={
                    originSites.find((l) => l.id === controllerField.value) ??
                    null
                  }
                  onValueChange={(v) => controllerField.onChange(v?.id ?? "")}
                  items={originSites}
                  itemToStringLabel={(l) => l.name}
                  itemToStringValue={(l) => l.id}
                  isItemEqualToValue={(a, b) => a.id === b.id}
                >
                  <ComboboxInput
                    id={`leg-origin-${index}`}
                    placeholder={originLoading ? "Loading..." : "Select origin"}
                    disabled={originLoading}
                    aria-invalid={fieldState.invalid}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No location found.</ComboboxEmpty>
                    <ComboboxList>
                      {(l) => (
                        <ComboboxItem key={l.id} value={l}>
                          {l.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name={`legs.${index}.destinationType` as const}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Destination Type *</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {siteTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name={`legs.${index}.destinationId` as const}
            control={form.control}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`leg-dest-${index}`}>
                  Destination *
                </FieldLabel>
                <Combobox
                  value={
                    destinationSites.find(
                      (l) => l.id === controllerField.value,
                    ) ?? null
                  }
                  onValueChange={(v) => controllerField.onChange(v?.id ?? "")}
                  items={destinationSites}
                  itemToStringLabel={(l) => l.name}
                  itemToStringValue={(l) => l.id}
                  isItemEqualToValue={(a, b) => a.id === b.id}
                >
                  <ComboboxInput
                    id={`leg-dest-${index}`}
                    placeholder={
                      destinationLoading ? "Loading..." : "Select destination"
                    }
                    disabled={destinationLoading}
                    aria-invalid={fieldState.invalid}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No location found.</ComboboxEmpty>
                    <ComboboxList>
                      {(l) => (
                        <ComboboxItem key={l.id} value={l}>
                          {l.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name={`legs.${index}.vehicleId` as const}
            control={form.control}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`leg-vehicle-${index}`}>
                  Vehicle
                </FieldLabel>
                <Combobox
                  value={
                    vehicles.find(
                      (v) => v.id === (controllerField.value || ""),
                    ) ?? null
                  }
                  onValueChange={(v) => controllerField.onChange(v?.id)}
                  items={vehicles}
                  itemToStringLabel={(v) => v.licensePlate || v.type}
                  itemToStringValue={(v) => v.id}
                  isItemEqualToValue={(a, b) => a.id === b.id}
                >
                  <ComboboxInput
                    id={`leg-vehicle-${index}`}
                    placeholder="Select vehicle"
                    aria-invalid={fieldState.invalid}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No vehicle found.</ComboboxEmpty>
                    <ComboboxList>
                      {(v) => (
                        <ComboboxItem key={v.id} value={v}>
                          {v.licensePlate || v.type} ({v.type})
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldDescription>Optional</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name={`legs.${index}.driverId` as const}
            control={form.control}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`leg-driver-${index}`}>Driver</FieldLabel>
                <Combobox
                  value={
                    drivers.find(
                      (d) => d.id === (controllerField.value || ""),
                    ) ?? null
                  }
                  onValueChange={(v) => controllerField.onChange(v?.id)}
                  items={drivers}
                  itemToStringLabel={(d) => d.name}
                  itemToStringValue={(d) => d.id}
                  isItemEqualToValue={(a, b) => a.id === b.id}
                >
                  <ComboboxInput
                    id={`leg-driver-${index}`}
                    placeholder="Select driver"
                    aria-invalid={fieldState.invalid}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No driver found.</ComboboxEmpty>
                    <ComboboxList>
                      {(d) => (
                        <ComboboxItem key={d.id} value={d}>
                          {d.name} ({d.phone})
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldDescription>Optional</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name={`legs.${index}.plannedDeparture` as const}
            control={form.control}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`leg-departure-${index}`}>
                  Planned Departure
                </FieldLabel>
                <DateTimePicker
                  value={controllerField.value}
                  onChange={controllerField.onChange}
                  id={`leg-departure-${index}`}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>Optional</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name={`legs.${index}.plannedArrival` as const}
            control={form.control}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`leg-arrival-${index}`}>
                  Planned Arrival
                </FieldLabel>
                <DateTimePicker
                  value={controllerField.value}
                  onChange={controllerField.onChange}
                  id={`leg-arrival-${index}`}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>Optional</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
