import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, ShieldCheck, QrCode, UserCheck, Search, 
  Trash2, RefreshCw, Mail, Phone, UserPlus, X,
  CheckCircle2, AlertTriangle, Download, Copy, Sparkles
} from 'lucide-react';

export const AdminUsers = () => {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  
  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'event_admin'
  });
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // View QR Pass Modal State
  const [viewingQrUser, setViewingQrUser] = useState(null);
  const [resettingQr, setResettingQr] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers();
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const res = await adminService.updateUserRole(userId, newRole);
      if (res.success) {
        toast.success(`Role updated to ${newRole.replace('_', ' ')}!`);
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot delete your own logged-in admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user account "${userName}"?`)) {
      return;
    }

    try {
      const res = await adminService.deleteUser(userId);
      if (res.success) {
        toast.success(`User "${userName}" deleted successfully.`);
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  const handleResetUserQr = async (userId) => {
    setResettingQr(true);
    try {
      const res = await adminService.resetMemberQr(userId);
      if (res.success) {
        toast.success(res.message || 'QR Pass reactivated successfully!');
        setUsers(users.map(u => u.id === userId ? { ...u, qr_status: 'active', qr_code_data: res.user?.qr_code_data } : u));
        if (viewingQrUser && viewingQrUser.id === userId) {
          setViewingQrUser({ ...viewingQrUser, qr_status: 'active', qr_code_data: res.user?.qr_code_data });
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reset QR pass.');
    } finally {
      setResettingQr(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await adminService.createUser(createForm);
      if (res.success) {
        toast.success(`Account for ${createForm.name} created with Member QR!`);
        setShowCreateModal(false);
        setCreateForm({ name: '', email: '', phone: '', password: '', role: 'event_admin' });
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create user account.');
    } finally {
      setCreating(false);
    }
  };

  // Filter users based on search & selected role
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.member_id?.toLowerCase().includes(term) ||
      u.phone?.includes(term);
    
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  // Metric counts
  const totalCount = users.length;
  const superAdminCount = users.filter(u => u.role === 'super_admin').length;
  const eventAdminCount = users.filter(u => u.role === 'event_admin').length;
  const staffCount = users.filter(u => u.role === 'scanner_staff').length;
  const guestCount = users.filter(u => u.role === 'guest').length;

  const getRoleBadgeStyle = (role) => {
    switch(role) {
      case 'super_admin':
        return 'bg-[#041124] text-[#e0f2fe] border-[#94b8d6]';
      case 'event_admin':
        return 'bg-[#0c2c52] text-[#e0f2fe] border-[#071d38]';
      case 'scanner_staff':
        return 'bg-[#071d38] text-[#e0f2fe] border-[#94b8d6]';
      default:
        return 'bg-[#020817] text-[#94b8d6] border-[#0c2c52]';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e0f2fe] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#e0f2fe]" />
            User & Member QR Pass Directory
          </h1>
          <p className="text-xs text-[#94b8d6]">
            Manage registered members, inspect individual QR passes with unique IDs, and review pass expiration states
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl bg-[#041124] text-[#94b8d6] hover:text-[#e0f2fe] border border-[#0c2c52] hover:border-[#94b8d6] transition-all cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#e0f2fe] text-[#020817] font-extrabold text-xs hover:bg-[#94b8d6] transition-all flex items-center gap-2 border border-[#e0f2fe] shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add User / Member
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div 
          onClick={() => setSelectedRole('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'all' 
              ? 'bg-[#041124] border-[#e0f2fe] shadow-md ring-1 ring-[#e0f2fe]' 
              : 'bg-[#041124]/60 border-[#0c2c52] hover:border-[#94b8d6]'
          }`}
        >
          <div className="text-[11px] font-semibold text-[#94b8d6] uppercase tracking-wider">Total Members</div>
          <div className="text-2xl font-black text-[#e0f2fe] mt-1">{totalCount}</div>
          <div className="text-[10px] text-[#94b8d6] mt-1">All accounts</div>
        </div>

        <div 
          onClick={() => setSelectedRole('super_admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'super_admin' 
              ? 'bg-[#0c2c52] border-[#e0f2fe] ring-1 ring-[#e0f2fe]' 
              : 'bg-[#041124]/60 border-[#0c2c52] hover:border-[#94b8d6]'
          }`}
        >
          <div className="text-[11px] font-semibold text-[#e0f2fe] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#e0f2fe]" /> Super Admin
          </div>
          <div className="text-2xl font-black text-[#e0f2fe] mt-1">{superAdminCount}</div>
          <div className="text-[10px] text-[#94b8d6] mt-1">Global admins</div>
        </div>

        <div 
          onClick={() => setSelectedRole('event_admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'event_admin' 
              ? 'bg-[#0c2c52] border-[#e0f2fe] ring-1 ring-[#e0f2fe]' 
              : 'bg-[#041124]/60 border-[#0c2c52] hover:border-[#94b8d6]'
          }`}
        >
          <div className="text-[11px] font-semibold text-[#e0f2fe] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#e0f2fe]" /> Organizers
          </div>
          <div className="text-2xl font-black text-[#e0f2fe] mt-1">{eventAdminCount}</div>
          <div className="text-[10px] text-[#94b8d6] mt-1">Event admins</div>
        </div>

        <div 
          onClick={() => setSelectedRole('scanner_staff')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'scanner_staff' 
              ? 'bg-[#0c2c52] border-[#e0f2fe] ring-1 ring-[#e0f2fe]' 
              : 'bg-[#041124]/60 border-[#0c2c52] hover:border-[#94b8d6]'
          }`}
        >
          <div className="text-[11px] font-semibold text-[#e0f2fe] uppercase tracking-wider flex items-center gap-1">
            <QrCode className="w-3 h-3 text-[#e0f2fe]" /> Gate Staff
          </div>
          <div className="text-2xl font-black text-[#e0f2fe] mt-1">{staffCount}</div>
          <div className="text-[10px] text-[#94b8d6] mt-1">Scanner staff</div>
        </div>

        <div 
          onClick={() => setSelectedRole('guest')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedRole === 'guest' 
              ? 'bg-[#0c2c52] border-[#e0f2fe] ring-1 ring-[#e0f2fe]' 
              : 'bg-[#041124]/60 border-[#0c2c52] hover:border-[#94b8d6]'
          }`}
        >
          <div className="text-[11px] font-semibold text-[#e0f2fe] uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-[#e0f2fe]" /> Attendees
          </div>
          <div className="text-2xl font-black text-[#e0f2fe] mt-1">{guestCount}</div>
          <div className="text-[10px] text-[#94b8d6] mt-1">Registered members</div>
        </div>
      </div>

      {/* Controls Toolbar: Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#041124]/70 p-4 rounded-2xl border border-[#0c2c52] backdrop-blur-md">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94b8d6] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member name, email, phone, or unique ID..."
            className="w-full bg-[#020817] border border-[#0c2c52] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e0f2fe] placeholder-[#94b8d6]/60 focus:outline-none focus:border-[#94b8d6] transition-colors"
          />
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'super_admin', label: 'Super Admin' },
            { id: 'event_admin', label: 'Event Admin' },
            { id: 'scanner_staff', label: 'Scanner Staff' },
            { id: 'guest', label: 'Guests' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedRole(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === tab.id
                  ? 'bg-[#e0f2fe] text-[#020817] border border-[#e0f2fe] font-bold shadow-sm'
                  : 'text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-[#0c2c52] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#041124]/85 rounded-3xl border border-[#0c2c52] overflow-hidden shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#e0f2fe] animate-spin mx-auto" />
            <p className="text-xs text-[#94b8d6]">Loading user & pass database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-12 h-12 text-[#94b8d6]/40 mx-auto" />
            <p className="text-sm text-[#e0f2fe] font-semibold">No users matching filter criteria</p>
            <p className="text-xs text-[#94b8d6]">Try adjusting your search query or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#0c2c52] bg-[#020817] text-[#94b8d6] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Member Details</th>
                  <th className="py-4 px-6">Unique ID (On QR)</th>
                  <th className="py-4 px-6">QR Pass Status</th>
                  <th className="py-4 px-6">Assigned Role</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0c2c52] bg-[#041124]/50">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isExpired = u.qr_status === 'expired';
                  const uniqueId = u.member_id || u.memberId || `MEM-${u.id?.slice(0, 8)}`;

                  return (
                    <tr key={u.id} className="hover:bg-[#0c2c52]/50 transition-colors">
                      
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#020817] font-black flex items-center justify-center text-sm shadow-md">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-[#e0f2fe] flex items-center gap-2">
                              {u.name}
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#020817] text-[#e0f2fe] border border-[#0c2c52] font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#94b8d6] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#94b8d6]" /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Unique Member ID */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-xs text-[#e0f2fe] bg-[#020817] px-2.5 py-1 rounded-lg border border-[#0c2c52]">
                          {uniqueId}
                        </span>
                      </td>

                      {/* QR Status */}
                      <td className="py-4 px-6">
                        {isExpired ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> EXPIRED (SCANNED)
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-4 px-6">
                        <select
                          value={u.role}
                          disabled={updatingId === u.id || isCurrent}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all cursor-pointer ${getRoleBadgeStyle(u.role)}`}
                        >
                          <option value="guest" className="bg-[#020817] text-[#e0f2fe]">🎟️ Guest Attendee</option>
                          <option value="scanner_staff" className="bg-[#020817] text-[#e0f2fe]">📷 Scanner Staff</option>
                          <option value="event_admin" className="bg-[#020817] text-[#e0f2fe]">🛡️ Event Admin</option>
                          <option value="super_admin" className="bg-[#020817] text-[#e0f2fe]">👑 Super Admin</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingQrUser(u)}
                            className="px-3 py-1.5 rounded-xl bg-[#e0f2fe] text-[#020817] font-bold text-xs flex items-center gap-1.5 hover:bg-[#94b8d6] transition-all cursor-pointer shadow-sm"
                            title="Inspect Member QR Pass"
                          >
                            <QrCode className="w-3.5 h-3.5" /> View Pass
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 rounded-xl text-red-400 hover:text-white hover:bg-red-950/60 border border-transparent hover:border-red-800 transition-all cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* MODAL: VIEW MEMBER QR PASS */}
      {viewingQrUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#041124] max-w-md w-full p-6 sm:p-8 rounded-3xl border border-[#0c2c52] space-y-6 animate-in fade-in zoom-in duration-200 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-[#0c2c52] pb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#e0f2fe]/20 text-[#e0f2fe]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#e0f2fe]">Member Digital Pass</h3>
                  <p className="text-[11px] text-[#94b8d6]">Single-use Admission Pass</p>
                </div>
              </div>
              <button
                onClick={() => setViewingQrUser(null)}
                className="p-1.5 rounded-xl text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-[#0c2c52] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Card */}
            <div className="bg-[#020817] p-6 rounded-2xl border border-[#0c2c52] text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-2xl border-4 border-[#94b8d6] relative shadow-xl">
                {viewingQrUser.qr_code_data ? (
                  <img
                    src={viewingQrUser.qr_code_data}
                    alt="QR Code"
                    className={`w-44 h-44 object-contain mx-auto block ${viewingQrUser.qr_status === 'expired' ? 'opacity-40 grayscale' : ''}`}
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-zinc-700">
                    <QrCode className="w-20 h-20" />
                  </div>
                )}

                {viewingQrUser.qr_status === 'expired' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-mono font-black text-xs uppercase tracking-widest border border-white rotate-[-12deg] shadow-2xl">
                      EXPIRED
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-[#94b8d6] uppercase font-bold tracking-wider block">
                  Unique Member ID (Mentioned on QR)
                </span>
                <span className="font-mono text-base font-black text-[#e0f2fe] tracking-widest">
                  {viewingQrUser.member_id || viewingQrUser.memberId || `MEM-${viewingQrUser.id?.slice(0, 8)}`}
                </span>
              </div>

              {/* Status Badge */}
              <div>
                {viewingQrUser.qr_status === 'expired' ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-black font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/50 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> EXPIRED (SCANNED BY ADMIN)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[11px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ACTIVE (READY FOR SCAN)
                  </span>
                )}
              </div>
            </div>

            {/* Member Details */}
            <div className="bg-[#020817]/70 p-4 rounded-xl border border-[#0c2c52] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#94b8d6]">Member Name:</span>
                <span className="font-bold text-[#e0f2fe]">{viewingQrUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94b8d6]">Email Address:</span>
                <span className="font-mono text-[#e0f2fe]">{viewingQrUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94b8d6]">Role:</span>
                <span className="font-bold uppercase text-[#e0f2fe]">{viewingQrUser.role}</span>
              </div>
              {viewingQrUser.qr_scanned_at && (
                <div className="flex justify-between border-t border-[#0c2c52] pt-2 text-[11px]">
                  <span className="text-rose-400">Scanned & Expired:</span>
                  <span className="font-mono text-[#e0f2fe]">{new Date(viewingQrUser.qr_scanned_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Actions: Reset QR */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#0c2c52]">
              {viewingQrUser.qr_status === 'expired' && (
                <button
                  onClick={() => handleResetUserQr(viewingQrUser.id)}
                  disabled={resettingQr}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resettingQr ? 'animate-spin' : ''}`} />
                  Reactivate / Reset QR
                </button>
              )}
              <button
                onClick={() => setViewingQrUser(null)}
                className="ml-auto px-5 py-2.5 rounded-xl bg-[#e0f2fe] text-[#020817] font-black text-xs hover:bg-[#94b8d6] cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Create User / Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#041124] max-w-md w-full p-6 sm:p-8 rounded-3xl border border-[#0c2c52] space-y-6 animate-in fade-in zoom-in duration-200 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#0c2c52] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#020817] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#e0f2fe]">Add New Member or Admin</h3>
                  <p className="text-xs text-[#94b8d6]">Auto-generates admission QR pass with unique ID</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-[#94b8d6] hover:text-[#e0f2fe] hover:bg-[#0c2c52] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#e0f2fe] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-[#020817] border border-[#0c2c52] rounded-xl px-4 py-3 text-xs text-[#e0f2fe] placeholder-[#94b8d6]/50 focus:outline-none focus:border-[#94b8d6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e0f2fe] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="alex@company.com"
                  className="w-full bg-[#020817] border border-[#0c2c52] rounded-xl px-4 py-3 text-xs text-[#e0f2fe] placeholder-[#94b8d6]/50 focus:outline-none focus:border-[#94b8d6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e0f2fe] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full bg-[#020817] border border-[#0c2c52] rounded-xl px-4 py-3 text-xs text-[#e0f2fe] placeholder-[#94b8d6]/50 focus:outline-none focus:border-[#94b8d6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e0f2fe] mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#020817] border border-[#0c2c52] rounded-xl px-4 py-3 text-xs text-[#e0f2fe] placeholder-[#94b8d6]/50 focus:outline-none focus:border-[#94b8d6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e0f2fe] mb-1">Assigned Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-[#020817] border border-[#0c2c52] rounded-xl px-4 py-3 text-xs text-[#e0f2fe] focus:outline-none focus:border-[#94b8d6]"
                >
                  <option value="guest">🎟️ Guest Attendee</option>
                  <option value="scanner_staff">📷 Gate Scanner Staff</option>
                  <option value="event_admin">🛡️ Event Admin / Organizer</option>
                  <option value="super_admin">👑 Super Admin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#94b8d6] hover:text-[#e0f2fe] bg-[#020817] border border-[#0c2c52] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-[#020817] bg-[#e0f2fe] hover:bg-[#94b8d6] transition-all border border-[#e0f2fe] disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {creating ? 'Creating Account & Pass...' : 'Create Account & Issue QR'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
