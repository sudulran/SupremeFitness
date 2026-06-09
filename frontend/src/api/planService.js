import axiosInstance from './axiosInstance';

export const fetchUsersForPlans = () => axiosInstance.get('/users');

export const fetchExercises = (params = {}) =>
  axiosInstance.get('/exercises', { params: { limit: 200, ...params } });

export const fetchFoods = (params = {}) =>
  axiosInstance.get('/foods', { params: { limit: 200, ...params } });

export const fetchWorkoutPlans = (params = {}) =>
  axiosInstance.get('/workout-plans', { params });

export const fetchWorkoutPlanById = (id) =>
  axiosInstance.get(`/workout-plans/${id}`);

export const createWorkoutPlan = (payload) =>
  axiosInstance.post('/workout-plans', payload);

export const updateWorkoutPlan = (id, payload) =>
  axiosInstance.put(`/workout-plans/${id}`, payload);

export const deleteWorkoutPlan = (id) =>
  axiosInstance.delete(`/workout-plans/${id}`);

export const fetchMealPlans = (params = {}) =>
  axiosInstance.get('/meal-plans', { params });

export const fetchMealPlanById = (id) =>
  axiosInstance.get(`/meal-plans/${id}`);

export const createMealPlan = (payload) =>
  axiosInstance.post('/meal-plans', payload);

export const updateMealPlan = (id, payload) =>
  axiosInstance.put(`/meal-plans/${id}`, payload);

export const deleteMealPlan = (id) =>
  axiosInstance.delete(`/meal-plans/${id}`);
