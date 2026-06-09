// src/pages/EventsList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../config/gymConfig";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const EventCardSkeleton = () => (
  <div className="rounded-2xl border border-gray-800 bg-gray-800/40 p-6 animate-pulse">
    <div className="h-6 w-1/2 bg-gray-700 rounded mb-3"></div>
    <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
    <div className="h-4 w-2/3 bg-gray-700 rounded mb-4"></div>
    <div className="h-8 w-24 bg-gray-700 rounded"></div>
  </div>
);

const EventCard = ({ ev }) => {
  const dateStr = ev?.date ? new Date(ev.date).toDateString() : "";
  const typeLabel = ev?.type || "event";

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-transform overflow-hidden">
      {/* Event Image */}
      {ev.image && (
        <div className="w-full h-48 overflow-hidden">
          <img 
            src={`http://localhost:8088${ev.image}`} 
            alt={ev.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">{ev.title}</h3>
          <span className="text-[11px] uppercase tracking-wide rounded-full border border-gray-700 px-2 py-0.5 text-gray-300 bg-gray-800/60">
            {typeLabel}
          </span>
        </div>
        <p className="text-gray-300">{ev.description}</p>
        <p className="text-xs text-gray-400">
          {dateStr} {ev.startTime && ev.endTime && `• ${ev.startTime} - ${ev.endTime}`}
        </p>
        <div className="pt-2 flex gap-3">
          <Link
            to={`/events/${ev._id}`}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-medium"
          >
            View & Enroll
          </Link>
          <Link
            to="/leaderboard"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
};

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/events`);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error("Fetch events error:", err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const split = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];
    for (const e of events) {
      const isUpcoming = e?.date ? new Date(e.date) >= now : false;
      (isUpcoming ? upcoming : past).push(e);
    }
    return { upcoming, past };
  }, [events]);

  return (
    <div className="px-4 md:px-12 lg:px-24 py-10 bg-gray-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold">All Events</h1>
          <Link
            to="/leaderboard"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
          >
            View Leaderboards →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : !events.length ? (
          <p className="text-gray-400">No events available.</p>
        ) : (
          <>
            {!!split.upcoming.length && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-200">Upcoming</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {split.upcoming.map((ev) => (
                    <EventCard key={ev._id} ev={ev} />
                  ))}
                </div>
              </section>
            )}

            {!!split.past.length && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-200">Past</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {split.past.map((ev) => (
                    <EventCard key={ev._id} ev={ev} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsList;