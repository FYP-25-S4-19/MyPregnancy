import { Edit, Trash2, Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Combine all users and add role property with email field
  const allUsers: MappedUser[] = [
    ...mothersData.map((user: any) => ({ 
      ...user, 
      role: 'PREGNANT_WOMAN',
      email: user.name // Use name as email fallback for display
    })),
    ...doctorsData.map((user: any) => ({ 
      ...user, 
      role: 'VOLUNTEER_DOCTOR',
      email: user.name // Use name as email fallback for display
    })),
    ...nutritionistsData.map((user: any) => ({ 
      ...user, 
      role: 'NUTRITIONIST',
      email: user.name // Use name as email fallback for display
    })),
  ];

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
    return user.name || 'N/A';
  };

  const getDisplayDate = (user: User, role: string) => {
    if (role === 'PREGNANT_WOMAN' && user.date_of_birth) {
      return new Date(user.date_of_birth).toLocaleDateString();
    }
    if (role === 'PREGNANT_WOMAN' && user.due_date) {
      return `Due: ${new Date(user.due_date).toLocaleDateString()}`;
    }
    if (role === 'VOLUNTEER_DOCTOR' && user.mcr_no) {
      return user.mcr_no;
    }
    return '-';
  };

  const UserTable = ({ users, roleInfo, role }: { users: MappedUser[]; roleInfo: any; role: string }) => {
    return (
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">No</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Full Name</th>
              {role !== 'NUTRITIONIST' && (
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  {role === 'PREGNANT_WOMAN' ? 'Date of Birth' : roleInfo.displayField}
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
                  {role !== 'NUTRITIONIST' && (
                    <td className="px-6 py-4 text-sm text-center text-gray-700">{getDisplayDate(user, role)}</td>
                  )}
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2 justify-center">
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
    </div>
  );
}