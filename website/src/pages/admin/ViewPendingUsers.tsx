import { useState, useEffect } from 'react';
import { Eye, Check, X } from 'lucide-react';
import { accountRequestsAPI } from '../../lib/api';

interface PendingUser {
  request_id: number;
  user_role: 'VOLUNTEER_DOCTOR' | 'NUTRITIONIST';
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  qualification_img_url: string;
  account_status: string;
  reject_reason?: string;
  submitted_at: string;
  mcr_no?: string;
  specialisation?: string;
}

export default function ViewPendingUsers() {
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'accept' | 'reject'; id: number } | null>(null);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'VOLUNTEER_DOCTOR' | 'NUTRITIONIST'>('ALL');
  const [pendingRequests, setPendingRequests] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data directly without React Query caching
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await accountRequestsAPI.getAccountCreationRequests();
      // Remove duplicates by email to ensure unique records
      const uniqueRequests = Array.from(
        new Map(response.data.map((item: PendingUser) => [item.email, item])).values()
      ) as PendingUser[];
      setPendingRequests(uniqueRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to fetch pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchRequests();
  }, [roleFilter]);

  const filteredRequests = roleFilter === 'ALL' 
    ? pendingRequests 
    : pendingRequests.filter((user: PendingUser) => {
        const userRole = String(user.user_role).trim();
        return userRole === roleFilter;
      });

  const getFullName = (user: PendingUser) => {
    const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
    return parts.join(' ');
  };

  const getRoleLabel = (role: string) => {
    return role === 'VOLUNTEER_DOCTOR' ? 'Doctor' : 'Nutritionist';
  };

  const handleAccept = async (requestId: number, role: string) => {
    try {
      setPendingAction({ type: 'accept', id: requestId });
      if (role === 'VOLUNTEER_DOCTOR') {
        await accountRequestsAPI.acceptDoctorRequest(requestId);
      } else {
        await accountRequestsAPI.acceptNutritionistRequest(requestId);
      }
      setSelectedUser(null);
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Unable to accept, please try again');
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async (requestId: number, role: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      setPendingAction({ type: 'reject', id: requestId });
      if (role === 'VOLUNTEER_DOCTOR') {
        await accountRequestsAPI.rejectDoctorRequest(requestId, rejectReason);
      } else {
        await accountRequestsAPI.rejectNutritionistRequest(requestId, rejectReason);
      }
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedUser(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500">Loading pending requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">View Pending Users</h1>

        {/* Filter Section */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Role</label>
          <div className="flex gap-3">
            {[
              { value: 'ALL', label: 'All Roles' },
              { value: 'VOLUNTEER_DOCTOR', label: 'Doctor' },
              { value: 'NUTRITIONIST', label: 'Nutritionist' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setRoleFilter(option.value as 'ALL' | 'VOLUNTEER_DOCTOR' | 'NUTRITIONIST')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  roleFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No pending user requests at this time</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">No</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Full Name</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Submitted Date</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((user: PendingUser, index: number) => (
                    <tr key={user.request_id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-center text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900">{getFullName(user)}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {getRoleLabel(user.user_role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-700">
                        {new Date(user.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.account_status === 'PENDING' 
                            ? 'bg-yellow-50 text-yellow-700'
                            : user.account_status === 'APPROVED'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {user.account_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1 hover:bg-gray-100 rounded transition"
                            title="View"
                          >
                            <Eye size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleAccept(user.request_id, user.user_role)}
                            disabled={pendingAction !== null}
                            className="p-1 hover:bg-green-50 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Accept"
                          >
                            <Check size={18} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRejectModal(true);
                              setRejectReason('');
                            }}
                            disabled={pendingAction !== null}
                            className="p-1 hover:bg-red-50 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Decline"
                          >
                            <X size={18} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Showing {filteredRequests.length} pending user{filteredRequests.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{getFullName(selectedUser)}</h2>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <p className="text-gray-900">{selectedUser.first_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <p className="text-gray-900">{selectedUser.last_name}</p>
                  </div>
                  {selectedUser.middle_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                      <p className="text-gray-900">{selectedUser.middle_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <p className="text-gray-900">{getRoleLabel(selectedUser.user_role)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <p className="text-gray-900 capitalize">{selectedUser.account_status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Submitted Date</label>
                    <p className="text-gray-900">{new Date(selectedUser.submitted_at).toLocaleDateString()}</p>
                  </div>
                  {selectedUser.user_role === 'VOLUNTEER_DOCTOR' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">MCR Number</label>
                      <p className="text-gray-900">{selectedUser.mcr_no}</p>
                    </div>
                  )}
                </div>

                {/* Qualification Image */}
                {selectedUser.qualification_img_url && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Qualification Document</label>
                    <img
                      src={selectedUser.qualification_img_url}
                      alt="Qualification"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedUser.reject_reason && (
                  <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <label className="block text-sm font-medium text-red-900 mb-2">Rejection Reason</label>
                    <p className="text-red-800">{selectedUser.reject_reason}</p>
                  </div>
                )}

                {/* Reject Modal Form */}
                {showRejectModal && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this request is being rejected..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-900 hover:bg-gray-300 rounded-lg transition font-medium"
                >
                  Close
                </button>
                {!showRejectModal && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={pendingAction !== null}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={18} />
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(selectedUser.request_id, selectedUser.user_role)}
                      disabled={pendingAction !== null}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check size={18} />
                      Accept
                    </button>
                  </>
                )}
                {showRejectModal && (
                  <>
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectReason('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-900 hover:bg-gray-300 rounded-lg transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(selectedUser.request_id, selectedUser.user_role)}
                      disabled={pendingAction !== null}
                      className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Rejection
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
