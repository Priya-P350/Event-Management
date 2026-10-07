import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, ShieldCheck, QrCode, UserCheck, Plus, Search, 
  Trash2, RefreshCw, Mail, Phone, Calendar, UserPlus, X, Lock
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await adminService.createUser(createForm);
      if (res.success) {
        toast.success(`Account for ${createForm.name} created!`);
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

  // Filtered users calculation
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm));
    
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
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'event_admin':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'scanner_staff':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-100" />
            User & Role Management
          </h1>
          <p className="text-xs text-slate-400">
            Manage system administrators, event organizers, scanner staff, and guest attendees
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-slate-200 transition-all flex items-center gap-2 border border-white shadow-lg shadow-white/10"
          >
            <UserPlus className="w-4 h-4" />
            Add User / Admin
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div 
          onClick={() => setSelectedRole('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'all' 
              ? 'bg-slate-900 border-slate-100 shadow-md ring-1 ring-slate-100' 
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</div>
          <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">All accounts</div>
        </div>

        <div 
          onClick={() => setSelectedRole('super_admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'super_admin' 
              ? 'bg-purple-950/40 border-purple-400 ring-1 ring-purple-400' 
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Super Admin
          </div>
          <div className="text-2xl font-black text-purple-200 mt-1">{superAdminCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Global admins</div>
        </div>

        <div 
          onClick={() => setSelectedRole('event_admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'event_admin' 
              ? 'bg-blue-950/40 border-blue-400 ring-1 ring-blue-400' 
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Event Admins
          </div>
          <div className="text-2xl font-black text-blue-200 mt-1">{eventAdminCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Organizers</div>
        </div>

        <div 
          onClick={() => setSelectedRole('scanner_staff')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'scanner_staff' 
              ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400' 
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <QrCode className="w-3 h-3" /> Gate Staff
          </div>
          <div className="text-2xl font-black text-amber-200 mt-1">{staffCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">QR Scanners</div>
        </div>

        <div 
          onClick={() => setSelectedRole('guest')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedRole === 'guest' 
              ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400' 
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Attendees
          </div>
          <div className="text-2xl font-black text-emerald-200 mt-1">{guestCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Guest users</div>
        </div>
      </div>

      {/* Controls Toolbar: Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user name, email address, or phone..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-100 transition-colors"
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
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRole === tab.id
                  ? 'bg-slate-100 text-slate-950 border border-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading scalable user database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-300 font-semibold">No users matching filter criteria</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">User Details</th>
                  <th className="py-4 px-6">Contact Info</th>
                  <th className="py-4 px-6">Assigned Role</th>
                  <th className="py-4 px-6">Registrations</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {u.name}
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {u.id?.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {u.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {u.phone || 'No phone provided'}
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={updatingId === u.id || isCurrent}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all cursor-pointer ${getRoleBadgeStyle(u.role)}`}
                          >
                            <option value="guest" className="bg-slate-900 text-white">🎟️ Guest Attendee</option>
                            <option value="scanner_staff" className="bg-slate-900 text-white">📷 Scanner Staff</option>
                            <option value="event_admin" className="bg-slate-900 text-white">🛡️ Event Admin</option>
                            <option value="super_admin" className="bg-slate-900 text-white">👑 Super Admin</option>
                          </select>
                        </div>
                      </td>

                      {/* Registrations count */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px]">
                          {u.registrations_count || 0} Pass(es)
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-2 rounded-xl text-red-400 hover:text-white hover:bg-red-950/60 border border-transparent hover:border-red-800 transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create User / Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add New User or Admin</h3>
                  <p className="text-xs text-slate-400">Provision a new account with custom roles</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="alex@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-slate-100"
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
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-black bg-white hover:bg-slate-200 transition-all border border-white disabled:opacity-50"
                >
                  {creating ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
