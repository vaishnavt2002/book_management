import axiosInstance from "./axiosInstance"

const authApi = {
  register: (data) => axiosInstance.post('auth/register/', data),
  requestOTP: (data) => axiosInstance.post('auth/otp/request/', data),
  verifyOTP: (data) => axiosInstance.post('auth/otp/verify/', data),
  login: (data) => axiosInstance.post('auth/login/', data),
  getProfile: () => axiosInstance.get('auth/profile/'),
  updateProfile: (data) => axiosInstance.put('auth/profile/', data),
  logOut: () => axiosInstance.post('auth/logout/'),
  forgotPassword: (data) => axiosInstance.post('auth/forgot-password/', data),
  resetPassword: (data) => axiosInstance.post('auth/forgot-password/reset/', data),
};

export default authApi