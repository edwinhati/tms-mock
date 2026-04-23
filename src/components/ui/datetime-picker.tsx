"use client";

import { format, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: string; // ISO string or "YYYY-MM-DDTHH:mm"
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
  disabled,
  id,
  "aria-invalid": ariaInvalid,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current value into date and time parts
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  const timeValue = React.useMemo(() => {
    if (!parsedDate) return "00:00";
    return format(parsedDate, "HH:mm");
  }, [parsedDate]);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange?.("");
      return;
    }
    // Preserve existing time or default to 00:00
    const [hours, minutes] = timeValue.split(":").map(Number);
    day.setHours(hours, minutes, 0, 0);
    onChange?.(format(day, "yyyy-MM-dd'T'HH:mm"));
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (!parsedDate) {
      // No date selected yet — just store time for when date is picked
      return;
    }
    const [hours, minutes] = time.split(":").map(Number);
    const updated = new Date(parsedDate);
    updated.setHours(hours, minutes, 0, 0);
    onChange?.(format(updated, "yyyy-MM-dd'T'HH:mm"));
  };

  return (
    <div className="flex items-center gap-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            data-empty={!parsedDate}
            aria-invalid={ariaInvalid}
            className={cn(
              "rounded-r-none border-r-0 flex-1 justify-start text-left font-normal",
              "data-[empty=true]:text-muted-foreground",
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {parsedDate ? (
              format(parsedDate, "MMM d, yyyy")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleDaySelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Input
        id={`${id}-time`}
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        disabled={disabled || !parsedDate}
        aria-label="Time"
        className={cn(
          "w-[110px] rounded-l-none border-l-0 pl-12",
          !parsedDate && "text-muted-foreground",
        )}
      />
    </div>
  );
}
