import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!groqApiKey && !geminiApiKey && !openAiApiKey) {
    return NextResponse.json({ error: "AI service not configured. Please add GROQ_API_KEY to .env.local" }, { status: 500 });
  }

  try {
    if (groqApiKey) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Answer the user's question clearly and concisely in 2–4 sentences. Be accurate, informative, and direct.",
            },
            {
              role: "user",
              content: question,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("Groq API error:", errData);
        return NextResponse.json(
          { error: errData?.error?.message || "Groq API request failed." },
          { status: 500 }
        );
      }

      const data = await response.json();
      const answer =
        data?.choices?.[0]?.message?.content?.trim() ??
        "No answer could be generated.";

      return NextResponse.json({ answer });
    } else if (geminiApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Answer the following question clearly and concisely in 2–4 sentences. Be accurate, informative, and direct.\n\nQuestion: ${question}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        console.error("Gemini API error:", errData);
        return NextResponse.json(
          { error: errData?.error?.message || "Gemini API request failed." },
          { status: 500 }
        );
      }

      const data = await response.json();
      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        "No answer could be generated.";

      return NextResponse.json({ answer });
    }
  } catch (err) {
    console.error("AI answer error:", err);
    return NextResponse.json(
      { error: "Failed to generate AI answer." },
      { status: 500 }
    );
  }
}
