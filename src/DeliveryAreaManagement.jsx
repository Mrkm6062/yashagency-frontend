import React, { useState, useEffect } from 'react';
import { makeSecureRequest } from './csrf.js';
import { getToken } from './storage.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function DeliveryAreaManagement({ deliveryAreas, fetchData }) {
  const [filter, setFilter] = useState({ state: '', district: '' });
  const [pincodeSearch, setPincodeSearch] = useState('');
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchPincodes = async () => {
    if (!filter.state && !filter.district && !pincodeSearch) {
      alert('Please select a state/district or enter a pincode to search.');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ state: filter.state, district: filter.district, pincode: pincodeSearch });
      const response = await fetch(`${API_BASE}/api/admin/pincodes/search?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setPincodes(data);
    } catch (error) {
      alert('Failed to fetch pincodes.');
    }
    setLoading(false);
  };

  const togglePincode = async (pincode, enabled) => {
    try {
      await makeSecureRequest(`${API_BASE}/api/admin/pincodes/${pincode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverable: !enabled })
      });
      await searchPincodes(); // Re-run the search to get updated data
    } catch (error) {
      alert('Failed to update pincode status.');
    }
  };

  const handleBulkPincodeToggle = async (scope, deliverable) => {
    const target = scope === 'district' ? filter.district : filter.state;
    if (!target) {
        alert(`Please select a ${scope} to perform this action.`);
        return;
    }
    if (!window.confirm(`Are you sure you want to ${deliverable ? 'ENABLE' : 'DISABLE'} all pincodes for ${target}?`)) return;

    try {
      await makeSecureRequest(`${API_BASE}/api/admin/delivery-areas/bulk-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateName: filter.state, districtName: scope === 'district' ? filter.district : undefined, deliverable })
      });
      fetchData(); // Refetch all admin data to see the changes
      alert(`Pincodes for ${target} have been updated.`);
    } catch (error) {
      alert(`Failed to update pincodes for ${target}.`);
    }
  };

  const stateDistrictMap = deliveryAreas.stateDistrictMap || [];
  const uniqueStates = stateDistrictMap.map(item => item.stateName);
  const uniqueDistricts = filter.state ? stateDistrictMap.find(s => s.stateName === filter.state)?.districts || [] : [];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Delivery Area Management</h3>
      <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <select value={filter.state} onChange={e => setFilter({ ...filter, state: e.target.value, district: '' })} className="px-3 py-2 border rounded"><option value="">All States</option>{uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}</select>
        <select value={filter.district} onChange={e => setFilter({ ...filter, district: e.target.value })} className="px-3 py-2 border rounded" disabled={!filter.state}><option value="">All Districts</option>{uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}</select>
        <input type="text" placeholder="Search Pincode..." value={pincodeSearch} onChange={e => setPincodeSearch(e.target.value)} className="px-3 py-2 border rounded" />
        <button onClick={searchPincodes} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Search</button>
      </div>

      {(filter.state || filter.district) && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-900 mb-3">Bulk Actions for: <span className="font-bold">{filter.district || filter.state}</span></h4>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleBulkPincodeToggle(filter.district ? 'district' : 'state', true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Enable All</button>
            <button onClick={() => handleBulkPincodeToggle(filter.district ? 'district' : 'state', false)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Disable All</button>
          </div>
        </div>
      )}

      {/* Responsive Pincode List */}
      <div>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {pincodes.map(pincode => (
            <div key={pincode._id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg">{pincode.pincode}</p>
                  <p className="text-sm text-gray-600 truncate">{pincode.officeName}</p>
                </div>
                <button
                  onClick={() => togglePincode(pincode.pincode, pincode.deliverable)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${pincode.deliverable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {pincode.deliverable ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                {pincode.districtName}, {pincode.stateName}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto bg-white border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-sm font-medium">Pincode</th><th className="px-4 py-3 text-left text-sm font-medium">Office Name</th><th className="px-4 py-3 text-left text-sm font-medium">District</th><th className="px-4 py-3 text-left text-sm font-medium">State</th><th className="px-4 py-3 text-left text-sm font-medium">Status</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {pincodes.map(pincode => (
                <tr key={pincode._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{pincode.pincode}</td>
                  <td className="px-4 py-3 text-sm">{pincode.officeName}</td>
                  <td className="px-4 py-3 text-sm">{pincode.districtName}</td>
                  <td className="px-4 py-3 text-sm">{pincode.stateName}</td>
                  <td className="px-4 py-3 text-sm"><button onClick={() => togglePincode(pincode.pincode, pincode.deliverable)} className={`px-3 py-1 rounded text-xs ${pincode.deliverable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{pincode.deliverable ? 'Enabled' : 'Disabled'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <p className="p-4 text-center">Loading...</p>}
        {!loading && searched && pincodes.length === 0 && <p className="p-4 text-center">No pincodes found.</p>}
      </div>
    </div>
  );
}

export default DeliveryAreaManagement;