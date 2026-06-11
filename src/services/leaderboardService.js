import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const USERS_COL = 'users';

/**
 * Subscribe to the leaderboard — all users ordered by totalPoints descending.
 * Each entry includes a computed rank (1-indexed, with ties sharing the same rank).
 *
 * @param {(leaderboard: Array<{
 *   id: string,
 *   rank: number,
 *   displayName: string,
 *   email: string,
 *   photoURL: string,
 *   totalPoints: number
 * }>) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeToLeaderboard(callback) {
  const q = query(
    collection(db, USERS_COL),
    orderBy('totalPoints', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    let currentRank = 0;
    let previousPoints = null;

    const leaderboard = snapshot.docs.map((d, index) => {
      const data = d.data();
      const points = data.totalPoints ?? 0;

      // Assign rank — tied users share the same rank
      if (points !== previousPoints) {
        currentRank = index + 1;
        previousPoints = points;
      }

      return {
        id: d.id,
        rank: currentRank,
        displayName: data.displayName ?? 'Anonymous',
        email: data.email ?? '',
        photoURL: data.photoURL ?? '',
        totalPoints: points,
      };
    });

    callback(leaderboard);
  });
}
