import { useState } from 'react';
import { Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

export default function ManageAccount() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Combined mock data
  const allUsers = [
    {
      id: 1,
      type: 'pregnant',
      fullName: 'Emily Tan Wei Ling',
      email: 'emily.tanwei@gmail.com',
      dateOfBirth: '03/12/1996',
      status: 'Active',
    },
    {
      id: 2,
      type: 'pregnant',
      fullName: 'Sarah Lim Hui Xuan',
      email: 'sarah.lim@yahoo.com',
      dateOfBirth: '21/07/1995',
      status: 'Active',
    },
    {
      id: 3,
      type: 'pregnant',
      fullName: 'Nur Aisyah Bin Rohim',
      email: 'nur.aisyah@gmail.com',
      dateOfBirth: '14/11/1998',
      status: 'Inactive',
    },
    {
      id: 4,
      type: 'doctor',
      fullName: 'Aisha Rahman',
      email: 'aisha.rahman@motherca.com',
      mcr: 'M9031H1',
      status: 'Approved',
    },
    {
      id: 5,
      type: 'doctor',
      fullName: 'Daniel Low',
      email: 'daniel.low@cityclinic.sg',
      mcr: 'M12035',
      status: 'Approved',
    },
    {
      id: 6,
      type: 'doctor',
      fullName: 'Melissa Ong Jia Qi',
      email: 'melissa@healthcendo.sg',
      mcr: 'M654320',
      status: 'Rejected',
    },
    {
      id: 7,
      type: 'nutritionist',
      fullName: 'Dr. Sarah Chen',
      email: 'sarah.chen@nutrition.com',
      qualification: 'RD, MS',
      status: 'Approved',
    },
    {
      id: 8,
      type: 'nutritionist',
      fullName: 'Jane Wong',
      email: 'jane.wong@healthplus.sg',
      qualification: 'RD',
      status: 'Pending',
    },
    {
      id: 9,
      type: 'admin',
      fullName: 'Admin User',
      email: 'admin@mypregnancy.com',
      role: 'Super Admin',
      status: 'Active',
    },
  ];

  // Filter users based on active filter
  const filteredByType = activeFilter === 'all' 
    ? allUsers 
    : allUsers.filter(user => user.type === activeFilter);

  // Filter by search
  const filteredUsers = filteredByType.filter(user =>
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Active':
        return 'text-green-600 bg-green-50';
      case 'Rejected':
      case 'Inactive':
        return 'text-red-600 bg-red-50';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filters = [
    { value: 'all', label: 'All Users', count: allUsers.length },
    { value: 'pregnant', label: 'Pregnant Women', count: allUsers.filter(u => u.type === 'pregnant').length },
    { value: 'doctor', label: 'Doctor', count: allUsers.filter(u => u.type === 'doctor').length },
    { value: 'nutritionist', label: 'Nutritionist', count: allUsers.filter(u => u.type === 'nutritionist').length },
    { value: 'admin', label: 'Admin', count: allUsers.filter(u => u.type === 'admin').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Accounts</h1>

        {/* Filter Tabs */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {filter.label} <span className="ml-1 text-sm opacity-75">({filter.count})</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Full Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Additional Info</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {user.type === 'pregnant' && 'Pregnant'}
                        {user.type === 'doctor' && 'Doctor'}
                        {user.type === 'nutritionist' && 'Nutritionist'}
                        {user.type === 'admin' && 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.type === 'pregnant' && user.dateOfBirth}
                      {user.type === 'doctor' && user.mcr}
                      {user.type === 'nutritionist' && user.qualification}
                      {user.type === 'admin' && user.role}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {filteredByType.length} users
        </div>
      </div>
    </div>
  );
}