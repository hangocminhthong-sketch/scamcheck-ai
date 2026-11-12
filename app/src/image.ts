/** F4 — shrink a picked screenshot before upload (max 1600 px long side, JPEG q 0.85). */
export interface PreparedImage {
  data: string; // base64 without the data: prefix
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  previewUrl: string;
}

const MAX_SIDE = 1600;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const dataUrl = await readAsDataUrl(file);
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no_canvas');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL('image/jpeg', 0.85);
    return { data: out.split(',')[1], mediaType: 'image/jpeg', previewUrl: out };
  } catch {
    // Fall back to the original file if decoding/resizing fails.
    const type = (['image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg') as PreparedImage['mediaType'];
    return { data: dataUrl.split(',')[1], mediaType: type, previewUrl: dataUrl };
  }
}
