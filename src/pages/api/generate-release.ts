// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ error: "Method not allowed" });
//     }

//     try {
//         const response = await fetch("http://localhost:5000/api/summarize", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(req.body),
//         });

//         const data = await response.json();
//         res.status(200).json(data);
//     } catch (error) {
//         res.status(500).json({ error: "Failed to summarize release notes" });
//     }
// }


import type { NextApiRequest, NextApiResponse } from "next";

const FASTAPI_URL = "http://localhost:8000"; // Update with your backend URL

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${FASTAPI_URL}/api/fetch-timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch timeline from FastAPI");
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
