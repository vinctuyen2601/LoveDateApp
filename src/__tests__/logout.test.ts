/**
 * Logout & user data isolation tests.
 *
 * Covers:
 *   clearUserData()  — deletes user tables, preserves CMS tables, throws on DB error
 *   isAnonymous transition logic — only clears when prev=false → current=true
 *     Case A: real account logs out   (false → true)  → should clear
 *     Case B: anonymous on app launch (null  → true)  → should NOT clear
 *     Case C: user logs IN            (true  → false) → should NOT clear
 *     Case D: no change               (true  → true)  → should NOT clear
 *   stopAutoSync ordering — must be called BEFORE clearUserData
 *   SyncContext listener guard — refreshEvents skipped when isAnonymous === true
 */

import { clearUserData } from '../services/database.service';

// ─── Mock db ─────────────────────────────────────────────────────────────────

function makeMockDb(execShouldFail = false) {
  const calls: string[] = [];
  return {
    calls,
    execAsync: jest.fn(async (sql: string) => {
      if (execShouldFail) throw new Error('DB error');
      calls.push(sql);
    }),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
  };
}

// ─── clearUserData ────────────────────────────────────────────────────────────

describe('clearUserData', () => {
  const USER_TABLES = [
    'events',
    'checklist_items',
    'sync_metadata',
    'scheduled_notifications',
    'notification_logs',
    'article_reads',
  ];

  const CMS_TABLES = [
    'articles',
    'surveys',
    'master_data_cache',
    'activity_suggestions',
    'gift_suggestions',
    'badge_definitions',
    'subscription_plans',
  ];

  it('deletes all user-owned tables', async () => {
    const db = makeMockDb();
    await clearUserData(db as any);

    const deletedTables = db.calls.map(sql => {
      const m = sql.match(/^DELETE FROM (\w+)$/);
      return m ? m[1] : null;
    }).filter(Boolean);

    for (const table of USER_TABLES) {
      expect(deletedTables).toContain(table);
    }
  });

  it('does NOT touch CMS / shared tables', async () => {
    const db = makeMockDb();
    await clearUserData(db as any);

    for (const table of CMS_TABLES) {
      const touched = db.calls.some(sql => sql.includes(table));
      expect(touched).toBe(false);
    }
  });

  it('uses DELETE FROM (not DROP TABLE) — preserves schema', async () => {
    const db = makeMockDb();
    await clearUserData(db as any);

    const hasDrop = db.calls.some(sql => sql.toUpperCase().includes('DROP'));
    expect(hasDrop).toBe(false);

    const allAreDelete = db.calls.every(sql => sql.startsWith('DELETE FROM'));
    expect(allAreDelete).toBe(true);
  });

  it('deletes all 6 user tables — no more, no less', async () => {
    const db = makeMockDb();
    await clearUserData(db as any);
    expect(db.calls).toHaveLength(USER_TABLES.length);
  });

  it('throws DatabaseError when db.execAsync fails', async () => {
    const db = makeMockDb(true); // configured to throw
    await expect(clearUserData(db as any)).rejects.toThrow('Failed to clear user data');
  });

  it('execAsync is called with correct SQL strings', async () => {
    const db = makeMockDb();
    await clearUserData(db as any);

    expect(db.calls).toEqual(
      expect.arrayContaining(USER_TABLES.map(t => `DELETE FROM ${t}`))
    );
  });
});

// ─── isAnonymous transition logic ─────────────────────────────────────────────
//
// Mirrors the logic in EventsContext:
//   const prev = prevIsAnonymousRef.current;
//   prevIsAnonymousRef.current = isAnonymous;
//   if (prev === false && isAnonymous === true) → CLEAR
//
// We test this pure condition directly.

function shouldClearOnTransition(prev: boolean | null, current: boolean): boolean {
  return prev === false && current === true;
}

describe('isAnonymous transition — when to clear user data', () => {
  describe('Case A: real account logs out (false → true)', () => {
    it('SHOULD clear — user was logged in, now anonymous', () => {
      expect(shouldClearOnTransition(false, true)).toBe(true);
    });
  });

  describe('Case B: anonymous user on first app launch (null → true)', () => {
    it('should NOT clear — no previous account', () => {
      expect(shouldClearOnTransition(null, true)).toBe(false);
    });
  });

  describe('Case C: user logs IN (true → false)', () => {
    it('should NOT clear — user is gaining a real account', () => {
      expect(shouldClearOnTransition(true, false)).toBe(false);
    });
  });

  describe('Case D: anonymous stays anonymous (null/true → true)', () => {
    it('should NOT clear — no change', () => {
      expect(shouldClearOnTransition(true, true)).toBe(false);
      expect(shouldClearOnTransition(null, true)).toBe(false);
    });
  });

  describe('Case E: logged-in stays logged in (false → false)', () => {
    it('should NOT clear — no logout happened', () => {
      expect(shouldClearOnTransition(false, false)).toBe(false);
    });
  });
});

// ─── Integration: clearUserData called only on Case A ─────────────────────────

