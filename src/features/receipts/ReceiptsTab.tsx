import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Receipt, User } from '../../types';
import { useReceipts } from '../../hooks';
import { paginate } from '../../utils';
import { receiptService } from '../../services';
import { UI_CONFIG } from '../../config/app.config';
import Modal from '../../shared/components/Modal';
import { SmartPagination, TabNavigation, NotificationModal, SearchInput } from '../../shared/components';
import { NotificationType } from '../../shared/components/NotificationModal';
import ReceiptForm from './ReceiptForm';
import PendingReceiptsList from './PendingReceiptsList';
import DeleteReceiptModal from './DeleteReceiptModal';
import ReceiptDetailsModal from './ReceiptDetailsModal';
import '../../shared/styles/components.css';
import './ReceiptsTab.css';

const timestampToDate = (timestamp: string): string => {
    return format(new Date(timestamp), 'dd/MM/yy HH:mm:ss');
};

interface ReceiptsTabProps {
    userProfile: User;
    isAdmin: boolean;
}

const ReceiptsTab: React.FC<ReceiptsTabProps> = ({ userProfile, isAdmin }) => {
    const { receipts, pendingReceipts, deleteReceipt, fetchReceipts, signPendingReceipt } = useReceipts();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
    const [modalType, setModalType] = useState<'create' | 'update'>('create');
    const [activeTab, setActiveTab] = useState<'signed' | 'pending'>('signed');
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        message: string;
        type: NotificationType;
    }>({
        isOpen: false,
        message: '',
        type: 'error',
    });

    // Tab configuration
    const receiptTabs = [
        { 
            id: 'signed', 
            label: isAdmin ? 'כל הקבלות החתומות' : 'קבלות המיקום שלי', 
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 21l1.5-1.5L6 21l1.5-1.5L9 21l1.5-1.5L12 21l1.5-1.5L15 21l1.5-1.5L18 21l1.5-1.5L21 21V3l-1.5 1.5L18 3l-1.5 1.5L15 3l-1.5 1.5L12 3L10.5 4.5 9 3 7.5 4.5 6 3 4.5 4.5 3 3v18z"/>
                </svg>
            )
        },
        { 
            id: 'pending', 
            label: isAdmin ? 'כל הקבלות הממתינות' : 'קבלות ממתינות במיקום שלי', 
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z"/>
                </svg>
            )
        },
    ];

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as 'signed' | 'pending');
        setCurrentPage(1);
    };

    // New: search/sort for signed receipts
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [detailsReceipt, setDetailsReceipt] = useState<Receipt | null>(null);

    // Filter receipts based on user role and location
    const userReceipts = useMemo(() => {
        if (isAdmin) {
            return receipts; // Admins see all receipts
        }
        // Non-admin users see all receipts from their location (not just their own)
        return receipts.filter(receipt => {
            const signedByLocation = receipt.signedBy?.location?.name;
            const createdByLocation = receipt.createdBy?.location?.name;
            const userLocation = userProfile.location;
            
            // Show receipt if either the signer or creator is from the same location as current user
            return signedByLocation === userLocation || createdByLocation === userLocation;
        });
    }, [receipts, isAdmin, userProfile.location]);
    
    const userPendingReceipts = useMemo(() => {
        if (isAdmin) {
            return pendingReceipts; // Admins see all pending receipts
        }
        // Non-admin users see all pending receipts from their location (not just their own)
        return pendingReceipts.filter(receipt => {
            const signedByLocation = receipt.signedBy?.location?.name;
            const createdByLocation = receipt.createdBy?.location?.name;
            const userLocation = userProfile.location;
            
            // Show receipt if either the signer or creator is from the same location as current user
            return signedByLocation === userLocation || createdByLocation === userLocation;
        });
    }, [pendingReceipts, isAdmin, userProfile.location]);

    // Helper: get unit name (prefer receiver, fallback to issuer)
    const getUnit = (r: Receipt) => r.signedBy?.location?.unit?.name || r.createdBy?.location?.unit?.name || '—';

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Apply search + sort
    const filteredAndSortedReceipts = useMemo(() => {
        const term = searchTerm.toLowerCase().normalize('NFC');
        let filtered = userReceipts.filter((r) => {
            const issuer = (r.createdBy?.name?.toLowerCase() || '').normalize('NFC');
            const receiver = (r.signedBy?.name?.toLowerCase() || '').normalize('NFC');
            const unit = getUnit(r).toLowerCase().normalize('NFC');
            const count = (r.receiptItems?.length || 0).toString();
            const dateStr = timestampToDate(r.updatedAt.toString()).toLowerCase().normalize('NFC');
            return issuer.includes(term) || receiver.includes(term) || unit.includes(term) || count.includes(term) || dateStr.includes(term);
        });

        if (sortConfig) {
            const { key, direction } = sortConfig;
            filtered = [...filtered].sort((a, b) => {
                let aVal: any, bVal: any;
                switch (key) {
                    case 'createdBy':
                        aVal = a.createdBy?.name || '';
                        bVal = b.createdBy?.name || '';
                        break;
                    case 'signedBy':
                        aVal = a.signedBy?.name || '';
                        bVal = b.signedBy?.name || '';
                        break;
                    case 'unit':
                        aVal = getUnit(a) || '';
                        bVal = getUnit(b) || '';
                        break;
                    case 'itemCount':
                        aVal = a.receiptItems?.length || 0;
                        bVal = b.receiptItems?.length || 0;
                        break;
                    case 'updatedAt':
                        aVal = new Date(a.updatedAt).getTime();
                        bVal = new Date(b.updatedAt).getTime();
                        break;
                    default:
                        return 0;
                }
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    const cmp = aVal.localeCompare(bVal, 'he');
                    return direction === 'asc' ? cmp : -cmp;
                }
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [userReceipts, searchTerm, sortConfig]);

    const { paginatedItems: paginatedReceipts, totalPages } = paginate(filteredAndSortedReceipts, currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Remove the useEffect that was causing unnecessary API calls on tab changes
    // The useReceipts hook already fetches all receipts on mount and separates them into signed/pending

    const handlePendingReceiptsRefresh = async () => {
        // Refresh both signed and pending lists so UI updates immediately after actions
        await fetchReceipts();
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

    const handleCreateSuccess = () => {
        handleCloseModal();
        // After creating a receipt (pending), refresh lists so it appears immediately
        handlePendingReceiptsRefresh();
    };

    const handleDownloadPDF = async (receipt: Receipt) => {
        try {
            setDownloadingReceiptId(receipt.id);
            
            // Use the receipt service to download the PDF from server
            const blob = await receiptService.downloadReceiptPDF(receipt.id);
            
            // Create download link with a descriptive filename
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Create a descriptive filename
            const receiptDate = new Date(receipt.createdAt);
            const dateStr = receiptDate.toLocaleDateString('he-IL').replace(/\//g, '-');
            const issuer = receipt.createdBy?.name?.replace(/\s+/g, '-') || 'לא-ידוע';
            const receiver = receipt.signedBy?.name?.replace(/\s+/g, '-') || 'לא-ידוע';
            
            link.download = `קבלה-${dateStr}-${issuer}-אל-${receiver}.pdf`;
            
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error: any) {
            console.error('Error downloading receipt PDF:', error);
            
            // Handle axios error responses
            if (error.response) {
                const status = error.response.status;
                let errorMessage = 'שגיאה בהורדת הקבלה';
                
                if (status === 404) {
                    errorMessage = 'קבלה לא נמצאה במערכת';
                } else if (status === 401 || status === 403) {
                    errorMessage = 'אין הרשאה להורדת הקבלה';
                } else if (status === 500) {
                    errorMessage = 'שגיאה פנימית בשרת בעת יצירת הקבלה';
                }
                
                setNotification({
                    isOpen: true,
                    message: errorMessage,
                    type: 'error',
                });
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                setNotification({
                    isOpen: true,
                    message: 'פג הזמן הקצוב לחיבור - הקבלה עשויה להיות גדולה מדי',
                    type: 'error',
                });
            } else if (error.message?.includes('Network Error')) {
                setNotification({
                    isOpen: true,
                    message: 'שגיאה בחיבור לשרת - אנא בדוק את החיבור לאינטרנט',
                    type: 'error',
                });
            } else {
                setNotification({
                    isOpen: true,
                    message: 'שגיאה לא צפויה בהורדת הקבלה',
                    type: 'error',
                });
            }
        } finally {
            setDownloadingReceiptId(null);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'signed':
                return (
                    <>
                        {/* Compact Header with Search and Action Button */}
                        <div className="management-header-compact">
                            <div className="management-search-section">
                                <SearchInput
                                    value={searchTerm}
                                    onChange={(value) => handleSearchChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
                                    placeholder="חפש לפי מנפיק, מקבל, יחידה או תאריך..."
                                    resultsCount={filteredAndSortedReceipts.length}
                                    resultsLabel="קבלות"
                                />
                            </div>
                            {isAdmin && (
                                <div className="management-action-section">
                                    <button 
                                        onClick={handleCreateNewClick}
                                        className="btn btn-primary unified-action-btn"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <i className="fas fa-plus" style={{ fontSize: '12px' }}></i>
                                        <span>צור קבלה חדשה</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {paginatedReceipts.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-receipt"></i>
                                <h4>אין קבלות להצגה</h4>
                                <p>{isAdmin ? 'לא נמצאו קבלות במערכת' : 'לא נמצאו קבלות עבור המיקום שלך'}</p>
                            </div>
                        ) : (
                            <>
                                <div className="unified-table-container">
                                    <table className="unified-table">
                                        <thead>
                                            <tr>
                                                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('createdBy')} data-sorted={sortConfig?.key === 'createdBy'}>
                                                    <div className="d-flex align-items-center">
                                                        <span>מנפיק</span>
                                                    </div>
                                                </th>
                                                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('signedBy')} data-sorted={sortConfig?.key === 'signedBy'}>
                                                    <div className="d-flex align-items-center">
                                                        <span>מקבל</span>
                                                    </div>
                                                </th>
                                                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('unit')} data-sorted={sortConfig?.key === 'unit'}>
                                                    <div className="d-flex align-items-center">
                                                        <span>יחידה</span>
                                                    </div>
                                                </th>
                                                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('itemCount')} data-sorted={sortConfig?.key === 'itemCount'}>
                                                    <div className="d-flex align-items-center">
                                                        <span>כמות פריטים</span>
                                                    </div>
                                                </th>
                                                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('updatedAt')} data-sorted={sortConfig?.key === 'updatedAt'}>
                                                    <div className="d-flex align-items-center">
                                                        <span>תאריך חתימה</span>
                                                    </div>
                                                </th>
                                                <th className="unified-table-header unified-table-header-regular" style={{ width: '200px' }}>פעולות</th>
                                            </tr>
                                        </thead>
                                    <tbody>
                                        {paginatedReceipts.map(receipt => (
                                            <tr key={receipt.id} className="unified-table-row" onClick={() => setDetailsReceipt(receipt)} style={{ cursor: 'pointer' }}>
                                                <td className="unified-table-cell">{receipt.createdBy?.name || 'משתמש לא ידוע'}</td>
                                                <td className="unified-table-cell">{receipt.signedBy?.name || 'משתמש לא ידוע'}</td>
                                                <td className="unified-table-cell">{getUnit(receipt)}</td>
                                                <td className="unified-table-cell">{receipt.receiptItems?.length || 0}</td>
                                                <td className="unified-table-cell">{timestampToDate(receipt.updatedAt.toString())}</td>
                                                <td className="unified-table-cell">
                                                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                                                        {isAdmin && (
                                                            <>
                                                                <button 
                                                                    className="btn btn-primary unified-action-btn" 
                                                                    onClick={() => handleUpdateClick(receipt)}
                                                                    title="עדכן קבלה"
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                    עדכן
                                                                </button>
                                                                <button 
                                                                    className="btn btn-danger unified-action-btn" 
                                                                    onClick={() => handleDeleteClick(receipt)}
                                                                    title="מחק קבלה"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                    מחק
                                                                </button>
                                                            </>
                                                        )}
                                                        <button 
                                                            className="btn btn-info unified-action-btn" 
                                                            onClick={() => handleDownloadPDF(receipt)}
                                                            disabled={downloadingReceiptId === receipt.id}
                                                            title="הורד קבלה"
                                                        >
                                                            {downloadingReceiptId === receipt.id ? (
                                                                <>
                                                                    <i className="fas fa-spinner fa-spin"></i>
                                                                    מוריד...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fas fa-download"></i>
                                                                    הורד PDF
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>

                                {totalPages > 1 && (
                                    <SmartPagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                )}
                            </>
                        )}
                    </>
                );

            case 'pending':
                return (
                    <PendingReceiptsList
                        pendingReceipts={userPendingReceipts}
                        onRefresh={handlePendingReceiptsRefresh}
                        isAdmin={isAdmin}
                        currentUserId={userProfile?.id}
                        signPendingReceipt={signPendingReceipt}
                        deleteReceipt={deleteReceipt}
                    />
                );

            default:
                return null;
        }
    };

    // Check if user has a location assigned
    if (!userProfile.location) {
        return (
            <div style={{ padding: '20px' }}>
                <div className="alert alert-warning">
                    <h4>אין לך גישה למערכת</h4>
                    <p>המשתמש שלך לא שוייך למיקום. אנא פנה למנהל המערכת כדי לשייך אותך למיקום.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <TabNavigation
                tabs={receiptTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant="primary"
                size="md"
            />
            <div className="tab-content">
                {renderTabContent()}
            </div>

            {/* Details Modal for signed receipts */}
            <ReceiptDetailsModal
                receipt={detailsReceipt}
                isOpen={!!detailsReceipt}
                onClose={() => setDetailsReceipt(null)}
            />

            {/* Create Modal */}
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                    {modalType === 'create' ? (
                        <ReceiptForm
                            onSuccess={handleCreateSuccess}
                            onCancel={handleCloseModal}
                        />
                    ) : null}
                </Modal>
            )}

            {/* Update Modal - Creates Pending Receipt */}
            {isUpdateModalOpen && selectedReceipt && (
                <Modal isOpen={isUpdateModalOpen} onClose={handleCloseModal}>
                    <ReceiptForm
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

            {/* Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification({ isOpen: false, message: '', type: 'error' })}
                message={notification.message}
                type={notification.type}
            />
        </div>
    );
};

export default ReceiptsTab;
