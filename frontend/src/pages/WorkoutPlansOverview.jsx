import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchWorkoutPlans,
  fetchWorkoutPlanById,
  deleteWorkoutPlan,
} from '../api/planService';
import { Loader2, Search, SlidersHorizontal, Plus, Edit, Trash2 } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import StoreAdminSidebar from '../components/StoreAdminSidebar';

const bg = 'bg-gray-800';
const card = 'bg-[#0b1e3c]';
const accent = 'bg-red-600';

const goalOptions = ['All Goals', 'Weight Loss', 'Muscle Gain', 'Endurance', 'Strength', 'Flexibility', 'General Fitness'];
const difficultyOptions = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const statusOptions = ['All Statuses', 'Active', 'Completed', 'Cancelled', 'Paused'];

const WorkoutPlansOverview = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState([]);
  const [planDetails, setPlanDetails] = useState({}); // map id -> full plan
  const [loadingDetails, setLoadingDetails] = useState({});
  const [search, setSearch] = useState('');
  const [goalFilter, setGoalFilter] = useState('All Goals');
  const [difficultyFilter, setDifficultyFilter] = useState('All Levels');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetchWorkoutPlans({ limit: 200 });
      setPlans(response.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load workout plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const hay = `${plan?.planName ?? ''} ${plan?.user?.username ?? ''} ${plan?.user?.name ?? ''} ${plan?.user?.email ?? ''} ${plan?.goal ?? ''}`;
      const matchesSearch = search
        ? hay.toLowerCase().includes(search.toLowerCase().trim())
        : true;

      const matchesGoal = goalFilter === 'All Goals' || plan.goal === goalFilter;
      const matchesDifficulty =
        difficultyFilter === 'All Levels' || plan.difficulty === difficultyFilter;
      const matchesStatus =
        statusFilter === 'All Statuses' || plan.status === statusFilter;

      return matchesSearch && matchesGoal && matchesDifficulty && matchesStatus;
    });
  }, [plans, search, goalFilter, difficultyFilter, statusFilter]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this workout plan?');
    if (!confirm) return;

    try {
      await deleteWorkoutPlan(id);
      toast.success('Workout plan deleted');
      setPlans((prev) => prev.filter((plan) => plan._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete workout plan');
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin-workout-plans/edit/${id}`);
  };

  const toggleExpand = async (id) => {
    const isOpen = expandedIds.includes(id);
    if (isOpen) {
      setExpandedIds((prev) => prev.filter((x) => x !== id));
      return;
    }

    // open
    setExpandedIds((prev) => [...prev, id]);

    if (planDetails[id]) return; // already have details

    try {
      setLoadingDetails((s) => ({ ...s, [id]: true }));
      const resp = await fetchWorkoutPlanById(id);
      setPlanDetails((p) => ({ ...p, [id]: resp.data?.data || resp.data }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load plan details');
    } finally {
      setLoadingDetails((s) => ({ ...s, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen">
      <StoreAdminSidebar />
  <div className={` ${bg} py-10 min-h-screen`} style={{ marginLeft: 240 }}>
        <div className="mx-auto max-w-7xl px-4">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Workout Plans</h1>
            <p className="mt-2 text-sm text-white/70">
              Review, filter, and manage workout programmes assigned to members.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/admin-workout-plans/create')}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              <Plus className="h-4 w-4" /> Create Plan
            </button>
          </div>
        </header>

        <section className={`rounded-3xl border border-white/10 ${card} p-6 shadow-2xl`}> 
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-white/60">Search</label>
              <div className="mt-1 flex items-center rounded-xl border border-white/10 bg-black/30 pl-3 pr-2">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by member, plan name, or goal"
                  className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-white/60">Goal</label>
              <div className="relative mt-1">
                <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <CustomSelect
                  options={goalOptions.map(g => ({ value: g, label: g }))}
                  value={goalFilter}
                  onChange={(v) => setGoalFilter(v)}
                  className="dark-select"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
              <div>
                <label className="text-xs uppercase tracking-wide text-white/60">Difficulty</label>
                <div className="relative mt-1">
                  <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <CustomSelect
                    options={difficultyOptions.map(d => ({ value: d, label: d }))}
                    value={difficultyFilter}
                    onChange={(v) => setDifficultyFilter(v)}
                    className="dark-select"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-white/60">Status</label>
                <div className="relative mt-1">
                  <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <CustomSelect
                    options={statusOptions.map(s => ({ value: s, label: s }))}
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v)}
                    className="dark-select"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/60">
                <tr className="text-left text-xs uppercase tracking-wide text-white/60">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Goal</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-white/60">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading workout plans...
                      </div>
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-white/60">
                      No workout plans match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <React.Fragment key={plan._id}>
                      <tr className="transition hover:bg-white/5">
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleExpand(plan._id)}
                              className="rounded-full border border-white/10 p-1 text-white/80 hover:bg-white/5"
                              title="Show exercises"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <div>
                              <div className="font-semibold text-white">
                                {plan.user?.name || plan.user?.username || 'Unknown member'}
                              </div>
                              <div className="text-xs text-white/50">{plan.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">{plan.planName}</div>
                          <div className="text-xs text-white/50">Frequency: {plan.frequency}</div>
                        </td>
                        <td className="px-4 py-4 text-white">{plan.goal}</td>
                        <td className="px-4 py-4 text-white">{plan.difficulty}</td>
                        <td className="px-4 py-4">
                          <div>{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '-'}</div>
                          <div className="text-xs text-white/50">to {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '-'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${plan.status === 'Active' ? 'bg-emerald-500/20 text-emerald-200' : plan.status === 'Completed' ? 'bg-sky-500/20 text-sky-200' : 'bg-red-600/20 text-red-300'}`}
                          >
                            {plan.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(plan._id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-white transition hover:border-white hover:bg-white/10"
                            >
                              <Edit className="h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(plan._id)}
                              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedIds.includes(plan._id) && (
                        <tr className="bg-black/30">
                          <td colSpan={7} className="px-6 py-4">
                            {loadingDetails[plan._id] ? (
                              <div className="flex items-center gap-2 text-white/70">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading exercises...
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-white/90">Exercises</h4>
                                  <div className="text-xs text-white/60">Frequency: {plan.frequency} • Duration: {plan.duration} weeks</div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {(planDetails[plan._id]?.exercises || []).map((ex) => (
                                    <div key={ex.exercise?._id || ex.exercise} className="rounded-lg border border-white/5 p-3" style={{ backgroundColor: '#071829' }}>
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-white">{ex.exercise?.name || ex.name || 'Exercise'}</div>
                                          <div className="text-xs text-white/60">{ex.exercise?.muscleGroup || ex.muscleGroup}</div>
                                          {ex.exercise?.metValue && (
                                            <div className="text-xs text-white/50">MET: {ex.exercise.metValue}</div>
                                          )}
                                        </div>
                                        <div className="text-sm text-white/60 text-right space-y-1">
                                          {ex.sets ? <div>{ex.sets} sets • {ex.reps} reps</div> : null}
                                          {ex.duration ? <div>{ex.duration} mins</div> : null}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {!((planDetails[plan._id]?.exercises || []).length) && (
                                    <div className="text-sm text-white/60">No exercises listed for this plan.</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
  );
};

export default WorkoutPlansOverview;
