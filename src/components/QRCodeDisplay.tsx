import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, QrCode } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export function QRCodeDisplay({ value, label }: { value: string; label?: string }) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: 180,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    QRCode.toDataURL(value, { width: 400, margin: 2 }).then(setDataUrl);
  }, [value]);

  function handlePrint() {
    if (!dataUrl) return;
    const escapedLabel = label ? label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    const escapedValue = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<!DOCTYPE html>
<html>
<head><title>QR Code</title>
<style>
  body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; }
  img { width: 280px; height: 280px; }
  .label { margin-top: 12px; font-size: 14px; color: #334155; text-align: center; max-width: 280px; word-break: break-all; font-weight: 600; }
  .code { margin-top: 6px; font-size: 11px; color: #94a3b8; text-align: center; max-width: 280px; word-break: break-all; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <img src="${dataUrl}" alt="QR Code" />
  ${escapedLabel ? `<p class="label">${escapedLabel}</p>` : ''}
  <p class="code">${escapedValue}</p>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'width=400,height=500');
    if (win) {
      win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
      };
    } else {
      URL.revokeObjectURL(url);
    }
  }

  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        <QrCode size={16} />
        {t('item.printQR')}
      </div>
      <canvas ref={canvasRef} className="rounded-lg" />
      {label && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[200px] truncate">{label}</p>
      )}
      <button type="button" onClick={handlePrint} className="btn-secondary text-sm">
        <Printer size={16} />
        {t('item.printQR')}
      </button>
    </div>
  );
}
