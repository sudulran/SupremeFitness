// src/pages/EventPage.jsx - FIXED with proper leaderboard redirect
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../config/gymConfig";
import { toast } from "react-toastify";
import { Link, useParams, useNavigate } from "react-router-dom";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : { headers: {} };
};

const EventPage = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [myScore, setMyScore] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // FIX: Check if eventId is valid
  useEffect(() => {
    if (!eventId || eventId === "undefined") {
      toast.error("Invalid event ID");
      navigate("/events");
      return;
    }
  }, [eventId, navigate]);

  // FIXED: Fetch single event by ID
  const fetchEvent = async () => {
    try {
      setLoading(true);
      console.log(`Fetching event: ${backendUrl}/events/${eventId}`);
      
      const res = await axios.get(`${backendUrl}/events/${eventId}`, {
        timeout: 5000,
      });
      
      if (res.data.success) {
        setEvent(res.data.event);
      } else {
        toast.error("Event not found");
        navigate("/events");
      }
    } catch (err) {
      console.error("Fetch event error:", err);
      
      if (err.response?.status === 404) {
        toast.error("Event not found");
        navigate("/events");
      } else if (err.code === 'ERR_NETWORK') {
        toast.error("Cannot connect to server");
      } else {
        toast.error("Failed to load event");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMyScore = async () => {
    // FIX: Add validation
    if (!eventId || eventId === "undefined") {
      setScoreLoading(false);
      return;
    }

    try {
      setScoreLoading(true);
      const res = await axios.get(`${backendUrl}/events/${eventId}/my-progress`, getAuthHeaders());
      if (res.data?.success) {
        setMyScore(res.data.participant?.score ?? 0);
      } else {
        setMyScore(null);
      }
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.error("Fetch my score error:", err);
      }
      setMyScore(null);
    } finally {
      setScoreLoading(false);
    }
  };

  useEffect(() => {
    if (eventId && eventId !== "undefined") {
      fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!loading && token && eventId && eventId !== "undefined") {
      fetchMyScore();
    }
  }, [loading, eventId]);

  const handleEnroll = async () => {
    // FIX: Add validation
    if (!eventId || eventId === "undefined") {
      toast.error("Invalid event ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.info("Please login to enroll.");
        navigate("/login");
        return;
      }
      
      setEnrolling(true);
      const res = await axios.post(`${backendUrl}/events/${eventId}/enroll`, {}, getAuthHeaders());
      
      if (res.data.success) {
        toast.success("You are enrolled! 🎉");
        await fetchMyScore(); // Refresh score after enrollment
      } else if (res.data.message?.toLowerCase().includes("already")) {
        toast.info("You are already enrolled in this event.");
        await fetchMyScore();
      } else {
        toast.error(res.data.message || "Failed to enroll");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to enroll";
      if (msg.toLowerCase().includes("already")) {
        toast.info("You are already enrolled in this event.");
        await fetchMyScore();
      } else {
        toast.error(msg);
      }
    } finally {
      setEnrolling(false);
    }
  };

  // Handle leaderboard navigation
  const handleViewLeaderboard = () => {
    navigate(`/leaderboard/${eventId}`);
  };

  // Show loading if eventId is invalid
  if (!eventId || eventId === "undefined") {
    return (
      <div className="px-4 md:px-12 lg:px-24 py-10 bg-gray-900 min-h-screen text-white">
        <div className="max-w-5xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold">Event Not Found</h1>
          <p className="text-gray-400">The event ID is invalid.</p>
          <Link to="/events" className="inline-block bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg">
            ← Back to all events
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 md:px-12 lg:px-24 py-10 bg-gray-900 min-h-screen text-white">
        <div className="max-w-5xl mx-auto animate-pulse space-y-6">
          <div className="h-8 w-40 bg-gray-700 rounded"></div>
          <div className="h-40 bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="px-4 md:px-12 lg:px-24 py-10 bg-gray-900 min-h-screen text-white">
        <div className="max-w-5xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold">Event Not Found</h1>
          <p className="text-gray-400">This event could not be found.</p>
          <Link to="/events" className="inline-block bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg">
            ← Back to all events
          </Link>
        </div>
      </div>
    );
  }

  const dateStr = event?.date ? new Date(event.date).toDateString() : "";
  const typeLabel = event?.type || "event";

  return (
    <div className="px-4 md:px-12 lg:px-24 py-10 bg-gray-900 min-h-screen text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link to="/events" className="text-sm text-gray-400 hover:text-gray-200">← Back to events</Link>

        <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50 shadow-lg">
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
              <span className="text-[11px] uppercase tracking-wide rounded-full border border-gray-700 px-2 py-0.5 text-gray-300 bg-gray-800/60">
                {typeLabel}
              </span>
            </div>
            <p className="text-gray-300">{event.description}</p>
            <p className="text-sm text-gray-400">{dateStr}</p>
            <p className="text-sm text-gray-400">
              Time: {event.startTime} - {event.endTime}
            </p>

            {/* Enrollment Section */}
            <div className="pt-4">
              {myScore === null ? (
                <div>
                  <button
                    disabled={enrolling}
                    onClick={handleEnroll}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition ${
                      enrolling ? "bg-orange-800 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    {enrolling ? "Enrolling…" : "Enroll Now"}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    Login required to enroll in this event
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">My Score</div>
                      <div className="text-2xl font-bold">
                        {scoreLoading ? "…" : myScore}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-600 text-green-100 text-xs rounded-full">
                      Enrolled
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Scores are set by admins. You can track your placement on the leaderboard.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default EventPage;