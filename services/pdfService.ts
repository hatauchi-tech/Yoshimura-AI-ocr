// Service to handle PDF to Image conversion
// This relies on pdf.js being loaded in index.html

export const convertPdfToImage = async (pdfFile: File): Promise<File> => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjsLib = (window as any).pdfjsLib;

      if (!pdfjsLib) {
        reject(new Error("PDF conversion library not loaded"));
        return;
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      // Fetch the first page
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for better OCR quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) {
        reject(new Error("Could not create canvas context"));
        return;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Convert canvas to blob/file
      canvas.toBlob((blob) => {
        if (blob) {
          const imageFile = new File([blob], pdfFile.name.replace('.pdf', '.png'), {
            type: 'image/png',
            lastModified: Date.now()
          });
          resolve(imageFile);
        } else {
          reject(new Error("Failed to convert PDF page to image blob"));
        }
      }, 'image/png');

    } catch (error) {
      console.error("PDF Conversion Error:", error);
      reject(error);
    }
  });
};