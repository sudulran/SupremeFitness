import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchMealPlanById,
  fetchFoods,
  updateMealPlan,
} from '../api/planService';
import CustomSelect from '../components/CustomSelect';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import {
  Utensils,
  Loader2,
  Search,
  SlidersHorizontal,
  PlusCircle,
  Trash2,
  ClipboardList,
} from 'lucide-react';

const navy = '#041a33';
const card = '#0b2548';
const field = '#112f57';

const goalOptions = [
  'Weight Loss',
  'Muscle Gain',
  'Maintenance',
  'Energy Boost',
  'General Health',
];
const dietOptions = ['Regular', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low Carb', 'High Protein'];
const mealTypes = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack'];
const statusOptions = ['Active', 'Completed', 'Cancelled', 'Paused'];

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const createId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

const UpdateMealPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [foods, setFoods] = useState([]);
  const [foodSearch, setFoodSearch] = useState('');

  const [form, setForm] = useState({
    user: '',
    planName: '',
    goal: goalOptions[0],
    targetCalories: '',
    duration: 4,
    dietType: dietOptions[0],
    startDate: '',
    endDate: '',
    description: '',
    restrictions: '',
    status: statusOptions[0],
  });

  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [planResponse, foodResponse] = await Promise.all([
          fetchMealPlanById(id),
          fetchFoods({ limit: 300 }),
        ]);

        const plan = planResponse.data?.data;
        if (!plan) throw new Error('Meal plan not found');

        setForm({
          user: plan.user?._id || '',
          planName: plan.planName || '',
          goal: plan.goal || goalOptions[0],
          targetCalories: plan.targetCalories || '',
          duration: plan.duration || 4,
          dietType: plan.dietType || dietOptions[0],
          startDate: toDateInput(plan.startDate),
          endDate: toDateInput(plan.endDate),
          description: plan.description || '',
          restrictions: (plan.restrictions || []).join(', '),
          status: plan.status || statusOptions[0],
        });

        setMeals(
          (plan.meals || []).map((meal) => ({
            id: createId(),
            mealType: meal.mealType,
            time: meal.time || '',
            instructions: meal.instructions || '',
            items: (meal.items || []).map((item) => ({
              id: createId(),
              foodId: item.food?._id || item.food,
              quantity: item.quantity,
              unit: item.unit,
              notes: item.notes || '',
            })),
          }))
        );

        setFoods(foodResponse.data?.data || foodResponse.data || []);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to load meal plan');
        navigate('/admin-meal-plans');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const filteredFoods = useMemo(() => {
    const term = foodSearch.trim().toLowerCase();
    if (!term) return foods;
    return foods.filter((food) =>
      [food.name, food.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [foodSearch, foods]);

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddMeal = () => {
    setMeals((prev) => [
      ...prev,
      {
        id: createId(),
        mealType: mealTypes[prev.length % mealTypes.length],
        time: '',
        instructions: '',
        items: [
          {
            id: createId(),
            foodId: '',
            quantity: '',
            unit: 'g',
            notes: '',
          },
        ],
      },
    ]);
  };

  const handleRemoveMeal = (mealId) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== mealId));
  };

  const handleMealChange = (mealId, key, value) => {
    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === mealId
          ? { ...meal, [key]: value }
          : meal
      )
    );
  };

  const handleAddMealItem = (mealId) => {
    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              items: [
                ...meal.items,
                {
                  id: createId(),
                  foodId: '',
                  quantity: '',
                  unit: 'g',
                  notes: '',
                },
              ],
            }
          : meal
      )
    );
  };

  const handleRemoveMealItem = (mealId, itemId) => {
    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === mealId
          ? { ...meal, items: meal.items.filter((item) => item.id !== itemId) }
          : meal
      )
    );
  };

  const handleMealItemChange = (mealId, itemId, key, value) => {
    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              items: meal.items.map((item) =>
                item.id === itemId ? { ...item, [key]: value } : item
              ),
            }
          : meal
      )
    );
  };

  const validateForm = () => {
    if (!form.planName.trim()) {
      toast.error('Plan name is required');
      return false;
    }
    if (!form.targetCalories) {
      toast.error('Target calories are required');
      return false;
    }
    if (!form.startDate || !form.endDate) {
      toast.error('Provide start and end dates');
      return false;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('End date must be after start date');
      return false;
    }
    if (!meals.length) {
      toast.error('Add at least one meal');
      return false;
    }
    const mealsValid = meals.every(
      (meal) =>
        meal.items.length &&
        meal.items.every((item) => item.foodId && Number(item.quantity) > 0)
    );
    if (!mealsValid) {
      toast.error('Each meal needs food items with quantities');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      planName: form.planName,
      goal: form.goal,
      targetCalories: Number(form.targetCalories) || 0,
      meals: meals.map((meal) => ({
        mealType: meal.mealType,
        time: meal.time,
        instructions: meal.instructions,
        items: meal.items.map((item) => ({
          food: item.foodId,
          quantity: Number(item.quantity) || 0,
          unit: item.unit,
          notes: item.notes,
        })),
      })),
      duration: Number(form.duration) || 4,
      startDate: form.startDate,
      endDate: form.endDate,
      dietType: form.dietType,
      restrictions: form.restrictions
        ? form.restrictions.split(',').map((x) => x.trim()).filter(Boolean)
        : [],
      description: form.description,
      status: form.status,
    };

    setSaving(true);
    try {
      await updateMealPlan(id, payload);
      toast.success('Meal plan updated successfully');
      navigate('/admin-meal-plans');
    } catch (error) {
      const resp = error.response?.data;
      if (resp?.errors && Array.isArray(resp.errors)) {
        resp.errors.forEach((e) => toast.error(e.msg || e.message || JSON.stringify(e)));
      } else {
        toast.error(resp?.message || 'Failed to update meal plan');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white/70">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Loading meal plan...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <StoreAdminSidebar />
      <div className="bg-gray-800 py-12" style={{ marginLeft: 240 }}>
        <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-black via-[#102441] to-red-600 p-8 shadow-xl">
          <div className="flex items-center gap-3 text-white">
            <Utensils className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-semibold">Update Meal Plan</h1>
              <p className="text-sm text-white/80">
                Adjust meals, macros, and schedule for this members nutrition plan.
              </p>
            </div>
          </div>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl border border-[#132c55] p-8 text-white shadow-2xl"
          style={{ backgroundColor: navy }}
        >
          <section>
            <header className="mb-6 flex items-center gap-3 text-xl font-semibold text-white">
              <ClipboardList className="h-6 w-6 text-red-500" />
              <span>Plan Details</span>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Plan Name</label>
                <input
                  type="text"
                  value={form.planName}
                  onChange={(event) => handleFieldChange('planName', event.target.value)}
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Goal</label>
                   <CustomSelect
                     options={goalOptions.map(g => ({ value: g, label: g }))}
                     value={form.goal}
                     onChange={(v) => handleFieldChange('goal', v)}
                     className="dark-select"
                   />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Target Calories</label>
                <input
                  type="number"
                  min="1000"
                  value={form.targetCalories}
                  onChange={(event) => handleFieldChange('targetCalories', event.target.value)}
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Diet Type</label>
                   <CustomSelect
                     options={dietOptions.map(d => ({ value: d, label: d }))}
                     value={form.dietType}
                     onChange={(v) => handleFieldChange('dietType', v)}
                     className="dark-select"
                   />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Duration (weeks)</label>
                <input
                  type="number"
                  min="1"
                  value={form.duration}
                  onChange={(event) => handleFieldChange('duration', event.target.value)}
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => handleFieldChange('startDate', event.target.value)}
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => handleFieldChange('endDate', event.target.value)}
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Status</label>
                   <CustomSelect
                     options={statusOptions.map(s => ({ value: s, label: s }))}
                     value={form.status}
                     onChange={(v) => handleFieldChange('status', v)}
                     className="dark-select"
                   />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Restrictions</label>
                <input
                  type="text"
                  value={form.restrictions}
                  onChange={(event) => handleFieldChange('restrictions', event.target.value)}
                  placeholder="Comma separated list (e.g. nut-free, dairy-free)"
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Description</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(event) => handleFieldChange('description', event.target.value)}
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>
            </div>
          </section>

          <section>
            <header className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xl font-semibold text-white">
                <Utensils className="h-6 w-6 text-red-500" />
                <span>Edit Meals</span>
              </div>
              <button
                type="button"
                onClick={handleAddMeal}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-600 hover:text-white"
              >
                <PlusCircle className="h-4 w-4" /> Add Meal
              </button>
            </header>

            {meals.length === 0 ? (
              <p
                className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-white/60"
                style={{ backgroundColor: card }}
              >
                Add meals to build the daily nutrition plan.
              </p>
            ) : (
              <div className="space-y-6">
                {meals.map((meal, mealIndex) => (
                  <div
                    key={meal.id}
                    className="rounded-2xl border border-[#1c3660] p-6 shadow-lg"
                    style={{ backgroundColor: card }}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs uppercase tracking-wide text-white/60">Meal Type</label>
                          <CustomSelect
                            options={mealTypes.map(t => ({ value: t, label: t }))}
                            value={meal.mealType}
                            onChange={(v) => handleMealChange(meal.id, 'mealType', v)}
                            placeholder="Meal type"
                            className="dark-select"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs uppercase tracking-wide text-white/60">Time</label>
                          <input
                            type="time"
                            value={meal.time}
                            onChange={(event) => handleMealChange(meal.id, 'time', event.target.value)}
                            className="rounded-xl border border-[#1c3660] px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                            style={{ backgroundColor: field }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs uppercase tracking-wide text-white/60">Instructions</label>
                          <input
                            type="text"
                            value={meal.instructions}
                            onChange={(event) => handleMealChange(meal.id, 'instructions', event.target.value)}
                            placeholder="Optional serving notes"
                            className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
                            style={{ backgroundColor: field }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMeal(meal.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" /> Remove Meal
                      </button>
                    </div>

                    <div className="mt-6 space-y-4">
                      <header className="flex items-center justify-between text-sm uppercase tracking-wide text-white/60">
                        Food Items
                        <button
                          type="button"
                          onClick={() => handleAddMealItem(meal.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-3 py-2 text-xs font-medium text-white transition hover:border-white hover:bg-white/10"
                        >
                          <PlusCircle className="h-4 w-4" /> Add Item
                        </button>
                      </header>

                      {meal.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-1 gap-4 rounded-xl border border-[#1c3660] p-4 md:grid-cols-5"
                          style={{ backgroundColor: field }}
                        >
                          <div className="md:col-span-2">
                            <label className="text-xs uppercase tracking-wide text-white/60">Food</label>
                            <CustomSelect
                              options={[{ value: '', label: 'Select food' }, ...filteredFoods.map(f => ({ value: f._id, label: `${f.name} (${f.category})` }))]}
                              value={item.foodId}
                              onChange={(v) => handleMealItemChange(meal.id, item.id, 'foodId', v)}
                              placeholder="Select food"
                              className="dark-select"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-wide text-white/60">Quantity</label>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(event) =>
                                handleMealItemChange(meal.id, item.id, 'quantity', event.target.value)
                              }
                              className="mt-1 w-full rounded-lg border border-[#1c3660] bg-[#13386a] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-wide text-white/60">Unit</label>
                            <CustomSelect
                              options={[
                                { value: 'g', label: 'g' },
                                { value: 'ml', label: 'ml' },
                                { value: 'cup', label: 'cup' },
                                { value: 'piece', label: 'piece' },
                                { value: 'tbsp', label: 'tbsp' },
                                { value: 'tsp', label: 'tsp' },
                                { value: 'oz', label: 'oz' },
                                { value: 'scoop', label: 'scoop' },
                                { value: 'slice', label: 'slice' },
                              ]}
                              value={item.unit}
                              onChange={(v) => handleMealItemChange(meal.id, item.id, 'unit', v)}
                              placeholder="Unit"
                              className="dark-select"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-wide text-white/60">Notes</label>
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(event) =>
                                handleMealItemChange(meal.id, item.id, 'notes', event.target.value)
                              }
                              placeholder="Optional"
                              className="mt-1 w-full rounded-lg border border-[#1c3660] bg-[#13386a] px-3 py-2 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveMealItem(meal.id, item.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-500 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin-meal-plans')}
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:border-white hover:bg-white/10"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-900"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5" /> Update Meal Plan
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </div>
  );
};

export default UpdateMealPlan;
