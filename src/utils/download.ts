import JSZip from 'jszip';

export interface DownloadFile {
  name: string;
  blob: Blob;
}

/** Start a browser download from a Blob and keep the object URL alive briefly for mobile browsers. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Browser tidak dapat menyiapkan file foto.'));
      }, type);
    } catch (error) {
      reject(error);
    }
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('Foto tidak dapat dibaca untuk diunduh.');
  return response.blob();
}

export function imageExtension(dataUrl: string): string {
  const mimeType = dataUrl.match(/^data:image\/([a-z0-9.+-]+);/i)?.[1]?.toLowerCase();
  if (mimeType === 'png') return 'png';
  if (mimeType === 'webp') return 'webp';
  return 'jpg';
}

/** Download a collection in one user gesture, avoiding browsers that block multiple downloads. */
export async function downloadFilesAsZip(files: DownloadFile[], filename: string): Promise<void> {
  if (!files.length) throw new Error('Belum ada foto yang siap diunduh.');
  const zip = new JSZip();
  files.forEach(({ name, blob }) => zip.file(name, blob));
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  downloadBlob(blob, filename);
}
