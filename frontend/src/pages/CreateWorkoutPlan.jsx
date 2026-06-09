import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchUsersForPlans,
  fetchExercises,
  createWorkoutPlan,
} from '../api/planService';
import CustomSelect from '../components/CustomSelect';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import {
  Dumbbell,
  Search,
  PlusCircle,
  Trash2,
  ClipboardList,
} from 'lucide-react';

const navy = '#062043';
const card = '#081d37';
const field = '#0d2747';

const goals = [
  'Weight Loss',
  'Muscle Gain',
  'Endurance',
  'Strength',
  'Flexibility',
  'General Fitness',
];

const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const statusOptions = ['Active', 'Completed', 'Cancelled', 'Paused'];

const frequencies = [
  'Daily',
  '3 times/week',
  '4 times/week',
  '5 times/week',
  '6 times/week',
];

const CreateWorkoutPlan = () => {
  const [users, setUsers] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    user: '',
    planName: '',
    goal: goals[0],
    difficulty: difficulties[0],
    frequency: frequencies[1],
    duration: '4',
    startDate: '',
    endDate: '',
    description: '',
    status: statusOptions[0],
  });

  const [selectedExercises, setSelectedExercises] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const [userRes, exerciseRes] = await Promise.all([
          fetchUsersForPlans(),
          fetchExercises({ limit: 300 }),
        ]);
        setUsers(userRes.data?.data?.users ?? []);
        setExercises(exerciseRes.data.data || exerciseRes.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

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
    const exists = selectedExercises.find((item) => item.exerciseId === exercise._id);
    if (exists) {
      toast.info('Exercise already added');
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
    if (!form.user) {
      toast.error('Please select a user');
      return false;
    }
    if (!form.planName.trim()) {
      toast.error('Plan name is required');
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
    if (!selectedExercises.length) {
      toast.error('Please add at least one exercise');
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
      await createWorkoutPlan(payload);
      toast.success('Workout plan created successfully');
      // Navigate to the workout plans overview so it fetches and displays the new plan
      navigate('/admin-workout-plans');
    } catch (error) {
      const resp = error.response?.data;
      if (resp?.errors && Array.isArray(resp.errors)) {
        resp.errors.forEach((e) => toast.error(e.msg || e.message || JSON.stringify(e)));
      } else {
        toast.error(resp?.message || 'Failed to create plan');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <StoreAdminSidebar />
      <div className="bg-gray-800 py-12" style={{ marginLeft: 240 }}>
        <div className="mx-auto max-w-6xl px-4">
        <div
          className="mb-6 rounded-3xl bg-gradient-to-r from-black via-[#0f1f39] to-red-600 p-8 shadow-xl"
        >
          <div className="flex items-center gap-3 text-white">
            <Dumbbell className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-semibold">Create Workout Plan</h1>
              <p className="text-sm text-white/80">
                Assign a personalised programme to a member and craft their weekly routine.
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
                  placeholder="e.g. Beginner Weight Loss Program"
                  value={form.planName}
                  onChange={(event) => handleFieldChange('planName', event.target.value)}
                  className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{ backgroundColor: field }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Goal</label>
                <CustomSelect
                  options={goals.map(g => ({ value: g, label: g }))}
                  value={form.goal}
                  onChange={(v) => handleFieldChange('goal', v)}
                  placeholder="Select goal"
                  className="dark-select"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Difficulty</label>
                <CustomSelect
                  options={difficulties.map(d => ({ value: d, label: d }))}
                  value={form.difficulty}
                  onChange={(v) => handleFieldChange('difficulty', v)}
                  placeholder="Select difficulty"
                  className="dark-select"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">Frequency</label>
                <CustomSelect
                  options={frequencies.map(f => ({ value: f, label: f }))}
                  value={form.frequency}
                  onChange={(v) => handleFieldChange('frequency', v)}
                  placeholder="Select frequency"
                  className="dark-select"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-wide text-white/70">
                  Duration (weeks)
                </label>
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
                  placeholder="Select status"
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
                placeholder="Plan description..."
                className="rounded-xl border border-[#1c3660] px-4 py-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                style={{ backgroundColor: field }}
              />
            </div>
          </section>

          <section>
            <header className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xl font-semibold text-white">
                <Dumbbell className="h-6 w-6 text-red-500" />
                <span>Add Exercises</span>
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
                Choose exercises from the list above to build this plan.
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
                        <label className="text-xs uppercase tracking-wide text-white/60">
                          Notes
                        </label>
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
              <PlusCircle className="h-5 w-5" />
              {saving ? 'Creating...' : 'Create Workout Plan'}
            </button>
          </footer>
        </form>
      </div>
      </div>
    </div>
  );
};

export default CreateWorkoutPlan;
