import { useState, useEffect } from 'react';
import { invoicesAPI, analyticsAPI } from '../services/api';

export default function Dashboard({ onUploadClick }) {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, statsRes] = await Promise.all([
        invoicesAPI.getAll(),
        analyticsAPI.getSummary(),
      ]);
      setInvoices(invoicesRes.data.invoices || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.invoice_date);
    return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
  });

  const totalSpent = currentMonthInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const totalTax = currentMonthInvoices.reduce((sum, inv) => sum + parseFloat(inv.tax_amount || 0), 0);

  const StatCard = ({ title, value, subtitle }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover-lift">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <p className="text-3xl font-light text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Spending"
          value={`$${totalSpent.toFixed(0)}`}
          subtitle={`${currentMonthInvoices.length} transactions`}
        />
        <StatCard title="Taxes" value={`$${totalTax.toFixed(0)}`} subtitle="This month" />
        <StatCard title="Invoices" value={invoices.length} subtitle="All time" />
        <StatCard title="Status" value="Live" subtitle="Connected" />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 smooth-shadow">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-4">
          {currentMonthInvoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No invoices yet</p>
              <button
                onClick={onUploadClick}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium"
              >
                Upload Your First Invoice
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {currentMonthInvoices.slice(0, 6).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">
                        {invoice.vendor_name?.charAt(0) || 'I'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invoice.vendor_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(invoice.invoice_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${parseFloat(invoice.total_amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{invoice.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
