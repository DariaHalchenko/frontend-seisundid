import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [poed, setPoed] = useState([]);
  const [graafik, setGraafik] = useState([]);
  const [activeTable, setActiveTable] = useState("poed");
  const [timeQuery, setTimeQuery] = useState("12:00:00");
  const [dayQuery, setDayQuery] = useState(1);

  // --- массив дней недели ---
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // --- стили таблиц и кнопок ---
  const tableStyle = {
    border: "1px solid #ddd",
    borderCollapse: "collapse",
    width: "90%",
    margin: "20px auto",
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
  };
  const thStyle = {
    border: "1px solid #ddd",
    padding: "12px",
    backgroundColor: "#04AA6D",
    color: "white",
    textTransform: "uppercase",
  };
  const tdStyle = { border: "1px solid #ddd", padding: "8px", textAlign: "center" };
  const navButton = (isActive) => ({
    padding: "10px 18px",
    marginRight: "10px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    backgroundColor: isActive ? "#04AA6D" : "#e6e6e6",
    color: isActive ? "white" : "#333",
    transition: "all 0.3s ease",
  });
  const navContainer = { margin: "20px auto", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px" };

  // --- функция для безопасного fetch ---
  const fetchJson = async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      } else {
        return await res.text();
      }
    } catch (err) {
      console.error("Fetch error:", err);
      return null;
    }
  };

  // --- загрузка данных ---
  const loadPoed = async () => {
    const data = await fetchJson("https://localhost:7011/api/Pood");
    if (data) setPoed(data);
  };

  const loadGraafik = async () => {
    const data = await fetchJson("https://localhost:7011/api/PaevaGraafik");
    if (data) setGraafik(data);
  };

  useEffect(() => {
    loadPoed();
    loadGraafik();
  }, []);

  // --- действия по кнопкам ---
  const addHour = async (id) => {
    const res = await fetchJson(`https://localhost:7011/api/Pood/${id}/add-hour`, { method: "POST" });
    alert(res);
    loadPoed();
  };

  const addDay = async (id) => {
    const res = await fetchJson(`https://localhost:7011/api/Pood/${id}/add-day`, { method: "POST" });
    alert(res);
    loadPoed();
  };

  const checkTime = async () => {
    const res = await fetchJson(`https://localhost:7011/api/Pood/check-time?time=${timeQuery}`);
    if (res) alert(res.join("\n"));
  };

  const checkDayAndTime = async () => {
    const res = await fetchJson(`https://localhost:7011/api/Pood/check?day=${dayQuery}&time=${timeQuery}`);
    if (res) alert(res.join("\n"));
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h1 style={{ marginTop: "20px", color: "#333" }}>Pood & PaevaGraafik</h1>

      <nav style={navContainer}>
        <button style={navButton(activeTable === "poed")} onClick={() => setActiveTable("poed")}>Poed</button>
        <button style={navButton(activeTable === "graafik")} onClick={() => setActiveTable("graafik")}>PaevaGraafik</button>
      </nav>

      {/* --- POED --- */}
      {activeTable === "poed" && (
        <div>
          <h2>Poed</h2>
          <div style={{ marginBottom: "10px" }}>
            <input type="time" value={timeQuery} onChange={e => setTimeQuery(e.target.value)} />{" "}
            <input type="number" min="0" max="6" value={dayQuery} onChange={e => setDayQuery(e.target.value)} />
            <button onClick={checkTime}>Check Time</button>
            <button onClick={checkDayAndTime}>Check Day & Time</button>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Nimi</th>
                <th style={thStyle}>TananePaev</th>
                <th style={thStyle}>PraeguneAeg</th>
                <th style={thStyle}>OnAvatud</th>
                <th style={thStyle}>Tegevused</th>
              </tr>
            </thead>
            <tbody>
              {poed.map(p => (
                <tr key={p.id}>
                  <td style={tdStyle}>{p.id}</td>
                  <td style={tdStyle}>{p.nimi}</td>
                  <td style={tdStyle}>{weekdays[p.tananePaev]}</td>
                  <td style={tdStyle}>{p.praeguneAeg}</td>
                  <td style={tdStyle}>{p.onAvatud ? "Jah" : "Ei"}</td>
                  <td style={tdStyle}>
                    <button onClick={() => addHour(p.id)}>+1 tund</button>{" "}
                    <button onClick={() => addDay(p.id)}>+1 päev</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- PAEVAGRAAFIK --- */}
      {activeTable === "graafik" && (
        <div>
          <h2>PaevaGraafik</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>PoodId</th>
                <th style={thStyle}>Paev</th>
                <th style={thStyle}>AvatudAlates</th>
                <th style={thStyle}>AvatudKuni</th>
              </tr>
            </thead>
            <tbody>
              {graafik.map(g => (
                <tr key={`${g.poodId}-${g.paev}`}>
                  <td style={tdStyle}>{g.poodId}</td>
                  <td style={tdStyle}>{weekdays[g.paev]}</td>
                  <td style={tdStyle}>{g.avatudAlates || "-"}</td>
                  <td style={tdStyle}>{g.avatudKuni || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
