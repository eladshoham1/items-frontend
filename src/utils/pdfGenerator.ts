import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Receipt } from '../types';

// Function to format date in Hebrew
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Create HTML template for the receipt
const createReceiptHTML = (receipt: Receipt): string => {
  // Process items to merge quantities for items with same names
  const processedItems: Array<{
    name: string;
    isNeedReport: boolean;
    idNumber: string;
    note: string;
    quantity: number;
  }> = [];

  // Process each receipt item
  for (const receiptItem of receipt.receiptItems || []) {
    const itemName = receiptItem.item?.itemName?.name || '';
    const itemIdNumber = receiptItem.item?.idNumber || '';
    const itemNote = receiptItem.item?.note || '';
    // Use the isNeedReport value directly from the receipt item data
    const itemIsNeedReport = receiptItem.item?.isNeedReport || false;

    // Check if we already have an item with the same name for quantity grouping
    const existingItem = processedItems.find(
      item => item.name === itemName
    );
    
    if (existingItem) {
      // Merge with existing item by increasing quantity
      existingItem.quantity += 1;
      // Combine notes if different
      if (itemNote && !existingItem.note.includes(itemNote)) {
        existingItem.note = existingItem.note ? `${existingItem.note}, ${itemNote}` : itemNote;
      }
      // Keep the first ID number, or combine if different
      if (itemIdNumber && !existingItem.idNumber.includes(itemIdNumber)) {
        existingItem.idNumber = existingItem.idNumber ? `${existingItem.idNumber}, ${itemIdNumber}` : itemIdNumber;
      }
    } else {
      // Add new item
      processedItems.push({
        name: itemName,
        isNeedReport: itemIsNeedReport,
        idNumber: itemIdNumber,
        note: itemNote,
        quantity: 1
      });
    }
  }

  const itemsRows = processedItems.map((item, index) => `
    <tr>
      <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${item.name}</td>
      <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.isNeedReport ? 'כן' : 'לא'}</td>
      <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.idNumber}</td>
      <td style="text-align: center; padding: 8px; border: 1px solid #ddd; font-weight: 600;">${item.quantity}</td>
    </tr>
  `).join('') || '';

  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>קבלה</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Heebo', 'Assistant', 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
          background: white;
          color: #333;
          padding: 15px;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .receipt-container {
          max-width: 750px;
          margin: 0 auto;
          background: white;
          border: 2px solid #2c3e50;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 10px;
        }
        
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 12px;
          color: #7f8c8d;
          font-weight: 400;
        }
        
        .info-section {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .dual-info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .issuer-section,
        .recipient-section {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 12px;
        }
        
        .person-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(3, auto);
          gap: 6px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 10px;
          border-bottom: 2px solid #3498db;
          padding-bottom: 3px;
          text-align: center;
        }
        
        .info-item {
          padding: 4px 6px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e3e6ea;
          font-size: 10px;
        }
        
        .info-label {
          font-weight: 600;
          color: #495057;
          display: block;
          margin-bottom: 2px;
          font-size: 10px;
        }
        
        .info-value {
          color: #212529;
          font-weight: 500;
        }
        
        .table-container {
          margin: 20px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 13px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        
        .items-table th {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          padding: 12px 8px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
        
        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #dee2e6;
          vertical-align: middle;
          text-align: center;
          font-size: 12px;
        }
        
        .items-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .items-table tr:hover {
          background: #e3f2fd;
        }
        
        .items-table tr:last-child td {
          border-bottom: none;
        }
        
        .signature-section {
          margin-top: 20px;
          border: 2px solid #3498db;
          border-radius: 6px;
          padding: 15px;
          background: #f8f9fa;
        }
        
        .signature-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #2c3e50;
          text-align: center;
        }
        
        .signature-container {
          text-align: center;
          min-height: 60px;
          background: white;
          border: 2px dashed #3498db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          margin: 0 auto;
          max-width: 200px;
        }
        
        .signature-image {
          max-width: 150px;
          max-height: 50px;
          border: 1px solid #bdc3c7;
          border-radius: 4px;
        }
        
        .no-signature {
          color: #7f8c8d;
          font-style: italic;
          font-size: 12px;
        }
        
        .footer {
          margin-top: 15px;
          text-align: center;
          font-size: 10px;
          color: #7f8c8d;
          border-top: 1px solid #ecf0f1;
          padding-top: 10px;
          font-weight: 300;
        }
        
        /* Specific Hebrew text styling */
        .hebrew-text {
          font-family: 'Heebo', 'Assistant', 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
        }
        
        @media print {
          body { 
            font-size: 12px; 
            padding: 15px;
          }
          .receipt-container { 
            border: 2px solid #2c3e50; 
            padding: 20px; 
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="title">טופס החתמת ציוד</div>
          <div class="subtitle">מסמך זה מהווה מסמך רשמי על החתמת ציוד טופס 1008</div>
        </div>
        
        <div class="dual-info-section">
          <div class="issuer-section">
            <div class="section-title hebrew-text">פרטי המנפיק</div>
            <div class="person-info">
              <div class="info-item hebrew-text">
                <span class="info-label">שם:</span>
                <span class="info-value">${receipt.createdBy?.name || 'משתמש לא ידוע'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">דרגה:</span>
                <span class="info-value">${receipt.createdBy?.rank || 'לא צוין'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">מספר אישי:</span>
                <span class="info-value">${receipt.createdBy?.personalNumber || 'לא צוין'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">מסגרת:</span>
                <span class="info-value">${receipt.createdBy?.location?.unit?.name || 'לא צוין'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">מיקום:</span>
                <span class="info-value">${receipt.createdBy?.location?.name || 'לא צוין'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">טלפון:</span>
                <span class="info-value">${receipt.createdBy?.phoneNumber || 'לא צוין'}</span>
              </div>
            </div>
          </div>
          
          <div class="recipient-section">
            <div class="section-title hebrew-text">פרטי המקבל</div>
            <div class="person-info">
              <div class="info-item hebrew-text">
                <span class="info-label">שם:</span>
                <span class="info-value">${receipt.signedBy?.name || 'משתמש לא ידוע'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">דרגה:</span>
                <span class="info-value">${receipt.signedBy?.rank || 'לא צוין'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">מספר אישי:</span>
                <span class="info-value">${receipt.signedBy?.personalNumber || 'לא צוין'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">מסגרת:</span>
                <span class="info-value">${receipt.signedBy?.location?.unit?.name || 'לא צוין'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">מיקום:</span>
                <span class="info-value">${receipt.signedBy?.location?.name || 'לא צוין'}</span>
              </div>
              <div class="info-item hebrew-text">
                <span class="info-label">טלפון:</span>
                <span class="info-value">${receipt.signedBy?.phoneNumber || 'לא צוין'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="table-container">
          <div class="section-title hebrew-text">רשימת פריטים</div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 8%;">#</th>
                <th style="width: 40%;">שם הפריט</th>
                <th style="width: 20%;">צופן</th>
                <th style="width: 22%;">מספר צ'</th>
                <th style="width: 10%;">כמות</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div style="text-align: left; margin-top: 10px; font-size: 11px; color: #666;">
            <strong>תאריך מלא:</strong> ${formatDate(receipt.createdAt.toString())}
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-title hebrew-text">חתימת המקבל</div>
          <div class="signature-container">
            ${receipt.signature ? 
              `<img src="${receipt.signature}" alt="חתימה" class="signature-image" />` : 
              '<span class="no-signature hebrew-text">לא נמצאה חתימה</span>'
            }
          </div>
        </div>
        
        <div class="footer hebrew-text">
          נוצר ב: ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL')}
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateReceiptPDF = async (receipt: Receipt): Promise<void> => {
  try {
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createReceiptHTML(receipt);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '750px';
    tempDiv.style.height = 'auto';
    document.body.appendChild(tempDiv);

    // Wait a moment for fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create canvas from HTML
    const canvas = await html2canvas(tempDiv, {
      useCORS: true,
      allowTaint: true,
      width: 750,
      height: tempDiv.scrollHeight
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    const currentDate = new Date().toLocaleDateString('he-IL').replace(/\//g, '-');
    const fileName = `קבלה-${receipt.signedBy?.name || 'משתמש-לא-ידוע'}-${currentDate}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    // Removed console.error to avoid noisy logs
    
    // Fallback: create a simple text-based PDF if HTML rendering fails
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('Receipt - PDF Generation Error', 20, 20);
    doc.setFontSize(12);
    doc.text(`Receipt ID: ${receipt.id}`, 20, 40);
    doc.text(`Issuer: ${receipt.createdBy?.name || 'Unknown Issuer'}`, 20, 50);
    doc.text(`User: ${receipt.signedBy?.name || 'Unknown User'}`, 20, 60);
    doc.text(`Date: ${formatDate(receipt.createdAt.toString())}`, 20, 70);
    
    // Add items
    let y = 90;
    doc.text('Items:', 20, y);
    y += 10;
    receipt.receiptItems?.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.item?.itemName?.name || 'Unknown Item'}`, 20, y);
      y += 8;
    });
    
    const currentDate = new Date().toLocaleDateString('he-IL').replace(/\//g, '-');
    const fileName = `receipt-${receipt.signedBy?.name || 'unknown-user'}-${currentDate}.pdf`;
    doc.save(fileName);
  }
};

// Daily Report PDF Generator
interface DailyReportPDFData {
  reportDate: string;
  totalItems: number;
  reportedItems: number;
  completedAt?: string;
  items: Array<{
    name: string;
    idNumber: string;
    isReported: boolean;
    reportedAt: string;
    notes: string;
    unit?: string;
    location?: string;
  }>;
}

export const generateDailyReportPDF = (reportData: DailyReportPDFData): void => {
  // Format date for display (date only, no time)
  const reportDate = new Date(reportData.reportDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const completionPercentage = reportData.totalItems > 0 
    ? Math.round((reportData.reportedItems / reportData.totalItems) * 100) 
    : 0;

  console.log(`Processing ${reportData.items.length} items for PDF generation`);

  // Create a clean, simple HTML document with proper scaling
  const createCleanHTML = (): string => {
    const itemsPerPage = 15; // Reduced to ensure larger text
    const totalPages = Math.ceil(reportData.items.length / itemsPerPage);
    let allPagesHTML = '';

    for (let pageIndex = 0; pageIndex < Math.max(1, totalPages); pageIndex++) {
      const startIndex = pageIndex * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, reportData.items.length);
      const pageItems = reportData.items.slice(startIndex, endIndex);
      const isFirstPage = pageIndex === 0;

      allPagesHTML += `
        <div class="page" style="width: 794px; min-height: 1123px; padding: 60px; margin: 0; page-break-after: ${pageIndex < totalPages - 1 ? 'always' : 'auto'}; background: white; font-family: Arial, sans-serif; direction: rtl; position: relative; box-sizing: border-box;">
          ${isFirstPage ? `
          <!-- Header Section -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2980b9;">
            <h1 style="color: #2980b9; font-size: 28px; margin: 0 0 12px 0; font-weight: bold;">דו"ח צ' - ${reportDate}</h1>
            <h2 style="color: #666; font-size: 16px; margin: 0; font-weight: normal;">אחל"ן - אמצעי חתימות ללא ניירת</h2>
          </div>
          
          <!-- Summary Section -->
          <div style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <div style="font-size: 18px; font-weight: bold; color: #2980b9; margin-bottom: 15px; text-align: center;">סיכום הדוח</div>
            <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 15px;">
              <div style="flex: 1; font-size: 14px;">
                <span style="font-size: 24px; font-weight: bold; color: #2980b9; display: block;">${reportData.totalItems}</span>
                <div>סה"כ פריטים</div>
              </div>
              <div style="flex: 1; font-size: 14px;">
                <span style="font-size: 24px; font-weight: bold; color: #2980b9; display: block;">${reportData.reportedItems}</span>
                <div>פריטים שדווחו</div>
              </div>
              <div style="flex: 1; font-size: 14px;">
                <span style="font-size: 24px; font-weight: bold; color: #2980b9; display: block;">${completionPercentage}%</span>
                <div>אחוז השלמה</div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 10px;">
              <span style="display: inline-block; padding: 8px 15px; border-radius: 12px; color: white; font-weight: bold; font-size: 14px; background: ${reportData.completedAt ? '#28a745' : '#ffc107'};">
                ${reportData.completedAt ? '✅ דוח הושלם' : '⏳ דוח פתוח'}
              </span>
              ${reportData.completedAt ? `<div style="margin-top: 8px; color: #666; font-size: 12px;">הושלם ב: ${new Date(reportData.completedAt).toLocaleDateString('he-IL')}</div>` : ''}
            </div>
          </div>
          ` : ''}
          
          <!-- Table Section -->
          <div style="margin-top: ${isFirstPage ? '15px' : '40px'};">
            <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; text-align: center;">
              ${isFirstPage ? 'פירוט פריטים' : `פירוט פריטים (עמוד ${pageIndex + 1})`}
            </div>
            
            ${pageItems.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 2px solid #000;">
              <thead>
                <tr style="background-color: #2980b9; color: white;">
                  <th style="border: 2px solid #000; padding: 10px 8px; text-align: center; width: 30%; font-weight: bold; font-size: 13px;">שם פריט</th>
                  <th style="border: 2px solid #000; padding: 10px 8px; text-align: center; width: 15%; font-weight: bold; font-size: 13px;">מספר צ'</th>
                  <th style="border: 2px solid #000; padding: 10px 8px; text-align: center; width: 12%; font-weight: bold; font-size: 13px;">סטטוס דיווח</th>
                  <th style="border: 2px solid #000; padding: 10px 8px; text-align: center; width: 18%; font-weight: bold; font-size: 13px;">תאריך דיווח</th>
                  <th style="border: 2px solid #000; padding: 10px 8px; text-align: center; width: 25%; font-weight: bold; font-size: 13px;">יחידה ומיקום</th>
                </tr>
              </thead>
              <tbody>
                ${pageItems.map((item, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                    <td style="border: 1px solid #000; padding: 8px 10px; text-align: right; word-wrap: break-word; line-height: 1.4;">${item.name || ''}</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center; line-height: 1.4;">${item.idNumber || '-'}</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center; color: ${item.isReported ? '#28a745' : '#dc3545'}; font-weight: bold; line-height: 1.4;">
                      ${item.isReported ? '✅ דווח' : '❌ לא דווח'}
                    </td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center; line-height: 1.4; white-space: nowrap;">${item.reportedAt || '-'}</td>
                    <td style="border: 1px solid #000; padding: 8px 10px; text-align: right; word-wrap: break-word; line-height: 1.4;">${item.unit && item.location ? `${item.unit} - ${item.location}` : item.unit || item.location || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<div style="text-align: center; color: #666; margin: 30px 0; font-size: 16px;">אין פריטים להצגה</div>'}
          </div>
          
          <!-- Footer -->
          <div style="position: absolute; bottom: 40px; left: 60px; right: 60px; text-align: center; color: #666; font-size: 11px; border-top: 1px solid #dee2e6; padding-top: 10px;">
            דוח נוצר ב: ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} | עמוד ${pageIndex + 1} מתוך ${Math.max(1, totalPages)}
          </div>
        </div>
      `;
    }

    return `
      <div style="margin: 0; padding: 0; background: white;">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif; 
            direction: rtl;
          }
          @media print {
            body { margin: 0; }
            .page { page-break-after: always; }
            .page:last-child { page-break-after: auto; }
          }
          table { border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; }
        </style>
        ${allPagesHTML}
      </div>
    `;
  };

  // Create temporary element for PDF generation
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createCleanHTML();
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.background = 'white';
  tempDiv.style.width = '794px'; // Fixed width for consistent rendering
  document.body.appendChild(tempDiv);

  // Wait for rendering and generate PDF
  setTimeout(() => {
    html2canvas(tempDiv, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
      width: 794,
      height: tempDiv.scrollHeight
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Calculate proper scaling to fit A4 width
      const canvasWidth = 794;
      const canvasHeight = canvas.height;
      const scaledHeight = (canvasHeight * pageWidth) / canvasWidth;
      
      // Calculate pages needed
      const totalPages = Math.ceil(scaledHeight / pageHeight);
      
      console.log(`Canvas: ${canvasWidth}x${canvasHeight}, Scaled: ${pageWidth}x${scaledHeight}, Pages: ${totalPages}`);
      
      // Add pages to PDF
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yOffset = -(pageHeight * i);
        pdf.addImage(imgData, 'PNG', 0, yOffset, pageWidth, scaledHeight);
      }

      // Clean up
      document.body.removeChild(tempDiv);
      
      // Save PDF
      const fileName = `דוח צ - ${reportDate}.pdf`;
      pdf.save(fileName);
      
      console.log(`PDF saved: ${fileName}`);
    }).catch(error => {
      console.error('Error generating PDF:', error);
      document.body.removeChild(tempDiv);
      alert('שגיאה ביצירת הקובץ PDF');
    });
  }, 1500);
};
