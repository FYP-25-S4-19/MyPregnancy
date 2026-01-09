import { Edit, Trash2, Eye, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
  mcr_no?: string;
  due_date?: string;
  date_of_birth?: string;
  created_at: string;
  is_active: boolean;
  role: string;
}

interface MappedUser extends User {
  email: string;
}


export default function ManageAccount() {
  const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({});
  const [expandedRoles, setExpandedRoles] = useState<{ [key: string]: boolean }>({});
  const [selectedUser, setSelectedUser] = useState<MappedUser | null>(null);
  const [suspendModalUser, setSuspendModalUser] = useState<MappedUser | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch data from admin endpoints
  const { data: doctorsData = [] } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => adminAPI.getAllDoctors().then(res => res.data),
  });

  const { data: mothersData = [] } = useQuery({
    queryKey: ['admin-mothers'],
    queryFn: () => adminAPI.getAllMothers().then(res => res.data),
  });

  const { data: nutritionistsData = [] } = useQuery({
    queryKey: ['admin-nutritionists'],
    queryFn: () => adminAPI.getAllNutritionists().then(res => res.data),
  });

  const { data: merchantsData = [] } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: () => adminAPI.getAllMerchants().then(res => res.data),
  });

  // Combine all users and add role property with email field
  const allUsers: MappedUser[] = [
    ...mothersData.map((user: any) => ({ 
      ...user, 
      role: 'PREGNANT_WOMAN',
      email: user.name
    })),
    ...doctorsData.map((user: any) => ({ 
      ...user, 
      role: 'VOLUNTEER_DOCTOR',
      email: user.name
    })),
    ...nutritionistsData.map((user: any) => ({ 
      ...user, 
      role: 'NUTRITIONIST',
      email: user.name
    })),
    ...merchantsData.map((user: any) => ({ 
      ...user, 
      role: 'MERCHANT',
      email: user.name
    })),
  ];

  const toggleExpandRole = (role: string) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const roleMapping: { [key: string]: { label: string; displayField: string } } = {
    'PREGNANT_WOMAN': { label: 'Pregnant Women', displayField: 'Due Date' },
    'VOLUNTEER_DOCTOR': { label: 'Doctor', displayField: 'Doctor ID' },
    'NUTRITIONIST': { label: 'Nutritionist', displayField: 'Nutritionist ID' },
    'MERCHANT': { label: 'Merchant', displayField: 'Merchant' },
  };

  const roleOrder = ['PREGNANT_WOMAN', 'VOLUNTEER_DOCTOR', 'NUTRITIONIST', 'MERCHANT'];

  const getFullName = (user: User) => {
    return user.name || 'N/A';
  };

  const getDisplayDate = (user: User, role: string) => {
    if (role === 'PREGNANT_WOMAN' && user.due_date) {
      return new Date(user.due_date).toLocaleDateString();
    }
    if (role === 'PREGNANT_WOMAN' && user.date_of_birth) {
      return new Date(user.date_of_birth).toLocaleDateString();
    }
    if (role === 'VOLUNTEER_DOCTOR' && user.mcr_no) {
      return user.mcr_no;
    }
    return '-';
  };

  const handleSuspendUnsuspend = async (userId: string, isSuspending: boolean) => {
    setIsLoadingAction(true);
    try {
      if (isSuspending) {
        await adminAPI.suspendUser(userId);
      } else {
        await adminAPI.unsuspendUser(userId);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-doctors'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-mothers'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-nutritionists'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-merchants'] }),
      ]);

      setSuspendModalUser(null);
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const UserTable = ({ users, roleInfo, role }: { users: MappedUser[]; roleInfo: any; role: string }) => {
    return (
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">No</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Full Name</th>
              {role !== 'NUTRITIONIST' && role !== 'MERCHANT' && (
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  {role === 'PREGNANT_WOMAN' ? 'Due Date' : roleInfo.displayField}
                </th>
              )}
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user: MappedUser, index: number) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-center text-gray-700">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-900">{getFullName(user)}</td>
                  {role !== 'NUTRITIONIST' && role !== 'MERCHANT' && (
                    <td className="px-6 py-4 text-sm text-center text-gray-700">{getDisplayDate(user, role)}</td>
                  )}
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.is_active ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    }`}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2 justify-center">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="p-1 hover:bg-gray-100 rounded transition">
                      <Eye size={18} className="text-gray-600" />
                    </button>
                    <button 
                      onClick={() => setSuspendModalUser(user)}
                      className="p-1 hover:bg-gray-100 rounded transition">
                      <Edit size={18} className="text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Account</h1>

        {/* User Type Sections */}
        <>
          {roleOrder.map((role) => {
            const roleInfo = roleMapping[role];
            const roleUsers = allUsers.filter((u: MappedUser) => u.role === role);
            
            // Get search query for this specific role
            const searchQuery = searchQueries[role] || '';
            
            // Filter users based on search query
            const filteredUsers = roleUsers.filter((u: MappedUser) => 
              getFullName(u).toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            const isExpanded = expandedRoles[role] || false;
            const displayUsers = isExpanded ? filteredUsers : filteredUsers.slice(0, 5);
            const totalCount = roleUsers.length;
            const filteredCount = filteredUsers.length;
            const hasMore = filteredCount > 5;

            return (
              <div key={role} className="mb-12">
                {/* Section Header with Search Bar */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{roleInfo.label}</h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQueries[role] || ''}
                        onChange={(e) => setSearchQueries(prev => ({ ...prev, [role]: e.target.value }))}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <br></br>
                    </div>
                    {hasMore && (
                      <button 
                        onClick={() => toggleExpandRole(role)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap"
                      >
                        {isExpanded ? 'Show Less' : 'View All'}
                      </button>
                    )}
                  </div>
                </div>
                    <br></br>
                {/* Users Table */}
                <UserTable users={displayUsers} roleInfo={roleInfo} role={role} />

                {/* Results Summary */}
                <div className="mt-2 text-sm text-gray-600">
                  Showing {displayUsers.length} of {filteredCount} {roleInfo.label.toLowerCase()}
                </div>
              </div>
            );
          })}
        </>
      </div>

      {/* User Detail Modal */}
      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />

      {/* Suspend/Unsuspend Modal */}
      <SuspendModal 
        user={suspendModalUser} 
        onClose={() => setSuspendModalUser(null)} 
        isLoading={isLoadingAction}
        onConfirm={handleSuspendUnsuspend}
      />
    </div>
  );
}

const UserDetailModal = ({ user, onClose }: { user: MappedUser | null; onClose: () => void }) => {
  if (!user) return null;

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'PREGNANT_WOMAN': 'Pregnant Woman',
      'VOLUNTEER_DOCTOR': 'Doctor',
      'NUTRITIONIST': 'Nutritionist',
      'MERCHANT': 'Merchant',
    };
    return labels[role] || role;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-base font-medium text-gray-900">{user.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-base font-medium text-gray-900">{getRoleLabel(user.role)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-base font-medium">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.is_active ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                  }`}>
                    {user.is_active ? 'Active' : 'Suspended'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {user.role === 'PREGNANT_WOMAN' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pregnancy Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.due_date ? new Date(user.due_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {user.role === 'VOLUNTEER_DOCTOR' && user.mcr_no && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">MCR Number</p>
                  <p className="text-base font-medium text-gray-900">{user.mcr_no}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="text-base font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SuspendModal = ({ 
  user, 
  onClose, 
  isLoading, 
  onConfirm,
}: { 
  user: MappedUser | null; 
  onClose: () => void; 
  isLoading: boolean; 
  onConfirm: (userId: string, isSuspending: boolean) => Promise<void>;
}) => {
  if (!user) return null;

  const isSuspending = user.is_active;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isSuspending ? 'Suspend Account' : 'Unsuspend Account'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {isSuspending 
              ? `Are you sure you want to suspend ${user.name}? They won't be able to login.`
              : `Are you sure you want to unsuspend ${user.name}? They will be able to login again.`
            }
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
            disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(user.id, isSuspending)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
              isSuspending 
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
            }`}>
            {isLoading ? 'Processing...' : (isSuspending ? 'Suspend' : 'Unsuspend')}
          </button>
        </div>
      </div>
    </div>
  );
};