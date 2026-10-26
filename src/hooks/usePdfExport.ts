import { useRef, useState } from "react";

export function usePdfExport() {
  const busy = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  async function exportPdf(generate: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    setExporting(true);
    setMessage("");
    try { await generate(); setMessage("PDF gerado. Confira os downloads do navegador."); }
    catch { setMessage("Não foi possível gerar o PDF. Tente novamente."); }
    finally { busy.current = false; setExporting(false); }
  }
  return { exporting, message, exportPdf };
}
