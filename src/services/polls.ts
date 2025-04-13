import { supabase } from './supabase';
import { logActivity } from './activity';
import { isUserAdmin } from './moderation';
import { Poll as PollType, PollOption as PollOptionType, PollVote as PollVoteType } from '../types/services';

// Define interfaces for the polls feature
export type PollCreate = Omit<PollType, 'id' | 'created_at' | 'user'>;

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  created_at: string;
}

export interface Poll {
  id: string;
  post_id: string;
  user_id: string;
  question: string;
  created_at: string;
  ends_at: string | null;
  is_multiple_choice: boolean;
  options: PollOption[];
  user_voted?: boolean;
}

export interface PollVote {
  id: string;
  user_id: string;
  poll_id: string;
  option_id: string;
  created_at: string;
}

// Create a new poll
export const createPoll = async (userId: string, poll: PollCreate) => {
  try {
    // First create the poll
    const { data, error } = await supabase
      .from('polls')
      .insert({
        user_id: userId,
        question: poll.question,
        ends_at: poll.ends_at,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity(userId, 'create_poll' as any, data.id);

    return data;
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

// Get a poll by post ID
export const getPollByPostId = async (postId: string, userId?: string) => {
  try {
    // Get the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        post_id,
        user_id,
        question,
        created_at,
        ends_at,
        is_multiple_choice
      `)
      .eq('post_id', postId)
      .single();

    if (pollError) throw pollError;
    if (!poll) return { data: null, error: null };

    // Get the options
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select(`
        id,
        poll_id,
        option_text,
        created_at
      `)
      .eq('poll_id', poll.id);

    if (optionsError) throw optionsError;

    // Check if the user has voted
    let userVoted = false;
    if (userId) {
      const { data: votes, error: votesError } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', poll.id)
        .eq('user_id', userId);

      if (!votesError) {
        userVoted = votes && votes.length > 0;
      }
    }

    return { 
      data: { ...poll, options, user_voted: userVoted }, 
      error: null 
    };
  } catch (error) {
    console.error('Error getting poll:', error);
    return { data: null, error };
  }
};

// Get poll results
export const getPollResults = async (pollId: string) => {
  try {
    // Get the poll options
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('id, option_text')
      .eq('poll_id', pollId);

    if (optionsError) throw optionsError;

    // For each option, get the vote count
    const optionResults = await Promise.all(
      options.map(async (option) => {
        const { count, error: countError } = await supabase
          .from('poll_votes')
          .select('id', { count: 'exact', head: true })
          .eq('option_id', option.id);

        if (countError) throw countError;

        return {
          option_id: option.id,
          option_text: option.option_text,
          votes: count || 0,
        };
      })
    );

    // Get total votes
    const { count: totalVotes, error: totalError } = await supabase
      .from('poll_votes')
      .select('id', { count: 'exact', head: true })
      .eq('poll_id', pollId);

    if (totalError) throw totalError;

    return { 
      data: { 
        options: optionResults, 
        total_votes: totalVotes || 0 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error getting poll results:', error);
    return { data: null, error };
  }
};

// Vote on a poll
export const votePoll = async (userId: string, pollId: string, optionId: string) => {
  try {
    // Check if user has already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('poll_votes')
      .select()
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    // If user has already voted, update their vote
    if (existingVote) {
      const { error: updateError } = await supabase
        .from('poll_votes')
        .update({ option_id: optionId })
        .eq('id', existingVote.id);

      if (updateError) throw updateError;
    } else {
      // Otherwise create a new vote
      const { error: insertError } = await supabase
        .from('poll_votes')
        .insert({
          user_id: userId,
          poll_id: pollId,
          option_id: optionId,
        });

      if (insertError) throw insertError;
    }

    // Log activity
    await logActivity(userId, 'vote_poll' as any, pollId);

    return { data: true, error: null };
  } catch (error) {
    console.error('Error voting on poll:', error);
    return { data: null, error };
  }
};

// Delete a poll (only by poll creator or admin)
export const deletePoll = async (pollId: string, userId: string) => {
  try {
    // Check if user is the creator or an admin
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;

    const { isAdmin } = await isUserAdmin(userId);
    
    if (poll.user_id !== userId && !isAdmin) {
      return { 
        data: null, 
        error: new Error('You do not have permission to delete this poll') 
      };
    }

    // Delete the poll (cascade delete will handle options and votes)
    const { data, error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error deleting poll:', error);
    return { data: null, error };
  }
}; 