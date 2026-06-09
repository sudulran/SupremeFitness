import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, Flame, Calendar, Award, Download, Plus, Weight, Ruler } from 'lucide-react';
import { fetchExercises } from '../api/planService';
import CustomSelect from '../components/CustomSelect';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axiosInstance from '../api/axiosInstance';

const ProgressDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCaloriesBurned: 0,
    totalWorkoutTime: 0,
    currentStreak: 0,
    longestStreak: 0
  });
  const [weightData, setWeightData] = useState([]);
  const [caloriesData, setCaloriesData] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showMetricsForm, setShowMetricsForm] = useState(false);

  // Workout Form State
  const [workoutForm, setWorkoutForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: '',
    exercises: [],
    exerciseId: '',
    notes: ''
  });
  const [exerciseError, setExerciseError] = useState('');

  // Body Metrics Form State
  const [metricsForm, setMetricsForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    bodyFat: '',
    muscleMass: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: ''
    }
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    if (userData) {
      fetchProgressData(userData.id);
    }
    // load available exercises for the workout form
    const loadExercises = async () => {
      try {
        const res = await fetchExercises({ limit: 200 });
        setExercisesList(res.data?.data || res.data || []);
        // also attempt to load the user's active workout plan so we can filter exercises
        try {
          const planRes = await axiosInstance.get(`/workout-plans/user/${userData.id}/active`);
          if (planRes.data?.success && planRes.data.data) {
            const allowedIds = (planRes.data.data.exercises || []).map(e => (e.exercise?._id || e.exercise));
            // filter exercises to only those in the active plan
            const all = (res.data?.data || res.data || []);
            const filtered = all.filter(ex => allowedIds.includes(ex._id || ex.id));
            setExercisesList(filtered);
          }
        } catch (err) {
          // if fetching plan fails, keep the full exercises list
          console.debug('Could not load user active workout plan to filter exercises', err?.message || err);
        }
      } catch (err) {
        console.error('Failed to load exercises for form', err);
      }
    };
    loadExercises();
  }, []);

  const [exercisesList, setExercisesList] = useState([]);

  const fetchProgressData = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch stats
      const statsRes = await axiosInstance.get(`/progress/${userId}/stats`);
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // Fetch body metrics
      const metricsRes = await axiosInstance.get(`/progress/${userId}/body-metrics`);
      if (metricsRes.data.success) {
        const formattedData = metricsRes.data.data.slice(0, 10).reverse().map(m => ({
          date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: m.weight,
          bmi: m.bmi
        }));
        setWeightData(formattedData);
      }

      // Fetch workout history
      const historyRes = await axiosInstance.get(`/progress/${userId}/workout-history`, { params: { limit: 7 } });
      if (historyRes.data.success) {
        // server should populate exercises.exercise; but if it doesn't, leave raw ids and we'll resolve when rendering
        setRecentWorkouts(historyRes.data.data);
        const formattedCalories = historyRes.data.data.map(w => ({
          day: new Date(w.date).toLocaleDateString('en-US', { weekday: 'short' }),
          calories: w.caloriesBurned
        }));
        setCaloriesData(formattedCalories.reverse());
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format minutes to 'Xh Ym' (e.g. '1h 30m')
  const formatMinutesToHoursMinutes = (totalMinutes) => {
    const mins = Number(totalMinutes) || 0;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  // Helper to resolve exercise name and metValue: prefer populated object, fallback to lookup in exercisesList
  const resolveExerciseInfo = (exerciseEntry) => {
    if (!exerciseEntry) return { name: 'Exercise', metValue: null };
    // If populated object
    if (typeof exerciseEntry.exercise === 'object') {
      const exObj = exerciseEntry.exercise;
      return { name: exObj.name || exObj.title || 'Exercise', metValue: exObj.metValue || null };
    }
    // If it's an id/string, fallback to local lookup
    const id = exerciseEntry.exercise || exerciseEntry;
    const found = exercisesList.find(e => (e._id || e.id) === id);
    if (found) return { name: found.name || found.title || 'Exercise', metValue: found.metValue || null };
    return { name: 'Exercise', metValue: null };
  };

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    // validate required fields
    if (!workoutForm.exerciseId) {
      setExerciseError('Please select an exercise');
      return;
    }

    try {
      // If the user selected a single exercise, send it in the exercises array expected by the backend
      const payload = { ...workoutForm };
      if (workoutForm.exerciseId) {
        payload.exercises = [{ exercise: workoutForm.exerciseId, durationCompleted: Number(workoutForm.duration) || 0 }];
      }

      const response = await axiosInstance.post('/progress/workout-session', payload);

      if (response.data.success) {
        alert('Workout logged successfully!');
        setShowWorkoutForm(false);
        setWorkoutForm({
          date: new Date().toISOString().split('T')[0],
          duration: '',
            exercises: [],
            exerciseId: '',
            notes: ''
        });
        fetchProgressData(user.id);
      }
    } catch (error) {
      alert('Failed to log workout');
    }
  };

  const handleLogMetrics = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/progress/body-metrics', metricsForm);

      if (response.data.success) {
        alert('Metrics logged successfully!');
        setShowMetricsForm(false);
        setMetricsForm({
          date: new Date().toISOString().split('T')[0],
          weight: '',
          height: '',
          bodyFat: '',
          muscleMass: '',
          measurements: { chest: '', waist: '', hips: '', arms: '', thighs: '' }
        });
        fetchProgressData(user.id);
      }
    } catch (error) {
      alert('Failed to log metrics');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(`/progress/${user.id}/report`, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `progress-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">Loading progress data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 via-[#071827] to-[#0b2430] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Progress Dashboard</h1>
            <p className="text-gray-400 text-sm">Track your fitness journey and achievements</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowWorkoutForm(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Log Workout
            </button>
            <button
              onClick={() => setShowMetricsForm(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              <Weight className="w-4 h-4" />
              Log Metrics
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition text-sm font-medium border border-blue-700"
            >
              <Download className="w-4 h-4" />
              Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="rounded-lg shadow-lg p-4 border border-white/6 hover:border-red-600 transition-all hover:scale-105 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Workouts</p>
                <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
              </div>
              <Activity className="w-8 h-8 text-red-600 opacity-80" />
            </div>
          </div>
          <div className="rounded-lg shadow-lg p-4 border border-white/6 hover:border-red-600 transition-all hover:scale-105 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Calories</p>
                <p className="text-2xl font-bold text-white">{stats.totalCaloriesBurned?.toLocaleString() || 0}</p>
              </div>
              <Flame className="w-8 h-8 text-red-600 opacity-80" />
            </div>
          </div>
          <div className="rounded-lg shadow-lg p-4 border border-white/6 hover:border-red-600 transition-all hover:scale-105 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Workout Time</p>
                <p className="text-2xl font-bold text-white">{formatMinutesToHoursMinutes(stats.totalWorkoutTime || 0)}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600 opacity-80" />
            </div>
          </div>
          <div className="rounded-lg shadow-lg p-4 border border-white/6 hover:border-red-600 transition-all hover:scale-105 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-white">{stats.currentStreak} days</p>
              </div>
              <Award className="w-8 h-8 text-red-600 opacity-80" />
            </div>
          </div>
          <div className="rounded-lg shadow-lg p-4 border border-white/6 hover:border-red-600 transition-all hover:scale-105 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Best Streak</p>
                <p className="text-2xl font-bold text-white">{stats.longestStreak} days</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600 opacity-80" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weight Progress Chart */}
          <div className="rounded-lg shadow-lg p-6 border border-white/6 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Weight & BMI Progress
            </h2>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="left" stroke="#dc2626" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e3a8a', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#dc2626" 
                    strokeWidth={2}
                    dot={{ fill: '#dc2626', r: 4 }}
                    name="Weight (kg)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="bmi" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="BMI"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No weight data available</p>
              </div>
            )}
          </div>

          {/* Calories Burned Chart */}
          <div className="rounded-lg shadow-lg p-6 border border-white/6 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              Weekly Calories Burned
            </h2>
            {caloriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={caloriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                  <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e3a8a', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar 
                    dataKey="calories" 
                    fill="#dc2626" 
                    radius={[6, 6, 0, 0]}
                    name="Calories"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No workout data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="rounded-lg shadow-lg p-6 border border-white/6 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430] mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            Recent Workouts
          </h2>
          <div className="overflow-x-auto">
            {recentWorkouts.length > 0 ? (
              <table className="w-full">
                <thead className="bg-black border-b border-blue-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Exercise</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Calories</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-800">
                  {recentWorkouts.map((workout, index) => (
                    <tr key={index} className="hover:bg-blue-800 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{new Date(workout.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-white">
                        {workout.firstExerciseName ? (
                          <>
                            <div>{workout.firstExerciseName}</div>
                            {workout.firstExerciseMet ? <div className="text-xs text-white/60">MET: {workout.firstExerciseMet}</div> : null}
                          </>
                        ) : (workout.exercises && workout.exercises.length > 0 ? (
                          (() => {
                            const info = resolveExerciseInfo(workout.exercises[0]);
                            return (
                              <>
                                <div>{info.name}</div>
                                {info.metValue ? <div className="text-xs text-white/60">MET: {info.metValue}</div> : null}
                              </>
                            );
                          })()
                        ) : '-')}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{workout.duration} mins</td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">{workout.caloriesBurned} kcal</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{workout.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-center py-8 text-sm">No workouts logged yet</p>
            )}
          </div>
        </div>

        {/* Workout Form Modal */}
        {showWorkoutForm && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="mt-12 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430] rounded-lg shadow-2xl w-full max-w-3xl border border-white/6 overflow-hidden text-white">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                <h3 className="text-xl font-bold text-white">Log Workout Session</h3>
                <button onClick={() => setShowWorkoutForm(false)} className="text-gray-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <form onSubmit={handleLogWorkout} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={workoutForm.date}
                        onChange={(e) => setWorkoutForm({...workoutForm, date: e.target.value})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={workoutForm.duration}
                        onChange={(e) => setWorkoutForm({...workoutForm, duration: e.target.value})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/80 font-medium mb-2">Exercise</label>
                      <CustomSelect
                        options={exercisesList.map((ex) => ({ value: ex._id || ex.id, label: ex.name || ex.title || 'Exercise' }))}
                        value={workoutForm.exerciseId}
                        onChange={(val) => { setWorkoutForm({ ...workoutForm, exerciseId: val }); setExerciseError(''); }}
                        placeholder="-- Select exercise --"
                        buttonClassName="w-full rounded border border-white/10 px-3 py-2 text-left text-white text-sm focus:outline-none bg-black/20"
                        buttonStyle={{}}
                        className=""
                      />
                      {exerciseError && <p className="mt-2 text-sm text-red-400">{exerciseError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white/80 font-medium mb-2">Notes (Optional)</label>
                    <textarea
                      value={workoutForm.notes}
                      onChange={(e) => setWorkoutForm({...workoutForm, notes: e.target.value})}
                      className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="4"
                      placeholder="How was your workout?"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWorkoutForm(false)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500"
                    >
                      Log Workout
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Form Modal */}
        {showMetricsForm && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="mt-12 bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430] rounded-lg shadow-2xl w-full max-w-3xl border border-white/6 overflow-hidden max-h-[96vh] text-white">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                <h3 className="text-xl font-bold text-white">Log Body Metrics</h3>
                <button onClick={() => setShowMetricsForm(false)} className="text-gray-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto pb-8">
                <form onSubmit={handleLogMetrics} className="space-y-4 pb-6">
                  <div>
                    <label className="block text-sm text-white/80 font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={metricsForm.date}
                      onChange={(e) => setMetricsForm({...metricsForm, date: e.target.value})}
                      className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={metricsForm.weight}
                        onChange={(e) => setMetricsForm({...metricsForm, weight: e.target.value})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={metricsForm.height}
                        onChange={(e) => setMetricsForm({...metricsForm, height: e.target.value})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Body Fat %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={metricsForm.bodyFat}
                        onChange={(e) => setMetricsForm({...metricsForm, bodyFat: e.target.value})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Muscle Mass (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={metricsForm.muscleMass}
                        onChange={(e) => setMetricsForm({...metricsForm, muscleMass: e.target.value})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Chest (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={metricsForm.measurements.chest}
                        onChange={(e) => setMetricsForm({...metricsForm, measurements: {...metricsForm.measurements, chest: e.target.value}})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Waist (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={metricsForm.measurements.waist}
                        onChange={(e) => setMetricsForm({...metricsForm, measurements: {...metricsForm.measurements, waist: e.target.value}})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Hips (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={metricsForm.measurements.hips}
                        onChange={(e) => setMetricsForm({...metricsForm, measurements: {...metricsForm.measurements, hips: e.target.value}})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 font-medium mb-2">Arms (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={metricsForm.measurements.arms}
                        onChange={(e) => setMetricsForm({...metricsForm, measurements: {...metricsForm.measurements, arms: e.target.value}})}
                        className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 font-medium mb-2">Thighs (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={metricsForm.measurements.thighs}
                      onChange={(e) => setMetricsForm({...metricsForm, measurements: {...metricsForm.measurements, thighs: e.target.value}})}
                      className="w-full bg-black/20 text-white border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2 pb-4">
                    <button
                      type="button"
                      onClick={() => setShowMetricsForm(false)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500"
                    >
                      Log Metrics
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;