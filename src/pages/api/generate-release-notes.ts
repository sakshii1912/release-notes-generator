import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { repositoryUrl } = req.body;

  if (!repositoryUrl) {
    return res.status(400).json({ message: "Repository URL is required" });
  }

  try {
    // Extract owner and repo name from the GitHub URL
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ message: "Invalid GitHub repository URL" });
    }

    const [_, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;

    // Fetch releases from GitHub API
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "AI-Release-Notes" },
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: "Failed to fetch release notes" });
    }

    const releases = await response.json();

    // Extract only important details
    const formattedReleases = releases.map((release: any) => ({
      name: release.name || release.tag_name,
      published_at: release.published_at,
      body: release.body || "No description available.",
      html_url: release.html_url,
    }));

    return res.status(200).json(formattedReleases);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
    return res.status(500).json({ message: "An unknown error occurred." });
  }
}
