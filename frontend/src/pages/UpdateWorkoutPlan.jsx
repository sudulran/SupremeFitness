import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchWorkoutPlanById,
  fetchExercises,
  updateWorkoutPlan,
} from '../api/planService';
import CustomSelect from '../components/CustomSelect';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import {
  Dumbbell,
  Search,
  PlusCircle,
  Trash2,
  ClipboardList,
  Loader2,
} from 'lucide-react';

const navy = '#051f3d';
const card = '#0b2b55';
const field = '#12345c';

const goalOptions = [
  'Weight Loss',
  'Muscle Gain',
  'Endurance',
  'Strength',
  'Flexibility',
  'General Fitness',
];

const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];

const frequencyOptions = [
  'Daily',
  '3 times/week',
  '4 times/week',
  '5 times/week',
  '6 times/week',
];

const statusOptions = ['Active', 'Completed', 'Cancelled', 'Paused'];

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const UpdateWorkoutPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const [form, setForm] = useState({
    user: '',
    planName: '',
    goal: goalOptions[0],
    difficulty: difficultyOptions[0],
    frequency: frequencyOptions[1],
    duration: 4,
    startDate: '',
    endDate: '',
    description: '',
    status: statusOptions[0],
  });

  const [selectedExercises, setSelectedExercises] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [planResponse, exerciseResponse] = await Promise.all([
          fetchWorkoutPlanById(id),
          fetchExercises({ limit: 300 }),
        ]);

        const plan = planResponse.data?.data;
        if (!plan) throw new Error('Workout plan not found');

        setForm({
          user: plan.user?._id || '',
          planName: plan.planName || '',
          goal: plan.goal || goalOptions[0],
          difficulty: plan.difficulty || difficultyOptions[0],
          frequency: plan.frequency || frequencyOptions[1],
          duration: plan.duration || 4,
          startDate: toDateInput(plan.startDate),
          endDate: toDateInput(plan.endDate),
          description: plan.description || '',
          status: plan.status || statusOptions[0],
        });

        setSelectedExercises(
          (plan.exercises || []).map((item) => ({
            exerciseId: item.exercise?._id || item.exercise,
            name: item.exercise?.name || 'Exercise',
            muscleGroup: item.exercise?.muscleGroup,
            sets: item.sets,
            reps: item.reps,
            duration: item.duration || '',
            restTime: item.restTime || 60,
            notes: item.notes || '',
          }))
        );

        setExercises(exerciseResponse.data?.data || exerciseResponse.data || []);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to load workout plan');
        navigate('/admin-workout-plans');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const filteredExercises = useMemo(() => {
    const term = exerciseSearch.trim().toLowerCase();
    if (!term) return exercises;
    return exercises.filter((exercise) =>
      [exercise.name, exercise.muscleGroup, exercise.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [exerciseSearch, exercises]);

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddExercise = (exercise) => {
    if (!exercise?._id) return;
    if (selectedExercises.some((item) => item.exerciseId === exercise._id)) {
      toast.info('Exercise already included');
      return;
    }

    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise._id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: 3,
        reps: 12,
        duration: '',
        restTime: 60,
        notes: '',
      },
    ]);
  };

  const handleExerciseChange = (exerciseId, key, value) => {
    setSelectedExercises((prev) =>
      prev.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? { ...exercise, [key]: value }
          : exercise
      )
    );
  };

  const handleRemoveExercise = (exerciseId) => {
    setSelectedExercises((prev) => prev.filter((exercise) => exercise.exerciseId !== exerciseId));
  };

  const validateForm = () => {
    if (!form.planName.trim()) {
      toast.error('Plan name is required');
      return false;
    }
    if (!form.startDate || !form.endDate) {
      toast.error('Start and end date are required');
      return false;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('End date must be after start date');
      return false;
    }
    if (!selectedExercises.length) {
      toast.error('Add at least one exercise');
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
      difficulty: form.difficulty,
      frequency: form.frequency,
      duration: Number(form.duration) || 4,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      status: form.status,
      exercises: selectedExercises.map((exercise, index) => ({
        exercise: exercise.exerciseId,
        sets: Number(exercise.sets) || 0,
        reps: Number(exercise.reps) || 0,
        duration: exercise.duration ? Number(exercise.duration) : undefined,
        restTime: exercise.restTime ? Number(exercise.restTime) : 60,
        notes: exercise.notes,
        order: index + 1,
      })),
    };

    setSaving(true);
    try {
      await updateWorkoutPlan(id, payload);
      toast.success('Workout plan updated successfully');
      navigate('/admin-workout-plans');
    } catch (error) {
      const resp = error.response?.data;
      if (resp?.errors && Array.isArray(resp.errors)) {
        resp.errors.forEach((e) => toast.error(e.msg || e.message || JSON.stringify(e)));
      } else {
        toast.error(resp?.message || 'Failed to update workout plan');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white/70">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Loading workout plan...
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
            <Dumbbell className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-semibold">Update Workout Plan</h1>
              <p className="text-sm text-white/80">
                Modify the exercises, schedule, and details for this member's programme.
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
                <label className="text-sm uppercase tracking-wide text-white/70">Difficulty</label>
                <CustomSelect
                  options={difficultyOptions.map(d => ({ value: d, label: d }))}
                  value={form.difficulty}
                  onChange={(v) => handleFieldChange('difficulty', v)}
                  className="dark-select"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Frequency</label>
                <CustomSelect
                  options={frequencyOptions.map(f => ({ value: f, label: f }))}
                  value={form.frequency}
                  onChange={(v) => handleFieldChange('frequency', v)}
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

            <div className="mt-6 flex flex-col gap-2">
              <label className="text-sm uppercase tracking-wide text-white/70">Description</label>
              <textarea
                rows="4"
                value={form.description}
                onChange={(event) => handleFieldChange('description', event.target.value)}
                placeholder="Plan description or coaching notes"
                className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                style={{ backgroundColor: field }}
              />
            </div>
          </section>

          <section>
            <header className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xl font-semibold text-white">
                <Dumbbell className="h-6 w-6 text-red-500" />
                <span>Edit Exercises</span>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search exercises by name or muscle group..."
                  value={exerciseSearch}
                  onChange={(event) => setExerciseSearch(event.target.value)}
                  className="w-full rounded-xl border border-[#1c3660] py-2.5 pl-11 pr-4 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  style={{ backgroundColor: field }}
                />
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((exercise) => (
                <button
                  type="button"
                  key={exercise._id}
                  onClick={() => handleAddExercise(exercise)}
                  className="group rounded-2xl border border-transparent p-4 text-left transition hover:border-red-500/60 hover:shadow-lg"
                  style={{ backgroundColor: card }}
                >
                  <h4 className="text-lg font-semibold text-white group-hover:text-red-400">
                    {exercise.name}
                  </h4>
                  <p className="mt-1 text-sm text-white/70">{exercise.muscleGroup}</p>
                  <p className="mt-2 text-xs text-white/60">MET: {exercise.metValue}</p>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm text-red-400">
                    <PlusCircle className="h-4 w-4" /> Add to plan
                  </span>
                </button>
              ))}
              {!filteredExercises.length && (
                <div
                  className="col-span-full rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/50"
                  style={{ backgroundColor: card }}
                >
                  No exercises match your search.
                </div>
              )}
            </div>
          </section>

          <section>
            <header className="mb-4 text-xl font-semibold text-white">Selected Exercises</header>
            {selectedExercises.length === 0 ? (
              <p
                className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-white/60"
                style={{ backgroundColor: card }}
              >
                Choose exercises from the list above to assemble this plan.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedExercises.map((exercise, index) => (
                  <div
                    key={exercise.exerciseId}
                    className="rounded-2xl border border-[#1c3660] p-5 shadow-md"
                    style={{ backgroundColor: card }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {index + 1}. {exercise.name}
                        </h4>
                        <p className="text-sm text-white/60">{exercise.muscleGroup}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exercise.exerciseId)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
                      <div className="md:col-span-1">
                        <label className="text-xs uppercase tracking-wide text-white/60">Sets</label>
                        <input
                          type="number"
                          min="1"
                          value={exercise.sets}
                          onChange={(event) =>
                            handleExerciseChange(exercise.exerciseId, 'sets', event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-[#1c3660] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                          style={{ backgroundColor: field }}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs uppercase tracking-wide text-white/60">Reps</label>
                        <input
                          type="number"
                          min="1"
                          value={exercise.reps}
                          onChange={(event) =>
                            handleExerciseChange(exercise.exerciseId, 'reps', event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-[#1c3660] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                          style={{ backgroundColor: field }}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs uppercase tracking-wide text-white/60">
                          Duration (mins)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={exercise.duration}
                          onChange={(event) =>
                            handleExerciseChange(
                              exercise.exerciseId,
                              'duration',
                              event.target.value
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-[#1c3660] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                          style={{ backgroundColor: field }}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-xs uppercase tracking-wide text-white/60">
                          Rest (sec)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={exercise.restTime}
                          onChange={(event) =>
                            handleExerciseChange(
                              exercise.exerciseId,
                              'restTime',
                              event.target.value
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-[#1c3660] px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                          style={{ backgroundColor: field }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs uppercase tracking-wide text-white/60">Notes</label>
                        <input
                          type="text"
                          value={exercise.notes}
                          onChange={(event) =>
                            handleExerciseChange(exercise.exerciseId, 'notes', event.target.value)
                          }
                          placeholder="Technique cues, tempo, etc."
                          className="mt-1 w-full rounded-lg border border-[#1c3660] px-3 py-2 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
                          style={{ backgroundColor: field }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin-workout-plans')}
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
                  <PlusCircle className="h-5 w-5" /> Update Plan
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

export default UpdateWorkoutPlan;
