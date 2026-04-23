// BAST template configuration and utilities

export interface BASTTemplate {
  title: string;
  subtitle?: string;
  headerText: string;
  footerText: string;
  statementText: string;
}

export const defaultTemplate: BASTTemplate = {
  title: "BERITA ACARA SERAH TERIMA (BAST)",
  subtitle: "Delivery Receipt",
  headerText: "Transport Management System",
  footerText:
    "Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah",
  statementText:
    "Dengan ini menyatakan bahwa barang-barang tersebut di atas telah diterima dalam kondisi baik dan sesuai dengan yang tercantum dalam dokumen pengiriman.",
};

export const schoolDeliveryTemplate: BASTTemplate = {
  title: "BERITA ACARA SERAH TERIMA (BAST)",
  subtitle: "Penyerahan Barang ke Sekolah",
  headerText: "Transport Management System - Pengiriman Pendidikan",
  footerText:
    "Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah",
  statementText:
    "Dengan ini menyatakan bahwa barang-barang bantuan pendidikan tersebut di atas telah diterima dalam kondisi baik dan lengkap sesuai dengan yang tercantum dalam dokumen pengiriman.",
};

export function getTemplateForDestination(
  destinationType?: string,
): BASTTemplate {
  if (destinationType === "school") {
    return schoolDeliveryTemplate;
  }
  return defaultTemplate;
}

// Validation helpers
export function validateBASTData(data: {
  recipientName?: string;
  recipientTitle?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.recipientName || data.recipientName.trim() === "") {
    errors.push("Nama penerima harus diisi");
  }

  if (!data.recipientTitle || data.recipientTitle.trim() === "") {
    errors.push("Jabatan penerima harus diisi");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
