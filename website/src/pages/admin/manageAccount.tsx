import { Edit, Trash2, Eye, Search } from 'lucide-react';
import { useState } from 'react';

interface User {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

export default function ManageAccount() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<{ [key: string]: boolean }>({});
  
  // TODO: Uncomment and use this API call once the backend /users endpoint is available
  // const { data: usersData, isLoading } = useQuery({
  //   queryKey: ['all-users'],
  //   queryFn: () => usersAPI.getAllUsers().then(res => res.data),
  // });
  // const allUsers = usersData || [];

  // Empty arrays - no API call (remove this line and uncomment above when API is ready)
  const allUsers: User[] = [];

  const toggleExpandRole = (role: string) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const roleMapping: { [key: string]: { label: string; displayField: string } } = {
    'PREGNANT_WOMAN': { label: 'Pregnant Women', displayField: 'Created Date' },
    'VOLUNTEER_DOCTOR': { label: 'Doctor', displayField: 'Doctor ID' },
    'NUTRITIONIST': { label: 'Nutritionist', displayField: 'Nutritionist ID' },
    'MERCHANDISE': { label: 'Merchandise', displayField: 'Merchandise ID' },
  };

  const roleOrder = ['PREGNANT_WOMAN', 'VOLUNTEER_DOCTOR', 'NUTRITIONIST', 'MERCHANDISE'];

  const getFullName = (user: User) => {
    const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
    return parts.join(' ');
  };

  const UserTable = ({ users, roleInfo, role }: { users: User[]; roleInfo: any; role: string }) => {
    return (
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Full Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                {role === 'PREGNANT_WOMAN' ? 'Date of Birth' : roleInfo.displayField}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user: User, index: number) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getFullName(user)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">-</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded transition">
                      <Eye size={18} className="text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded transition">
                      <Edit size={18} className="text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded transition">
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
            const roleUsers = allUsers.filter((u: User) => u.role === role);
            
            // Filter users based on search query
            const filteredUsers = roleUsers.filter((u: User) => 
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
                    {role === 'PREGNANT_WOMAN' && (
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
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
    </div>
  );
}