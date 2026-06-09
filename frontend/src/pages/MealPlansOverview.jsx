import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchMealPlans, fetchMealPlanById, deleteMealPlan } from '../api/planService';
import {
  Loader2,
  Search,
  SlidersHorizontal,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import StoreAdminSidebar from '../components/StoreAdminSidebar';

const bg = 'bg-gray-800';
const card = 'bg-[#0b1e3c]';

const goalOptions = [
  'All Goals',
  'Weight Loss',
  'Muscle Gain',
  'Maintenance',
  'Energy Boost',
  'General Health',
];
const dietOptions = [
  'All Diets',
  'Regular',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Paleo',
  'Low Carb',
  'High Protein',
];
const statusOptions = ['All Statuses', 'Active', 'Completed', 'Cancelled', 'Paused'];

const MealPlansOverview = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState([]);
  const [planDetails, setPlanDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [search, setSearch] = useState('');
  const [goalFilter, setGoalFilter] = useState('All Goals');
  const [dietFilter, setDietFilter] = useState('All Diets');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetchMealPlans({ limit: 200 });
      setPlans(response.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const hay = `${plan?.planName ?? ''} ${plan?.user?.username ?? ''} ${plan?.user?.name ?? ''} ${plan?.user?.email ?? ''} ${plan?.goal ?? ''}`;
      const matchesSearch = search
        ? hay.toLowerCase().includes(search.toLowerCase().trim())
        : true;
      const matchesGoal = goalFilter === 'All Goals' || plan.goal === goalFilter;
      const matchesDiet = dietFilter === 'All Diets' || plan.dietType === dietFilter;
      const matchesStatus =
        statusFilter === 'All Statuses' || plan.status === statusFilter;
      return matchesSearch && matchesGoal && matchesDiet && matchesStatus;
    });
  }, [plans, search, goalFilter, dietFilter, statusFilter]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Delete this meal plan?');
    if (!confirmDelete) return;

    try {
      await deleteMealPlan(id);
      toast.success('Meal plan deleted');
      setPlans((prev) => prev.filter((plan) => plan._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete meal plan');
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin-meal-plans/edit/${id}`);
  };

  const toggleExpand = async (id) => {
    const isOpen = expandedIds.includes(id);
    if (isOpen) {
      setExpandedIds((prev) => prev.filter((x) => x !== id));
      return;
    }
    setExpandedIds((prev) => [...prev, id]);
    if (planDetails[id]) return;
    try {
      setLoadingDetails((s) => ({ ...s, [id]: true }));
      const resp = await fetchMealPlanById(id);
      setPlanDetails((p) => ({ ...p, [id]: resp.data?.data || resp.data }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load meal plan details');
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
            <h1 className="text-3xl font-semibold text-white">Meal Plans</h1>
            <p className="mt-2 text-sm text-white/70">
              Track and manage personalised meal plans delivered to members.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin-meal-plans/create')}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            <Plus className="h-4 w-4" /> Create Meal Plan
          </button>
        </header>

        <section className={`rounded-3xl border border-white/10 ${card} p-6 shadow-2xl`}>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-white/60">
                Search
              </label>
              <div className="mt-1 flex items-center rounded-xl border border-white/10 bg-black/30 pl-3 pr-2">
                <Search className="h-4 w-4 text-white/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by member, plan name, goal, or diet"
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
                <label className="text-xs uppercase tracking-wide text-white/60">Diet Type</label>
                <div className="relative mt-1">
                  <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <CustomSelect
                    options={dietOptions.map(d => ({ value: d, label: d }))}
                    value={dietFilter}
                    onChange={(v) => setDietFilter(v)}
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
                  <th className="px-4 py-3">Target Calories</th>
                  <th className="px-4 py-3">Diet Type</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-white/60">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading meal plans...
                      </div>
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-white/60">
                      No meal plans match your filters.
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
                              title="Show meals"
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
                          <div className="text-xs text-white/50">Duration: {plan.duration} weeks</div>
                        </td>
                        <td className="px-4 py-4 text-white">{plan.goal}</td>
                        <td className="px-4 py-4 text-white">{plan.targetCalories} kcal</td>
                        <td className="px-4 py-4 text-white">{plan.dietType}</td>
                        <td className="px-4 py-4">
                          <div>{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '-'}</div>
                          <div className="text-xs text-white/50">to {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '-'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              plan.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-200'
                                : plan.status === 'Completed'
                                ? 'bg-sky-500/20 text-sky-200'
                                : 'bg-red-600/20 text-red-300'
                            }`}
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
                          <td colSpan={8} className="px-6 py-4">
                            {loadingDetails[plan._id] ? (
                              <div className="flex items-center gap-2 text-white/70">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading meal plan...
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-white/90">Meals</h4>
                                  <div className="text-xs text-white/60">Duration: {plan.duration} weeks • Diet: {plan.dietType}</div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {(planDetails[plan._id]?.meals || []).map((meal) => (
                                    <div key={meal.id} className="rounded-lg border border-white/5 p-3" style={{ backgroundColor: '#071829' }}>
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <div className="font-medium text-white">{meal.mealType}</div>
                                          <div className="text-xs text-white/60">{meal.time || ''} {meal.instructions ? `• ${meal.instructions}` : ''}</div>
                                        </div>
                                        <div className="text-sm text-white/60">{meal.items?.length ? `${meal.items.length} items` : 'No items'}</div>
                                      </div>
                                      {meal.items?.length > 0 && (
                                        <div className="mt-2 grid gap-2">
                                          {meal.items.map((it) => (
                                            <div key={it.id} className="flex justify-between text-sm text-white/70">
                                              <div>
                                                <div>{it.foodName || it.food?.name || it.food}</div>
                                                {it.food?.nutrition && (
                                                  <div className="text-xs text-white/50">Calories: {it.food.nutrition?.calories ?? '-'} kcal • Protein: {it.food.nutrition?.protein ?? '-'} g</div>
                                                )}
                                              </div>
                                              <div>{it.quantity}{it.unit ? ` ${it.unit}` : ''}</div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {!((planDetails[plan._id]?.meals || []).length) && (
                                    <div className="text-sm text-white/60">No meals listed for this plan.</div>
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

export default MealPlansOverview;
