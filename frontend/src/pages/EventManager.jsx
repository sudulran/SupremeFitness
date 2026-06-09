// src/pages/EventManager.jsx
import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/api";
import { backendUrl } from "../config/gymConfig";
import StoreAdminSidebar from '../components/StoreAdminSidebar';

const EventManager = () => {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    date: "", 
    startTime: "",
    endTime: "",
    type: "event",
    image: null 
  });

  // Slide-over Edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ 
    title: "", 
    description: "", 
    date: "", 
    startTime: "",
    endTime: "",
    type: "event",
    image: null 
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Participants panel
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);

  const fetchEvents = async () => {
    try {
      const res = await api.get(`/events`);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error("Fetch events error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch events");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // --------- Create form ---------
  const handleCreateChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateEventForm = (data) => {
    const { title, description, date, startTime, endTime } = data;
    
    if (!title.trim()) {
      toast.error("Title is required");
      return false;
    }
    
    if (!description.trim()) {
      toast.error("Description is required");
      return false;
    }
    
    if (!date) {
      toast.error("Date is required");
      return false;
    }
    
    if (!startTime) {
      toast.error("Start time is required");
      return false;
    }
    
    if (!endTime) {
      toast.error("End time is required");
      return false;
    }
    
    // Validate time logic
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return false;
    }
    
    // Validate event is not in the past
    const now = new Date();
    if (startDateTime < now) {
      toast.error("Event cannot be scheduled in the past");
      return false;
    }
    
    return true;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEventForm(formData)) {
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('date', formData.date);
      submitData.append('startTime', formData.startTime);
      submitData.append('endTime', formData.endTime);
      submitData.append('type', formData.type);
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const res = await api.post(`/events`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        toast.success("Event created successfully");
        setFormData({ 
          title: "", 
          description: "", 
          date: "", 
          startTime: "",
          endTime: "",
          type: "event",
          image: null 
        });
        // Clear file input
        const fileInput = document.querySelector('input[name="image"]');
        if (fileInput) fileInput.value = '';
        fetchEvents();
      }
    } catch (err) {
      console.error("Save event error:", err);
      toast.error(err.response?.data?.message || "Failed to save event");
    }
  };

  // --------- Edit slide-over handlers ---------
  const openEdit = (event) => {
    setEditId(event._id);
    const eventDate = event.date ? new Date(event.date).toISOString().slice(0, 10) : "";
    
    setEditForm({
      title: event.title || "",
      description: event.description || "",
      date: eventDate,
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      type: event.type || "event",
      image: null,
      existingImage: event.image || null
    });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setTimeout(() => {
      setEditId(null);
      setEditForm({ 
        title: "", 
        description: "", 
        date: "", 
        startTime: "",
        endTime: "",
        type: "event",
        image: null 
      });
    }, 250);
  };

  const handleEditChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setEditForm({ ...editForm, [name]: files[0] });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEventForm(editForm)) {
      return;
    }

    try {
      setSavingEdit(true);
      const submitData = new FormData();
      submitData.append('title', editForm.title);
      submitData.append('description', editForm.description);
      submitData.append('date', editForm.date);
      submitData.append('startTime', editForm.startTime);
      submitData.append('endTime', editForm.endTime);
      submitData.append('type', editForm.type);
      if (editForm.image) {
        submitData.append('image', editForm.image);
      }

      const res = await api.put(`/events/${editId}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        toast.success("Event updated successfully");
        closeEdit();
        fetchEvents();
      } else {
        toast.error(res.data?.message || "Failed to update event");
      }
    } catch (err) {
      console.error("Update event error:", err);
      toast.error(err.response?.data?.message || "Failed to update event");
    } finally {
      setSavingEdit(false);
    }
  };

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isEditOpen) closeEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditOpen]);

  // --------- Delete event ---------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      const res = await api.delete(`/events/${id}`);
      if (res.data.success) toast.success("Event deleted");
      fetchEvents();
    } catch (err) {
      console.error("Delete event error:", err);
      toast.error(err.response?.data?.message || "Failed to delete event");
    }
  };

  // --------- Participants panel ---------
  const handleViewParticipants = async (event) => {
    setSelectedEvent(event);
    try {
      const res = await api.get(`/events/${event._id}/leaderboard`);
      setParticipants(res.data.leaderboard || []);
    } catch (err) {
      console.error("Fetch participants error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch participants");
    }
  };

  const handleScoreChange = async (participantId, newScore) => {
  if (!selectedEvent) return;
  try {
    const res = await api.put(
      `/events/${selectedEvent._id}/participants/${participantId}`,
      { score: newScore }
    );
    if (res.data.success) toast.success("Score updated!");
    handleViewParticipants(selectedEvent);
  } catch (err) {
    console.error("Update score error:", err);
    toast.error(err.response?.data?.message || "Failed to update score");
  }
};

const handleRemoveParticipant = async (participantId) => {
  if (!selectedEvent) return;
  if (!window.confirm("Remove this participant from the event?")) return;
  try {
    const res = await api.delete(`/events/${selectedEvent._id}/participants/${participantId}`);
    if (res.data.success) {
      toast.success("Participant removed");
      handleViewParticipants(selectedEvent);
    }
  } catch (err) {
    console.error("Remove participant error:", err);
    toast.error(err.response?.data?.message || "Failed to remove participant");
  }
};

  // Format time for display
  const formatEventTime = (event) => {
    if (!event.startTime || !event.endTime) {
      return new Date(event.date).toDateString();
    }
    return `${new Date(event.date).toDateString()} • ${event.startTime} - ${event.endTime}`;
  };

  // Get image URL (robust)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // absolute URLs (http/https) should be returned as-is
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    // normalize accidental '/public' prefix stored in DB
    const normalized = imagePath.startsWith('/public') ? imagePath.replace(/^\/public/, '') : imagePath;

    // derive origin from backendUrl (e.g. 'http://localhost:8088/api' -> 'http://localhost:8088')
    let backendOrigin = typeof backendUrl === 'string' ? backendUrl : '';
    try {
      backendOrigin = backendOrigin.replace(/\/api\/?$/, '');
    } catch (err) {
      // fallback to window origin (useful in browser)
      backendOrigin = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
    }

    // final URL
    return `${backendOrigin}${normalized}`;
  };

  return (
    <div className="min-h-screen">
      <StoreAdminSidebar />
      <div className="bg-gray-800 p-6 text-white" style={{ marginLeft: 240 }}>
        <h1 className="text-3xl font-bold mb-6">Admin - Event Manager</h1>

      {/* Create Event */}
      <form onSubmit={handleCreateSubmit} className="bg-gray-900 p-6 rounded-xl mb-8 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Create Event</h2>
        
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleCreateChange}
          placeholder="Event Title"
          className="w-full p-3 mb-3 bg-gray-700 rounded-lg"
          required
        />
        
        <textarea
          name="description"
          value={formData.description}
          onChange={handleCreateChange}
          placeholder="Event Description"
          className="w-full p-3 mb-3 bg-gray-700 rounded-lg"
          rows="3"
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleCreateChange}
            className="w-full p-3 bg-gray-700 rounded-lg"
            min={new Date().toISOString().split('T')[0]}
            required
          />
          
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleCreateChange}
            className="w-full p-3 bg-gray-700 rounded-lg"
            required
          />
          
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleCreateChange}
            className="w-full p-3 bg-gray-700 rounded-lg"
            required
          />
        </div>
        
        <select
          name="type"
          value={formData.type}
          onChange={handleCreateChange}
          className="w-full p-3 mb-3 bg-gray-700 rounded-lg"
        >
          <option value="event">Event</option>
          <option value="challenge">Challenge</option>
          <option value="workshop">Workshop</option>
          <option value="competition">Competition</option>
        </select>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Event Image
          </label>
          <input
            type="file"
            name="image"
            onChange={handleCreateChange}
            accept="image/*"
            className="w-full p-3 bg-gray-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">Supported formats: JPG, PNG, WebP (Max 5MB)</p>
        </div>
        
        <button 
          type="submit" 
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Create Event
        </button>
      </form>

      {/* Events list */}
      <h2 className="text-2xl font-bold mb-4">All Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event._id} className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            {event.image && (
              <img 
                src={getImageUrl(event.image)} 
                alt={event.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-xl font-bold">{event.title}</h3>
            <p className="mt-1 text-gray-300">{event.description}</p>
            <p className="text-gray-400 mt-1">
              {formatEventTime(event)} • {event.type}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEdit(event)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(event._id)}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => handleViewParticipants(event)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                View Participants
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Participants */}
      {selectedEvent && (
        <div className="bg-gray-800 p-6 rounded-xl mt-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Participants — {selectedEvent.title}</h2>
          {participants.length === 0 ? (
            <p>No participants yet.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-gray-600 p-2">Name</th>
                  <th className="border-b border-gray-600 p-2">Email</th>
                  <th className="border-b border-gray-600 p-2">Score</th>
                  <th className="border-b border-gray-600 p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p._id} className="border-b border-gray-700">
                    <td className="p-2">{p.name || "Unknown"}</td>
                    <td className="p-2">{p.email || "—"}</td>
                    <td className="p-2">{p.score}</td>
                    <td className="p-2 flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={p.score}
                        onBlur={(e) => handleScoreChange(p._id, Number(e.target.value))}
                        className="w-24 p-2 bg-gray-700 rounded-md text-white"
                      />
                      <button
                        onClick={() => handleRemoveParticipant(p._id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Slide-over Edit Panel */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${isEditOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={closeEdit}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-out ${
          isEditOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isEditOpen}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold">Update Event</h3>
          <button
            onClick={closeEdit}
            className="text-gray-400 hover:text-gray-200"
            aria-label="Close edit panel"
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleEditSubmit} className="p-6 space-y-3">
          <input
            type="text"
            name="title"
            value={editForm.title}
            onChange={handleEditChange}
            placeholder="Title"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
            required
          />
          
          <textarea
            name="description"
            value={editForm.description}
            onChange={handleEditChange}
            placeholder="Description"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
            rows="3"
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="date"
              name="date"
              value={editForm.date}
              onChange={handleEditChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
              min={new Date().toISOString().split('T')[0]}
              required
            />
            
            <input
              type="time"
              name="startTime"
              value={editForm.startTime}
              onChange={handleEditChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
              required
            />
            
            <input
              type="time"
              name="endTime"
              value={editForm.endTime}
              onChange={handleEditChange}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
              required
            />
          </div>
          
          <select
            name="type"
            value={editForm.type}
            onChange={handleEditChange}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <option value="event">Event</option>
            <option value="challenge">Challenge</option>
            <option value="workshop">Workshop</option>
            <option value="competition">Competition</option>
          </select>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Image
            </label>
            {editForm.existingImage && (
              <div className="mb-2">
                <p className="text-sm text-gray-400 mb-1">Current Image:</p>
                <img 
                  src={getImageUrl(editForm.existingImage)} 
                  alt="Current event" 
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <input
              type="file"
              name="image"
              onChange={handleEditChange}
              accept="image/*"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty to keep current image</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeEdit}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className={`px-5 py-2 rounded-lg font-semibold ${
                savingEdit ? "bg-blue-800 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {savingEdit ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer />
    </div>
  </div>
  );
};

export default EventManager;