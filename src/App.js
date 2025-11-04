import { useEffect, useState } from "react";
import "./App.css";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function App() {
  const [poed, setPoed] = useState([]);
  const [graafik, setGraafik] = useState([]);
  const [activeTable, setActiveTable] = useState("poed");

  const [filterShop, setFilterShop] = useState(""); // название магазина
  const [filterDay, setFilterDay] = useState(new Date().getDay()); // день недели
  const [filterTime, setFilterTime] = useState("12:00:00"); // текущее время
  const [filterOpen, setFilterOpen] = useState("all"); // all, open, closed

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

  const loadPoed = async () => setPoed(await fetchJson("https://localhost:7011/api/Pood"));
  const loadGraafik = async () => setGraafik(await fetchJson("https://localhost:7011/api/PaevaGraafik"));

  useEffect(() => { loadPoed(); loadGraafik(); }, []);

  const addHour = async (id) => { await fetchJson(`https://localhost:7011/api/Pood/${id}/add-hour`, { method: "POST" }); loadPoed(); };
  const addDay = async (id) => { await fetchJson(`https://localhost:7011/api/Pood/${id}/add-day`, { method: "POST" }); loadPoed(); };

  const isOpenAtTime = (p, day, time) => {
    const g = p.graafik?.find(x => x.paev === day);
    if (!g) return false;
    if (g.avatudAlates === "00:00:00" && g.avatudKuni === "00:00:00") return false;
    const t = time.split(":").map(Number);
    const tTime = t[0] * 3600 + t[1] * 60 + t[2];
    const from = g.avatudAlates.split(":").map(Number);
    const fromTime = from[0] * 3600 + from[1] * 60 + from[2];
    const to = g.avatudKuni.split(":").map(Number);
    const toTime = to[0] * 3600 + to[1] * 60 + to[2];
    return tTime >= fromTime && tTime < toTime;
  };

  // --- фильтрованные данные ---
  const filteredPoed = poed
    .filter(p => !filterShop || p.nimi === filterShop)
    .filter(p => {
      if (filterOpen === "all") return true;
      const open = isOpenAtTime(p, filterDay, filterTime);
      return filterOpen === "open" ? open : !open;
    });

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif" }}>
      <h1>Pood & PaevaGraafik</h1>

      <nav>
        <button onClick={() => setActiveTable("poed")}>Poed</button>
        <button onClick={() => setActiveTable("graafik")}>Graafik</button>
      </nav>

      {activeTable === "poed" && (
        <div>
          <h2>Poed</h2>

          <div>
            <label>Магазин: </label>
            <select value={filterShop} onChange={e => setFilterShop(e.target.value)}>
              <option value="">Все</option>
              {poed.map(p => <option key={p.id} value={p.nimi}>{p.nimi}</option>)}
            </select>

            <label> День недели: </label>
            <select value={filterDay} onChange={e => setFilterDay(Number(e.target.value))}>
              {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>

            <label> Время: </label>
            <input type="time" value={filterTime} onChange={e => setFilterTime(e.target.value)} />

            <label> Статус: </label>
            <select value={filterOpen} onChange={e => setFilterOpen(e.target.value)}>
              <option value="all">Все</option>
              <option value="open">Открытые</option>
              <option value="closed">Закрытые</option>
            </select>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th><th>Название</th><th>День недели</th><th>Время открытия</th><th>Время закрытия</th><th>Статус</th><th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredPoed.map(p => p.graafik?.map(g => (
                <tr key={`${p.id}-${g.paev}`}>
                  <td>{p.id}</td>
                  <td>{p.nimi}</td>
                  <td>{dayNames[g.paev]}</td>
                  <td>{g.avatudAlates === "00:00:00" ? "Выходной" : g.avatudAlates}</td>
                  <td>{g.avatudKuni === "00:00:00" ? "Выходной" : g.avatudKuni}</td>
                  <td>{isOpenAtTime(p, g.paev, filterTime) ? "Открыт" : "Закрыт"}</td>
                  <td>
                    <button onClick={() => addHour(p.id)}>+1 час</button>
                    <button onClick={() => addDay(p.id)}>+1 день</button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}

      {activeTable === "graafik" && (
        <div>
          <h2>Graafik</h2>
          <table>
            <thead>
              <tr>
                <th>Магазин</th><th>День</th><th>AvatudAlates</th><th>AvatudKuni</th>
              </tr>
            </thead>
            <tbody>
              {poed.map(p => p.graafik?.map(g => (
                <tr key={`${p.id}-${g.paev}`}>
                  <td>{p.nimi}</td>
                  <td>{dayNames[g.paev]}</td>
                  <td>{g.avatudAlates}</td>
                  <td>{g.avatudKuni}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
