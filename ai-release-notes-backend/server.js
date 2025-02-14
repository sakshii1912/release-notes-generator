const express = require("express"); // Import Express framework
const axios = require("axios"); // Import Axios for making HTTP requests
const cors = require("cors"); // Import CORS to handle cross-origin requests
require("dotenv").config(); // Load environment variables from .env file
//const bodyParser = require("body-parser");

const app = express(); // Initialize Express application
const PORT = process.env.PORT || 5000; // Define port from environment variables or default to 5000

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON parsing for incoming requests
//app.use(bodyParser.json()); 
//app.use(bodyParser.urlencoded({ extended: true })); 

// Helper function to categorize PRs (Features, Fixes, Chores)
function categorizePR(pr) {
  if (pr.title.toLowerCase().includes("bug")) {
    return "🐞 Bug Fixes";
  } else if (pr.title.toLowerCase().includes("feature")) {
    return "🚀 Features";
  } else if (pr.state === "closed" && pr.merged_at) {
    return "⚙️ Chores";
  } else {
    return "📝 Others";
  }
}

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

// API endpoint to fetch GitHub repository timeline
app.post("/api/fetch-timeline", async (req, res) => {
  const { repositoryUrl } = req.body;

  if (!repositoryUrl) {
    return res.status(400).json({ message: "Repository URL is required" });
  }

  try {
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ message: "Invalid GitHub repository URL" });
    }

    const [_, owner, repo] = match;
    const headers = {
      "User-Agent": "AI-Release-Notes",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    };

    const [commitsResponse, prsResponse, issuesResponse, releasesResponse, contributorsResponse] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=10`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/issues?per_page=10`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/releases`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/contributors`, { headers }),
    ]);

    const commits = commitsResponse.data.map(commit => ({
      type: "commit",
      icon: "📜",
      name: "Commit",
      message: commit.commit.message,
      author: commit.commit.author?.name || "Unknown",
      date: commit.commit.author?.date,
      url: commit.html_url,
    }));

    const prs = prsResponse.data.map(pr => ({
      type: "pull_request",
      icon: pr.state === "closed" && pr.merged_at ? "🐞" : "⚙️",
      name: "Pull Request",
      title: pr.title,
      author: pr.user?.login || "Unknown",
      merged_at: pr.merged_at || pr.created_at,
      date: pr.merged_at || pr.created_at,
      url: pr.html_url,
      category: categorizePR(pr),
    }));

    const issues = issuesResponse.data.map(issue => ({
      type: "issue",
      icon: issue.labels.some(label => label.name.toLowerCase() === "bug") ? "🐞" : "⚠️",
      name: "Issue",
      title: issue.title,
      author: issue.user?.login || "Unknown",
      created_at: issue.created_at,
      date: issue.created_at,
      url: issue.html_url,
    }));

    const releases = releasesResponse.data.map(release => ({
      type: "release",
      icon: "🔖",
      name: "Release",
      published_at: release.published_at,
      date: release.published_at,
      url: release.html_url,
    }));

    const contributors = contributorsResponse.data.map(contributor => ({
      type: "contributor",
      icon: "👥",
      name: "Contributor",
      contributorName: contributor.login,
      contributions: contributor.contributions,
      date: null,
      url: contributor.html_url,
    }));

    const timeline = [...commits, ...prs, ...issues, ...releases, ...contributors];

    const sortedTimeline = timeline.sort((a, b) => {
      const dateA = new Date(a.date || a.merged_at || a.published_at || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.merged_at || b.published_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });

    res.status(200).json({ timeline: sortedTimeline });
  } catch (error) {
    console.error("❌ Error fetching data:", error.response?.data || error.message);
    res.status(500).json({
      message: "Failed to fetch repository timeline",
      error: error.response?.data || error.message,
    });
  }
});



// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
