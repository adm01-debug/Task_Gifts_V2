import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  createRateLimitResponse,
  RATE_LIMITS 
} from "../_shared/rate-limiter.ts";
import { corsHeaders, verifyUser, errorResponse } from "../_shared/security.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const identifier = getRateLimitIdentifier(req, "generate-quiz-questions");
  const rateLimitResult = await checkRateLimit(identifier, RATE_LIMITS.ai);
  
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult.retryAfter || 60, corsHeaders);
  }

  try {
    // Verify user JWT
    await verifyUser(req);
    
    const { trailId, quizType = 'magic_cards', questionCount = 5 } = await req.json();

    if (!trailId) {
      return new Response(
        JSON.stringify({ error: 'Trail ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get trail with modules
    const { data: trail, error: trailError } = await supabase
      .from('learning_trails')
      .select('id, title, description')
      .eq('id', trailId)
      .maybeSingle();

    if (trailError || !trail) {
      console.error('Trail fetch error:', trailError);
      return new Response(
        JSON.stringify({ error: 'Trail not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: modules, error: modulesError } = await supabase
      .from('trail_modules')
      .select('id, title, description, content, content_type')
      .eq('trail_id', trailId)
      .order('order_index');

    if (modulesError) {
      console.error('Modules fetch error:', modulesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch modules' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build content context from trail and modules
    let contentContext = `Trilha: ${trail.title}\n`;
    if (trail.description) contentContext += `Descrição: ${trail.description}\n\n`;

    for (const mod of modules || []) {
      contentContext += `Módulo: ${mod.title}\n`;
      if (mod.description) contentContext += `Descrição: ${mod.description}\n`;
      
      // Extract text content from module content JSON
      if (mod.content && typeof mod.content === 'object') {
        const content = mod.content as Record<string, unknown>;
        if (content.text) contentContext += `Conteúdo: ${content.text}\n`;
        if (content.summary) contentContext += `Resumo: ${content.summary}\n`;
        if (content.key_points && Array.isArray(content.key_points)) {
          contentContext += `Pontos-chave: ${(content.key_points as string[]).join(', ')}\n`;
        }
        if (content.steps && Array.isArray(content.steps)) {
          contentContext += `Passos: ${(content.steps as Array<{title?: string}>).map(s => s.title).filter(Boolean).join(', ')}\n`;
        }
      }
      contentContext += '\n';
    }

    // Content context built from trail and modules

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const difficultyDistribution = quizType === 'millionaire' 
      ? 'Distribua as dificuldades: 2 easy, 2 medium, 1 hard'
      : 'Distribua as dificuldades uniformemente entre easy, medium e hard';

    const systemPrompt = `Você é um especialista em criar perguntas de quiz educacionais para treinamento corporativo.
Crie perguntas baseadas EXCLUSIVAMENTE no conteúdo fornecido. Não invente informações.
As perguntas devem testar o conhecimento prático e aplicável do conteúdo.
Categorize cada pergunta de acordo com o tema principal abordado.`;

    const userPrompt = `Baseado no seguinte conteúdo de treinamento, gere ${questionCount} perguntas de quiz:

${contentContext}

Regras:
1. Cada pergunta deve ter exatamente 4 opções de resposta
2. Apenas UMA opção deve ser correta
3. ${difficultyDistribution}
4. Inclua uma breve explicação para cada resposta correta
5. As perguntas devem ser relevantes para o trabalho prático
6. Atribua uma CATEGORIA para cada pergunta baseada no tema (ex: "Processos", "Produtos", "Técnicas", "Ferramentas", "Segurança", "Atendimento", "Qualidade", etc.)

Retorne APENAS um JSON válido no seguinte formato:
{
  "questions": [
    {
      "question": "Texto da pergunta",
      "difficulty": "easy|medium|hard",
      "category": "Nome da Categoria",
      "explanation": "Explicação da resposta correta",
      "options": [
        { "text": "Opção A", "is_correct": false },
        { "text": "Opção B", "is_correct": true },
        { "text": "Opção C", "is_correct": false },
        { "text": "Opção D", "is_correct": false }
      ]
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty AI response');
      return new Response(
        JSON.stringify({ error: 'Empty response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', jsonContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Questions generated successfully

    return new Response(
      JSON.stringify({
        trail: { id: trail.id, title: trail.title },
        quizType,
        questions: parsedQuestions.questions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quiz-questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
