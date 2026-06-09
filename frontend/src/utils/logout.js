// src/utils/logout.js
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
