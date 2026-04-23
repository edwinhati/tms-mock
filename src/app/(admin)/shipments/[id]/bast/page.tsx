"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Download, FileText, Loader2, QrCode } from "lucide-react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/components/bast/signature-pad";
import {
  generateBASTDocument,
  downloadBASTDocument,
} from "@/lib/bast/generator";
import { validateBASTData } from "@/lib/bast/template";
import { useShipment } from "@/hooks/use-shipments";
import { useToast } from "@/hooks/use-toast";

export default function BASTPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: shipment, isLoading } = useShipment(id);
  const { toast } = useToast();

  const [recipientName, setRecipientName] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (shipment) {
      const verificationUrl = `${window.location.origin}/verify/bast/${shipment.id}`;
      QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((error) => {
          console.error("Failed to generate QR code:", error);
        });
    }
  }, [shipment]);

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    toast({
      title: "Signature saved",
      description: "Your signature has been captured successfully.",
    });
  };

  const handleSignatureClear = () => {
    setSignatureDataUrl("");
  };

  const validateForm = (): boolean => {
    const validation = validateBASTData({
      recipientName,
      recipientTitle,
    });

    setValidationErrors(validation.errors);
    return validation.valid;
  };

  const generatePDF = async () => {
    if (!shipment) return;

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const doc = await generateBASTDocument({
        shipment,
        recipientName,
        recipientTitle,
        signatureDataUrl: signatureDataUrl || undefined,
        qrCodeDataUrl: qrCodeUrl || undefined,
        notes: notes || undefined,
      });

      downloadBASTDocument(doc, shipment.shipmentNumber);

      toast({
        title: "BAST Generated",
        description: `BAST-${shipment.shipmentNumber} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate BAST PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Shipment not found</h1>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Generate BAST</h1>
        <p className="text-muted-foreground mt-2">
          Berita Acara Serah Terima (BAST) - Delivery Receipt
        </p>
      </div>

      {validationErrors.length > 0 && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <ul className="list-disc list-inside text-sm text-destructive space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Shipment Number</Label>
              <p className="font-medium mt-1">{shipment.shipmentNumber}</p>
            </div>
            <div>
              <Label>Date</Label>
              <p className="font-medium mt-1">
                {format(new Date(), "dd MMMM yyyy", { locale: localeId })}
              </p>
            </div>
            <Separator />
            <div>
              <Label>Customer</Label>
              <p className="font-medium mt-1">
                {shipment.customer?.name || "-"}
              </p>
              {shipment.customer?.phone && (
                <p className="text-sm text-muted-foreground">
                  {shipment.customer.phone}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origin</Label>
                <p className="font-medium mt-1 text-sm">
                  {shipment.originName || "-"}
                </p>
              </div>
              <div>
                <Label>Destination</Label>
                <p className="font-medium mt-1 text-sm">
                  {shipment.destinationName || "-"}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <Label>Items ({shipment.items?.length || 0})</Label>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {shipment.items?.map((item) => (
                  <li key={item.id} className="text-sm">
                    {item.goods?.description} - {item.quantity}{" "}
                    {item.goods?.unit}
                    {item.weight && ` (${item.weight} kg)`}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipientName">
                Recipient Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter recipient name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="recipientTitle">
                Title/Position <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recipientTitle"
                value={recipientTitle}
                onChange={(e) => setRecipientTitle(e.target.value)}
                placeholder="e.g. Principal, Admin, Manager"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes or conditions..."
                className="mt-1"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Digital Signature</CardTitle>
          <p className="text-sm text-muted-foreground">
            Draw your signature in the box below
          </p>
        </CardHeader>
        <CardContent>
          <SignaturePad
            onSave={handleSignatureSave}
            onClear={handleSignatureClear}
          />
          {signatureDataUrl && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <img
                src={signatureDataUrl}
                alt="Signature preview"
                className="max-w-xs border rounded"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Verification QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {qrCodeUrl ? (
              <>
                <img
                  src={qrCodeUrl}
                  alt="Verification QR Code"
                  className="w-32 h-32 border rounded"
                />
                <div className="text-muted-foreground">
                  <p className="text-sm">
                    This QR code can be scanned to verify the authenticity of
                    this BAST document.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Verification URL: {window.location.origin}/verify/bast/
                    {shipment.id}
                  </p>
                </div>
              </>
            ) : (
              <div className="w-32 h-32 bg-muted rounded flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button
          onClick={generatePDF}
          disabled={!recipientName || !recipientTitle || isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate & Download BAST
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
