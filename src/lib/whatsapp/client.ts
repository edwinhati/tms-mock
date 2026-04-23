// WhatsApp Business API Integration
import type { WhatsAppTemplate } from "./templates";

interface WhatsAppMessage {
  to: string;
  template: WhatsAppTemplate;
}

interface WhatsAppAPIResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_TOKEN = process.env.WHATSAPP_API_TOKEN;

// Rate limiting configuration
const RATE_LIMIT = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
};

/**
 * Send WhatsApp notification using WhatsApp Business API
 */
export async function sendWhatsAppNotification(
  message: WhatsAppMessage,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Check if WhatsApp API is configured
  if (!PHONE_NUMBER_ID || !API_TOKEN) {
    console.warn("WhatsApp API not configured. Skipping notification.");
    return { success: false, error: "WhatsApp API not configured" };
  }

  // Validate phone number format (should be in international format without +)
  const phoneNumber = message.to.replace(/[^0-9]/g, "");
  if (!phoneNumber || phoneNumber.length < 10) {
    console.error("Invalid phone number:", message.to);
    return { success: false, error: "Invalid phone number format" };
  }

  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < RATE_LIMIT.maxRetries; attempt++) {
    try {
      const response = await fetch(
        `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "template",
            template: {
              name: message.template.name,
              language: { code: message.template.language },
              components: message.template.components,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`,
        );
      }

      const data: WhatsAppAPIResponse = await response.json();
      console.log("WhatsApp notification sent successfully:", data);

      return {
        success: true,
        messageId: data.messages[0]?.id,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(
        `WhatsApp notification attempt ${attempt + 1} failed:`,
        error,
      );

      // Wait before retrying (exponential backoff)
      if (attempt < RATE_LIMIT.maxRetries - 1) {
        const delay =
          RATE_LIMIT.retryDelay * RATE_LIMIT.backoffMultiplier ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Failed to send WhatsApp notification",
  };
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Format phone number to international format (without +)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");

  // If starts with 0, replace with country code (62 for Indonesia)
  if (cleaned.startsWith("0")) {
    cleaned = `62${cleaned.substring(1)}`;
  }

  // If doesn't start with country code, add it
  if (!cleaned.startsWith("62")) {
    cleaned = `62${cleaned}`;
  }

  return cleaned;
}
