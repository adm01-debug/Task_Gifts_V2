import { supabase } from "@/integrations/supabase/client";

export interface QuizOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizQuestion {
  id: string;
  quiz_type: string;
  question: string;
  explanation: string | null;
  points: number;
  difficulty: string;
  department_id: string | null;
  category: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  options?: QuizOption[];
}

export interface CreateQuestionData {
  quiz_type: string;
  question: string;
  explanation?: string;
  points?: number;
  difficulty?: string;
  department_id?: string | null;
  category?: string;
  options: { text: string; is_correct: boolean }[];
}

export interface UpdateQuestionData extends Partial<Omit<CreateQuestionData, 'options'>> {
  is_active?: boolean;
  options?: { id?: string; text: string; is_correct: boolean }[];
}

export const quizQuestionsService = {
  async getQuestions(filters?: { 
    quiz_type?: string; 
    department_id?: string;
    is_active?: boolean;
  }): Promise<QuizQuestion[]> {
    let query = supabase
      .from('quiz_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.quiz_type) {
      query = query.eq('quiz_type', filters.quiz_type);
    }
    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getQuestionWithOptions(questionId: string): Promise<QuizQuestion | null> {
    const { data: question, error: qError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .maybeSingle();

    if (qError) throw qError;
    if (!question) return null;

    const { data: options, error: oError } = await supabase
      .from('quiz_options')
      .select('*')
      .eq('question_id', questionId)
      .order('order_index');

    if (oError) throw oError;

    return { ...question, options: options || [] };
  },

  async getQuestionsWithOptions(filters?: { 
    quiz_type?: string; 
    is_active?: boolean;
    limit?: number;
  }): Promise<QuizQuestion[]> {
    let query = supabase
      .from('quiz_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.quiz_type) {
      query = query.eq('quiz_type', filters.quiz_type);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data: questions, error } = await query;
    if (error) throw error;
    if (!questions?.length) return [];

    // Fetch options for all questions
    const { data: allOptions, error: oError } = await supabase
      .from('quiz_options')
      .select('*')
      .in('question_id', questions.map(q => q.id))
      .order('order_index');

    if (oError) throw oError;

    // Map options to questions
    const optionsMap: Record<string, QuizOption[]> = {};
    allOptions?.forEach(opt => {
      if (!optionsMap[opt.question_id]) {
        optionsMap[opt.question_id] = [];
      }
      optionsMap[opt.question_id].push(opt);
    });

    return questions.map(q => ({
      ...q,
      options: optionsMap[q.id] || []
    }));
  },

  async createQuestion(data: CreateQuestionData): Promise<QuizQuestion> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create question
    const { data: question, error: qError } = await supabase
      .from('quiz_questions')
      .insert({
        quiz_type: data.quiz_type,
        question: data.question,
        explanation: data.explanation || null,
        points: data.points || 100,
        difficulty: data.difficulty || 'easy',
        department_id: data.department_id || null,
        category: data.category || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (qError) throw qError;

    // Create options
    if (data.options?.length) {
      const optionsToInsert = data.options.map((opt, index) => ({
        question_id: question.id,
        text: opt.text,
        is_correct: opt.is_correct,
        order_index: index,
      }));

      const { error: oError } = await supabase
        .from('quiz_options')
        .insert(optionsToInsert);

      if (oError) throw oError;
    }

    return question;
  },

  async updateQuestion(questionId: string, data: UpdateQuestionData): Promise<QuizQuestion> {
    const updateData: Record<string, unknown> = {};
    
    if (data.quiz_type !== undefined) updateData.quiz_type = data.quiz_type;
    if (data.question !== undefined) updateData.question = data.question;
    if (data.explanation !== undefined) updateData.explanation = data.explanation;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.department_id !== undefined) updateData.department_id = data.department_id;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const { data: question, error: qError } = await supabase
      .from('quiz_questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .maybeSingle();

    if (qError) throw qError;
    if (!question) throw new Error('Question not found');

    if (qError) throw qError;

    // Update options if provided
    if (data.options) {
      // Delete existing options
      await supabase
        .from('quiz_options')
        .delete()
        .eq('question_id', questionId);

      // Insert new options
      const optionsToInsert = data.options.map((opt, index) => ({
        question_id: questionId,
        text: opt.text,
        is_correct: opt.is_correct,
        order_index: index,
      }));

      const { error: oError } = await supabase
        .from('quiz_options')
        .insert(optionsToInsert);

      if (oError) throw oError;
    }

    return question;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;
  },

  async toggleActive(questionId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('quiz_questions')
      .update({ is_active: isActive })
      .eq('id', questionId);

    if (error) throw error;
  },
};

/**
 * Alternativa exibida ao jogador — sem o gabarito (`is_correct`).
 * O gabarito nunca trafega para o cliente antes da resposta ser enviada.
 */
export interface QuizPlayOption {
  id: string;
  text: string;
  order_index: number;
}

export interface QuizPlayQuestion {
  id: string;
  quiz_type: string;
  question: string;
  explanation: string | null;
  points: number;
  difficulty: string;
  category: string | null;
  department_id: string | null;
  created_at: string;
  options: QuizPlayOption[];
}

export interface QuizGradeResult {
  is_correct: boolean;
  correct_option_id: string | null;
  explanation: string | null;
}

export const quizPlayService = {
  /** Busca o conjunto jogável (perguntas + alternativas) sem expor o gabarito. */
  async getPlaySet(quizType: string, limit = 10): Promise<QuizPlayQuestion[]> {
    const { data, error } = await supabase.rpc('get_quiz_play_set', {
      p_quiz_type: quizType,
      p_limit: limit,
    });
    if (error) throw error;
    return ((data as unknown as QuizPlayQuestion[]) || []).map((q) => ({
      ...q,
      options: q.options || [],
    }));
  },

  /** Corrige a resposta no servidor e devolve o gabarito somente após o envio. */
  async gradeAnswer(questionId: string, optionId: string): Promise<QuizGradeResult> {
    const { data, error } = await supabase.rpc('grade_quiz_answer', {
      p_question_id: questionId,
      p_option_id: optionId,
    });
    if (error) throw error;
    return data as unknown as QuizGradeResult;
  },

  /** Ajuda 50/50: devolve até duas alternativas incorretas. */
  async fiftyFifty(questionId: string): Promise<string[]> {
    const { data, error } = await supabase.rpc('quiz_fifty_fifty', {
      p_question_id: questionId,
    });
    if (error) throw error;
    return (data as string[] | null) || [];
  },
};
