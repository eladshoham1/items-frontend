import React, { useState } from 'react';
import '../../style/theme.css';
import { format } from 'date-fns';
import { Receipt, ReceiptItem } from '../../types';
import { useReceipts } from '../../hooks';
import { paginate } from '../../utils';
import { generateReceiptPDF } from '../../utils/pdfGenerator';
import { UI_CONFIG } from '../../config/app.config';
import Modal from '../../shared/components/Modal';
import ReceiptForm from '../../features/receipts/ReceiptForm';
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

    const handleDownloadPDF = (receipt: Receipt) => {
        try {
            generateReceiptPDF(receipt);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
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
                            <td>{receipt.signedBy?.name || 'משתמש לא ידוע'}</td>
                            <td>{receipt.signedById}</td>
                            <td>{timestampToDate(receipt.createdAt.toString())}</td>
                            <td>
                                <button className="button" onClick={() => handleSelectReceipt(receipt)}>החזרה</button>
                                <button className="button" onClick={() => handleDownloadPDF(receipt)}>הורדה</button>
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