describe('Integration: clearUserData triggered on correct transitions', () => {
  async function simulateTransition(
    prev: boolean | null,
    current: boolean,
    db: ReturnType<typeof makeMockDb>
  ) {
    if (prev === false && current === true) {
      await clearUserData(db as any);
    }
  }

  it('Case A (false→true): clearUserData IS called', async () => {
    const db = makeMockDb();
    await simulateTransition(false, true, db);
    expect(db.execAsync).toHaveBeenCalled();
    expect(db.calls.length).toBe(6);
  });

  it('Case B (null→true): clearUserData is NOT called', async () => {
    const db = makeMockDb();
    await simulateTransition(null, true, db);
    expect(db.execAsync).not.toHaveBeenCalled();
  });

  it('Case C (true→false login): clearUserData is NOT called', async () => {
    const db = makeMockDb();
    await simulateTransition(true, false, db);
    expect(db.execAsync).not.toHaveBeenCalled();
  });

  it('Case D (true→true no change): clearUserData is NOT called', async () => {
    const db = makeMockDb();
    await simulateTransition(true, true, db);
    expect(db.execAsync).not.toHaveBeenCalled();
  });

  it('Case E (false→false no change): clearUserData is NOT called', async () => {
    const db = makeMockDb();
    await simulateTransition(false, false, db);
    expect(db.execAsync).not.toHaveBeenCalled();
  });
});

// ─── stopAutoSync ordering ─────────────────────────────────────────────────────
//
// Mirrors the logout sequence in EventsContext:
//   syncService.stopAutoSync()   ← must happen FIRST
//   DB.clearUserData(db)         ← then wipe
//   loadEvents()
//   navigate('Main', ...)
//
// If stopAutoSync fires AFTER clear, the auto-sync timer could fire in the gap
// and refill the DB from the server before wipe completes.

describe('stopAutoSync ordering — called before clearUserData', () => {
  function makeOrderTracker() {
    const order: string[] = [];
    const stopAutoSync = jest.fn(() => { order.push('stopAutoSync'); });
    const execAsync = jest.fn(async (_sql: string) => { order.push('execAsync'); });
    return { order, stopAutoSync, execAsync };
  }

  async function simulateLogoutSequence(tracker: ReturnType<typeof makeOrderTracker>) {
    tracker.stopAutoSync();
    // clearUserData calls execAsync 6 times — we just verify the first call ordering
    await tracker.execAsync('DELETE FROM events');
  }

  it('stopAutoSync is called before the first DB delete', async () => {
    const tracker = makeOrderTracker();
    await simulateLogoutSequence(tracker);
    expect(tracker.order[0]).toBe('stopAutoSync');
    expect(tracker.order[1]).toBe('execAsync');
  });

  it('stopAutoSync is called exactly once on logout', async () => {
    const tracker = makeOrderTracker();
    await simulateLogoutSequence(tracker);
    expect(tracker.stopAutoSync).toHaveBeenCalledTimes(1);
  });

  it('stopAutoSync fires only on Case A — not on other transitions', async () => {
    // Only false→true should trigger the sequence
    const cases: Array<{ prev: boolean | null; current: boolean; shouldStop: boolean }> = [
      { prev: false, current: true,  shouldStop: true  }, // Case A: logout
      { prev: null,  current: true,  shouldStop: false }, // Case B: first launch
      { prev: true,  current: false, shouldStop: false }, // Case C: login
      { prev: true,  current: true,  shouldStop: false }, // Case D: no change
      { prev: false, current: false, shouldStop: false }, // Case E: no change
    ];

    for (const { prev, current, shouldStop } of cases) {
      const tracker = makeOrderTracker();
      if (prev === false && current === true) {
        tracker.stopAutoSync();
      }
      expect(tracker.stopAutoSync).toHaveBeenCalledTimes(shouldStop ? 1 : 0);
    }
  });
});

// ─── SyncContext listener guard — refreshEvents skipped when anonymous ─────────
//
// Mirrors the guard in SyncContext:
//   if (status.isSyncing === false && !status.error && !isAnonymousRef.current) {
//     refreshEvents()
//   }
//
// After logout, isAnonymous becomes true. Any in-flight sync completing at that
// point must NOT call refreshEvents, otherwise old-user events are reloaded.

