import { useEffect, useState, useCallback } from "react";
import "./App.css";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function App() {
  const [poed, setPoed] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedTime, setSelectedTime] = useState(() => new Date().toTimeString().split(" ")[0]);
  const [selectedDay, setSelectedDay] = useState(dayNames[new Date().getDay()]);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchJson = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const loadPoed = useCallback(async () => {
    const data = await fetchJson("https://localhost:7011/api/Pood");
    setPoed(data || []);
  }, []);

  useEffect(() => { loadPoed(); }, [loadPoed]);

  const getStoreState = (graafik, dayIndex, time) => {
    const g = graafik?.find(x => x.paev === dayIndex);
    if (!g) return { state: "closed", untilOpen: "-", untilClose: "-" };

    const [h, m, s] = time.split(":").map(Number);
    const nowSec = h * 3600 + m * 60 + s;

    if (g.avatudAlates === "00:00:00" && g.avatudKuni === "00:00:00") {
      return { state: "holiday", untilOpen: "-", untilClose: "-" };
    }

    const [fromH, fromM, fromS] = g.avatudAlates.split(":").map(Number);
    const fromSec = fromH * 3600 + fromM * 60 + fromS;
    const [toH, toM, toS] = g.avatudKuni.split(":").map(Number);
    const toSec = toH * 3600 + toM * 60 + toS;

    if (nowSec >= fromSec && nowSec < toSec) {
      const diff = toSec - nowSec;
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      return { state: "open", untilOpen: "-", untilClose: `${hours}h ${minutes}m` };
    } else {
      const diff = nowSec < fromSec ? fromSec - nowSec : 24 * 3600 - nowSec + fromSec;
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      return { state: "closed", untilOpen: `${hours}h ${minutes}m`, untilClose: "-" };
    }
  };

  const getRowColor = (p) => {
    const dayIndex = dayNames.indexOf(selectedDay);
    const g = p.graafik?.find(x => x.paev === dayIndex);
    if (!g) return "#f0f0f0";

    const [h, m, s] = selectedTime.split(":").map(Number);
    const nowSec = h * 3600 + m * 60 + s;

    if (g.avatudAlates === "00:00:00" && g.avatudKuni === "00:00:00") return "#d3d3d3"; // puhkus

    const [fromH, fromM, fromS] = g.avatudAlates.split(":").map(Number);
    const fromSec = fromH * 3600 + fromM * 60 + fromS;
    const [toH, toM, toS] = g.avatudKuni.split(":").map(Number);
    const toSec = toH * 3600 + toM * 60 + toS;

    if (nowSec >= fromSec && nowSec < toSec) {
      if (toSec - nowSec <= 3600) return "#ffa500"; // varsti sulgub
      return "#90ee90"; // avatud
    } else if (fromSec - nowSec <= 3600 && fromSec - nowSec > 0) {
      return "#ffff99"; // varsti avaneb
    }
    return "#f0f0f0"; // suletud
  };

  const filteredPoed = poed.filter(p => {
    const dayIndex = dayNames.indexOf(selectedDay);
    const g = p.graafik?.find(x => x.paev === dayIndex);
    if (!g) return false;

    const stateObj = getStoreState(p.graafik, dayIndex, selectedTime);
    if (statusFilter !== "all" && stateObj.state !== statusFilter) return false;
    return true;
  });

  const selectedPoed = poed.find(p => p.nimi === selectedStore);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", background: "#f9f9f9" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>Pood</h1>

      {/* Filtrid */}
      <div style={{ marginBottom: "20px" }}>
        <label>Vali pood: </label>
        <select style={filterStyle} value={selectedStore} onChange={e => setSelectedStore(e.target.value)}>
          <option value="">-- vali --</option>
          {poed.map(p => <option key={p.id} value={p.nimi}>{p.nimi}</option>)}
        </select>

        <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} style={{ marginLeft: "10px" }} />

        <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} style={{ marginLeft: "5px" }}>
          {dayNames.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ marginLeft: "10px" }}>
          <option value="all">Kõik</option>
          <option value="open">Avatud</option>
          <option value="closed">Suletud</option>
          <option value="holiday">Puhkus</option>
          <option value="soonOpen">Varsti avaneb</option>
          <option value="soonClose">Varsti sulgub</option>
        </select>

        <button
          style={{ ...btnStyle, marginLeft: "10px", background: "#f44336" }}
          onClick={() => {
            setSelectedStore("");
            setSelectedDay(dayNames[new Date().getDay()]);
            setSelectedTime(new Date().toTimeString().split(" ")[0]);
            setStatusFilter("all");
          }}
        >
          Lähtesta filtrid
        </button>
      </div>

      {/* Legend */}
      <div style={{ marginBottom: "10px" }}>
        <span style={{ backgroundColor: "#90ee90", padding: "3px 6px", marginRight: "5px" }}>Avatud</span>
        <span style={{ backgroundColor: "#f0f0f0", padding: "3px 6px", marginRight: "5px" }}>Suletud</span>
        <span style={{ backgroundColor: "#ffff99", padding: "3px 6px", marginRight: "5px" }}>Varsti avaneb</span>
        <span style={{ backgroundColor: "#ffa500", padding: "3px 6px", marginRight: "5px" }}>Varsti sulgub</span>
        <span style={{ backgroundColor: "#d3d3d3", padding: "3px 6px", marginRight: "5px" }}>Puhkus</span>
      </div>

      {/* Pood tabel */}
      <h2>Kõik poed</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={theadStyle}>
            <th style={thStyle}>Nimi</th>
            <th style={thStyle}>TananePaev</th>
            <th style={thStyle}>PraeguneAeg</th>
            <th style={thStyle}>OnAvatud</th>
            <th style={thStyle}>Avamiseni</th>
            <th style={thStyle}>Sulgemiseni</th>
          </tr>
        </thead>
        <tbody>
          {filteredPoed.map(p => {
            const stateObj = getStoreState(p.graafik, dayNames.indexOf(selectedDay), selectedTime);
            return (
              <tr key={p.id} style={{ ...trStyle, backgroundColor: getRowColor(p) }}>
                <td style={tdStyle}>{p.nimi}</td>
                <td style={tdStyle}>{selectedDay}</td>
                <td style={tdStyle}>{selectedTime}</td>
                <td style={tdStyle}>{stateObj.state === "open" ? "Avatud" : stateObj.state === "holiday" ? "Puhkus" : "Suletud"}</td>
                <td style={tdStyle}>{stateObj.untilOpen}</td>
                <td style={tdStyle}>{stateObj.untilClose}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Graafik tabel */}
      {selectedPoed && (
        <>
          <h2 style={{ marginTop: "20px" }}>{selectedPoed.nimi} Graafik</h2>
          <table style={tableStyle}>
            <thead>
              <tr style={theadStyle}>
                <th style={thStyle}>Paev</th>
                <th style={thStyle}>AvatudAlates</th>
                <th style={thStyle}>AvatudKuni</th>
              </tr>
            </thead>
            <tbody>
              {selectedPoed.graafik.map(g => {
                const isHoliday = g.avatudAlates === "00:00:00" && g.avatudKuni === "00:00:00";
                return (
                  <tr key={g.id} style={{ ...trStyle, backgroundColor: isHoliday ? "#d3d3d3" : "#90ee90" }}>
                    <td style={tdStyle}>{dayNames[g.paev]}</td>
                    <td style={tdStyle}>{isHoliday ? "Puhkus" : g.avatudAlates}</td>
                    <td style={tdStyle}>{isHoliday ? "Puhkus" : g.avatudKuni}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// Stiilid
const tableStyle = { width: "100%", borderCollapse: "collapse", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", marginTop: "10px" };
const theadStyle = { background: "#4CAF50", color: "white" };
const trStyle = { background: "#fff", borderBottom: "1px solid #ddd" };
const thStyle = { border: "1px solid #ddd", padding: "10px", textAlign: "center" };
const tdStyle = { border: "1px solid #ddd", padding: "8px", textAlign: "center" };
const btnStyle = { marginLeft: "5px", padding: "5px 10px", background: "#4CAF50", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" };
const filterStyle = { padding: "5px 10px", borderRadius: "4px", border: "1px solid #ccc", marginLeft: "10px" };

export default App;
