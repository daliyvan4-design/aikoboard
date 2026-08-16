import { jsPDF } from "jspdf";

interface PvcBadgeData {
  eventName: string;
  eventDate: string;
  eventLieu: string;
  eventType: string;
  organisateur: string;
  logoDataUrl?: string;
  participants: {
    name: string;
    titre?: string;
    organisation?: string;
    email: string;
    reference: string;
    badgeNumber: number;
    qrDataUrl: string;
    photoDataUrl?: string;
    badgeType?: string;
  }[];
}

// CR80 standard PVC card: 85.6mm x 54mm
const CARD_W = 85.6;
const CARD_H = 54;
const A4_W = 210;
const A4_H = 297;

const COLS = 2;
const ROWS = 4;
const CARDS_PER_PAGE = COLS * ROWS;

const MARGIN_X = (A4_W - COLS * CARD_W) / 2;
const MARGIN_Y = (A4_H - ROWS * CARD_H) / 2;

const NAVY = [10, 22, 40] as const;
const GOLD = [200, 169, 81] as const;
const WHITE = [255, 255, 255] as const;
const SILVER = [160, 165, 175] as const;
const DARK_LINE = [30, 45, 65] as const;
const CROP_COLOR = [180, 180, 180] as const;
const CROP_LEN = 4;
const CROP_OFFSET = 1;

function getCardPosition(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return { x: MARGIN_X + col * CARD_W, y: MARGIN_Y + row * CARD_H };
}

function getMirroredPosition(index: number): { x: number; y: number } {
  const col = index % COLS === 0 ? 1 : 0;
  const row = Math.floor(index / COLS);
  return { x: MARGIN_X + col * CARD_W, y: MARGIN_Y + row * CARD_H };
}

function drawCropMarks(doc: jsPDF) {
  doc.setDrawColor(...CROP_COLOR);
  doc.setLineWidth(0.15);
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const cx = MARGIN_X + c * CARD_W;
      const cy = MARGIN_Y + r * CARD_H;
      if (c === 0) doc.line(cx - CROP_OFFSET - CROP_LEN, cy, cx - CROP_OFFSET, cy);
      if (c === COLS) doc.line(cx + CROP_OFFSET, cy, cx + CROP_OFFSET + CROP_LEN, cy);
      if (r === 0) doc.line(cx, cy - CROP_OFFSET - CROP_LEN, cx, cy - CROP_OFFSET);
      if (r === ROWS) doc.line(cx, cy + CROP_OFFSET, cx, cy + CROP_OFFSET + CROP_LEN);
    }
  }
}

function drawRecto(
  doc: jsPDF,
  pos: { x: number; y: number },
  data: PvcBadgeData,
  p: PvcBadgeData["participants"][0],
) {
  const { x, y } = pos;
  const pad = 3;
  const isConference = data.eventType !== "concert";
  const photoSize = 16;

  // Navy background
  doc.setFillColor(...NAVY);
  doc.rect(x, y, CARD_W, CARD_H, "F");

  // Gold top accent line
  doc.setFillColor(...GOLD);
  doc.rect(x, y, CARD_W, 1.2, "F");

  // Header: logo + event name
  let yc = y + 3.5;
  if (data.logoDataUrl) {
    try {
      doc.addImage(data.logoDataUrl, "PNG", x + pad, yc, 5.5, 5.5);
    } catch {}
  }
  const logoOffset = data.logoDataUrl ? 10 : 0;
  doc.setTextColor(...WHITE);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  const evLines = doc.splitTextToSize(data.eventName, CARD_W - pad * 2 - logoOffset - (isConference ? 18 : 0));
  doc.text(evLines.slice(0, 2), x + pad + logoOffset, yc + 3);

  // Pastille de categorie (VIP, SPEAKER, PRESSE...) : affichee seulement si
  // l'evenement en definit une. Auparavant elle retombait sur "DELEGATE",
  // imprime sur tous les badges sans que personne ne l'ait demande.
  const badgeLabel = p.badgeType?.trim().toUpperCase();
  if (badgeLabel) {
    const labelW = doc.getStringUnitWidth(badgeLabel) * 5 / doc.internal.scaleFactor + 4;
    doc.setFillColor(...GOLD);
    doc.roundedRect(x + CARD_W - pad - labelW, yc, labelW, 5.5, 1, 1, "F");
    doc.setTextColor(...NAVY);
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.text(badgeLabel, x + CARD_W - pad - labelW / 2, yc + 3.8, { align: "center" });
  }

  // Thin separator
  yc = y + 11;
  doc.setDrawColor(...DARK_LINE);
  doc.setLineWidth(0.15);
  doc.line(x + pad, yc, x + CARD_W - pad, yc);
  yc += 2;

  // Photo frame + name block
  const nameBlockX = isConference && p.photoDataUrl ? x + pad + photoSize + 3 : x + pad;
  const nameBlockW = isConference && p.photoDataUrl ? CARD_W - pad * 2 - photoSize - 3 : CARD_W - pad * 2;

  if (isConference && p.photoDataUrl) {
    // Gold border around photo
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.rect(x + pad - 0.3, yc - 0.3, photoSize + 0.6, photoSize + 0.6);
    try {
      doc.addImage(p.photoDataUrl, "JPEG", x + pad, yc, photoSize, photoSize);
    } catch {
      // Empty photo frame placeholder
      doc.setFillColor(30, 45, 65);
      doc.rect(x + pad, yc, photoSize, photoSize, "F");
      doc.setTextColor(...SILVER);
      doc.setFontSize(4);
      doc.text("PHOTO", x + pad + photoSize / 2, yc + photoSize / 2 + 1, { align: "center" });
    }
  } else if (isConference) {
    // Empty photo frame for conferences without photo
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.rect(x + pad - 0.3, yc - 0.3, photoSize + 0.6, photoSize + 0.6);
    doc.setFillColor(30, 45, 65);
    doc.rect(x + pad, yc, photoSize, photoSize, "F");
    doc.setTextColor(...SILVER);
    doc.setFontSize(4);
    doc.text("PHOTO", x + pad + photoSize / 2, yc + photoSize / 2 + 1, { align: "center" });
  }

  // Participant name
  const nameY = yc + 3.5;
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(p.name, nameBlockW);
  doc.text(nameLines.slice(0, 2), nameBlockX, nameY);

  // Title (MANAGING DIRECTOR, etc.)
  let infoY = nameY + nameLines.slice(0, 2).length * 4;
  if (p.titre) {
    doc.setTextColor(...GOLD);
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.text(p.titre.toUpperCase(), nameBlockX, infoY);
    infoY += 3;
  }

  // Organisation
  if (p.organisation) {
    doc.setTextColor(...SILVER);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.text(p.organisation, nameBlockX, infoY);
  }

  // Bottom section
  const bottomY = y + CARD_H - 12;

  // Separator
  doc.setDrawColor(...DARK_LINE);
  doc.setLineWidth(0.15);
  doc.line(x + pad, bottomY, x + CARD_W - pad, bottomY);

  // Location + date with small icons (text-based)
  doc.setTextColor(...SILVER);
  doc.setFontSize(4.5);
  doc.setFont("helvetica", "normal");
  doc.text(data.eventLieu, x + pad, bottomY + 3.5);
  doc.text(data.eventDate, x + pad, bottomY + 7);

  // Badge number bottom-right
  doc.setTextColor(...GOLD);
  doc.setFontSize(4);
  doc.setFont("helvetica", "bold");
  doc.text("N°", x + CARD_W - pad - 12, bottomY + 3.5);
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.text(String(p.badgeNumber).padStart(4, "0"), x + CARD_W - pad, bottomY + 4, { align: "right" });

  // Tagline at very bottom
  doc.setTextColor(50, 65, 85);
  doc.setFontSize(3);
  doc.text("POWERED BY AIKO BOARD", x + CARD_W / 2, y + CARD_H - 1.5, { align: "center" });
}

