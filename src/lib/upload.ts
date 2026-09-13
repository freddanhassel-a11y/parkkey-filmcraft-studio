export type MediaProbe = {
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
};

/** Läser verkliga dimensioner/längd i webbläsaren — inga påhittade värden. */
export async function probeMedia(file: File): Promise<MediaProbe> {
  const empty: MediaProbe = { width: null, height: null, duration_seconds: null };
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Bilden kunde inte läsas."));
        img.src = url;
      });
      return { width: img.naturalWidth, height: img.naturalHeight, duration_seconds: null };
    }
    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Videon kunde inte läsas."));
        video.src = url;
      });
      return {
        width: video.videoWidth || null,
        height: video.videoHeight || null,
        duration_seconds: Number.isFinite(video.duration) ? Math.round(video.duration) : null,
      };
    }
    if (file.type.startsWith("audio/")) {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => reject(new Error("Ljudet kunde inte läsas."));
        audio.src = url;
      });
      return {
        width: null,
        height: null,
        duration_seconds: Number.isFinite(audio.duration) ? Math.round(audio.duration) : null,
      };
    }
    return empty;
  } catch {
    return empty;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Laddar upp till en signerad, tidsbegränsad adress med verklig progress. */
export function uploadToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new Error(
              `Uppladdningen misslyckades (${xhr.status}): ${xhr.responseText.slice(0, 200)}`,
            ),
          );
    xhr.onerror = () => reject(new Error("Uppladdningen avbröts av nätverket."));
    xhr.send(file);
  });
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}
