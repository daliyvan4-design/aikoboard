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

/**
 * Recto : colonne doree, photo, puis le nom en dominante.
 *
 * Le QR ne figure plus ici — il occupe tout le verso, sur fond blanc, la
 * ou les lecteurs le trouvent le plus vite. Le recto sert a identifier la
 * personne a deux metres, dans une file d'entree.
 */
function drawRecto(
  doc: jsPDF,
  pos: { x: number; y: number },
  data: PvcBadgeData,
  p: PvcBadgeData["participants"][0],
) {
  const { x, y } = pos;
  const isConference = data.eventType !== "concert";

  const COLUMN_W = 3.2;
  const gutter = 4;
  const contentX = x + COLUMN_W + gutter;
  const rightEdge = x + CARD_W - gutter;

  const photoW = 16;
  const photoH = 20;
  const showPhoto = isConference;

  doc.setFillColor(...NAVY);
  doc.rect(x, y, CARD_W, CARD_H, "F");

  // Colonne doree pleine hauteur : l'accent de marque, sans bandeau
  doc.setFillColor(...GOLD);
  doc.rect(x, y, COLUMN_W, CARD_H, "F");

  // ── En-tete : evenement et dates, en retrait
  let headerX = contentX;
  if (data.logoDataUrl) {
    try {
      doc.addImage(data.logoDataUrl, "PNG", contentX, y + 4.2, 5, 5);
      headerX = contentX + 6.5;
    } catch {}
  }
  doc.setTextColor(...WHITE);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  const evLines = doc.splitTextToSize(data.eventName.toUpperCase(), rightEdge - headerX - 2);
  doc.text(evLines.slice(0, 1), headerX, y + 6.5);

  doc.setTextColor(...SILVER);
  doc.setFontSize(4);
  doc.setFont("helvetica", "normal");
  doc.text(data.eventDate, headerX, y + 9.8);

  // Pastille de categorie (VIP, SPEAKER, PRESSE...) : affichee seulement si
  // l'evenement en definit une. Auparavant elle retombait sur "DELEGATE",
  // imprime sur tous les badges sans que personne ne l'ait demande.
  const badgeLabel = p.badgeType?.trim().toUpperCase();
  if (badgeLabel) {
    const labelW = doc.getStringUnitWidth(badgeLabel) * 5 / doc.internal.scaleFactor + 4;
    doc.setFillColor(...GOLD);
    doc.roundedRect(rightEdge - labelW, y + 3.6, labelW, 5, 1, 1, "F");
    doc.setTextColor(...NAVY);
    doc.setFontSize(4.5);
    doc.setFont("helvetica", "bold");
    doc.text(badgeLabel, rightEdge - labelW / 2, y + 7, { align: "center" });
  }

  // ── Bloc central : photo puis identite
  const blockY = y + 14;

  if (showPhoto) {
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.35);
    doc.rect(contentX - 0.3, blockY - 0.3, photoW + 0.6, photoH + 0.6);
    let drawn = false;
    if (p.photoDataUrl) {
      try {
        doc.addImage(p.photoDataUrl, "JPEG", contentX, blockY, photoW, photoH);
        drawn = true;
      } catch {
        drawn = false;
      }
    }
    if (!drawn) {
      doc.setFillColor(...DARK_LINE);
      doc.rect(contentX, blockY, photoW, photoH, "F");
      doc.setTextColor(...SILVER);
      doc.setFontSize(3.6);
      doc.text("PHOTO", contentX + photoW / 2, blockY + photoH / 2 + 1, { align: "center" });
    }
  }

  const nameX = showPhoto ? contentX + photoW + 4.5 : contentX;
  const nameW = rightEdge - nameX;

  doc.setTextColor(...WHITE);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(p.name, nameW).slice(0, 2);
  let cursor = blockY + (nameLines.length > 1 ? 5.5 : 7);
  doc.text(nameLines, nameX, cursor);
  cursor += nameLines.length * 4.4 + 1.4;

  if (p.titre) {
    doc.setTextColor(...GOLD);
    doc.setFontSize(4.8);
    doc.setFont("helvetica", "bold");
    doc.text(doc.splitTextToSize(p.titre.toUpperCase(), nameW).slice(0, 1), nameX, cursor);
    cursor += 3.4;
  }

  if (p.organisation) {
    doc.setTextColor(...SILVER);
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(p.organisation, nameW).slice(0, 1), nameX, cursor);
  }

  // ── Pied : lieu a gauche, numero a droite
  const bottomY = y + CARD_H - 8;
  doc.setDrawColor(...DARK_LINE);
  doc.setLineWidth(0.15);
  doc.line(contentX, bottomY, rightEdge, bottomY);

  doc.setTextColor(...SILVER);
  doc.setFontSize(4.2);
  doc.setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(data.eventLieu, CARD_W * 0.55).slice(0, 1), contentX, bottomY + 3.6);

  doc.setTextColor(50, 65, 85);
  doc.setFontSize(3.2);
  doc.text("AIKO BOARD", contentX, bottomY + 6.6);

  doc.setTextColor(...GOLD);
  doc.setFontSize(3.8);
  doc.setFont("helvetica", "bold");
  doc.text("N°", rightEdge - 9.5, bottomY + 3.6);
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.text(String(p.badgeNumber).padStart(4, "0"), rightEdge, bottomY + 4, { align: "right" });
}

/**
 * Verso : le QR, en grand, sur fond blanc.
 *
 * Fond clair volontaire : les lecteurs attendent du sombre sur du clair.
 * Un QR dore sur fond encre passe sur un bon capteur en pleine lumiere et
 * echoue partout ailleurs.
 */
function drawVerso(
  doc: jsPDF,
  pos: { x: number; y: number },
  data: PvcBadgeData,
  p: PvcBadgeData["participants"][0],
) {
  const { x, y } = pos;
  const pad = 4;

  doc.setFillColor(...WHITE);
  doc.rect(x, y, CARD_W, CARD_H, "F");

  // Bandeau dore : nom de l'evenement et numero de badge
  const bandH = 7;
  doc.setFillColor(...GOLD);
  doc.rect(x, y, CARD_W, bandH, "F");

  doc.setTextColor(...NAVY);
  doc.setFontSize(4.6);
  doc.setFont("helvetica", "bold");
  doc.text(
    doc.splitTextToSize(data.eventName.toUpperCase(), CARD_W - pad * 2 - 14).slice(0, 1),
    x + pad,
    y + 4.6,
  );
  doc.setFontSize(5.5);
  doc.text(`N°${String(p.badgeNumber).padStart(4, "0")}`, x + CARD_W - pad, y + 4.8, {
    align: "right",
  });

  // QR : la piece maitresse de cette face
  const qrSize = 27;
  const qrX = x + (CARD_W - qrSize) / 2;
  const qrY = y + bandH + 2.5;
  try {
    doc.addImage(p.qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } catch {}

  // Reference sous le code
  let yc = qrY + qrSize + 4;
  doc.setTextColor(...NAVY);
  doc.setFontSize(7);
  doc.setFont("courier", "bold");
  doc.text(p.reference, x + CARD_W / 2, yc, { align: "center" });

  yc += 3.6;
  doc.setTextColor(130, 130, 130);
  doc.setFontSize(4.2);
  doc.setFont("helvetica", "normal");
  doc.text(p.name, x + CARD_W / 2, yc, { align: "center" });

  // Mentions de pied
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(3.2);
  doc.text(
    "BADGE PERSONNEL ET NON TRANSFERABLE · AIKOBOARD.COM",
    x + CARD_W / 2,
    y + CARD_H - 2.4,
    { align: "center" },
  );
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
