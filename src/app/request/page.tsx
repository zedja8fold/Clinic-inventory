// src/app/request/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Send, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
}

export default function RequestPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
    }
    setLoading(false);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      showNotification('error', 'Please select an item');
      return;
    }

    setSubmitting(true);
    
    try {
      const selectedItemData = items.find(item => item.id === selectedItem);
      
      const { error } = await supabase
        .from('requests')
        .insert([
          {
            item_id: selectedItem,
            item_name: selectedItemData?.name,
            category: selectedItemData?.category,
            quantity: quantity,
            notes: notes,
            status: 'pending',
          }
        ]);
      
      if (error) throw error;
      
      showNotification('success', 'Request submitted successfully!');
      
      // Reset form
      setSelectedItem('');
      setQuantity(1);
      setNotes('');
      
      // Refresh items to get updated quantities
      fetchItems();
    } catch (error) {
      console.error('Error submitting request:', error);
      showNotification('error', 'Failed to submit request. Please try again.');
    }
    
    setSubmitting(false);
  };

  // Filter to show low stock and out of stock items
  const lowStockItems = items.filter(item => item.quantity <= item.threshold);
  const outOfStockItems = items.filter(item => item.quantity === 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Request Items</h1>
          <p className="text-gray-600 text-lg">Submit a request to restock inventory items</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 rounded-2xl p-6 flex items-center gap-4 ${
            notification.type === 'success' ? 'bg-green-50 border-4 border-green-500' : 'bg-red-50 border-4 border-red-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
            <p className={`text-xl font-semibold ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {notification.message}
            </p>
          </div>
        )}

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-red-50 border-4 border-red-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-red-800">Out of Stock</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{outOfStockItems.length} items</p>
          </div>
          
          <div className="bg-yellow-50 border-4 border-yellow-400 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-yellow-600" />
              <h3 className="text-xl font-bold text-yellow-800">Low Stock</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{lowStockItems.length} items</p>
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Submit Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Select Item *
              </label>
              <select
                required
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Choose an item...</option>
                
                {/* Out of Stock Items */}
                {outOfStockItems.length > 0 && (
                  <optgroup label="⛔ OUT OF STOCK - URGENT">
                    {outOfStockItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.category} (0 in stock)
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {/* Low Stock Items */}
                {lowStockItems.filter(item => item.quantity > 0).length > 0 && (
                  <optgroup label="⚠️ LOW STOCK">
                    {lowStockItems.filter(item => item.quantity > 0).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.category} ({item.quantity} in stock)
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {/* All Other Items */}
                {items.filter(item => item.quantity > item.threshold).length > 0 && (
                  <optgroup label="✅ IN STOCK">
                    {items
                      .filter(item => item.quantity > item.threshold)
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {item.category} ({item.quantity} in stock)
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Quantity Needed *
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information..."
                rows={4}
                className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-6 px-6 rounded-xl text-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-7 h-7" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Access Cards */}
        {lowStockItems.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Items Needing Attention</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockItems.slice(0, 6).map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-left p-6 rounded-2xl border-4 transition-all hover:scale-105 ${
                    item.quantity === 0
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg text-gray-800">{item.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.quantity === 0
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {item.quantity} left
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
