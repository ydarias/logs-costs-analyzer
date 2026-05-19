import { useState, useCallback } from "react";
import { THEME } from "../lib/theme.js";

/**
 * Drag-and-drop (or click-to-browse) zone for CSV uploads.
 *
 * @param {{ onFiles: (files: File[]) => void }} props
 */
export default function DropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.endsWith(".csv")
      );
      onFiles(files);
    },
    [onFiles]
  );

  const handleInput = (e) => onFiles(Array.from(e.target.files));

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("csv-input").click()}
      style={{
        border: `2px dashed ${dragging ? THEME.accent : THEME.border}`,
        borderRadius: 16,
        padding: "56px 32px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? THEME.accentSoft + "33" : "transparent",
        transition: "all .2s",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: THEME.text,
          marginBottom: 8,
        }}
      >
        Drop IBM Cloud Logs CSV files here
      </div>
      <div style={{ color: THEME.muted, fontSize: 14 }}>
        Data Usage exports from Settings → Data Usage → Export as CSV
        <br />
        Multiple files accepted — they'll be merged automatically
      </div>
      <input
        id="csv-input"
        type="file"
        accept=".csv"
        multiple
        hidden
        onChange={handleInput}
      />
    </div>
  );
}
