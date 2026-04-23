"use client";

import * as React from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  type UseFormProps,
  type UseFormReturn,
  type FieldPath,
  type FieldValues,
  Controller,
  type ControllerProps,
  type FieldPathValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

// ============================================================================
// Form Wrapper Component
// ============================================================================

interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (values: TFieldValues) => void;
  form: UseFormReturn<TFieldValues>;
}

function Form<TFieldValues extends FieldValues>({
  children,
  className,
  onSubmit,
  form,
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit || (() => {}))}
        className={cn("space-y-6", className)}
      >
        {children}
      </form>
    </FormProvider>
  );
}

// ============================================================================
// useFormField Hook
// ============================================================================

function useFormField<TFieldValues extends FieldValues = FieldValues>() {
  const formContext = useFormContext<TFieldValues>();

  if (!formContext) {
    throw new Error("useFormField must be used within a FormProvider");
  }

  return formContext;
}

// ============================================================================
// FormField Component
// ============================================================================

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, "render"> {
  label?: string;
  description?: string;
  required?: boolean;
  children: (props: {
    field: {
      value: FieldPathValue<TFieldValues, TName>;
      onChange: (value: FieldPathValue<TFieldValues, TName>) => void;
      onBlur: () => void;
      name: TName;
      ref: React.RefCallback<any>;
      disabled?: boolean;
    };
    fieldState: {
      error?: { message?: string };
      isDirty: boolean;
      isTouched: boolean;
      isValidating: boolean;
    };
  }) => React.ReactNode;
}

function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  required,
  children,
  ...controllerProps
}: FormFieldProps<TFieldValues, TName>) {
  const { control, formState } = useFormField<TFieldValues>();
  const error = formState.errors[name];

  return (
    <Controller
      name={name}
      control={control}
      {...controllerProps}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!error} data-disabled={field.disabled}>
          {label && (
            <FieldLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FieldLabel>
          )}
          <FieldGroup className="gap-2">
            {children({ field, fieldState })}
            {error && <FieldError>{error.message as string}</FieldError>}
            {description && !error && (
              <FieldDescription>{description}</FieldDescription>
            )}
          </FieldGroup>
        </Field>
      )}
    />
  );
}

// ============================================================================
// FormInput Component
// ============================================================================

interface FormInputProps<TFieldValues extends FieldValues>
  extends Omit<React.ComponentProps<typeof Input>, "name"> {
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  required?: boolean;
}

function FormInput<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  required,
  className,
  ...props
}: FormInputProps<TFieldValues>) {
  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      label={label}
      description={description}
      required={required}
    >
      {({ field, fieldState }) => (
        <Input
          {...field}
          {...props}
          value={field.value as string}
          onChange={(e) => (field.onChange as any)(e.target.value)}
          aria-invalid={fieldState.error ? "true" : "false"}
          className={cn(className)}
        />
      )}
    </FormField>
  );
}

// ============================================================================
// FormTextarea Component
// ============================================================================

interface FormTextareaProps<TFieldValues extends FieldValues>
  extends Omit<React.ComponentProps<typeof Textarea>, "name"> {
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  required?: boolean;
}

function FormTextarea<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  required,
  className,
  ...props
}: FormTextareaProps<TFieldValues>) {
  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      label={label}
      description={description}
      required={required}
    >
      {({ field, fieldState }) => (
        <Textarea
          {...field}
          {...props}
          value={field.value as string}
          onChange={(e) => (field.onChange as any)(e.target.value)}
          aria-invalid={fieldState.error ? "true" : "false"}
          className={cn(className)}
        />
      )}
    </FormField>
  );
}

// ============================================================================
// FormSelect Component
// ============================================================================

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: FormSelectOption[];
  className?: string;
}

function FormSelect<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  required,
  disabled,
  placeholder,
  options,
  className,
}: FormSelectProps<TFieldValues>) {
  return (
    <FormField<TFieldValues, typeof name>
      name={name}
      label={label}
      description={description}
      required={required}
    >
      {({ field, fieldState }) => (
        <Combobox
          value={field.value as any}
          onValueChange={field.onChange as any}
          disabled={disabled || field.disabled}
        >
          <ComboboxInput
            placeholder={placeholder}
            aria-invalid={fieldState.error ? "true" : "false"}
            className={cn(className)}
            disabled={disabled || field.disabled}
          />
          <ComboboxContent>
            <ComboboxEmpty>No options found.</ComboboxEmpty>
            <ComboboxList>
              {options.map((option) => (
                <ComboboxItem key={option.value} value={option.value}>
                  {option.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}
    </FormField>
  );
}

// ============================================================================
// createForm Hook Helper
// ============================================================================

interface CreateFormOptions<TSchema extends z.ZodType<any, any>> {
  schema: TSchema;
  defaultValues?: UseFormProps<z.infer<TSchema>>["defaultValues"];
}

function createForm<TSchema extends z.ZodType<any, any>>({
  schema,
  defaultValues,
}: CreateFormOptions<TSchema>) {
  type FormValues = z.infer<TSchema>;

  function useFormInstance(
    props?: Omit<UseFormProps<FormValues>, "resolver" | "defaultValues">,
  ) {
    return useForm<FormValues>({
      resolver: zodResolver(schema) as any,
      defaultValues: defaultValues as UseFormProps<FormValues>["defaultValues"],
      ...props,
    });
  }

  return { useFormInstance };
}

// ============================================================================
// Exports
// ============================================================================

export {
  Form,
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  useFormField,
  createForm,
  type FormProps,
  type FormFieldProps,
  type FormInputProps,
  type FormTextareaProps,
  type FormSelectProps,
};
