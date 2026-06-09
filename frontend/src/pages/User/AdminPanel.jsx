import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8088/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      toast.error('Error fetching users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.contactNumber.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.paymentStatus === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const updatePaymentStatus = async (userId, status, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8088/api/users/payment-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          status,
          reason
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User ${status} successfully!`);
        fetchUsers(); // Refresh the list
        setShowModal(false);
        setRejectionReason('');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Error updating status: ' + error.message);
    }
  };

  const handleApprove = (user) => {
    if (window.confirm(`Are you sure you want to approve ${user.name}'s registration?`)) {
      updatePaymentStatus(user._id, 'accepted');
    }
  };

  const handleReject = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirmRejection = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    updatePaymentStatus(selectedUser._id, 'rejected', rejectionReason);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      accepted: { color: 'bg-green-500', text: 'Approved' },
      rejected: { color: 'bg-red-500', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getMembershipBadge = (type) => {
    const typeConfig = {
      monthly: { color: 'bg-blue-500', text: 'Monthly' },
      '3months': { color: 'bg-purple-500', text: '3 Months' },
      '6months': { color: 'bg-indigo-500', text: '6 Months' },
      annual: { color: 'bg-teal-500', text: 'Annual' }
    };

    const config = typeConfig[type] || typeConfig.monthly;
    return (
      <span className={`px-2 py-1 rounded text-white text-xs ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const printReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SUPREME FITNESS - User Registrations Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #dc2626; margin: 0; }
          .header h2 { color: #333; margin: 5px 0 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-accepted { background-color: #d1fae5; color: #065f46; }
          .status-rejected { background-color: #fee2e2; color: #991b1b; }
          .summary { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 5px; }
          .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SUPREME FITNESS</h1>
          <h2>User Registrations Report</h2>
          <div>Generated on: ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="summary">
          <strong>Summary:</strong><br>
          Total Users: ${users.length}<br>
          Pending: ${users.filter(u => u.paymentStatus === 'pending').length}<br>
          Approved: ${users.filter(u => u.paymentStatus === 'accepted').length}<br>
          Rejected: ${users.filter(u => u.paymentStatus === 'rejected').length}
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Membership</th>
              <th>Status</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(user => `
              <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.contactNumber}</td>
                <td>${user.membershipType}</td>
                <td class="status-${user.paymentStatus}">${user.paymentStatus}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>SUPREME FITNESS Gym Management System</p>
          <p>Generated by Admin Panel</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Contact', 'Gender', 'Age', 'Membership', 'Status', 'Registration Date'];
    const csvData = filteredUsers.map(user => [
      user.name,
      user.email,
      user.contactNumber,
      user.gender,
      user.age,
      user.membershipType,
      user.paymentStatus,
      new Date(user.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supreme-fitness-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            SUPREME <span className="text-red-600">FITNESS</span> Admin Panel
          </h1>
          <p className="text-gray-400">Manage user registrations and approvals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-gray-400">Total Users</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-yellow-500">
              {users.filter(u => u.paymentStatus === 'pending').length}
            </div>
            <div className="text-gray-400">Pending Approval</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-500">
              {users.filter(u => u.paymentStatus === 'accepted').length}
            </div>
            <div className="text-gray-400">Approved</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-red-500">
              {users.filter(u => u.paymentStatus === 'rejected').length}
            </div>
            <div className="text-gray-400">Rejected</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={printReport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                📄 Print Report
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                📊 Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Membership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{user.contactNumber}</div>
                        <div className="text-sm text-gray-400 capitalize">{user.gender}, {user.age} yrs</div>
                      </td>
                      <td className="px-6 py-4">
                        {getMembershipBadge(user.membershipType)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {user.paymentStatus === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(user)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {user.paymentStatus !== 'pending' && (
                          <span className="text-gray-400 text-sm">No actions available</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">
              Reject Registration - {selectedUser?.name}
            </h3>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Reason for Rejection</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                rows="4"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejection}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default AdminPanel;