// src/pages/MyEnrollments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../config";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : { headers: {} };
};

const CardSkeleton = () => (
  <div className="rounded-2xl border border-gray-800 bg-gray-800/40 p-6 animate-pulse">
    <div className="h-6 w-1/2 bg-gray-700 rounded mb-3"></div>
    <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
    <div className="h-4 w-2/3 bg-gray-700 rounded mb-4"></div>
    <div className="h-8 w-40 bg-gray-700 rounded"></div>
  </div>
);

const MyEnrollments = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchMy = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/events/my`, getAuthHeaders());
      setItems(res.data?.events || []);
    } catch (err) {
      console.error("Fetch my enrollments error:", err);
      if (err?.response?.status === 401) {
        toast.info("Please login to view your enrollments.");
        navigate("/login");
      } else {
        toast.error("Failed to load your enrollments");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMy(); }, []);

  const handleUnenroll = async (eventId) => {
    if (!window.confirm("Unenroll from this event?")) return;
    try {
      setBusyId(eventId);
      const res = await axios.delete(`${backendUrl}/api/events/${eventId}/enroll`, getAuthHeaders());
      if (res.data?.success) {
        toast.success(res.data.message || "Unenrolled");
        fetchMy();
      } else {
        toast.error(res.data?.message || "Failed to unenroll");
      }
    } catch (err) {
      console.error("Unenroll error:", err);
      toast.error(err?.response?.data?.message || "Failed to unenroll");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="px-4 md:px-12 lg:px-24 py-10 bg-gray-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold">My Enrollments</h1>
          <div className="flex gap-3">
            <Link to="/events" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg">Browse Events</Link>
            <Link to="/leaderboard" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg">Leaderboards</Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !items.length ? (
          <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-6">
            <p className="text-gray-300 mb-3">You haven’t enrolled in any events yet.</p>
            <Link to="/events" className="inline-block bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg">
              Find an Event →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((ev) => {
              const dateStr = ev?.date ? new Date(ev.date).toDateString() : "";
              const typeLabel = ev?.type || "event";
              const myScore = ev?.my?.score ?? 0;

              return (
                <div
                  key={ev._id}
                  className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-transform"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{ev.title}</h3>
                      <span className="text-[11px] uppercase tracking-wide rounded-full border border-gray-700 px-2 py-0.5 text-gray-300 bg-gray-800/60">
                        {typeLabel}
                      </span>
                      <span className="ml-auto text-xs bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-gray-300">
                        My Score: <span className="font-semibold">{myScore}</span>
                      </span>
                    </div>
                    <p className="text-gray-300">{ev.description}</p>
                    <p className="text-xs text-gray-400">{dateStr}</p>

                    <div className="pt-2 flex gap-3">
                      <Link
                        to={`/events/${ev._id}`}
                        className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-medium"
                      >
                        Open
                      </Link>
                      <Link
                        to="/leaderboard"
                        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
                      >
                        Leaderboard
                      </Link>
                      <button
                        disabled={busyId === ev._id}
                        onClick={() => handleUnenroll(ev._id)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          busyId === ev._id ? "bg-red-800 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {busyId === ev._id ? "Unenrolling…" : "Unenroll"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEnrollments;
