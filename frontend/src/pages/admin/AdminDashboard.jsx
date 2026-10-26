import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import {
  ShieldCheckIcon, TruckIcon, CurrencyRupeeIcon,
  ExclamationCircleIcon, UsersIcon, CheckCircleIcon,
  ClockIcon, MapPinIcon, ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const customMarker = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pickups' | 'scrap' | 'complaints' | 'staff'
  const [overview, setOverview] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [scrapRequests, setScrapRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Assign staff state
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [actualKg, setActualKg] = useState('');
  const [wellSegregated, setWellSegregated] = useState(true);

  // Scrap Weigh modal state
  const [selectedScrap, setSelectedScrap] = useState(null);
  const [scrapWeights, setScrapWeights] = useState({});

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Admin access required.");
      navigate('/');
      return;
    }

    loadAdminData();
  }, [isAdmin, navigate]);

  const loadAdminData = async () => {
    try {
      const [overRes, pickRes, scrapRes, compRes, staffRes] = await Promise.all([
        api.get('/admin/overview/'),
        api.get('/collections/bookings/'),
        api.get('/scrap/requests/'),
        api.get('/complaints/'),
        api.get('/collections/staff/')
      ]);
      setOverview(overRes.data);
      setPickups(pickRes.data);
      setScrapRequests(scrapRes.data);
      setComplaints(compRes.data);
      setStaffList(staffRes.data);
      setLoading(false);
    } catch (err) {
      console.warn(err);
      setLoading(false);
    }
  };

  const handleAssignStaff = async (bookingId) => {
    if (!assignStaffId) {
      toast.error("Please select a staff member.");
      return;
    }
    try {
      await api.post(`/collections/bookings/${bookingId}/admin_update_status/`, {
        status: 'staff_assigned',
        staff_id: assignStaffId
      });
      toast.success("Staff assigned to pickup!");
      setSelectedPickup(null);
      loadAdminData();
    } catch (err) {
      toast.error("Failed to assign staff.");
    }
  };

  const handleMarkCollected = async (bookingId) => {
    try {
      await api.post(`/collections/bookings/${bookingId}/admin_update_status/`, {
        status: 'collected',
        actual_quantity_kg: actualKg ? parseFloat(actualKg) : 5.0,
        is_well_segregated: wellSegregated
      });
      toast.success("Marked collected & Green Credits awarded to customer!");
      setSelectedPickup(null);
      loadAdminData();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleWeighAndPayScrap = async (scrapId) => {
    const itemsPayload = Object.keys(scrapWeights).map(itemId => ({
      id: Number(itemId),
      actual_weight_kg: parseFloat(scrapWeights[itemId] || 0)
    }));

    try {
      await api.post(`/scrap/requests/${scrapId}/weigh_and_pay/`, {
        items: itemsPayload
      });
      toast.success("Scrap weighed, payout computed, and credited to customer wallet!");
      setSelectedScrap(null);
      loadAdminData();
    } catch (err) {
      toast.error("Weighing calculation failed.");
    }
  };

  // CSV Export for Pickups
  const exportPickupsCSV = () => {
    const headers = "Booking Number,Customer Phone,Status,Pickup Date,Quantity Kg\n";
    const rows = pickups.map(p => `"${p.booking_number}","${p.customer}","${p.status}","${p.pickup_date}","${p.actual_quantity_kg || p.estimated_quantity_kg}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CleanLoop_Pickups_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Kochi Municipal Administration Terminal</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white mt-1">
            Clean Loop Operational Dashboard
          </h1>
        </div>

        <button
          onClick={exportPickupsCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 shadow-xs"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          <span>Export Pickups CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 gap-4 overflow-x-auto text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 border-b-2 transition-all ${activeTab === 'overview' ? 'border-[#1F5D3A] text-[#1F5D3A] dark:text-emerald-400' : 'border-transparent text-stone-500'}`}
        >
          Overview & Fleet Map
        </button>
        <button
          onClick={() => setActiveTab('pickups')}
          className={`pb-3 px-1 border-b-2 transition-all ${activeTab === 'pickups' ? 'border-[#1F5D3A] text-[#1F5D3A] dark:text-emerald-400' : 'border-transparent text-stone-500'}`}
        >
          Waste Bookings ({pickups.length})
        </button>
        <button
          onClick={() => setActiveTab('scrap')}
          className={`pb-3 px-1 border-b-2 transition-all ${activeTab === 'scrap' ? 'border-[#1F5D3A] text-[#1F5D3A] dark:text-emerald-400' : 'border-transparent text-stone-500'}`}
        >
          Scrap Requests ({scrapRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`pb-3 px-1 border-b-2 transition-all ${activeTab === 'complaints' ? 'border-[#1F5D3A] text-[#1F5D3A] dark:text-emerald-400' : 'border-transparent text-stone-500'}`}
        >
          Civic Grievances ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 px-1 border-b-2 transition-all ${activeTab === 'staff' ? 'border-[#1F5D3A] text-[#1F5D3A] dark:text-emerald-400' : 'border-transparent text-stone-500'}`}
        >
          Staff & Drivers ({staffList.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & MAP */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              <span className="text-[10px] font-bold uppercase text-stone-500">Today's Pickups</span>
              <p className="text-2xl font-black text-[#1F5D3A] dark:text-emerald-400">{overview?.metrics?.todays_pickups_count || 0}</p>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              <span className="text-[10px] font-bold uppercase text-stone-500">Pending Scrap</span>
              <p className="text-2xl font-black text-[#D4A017]">{overview?.metrics?.pending_scrap_count || 0}</p>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              <span className="text-[10px] font-bold uppercase text-stone-500">Active Subs</span>
              <p className="text-2xl font-black text-teal-600">{overview?.metrics?.active_subscriptions_count || 0}</p>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              <span className="text-[10px] font-bold uppercase text-stone-500">New Grievances</span>
              <p className="text-2xl font-black text-rose-600">{overview?.metrics?.new_complaints_count || 0}</p>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              <span className="text-[10px] font-bold uppercase text-stone-500">Pending Payouts</span>
              <p className="text-2xl font-black text-amber-600">{overview?.metrics?.pending_withdrawals_count || 0}</p>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              <span className="text-[10px] font-bold uppercase text-stone-500">Total Revenue</span>
              <p className="text-2xl font-black text-emerald-600">₹{overview?.metrics?.total_revenue_inr || 0}</p>
            </div>
          </div>

          {/* Today's Pickups Map View */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Today's Doorstep Pickups Map View (Kochi)
            </h3>
            <div className="h-96 w-full rounded-3xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-xl relative z-0">
              <MapContainer
                center={[9.9816, 76.2799]}
                zoom={12}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {overview?.today_map_pickups?.map((p) => (
                  <Marker key={p.id} position={[p.latitude, p.longitude]} icon={customMarker}>
                    <Popup>
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-emerald-800">#{p.booking_number}</p>
                        <p><strong>Customer:</strong> {p.customer_name} ({p.customer_phone})</p>
                        <p><strong>Address:</strong> {p.address}</p>
                        <p><strong>Staff:</strong> {p.assigned_staff}</p>
                        <span className="font-bold text-emerald-600">{p.status}</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WASTE BOOKINGS MANAGEMENT */}
      {activeTab === 'pickups' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xl bg-white dark:bg-stone-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 uppercase text-[11px] font-black border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="py-3.5 px-6">Booking #</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Date / Window</th>
                  <th className="py-3.5 px-6">Assigned Staff</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {pickups.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50 dark:hover:bg-stone-750">
                    <td className="py-3.5 px-6 font-bold text-emerald-700 dark:text-emerald-400">
                      {b.booking_number}
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-semibold">{b.customer}</p>
                      <p className="text-[11px] text-stone-400">{b.address_details?.full_address?.slice(0, 30)}...</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-medium">{b.pickup_date}</p>
                      <p className="text-[11px] text-stone-400">{b.preferred_time_window}</p>
                    </td>
                    <td className="py-3.5 px-6 font-medium">
                      {b.assigned_staff_details ? (
                        <div>
                          <p className="font-bold">{b.assigned_staff_details.name}</p>
                          <p className="text-[10px] text-stone-500">{b.assigned_staff_details.phone}</p>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-stone-100 dark:bg-stone-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => { setSelectedPickup(b); setActualKg(b.estimated_quantity_kg); }}
                        className="px-3 py-1.5 rounded-xl bg-[#1F5D3A] text-white text-xs font-bold hover:bg-[#16472c]"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Manage Booking Modal */}
          {selectedPickup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
              <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-emerald-500/40 shadow-2xl space-y-4 bg-white dark:bg-stone-900">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base">Manage #{selectedPickup.booking_number}</h3>
                  <button onClick={() => setSelectedPickup(null)}>✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-500 mb-1">Assign Staff Member</label>
                    <select
                      value={assignStaffId}
                      onChange={(e) => setAssignStaffId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                    >
                      <option value="">Select Staff / Driver</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.vehicle_type})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignStaff(selectedPickup.id)}
                      className="mt-2 w-full py-2 rounded-xl bg-amber-500 text-stone-950 font-bold"
                    >
                      Confirm Staff Assignment
                    </button>
                  </div>

                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                    <label className="block font-bold text-stone-500">Doorstep Collection Completion</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Actual Quantity (kg)"
                      value={actualKg}
                      onChange={(e) => setActualKg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                    />
                    <label className="flex items-center gap-2 font-semibold">
                      <input
                        type="checkbox"
                        checked={wellSegregated}
                        onChange={(e) => setWellSegregated(e.target.checked)}
                      />
                      <span>Mark "Well Segregated" (+15 Green Credit Bonus)</span>
                    </label>

                    <button
                      onClick={() => handleMarkCollected(selectedPickup.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
                    >
                      Mark Collected & Award Credits
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCRAP REQUESTS & WEIGHING */}
      {activeTab === 'scrap' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-stone-200 dark:border-stone-700 shadow-xl bg-white dark:bg-stone-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 uppercase text-[11px] font-black border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="py-3.5 px-6">Request #</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Pickup Date</th>
                  <th className="py-3.5 px-6">Est. Payout</th>
                  <th className="py-3.5 px-6">Actual Payout</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {scrapRequests.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50 dark:hover:bg-stone-750">
                    <td className="py-3.5 px-6 font-bold text-amber-600">{s.request_number}</td>
                    <td className="py-3.5 px-6">{s.customer}</td>
                    <td className="py-3.5 px-6">{s.pickup_date}</td>
                    <td className="py-3.5 px-6 font-semibold">₹{s.estimated_total_payout}</td>
                    <td className="py-3.5 px-6 font-black text-emerald-600">₹{s.actual_total_payout}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-stone-100 dark:bg-stone-700">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {s.status !== 'weighed_and_paid' ? (
                        <button
                          onClick={() => {
                            setSelectedScrap(s);
                            const initialWeights = {};
                            s.items?.forEach(it => initialWeights[it.id] = it.estimated_weight_kg);
                            setScrapWeights(initialWeights);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#D4A017] text-stone-950 text-xs font-black hover:bg-amber-400"
                        >
                          Weigh & Pay
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold">✓ Credited to Wallet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Weigh & Pay Modal */}
          {selectedScrap && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
              <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-emerald-500/40 shadow-2xl space-y-4 bg-white dark:bg-stone-900">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base">Enter Digital Scales Weights (#{selectedScrap.request_number})</h3>
                  <button onClick={() => setSelectedScrap(null)}>✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  {selectedScrap.items?.map((it) => (
                    <div key={it.id} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{it.category_details?.name_en}</p>
                        <p className="text-[10px] text-stone-500">Rate locked: ₹{it.rate_per_kg_locked}/kg</p>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.1"
                          value={scrapWeights[it.id] || ''}
                          onChange={(e) => setScrapWeights({ ...scrapWeights, [it.id]: e.target.value })}
                          placeholder="Weight kg"
                          className="w-full px-2 py-1 rounded-lg border text-right font-bold"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleWeighAndPayScrap(selectedScrap.id)}
                    className="w-full py-3 rounded-2xl bg-[#1F5D3A] text-white font-bold"
                  >
                    Compute & Credit Customer Wallet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CIVIC GRIEVANCES RESOLUTION */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map((c) => (
              <div key={c.id} className="glass-card rounded-3xl p-6 border border-stone-200 dark:border-stone-700 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-600">#{c.ticket_number}</span>
                  <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700">{c.status}</span>
                </div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white">{c.category.toUpperCase()}</h4>
                <p className="text-xs text-stone-600 dark:text-stone-300">{c.description}</p>
                <p className="text-[11px] text-stone-500">📍 {c.location_address}</p>

                {c.status !== 'resolved' && (
                  <button
                    onClick={async () => {
                      await api.post(`/complaints/${c.id}/resolve_ticket/`, {
                        resolution_notes: "KMC sanitation squad cleared dumping blackspot.",
                        admin_response: "Verified and resolved by municipal team."
                      });
                      toast.success("Resolved grievance & awarded +25 Green Credits to citizen!");
                      loadAdminData();
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                  >
                    Mark Resolved & Award Citizen Credits
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STAFF & VEHICLES DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList.map((st) => (
              <div key={st.id} className="glass-card p-6 rounded-3xl border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base">{st.name}</h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{st.role}</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300">📞 {st.phone}</p>
                <p className="text-xs text-stone-600 dark:text-stone-300">🚛 {st.vehicle_type} ({st.vehicle_number || "Electric Fleet"})</p>
                <p className="text-[11px] text-stone-500">Zone: {st.service_zone_details?.name_en || "All Kochi"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
