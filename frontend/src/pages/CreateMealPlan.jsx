import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchUsersForPlans,
  fetchFoods,
  createMealPlan,
} from '../api/planService';
import CustomSelect from '../components/CustomSelect';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import {
  Utensils,
  PlusCircle,
  Trash2,
  ClipboardList,
  Search,
} from 'lucide-react';

const navy = '#051A33';
const card = '#081d37';
const field = '#0c2546';

const mealGoals = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Energy Boost', 'General Health'];
const dietTypes = ['Regular', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low Carb', 'High Protein'];
const statusOptions = ['Active', 'Completed', 'Cancelled', 'Paused'];
const mealTypes = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack'];

const createId = () =>
  (typeof window !== 'undefined' && window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

const CreateMealPlan = () => {
  const [users, setUsers] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    user: '',
    planName: '',
    goal: mealGoals[0],
    targetCalories: '',
    duration: '4',
    dietType: dietTypes[0],
    startDate: '',
    endDate: '',
    description: '',
    restrictions: '',
    status: statusOptions[0],
  });

  const [meals, setMeals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const [userRes, foodRes] = await Promise.all([
          fetchUsersForPlans(),
          fetchFoods({ limit: 300 }),
        ]);
        setUsers(userRes.data?.data?.users ?? []);
        const list = foodRes.data.data || foodRes.data || [];
        setFoods(list);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

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
          ? {
              ...meal,
              items: meal.items.filter((item) => item.id !== itemId),
            }
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
    if (!form.user) {
      toast.error('Please select a user');
      return false;
    }
    if (!form.planName.trim()) {
      toast.error('Plan name is required');
      return false;
    }
    if (!form.targetCalories) {
      toast.error('Target calories are required');
      return false;
    }
    if (!form.startDate || !form.endDate) {
      toast.error('Please provide start and end dates');
      return false;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('End date must be after start date');
      return false;
    }
    if (!meals.length) {
      toast.error('Please add at least one meal');
      return false;
    }
    const mealHasItems = meals.every((meal) =>
      meal.items.length && meal.items.every((item) => item.foodId && item.quantity)
    );
    if (!mealHasItems) {
      toast.error('Each meal needs food items with quantity');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      user: form.user,
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
      await createMealPlan(payload);
      toast.success('Meal plan created successfully');
      // Navigate to the meal plans overview so it fetches and displays the new plan
      navigate('/admin-meal-plans');
    } catch (error) {
      const resp = error.response?.data;
      if (resp?.errors && Array.isArray(resp.errors)) {
        resp.errors.forEach((e) => toast.error(e.msg || e.message || JSON.stringify(e)));
      } else {
        toast.error(resp?.message || 'Failed to create meal plan');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderFoodOption = (food) => (
    <option key={food._id} value={food._id}>
      {food.name} ({food.category})
    </option>
  );

  return (
    <div className="min-h-screen">
      <StoreAdminSidebar />
      <div className="bg-gray-800 py-12" style={{ marginLeft: 240 }}>
        <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-black via-[#102441] to-red-600 p-8 shadow-xl">
          <div className="flex items-center gap-3 text-white">
            <Utensils className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-semibold">Create Meal Plan</h1>
              <p className="text-sm text-white/80">
                Assign personalised nutrition guidance and daily meals to your members.
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
              <span>Basic Information</span>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Select User</label>
                <CustomSelect
                  options={[{ value: '', label: 'Choose a user...' }, ...users.map(u => ({ value: u._id, label: `${u.name} (${u.email})` }))]}
                  value={form.user}
                  onChange={(v) => handleFieldChange('user', v)}
                  placeholder="Choose a user..."
                  className="dark-select"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lean Muscle Nutrition"
                  value={form.planName}
                  onChange={(event) => handleFieldChange('planName', event.target.value)}
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Goal</label>
                <CustomSelect
                  options={mealGoals.map(g => ({ value: g, label: g }))}
                  value={form.goal}
                  onChange={(v) => handleFieldChange('goal', v)}
                  placeholder="Select goal"
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
                <label className="text-sm uppercase tracking-wide text-white/70">Diet Type</label>
                <CustomSelect
                  options={dietTypes.map(d => ({ value: d, label: d }))}
                  value={form.dietType}
                  onChange={(v) => handleFieldChange('dietType', v)}
                  placeholder="Select diet"
                  className="dark-select"
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
                  placeholder="Select status"
                  className="dark-select"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Restrictions</label>
                <input
                  type="text"
                  placeholder="Comma separated (e.g. nut-free, gluten-free)"
                  value={form.restrictions}
                  onChange={(event) => handleFieldChange('restrictions', event.target.value)}
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
                <span>Meals</span>
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
                Add meals to start structuring the daily nutrition plan.
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
                        <div className="flex flex-col gap-2 md:col-span-1">
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
                      <header className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide text-white/60">
                          Food Items
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddMealItem(meal.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-3 py-2 text-xs font-medium text-white transition hover:border-white hover:bg-white/10"
                        >
                          <PlusCircle className="h-4 w-4" /> Add Food Item
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
                              options={[{ value: '', label: 'Select food' }, ...foods.map(f => ({ value: f._id, label: `${f.name} (${f.category})` }))]}
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
                              className="mt-1 w-full rounded-lg border border-[#1c3660] bg-[#0f2d56] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
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
                          <div className="md:col-span-1">
                            <label className="text-xs uppercase tracking-wide text-white/60">Notes</label>
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(event) =>
                                handleMealItemChange(meal.id, item.id, 'notes', event.target.value)
                              }
                              placeholder="Optional"
                              className="mt-1 w-full rounded-lg border border-[#1c3660] bg-[#0f2d56] px-3 py-2 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
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

          <section>
            <header className="mb-4 flex items-center gap-3 text-xl font-semibold text-white">
              <Search className="h-6 w-6 text-red-500" />
              <span>Food Reference</span>
            </header>
            <div className="relative mb-4 w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search foods by name or category..."
                value={foodSearch}
                onChange={(event) => setFoodSearch(event.target.value)}
                className="w-full rounded-xl border border-[#1c3660] py-2.5 pl-11 pr-4 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                style={{ backgroundColor: field }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFoods.slice(0, 9).map((food) => (
                <div
                  key={food._id}
                  className="rounded-2xl border border-[#1c3660] p-4 text-sm text-white/70"
                  style={{ backgroundColor: card }}
                >
                  <h4 className="text-lg font-semibold text-white">{food.name}</h4>
                  <p className="text-xs uppercase tracking-wide text-red-400">{food.category}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span>Calories: {food.nutrition?.calories ?? '-'} kcal</span>
                    <span>Protein: {food.nutrition?.protein ?? '-'} g</span>
                    <span>Carbs: {food.nutrition?.carbs ?? '-'} g</span>
                    <span>Fats: {food.nutrition?.fats ?? '-'} g</span>
                  </div>
                </div>
              ))}
              {!filteredFoods.length && (
                <div
                  className="col-span-full rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/60"
                  style={{ backgroundColor: card }}
                >
                  No foods match your search.
                </div>
              )}
            </div>
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
              <PlusCircle className="h-5 w-5" />
              {saving ? 'Creating...' : 'Create Meal Plan'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </div>
  );
};

export default CreateMealPlan;
