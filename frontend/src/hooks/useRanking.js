import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * useRanking Hook
 *
 * 트레이딩 랭킹 데이터를 조회하고 실시간 업데이트를 구독합니다.
 *
 * @returns {Object} 랭킹 데이터와 상태
 */
export const useRanking = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 전체 랭킹 데이터 조회
  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_rankings')
        .select(`
          id,
          user_id,
          display_name,
          roi_percentage,
          rank_position
        `)
        .order('roi_percentage', { ascending: false })
        .limit(100); // Top 100 users by ROI

      if (fetchError) throw fetchError;

      // Add rank based on order (fallback if rank_position not cached)
      const rankedData = (data || []).map((profile, index) => ({
        ...profile,
        rank: profile.rank_position || (index + 1)
      }));

      setRankings(rankedData);

      // 현재 사용자의 순위 찾기
      if (user) {
        const currentUserRanking = rankedData.find(r => r.user_id === user.id);
        setUserRank(currentUserRanking);
      }

    } catch (err) {
      console.error('[useRanking] Error fetching rankings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchRankings();
  }, [user?.id]);

  // Supabase Realtime 구독 (user_rankings 테이블 변경 감지)
  useEffect(() => {
    if (!user) return;

    console.log('[useRanking] Subscribing to user_rankings changes...');

    const channel = supabase
      .channel('ranking_updates')
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'user_rankings'
        },
        (payload) => {
          console.log('[useRanking] Ranking updated:', payload);

          // Debounce: 1초 후에 랭킹 다시 조회
          setTimeout(() => {
            fetchRankings();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      console.log('[useRanking] Unsubscribing from ranking updates...');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 수동 새로고침 함수
  const refresh = () => {
    fetchRankings();
  };

  return {
    rankings,        // 전체 랭킹 배열 (순위 포함)
    userRank,        // 현재 사용자의 순위 정보
    loading,         // 로딩 상태
    error,           // 에러 메시지
    refresh          // 수동 새로고침 함수
  };
};
