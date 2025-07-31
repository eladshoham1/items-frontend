import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Receipt, User } from '../../types';
import { useReceipts } from '../../hooks';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import Modal from '../../shared/components/Modal';
import ReceiptForm from './ReceiptForm';
import WithdrawForm from '../../components/receipts/ReturnForm';
import CreatePendingReceiptForm from './CreatePendingReceiptForm';
import PendingReceiptsList from './PendingReceiptsList';
import '../../shared/styles/components.css';

const timestampToDate = (timestamp: string): string => {
    return format(new Date(timestamp), 'dd/MM/yy HH:mm:ss');
};

interface ReceiptsTabProps {
    userProfile: User;
    isAdmin: boolean;
}

const ReceiptsTab: React.FC<ReceiptsTabProps> = ({ userProfile, isAdmin }) => {
    const { receipts } = useReceipts();
    const { 
        pendingReceipts, 
        fetchPendingReceipts, 
        fetchMyPendingReceipts 
    } = useReceipts();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'receipts' | 'pending' | 'my-pending' | 'create-pending'>('receipts');

    const { paginatedItems: paginatedReceipts, totalPages } = paginate(receipts, currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

    // Load pending receipts when tab changes
    useEffect(() => {
        if (activeTab === 'pending' && isAdmin) {
            fetchPendingReceipts();
        } else if (activeTab === 'my-pending') {
            fetchMyPendingReceipts();
        }
    }, [activeTab, isAdmin, fetchPendingReceipts, fetchMyPendingReceipts]);

    const handleTabChange = (tab: 'receipts' | 'pending' | 'my-pending' | 'create-pending') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handlePendingReceiptsRefresh = () => {
        if (isAdmin) {
            fetchPendingReceipts();
        }
        fetchMyPendingReceipts();
    };

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
        <td>${receiptItem.item.itemName?.name || 'פריט לא ידוע'}</td>
        <td>לא</td>
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
              <th>צופן</th>
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

    const renderTabButtons = () => (
        <div className="tab-nav" style={{ direction: 'rtl' }}>
            <button
                className={`tab-nav-item ${activeTab === 'receipts' ? 'active' : ''}`}
                onClick={() => handleTabChange('receipts')}
            >
                <i className="fas fa-receipt me-2"></i>
                קבלות
            </button>
            
            <button
                className={`tab-nav-item ${activeTab === 'my-pending' ? 'active' : ''}`}
                onClick={() => handleTabChange('my-pending')}
            >
                <i className="fas fa-clock me-2"></i>
                קבלות ממתינות שלי
            </button>

            {isAdmin && (
                <>
                    <button
                        className={`tab-nav-item ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => handleTabChange('pending')}
                    >
                        <i className="fas fa-list me-2"></i>
                        כל הקבלות הממתינות
                    </button>
                    
                    <button
                        className={`tab-nav-item ${activeTab === 'create-pending' ? 'active' : ''}`}
                        onClick={() => handleTabChange('create-pending')}
                    >
                        <i className="fas fa-plus me-2"></i>
                        צור קבלה ממתינה
                    </button>
                </>
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'receipts':
                return (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3>קבלות</h3>
                            <button className="button secondary" onClick={handleAddClick}>
                                <i className="fas fa-plus me-2"></i>
                                צור קבלה חדשה
                            </button>
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
                    </>
                );

            case 'my-pending':
                return (
                    <PendingReceiptsList
                        pendingReceipts={pendingReceipts}
                        onRefresh={handlePendingReceiptsRefresh}
                    />
                );

            case 'pending':
                return isAdmin ? (
                    <PendingReceiptsList
                        pendingReceipts={pendingReceipts}
                        onRefresh={handlePendingReceiptsRefresh}
                    />
                ) : null;

            case 'create-pending':
                return isAdmin ? (
                    <CreatePendingReceiptForm
                        onSuccess={() => {
                            handleTabChange('pending');
                            handlePendingReceiptsRefresh();
                        }}
                        onCancel={() => handleTabChange('receipts')}
                    />
                ) : null;

            default:
                return null;
        }
    };

    return (
        <div className="surface users-tab-container">
            {renderTabButtons()}
            {renderTabContent()}

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
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
                </Modal>
            )}
        </div>
    );
};

export default ReceiptsTab;
