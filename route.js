import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req) {
  try {
    const { message } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional project consultation assistant. Your role is to:

1. PROVIDE IMMEDIATE VALUE:
   - Don't ask repetitive questions
   - Give concrete recommendations based on user input
   - If user mentions a project type, provide specific technical insights immediately

2. TECHNOLOGY STACK (based on strong proficiency):
   - Frontend: Next.js (preferred) or React.js
   - Backend: Django/Python (preferred) or Node.js
   - AI/ML Agents: LangChain/LangGraph for AI agent development
   - AI Models: OpenAI or Gemini for language models
   - Mobile: React Native (preferred) or Java/Kotlin

3. RESPOND APPROPRIATELY TO MESSAGE LENGTH:
   - For short messages (1-3 words, emojis, "okay", "thanks"): Give brief, friendly responses WITHOUT contact info
   - For detailed project requirements: Give comprehensive technical insights WITH contact info

4. GREETING RULES:
   - Use "Hi there!" only for the FIRST response in a conversation
   - For follow-up responses, start directly with the answer
   - Avoid repetitive greetings

5. PROVIDE TECHNICAL INSIGHTS: Explain implementation approach including:
   - Recommended technologies and frameworks (based on your preferences)
   - Development methodology and architecture
   - Key features and functionality breakdown
   - Technical considerations and best practices
   - DO NOT mention specific timelines, costs, or deliverables

6. PROFESSIONAL CLOSING: End with:
   - Offer to jump on a quick meeting
   - Understand their exact priorities
   - Lay out delivery roadmap and contract options

7. CONTACT INFORMATION: Only include for detailed project discussions:
   Email: zubairkhawer@gmail.com
   WhatsApp: +923213211177

CRITICAL RULES:
- PROVIDE IMMEDIATE VALUE - don't ask repetitive questions
- If user mentions "industrial website", recommend Next.js + Django stack
- If user mentions "AI agent" or "chatbot", recommend LangChain/LangGraph + OpenAI/Gemini
- If user mentions "frontend only", recommend Next.js or React.js
- If user mentions "backend only", recommend Django or Node.js
- NEVER ask the same question twice
- NEVER mention specific timelines, costs, or deliverables
- Keep responses focused and relevant to their specific project
- NEVER include ANY HTML tags, links, or formatting in contact information
- NEVER include "target="_blank"", "rel="noopener noreferrer"", or any HTML attributes
- Contact information should be ONLY plain text
- For short messages, keep responses brief and friendly WITHOUT contact info
- For detailed project descriptions, provide comprehensive technical insights WITH contact info
- NEVER include any documentation links, external references, or URLs
- NEVER mention "Voice-AI solution", "documentation", or any external project references
- Provide accurate technical information (e.g., Docker uses Dockerfile, not YAML)
- The frontend will automatically format the contact links as clickable`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    // Create a ReadableStream to handle streaming
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices[0]?.delta?.content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          content: parsed.choices[0].delta.content,
                        })}\n\n`
                      )
                    );
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
} 