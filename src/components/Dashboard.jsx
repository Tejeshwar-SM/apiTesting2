import React, { useState, useEffect } from 'react';
import { getOrderDetails, getUpcomingSubscriptions } from '../api/api';

const Dashboard = ({ user, onLogout }) => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const details = await getOrderDetails(user.orders);
        setOrderDetails(details);
        
        const upcoming = getUpcomingSubscriptions(details);
        setUpcomingPayments(upcoming);
      } catch (err) {
        setError('Failed to load order details');
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user.orders && user.orders.length > 0) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [user.orders]);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const getAllProducts = () => {
    const allProducts = [];
    orderDetails.forEach((order, orderIndex) => {
      order.products.forEach((product, productIndex) => {
        allProducts.push({
          ...product,
          order_id: order.order_id,
          order_date: order.date,
          key: `${order.order_id}-${productIndex}`
        });
      });
    });
    return allProducts;
  };

  // New search filter function
  const getFilteredProducts = () => {
    const allProducts = getAllProducts();
    
    if (!searchTerm.trim()) {
      return allProducts;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return allProducts.filter(product => {
      // Search by product name
      const nameMatch = product.name.toLowerCase().includes(searchLower);
      
      // Search by formatted date (e.g., "Jun 5, 2025")
      const formattedDate = formatDate(product.order_date).toLowerCase();
      const dateMatch = formattedDate.includes(searchLower);
      
      // Search by raw date (e.g., "2025-06-05")
      const rawDateMatch = product.order_date.toLowerCase().includes(searchLower);
      
      return nameMatch || dateMatch || rawDateMatch;
    });
  };

  const getNextPaymentDate = () => {
    if (upcomingPayments.length === 0) return null;
    
    const nextPayment = upcomingPayments[0];
    const paymentDate = new Date(nextPayment.date);
    const today = new Date();
    const diffTime = paymentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      ...nextPayment,
      daysUntil: diffDays
    };
  };

  const nextPayment = getNextPaymentDate();
  const filteredProducts = getFilteredProducts();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage your orders and subscriptions
              </p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{user.order_count}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Customer ID</h3>
              <p className="text-xl font-semibold text-gray-900 mt-2">{user.customer_id}</p>
            </div>

            {nextPayment && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg shadow-sm border border-orange-200">
                <h3 className="text-sm font-medium text-orange-800">Next Payment</h3>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {nextPayment.daysUntil} days
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {formatDate(nextPayment.date)} - {formatPrice(nextPayment.amount)}
                </p>
                {nextPayment.is_trial && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-orange-200 text-orange-800 rounded">
                    Trial Period
                  </span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Orders Table with Search */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
              
              {/* Search Bar - Positioned on the right */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by product name or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-150 w-80"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Search Results Info */}
            {searchTerm && (
              <div className="px-6 py-2 bg-blue-50 border-b border-blue-200">
                <p className="text-sm text-blue-700">
                  Found {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchTerm}"
                  {filteredProducts.length > 0 && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear search
                    </button>
                  )}
                </p>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product, index) => (
                      <tr key={product.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">Order #{product.order_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(product.order_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            product.is_recurring
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {product.order_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">
                  {searchTerm ? 'No orders found matching your search.' : 'No order details available'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear search to see all orders
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
