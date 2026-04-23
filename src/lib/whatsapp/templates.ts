// WhatsApp notification templates in Bahasa Indonesia

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
    }>;
  }>;
}

export const templates = {
  // Template: Driver Assignment
  driverAssigned: (
    driverName: string,
    shipmentNumber: string,
  ): WhatsAppTemplate => ({
    name: "driver_assigned",
    language: "id",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: driverName },
          { type: "text", text: shipmentNumber },
        ],
      },
    ],
  }),

  // Template: Status Update
  statusUpdate: (
    shipmentNumber: string,
    status: string,
    location?: string,
  ): WhatsAppTemplate => ({
    name: "status_update",
    language: "id",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: shipmentNumber },
          { type: "text", text: getStatusInIndonesian(status) },
          { type: "text", text: location || "Lokasi tidak diketahui" },
        ],
      },
    ],
  }),

  // Template: Delivery Complete
  deliveryComplete: (
    shipmentNumber: string,
    deliveredAt: string,
  ): WhatsAppTemplate => ({
    name: "delivery_complete",
    language: "id",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: shipmentNumber },
          { type: "text", text: deliveredAt },
        ],
      },
    ],
  }),

  // Template: Delay Alert
  delayAlert: (
    shipmentNumber: string,
    expectedTime: string,
    reason?: string,
  ): WhatsAppTemplate => ({
    name: "delay_alert",
    language: "id",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: shipmentNumber },
          { type: "text", text: expectedTime },
          { type: "text", text: reason || "Tidak ada keterangan" },
        ],
      },
    ],
  }),

  // Template: Pickup Reminder
  pickupReminder: (
    driverName: string,
    shipmentNumber: string,
    pickupLocation: string,
    scheduledTime: string,
  ): WhatsAppTemplate => ({
    name: "pickup_reminder",
    language: "id",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: driverName },
          { type: "text", text: shipmentNumber },
          { type: "text", text: pickupLocation },
          { type: "text", text: scheduledTime },
        ],
      },
    ],
  }),

  // Template: Delivery Confirmation
  deliveryConfirmation: (
    customerName: string,
    shipmentNumber: string,
    recipientName: string,
  ): WhatsAppTemplate => ({
    name: "delivery_confirmation",
    language: "id",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: customerName },
          { type: "text", text: shipmentNumber },
          { type: "text", text: recipientName },
        ],
      },
    ],
  }),
};

// Helper function to translate status to Indonesian
function getStatusInIndonesian(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Menunggu",
    planned: "Direncanakan",
    picked_up: "Sudah Diambil",
    in_transit: "Dalam Perjalanan",
    arrived: "Sudah Tiba",
    delivered: "Sudah Diterima",
    cancelled: "Dibatalkan",
    in_progress: "Sedang Berlangsung",
    completed: "Selesai",
  };

  return statusMap[status] || status;
}

// Template message bodies for reference (to be created in WhatsApp Business Manager)
export const templateBodies = {
  driver_assigned: `Halo {{1}},

Anda telah ditugaskan untuk pengiriman nomor: {{2}}

Silakan cek aplikasi untuk detail lengkap.

Terima kasih,
Tim TMS`,

  status_update: `Update Pengiriman

Nomor Pengiriman: {{1}}
Status: {{2}}
Lokasi: {{3}}

Terima kasih telah menggunakan layanan kami.`,

  delivery_complete: `Pengiriman Selesai ✓

Nomor Pengiriman: {{1}}
Waktu Pengiriman: {{2}}

Terima kasih atas kepercayaan Anda.`,

  delay_alert: `Pemberitahuan Keterlambatan

Nomor Pengiriman: {{1}}
Estimasi Waktu Baru: {{2}}
Alasan: {{3}}

Mohon maaf atas ketidaknyamanan ini.`,

  pickup_reminder: `Pengingat Pengambilan

Halo {{1}},

Pengambilan untuk pengiriman {{2}} dijadwalkan:
Lokasi: {{3}}
Waktu: {{4}}

Jangan lupa untuk datang tepat waktu.`,

  delivery_confirmation: `Konfirmasi Pengiriman

Kepada Yth. {{1}},

Pengiriman {{2}} telah diterima oleh {{3}}.

Terima kasih atas kepercayaan Anda.`,
};
