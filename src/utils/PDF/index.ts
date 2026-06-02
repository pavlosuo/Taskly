import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SignatureCanvas from "react-signature-canvas";

export async function buildPdfBlob(
  contentEl: HTMLDivElement | null,
  sigRef: React.RefObject<SignatureCanvas | null>,
): Promise<Blob> {
  if (!contentEl || !sigRef.current) return new Blob();
  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const canvas = await html2canvas(contentEl, {
    scale: 1,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
  const renderedImgHeight = (canvas.height * contentWidth) / canvas.width;
  const signatureBlockHeight = 140;
  const usablePageHeight = pageHeight - margin * 2;
  let remainingHeight = renderedImgHeight;
  let sourceOffsetY = 0;
  let isFirstPage = true;

  while (remainingHeight > 0) {
    if (!isFirstPage) pdf.addPage();
    const isLastContentPage = remainingHeight <= usablePageHeight;
    const sliceHeight = isLastContentPage
      ? Math.min(remainingHeight, usablePageHeight - signatureBlockHeight)
      : usablePageHeight;
    const scale = canvas.width / contentWidth;
    const sourcePixelY = sourceOffsetY * scale;
    const sourcePixelHeight = sliceHeight * scale;
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sourcePixelHeight;
    sliceCanvas.getContext("2d")?.drawImage(canvas, 0, -sourcePixelY);
    pdf.addImage(
      sliceCanvas.toDataURL("image/jpeg", 0.7),
      "JPEG",
      margin,
      margin,
      contentWidth,
      sliceHeight,
    );
    sourceOffsetY += sliceHeight;
    remainingHeight -= sliceHeight;
    isFirstPage = false;
    if (isLastContentPage) {
      let yPos = margin + sliceHeight + 30;
      if (yPos + signatureBlockHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin + 30;
      }
      const sigCanvas = sigRef.current!.getTrimmedCanvas();
      const sigData = sigCanvas.toDataURL("image/png");
      const sigHeight = 80;
      const sigWidth = (sigCanvas.width * sigHeight) / sigCanvas.height;
      yPos += 20;
      pdf.addImage(
        sigData,
        "PNG",
        margin + 60,
        yPos - sigHeight / 2,
        sigWidth,
        sigHeight,
      );
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 50, yPos, margin + 520, yPos);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Signature:", margin, yPos);
      yPos += 20 + sigHeight / 2;
      pdf.text(
        `Date signed: ${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
        margin,
        yPos,
      );
      break;
    }
  }
  return pdf.output("blob");
}

export async function buildAgreementPdfBlob(
  contentRef: React.RefObject<HTMLDivElement | null>,
  signatureRef: React.RefObject<SignatureCanvas | null>,
): Promise<Blob> {
  if (!contentRef.current)
    throw new Error("Agreement content element is not mounted.");
  if (!signatureRef.current || signatureRef.current.isEmpty())
    throw new Error("Signature is empty.");
  return buildPdfBlob(contentRef.current, signatureRef);
}