import React, { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import styles from "./ReleaseNotesForm.module.css";
import autoTable from "jspdf-autotable";

// Define types for the response data
interface TimelineEvent {
  type: string;
  icon: string;
  name: string;
  author?: string;
  message?: string;
  title?: string;
  number?: number;
  url: string;
  date?: string;  // Optional
  merged_at?: string;  // Optional
  published_at?: string;  // Optional
  created_at?: string;  // Optional
}

interface ReleaseNotesData {
  timeline: TimelineEvent[];
}

const ReleaseNotesForm: React.FC = () => {
  const [repositoryUrl, setRepositoryUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<ReleaseNotesData | null>(null);
  const [error, setError] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch("http://localhost:5000/api/fetch-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl }),
      });

      const responseData = await response.json();
      if (response.ok) {
        setData(responseData);
      } else {
        setError(responseData.message || "Failed to fetch data");
      }
    } catch (err) {
      setError("An error occurred while fetching data");
    }

    setLoading(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAuthor(e.target.value);
  };

  const filteredData = data?.timeline.filter((event) => {
    const eventDate = new Date(event.date || event.merged_at || event.published_at || event.created_at || 0);
    const fromDateCheck = fromDate ? eventDate >= new Date(fromDate) : true;
    const toDateCheck = toDate ? eventDate <= new Date(toDate) : true;
  
    const matchesSearch = searchText
      ? event.message?.toLowerCase().includes(searchText.toLowerCase()) ||
        event.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        event.author?.toLowerCase().includes(searchText.toLowerCase())
      : true;
  
    const matchesAuthor = selectedAuthor
      ? event.author?.toLowerCase() === selectedAuthor.toLowerCase()
      : true;
  
    return matchesSearch && matchesAuthor && fromDateCheck && toDateCheck;
  });
  

  
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" }); // Set landscape mode for better width
    doc.setFontSize(16);
    doc.text("Release Notes", 14, 15);
  
    const tableColumn = ["Event Type", "Author", "Message", "Date", "URL"];
    const tableRows: any[] = [];
  
    if (filteredData && filteredData.length > 0) {
      filteredData.forEach((event) => {
        const rowData = [
          event.type === "commit" ? "Commit" : event.type === "pull_request" ? "Pull Request" : event.type,
          event.author || "N/A",
          event.message || event.title || "No message",
          formatDate(event.date || event.merged_at || event.published_at || event.created_at),
          event.url,
        ];
        tableRows.push(rowData);
      });
  
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        styles: { fontSize: 10, cellPadding: 4, overflow: "linebreak", cellWidth: "wrap" }, // Wrapped text
        headStyles: { fillColor: [17, 149, 195], textColor: 255, fontStyle: "bold" }, // Header color
        alternateRowStyles: { fillColor: [240, 240, 240] }, // Light gray alternating rows
        columnStyles: {
          0: { cellWidth: 30 }, // Event Type
          1: { cellWidth: 40 }, // Author
          2: { cellWidth: 90 }, // Message (wrapped)
          3: { cellWidth: 30 }, // Date
          4: { cellWidth: 80 }, // URL (wrapped)
        },
        margin: { top: 20, left: 10, right: 10 }, // Adjust margins
      });
  
    } else {
      doc.text("No events available", 14, 30);
    }
  
    doc.save("release_notes.pdf");
  };
    

  return (
    <motion.div
      className={styles.formContainer}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.inputSection}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <GitBranch size={20} className={styles.icon} />
            <input
              type="text"
              id="repositoryUrl"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              className={styles.formInput}
              placeholder="Enter GitHub Repository URL..."
              required
            />
          </div>
          <button type="submit" className={styles.formButton} disabled={loading}>
            {loading ? <Loader2 className={styles.loader} /> : "Fetch Repository Timeline 🚀"}
          </button>
        </form>
      </div>

      {data && (
        <div className={styles.filtersSection}>
          <input
            type="text"
            placeholder="Search events..."
            value={searchText}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />

          <select
            value={selectedAuthor}
            onChange={handleAuthorChange}
            className={styles.filterSelect}
          >
            <option value="">Filter by Author</option>
            {data.timeline
              .map((event) => event.author)
              .filter((author, index, self) => self.indexOf(author) === index)
              .map((author, index) => (
                <option key={index} value={author}>
                  {author}
                </option>
              ))}
          </select>

          <div className={styles.dateFilter}>
            <label htmlFor="fromDate"></label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={styles.dateInput}
            />
            <label htmlFor="toDate"></label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {filteredData && (
        <div className={styles.releaseNotesContainer}>
          <h3>📜 Repository Timeline</h3>
          <ul className={styles.timelineList}>
            {filteredData.length > 0 ? (
              filteredData.map((event, index) => (
                <li key={index} className={styles.timelineItem}>
                  <div className={styles.leftSide}>
                    <span className={styles.eventIcon}>{event.icon}</span>
                    <div><strong className={styles.eventType}>
                      {event.type === "commit"
                        ? "Commit"
                        : event.type === "pull_request"
                        ? "Pull Request"
                        : event.type}
                    </strong>
                    </div>
                    <div>
                    <strong className={styles.eventAuthor}>{event.author}</strong>:{" "}</div>
                    {event.message || event.title}
                  
                  </div>
                        <strong><div><span className={styles.eventDate}>
                      {formatDate(event.date || event.merged_at || event.published_at || event.created_at)}
                    </span>
                        </div></strong>
                  <div className={styles.rightSide}>
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.eventLink}
                    >
                      View {event.type}
                    </a>
                  </div>
                </li>
              ))
            ) : (
              <p>No events to display</p>
            )}
          </ul>

          <button
            onClick={generatePDF}
            className={styles.exportButton}
            disabled={filteredData?.length === 0}
          >
            Export as PDF
          </button>
        </div>
      )}
    </motion.div>
  );
};


export default ReleaseNotesForm;  