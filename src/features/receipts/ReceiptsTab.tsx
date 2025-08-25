import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Receipt, User } from '../../types';
import { useReceipts } from '../../hooks';
import { paginate } from '../../utils';
import { receiptService } from '../../services';
import { UI_CONFIG } from '../../config/app.config';
import Modal from '../../shared/components/Modal';
import { SmartPagination, TabNavigation } from '../../shared/components';
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

    // Tab configuration
    const receiptTabs = [
        { 
            id: 'signed', 
            label: isAdmin ? 'כל הקבלות החתומות' : 'קבלות המיקום שלי', 
            icon: 'fas fa-receipt' 
        },
        { 
            id: 'pending', 
            label: isAdmin ? 'כל הקבלות הממתינות' : 'קבלות ממתינות במיקום שלי', 
            icon: 'fas fa-clock' 
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

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }} />;
        }
        return sortConfig.direction === 'asc' ? (
            <i className="fas fa-sort-up ms-1" />
        ) : (
            <i className="fas fa-sort-down ms-1" />
        );
    };

    // Apply search + sort
    const filteredAndSortedReceipts = useMemo(() => {
        const term = searchTerm.toLowerCase();
        let filtered = userReceipts.filter((r) => {
            const issuer = r.createdBy?.name?.toLowerCase() || '';
            const receiver = r.signedBy?.name?.toLowerCase() || '';
            const unit = getUnit(r).toLowerCase();
            const count = (r.receiptItems?.length || 0).toString();
            const dateStr = timestampToDate(r.updatedAt.toString()).toLowerCase();
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

    // const handleReturnClick = (receipt: Receipt) => {
    //     setSelectedReceipt(receipt);
    //     setModalType('return');
    //     setIsModalOpen(true);
    // };

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
                
                alert(errorMessage);
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                alert('פג הזמן הקצוב לחיבור - הקבלה עשויה להיות גדולה מדי');
            } else if (error.message?.includes('Network Error')) {
                alert('שגיאה בחיבור לשרת - אנא בדוק את החיבור לאינטרנט');
            } else {
                alert('שגיאה לא צפויה בהורדת הקבלה');
            }
        } finally {
            setDownloadingReceiptId(null);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'signed':
                return (
                    <div>
                        <div className="header-actions">
                            <h3>{isAdmin ? 'כל הקבלות החתומות' : 'קבלות המיקום שלי'}</h3>
                            {isAdmin && (
                                <button className="create-button" onClick={handleCreateNewClick}>
                                    <i className="fas fa-plus"></i>
                                    צור קבלה חדשה
                                </button>
                            )}
                        </div>

                        {/* Full-width search bar */}
                        <div className="search-bar" style={{ direction: 'rtl', margin: '12px 0 16px 0' }}>
                            <div className="input-group" style={{ width: '100%' }}>
                                <span className="input-group-text"><i className="fas fa-search" /></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="חפש לפי מנפיק, מקבל, יחידה או תאריך..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    style={{ direction: 'rtl' }}
                                />
                                {searchTerm && (
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                                        title="נקה חיפוש"
                                    >
                                        <i className="fas fa-times" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {paginatedReceipts.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-receipt"></i>
                                <h4>אין קבלות להצגה</h4>
                                <p>{isAdmin ? 'לא נמצאו קבלות במערכת' : 'לא נמצאו קבלות עבור המיקום שלך'}</p>
                            </div>
                        ) : (
                            <>
                                <table className="receipts-table">
                                    <thead>
                                        <tr>
                                            <th className="sortable-header" onClick={() => handleSort('createdBy')} data-sorted={sortConfig?.key === 'createdBy'}>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span>מנפיק</span>
                                                    <div className="sort-indicator">{getSortIcon('createdBy')}</div>
                                                </div>
                                            </th>
                                            <th className="sortable-header" onClick={() => handleSort('signedBy')} data-sorted={sortConfig?.key === 'signedBy'}>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span>מקבל</span>
                                                    <div className="sort-indicator">{getSortIcon('signedBy')}</div>
                                                </div>
                                            </th>
                                            <th className="sortable-header" onClick={() => handleSort('unit')} data-sorted={sortConfig?.key === 'unit'}>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span>יחידה</span>
                                                    <div className="sort-indicator">{getSortIcon('unit')}</div>
                                                </div>
                                            </th>
                                            <th className="sortable-header" onClick={() => handleSort('itemCount')} data-sorted={sortConfig?.key === 'itemCount'}>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span>כמות פריטים</span>
                                                    <div className="sort-indicator">{getSortIcon('itemCount')}</div>
                                                </div>
                                            </th>
                                            <th className="sortable-header" onClick={() => handleSort('updatedAt')} data-sorted={sortConfig?.key === 'updatedAt'}>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <span>תאריך חתימה</span>
                                                    <div className="sort-indicator">{getSortIcon('updatedAt')}</div>
                                                </div>
                                            </th>
                                            <th>פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedReceipts.map(receipt => (
                                            <tr key={receipt.id} onClick={() => setDetailsReceipt(receipt)} style={{ cursor: 'pointer' }}>
                                                <td>{receipt.createdBy?.name || 'משתמש לא ידוע'}</td>
                                                <td>{receipt.signedBy?.name || 'משתמש לא ידוע'}</td>
                                                <td>{getUnit(receipt)}</td>
                                                <td>{receipt.receiptItems?.length || 0}</td>
                                                <td>{timestampToDate(receipt.updatedAt.toString())}</td>
                                                <td>
                                                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
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

                                {totalPages > 1 && (
                                    <SmartPagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
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
                            currentUserId={userProfile?.id}
                            signPendingReceipt={signPendingReceipt}
                            deleteReceipt={deleteReceipt}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    // Check if user has a location assigned
    if (!userProfile.location) {
        return (
            <div className="surface receipts-tab-container">
                <div style={{ padding: '20px' }}>
                    <div className="alert alert-warning">
                        <h4>אין לך גישה למערכת</h4>
                        <p>המשתמש שלך לא שוייך למיקום. אנא פנה למנהל המערכת כדי לשייך אותך למיקום.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <TabNavigation
                tabs={receiptTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant="primary"
                size="md"
            />
            <div style={{ padding: '20px' }}>
                {renderTabContent()}
            </div>

            {/* Details Modal for signed receipts */}
            {detailsReceipt && (
                <Modal
                    isOpen={!!detailsReceipt}
                    onClose={() => setDetailsReceipt(null)}
                    title={`פרטי קבלה #${detailsReceipt.id}`}
                    size="lg"
                >
                    <div style={{ direction: 'rtl', padding: '16px' }}>
                        {/* Summary */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '12px',
                                marginBottom: '16px',
                                background: '#ffffff',
                                border: '1px solid #e9ecef',
                                borderRadius: '8px',
                                padding: '12px'
                            }}
                        >
                            <div>
                                <div style={{ color: '#6c757d', fontSize: 12 }}>מנפיק</div>
                                <div style={{ fontWeight: 700 }}>{detailsReceipt.createdBy?.name || '—'}</div>
                            </div>
                            <div>
                                <div style={{ color: '#6c757d', fontSize: 12 }}>מקבל</div>
                                <div style={{ fontWeight: 700 }}>{detailsReceipt.signedBy?.name || '—'}</div>
                            </div>
                            <div>
                                <div style={{ color: '#6c757d', fontSize: 12 }}>יחידה</div>
                                <div style={{ fontWeight: 700 }}>{getUnit(detailsReceipt)}</div>
                            </div>
                            <div>
                                <div style={{ color: '#6c757d', fontSize: 12 }}>תאריך חתימה</div>
                                <div style={{ fontWeight: 700 }}>{timestampToDate(detailsReceipt.updatedAt.toString())}</div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e9ecef',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid #e9ecef',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ fontWeight: 700 }}>פריטים</div>
                                <span style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    fontSize: 12,
                                    fontWeight: 700
                                }}>
                                    {detailsReceipt.receiptItems?.length || 0}
                                </span>
                            </div>

                            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8f9fa' }}>
                                            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef', width: 60 }}>#</th>
                                            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef' }}>פריט</th>
                                            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef', width: 180 }}>מספר צ'</th>
                                            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef', width: 120 }}>צופן</th>
                                            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef' }}>הערה</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(detailsReceipt.receiptItems || []).map((ri, idx) => {
                                            const itemName = ri.item?.itemName?.name || '—';
                                            const idNumber = ri.item?.idNumber || '';
                                            const requiresReporting = !!ri.item?.requiresReporting;
                                            const note = ri.item?.note || '';
                                            return (
                                                <tr key={ri.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                                    <td style={{ padding: '10px 12px', color: '#6c757d' }}>{idx + 1}</td>
                                                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#333' }}>{itemName}</td>
                                                    <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', direction: 'ltr', textAlign: 'right' }}>
                                                        {idNumber ? idNumber : '—'}
                                                    </td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <span
                                                            style={{
                                                                backgroundColor: requiresReporting ? '#dc3545' : '#28a745',
                                                                color: 'white',
                                                                padding: '2px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: 12,
                                                                fontWeight: 700
                                                            }}
                                                        >
                                                            {requiresReporting ? 'כן' : 'לא'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', color: '#495057' }}>{note || '—'}</td>
                                                </tr>
                                            );
                                        })}

                                        {(!detailsReceipt.receiptItems || detailsReceipt.receiptItems.length === 0) && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6c757d' }}>
                                                    לא נמצאו פריטים עבור קבלה זו
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                    {modalType === 'create' ? (
                        <CreateReceiptForm
                            onSuccess={handleCreateSuccess}
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
        </>
    );
};

export default ReceiptsTab;
