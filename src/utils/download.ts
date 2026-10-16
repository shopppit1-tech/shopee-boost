function clickDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Starts one download and briefly retains the object URL for mobile browsers. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  clickDownload(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Convert an image data URL synchronously so the download can start in the user's click event. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const [metadata, payload] = dataUrl.split(',', 2);
  if (!metadata || payload === undefined) throw new Error('Format foto tidak dikenali.');
  const mimeType = metadata.match(/^data:([^;,]+)/i)?.[1] || 'application/octet-stream';
  const binary = metadata.includes(';base64') ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  downloadBlob(new Blob([bytes], { type: mimeType }), filename);
}

export function imageExtension(dataUrl: string): string {
  const mimeType = dataUrl.match(/^data:image\/([a-z0-9.+-]+);/i)?.[1]?.toLowerCase();
  if (mimeType === 'png') return 'png';
  if (mimeType === 'webp') return 'webp';
  return 'jpg';
}
