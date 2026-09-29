// Renders a stage's checkpoint table to a PNG and hands it to the OS share
// sheet (WhatsApp, etc.), falling back to a download. Always drawn in the
// light high-contrast palette so it reads well wherever it's shared.

import { fmtClock, fmtDate, fmtDelta, fmtDist, fmtTime } from './format';
import { buildRows, type Stage } from './rallyLog';

const W = 1080;
const PAD = 48;
const HEADER_H = 200;
const TABLE_HEAD_H = 56;
const ROW_H = 132;
const FOOTER_H = 80;

const C = {
  bg: '#ffffff',
  text: '#000000',
  dim: '#2e2e2e',
  faint: '#666666',
  rule: '#d0d0d0',
  ahead: '#c40000',
  late: '#6a1fb3',
};

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const COND = "'Barlow Condensed', sans-serif";

// Right edges of the numeric columns
const COL = { cp: PAD, km: 340, real: 580, ideal: 820, dif: W - PAD };

const diffColor = (d: number): string => (d > 0.05 ? C.late : d < -0.05 ? C.ahead : C.text);

export function renderStageImage(stage: Stage): HTMLCanvasElement {
  const rows = buildRows(stage);
  const H = HEADER_H + TABLE_HEAD_H + Math.max(1, rows.length) * ROW_H + FOOTER_H;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no disponible');

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // Header
  ctx.fillStyle = C.text;
  ctx.font = `700 64px ${COND}`;
  ctx.textAlign = 'left';
  ctx.fillText(stage.name, PAD, 96);
  ctx.fillStyle = C.dim;
  ctx.font = `500 34px ${COND}`;
  const sub = [
    `${stage.targetKmh.toFixed(0)} km/h`,
    fmtDate(stage.startedAt),
    `START ${fmtClock(stage.startedAt)}`,
    `${rows.length} CP`,
  ].join('  ·  ');
  ctx.fillText(sub, PAD, 148);
  if (stage.interrupted) {
    ctx.fillStyle = C.ahead;
    ctx.font = `600 28px ${COND}`;
    ctx.fillText('INTERRUMPIDO — la app se cerró durante el tramo', PAD, 184);
  }

  // Table head
  let y = HEADER_H;
  ctx.fillStyle = C.faint;
  ctx.font = `600 26px ${COND}`;
  ctx.textAlign = 'left';
  ctx.fillText('CP', COL.cp, y + 36);
  ctx.textAlign = 'right';
  ctx.fillText('KM', COL.km, y + 36);
  ctx.fillText('REAL', COL.real, y + 36);
  ctx.fillText('IDEAL', COL.ideal, y + 36);
  ctx.fillText('DIF (s)', COL.dif, y + 36);
  y += TABLE_HEAD_H;
  rule(ctx, y, C.text, 2);

  if (rows.length === 0) {
    ctx.fillStyle = C.faint;
    ctx.font = `500 30px ${COND}`;
    ctx.textAlign = 'left';
    ctx.fillText('Sin checkpoints', PAD, y + 70);
    y += ROW_H;
  }

  for (const r of rows) {
    // Main line — fused
    ctx.font = `700 40px ${MONO}`;
    ctx.fillStyle = C.text;
    ctx.textAlign = 'left';
    ctx.fillText(String(r.n), COL.cp, y + 50);
    ctx.textAlign = 'right';
    ctx.fillText(fmtDist(r.fused.distanceM), COL.km, y + 50);
    ctx.fillText(fmtTime(r.elapsedSec), COL.real, y + 50);
    ctx.fillText(fmtTime(r.fused.idealSec), COL.ideal, y + 50);
    ctx.fillStyle = diffColor(r.fused.diffSec);
    ctx.fillText(fmtDelta(r.fused.diffSec), COL.dif, y + 50);

    // Partial line
    ctx.textAlign = 'left';
    ctx.fillStyle = C.dim;
    ctx.font = `400 26px ${MONO}`;
    ctx.fillText(
      `parcial ${fmtTime(r.partialSec)} / ideal ${fmtTime(r.fused.partialIdealSec)} · ${r.fused.partialAvgKmh.toFixed(1)} km/h`,
      COL.cp + 70,
      y + 88,
    );

    // Raw line
    ctx.fillStyle = C.faint;
    ctx.fillText(
      `raw ${fmtDist(r.raw.distanceM)} km · ideal ${fmtTime(r.raw.idealSec)} · dif ${fmtDelta(r.raw.diffSec)}`,
      COL.cp + 70,
      y + 118,
    );

    y += ROW_H;
    rule(ctx, y, C.rule, 1);
  }

  // Footer
  ctx.fillStyle = C.faint;
  ctx.font = `500 24px ${COND}`;
  ctx.textAlign = 'left';
  ctx.fillText('+ = atrasado · − = adelantado · distancias GPS fused (Kalman)', PAD, y + 50);
  ctx.textAlign = 'right';
  ctx.fillText('RALLY COMPASS', W - PAD, y + 50);

  return canvas;
}

function rule(ctx: CanvasRenderingContext2D, y: number, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
}

const slug = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'tramo';

export async function shareStageImage(stage: Stage): Promise<void> {
  await Promise.all([
    document.fonts.load(`700 40px 'JetBrains Mono'`),
    document.fonts.load(`400 26px 'JetBrains Mono'`),
    document.fonts.load(`700 64px 'Barlow Condensed'`),
    document.fonts.load(`500 34px 'Barlow Condensed'`),
  ]).catch(() => undefined);

  const canvas = renderStageImage(stage);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('No se pudo generar la imagen');

  const file = new File([blob], `${slug(stage.name)}.png`, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: stage.name });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