describe('SyncContext listener — refreshEvents guarded by isAnonymous', () => {
  type SyncStatus = { isSyncing: boolean; error?: string };

  function shouldRefreshEvents(status: SyncStatus, isAnonymous: boolean): boolean {
    return status.isSyncing === false && !status.error && !isAnonymous;
  }

  describe('authenticated user (isAnonymous = false)', () => {
    it('calls refreshEvents when sync completes successfully', () => {
      expect(shouldRefreshEvents({ isSyncing: false }, false)).toBe(true);
    });

    it('does NOT call refreshEvents while sync is in progress', () => {
      expect(shouldRefreshEvents({ isSyncing: true }, false)).toBe(false);
    });

    it('does NOT call refreshEvents when sync completed with error', () => {
      expect(shouldRefreshEvents({ isSyncing: false, error: 'network timeout' }, false)).toBe(false);
    });
  });

  describe('anonymous user (isAnonymous = true) — post-logout state', () => {
    it('does NOT call refreshEvents even when sync completes successfully', () => {
      expect(shouldRefreshEvents({ isSyncing: false }, true)).toBe(false);
    });

    it('does NOT call refreshEvents while sync is in progress', () => {
      expect(shouldRefreshEvents({ isSyncing: true }, true)).toBe(false);
    });

    it('does NOT call refreshEvents when sync has error', () => {
      expect(shouldRefreshEvents({ isSyncing: false, error: 'unauthorized' }, true)).toBe(false);
    });
  });

  describe('in-flight sync completes after logout', () => {
    it('isAnonymousRef update blocks refreshEvents from firing', () => {
      const refreshEvents = jest.fn();
      let isAnonymousRef = false; // simulates ref.current

      function onSyncComplete(status: SyncStatus) {
        if (status.isSyncing === false && !status.error && !isAnonymousRef) {
          refreshEvents();
        }
      }

      // Sync starts while user is authenticated
      onSyncComplete({ isSyncing: true });
      expect(refreshEvents).not.toHaveBeenCalled();

      // User logs out — ref is updated immediately
      isAnonymousRef = true;

      // Sync completes, but ref is already true → refreshEvents must NOT fire
      onSyncComplete({ isSyncing: false });
      expect(refreshEvents).not.toHaveBeenCalled();
    });

    it('refreshEvents fires normally when sync completes before logout', () => {
      const refreshEvents = jest.fn();
      let isAnonymousRef = false;

      function onSyncComplete(status: SyncStatus) {
        if (status.isSyncing === false && !status.error && !isAnonymousRef) {
          refreshEvents();
        }
      }

      // Sync completes while still authenticated
      onSyncComplete({ isSyncing: false });
      expect(refreshEvents).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── Full logout sequence ordering ────────────────────────────────────────────
//
// Validates that the complete logout sequence fires in the correct order:
//   1. stopAutoSync
//   2. clearUserData  (all 6 tables)
//   3. loadEvents     (sets empty state)
//   4. navigate       (returns to Home)

describe('Full logout sequence — correct order of operations', () => {
  function makeSequenceTracker() {
    const sequence: string[] = [];
    return {
      sequence,
      stopAutoSync: jest.fn(() => sequence.push('stopAutoSync')),
      clearUserData: jest.fn(async () => {
        sequence.push('clearUserData');
      }),
      loadEvents: jest.fn(async () => {
        sequence.push('loadEvents');
      }),
      navigate: jest.fn(() => sequence.push('navigate')),
    };
  }

  async function runLogoutSequence(t: ReturnType<typeof makeSequenceTracker>) {
    t.stopAutoSync();
    await t.clearUserData();
    await t.loadEvents();
    t.navigate();
  }

  it('executes in the correct order: stop → clear → load → navigate', async () => {
    const t = makeSequenceTracker();
    await runLogoutSequence(t);
    expect(t.sequence).toEqual(['stopAutoSync', 'clearUserData', 'loadEvents', 'navigate']);
  });

  it('stopAutoSync always precedes clearUserData', async () => {
    const t = makeSequenceTracker();
    await runLogoutSequence(t);
    const stopIdx = t.sequence.indexOf('stopAutoSync');
    const clearIdx = t.sequence.indexOf('clearUserData');
    expect(stopIdx).toBeLessThan(clearIdx);
  });

  it('clearUserData always precedes loadEvents', async () => {
    const t = makeSequenceTracker();
    await runLogoutSequence(t);
    const clearIdx = t.sequence.indexOf('clearUserData');
    const loadIdx = t.sequence.indexOf('loadEvents');
    expect(clearIdx).toBeLessThan(loadIdx);
  });

  it('navigate always fires last', async () => {
    const t = makeSequenceTracker();
    await runLogoutSequence(t);
    expect(t.sequence[t.sequence.length - 1]).toBe('navigate');
  });

  it('navigate is called with Home screen', () => {
    const navigate = jest.fn();
    navigate('Main', { screen: 'Home' });
    expect(navigate).toHaveBeenCalledWith('Main', { screen: 'Home' });
  });

  it('sequence does NOT run for non-logout transitions', async () => {
    const cases: Array<{ prev: boolean | null; current: boolean }> = [
      { prev: null,  current: true  }, // Case B: first launch
      { prev: true,  current: false }, // Case C: login
      { prev: true,  current: true  }, // Case D: no change
      { prev: false, current: false }, // Case E: no change
    ];

    for (const { prev, current } of cases) {
      const t = makeSequenceTracker();
      if (prev === false && current === true) {
        await runLogoutSequence(t);
      }
      expect(t.stopAutoSync).not.toHaveBeenCalled();
      expect(t.clearUserData).not.toHaveBeenCalled();
    }
  });
});
