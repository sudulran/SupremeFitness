import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StoreAdminSidebar from '../../components/StoreAdminSidebar';

const UserManagementDashboard = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [expiringSoonUsers, setExpiringSoonUsers] = useState([]);
  const [expiredUsers, setExpiredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    expired: 0,
    expiringSoon: 0
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [renewalType, setRenewalType] = useState('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users, pendingUsers, expiringSoonUsers, expiredUsers, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [
        allUsersRes,
        pendingRes,
        expiringRes,
        expiredRes
      ] = await Promise.all([
        axios.get('/api/users', { headers }),
        axios.get('/api/users/pending', { headers }),
        axios.get('/api/users/expiring-soon', { headers }),
        axios.get('/api/users/expired', { headers })
      ]);

      setUsers(allUsersRes.data.data.users);
      setPendingUsers(pendingRes.data.data.users);
      setExpiringSoonUsers(expiringRes.data.data.users);
      setExpiredUsers(expiredRes.data.data.users);

      setStats({
        total: allUsersRes.data.count,
        pending: pendingRes.data.count,
        active: allUsersRes.data.data.users.filter(u => u.paymentStatus === 'accepted').length,
        expired: expiredRes.data.count,
        expiringSoon: expiringRes.data.count
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      alert('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let userList = [];
    switch (activeTab) {
      case 'all':
        userList = users;
        break;
      case 'pending':
        userList = pendingUsers;
        break;
      case 'expiring':
        userList = expiringSoonUsers;
        break;
      case 'expired':
        userList = expiredUsers;
        break;
      default:
        userList = users;
    }

    if (searchTerm.trim() === '') {
      setFilteredUsers(userList);
    } else {
      const filtered = userList.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.contactNumber.includes(searchTerm) ||
        user.membershipType.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleStatusUpdate = async (userId, status, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/payment-status', 
        { userId, status, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`User status updated to ${status}`);
      setShowModal(false);
      setSelectedUser(null);
      setStatusAction('');
      setRejectionReason('');
      loadDashboardData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating user status');
    }
  };

  const handleRenewMembership = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/renew-membership', 
        { userId, membershipType: renewalType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Membership renewed successfully!');
      setShowModal(false);
      setSelectedUser(null);
      setRenewalType('monthly');
      loadDashboardData();
    } catch (error) {
      console.error('Error renewing membership:', error);
      alert('Error renewing membership');
    }
  };

  const openStatusModal = (user, action) => {
    setSelectedUser(user);
    setStatusAction(action);
    setShowModal(true);
  };

  const viewPaymentReceipt = (receiptFilename) => {
    setSelectedReceipt(receiptFilename);
    setShowReceiptModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      accepted: { class: 'bg-green-100 text-green-800', text: 'Active' },
      rejected: { class: 'bg-red-100 text-red-800', text: 'Rejected' },
      expired: { class: 'bg-gray-100 text-gray-800', text: 'Expired' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const getExpirationBadge = (user) => {
    if (user.paymentStatus !== 'accepted') return null;
    
    if (user.daysUntilExpiration <= 0) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Expired
        </span>
      );
    } else if (user.daysUntilExpiration <= 7) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Expiring in {user.daysUntilExpiration} days
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {user.daysUntilExpiration} days left
        </span>
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

const getReceiptUrl = (filename) => {
  return `/uploads/payments/${filename}`;
};

  const isImageFile = (filename) => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (filename) => {
    if (!filename) return false;
    return filename.toLowerCase().endsWith('.pdf');
  };

  const generateReport = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SUPREME FITNESS - User Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dc2626; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .red { color: #dc2626; }
          .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #dc2626; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-active { background: #d1fae5; color: #065f46; }
          .badge-rejected { background: #fee2e2; color: #991b1b; }
          .badge-expired { background: #f3f4f6; color: #374151; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SUPREME<span class="red">FITNESS</span></div>
          <h1>User Management Report</h1>
          <p>Generated on: ${currentDate}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <strong>Total Users</strong><br>${stats.total}
          </div>
          <div class="stat-card">
            <strong>Pending</strong><br>${stats.pending}
          </div>
          <div class="stat-card">
            <strong>Active</strong><br>${stats.active}
          </div>
          <div class="stat-card">
            <strong>Expiring Soon</strong><br>${stats.expiringSoon}
          </div>
          <div class="stat-card">
            <strong>Expired</strong><br>${stats.expired}
          </div>
        </div>

        <h2>${activeTab === 'all' ? 'All Users' : 
                 activeTab === 'pending' ? 'Pending Approval' :
                 activeTab === 'expiring' ? 'Expiring Soon' : 'Expired Users'} 
                 (${filteredUsers.length})</h2>
        
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Membership</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(user => `
              <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.contactNumber}</td>
                <td>${user.membershipType}</td>
                <td>
                  <span class="badge ${
                    user.paymentStatus === 'pending' ? 'badge-pending' :
                    user.paymentStatus === 'accepted' ? 'badge-active' :
                    user.paymentStatus === 'rejected' ? 'badge-rejected' : 'badge-expired'
                  }">
                    ${user.paymentStatus}
                  </span>
                </td>
                <td>${formatDate(user.membershipStartDate)}</td>
                <td>${formatDate(user.membershipEndDate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
            Print Report
          </button>
          <button onclick="window.close()" style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  const renderUsersTable = (userList) => (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-[#062043] shadow-lg">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-[#111827]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Membership
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Expiration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Start Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              End Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Receipt
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700 bg-[#062043]">
          {filteredUsers.map((user) => (
            <tr key={user._id} className="transition duration-150 hover:bg-[#0d2747]">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                {user.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                {user.contactNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-slate-300">
                {user.membershipType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(user.paymentStatus)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getExpirationBadge(user)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                {formatDate(user.membershipStartDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                {formatDate(user.membershipEndDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {user.paymentReceipt ? (
                  <button
                    onClick={() => viewPaymentReceipt(user.paymentReceipt)}
                    className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded text-xs transition duration-200 border border-purple-200 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Receipt
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">No receipt</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                {user.paymentStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => openStatusModal(user, 'accept')}
                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-xs transition duration-200 border border-green-200"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => openStatusModal(user, 'reject')}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs transition duration-200 border border-red-200"
                    >
                      Reject
                    </button>
                  </>
                )}
                {(user.paymentStatus === 'accepted' || user.paymentStatus === 'expired') && (
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setStatusAction('');
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-xs transition duration-200 border border-blue-200"
                  >
                    Renew
                  </button>
                )}
                <button
                  onClick={() => openStatusModal(user, 'view')}
                  className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded text-xs transition duration-200 border border-gray-200"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredUsers.length === 0 && (
        <div className="py-8 text-center text-slate-300">
          No users found matching your search criteria.
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f2937]">
      <StoreAdminSidebar />
      <div className="min-h-screen bg-[#1f2937] p-6" style={{ marginLeft: 240 }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">User Management Dashboard</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={generateReport}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Report
          </button>
          <button
            onClick={loadDashboardData}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 rounded-lg border border-slate-700 bg-[#062043] p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, contact, or membership type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-[#0d2747] py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="text-sm text-slate-300">
            Showing {filteredUsers.length} of {
              activeTab === 'all' ? stats.total :
              activeTab === 'pending' ? stats.pending :
              activeTab === 'expiring' ? stats.expiringSoon : stats.expired
            } users
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        {[
          { key: 'total', label: 'Total Users', icon: '👥', color: 'from-blue-500 to-blue-600' },
          { key: 'pending', label: 'Pending Approval', icon: '⏳', color: 'from-yellow-500 to-yellow-600' },
          { key: 'active', label: 'Active Members', icon: '✅', color: 'from-green-500 to-green-600' },
          { key: 'expiringSoon', label: 'Expiring Soon', icon: '⚠️', color: 'from-orange-500 to-orange-600' },
          { key: 'expired', label: 'Expired', icon: '❌', color: 'from-red-500 to-red-600' }
        ].map((stat) => (
          <div key={stat.key} className="rounded-lg border border-slate-700 bg-[#062043] p-6 shadow-lg transition duration-200 hover:shadow-xl">
            <div className="flex items-center">
              <div className={`rounded-full bg-gradient-to-r ${stat.color} p-3 text-white`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-300">{stat.label}</p>
                <p className="text-2xl font-semibold text-white">{stats[stat.key]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 rounded-lg border border-slate-700 bg-[#062043] shadow-lg">
        <div className="border-b border-slate-700">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { id: 'all', name: 'All Users', count: stats.total },
              { id: 'pending', name: 'Pending Approval', count: stats.pending },
              { id: 'expiring', name: 'Expiring Soon', count: stats.expiringSoon },
              { id: 'expired', name: 'Expired', count: stats.expired }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max py-4 px-6 text-center border-b-2 font-medium text-sm transition duration-200 ${
                  activeTab === tab.id
                    ? 'border-red-600 bg-[#0d2747] text-red-500'
                    : 'border-transparent text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {tab.name} 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-red-100 text-red-800' : 'bg-slate-800 text-slate-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Users Table */}
      {renderUsersTable(filteredUsers)}

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto shadow-xl">
            <div className="p-6">
              {/* Accept Modal */}
              {statusAction === 'accept' && (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Accept User Registration</h3>
                  <p className="text-gray-600 mb-4">
                    Accept registration for <strong>{selectedUser.name}</strong>?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleStatusUpdate(selectedUser._id, 'accepted')}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-4 rounded transition duration-200"
                    >
                      Confirm Accept
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Reject Modal */}
              {statusAction === 'reject' && (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Reject User Registration</h3>
                  <p className="text-gray-600 mb-4">
                    Reject registration for <strong>{selectedUser.name}</strong>?
                  </p>
                  <textarea
                    placeholder="Reason for rejection (optional)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleStatusUpdate(selectedUser._id, 'rejected', rejectionReason)}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 px-4 rounded transition duration-200"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* View Modal */}
              {statusAction === 'view' && (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
                  <div className="space-y-3 text-sm">
                    <p><strong>Name:</strong> {selectedUser.name}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Contact:</strong> {selectedUser.contactNumber}</p>
                    <p><strong>Gender:</strong> {selectedUser.gender}</p>
                    <p><strong>Age:</strong> {selectedUser.age}</p>
                    <p><strong>Membership Type:</strong> {selectedUser.membershipType}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedUser.paymentStatus)}</p>
                    <p><strong>Start Date:</strong> {formatDate(selectedUser.membershipStartDate)}</p>
                    <p><strong>End Date:</strong> {formatDate(selectedUser.membershipEndDate)}</p>
                    {selectedUser.daysUntilExpiration && (
                      <p><strong>Days Left:</strong> {selectedUser.daysUntilExpiration}</p>
                    )}
                    {selectedUser.paymentReceipt && (
                      <div className="pt-2">
                        <button
                          onClick={() => viewPaymentReceipt(selectedUser.paymentReceipt)}
                          className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded text-sm transition duration-200 border border-purple-200 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Payment Receipt
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition duration-200"
                  >
                    Close
                  </button>
                </>
              )}

              {/* Renew Modal */}
              {!statusAction && (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Renew Membership</h3>
                  <p className="text-gray-600 mb-4">
                    Renew membership for <strong>{selectedUser.name}</strong>?
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membership Type:
                    </label>
                    <select
                      value={renewalType}
                      onChange={(e) => setRenewalType(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="3months">3 Months</option>
                      <option value="6months">6 Months</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleRenewMembership(selectedUser._id)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded transition duration-200"
                    >
                      Confirm Renew
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payment Receipt</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-80px)] overflow-auto">
              {isImageFile(selectedReceipt) ? (
                <div className="flex justify-center">
                  <img 
                    src={getReceiptUrl(selectedReceipt)} 
                    alt="Payment Receipt" 
                    className="max-w-full max-h-[70vh] rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="text-center text-gray-500 hidden">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Unable to load receipt image</p>
                    <a 
                      href={getReceiptUrl(selectedReceipt)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                    >
                      Open receipt in new tab
                    </a>
                  </div>
                </div>
              ) : isPdfFile(selectedReceipt) ? (
                <div className="text-center">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-red-800 font-medium mb-2">PDF Receipt</p>
                    <p className="text-red-600 text-sm mb-4">This receipt is in PDF format and cannot be displayed inline.</p>
                    <a 
                      href={getReceiptUrl(selectedReceipt)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200 inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open PDF Receipt
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Unknown file format</p>
                  <a 
                    href={getReceiptUrl(selectedReceipt)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                  >
                    Download receipt file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default UserManagementDashboard;
