import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

// CORS configuration for development
app.use(
  cors({
    origin: "http://localhost:3000", // Assuming React client runs on port 3000
    credentials: true,
  })
);
app.use(express.json());

app.post("/api/create-web-call", async (req, res) => {
  if (!process.env.RETELL_API_KEY) {
    return res.status(500).json({ error: "Retell API key not configured" });
  }

  try {
    // Use the create-web-call endpoint
    const retellResponse = await fetch(
      "https://api.retellai.com/v2/create-web-call",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          Accept: "application/json",
        },
        // Updated request body based on documentation
        body: JSON.stringify({
          agent_id: process.env.RETELL_AGENT_ID,
          metadata: req.body.metadata || {}, // Optional metadata object
          retell_llm_dynamic_variables: req.body.dynamicVariables || {}, // Optional dynamic variables
        }),
      }
    );

    const data = await retellResponse.json();

    if (!retellResponse.ok) {
      console.error("Retell API error:", data);
      return res.status(retellResponse.status).json({
        error: data.message || "Failed to create web call",
        details: data,
      });
    }

    // Updated response structure based on documentation
    res.status(201).json({
      access_token: data.access_token,
      agent_id: data.agent_id,
      call_id: data.call_id,
      call_status: data.call_status,
      call_type: data.call_type,
      metadata: data.metadata,
      retell_llm_dynamic_variables: data.retell_llm_dynamic_variables,
      start_timestamp: data.start_timestamp,
    });
  } catch (error) {
    console.error("Error creating web call:", error);
    res.status(500).json({
      error: error.message,
      type: error.type || "unknown",
    });
  }
});

// Updated endpoint to get call details using the correct API endpoint
app.get("/api/call/:callId", async (req, res) => {
  try {
    const callId = req.params.callId;
    const response = await fetch(
      `https://api.retellai.com/v2/get-call/${callId}`, // Note the 'get-call' in the path
      {
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || "Failed to get call details",
        details: data,
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Error getting call details:", error);
    res.status(500).json({
      error: error.message,
      type: error.type || "unknown",
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
