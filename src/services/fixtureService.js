import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const FIXTURES_COL = 'fixtures';

// ─── Real-time Subscriptions ─────────────────────────────────────────────────

/**
 * Subscribe to all fixtures ordered by kickoff time.
 * @param {(fixtures: Array) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeToFixtures(callback) {
  const q = query(
    collection(db, FIXTURES_COL),
    orderBy('kickoffTime', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const fixtures = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(fixtures);
  });
}

/**
 * Subscribe to fixtures filtered by matchNumber.
 * @param {string|number} matchNumber
 * @param {(fixtures: Array) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeToFixturesByMatchNumber(matchNumber, callback) {
  const q = query(
    collection(db, FIXTURES_COL),
    where('matchNumber', '==', matchNumber),
    orderBy('kickoffTime', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const fixtures = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(fixtures);
  });
}

// ─── Admin Mutations ─────────────────────────────────────────────────────────

/**
 * Add a new fixture. Auto-generates a Firestore doc ID.
 * @param {Object} fixtureData — { homeTeam, awayTeam, kickoffTime, matchNumber, group, ... }
 * @returns {Promise<string>} the generated doc ID
 */
export async function addFixture(fixtureData) {
  const fixtureRef = doc(collection(db, FIXTURES_COL));

  await setDoc(fixtureRef, {
    ...fixtureData,
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
    createdAt: Timestamp.now(),
  });

  return fixtureRef.id;
}

/**
 * Update a fixture with the final result.
 * @param {string} fixtureId
 * @param {number} homeScore
 * @param {number} awayScore
 */
export async function updateFixtureResult(fixtureId, homeScore, awayScore) {
  const fixtureRef = doc(db, FIXTURES_COL, fixtureId);

  await updateDoc(fixtureRef, {
    homeScore,
    awayScore,
    status: 'completed',
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update general fixture details (teams, time, matchNumber, group).
 * @param {string} fixtureId
 * @param {Object} fixtureData
 */
export async function updateFixture(fixtureId, fixtureData) {
  const fixtureRef = doc(db, FIXTURES_COL, fixtureId);
  await updateDoc(fixtureRef, {
    ...fixtureData,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a fixture.
 * @param {string} fixtureId
 */
export async function deleteFixture(fixtureId) {
  await deleteDoc(doc(db, FIXTURES_COL, fixtureId));
}

/**
 * Bulk-import fixtures using batched writes (max 500 per batch).
 * @param {Array<Object>} fixturesArray
 */
export async function seedFixtures(fixturesArray) {
  const BATCH_LIMIT = 500;

  for (let i = 0; i < fixturesArray.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = fixturesArray.slice(i, i + BATCH_LIMIT);

    chunk.forEach((fixture) => {
      const ref = doc(collection(db, FIXTURES_COL));
      batch.set(ref, {
        ...fixture,
        homeScore: null,
        awayScore: null,
        status: 'upcoming',
        createdAt: Timestamp.now(),
      });
    });

    await batch.commit();
  }
}
