import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import jsPDF from "jspdf";
import type { ShipmentWithRelations } from "@/types/tms";

export interface BASTData {
  shipment: ShipmentWithRelations;
  recipientName: string;
  recipientTitle: string;
  signatureDataUrl?: string;
  qrCodeDataUrl?: string;
  notes?: string;
}

export async function generateBASTDocument(data: BASTData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    y += lines.length * 7;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("BERITA ACARA SERAH TERIMA (BAST)", pageWidth / 2, y, {
    align: "center",
  });
  y += 15;

  // Document info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tanggal: ${format(new Date(), "dd MMMM yyyy", { locale: localeId })}`,
    margin,
    y,
  );
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.text(`BAST Number:`, margin, y);
  doc.setFont("helvetica", "bold");
  doc.text(`BAST-${data.shipment.shipmentNumber}`, margin + 40, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text(`Shipment Number:`, margin, y);
  doc.setFont("helvetica", "bold");
  doc.text(data.shipment.shipmentNumber, margin + 40, y);
  y += 15;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Pihak Pertama (Pengirim)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PIHAK PERTAMA (Pengirim)", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (data.shipment.customer) {
    doc.text(`Nama: ${data.shipment.customer.name}`, margin, y);
    y += 7;
    if (data.shipment.customer.phone) {
      doc.text(`Telepon: ${data.shipment.customer.phone}`, margin, y);
      y += 7;
    }
    if (data.shipment.customer.address) {
      addText(
        `Alamat: ${data.shipment.customer.address}`,
        margin,
        pageWidth - 2 * margin,
      );
    }
  }
  y += 10;

  // Pihak Kedua (Penerima)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PIHAK KEDUA (Penerima)", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama: ${data.recipientName}`, margin, y);
  y += 7;
  doc.text(`Jabatan: ${data.recipientTitle}`, margin, y);
  y += 7;

  if (data.shipment.destinationName) {
    addText(
      `Lokasi: ${data.shipment.destinationName}`,
      margin,
      pageWidth - 2 * margin,
    );
  }
  y += 10;

  // Separator line
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Barang yang diserahkan
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BARANG YANG DISERAHKAN", margin, y);
  y += 10;

  // Table header
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const colWidths = [10, 60, 30, 30, 30];
  const colX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
    margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
  ];

  doc.text("No", colX[0], y);
  doc.text("Nama Barang", colX[1], y);
  doc.text("Jumlah", colX[2], y);
  doc.text("Berat (kg)", colX[3], y);
  doc.text("Volume (m³)", colX[4], y);
  y += 7;

  // Table line
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Table content
  doc.setFont("helvetica", "normal");
  if (data.shipment.items && data.shipment.items.length > 0) {
    data.shipment.items.forEach((item, index) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }

      doc.text(`${index + 1}`, colX[0], y);

      const goodsName = item.goods?.description || "N/A";
      const nameLines = doc.splitTextToSize(goodsName, colWidths[1] - 5);
      doc.text(nameLines, colX[1], y);

      doc.text(`${item.quantity} ${item.goods?.unit || ""}`, colX[2], y);
      doc.text(`${item.weight || 0}`, colX[3], y);
      doc.text(`${item.volume || 0}`, colX[4], y);

      y += Math.max(nameLines.length * 5, 7);
    });
  }

  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Notes
  if (data.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Catatan:", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    addText(data.notes, margin, pageWidth - 2 * margin);
    y += 5;
  }

  // Pernyataan
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const statement =
    "Dengan ini menyatakan bahwa barang-barang tersebut di atas telah diterima dalam kondisi baik dan sesuai dengan yang tercantum dalam dokumen pengiriman.";
  addText(statement, margin, pageWidth - 2 * margin);
  y += 10;

  // Signatures section
  const sigY = y;
  const col1X = margin + 20;
  const col2X = pageWidth - margin - 60;

  // Pihak Pertama signature
  doc.setFont("helvetica", "bold");
  doc.text("Pihak Pertama", col1X, sigY, { align: "center" });
  doc.text("(Pengirim)", col1X, sigY + 7, { align: "center" });

  // Pihak Kedua signature
  doc.text("Pihak Kedua", col2X, sigY, { align: "center" });
  doc.text("(Penerima)", col2X, sigY + 7, { align: "center" });

  // Add signature image if provided
  if (data.signatureDataUrl) {
    try {
      doc.addImage(data.signatureDataUrl, "PNG", col2X - 30, sigY + 10, 60, 30);
    } catch (error) {
      console.error("Failed to add signature image:", error);
    }
  }

  // Signature lines
  const lineY = sigY + 45;
  doc.setFont("helvetica", "normal");
  doc.line(col1X - 30, lineY, col1X + 30, lineY);
  doc.line(col2X - 30, lineY, col2X + 30, lineY);

  // Names under signature
  doc.setFontSize(9);
  if (data.shipment.customer) {
    doc.text(data.shipment.customer.name, col1X, lineY + 7, {
      align: "center",
    });
  }
  doc.text(data.recipientName, col2X, lineY + 7, { align: "center" });

  // QR Code for verification
  if (data.qrCodeDataUrl) {
    try {
      const qrSize = 40;
      const qrX = pageWidth - margin - qrSize;
      const qrY = pageHeight - margin - qrSize - 20;

      doc.addImage(data.qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("Scan untuk verifikasi", qrX + qrSize / 2, qrY + qrSize + 5, {
        align: "center",
      });
    } catch (error) {
      console.error("Failed to add QR code:", error);
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  );

  return doc;
}

export function downloadBASTDocument(doc: jsPDF, shipmentNumber: string): void {
  const fileName = `BAST-${shipmentNumber}-${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
