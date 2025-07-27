import React, { useState } from 'react';
import '../../style/theme.css';
import { format } from 'date-fns';
import { Receipt, ReceiptItem } from '../../types';
import { useReceipts } from '../../hooks';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import Sheet from '../sheet/Sheet';
import ReceiptForm from './ReceiptForm';
import WithdrawForm from './ReturnForm';

const timestampToDate = (timestamp: string): string => {
    return format(new Date(timestamp), 'dd/MM/yy HH:mm:ss');
};

const ReceiptsTab: React.FC = () => {
    const { receipts } = useReceipts();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { paginatedItems: paginatedReceipts, totalPages } = paginate(receipts, currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

    const handleAddClick = () => {
        setSelectedReceipt(null);
        setIsModalOpen(true);
    };

    const handleSelectReceipt = (receipt: Receipt) => {
        setSelectedReceipt(receipt);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedReceipt(null);
        setIsModalOpen(false);
    };

    const generateHtml = (receipt: Receipt) => {
        const tableRows = receipt.receiptItems?.map((receiptItem) => `
      <tr>
        <td>${receiptItem.item.name}</td>
        <td>${receiptItem.item.origin}</td>
        <td>${receiptItem.item.idNumber || ''}</td>
        <td>${receiptItem.item.note || ''}</td>
      </tr>
    `).join('') || '';

        const htmlContent = `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>קבלה - ${receipt.user.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #333;
            padding: 8px 12px;
            text-align: right;
          }
          th {
            background-color: #2980b9;
            color: white;
          }
          .signature {
            margin-top: 40px;
            text-align: center;
          }
          .signature img {
            max-width: 300px;
            border: 1px solid #333;
          }
        </style>
      </head>
      <body>
        <h2>קבלה עבור ${receipt.user.name} - ${timestampToDate(receipt.updatedAt || '00')}</h2>
        <table>
          <thead>
            <tr>
              <th>שם</th>
              <th>מקור</th>
              <th>מספר צ'</th>
              <th>הערה</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
  
        <div class="signature">
          <h3>חתימה</h3>
          ${receipt.signature ? `<img src="${receipt.signature}" alt="חתימה">` : '<p>אין חתימה</p>'}
        </div>
      </body>
      </html>
    `;

        return htmlContent;
    };

    const downloadReceiptHtml = (receipt: any) => {
        const html = generateHtml(receipt);
        const blob = new Blob([html], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `receipt-${receipt.user.name}-${timestampToDate(receipt.updatedAt)}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="surface users-tab-container">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>קבלות</h2>
                <button className="button secondary" style={{ marginBottom: '10px' }} onClick={handleAddClick}>צור קבלה חדשה</button>
            </div>

            <table className="users-table">
                <thead>
                    <tr>
                        <th>שם החותם</th>
                        <th>טלפון</th>
                        <th>תאריך מלא</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedReceipts.map(receipt =>
                        <tr key={receipt.id}>
                            <td>{receipt.user.name}</td>
                            <td>{receipt.user.phoneNumber}</td>
                            <td>{timestampToDate(receipt.createdAt)}</td>
                            <td>
                                <button className="button" onClick={() => handleSelectReceipt(receipt)}>החזרה</button>
                                <button className="button" onClick={() => downloadReceiptHtml(receipt)}>הורדה</button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`pagination-btn${currentPage === page ? ' active' : ''}`}>
                        {page}
                    </button>
                ))}
            </div>

            {isModalOpen && (
                <Sheet onClose={handleCloseModal}>
                    {selectedReceipt ?
                        <WithdrawForm
                            receipt={selectedReceipt}
                            onSuccess={() => { }}
                            onCancel={handleCloseModal}
                        />
                        :
                        <ReceiptForm
                            receipt={selectedReceipt}
                            onSuccess={() => { }}
                            onCancel={handleCloseModal}
                        />
                    }
                </Sheet>
            )}
        </div>
    );
};

export default ReceiptsTab;
