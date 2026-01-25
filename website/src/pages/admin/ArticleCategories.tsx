import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, X, Search } from 'lucide-react';
import { articleCategoriesAPI } from '../../lib/api';

interface ArticleCategory {
  id: number;
  label: string;
}

export default function ArticleCategories() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<ArticleCategory | null>(null);
  const [formValue, setFormValue] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['article-categories'],
    queryFn: () =>
      articleCategoriesAPI.getCategories().then((res) => {
        const payload = res.data as ArticleCategory[];
        return Array.isArray(payload) ? payload : [];
      }),
  });

  const resetForm = () => {
    setFormValue('');
    setEditCategory(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const handleCloseModal = () => {
    setShowCreate(false);
    setEditCategory(null);
    setFormValue('');
  };

  const createMutation = useMutation({
    mutationFn: (label: string) => articleCategoriesAPI.createCategory(label.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-categories'] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, label }: { id: number; label: string }) => {
      if (id <= 0) {
        throw new Error('Cannot edit categories without a valid database ID');
      }
      return articleCategoriesAPI.updateCategory(id, label.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-categories'] });
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      alert('Error: This category cannot be edited. Please refresh and try again.');
    },
  });

  const filtered = (data || []).filter((cat) => cat.label.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = () => {
    if (!formValue.trim()) return;
    if (editCategory) {
      updateMutation.mutate({ id: editCategory.id, label: formValue });
    } else {
      createMutation.mutate(formValue);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Article Categories</h1>
            <br></br>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Create
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">No</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center text-gray-500">No categories found</td>
                </tr>
              ) : (
                filtered.map((cat, idx) => (
                  <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-center text-gray-700">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900">{cat.label}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      {cat.id > 0 && (
                        <button
                          onClick={() => {
                            setEditCategory(cat);
                            setFormValue(cat.label);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit3 size={16} />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showCreate || editCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="e.g. Nutrition Tips"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
