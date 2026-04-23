// Notification service for sending WhatsApp notifications

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema/tms";
import {
  formatPhoneNumber,
  sendWhatsAppNotification,
} from "@/lib/whatsapp/client";
import { templates, type WhatsAppTemplate } from "@/lib/whatsapp/templates";

export interface NotificationPayload {
  type:
    | "driver_assigned"
    | "status_update"
    | "delivery_complete"
    | "delay_alert"
    | "pickup_reminder"
    | "delivery_confirmation";
  recipient: string; // Phone number
  data: Record<string, string>;
}

/**
 * Send notification and log to database
 */
export async function sendNotification(
  payload: NotificationPayload,
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    // Format phone number
    const formattedPhone = formatPhoneNumber(payload.recipient);

    // Create notification record
    const [notification] = await db
      .insert(notifications)
      .values({
        id: crypto.randomUUID(),
        type: "whatsapp",
        recipient: formattedPhone,
        template: payload.type,
        data: payload.data,
        status: "pending",
      })
      .returning();

    // Build WhatsApp message based on type
    let template: WhatsAppTemplate;
    switch (payload.type) {
      case "driver_assigned":
        template = templates.driverAssigned(
          payload.data.driverName,
          payload.data.shipmentNumber,
        );
        break;
      case "status_update":
        template = templates.statusUpdate(
          payload.data.shipmentNumber,
          payload.data.status,
          payload.data.location,
        );
        break;
      case "delivery_complete":
        template = templates.deliveryComplete(
          payload.data.shipmentNumber,
          payload.data.deliveredAt,
        );
        break;
      case "delay_alert":
        template = templates.delayAlert(
          payload.data.shipmentNumber,
          payload.data.expectedTime,
          payload.data.reason,
        );
        break;
      case "pickup_reminder":
        template = templates.pickupReminder(
          payload.data.driverName,
          payload.data.shipmentNumber,
          payload.data.pickupLocation,
          payload.data.scheduledTime,
        );
        break;
      case "delivery_confirmation":
        template = templates.deliveryConfirmation(
          payload.data.customerName,
          payload.data.shipmentNumber,
          payload.data.recipientName,
        );
        break;
      default:
        throw new Error(`Unknown notification type: ${payload.type}`);
    }

    // Send WhatsApp notification
    const result = await sendWhatsAppNotification({
      to: formattedPhone,
      template,
    });

    // Update notification status
    await db
      .update(notifications)
      .set({
        status: result.success ? "sent" : "failed",
        sentAt: result.success ? new Date() : null,
      })
      .where(eq(notifications.id, notification.id));

    return {
      success: result.success,
      notificationId: notification.id,
      error: result.error,
    };
  } catch (error) {
    console.error("Failed to send notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send driver assignment notification
 */
export async function notifyDriverAssignment(
  driverPhone: string,
  driverName: string,
  shipmentNumber: string,
): Promise<void> {
  await sendNotification({
    type: "driver_assigned",
    recipient: driverPhone,
    data: {
      driverName,
      shipmentNumber,
    },
  });
}

/**
 * Send status update notification to customer
 */
export async function notifyStatusUpdate(
  customerPhone: string,
  shipmentNumber: string,
  status: string,
  location?: string,
): Promise<void> {
  await sendNotification({
    type: "status_update",
    recipient: customerPhone,
    data: {
      shipmentNumber,
      status,
      location: location || "Tidak diketahui",
    },
  });
}

/**
 * Send delivery complete notification
 */
export async function notifyDeliveryComplete(
  customerPhone: string,
  shipmentNumber: string,
  deliveredAt: string,
): Promise<void> {
  await sendNotification({
    type: "delivery_complete",
    recipient: customerPhone,
    data: {
      shipmentNumber,
      deliveredAt,
    },
  });
}

/**
 * Send delay alert notification
 */
export async function notifyDelay(
  customerPhone: string,
  shipmentNumber: string,
  expectedTime: string,
  reason?: string,
): Promise<void> {
  await sendNotification({
    type: "delay_alert",
    recipient: customerPhone,
    data: {
      shipmentNumber,
      expectedTime,
      reason: reason || "Tidak ada keterangan",
    },
  });
}

/**
 * Retry failed notifications
 */
export async function retryFailedNotifications(): Promise<void> {
  try {
    const failedNotifications = await db.query.notifications.findMany({
      where: eq(notifications.status, "failed"),
      limit: 10, // Process 10 at a time
    });

    for (const notification of failedNotifications) {
      // Reconstruct payload from stored data
      const payload: NotificationPayload = {
        type: notification.template as NotificationPayload["type"],
        recipient: notification.recipient,
        data: notification.data as Record<string, string>,
      };

      await sendNotification(payload);
    }
  } catch (error) {
    console.error("Failed to retry notifications:", error);
  }
}
