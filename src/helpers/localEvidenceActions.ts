type ActionResult = { ok: true; message: string } | { ok: false; error: string };
const copyText = async (text: string): Promise<ActionResult> => {
  try {
    if (!navigator.clipboard?.writeText) return { ok: false, error: "Clipboard copy is unavailable in this browser. Use Download Text instead." };
    await navigator.clipboard.writeText(text);
    return { ok: true, message: "Report copied to clipboard." };
  } catch { return { ok: false, error: "Copy failed. Your session and evidence were not changed; use Download Text instead." }; }
};
const downloadText = (fileName: string, contents: string, mimeType: string): ActionResult => {
  let url: string | null = null;
  try {
    const blob = new Blob([contents], { type: mimeType });
    if (!URL.createObjectURL) return { ok: false, error: "Local download is unavailable in this browser." };
    url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = fileName; anchor.rel = "noopener";
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    return { ok: true, message: `${fileName} download started.` };
  } catch { return { ok: false, error: "Download failed. Your session and evidence were not changed." }; }
  finally { if (url) URL.revokeObjectURL?.(url); }
};
const shareText = async (title: string, text: string): Promise<ActionResult> => {
  try {
    if (typeof navigator.share !== "function") return { ok: false, error: "Web Share is unavailable in this browser. Copy or download the report instead." };
    await navigator.share({ title, text });
    return { ok: true, message: "Share sheet opened for the report." };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "AbortError") return { ok: false, error: "Share cancelled. Your session and evidence were not changed." };
    return { ok: false, error: "Share failed. Your session and evidence were not changed; Copy/Download remain available." };
  }
};
export const localEvidenceActions = { copyText, downloadText, shareText, canShare: () => typeof navigator !== "undefined" && typeof navigator.share === "function" };
