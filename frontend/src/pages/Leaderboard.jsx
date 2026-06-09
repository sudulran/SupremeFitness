// src/pages/Leaderboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../config/gymConfig";

const medalForRank = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

const LeaderTable = ({ leaders }) => {
  if (!leaders || leaders.length === 0) {
    return <p className="text-gray-400">No participants yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full border-collapse text-left">
        <thead className="bg-gray-800/60">
          <tr className="border-b border-gray-800">
            <th className="py-3 px-4">Rank</th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Email</th>
            <th className="py-3 px-4">Score</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((p, i) => {
            const rank = i + 1;
            const medal = medalForRank(rank);
            return (
              <tr key={p._id || `${p.name}-${i}`} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="py-3 px-4 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-6 inline-block text-center">{rank}</span>
                    {medal && <span className="text-lg">{medal}</span>}
                  </span>
                </td>
                <td className="py-3 px-4">{p.name || "Unknown"}</td>
                <td className="py-3 px-4">{p.email || "—"}</td>
                <td className="py-3 px-4 font-bold">{p.score ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const WinnersStrip = ({ leaders }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {[0, 1, 2].map((i) => {
      const p = leaders?.[i];
      const medal = medalForRank(i + 1);
      return (
        <div
          key={i}
          className="rounded-lg border border-gray-800 bg-gray-900/60 p-4 flex items-center justify-between shadow-inner"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{medal || "—"}</span>
            <div>
              <div className="font-semibold">{p?.name || "TBD"}</div>
              <div className="text-xs text-gray-400">{p?.email || ""}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Score</div>
            <div className="text-lg font-bold">{p?.score ?? 0}</div>
          </div>
        </div>
      );
    })}
  </div>
);

const Tabs = ({ value, onChange, counts }) => {
  const items = [
    { key: "all", label: `All (${counts.all})` },
    { key: "upcoming", label: `Upcoming (${counts.upcoming})` },
    { key: "past", label: `Past (${counts.past})` },
  ];
  return (
    <div className="inline-flex rounded-lg border border-gray-800 overflow-hidden shadow">
      {items.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-sm transition-colors ${
            value === t.key
              ? "bg-orange-600 text-white"
              : "bg-gray-800/40 text-gray-300 hover:bg-gray-800/70"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

const Controls = ({ search, setSearch, type, setType }) => (
  <div className="flex flex-col md:flex-row gap-3 md:items-center">
    <div className="flex-1">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search events by title…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600"
      />
    </div>
    <div>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
      >
        <option value="all">All types</option>
        <option value="event">Event</option>
        <option value="challenge">Challenge</option>
      </select>
    </div>
  </div>
);

// Chevron icon with rotation
const Chevron = ({ open }) => (
  <svg
    className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 12a1 1 0 0 1-.707-.293l-4-4a1 1 0 1 1 1.414-1.414L10 9.586l3.293-3.293a1 1 0 0 1 1.414 1.414l-4 4A1 1 0 0 1 10 12z"
      clipRule="evenodd"
    />
  </svg>
);

// PDF Download Button Component with client-side generation
const DownloadPDFButton = ({ event, leaders }) => {
  const [loading, setLoading] = useState(false);

  const downloadPDF = async () => {
    if (!event?._id || !leaders || leaders.length === 0) return;
    
    setLoading(true);
    try {
      // Dynamically import jspdf and jspdf-autotable
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text(`${event.title} - Leaderboard`, 105, 15, { align: 'center' });
      
      // Event details
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      
      const details = [];
      if (event.date) {
        details.push(`Date: ${new Date(event.date).toDateString()}`);
      }
      if (event.startTime && event.endTime) {
        details.push(`Time: ${event.startTime} - ${event.endTime}`);
      }
      if (event.type) {
        details.push(`Type: ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`);
      }
      
      if (details.length > 0) {
        doc.text(details.join(' • '), 105, 25, { align: 'center' });
      }
      
      // Generate timestamp
      const timestamp = new Date().toLocaleString();
      doc.setFontSize(10);
      doc.text(`Generated on: ${timestamp}`, 105, 32, { align: 'center' });
      
      // Prepare table data
      const tableData = leaders.map((participant, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        return [
          `${rank} ${medal}`,
          participant.name || 'Unknown',
          participant.email || '—',
          participant.score?.toString() || '0'
        ];
      });
      
      // Add table
      doc.autoTable({
        startY: 40,
        head: [['Rank', 'Name', 'Email', 'Score']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Rank
          1: { cellWidth: 60 }, // Name
          2: { cellWidth: 70 }, // Email
          3: { cellWidth: 25 }, // Score
        },
        margin: { left: 15, right: 15 }
      });
      
      // Add summary
      const finalY = doc.lastAutoTable.finalY + 10;
      if (finalY < 280) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text(`Total Participants: ${leaders.length}`, 15, finalY);
        
        if (leaders.length > 0) {
          const topScore = leaders[0]?.score || 0;
          const avgScore = leaders.reduce((sum, p) => sum + (p.score || 0), 0) / leaders.length;
          doc.text(`Top Score: ${topScore}`, 15, finalY + 7);
          doc.text(`Average Score: ${avgScore.toFixed(1)}`, 15, finalY + 14);
        }
      }
      
      // Save PDF
      const fileName = `leaderboard-${event.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'event'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback: Try using simple window.print() method
      try {
        const printContent = generatePrintableHTML(event, leaders);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      } catch (fallbackError) {
        console.error('Fallback print also failed:', fallbackError);
        alert('Failed to generate PDF. Please try again or use browser print (Ctrl+P).');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate printable HTML as fallback
  const generatePrintableHTML = (event, leaders) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${event.title} - Leaderboard</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            .event-info { text-align: center; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { margin-top: 20px; padding: 10px; background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>${event.title} - Leaderboard</h1>
          <div class="event-info">
            ${event.date ? `<p>Date: ${new Date(event.date).toDateString()}</p>` : ''}
            ${event.startTime && event.endTime ? `<p>Time: ${event.startTime} - ${event.endTime}</p>` : ''}
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          ${leaders.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                ${leaders.map((participant, index) => {
                  const rank = index + 1;
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                  return `
                    <tr>
                      <td>${rank} ${medal}</td>
                      <td>${participant.name || 'Unknown'}</td>
                      <td>${participant.email || '—'}</td>
                      <td>${participant.score || 0}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <div class="summary">
              <p><strong>Total Participants:</strong> ${leaders.length}</p>
              ${leaders.length > 0 ? `
                <p><strong>Top Score:</strong> ${leaders[0]?.score || 0}</p>
                <p><strong>Average Score:</strong> ${(leaders.reduce((sum, p) => sum + (p.score || 0), 0) / leaders.length).toFixed(1)}</p>
              ` : ''}
            </div>
          ` : '<p>No participants yet.</p>'}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;
  };

  return (
    <button
      onClick={downloadPDF}
      disabled={loading || !leaders || leaders.length === 0}
      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors text-white text-sm"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating PDF...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  );
};

const Leaderboard = ({ eventId }) => {
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [leadersByEvent, setLeadersByEvent] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const now = useMemo(() => new Date(), []);

  const loadEvents = async () => {
    if (eventId) {
      const evRes = await axios.get(`${backendUrl}/events/${eventId}`);
      const ev = evRes.data?.event ? [evRes.data.event] : [];
      setEvents(ev);
      setExpanded(eventId);
    } else {
      const res = await axios.get(`${backendUrl}/events`);
      const list = Array.isArray(res.data?.events) ? res.data.events : [];
      setEvents(list);
    }
  };

  const loadLeaderboard = async (id) => {
    setLeadersByEvent((s) => ({ ...s, [id]: { loading: true, error: "", leaders: s[id]?.leaders || [] } }));
    try {
      const res = await axios.get(`${backendUrl}/events/${id}/leaderboard`);
      const leaders = Array.isArray(res.data?.leaderboard) ? res.data.leaderboard : [];
      setLeadersByEvent((s) => ({ ...s, [id]: { loading: false, error: "", leaders } }));
    } catch (e) {
      console.error("Leaderboard fetch failed:", e);
      setLeadersByEvent((s) => ({ ...s, [id]: { loading: false, error: "Failed to load leaderboard.", leaders: [] } }));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setPageLoading(true);
        setPageError("");
        await loadEvents();
      } catch (e) {
        setPageError("Failed to load events.");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [eventId]);

  const toggleExpand = async (id) => {
    const willExpand = expanded !== id ? id : null;
    setExpanded(willExpand);
    if (willExpand && !leadersByEvent[willExpand]) {
      await loadLeaderboard(willExpand);
    }
  };

  const counts = useMemo(() => {
    const base = { all: 0, upcoming: 0, past: 0 };
    events.forEach((ev) => {
      base.all += 1;
      const isUpcoming = ev?.date ? new Date(ev.date) >= now : false;
      if (isUpcoming) base.upcoming += 1;
      else base.past += 1;
    });
    return base;
  }, [events, now]);

  const filteredEvents = useMemo(() => {
    if (eventId) return events;
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      const isUpcoming = ev?.date ? new Date(ev.date) >= now : false;
      if (activeTab === "upcoming" && !isUpcoming) return false;
      if (activeTab === "past" && isUpcoming) return false;
      if (type !== "all" && (ev?.type || "event").toLowerCase() !== type) return false;
      if (q && !(ev?.title || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, eventId, activeTab, type, search, now]);

  if (pageLoading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (pageError) return <div className="p-6 text-red-400">{pageError}</div>;

  return (
    <div className="px-4 md:px-12 lg:px-24 py-10 bg-gray-900 text-white min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page header + controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          {!eventId && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <Tabs value={activeTab} onChange={setActiveTab} counts={counts} />
              <Controls search={search} setSearch={setSearch} type={type} setType={setType} />
            </div>
          )}
        </div>

        {/* Event accordion cards */}
        {(eventId ? events : filteredEvents).map((ev) => {
          const id = ev._id;
          const isOpen = expanded === id;
          const node = leadersByEvent[id] || { loading: false, error: "", leaders: [] };
          const dateStr = ev?.date ? new Date(ev.date).toDateString() : "";
          const typeLabel = ev?.type ? ev.type : "event";

          return (
            <div
              key={id}
              className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50 shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Header / Toggle */}
              <div className="flex items-center justify-between gap-4 p-5">
                <button
                  onClick={() => toggleExpand(id)}
                  className="flex-1 flex items-center justify-between gap-4 hover:bg-gray-800/40 transition-colors rounded-lg p-2 -m-2"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-3">
                      <div className="text-lg md:text-xl font-semibold tracking-tight">{ev.title || "Event"}</div>
                      <span className="text-[11px] uppercase tracking-wide rounded-full border border-gray-700 px-2 py-0.5 text-gray-300 bg-gray-800/60">
                        {typeLabel}
                      </span>
                    </div>
                    {(dateStr || typeLabel) && (
                      <div className="text-xs text-gray-400 mt-1">{dateStr}</div>
                    )}
                  </div>
                  <div className="ml-4 text-gray-400">
                    <Chevron open={isOpen} />
                  </div>
                </button>
                
                {/* PDF Download Button */}
                {isOpen && node.leaders && node.leaders.length > 0 && (
                  <div className="ml-4">
                    <DownloadPDFButton event={ev} leaders={node.leaders} />
                  </div>
                )}
              </div>

              {/* Content */}
              {isOpen && (
                <div className="p-5 pt-0 space-y-4">
                  {node.loading ? (
                    <p className="text-gray-400">Loading leaderboard...</p>
                  ) : node.error ? (
                    <p className="text-red-400">{node.error}</p>
                  ) : (
                    <>
                      <WinnersStrip leaders={node.leaders} />
                      <LeaderTable leaders={node.leaders} />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;