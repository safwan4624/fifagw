import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { POINTS_EXACT_SCORE, POINTS_CORRECT_OUTCOME } from '../config/app';

const PREDICTIONS_COL = 'predictions';
const USERS_COL = 'users';

// ─── Submit / Update Prediction ──────────────────────────────────────────────

/**
 * Submit or update a prediction for a fixture.
 * Uses a deterministic doc ID so each user can only have one prediction per fixture.
 *
 * @param {string} userId
 * @param {string} fixtureId
 * @param {number} homeScore
 * @param {number} awayScore
 */
export async function submitPrediction(userId, fixtureId, homeScore, awayScore) {
  const predictionId = `${userId}_${fixtureId}`;
  const predictionRef = doc(db, PREDICTIONS_COL, predictionId);

  await setDoc(
    predictionRef,
    {
      userId,
      fixtureId,
      predictedHomeScore: homeScore,
      predictedAwayScore: awayScore,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

// ─── Real-time Subscriptions ─────────────────────────────────────────────────

/**
 * Subscribe to all predictions for a specific user.
 * @param {string} userId
 * @param {(predictions: Array) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToUserPredictions(userId, callback) {
  const q = query(
    collection(db, PREDICTIONS_COL),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const predictions = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(predictions);
  });
}

/**
 * Subscribe to all predictions globally (useful for admin dashboards).
 * @param {(predictions: Array) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToAllPredictions(callback) {
  const q = collection(db, PREDICTIONS_COL);
  return onSnapshot(q, (snapshot) => {
    const predictions = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(predictions);
  });
}

/**
 * Subscribe to all predictions for a specific fixture.
 * @param {string} fixtureId
 * @param {(predictions: Array) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToFixturePredictions(fixtureId, callback) {
  const q = query(
    collection(db, PREDICTIONS_COL),
    where('fixtureId', '==', fixtureId)
  );

  return onSnapshot(q, (snapshot) => {
    const predictions = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(predictions);
  });
}

/**
 * Get the count of predictions for a specific fixture.
 * @param {string} fixtureId
 * @returns {Promise<number>} the count
 */
export async function getPredictionsCountForFixture(fixtureId) {
  const q = query(
    collection(db, PREDICTIONS_COL),
    where('fixtureId', '==', fixtureId)
  );
  // Note: getDocs fetches all docs which isn't perfectly efficient for counting, 
  // but good enough for this scale. Firestore 'count' aggregation is an alternative 
  // if you want to optimize later.
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// ─── Points Calculation (Client-side fallback for Spark plan) ────────────────

/**
 * Calculate and award points for all predictions on a completed fixture.
 * Compares each prediction to the actual score and awards POINTS_EXACT_SCORE
 * for an exact match. Updates each prediction doc and the user's totalPoints
 * in a single batched write.
 *
 * @param {string} fixtureId
 * @param {number} actualHome — actual home team score
 * @param {number} actualAway — actual away team score
 * @returns {Promise<{ processed: number, awarded: number }>}
 */
export async function calculatePointsForFixture(fixtureId, actualHome, actualAway) {
  const q = query(
    collection(db, PREDICTIONS_COL),
    where('fixtureId', '==', fixtureId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { processed: 0, awarded: 0 };
  }

  const BATCH_LIMIT = 500;
  let processed = 0;
  let awarded = 0;
  let batch = writeBatch(db);
  let opsInBatch = 0;

  for (const predDoc of snapshot.docs) {
    const pred = predDoc.data();
    const isExact =
      pred.predictedHomeScore === actualHome && pred.predictedAwayScore === actualAway;
      
    // Determine outcomes: 1 for Home Win, 0 for Draw, -1 for Away Win
    const actualOutcome = actualHome > actualAway ? 1 : actualHome === actualAway ? 0 : -1;
    const predictedOutcome = pred.predictedHomeScore > pred.predictedAwayScore ? 1 : pred.predictedHomeScore === pred.predictedAwayScore ? 0 : -1;
    
    const isCorrectOutcome = actualOutcome === predictedOutcome;

    let points = 0;
    if (isCorrectOutcome) {
      points += POINTS_CORRECT_OUTCOME;
      if (isExact) {
        points += POINTS_EXACT_SCORE;
      }
    }

    const previousPoints = pred.pointsAwarded || 0;
    const pointsDiff = points - previousPoints;

    // Update the prediction doc with its awarded points
    batch.update(predDoc.ref, {
      pointsAwarded: points,
      calculatedAt: Timestamp.now(),
    });
    opsInBatch++;

    // Update the user's totalPoints with the difference
    if (pointsDiff !== 0) {
      const userRef = doc(db, USERS_COL, pred.userId);
      batch.update(userRef, {
        totalPoints: increment(pointsDiff),
      });
      opsInBatch++;
      awarded++;
    }

    processed++;

    // Commit and start a new batch if we hit the limit
    if (opsInBatch >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      opsInBatch = 0;
    }
  }

  // Commit any remaining operations
  if (opsInBatch > 0) {
    await batch.commit();
  }

  return { processed, awarded };
}
