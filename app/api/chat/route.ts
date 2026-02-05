import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Create the Supabase client (Next.js 15 requires awaiting createClient)
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name')
    .single();

    // app/api/chat/route.ts
    const result = await streamText({
        model: google('gemini-1.5-flash'),
        messages,
    });

  // This method converts the stream into a format Next.js 15 understands
  return result.toTextStreamResponse();
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 