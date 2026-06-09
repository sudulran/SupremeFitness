import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import UserSidebar from '../components/UserSidebar';

// ✅ Import Material UI Icons
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// ✅ Import PDF libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Footer from '../components/Footer';

// =============================================================================
// PURCHASE HISTORY COMPONENT
// =============================================================================

/**
 * Purchase History Component for users to view and manage their purchase records
 * Features: Purchase listing, monthly grouping, PDF report generation
 */
function PurchaseHistory() {
    // ===========================================================================
    // STATE MANAGEMENT
    // ===========================================================================
    
    const [purchaseData, setPurchaseData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupByMode, setGroupByMode] = useState('all'); // 'all' or 'monthly'

    // ===========================================================================
    // CONSTANTS AND STYLING
    // ===========================================================================
    
    const sidebarWidth = 220;

    /**
     * Dashboard content styling with responsive margin for sidebar
     */
    const dashboardContentStyle = {
        padding: '30px',
        marginLeft: window.innerWidth >= 768 ? `${sidebarWidth}px` : '0',
        backgroundColor: '#1f2937', // bg-gray-800
        minHeight: '100vh',
        transition: 'margin-left 0.3s ease-in-out',
    };

    // ===========================================================================
    // DATA FETCHING EFFECT
    // ===========================================================================

    /**
     * Fetches purchase history data from API on component mount
     * Retrieves user ID from localStorage for personalized data
     */
    useEffect(() => {
        const fetchPurchaseHistory = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const userId = user?.id;
                if (!userId) throw new Error('User ID not found');

                const response = await axiosInstance.get(`/payment/purchase-history/${userId}`);
                setPurchaseData(response.data);
            } catch (err) {
                console.error(err);
                setError('Unable to load purchase history. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchPurchaseHistory();
    }, []);

    // ===========================================================================
    // DATA PROCESSING FUNCTIONS
    // ===========================================================================

    /**
     * Groups purchase data by month and year for organized display
     * @param {Array} data - Array of purchase objects
     * @returns {Object} - Grouped purchases by month-year key
     */
    const groupByMonthYear = (data) => {
        return data.reduce((groups, item) => {
            const date = new Date(item.createdAt);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[yearMonth]) groups[yearMonth] = [];
            groups[yearMonth].push(item);
            return groups;
        }, {});
    };

    /**
     * Formats month-year key into human-readable format
     * @param {string} key - Month-year key in format "YYYY-MM"
     * @returns {string} - Formatted month year (e.g., "January 2024")
     */
    const formatMonthYear = (key) => {
        const [year, month] = key.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    /**
     * Filters purchases for the current month only
     * @returns {Array} - Purchases from current month
     */
    const getCurrentMonthPurchases = () => {
        const now = new Date();
        return purchaseData.filter((purchase) => {
            const date = new Date(purchase.createdAt);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
    };

    // ===========================================================================
    // PDF REPORT GENERATION
    // ===========================================================================

    /**
     * Generates and downloads a PDF report of current month purchases
     * Includes sender/receiver info, purchase table, and total calculation
     * @param {Array} purchases - Purchases to include in the report
     */
    const generatePDF = (purchases) => {
        const doc = new jsPDF();

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // Get user data from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        const receiverName = user?.name || 'User';
        const receiverEmail = user?.email || 'user@example.com';

        // Sender (business) information
        const sender = {
            name: 'GymStore.',
            email: 'support@gymstore.com',
            address: '123 Business Rd, Commerce City, CA',
        };

        // =======================================================================
        // PDF HEADER SECTION
        // =======================================================================
        
        // Report title
        doc.setFontSize(16);
        doc.text('Monthly Purchase Orders Report', 14, 20);

        // Generation date
        doc.setFontSize(10);
        doc.text(`Generated on: ${formattedDate}`, 14, 28);

        let y = 36;

        // Sender information
        doc.setFont(undefined, 'bold');
        doc.text('From:', 14, y);
        doc.setFont(undefined, 'normal');
        doc.text(`${sender.name}`, 30, y);
        doc.text(`${sender.email}`, 30, y + 5);
        doc.text(`${sender.address}`, 30, y + 10);

        y += 20;

        // Receiver information
        doc.setFont(undefined, 'bold');
        doc.text('To:', 14, y);
        doc.setFont(undefined, 'normal');
        doc.text(`${receiverName}`, 30, y);
        doc.text(`${receiverEmail}`, 30, y + 5);

        // =======================================================================
        // PURCHASE DATA TABLE
        // =======================================================================
        
        const tableY = y + 15;
        
        // Prepare table data with masked card numbers
        const tableData = purchases.map((purchase, index) => [
            index + 1,
            purchase.card_holder,
            `**** **** **** ${purchase.card_number.slice(-4)}`, // Mask card number
            purchase.exp_date,
            new Date(purchase.createdAt).toLocaleDateString(),
            `$${purchase.payment.toFixed(2)}`,
        ]);

        // Calculate total payment amount
        const totalPayment = purchases.reduce((sum, p) => sum + p.payment, 0);

        // Generate table using autoTable plugin
        autoTable(doc, {
            startY: tableY,
            head: [['#', 'Card Holder', 'Card Number', 'Exp. Date', 'Payment Date', 'Payment']],
            body: tableData,
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [220, 38, 38], // red-600 header
                textColor: 255,
            },
            didDrawPage: (data) => {
                // Add total payment summary after table
                const finalY = data.cursor.y + 10;
                doc.setFont(undefined, 'bold');
                doc.text('Total Payment:', data.settings.margin.left + 10, finalY);
                doc.text(`$${totalPayment.toFixed(2)}`, data.settings.margin.left + 60, finalY);
                doc.setFont(undefined, 'normal');
            },
        });

        // Download the PDF file
        doc.save(`Purchase_Report_Current_Month_${formattedDate}.pdf`);
    };

    // ===========================================================================
    // RENDER FUNCTIONS
    // ===========================================================================

    /**
     * Renders purchase data in a table format
     * @param {Array} data - Purchase data to render
     * @returns {JSX.Element} - Table component
     */
    const renderTable = (data) => (
        <table style={styles.table}>
            <thead>
                <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Card Holder</th>
                    <th style={styles.th}>Card Number</th>
                    <th style={styles.th}>Exp. Date</th>
                    <th style={styles.th}>Payment Date</th>
                    <th style={styles.th}>Payment</th>
                </tr>
            </thead>
            <tbody>
                {data.map((purchase, index) => (
                    <tr key={purchase._id} style={styles.row}>
                        <td style={styles.td}>{index + 1}</td>
                        <td style={styles.td}>{purchase.card_holder}</td>
                        <td style={styles.td}>**** **** **** {purchase.card_number.slice(-4)}</td>
                        <td style={styles.td}>{purchase.exp_date}</td>
                        <td style={styles.td}>{new Date(purchase.createdAt).toLocaleDateString()}</td>
                        <td style={styles.td}>${purchase.payment.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    // ===========================================================================
    // RENDER COMPONENT
    // ===========================================================================

    return (
        <>
        {/* SIDEBAR NAVIGATION */}
        <UserSidebar />
        
        {/* MAIN CONTENT AREA */}
        <div style={{ backgroundColor: '#1f2937', minHeight: '100vh', marginLeft:'240px' }}>
            <main style={{ marginLeft:'50px', marginRight:'50px', padding: '30px 0' }}>
                
                {/* =====================================================================
                HEADER SECTION WITH PDF BUTTON
                ===================================================================== */}
                <div style={styles.headerContainer}>
                    {/* PAGE HEADER */}
                    <h4 style={styles.pageTitle}>Purchase History</h4>
                    
                    {/* PDF DOWNLOAD BUTTON */}
                    <button
                        onClick={() => generatePDF(getCurrentMonthPurchases())}
                        style={styles.redButton}
                    >
                        📄 Download Current Month Report (PDF)
                    </button>
                </div>

                {/* =====================================================================
                GROUP BY TOGGLE BUTTONS
                Switch between all purchases view and monthly grouped view
                ===================================================================== */}
                <div style={styles.groupByTabs}>
                    {/* ALL PURCHASES VIEW */}
                    <button
                        onClick={() => setGroupByMode('all')}
                        style={{
                            ...styles.redButton,
                            ...(groupByMode === 'all' ? styles.activeTab : {}),
                        }}
                    >
                        <ListAltIcon style={styles.icon} />
                        All
                    </button>
                    
                    {/* MONTHLY GROUPED VIEW */}
                    <button
                        onClick={() => setGroupByMode('monthly')}
                        style={{
                            ...styles.redButton,
                            ...(groupByMode === 'monthly' ? styles.activeTab : {}),
                        }}
                    >
                        <CalendarTodayIcon style={styles.icon} />
                        Monthly
                    </button>
                </div>

                {/* =====================================================================
                DATA DISPLAY AREA
                Shows loading, error, empty state, or purchase data
                ===================================================================== */}
                
                {/* LOADING STATE */}
                {loading ? (
                    <div style={styles.message}>⏳ Loading...</div>
                ) : 
                
                /* ERROR STATE */
                error ? (
                    <div style={{ ...styles.message, color: '#ef4444' }}>{error}</div>
                ) : 
                
                /* EMPTY STATE */
                purchaseData.length === 0 ? (
                    <div style={styles.message}>No purchase history found.</div>
                ) : 
                
                /* ALL PURCHASES VIEW */
                groupByMode === 'all' ? (
                    renderTable(purchaseData)
                ) : 
                
                /* MONTHLY GROUPED VIEW */
                (
                    Object.entries(groupByMonthYear(purchaseData))
                        .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date descending
                        .map(([groupKey, purchases]) => (
                            <section key={groupKey} style={{ marginBottom: '2rem' }}>
                                <h3 style={styles.monthHeading}>{formatMonthYear(groupKey)}</h3>
                                {renderTable(purchases)}
                            </section>
                        ))
                )}
            </main>
        </div>
        
        {/* FOOTER COMPONENT */}
        <Footer />
        </>
    );
}

// =============================================================================
// STYLES DEFINITION
// =============================================================================

const styles = {
    // HEADER CONTAINER STYLING
    headerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px',
    },
    
    // PAGE TITLE STYLING
    pageTitle: {
        color: '#fff',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        margin: 0,
    },
    
    // TABLE STYLING: Navy background with white text
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#062043', // navy color
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        color: '#fff',
    },
    
    // TABLE HEADER STYLING
    th: {
        borderBottom: '2px solid #374151',
        padding: '12px 15px',
        backgroundColor: '#111827', // bg-gray-900
        textAlign: 'left',
        fontWeight: '600',
        color: '#fff',
        whiteSpace: 'nowrap',
    },
    
    // TABLE CELL STYLING
    td: {
        borderBottom: '1px solid #374151',
        padding: '12px 15px',
        color: '#fff',
        whiteSpace: 'nowrap',
    },
    
    // TABLE ROW STYLING
    row: {
        transition: 'background-color 0.25s ease-in-out',
        '&:hover': {
            backgroundColor: '#0d2747', // input field color on hover
        },
    },
    
    // GROUP BY TAB CONTAINER
    groupByTabs: {
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
    },
    
    // RED BUTTON STYLING (Used for actions and tabs)
    redButton: {
        padding: '10px 20px',
        backgroundColor: '#dc2626', // red-600
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: '#ef4444', // red-500
        },
    },
    
    // ACTIVE TAB STYLING
    activeTab: {
        backgroundColor: '#b91c1c', // darker red
        color: '#fff',
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
    },
    
    // ICON STYLING
    icon: {
        fontSize: '20px',
    },
    
    // MESSAGE STYLING (Loading, error, empty states)
    message: {
        padding: '1.2rem 1rem',
        backgroundColor: '#062043', // navy color
        borderRadius: '8px',
        color: '#fff',
        fontSize: '1rem',
        textAlign: 'center',
        border: '1px solid #374151',
    },
    
    // MONTH HEADING STYLING
    monthHeading: {
        marginBottom: '14px',
        fontSize: '1.25rem',
        color: '#fff',
        borderBottom: '2px solid #374151',
        paddingBottom: '6px',
        fontWeight: 'bold',
    },
};

export default PurchaseHistory;