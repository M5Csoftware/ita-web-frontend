/**
 * High-fidelity PDF export and printing utility for Flight Cargo Manifest
 * Uses html2canvas-pro and jsPDF for client-side rendering matching exact A4 Landscape dimensions (297mm x 210mm).
 */

export async function createManifestJsPdf() {
  const html2canvasModule = await import('html2canvas-pro');
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 297;
  const pdfHeight = 210;

  const elem = document.getElementById('manifest-sheet-target');
  if (!elem) {
    throw new Error('Manifest sheet element (#manifest-sheet-target) not found in DOM.');
  }

  // Create an off-screen container to ensure scale(1) clean rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-10000px';
  container.style.width = '297mm';
  container.style.minHeight = '210mm';
  container.style.zIndex = '-9999';
  container.style.backgroundColor = '#ffffff';
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.transform = 'none';

  const cloned = elem.cloneNode(true) as HTMLElement;
  cloned.style.transform = 'none';
  cloned.style.width = '297mm';
  cloned.style.minHeight = '210mm';
  cloned.style.boxSizing = 'border-box';
  cloned.style.margin = '0';
  cloned.style.boxShadow = 'none';

  container.appendChild(cloned);
  document.body.appendChild(container);

  // Settle
  await new Promise((res) => setTimeout(res, 100));

  try {
    const canvas = await (html2canvas as any)(cloned, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: cloned.scrollWidth || 1123,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    return pdf;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export async function downloadManifestPdf(fileName: string = 'Manifest.pdf') {
  try {
    const pdf = await createManifestJsPdf();
    const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(cleanFileName);
    return true;
  } catch (error) {
    console.error('Failed to export Manifest PDF:', error);
    throw error;
  }
}

export async function printManifestPdf() {
  try {
    const pdf = await createManifestJsPdf();
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }
      }, 500);
    };
    return true;
  } catch (error) {
    console.warn('Direct PDF print failed, falling back to browser window.print():', error);
    const prev = document.body.dataset.printMode;
    document.body.dataset.printMode = 'manifest';
    window.print();
    if (prev) document.body.dataset.printMode = prev;
    else delete document.body.dataset.printMode;
    return true;
  }
}

