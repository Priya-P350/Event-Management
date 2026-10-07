import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const eventService = {
  getEvents: (params) => api.get('/events', { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
};

export const registrationService = {
  createRegistration: (data) => api.post('/registrations', data),
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  getRegistrationById: (id) => api.get(`/registrations/${id}`),
};

export const paymentService = {
  verifyPayment: (data) => api.post('/payments/verify', data),
};

export const ticketService = {
  getMyTickets: () => api.get('/tickets/my-tickets'),
  getTicketByToken: (token) => api.get(`/tickets/${token}`),
};

export const checkinService = {
  scanTicket: (ticketToken, eventId) => api.post('/checkin/scan', { ticketToken, eventId }),
  getEventAttendance: (eventId) => api.get(`/checkin/events/${eventId}/attendance`),
};

export const galleryService = {
  getImages: (eventId) => api.get(`/gallery/events/${eventId}/images`),
  addImage: (eventId, data) => api.post(`/gallery/events/${eventId}/images`, data),
  deleteImage: (eventId, imageId) => api.delete(`/gallery/events/${eventId}/images/${imageId}`),
};

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllRegistrations: () => api.get('/admin/registrations'),
  getAllPayments: () => api.get('/admin/payments'),
  getAllAttendance: () => api.get('/admin/attendance'),
  exportRegistrationsCSV: () => `${api.defaults.baseURL}/admin/export/registrations`,
  exportPaymentsCSV: () => `${api.defaults.baseURL}/admin/export/payments`,
  initiateRefund: (paymentId, reason) => api.post('/admin/refund', { paymentId, reason }),
};
