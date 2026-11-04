/**
 * High-fidelity PDF export and printing utility for Master Air Waybill (MAWB)
 * Uses html2canvas-pro and jsPDF for client-side rendering matching exact A4 dimensions.
 * Identical implementation to inventory-management for pixel-perfect PDF export.
 */

export async function createMawbJsPdf(exportMode: 'face' | 'conditions' | 'both' = 'both') {
  const html2canvasModule = await import('html2canvas-pro');
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  // Helper to render an element to a canvas
  const renderElementToCanvas = async (elem: HTMLElement) => {
    // Create an off-screen container to ensure scale(1) clean rendering
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-10000px';
    container.style.width = '210mm';
    container.style.minHeight = '297mm';
    container.style.zIndex = '-9999';
    container.style.backgroundColor = '#ffffff';
    container.style.margin = '0';
    container.style.padding = '0';
    container.style.transform = 'none';

    const cloned = elem.cloneNode(true) as HTMLElement;
    cloned.style.transform = 'none';
    cloned.style.width = '210mm';
    cloned.style.minHeight = '297mm';
    cloned.style.boxSizing = 'border-box';
    cloned.style.margin = '0';
    cloned.style.boxShadow = 'none';

    container.appendChild(cloned);
    document.body.appendChild(container);

    // Brief settle
    await new Promise((res) => setTimeout(res, 120));

    const canvas = await (html2canvas as any)(cloned, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: cloned.scrollWidth || 794,
    });

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    return canvas;
  };

  const page1Elem = document.getElementById('mawb-page-1');
  const page2Elem = document.getElementById('mawb-page-2');

  let pagesRendered = 0;

  // Render Page 1 (Face)
  if ((exportMode === 'both' || exportMode === 'face') && page1Elem) {
    const canvas1 = await renderElementToCanvas(page1Elem);
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pagesRendered++;
  }

  // Render Page 2 (Conditions of Contract)
  if ((exportMode === 'both' || exportMode === 'conditions') && page2Elem) {
    if (pagesRendered > 0) {
      pdf.addPage('a4', 'portrait');
    }
    const canvas2 = await renderElementToCanvas(page2Elem);
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pagesRendered++;
  }

  if (pagesRendered === 0) {
    throw new Error('No printable MAWB pages found in document DOM.');
  }

  return pdf;
}

export async function downloadMawbPdf(
  fileName: string = 'MAWB.pdf',
  exportMode: 'face' | 'conditions' | 'both' = 'both'
) {
  try {
    const pdf = await createMawbJsPdf(exportMode);
    const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(cleanFileName);
    return true;
  } catch (error) {
    console.error('Failed to export MAWB PDF:', error);
    throw error;
  }
}

export async function printMawbPdf(exportMode: 'face' | 'conditions' | 'both' = 'both') {
  try {
    const pdf = await createMawbJsPdf(exportMode);
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
    window.print();
    return true;
  }
}

