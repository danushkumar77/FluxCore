import React, { useEffect, useState } from "react";
import { useBess } from "../App";
import { MapPin, Server, Activity, Radio, HelpCircle, HardDrive, Info } from "lucide-react";

export default function AssetManagement() {
  const { telemetry } = useBess();
  const [fleet, setFleet] = useState<any>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("SITE-MOHAVE");
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/battery/assets")
      .then(res => res.json())
      .then(data => setFleet(data))
      .catch(err => console.error("Error loading assets:", err));
  }, [telemetry]);

  const handleNotify = async (containerName: string) => {
    setNotifying(true);
    try {
      await fetch("http://127.0.0.1:8000/alerts/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: "DUMMY" })
      });
      alert(`Ancillary Signal: operator notification transmitted for ${containerName}.`);
    } catch (e) {
      console.error(e);
    } finally {
      setNotifying(false);
    }
  };

  // Mock site list for geographical visualizer
  const sitesInfo = [
    { id: "SITE-MOHAVE", name: "California BESS (Mohave)", cx: 80, cy: 120, soc: telemetry?.soc || 68.0, status: telemetry?.status || "IDLE", color: "var(--energy-cyan)" },
    { id: "SITE-AUSTIN", name: "Texas BESS (Austin)", cx: 160, cy: 150, soc: 65.0, status: "CHARGING", color: "var(--battery-green)" },
    { id: "SITE-NEVADA", name: "Nevada BESS (Nevada)", cx: 85, cy: 90, soc: 90.0, status: "STANDBY", color: "var(--warning-orange)" }
  ];

  const selectedSite = fleet?.sites?.find((s: any) => s.site_id === selectedSiteId) || fleet?.sites?.[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px", height: "calc(100vh - 84px)", overflow: "hidden" }}>
      
      {/* Geolocation SVG Map Visualizer */}
      <div className="mission-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><MapPin size={18} style={{ color: "var(--energy-cyan)" }} /> BESS Fleet Geographic Distribution</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>Geographical representation of active utility BESS installations.</p>
        </div>

        {/* SVG Stylized Map */}
        <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", background: "radial-gradient(circle at 50% 50%, #0d2335, #07141f)", position: "relative", minHeight: "280px" }}>
          
          <svg viewBox="0 0 320 220" style={{ width: "100%", height: "100%" }}>
            {/* Grid line patterns */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Outline of USA boundary representation */}
            <path 
              d="M 40,80 Q 80,60 120,70 T 220,60 T 280,80 Q 290,120 270,160 Q 230,170 190,160 Q 150,180 120,160 Q 90,150 70,160 T 40,110 Z" 
              fill="none" 
              stroke="rgba(0, 200, 255, 0.15)" 
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            
            {/* Connections */}
            <path d="M 80,120 L 160,150 M 80,120 L 85,90" stroke="rgba(0, 200, 255, 0.08)" strokeWidth="1" />
            
            {/* Site Pins */}
            {sitesInfo.map(site => (
              <g 
                key={site.id} 
                onClick={() => setSelectedSiteId(site.id)}
                style={{ cursor: "pointer" }}
              >
                <circle 
                  cx={site.cx} 
                  cy={site.cy} 
                  r="8" 
                  fill={selectedSiteId === site.id ? "rgba(0, 200, 255, 0.2)" : "rgba(255,255,255,0.05)"} 
                  stroke={site.color}
                  strokeWidth="2"
                  style={{ animation: selectedSiteId === site.id ? "pulse 1.5s infinite" : "none" }}
                />
                <circle cx={site.cx} cy={site.cy} r="3" fill={site.color} />
                <text 
                  x={site.cx + 12} 
                  y={site.cy + 4} 
                  fill="var(--text-primary)" 
                  fontSize="7" 
                  fontFamily="Share Tech Mono"
                >
                  {site.name.split(" ")[0]} ({site.soc}%)
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Selected Site Details */}
      <div className="mission-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
        {selectedSite ? (
          <>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "6px" }}><Server size={18} /> {selectedSite.name}</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Location: {selectedSite.location}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem" }}>
              <div className="mission-panel" style={{ padding: "10px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>COMPARTMENTS</span>
                <p className="tech-font" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{selectedSite.containers?.length || 0}</p>
              </div>
              <div className="mission-panel" style={{ padding: "10px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>TOTAL RATED POWER</span>
                <p className="tech-font" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--energy-cyan)" }}>{selectedSite.total_capacity_mwh?.toFixed(1) || "2.0"} MWh</p>
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "10px" }}>Active Container Subsystems:</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflowY: "auto" }}>
              {selectedSite.containers?.map((c: any) => {
                let statusClass = "badge-nominal";
                if (c.status === "DISCHARGING") statusClass = "badge-warning";
                if (c.status === "FAULT") statusClass = "badge-critical";

                return (
                  <div key={c.container_id} className="mission-panel" style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "6px", backgroundColor: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="tech-font" style={{ fontWeight: 600 }}>{c.container_id} <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.75rem" }}>({c.name})</span></span>
                      <span className={`status-badge ${statusClass}`} style={{ fontSize: "0.65rem", padding: "1px 6px" }}>{c.status}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <span>SOC: <strong>{c.soc.toFixed(1)}%</strong> | SOH: <strong style={{ color: "var(--battery-green)" }}>{c.soh.toFixed(1)}%</strong></span>
                      <span>Power: <strong style={{ color: c.active_power_kw > 0 ? "var(--battery-green)" : "var(--text-primary)" }}>{c.active_power_kw.toFixed(0)} kW</strong></span>
                    </div>

                    <div style={{ textAlign: "right", marginTop: "4px" }}>
                      <button 
                        disabled={notifying}
                        onClick={() => handleNotify(c.name)}
                        className="btn-primary" 
                        style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                      >
                        Ping Grid operator
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
            Select an active site on the geographic visualizer.
          </div>
        )}
      </div>

    </div>
  );
}
