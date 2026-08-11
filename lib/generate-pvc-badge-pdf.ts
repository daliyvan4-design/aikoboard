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
    organisation?: string;
    email: string;
    reference: string;
    badgeNumber: number;
    qrDataUrl: string;
  }[];
}

// CR80 standard PVC card: 85.6mm x 54mm
const CARD_W = 85.6;
const CARD_H = 54;
const A4_W = 210;
const A4_H = 297;

// 2 columns x 4 rows = 8 cards per A4 page
const COLS = 2;
const ROWS = 4;
const CARDS_PER_PAGE = COLS * ROWS;

const MARGIN_X = (A4_W - COLS * CARD_W) / 2;
const MARGIN_Y = (A4_H - ROWS * CARD_H) / 2;

const INK = [10, 10, 10] as const;
const GOLD = [200, 169, 81] as const;
const WHITE = [255, 255, 255] as const;
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

      // horizontal marks
      if (c === 0) {
        doc.line(cx - CROP_OFFSET - CROP_LEN, cy, cx - CROP_OFFSET, cy);
      }
      if (c === COLS) {
        doc.line(cx + CROP_OFFSET, cy, cx + CROP_OFFSET + CROP_LEN, cy);
      }

      // vertical marks
      if (r === 0) {
        doc.line(cx, cy - CROP_OFFSET - CROP_LEN, cx, cy - CROP_OFFSET);
      }
      if (r === ROWS) {
        doc.line(cx, cy + CROP_OFFSET, cx, cy + CROP_OFFSET + CROP_LEN);
      }
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
  const pad = 3.5;

  // Background
  doc.setFillColor(...INK);
  doc.rect(x, y, CARD_W, CARD_H, "F");

  // Gold top bar
  const barH = 9;
  doc.setFillColor(...GOLD);
  doc.rect(x, y, CARD_W, barH, "F");

  // Logo in bar
  if (data.logoDataUrl) {
    try {
      doc.addImage(data.logoDataUrl, "PNG", x + pad, y + 1.5, 6, 6);
    } catch {}
  }

  // "AIKO" in bar
  doc.setTextColor(...INK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("AIKO", x + (data.logoDataUrl ? 11 : pad), y + 6);

  // Badge type label
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("BADGE", x + CARD_W - pad, y + 6, { align: "right" });

  // Event name
  let yc = y + barH + 3;
  doc.setTextColor(...GOLD);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  const evLines = doc.splitTextToSize(data.eventName, CARD_W - pad * 2);
  doc.text(evLines.slice(0, 1), x + pad, yc + 2.5);
  yc += 5;

  // Date + lieu
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.eventDate} · ${data.eventLieu}`, x + pad, yc + 1.5);
  yc += 4;

  // Separator
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.2);
  doc.line(x + pad, yc, x + CARD_W - pad, yc);
  yc += 3;

  // Participant name
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(p.name, CARD_W - pad * 2);
  doc.text(nameLines.slice(0, 2), x + pad, yc + 3.5);
  yc += nameLines.slice(0, 2).length * 4.5 + 1;

  // Organisation
  if (p.organisation) {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(p.organisation, x + pad, yc + 2);
  }

  // Badge number bottom-left
  const yBottom = y + CARD_H - 4;
  doc.setTextColor(...GOLD);
  doc.setFontSize(4.5);
  doc.setFont("helvetica", "bold");
  doc.text("N°", x + pad, yBottom);
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.text(String(p.badgeNumber).padStart(4, "0"), x + pad + 5, yBottom);

  // Type bottom-right
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(4);
  doc.setFont("helvetica", "normal");
  doc.text(data.eventType.toUpperCase(), x + CARD_W - pad, yBottom, { align: "right" });
}

function drawVerso(
  doc: jsPDF,
  pos: { x: number; y: number },
  data: PvcBadgeData,
  p: PvcBadgeData["participants"][0],
) {
  const { x, y } = pos;

  // Background
  doc.setFillColor(...INK);
  doc.rect(x, y, CARD_W, CARD_H, "F");

  // QR Code centered (large for reliable scanning)
  const qrSize = 28;
  const qrX = x + (CARD_W - qrSize) / 2;
  const qrY = y + 5;
  try {
    doc.addImage(p.qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } catch {}

  // Reference
  let yc = qrY + qrSize + 3;
  doc.setTextColor(...GOLD);
  doc.setFontSize(4.5);
  doc.setFont("helvetica", "bold");
  doc.text("REFERENCE", x + CARD_W / 2, yc, { align: "center" });
  yc += 4;

  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(p.reference, x + CARD_W / 2, yc, { align: "center" });
  yc += 4;

  // Name
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.text(p.name, x + CARD_W / 2, yc, { align: "center" });

  // Scan instruction bottom
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(3.5);
  doc.text("SCANNEZ AVEC AIKO BOARD", x + CARD_W / 2, y + CARD_H - 3, { align: "center" });
}

export function generatePvcBadgePDF(data: PvcBadgeData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const total = data.participants.length;

  for (let i = 0; i < total; i += CARDS_PER_PAGE) {
    if (i > 0) doc.addPage();

    const batch = data.participants.slice(i, i + CARDS_PER_PAGE);

    // Recto page
    drawCropMarks(doc);
    batch.forEach((p, idx) => {
      drawRecto(doc, getCardPosition(idx), data, p);
    });

    // Verso page (mirrored horizontally for double-sided printing)
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
