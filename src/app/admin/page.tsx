// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  threshold: number;
  source_url?: string;
  created_at?: string;
}

export default function AdminPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'toys',
    quantity: 0,
    threshold: 10,
    source_url: '',
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      showNotification('error', 'Failed to load inventory');
    }
    setLoading(false);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing item
        const { error } = await supabase
          .from('inventory')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        showNotification('success', 'Item updated successfully');
      } else {
        // Add new item
        const { error } = await supabase
          .from('inventory')
          .insert([formData]);
        
        if (error) throw error;
        showNotification('success', 'Item added successfully');
      }
      
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      showNotification('error', 'Failed to save item');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      quantity: item.quantity,
      threshold: item.threshold,
      source_url: item.source_url || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      showNotification('success', 'Item deleted successfully');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('error', 'Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'toys',
      quantity: 0,
      threshold: 10,
      source_url: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const lowStockCount = items.filter(item => item.quantity <= item.threshold).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage inventory items and monitor stock levels</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 rounded-2xl p-6 flex items-center gap-4 ${
            notification.type === 'success' ? 'bg-green-50 border-4 border-green-500' : 'bg-red-50 border-4 border-red-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
            <p className={`text-xl font-semibold ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {notification.message}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Items</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{items.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Low Stock Items</p>
            <p className="text-4xl font-bold text-yellow-600 mt-2">{lowStockCount}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Out of Stock</p>
            <p className="text-4xl font-bold text-red-600 mt-2">
              {items.filter(item => item.quantity === 0).length}
            </p>
          </div>
        </div>

        {/* Add New Item Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg flex items-center gap-3 transition-all active:scale-95 shadow-lg"
          >
            <Plus className="w-6 h-6" />
            Add New Item
          </button>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Item Name */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                  >
                    <option value="toys">Toys</option>
                    <option value="medical">Medical Supplies</option>
                    <option value="office">Office Supplies</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Current Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                  />
                </div>

                {/* Threshold */}
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Low Stock Threshold *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter item description"
                  rows={3}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                />
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Source URL (Purchase Link)
                </label>
                <input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  placeholder="https://example.com/product"
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
                >
                  <Save className="w-6 h-6" />
                  {editingId ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-xl text-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">All Items</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xl text-gray-500">No items yet. Add your first item above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Threshold</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const isLow = item.quantity <= item.threshold;
                    const isOut = item.quantity === 0;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-800">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-lg font-semibold">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.threshold}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isOut ? 'bg-red-100 text-red-700' :
                            isLow ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
