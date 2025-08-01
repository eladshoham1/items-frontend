import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Receipt, User } from '../../types';
import { useReceipts } from '../../hooks';
import { paginate } from '../../utils';
import { generateReceiptPDF } from '../../utils/pdfGenerator';
import { UI_CONFIG } from '../../config/app.config';
import Modal from '../../shared/components/Modal';
import WithdrawForm from '../../components/receipts/ReturnForm';
import CreateReceiptForm from './CreatePendingReceiptForm';
import PendingReceiptsList from './PendingReceiptsList';
import DeleteReceiptModal from './DeleteReceiptModal';
import './ReceiptsTab.css';
import '../../shared/styles/components.css';

const timestampToDate = (timestamp: string): string => {
    return format(new Date(timestamp), 'dd/MM/yy HH:mm:ss');
};

interface ReceiptsTabProps {
    userProfile: User;
    isAdmin: boolean;
}

const ReceiptsTab: React.FC<ReceiptsTabProps> = ({ userProfile, isAdmin }) => {
    const { receipts, pendingReceipts, fetchPendingReceipts, fetchMyPendingReceipts, deleteReceipt } = useReceipts();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [modalType, setModalType] = useState<'create' | 'return' | 'update'>('create');
    const [activeTab, setActiveTab] = useState<'signed' | 'pending'>('signed');

    // Filter receipts based on user role
    const userReceipts = isAdmin ? receipts : receipts.filter(receipt => receipt.signedById === userProfile.id);
    const userPendingReceipts = isAdmin ? pendingReceipts : pendingReceipts.filter(receipt => receipt.signedById === userProfile.id);

    const { paginatedItems: paginatedReceipts, totalPages } = paginate(userReceipts, currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

    // Load pending receipts when tab changes
    useEffect(() => {
        if (activeTab === 'pending') {
            if (isAdmin) {
                fetchPendingReceipts();
            } else {
                fetchMyPendingReceipts();
            }
        }
    }, [activeTab, isAdmin, fetchPendingReceipts, fetchMyPendingReceipts]);

    const handleTabChange = (tab: 'signed' | 'pending') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handlePendingReceiptsRefresh = () => {
        if (isAdmin) {
            fetchPendingReceipts();
        } else {
            fetchMyPendingReceipts();
        }
    };

    const handleCreateNewClick = () => {
        setSelectedReceipt(null);
        setModalType('create');
        setIsModalOpen(true);
    };

    const handleUpdateClick = (receipt: Receipt) => {
        setSelectedReceipt(receipt);
        setModalType('update');
        setIsUpdateModalOpen(true);
    };

    const handleReturnClick = (receipt: Receipt) => {
        setSelectedReceipt(receipt);
        setModalType('return');
        setIsModalOpen(true);
    };

    const handleDeleteClick = (receipt: Receipt) => {
        setSelectedReceipt(receipt);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedReceipt) return;

        setIsDeleting(true);
        try {
            const success = await deleteReceipt(selectedReceipt.id);
            if (success) {
                handleCloseModal();
                // No need to refresh since deleteReceipt already updates the state
            }
        } catch (error) {
            console.error('Error deleting receipt:', error);
            // Error is handled by the hook
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedReceipt(null);
        setIsModalOpen(false);
        setIsUpdateModalOpen(false);
        setIsDeleteModalOpen(false);
    };

    const handleUpdateSuccess = () => {
        handleCloseModal();
        // Refresh both lists since updated receipt becomes pending
        handlePendingReceiptsRefresh();
    };

    const handleDownloadPDF = (receipt: Receipt) => {
        try {
            generateReceiptPDF(receipt);
        } catch (error) {
            console.error('Error generating PDF:', error);
            // You could add a toast notification here
        }
    };

    const renderTabButtons = () => (
        <div className="tab-nav" style={{ direction: 'rtl' }}>
            <button
                className={`tab-nav-item ${activeTab === 'signed' ? 'active' : ''}`}
                onClick={() => handleTabChange('signed')}
            >
                <i className="fas fa-receipt me-2"></i>
                {isAdmin ? 'כל הקבלות החתומות' : 'הקבלות שלי'}
            </button>
            
            <button
                className={`tab-nav-item ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => handleTabChange('pending')}
            >
                <i className="fas fa-clock me-2"></i>
                {isAdmin ? 'כל הקבלות הממתינות' : 'קבלות ממתינות שלי'}
            </button>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'signed':
                return (
                    <div>
                        <div className="header-actions">
                            <h3>{isAdmin ? 'כל הקבלות החתומות' : 'הקבלות שלי'}</h3>
                            {isAdmin && (
                                <button className="create-button" onClick={handleCreateNewClick}>
                                    <i className="fas fa-plus"></i>
                                    צור קבלה חדשה
                                </button>
                            )}
                        </div>

                        {paginatedReceipts.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-receipt"></i>
                                <h4>אין קבלות להצגה</h4>
                                <p>{isAdmin ? 'לא נמצאו קבלות במערכת' : 'לא נמצאו קבלות עבורך'}</p>
                            </div>
                        ) : (
                            <>
                                <table className="receipts-table">
                                    <thead>
                                        <tr>
                                            <th>שם המנפיק</th>
                                            <th>כמות פריטים</th>
                                            <th>תאריך חתימה</th>
                                            <th>פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedReceipts.map(receipt => (
                                            <tr key={receipt.id}>
                                                <td>{receipt.createdBy?.name || 'משתמש לא ידוע'}</td>
                                                <td>{receipt.receiptItems?.length || 0}</td>
                                                <td>{timestampToDate(receipt.updatedAt.toString())}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {isAdmin && (
                                                            <>
                                                                <button 
                                                                    className="btn btn-primary" 
                                                                    onClick={() => handleUpdateClick(receipt)}
                                                                    title="עדכן קבלה"
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                    עדכן
                                                                </button>
                                                                <button 
                                                                    className="btn btn-danger" 
                                                                    onClick={() => handleDeleteClick(receipt)}
                                                                    title="מחק קבלה"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                    מחק
                                                                </button>
                                                            </>
                                                        )}
                                                        <button 
                                                            className="btn btn-info" 
                                                            onClick={() => handleDownloadPDF(receipt)}
                                                            title="הורד קבלה"
                                                        >
                                                            <i className="fas fa-download"></i>
                                                            הורד PDF
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {totalPages > 1 && (
                                    <div className="pagination">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button 
                                                key={page} 
                                                onClick={() => setCurrentPage(page)} 
                                                className={`pagination-btn${currentPage === page ? ' active' : ''}`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );

            case 'pending':
                return (
                    <div style={{ direction: 'rtl' }}>
                        <PendingReceiptsList
                            pendingReceipts={userPendingReceipts}
                            onRefresh={handlePendingReceiptsRefresh}
                            isAdmin={isAdmin}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="surface receipts-tab-container">
            {renderTabButtons()}
            <div style={{ padding: '20px' }}>
                {renderTabContent()}
            </div>

            {/* Create/Return Modal */}
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                    {modalType === 'return' && selectedReceipt ? (
                        <WithdrawForm
                            receipt={selectedReceipt}
                            onSuccess={handleCloseModal}
                            onCancel={handleCloseModal}
                        />
                    ) : modalType === 'create' ? (
                        <CreateReceiptForm
                            onSuccess={handleCloseModal}
                            onCancel={handleCloseModal}
                        />
                    ) : null}
                </Modal>
            )}

            {/* Update Modal - Creates Pending Receipt */}
            {isUpdateModalOpen && selectedReceipt && (
                <Modal isOpen={isUpdateModalOpen} onClose={handleCloseModal}>
                    <CreateReceiptForm
                        originalReceipt={selectedReceipt}
                        onSuccess={handleUpdateSuccess}
                        onCancel={handleCloseModal}
                    />
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedReceipt && (
                <DeleteReceiptModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseModal}
                    onConfirm={handleConfirmDelete}
                    receiptId={selectedReceipt.id}
                    isLoading={isDeleting}
                />
            )}
        </div>
    );
};

export default ReceiptsTab;
