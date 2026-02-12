import { Check, X, Eye, Search } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "../../lib/api";

interface PendingRequest {
  id: number;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: string;
  qualification_img_url?: string;
  created_at: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default function PendingUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [rejectModalRequest, setRejectModalRequest] = useState<PendingRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const queryClient = useQueryClient();

  // Fetch pending account creation requests
  const { data: requestsData = [], isLoading } = useQuery({
    queryKey: ["pending-account-requests"],
    queryFn: () => adminAPI.getAccountCreationRequests().then((res) => res.data),
  });

  // Filter only PENDING requests
  const pendingRequests = requestsData.filter((req: PendingRequest) => req.status === "PENDING");

  // Apply search filter
  const filteredRequests = pendingRequests.filter((req: PendingRequest) =>
    `${req.first_name} ${req.last_name} ${req.email}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAccept = async (requestId: number, role: string) => {
    setIsLoadingAction(true);
    try {
      if (role === "VOLUNTEER_DOCTOR") {
        await adminAPI.acceptDoctorRequest(requestId);
      } else if (role === "NUTRITIONIST") {
        await adminAPI.acceptNutritionistRequest(requestId);
      }

      await queryClient.invalidateQueries({ queryKey: ["pending-account-requests"] });
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalRequest) return;

    setIsLoadingAction(true);
    try {
      if (rejectModalRequest.role === "VOLUNTEER_DOCTOR") {
        await adminAPI.rejectDoctorRequest(rejectModalRequest.id, rejectReason);
      } else if (rejectModalRequest.role === "NUTRITIONIST") {
        await adminAPI.rejectNutritionistRequest(rejectModalRequest.id, rejectReason);
      }

      await queryClient.invalidateQueries({ queryKey: ["pending-account-requests"] });
      setRejectModalRequest(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      VOLUNTEER_DOCTOR: "Doctor",
      NUTRITIONIST: "Nutritionist",
      MERCHANT: "Merchant",
    };
    return labels[role] || role;
  };

  const getFullName = (request: PendingRequest) => {
    const parts = [request.first_name, request.middle_name, request.last_name].filter(Boolean);
    return parts.join(" ");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pending Users</h1>

        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredRequests.length} of {pendingRequests.length} pending requests
          </div>
        </div>

        {/* Pending Requests Table */}
        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Full Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Requested Date</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request: PendingRequest, index: number) => (
                  <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{getFullName(request)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{request.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        {getRoleLabel(request.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2 justify-center">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-1 hover:bg-gray-100 rounded transition"
                        title="View details"
                      >
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleAccept(request.id, request.role)}
                        disabled={isLoadingAction}
                        className="p-1 hover:bg-green-100 rounded transition disabled:opacity-50"
                        title="Accept request"
                      >
                        <Check size={18} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => setRejectModalRequest(request)}
                        disabled={isLoadingAction}
                        className="p-1 hover:bg-red-100 rounded transition disabled:opacity-50"
                        title="Reject request"
                      >
                        <X size={18} className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No pending requests found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <PendingUserDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />

      {/* Reject Reason Modal */}
      <RejectReasonModal
        request={rejectModalRequest}
        onClose={() => {
          setRejectModalRequest(null);
          setRejectReason("");
        }}
        rejectReason={rejectReason}
        onReasonChange={setRejectReason}
        isLoading={isLoadingAction}
        onConfirm={handleRejectSubmit}
      />
    </div>
  );
}

const PendingUserDetailModal = ({ request, onClose }: { request: PendingRequest | null; onClose: () => void }) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Pending Request Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-base font-medium text-gray-900">
                  {request.first_name} {request.middle_name ? request.middle_name + " " : ""}
                  {request.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium text-gray-900">{request.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-base font-medium text-gray-900">
                  {request.role === "VOLUNTEER_DOCTOR"
                    ? "Doctor"
                    : request.role === "NUTRITIONIST"
                      ? "Nutritionist"
                      : request.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Requested Date</p>
                <p className="text-base font-medium text-gray-900">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {request.qualification_img_url && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualification Document</h3>
              <img
                src={request.qualification_img_url}
                alt="Qualification"
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectReasonModal = ({
  request,
  onClose,
  rejectReason,
  onReasonChange,
  isLoading,
  onConfirm,
}: {
  request: PendingRequest | null;
  onClose: () => void;
  rejectReason: string;
  onReasonChange: (reason: string) => void;
  isLoading: boolean;
  onConfirm: () => Promise<void>;
}) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Reject Request</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Are you sure you want to reject {request.first_name} {request.last_name}'s account request?
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason (Optional)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Provide a reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:bg-red-400"
          >
            {isLoading ? "Processing..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};
