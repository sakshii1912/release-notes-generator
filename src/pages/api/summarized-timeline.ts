import type { NextApiRequest, NextApiResponse } from "next";

const FASTAPI_URL = "http://localhost:8000"; // FastAPI backend

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${FASTAPI_URL}/summarized-timeline/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({
        error: "Failed to parse error response",
      }));
      return res.status(response.status).json(errorResponse);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
