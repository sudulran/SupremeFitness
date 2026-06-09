import React, { useEffect, useMemo, useState } from 'react';
import { fetchWorkoutPlans, fetchWorkoutPlanById } from '../api/planService';
import { Loader2 } from 'lucide-react';

const UserWorkoutPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState([]);
  const [planDetails, setPlanDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [search, setSearch] = useState('');

  // read user from localStorage and return id
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u._id || u.id || u.userId || null;
    } catch (e) {
      return null;
    }
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      const resp = await fetchWorkoutPlans({ limit: 200, userId });
      // defensive: ensure only plans for this user are stored
      const serverPlans = resp.data?.data || [];
      const filtered = serverPlans.filter((p) => {
        const ownerId = p?.user?._id || p?.user?.id || p?.userId || p?.user;
        return !userId || String(ownerId) === String(userId);
      });
      setPlans(filtered);
    } catch (err) {
      console.error(err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) => {
      const hay = `${p.planName || ''} ${p.goal || ''} ${p.difficulty || ''} ${p.frequency || ''} ${p.description || ''}`;
      return hay.toLowerCase().includes(q);
    });
  }, [plans, search]);

  const toggleExpand = async (id) => {
    const isOpen = expandedIds.includes(id);
    if (isOpen) return setExpandedIds((s) => s.filter((x) => x !== id));
    setExpandedIds((s) => [...s, id]);
    if (planDetails[id]) return;
    try {
      setLoadingDetails((s) => ({ ...s, [id]: true }));
      const resp = await fetchWorkoutPlanById(id);
      setPlanDetails((p) => ({ ...p, [id]: resp.data?.data || resp.data }));
    } catch (err) {

    } finally {
      setLoadingDetails((s) => ({ ...s, [id]: false }));
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-b from-gray-800 via-[#071827] to-[#0b2430] md:pl-[520px]">
      {/* Left fixed image for medium+ screens. Hidden on small screens */}
      <div className="hidden md:block fixed left-0 top-[64px] bottom-0 w-[360px] pointer-events-none select-none z-0 rounded-xl overflow-hidden shadow-lg">
        <img src="/images/workoutImage.jpg" alt="" aria-hidden="true" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/60" />
      </div>

      {/* Content container shifts right on md+ to make room for the fixed image */}
  <div className="mx-auto max-w-4xl px-6 pt-12">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">My Workout Plans</h1>
            <p className="text-sm text-slate-300/80 mt-1">Elegant view of the plans assigned to you. Expand any card to view full details and exercises.</p>
          </div>
          <div>
            <a href="/user-progress-dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold shadow">View my progress</a>
          </div>
        </header>

        <section className="space-y-6">
          <div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your plans"
              className="w-full bg-slate-900/40 backdrop-blur-sm text-white placeholder-slate-400 px-4 py-3 rounded-xl border border-white/6 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-300">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <div className="mt-2">Loading your workout plans...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-slate-300">No workout plans assigned to you.</div>
          ) : (
            results.map((plan) => (
              <article key={plan._id} className="group rounded-2xl border border-white/6 overflow-hidden shadow-lg transform transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-r from-[#071827] via-[#081f2b] to-[#0b2430]">
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">{plan.planName}</h2>
                      <p className="text-sm text-slate-300 mt-1">{plan.description || ''}</p>
                          <div className="mt-3 text-sm text-slate-200 flex flex-wrap gap-3">
                            <span className="px-3 py-1 rounded-full bg-white/6">Goal: <span className="font-semibold">{plan.goal || '—'}</span></span>
                            <span className="px-3 py-1 rounded-full bg-white/6">Difficulty: <span className="font-semibold">{plan.difficulty || '—'}</span></span>
                            <span className="px-3 py-1 rounded-full bg-white/6">Freq: <span className="font-semibold">{plan.frequency || '—'}</span></span>
                            <span className="px-3 py-1 rounded-full bg-white/6">Duration: <span className="font-semibold">{plan.duration ? `${plan.duration} wk` : '—'}</span></span>
                          </div>
                    </div>

                    <div className="text-right">
                      <div className="mt-3 flex items-center gap-3">
                        <button onClick={() => toggleExpand(plan._id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-500 transition">
                          <span>{expandedIds.includes(plan._id) ? 'Hide' : 'View'}</span>
                          <svg className={`h-4 w-4 transform transition-transform duration-200 ${expandedIds.includes(plan._id) ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedIds.includes(plan._id) && (
                  <div className="border-t border-white/6 p-5 md:p-6 bg-slate-900/30">
                    {loadingDetails[plan._id] ? (
                      <div className="text-slate-300"><Loader2 className="h-5 w-5 animate-spin inline-block mr-2"/> Loading details...</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs text-slate-300/70">Start</div>
                            <div className="text-sm text-white">{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-300/70">End</div>
                            <div className="text-sm text-white">{plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-300/70">Status</div>
                            <div className="text-sm text-white">{plan.status || '—'}</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white">Exercises</h4>
                          <div className="mt-3 space-y-3">
                            {(planDetails[plan._id]?.exercises || []).map((ex) => (
                              <div key={ex.exercise?._id || ex.id || JSON.stringify(ex)} className="p-3 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 border border-white/5">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="font-semibold text-white">{ex.exercise?.name || ex.name}</div>
                                    <div className="text-xs text-slate-300/70">{ex.exercise?.muscleGroup || ex.muscleGroup || ''}</div>
                                    {ex.exercise?.metValue && <div className="text-xs text-slate-300/60 mt-1">MET: {ex.exercise.metValue}</div>}
                                  </div>
                                  <div className="text-right text-sm text-slate-300/80">
                                    {ex.sets ? <div>{ex.sets} sets • {ex.reps} reps</div> : null}
                                    {ex.duration ? <div>{ex.duration} mins</div> : null}
                                  </div>
                                </div>
                                {ex.notes && <div className="mt-2 text-xs text-slate-300/70">Notes: {ex.notes}</div>}
                              </div>
                            ))}
                            {!((planDetails[plan._id]?.exercises || []).length) && (
                              <div className="text-sm text-slate-300/70">No exercises listed for this plan.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default UserWorkoutPlans;
