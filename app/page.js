"use client";
import { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Page() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState(1);

  // add Section Handlers
  const addTextSection = () => {
    setSections([...sections, { id: sectionId, type: "text", content: "" }]);
    setSectionId(sectionId + 1);
  };

  const addImageSection = () => {
    setSections([...sections, { id: sectionId, type: "image", content: "" }]);
    setSectionId(sectionId + 1);
  };

  const addTableSection = () => {
    setSections([
      ...sections,
      {
        id: sectionId,
        type: "table",
        headers: ["Header1"],
        rows: [[""]],
      },
    ]);
    setSectionId(sectionId + 1);
  };

  const addGraphSection = () => {
    setSections([
      ...sections,
      {
        id: sectionId,
        type: "graph",
        kind: "bar",
        data: [0, 0, 0],
        labels: ["A", "B", "C"],
      },
    ]);
    setSectionId(sectionId + 1);
  };

  // content Change Handlers
  const handleContentChange = (id, value) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, content: value } : s))
    );
  };

  const handleImageUpload = (id, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleContentChange(id, reader.result);
    };
    reader.readAsDataURL(file);
  };

  // table handlers
  const updateTableHeader = (sectionId, index, value) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId && s.type === "table") {
          const newHeaders = [...s.headers];
          newHeaders[index] = value;
          return { ...s, headers: newHeaders };
        }
        return s;
      })
    );
  };

  const updateTableCell = (sectionId, rowIndex, colIndex, value) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId && s.type === "table") {
          const newRows = s.rows.map((row, i) =>
            i === rowIndex
              ? row.map((cell, j) => (j === colIndex ? value : cell))
              : row
          );
          return { ...s, rows: newRows };
        }
        return s;
      })
    );
  };

  const addTableRow = (sectionId) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId && s.type === "table") {
          const newRow = new Array(s.headers.length).fill("");
          return { ...s, rows: [...s.rows, newRow] };
        }
        return s;
      })
    );
  };

  const addTableColumn = (sectionId) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId && s.type === "table") {
          const newHeaders = [...s.headers, `Header${s.headers.length + 1}`];
          const newRows = s.rows.map((row) => [...row, ""]);
          return { ...s, headers: newHeaders, rows: newRows };
        }
        return s;
      })
    );
  };

  // graph handlers
  const updateGraphData = (sectionId, index, value) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId && s.type === "graph") {
          const newData = [...s.data];
          newData[index] = Number(value) || 0;
          return { ...s, data: newData };
        }
        return s;
      })
    );
  };

  const updateGraphLabel = (sectionId, index, value) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId && s.type === "graph") {
          const newLabels = [...s.labels];
          newLabels[index] = value;
          return { ...s, labels: newLabels };
        }
        return s;
      })
    );
  };

  // layout config for backend
  const saveLayout = async () => {
    if (!title || sections.length === 0) {
      alert("Please enter a title and add at least one section.");
      return;
    }
    const layout_config = {};
    sections.forEach((s, i) => {
      if (s.type === "table") {
        layout_config[`section${i + 1}`] = {
          type: s.type,
          headers: s.headers,
          rows: s.rows,
        };
      } else if (s.type === "graph") {
        layout_config[`section${i + 1}`] = {
          type: s.type,
          kind: s.kind,
          data: s.data,
          labels: s.labels,
        };
      } else {
        layout_config[`section${i + 1}`] = { type: s.type, content: s.content };
      }
    });

    const payload = { title, description, layout_config };
    console.log("Sending:", payload);

    const res = await fetch("http://localhost:8000/api/layouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Save failed:", error);
      alert("Save failed. Check console.");
    }
  };

  const loadLayout = async (id) => {
    const res = await fetch(`http://localhost:8000/api/layouts/${id}`);
    if (!res.ok) {
      alert("Failed to load layout.");
      return;
    }
    const data = await res.json();
    setTitle(data.title);
    setDescription(data.description);

    const entries = Object.entries(data.layout_config || {});
    setSections(
      entries.map(([_, val], idx) => {
        if (val.type === "table") {
          return {
            id: idx + 1,
            type: val.type,
            headers: val.headers || ["Header1"],
            rows: val.rows || [[""]],
          };
        }
        if (val.type === "graph") {
          return {
            id: idx + 1,
            type: val.type,
            kind: val.kind || "bar",
            data: val.data || [0, 0, 0],
            labels: val.labels || ["A", "B", "C"],
          };
        }
        return {
          id: idx + 1,
          type: val.type,
          content: val.content,
        };
      })
    );
    setSectionId(entries.length + 1);
  };

  const populateSampleData = () => {
    setTitle("Sample Report");
    setDescription("Sample report with all section types.");

    setSections([
      { id: 1, type: "text", content: "Sample text content." },
      {
        id: 2,
        type: "image",
        content:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA" +
          "AAAFCAYAAACNbyblAAAAHElEQVQI12P4" +
          "//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
      },
      {
        id: 3,
        type: "table",
        headers: ["Product", "Revenue"],
        rows: [
          ["A", "100"],
          ["B", "200"],
        ],
      },
      {
        id: 4,
        type: "graph",
        kind: "bar",
        labels: ["Q1", "Q2", "Q3"],
        data: [10, 20, 30],
      },
    ]);
    setSectionId(5);
  };

  return (
    <main style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Reporting Tool</h1>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%" }}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%" }}
      />

      <div style={{ marginBottom: "10px" }}>
        <input
          type="number"
          placeholder="Enter Layout ID"
          onChange={(e) => loadLayout(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button onClick={addTextSection}>Add Text</button>
        <button onClick={addImageSection} style={{ marginLeft: "10px" }}>
          Add Image
        </button>
        <button onClick={addTableSection} style={{ marginLeft: "10px" }}>
          Add Table
        </button>
        <button onClick={addGraphSection} style={{ marginLeft: "10px" }}>
          Add Graph
        </button>
        <button onClick={populateSampleData} style={{ marginLeft: "10px" }}>
          Populate Sample
        </button>
      </div>

      {sections.map((section) => {
        if (section.type === "text") {
          return (
            <textarea
              key={section.id}
              value={section.content}
              onChange={(e) => handleContentChange(section.id, e.target.value)}
              placeholder="Text section"
              style={{
                display: "block",
                marginBottom: "10px",
                width: "100%",
                minHeight: "60px",
              }}
            />
          );
        }

        if (section.type === "image") {
          return (
            <div key={section.id} style={{ marginBottom: "10px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(section.id, e.target.files[0])
                }
              />
              {section.content && (
                <img
                  src={section.content}
                  alt="Uploaded"
                  style={{
                    display: "block",
                    marginTop: "10px",
                    maxWidth: "100%",
                  }}
                />
              )}
            </div>
          );
        }

        if (section.type === "table") {
          return (
            <div
              key={section.id}
              style={{
                marginBottom: "20px",
                border: "1px solid #ccc",
                padding: "10px",
                overflowX: "auto",
              }}
            >
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    {section.headers.map((header, idx) => (
                      <th
                        key={idx}
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                        }}
                      >
                        <input
                          value={header}
                          onChange={(e) =>
                            updateTableHeader(section.id, idx, e.target.value)
                          }
                          style={{ width: "100%" }}
                        />
                      </th>
                    ))}
                    <th>
                      <button onClick={() => addTableColumn(section.id)}>
                        + Col
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          style={{
                            border: "1px solid #ddd",
                            padding: "8px",
                          }}
                        >
                          <input
                            value={cell}
                            onChange={(e) =>
                              updateTableCell(
                                section.id,
                                rowIndex,
                                colIndex,
                                e.target.value
                              )
                            }
                            style={{ width: "100%" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => addTableRow(section.id)}>+ Row</button>
            </div>
          );
        }

        if (section.type === "graph") {
          const data = {
            labels: section.labels,
            datasets: [
              {
                label: "Dataset",
                data: section.data,
                backgroundColor: "rgba(75,192,192,0.6)",
              },
            ],
          };

          return (
            <div key={section.id} style={{ marginBottom: "20px" }}>
              <Bar data={data} />
              <div>
                {section.labels.map((label, idx) => (
                  <input
                    key={`label-${idx}`}
                    value={label}
                    onChange={(e) =>
                      updateGraphLabel(section.id, idx, e.target.value)
                    }
                    placeholder="Label"
                    style={{ marginRight: "5px" }}
                  />
                ))}
              </div>
              <div>
                {section.data.map((value, idx) => (
                  <input
                    key={`data-${idx}`}
                    type="number"
                    value={value}
                    onChange={(e) =>
                      updateGraphData(section.id, idx, e.target.value)
                    }
                    style={{ marginRight: "5px", width: "60px" }}
                  />
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}

      <button onClick={saveLayout}>Save Layout</button>
    </main>
  );
}