function drawVerso(
  doc: jsPDF,
  pos: { x: number; y: number },
  data: PvcBadgeData,
  p: PvcBadgeData["participants"][0],
) {
  const { x, y } = pos;
  const pad = 3;

  // Navy background
  doc.setFillColor(...NAVY);
  doc.rect(x, y, CARD_W, CARD_H, "F");

  // Gold bottom accent line
  doc.setFillColor(...GOLD);
  doc.rect(x, y + CARD_H - 1.2, CARD_W, 1.2, "F");

  // QR Code centered
  const qrSize = 22;
  const qrX = x + (CARD_W - qrSize) / 2;
  const qrY = y + 4;

  // White background for QR readability
  doc.setFillColor(...WHITE);
  doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, "F");
  try {
    doc.addImage(p.qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } catch {}

  // Reference
  let yc = qrY + qrSize + 3;
  doc.setTextColor(...GOLD);
  doc.setFontSize(4);
  doc.setFont("helvetica", "bold");
  doc.text("REFERENCE", x + CARD_W / 2, yc, { align: "center" });
  yc += 3.5;
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(p.reference, x + CARD_W / 2, yc, { align: "center" });
  yc += 4;

  // Name
  doc.setTextColor(...SILVER);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text(p.name, x + CARD_W / 2, yc, { align: "center" });
  yc += 5;

  // Separator
  doc.setDrawColor(...DARK_LINE);
  doc.setLineWidth(0.15);
  doc.line(x + pad + 10, yc, x + CARD_W - pad - 10, yc);
  yc += 3;

  // Non-transferable notice
  doc.setTextColor(70, 85, 105);
  doc.setFontSize(3.5);
  doc.text("CE BADGE EST PERSONNEL ET NON TRANSFERABLE", x + CARD_W / 2, yc, { align: "center" });

  // Scan instruction at bottom
  doc.setTextColor(...GOLD);
  doc.setFontSize(3.5);
  doc.text("SCANNEZ AVEC AIKO BOARD", x + CARD_W / 2, y + CARD_H - 3.5, { align: "center" });
}

export function generatePvcBadgePDF(data: PvcBadgeData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const total = data.participants.length;

  for (let i = 0; i < total; i += CARDS_PER_PAGE) {
    if (i > 0) doc.addPage();

    const batch = data.participants.slice(i, i + CARDS_PER_PAGE);

    drawCropMarks(doc);
    batch.forEach((p, idx) => {
      drawRecto(doc, getCardPosition(idx), data, p);
    });

    doc.addPage();
    drawCropMarks(doc);
    batch.forEach((p, idx) => {
      drawVerso(doc, getMirroredPosition(idx), data, p);
    });
  }

  return doc;
}

export function generateSinglePvcBadge(
  data: Omit<PvcBadgeData, "participants"> & { participant: PvcBadgeData["participants"][0] },
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [CARD_W, CARD_H] });

  drawRecto(doc, { x: 0, y: 0 }, { ...data, participants: [data.participant] }, data.participant);

  doc.addPage([CARD_W, CARD_H], "landscape");
  drawVerso(doc, { x: 0, y: 0 }, { ...data, participants: [data.participant] }, data.participant);

  return doc;
}
