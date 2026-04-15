/**
 * Test cases for AI Event Creator NLU flow.
 *
 * Covers:
 *   1. parseVietnamese — event type detection
 *   2. parseVietnamese — person name detection
 *   3. parseVietnamese — date extraction (all patterns)
 *   4. parseVietnamese — year extraction
 *   5. parseVietnamese — lunar flag
 *   6. parseVietnamese — multi-turn slot merging
 *   7. parseVietnamese — correction (overwrite date on new turn)
 *   8. isComplete — mandatory slot check
 *   9. getNextQuestion — which question to ask next
 *  10. buildTitle — display string
 *  11. buildFormData — EventFormData shape
 *  12. Flow: happy path (full sentence, one turn)
 *  13. Flow: missing type → follow-up turn
 *  14. Flow: missing date → follow-up turn
 *  15. Flow: correction at CONFIRM (user says ngày sai)
 *  16. Flow: text has no extractable info (garbage input)
 *  17. Edge: date boundary values (day 1, day 31, month 12)
 *  18. Edge: year out of range ignored
 *  19. Edge: "sn" abbreviation for sinh nhật
 *  20. Edge: "bạn <tên>" free-form name
 */

import {
  parseVietnamese,
  isComplete,
  getNextQuestion,
  buildTitle,
  buildFormData,
  extractDate,
  EMPTY_PARSED,
  ParsedEvent,
} from "../services/aiEventNlu.service";

// ─── 1. Event type detection ─────────────────────────────────────────────────

describe("parseVietnamese — event type", () => {
  it("detects birthday from 'sinh nhật'", () => {
    expect(parseVietnamese("Sinh nhật vợ ngày 5 tháng 3").eventType).toBe("birthday");
  });

  it("detects birthday from abbreviation 'sn'", () => {
    expect(parseVietnamese("sn vợ 5/3").eventType).toBe("birthday");
  });

  it("detects anniversary from 'kỷ niệm'", () => {
    expect(parseVietnamese("kỷ niệm ngày cưới 14/2").eventType).toBe("anniversary");
  });

  it("detects anniversary from 'ngày cưới'", () => {
    expect(parseVietnamese("ngày cưới 20 tháng 11").eventType).toBe("anniversary");
  });

  it("detects memorial from 'ngày giỗ'", () => {
    expect(parseVietnamese("ngày giỗ ông nội 10 tháng 4").eventType).toBe("memorial");
  });

  it("detects other from 'sự kiện'", () => {
    expect(parseVietnamese("sự kiện quan trọng ngày 1/6").eventType).toBe("other");
  });

  it("returns null when no type keyword found", () => {
    expect(parseVietnamese("ngày 5 tháng 3").eventType).toBeNull();
  });

  it("does not overwrite existing eventType on follow-up turn", () => {
    const existing = { ...EMPTY_PARSED, eventType: "birthday" };
    const result = parseVietnamese("ngày 5 tháng 3", existing);
    expect(result.eventType).toBe("birthday");
  });
});

// ─── 2. Person name detection ────────────────────────────────────────────────

describe("parseVietnamese — person name", () => {
  it.each([
    ["sinh nhật vợ", "vợ"],
    ["sinh nhật chồng", "chồng"],
    ["sinh nhật bố", "bố"],
    ["sinh nhật mẹ", "mẹ"],
    ["ngày giỗ ông nội", "ông nội"],
    ["ngày giỗ bà nội", "bà nội"],
    ["sinh nhật con ngày 1/6", "con"],
    ["sinh nhật anh ngày 3/9", "anh"],
    ["sinh nhật chị ngày 8/3", "chị"],
    ["sinh nhật em ngày 20/11", "em"],
  ])("'%s' → personName '%s'", (text, expected) => {
    expect(parseVietnamese(text).personName).toBe(expected);
  });

  it("extracts free-form 'bạn <tên>'", () => {
    expect(parseVietnamese("sinh nhật bạn Nam ngày 5/3").personName).toBe("bạn nam");
  });

  it("returns null when no person keyword found", () => {
    expect(parseVietnamese("sinh nhật ngày 5 tháng 3").personName).toBeNull();
  });

  it("does not overwrite existing personName on follow-up turn", () => {
    const existing = { ...EMPTY_PARSED, personName: "vợ" };
    const result = parseVietnamese("ngày 5 tháng 3", existing);
    expect(result.personName).toBe("vợ");
  });
});

// ─── 3. Date extraction ──────────────────────────────────────────────────────

describe("parseVietnamese — date patterns", () => {
  it("'ngày D tháng M' pattern", () => {
    const r = parseVietnamese("sinh nhật vợ ngày 5 tháng 3");
    expect(r.day).toBe(5);
    expect(r.month).toBe(3);
  });

  it("'tháng M ngày D' pattern", () => {
    const r = parseVietnamese("sinh nhật vợ tháng 3 ngày 5");
    expect(r.day).toBe(5);
    expect(r.month).toBe(3);
  });

  it("'D tháng M' short pattern", () => {
    const r = parseVietnamese("sinh nhật vợ 5 tháng 3");
    expect(r.day).toBe(5);
    expect(r.month).toBe(3);
  });

  it("'D/M' slash pattern", () => {
    const r = parseVietnamese("sinh nhật vợ 14/2");
    expect(r.day).toBe(14);
    expect(r.month).toBe(2);
  });

  it("'D-M' dash pattern", () => {
    const r = parseVietnamese("sinh nhật vợ 14-2");
    expect(r.day).toBe(14);
    expect(r.month).toBe(2);
  });

  it("'D/M/YYYY' includes year", () => {
    const r = parseVietnamese("sinh nhật vợ 14/2/1990");
    expect(r.day).toBe(14);
    expect(r.month).toBe(2);
  });

  it("day 1 and month 1 boundary", () => {
    const r = parseVietnamese("sinh nhật mẹ ngày 1 tháng 1");
    expect(r.day).toBe(1);
    expect(r.month).toBe(1);
  });

  it("day 31 and month 12 boundary", () => {
    const r = parseVietnamese("sự kiện ngày 31 tháng 12");
    expect(r.day).toBe(31);
    expect(r.month).toBe(12);
  });

  it("returns null day/month when no date in text", () => {
    const r = parseVietnamese("sinh nhật vợ");
    expect(r.day).toBeNull();
    expect(r.month).toBeNull();
  });
});

// ─── 4. extractDate helper ───────────────────────────────────────────────────

describe("extractDate", () => {
  it("returns null for text with no date", () => {
    expect(extractDate("sinh nhật")).toBeNull();
  });

  it("parses 'ngày 5 tháng 3'", () => {
    expect(extractDate("ngày 5 tháng 3")).toEqual({ day: 5, month: 3 });
  });

  it("parses '5/3'", () => {
    expect(extractDate("5/3")).toEqual({ day: 5, month: 3 });
  });
});

// ─── 5. Year extraction ──────────────────────────────────────────────────────

describe("parseVietnamese — year", () => {
  it("extracts 'năm 1990'", () => {
    expect(parseVietnamese("sinh nhật vợ 14/2 năm 1990").year).toBe(1990);
  });

  it("extracts 'sinh năm 1985'", () => {
    expect(parseVietnamese("sinh nhật mẹ sinh năm 1985 ngày 8/3").year).toBe(1985);
  });

  it("extracts bare 4-digit year", () => {
    expect(parseVietnamese("sinh nhật vợ 14/2 1990").year).toBe(1990);
  });

  it("ignores year below 1900", () => {
    expect(parseVietnamese("sinh nhật vợ 14/2 1899").year).toBeNull();
  });

  it("ignores future year", () => {
    expect(parseVietnamese("sinh nhật vợ 14/2 2099").year).toBeNull();
  });
});

// ─── 6. Lunar flag ───────────────────────────────────────────────────────────

describe("parseVietnamese — lunar", () => {
  it("sets isLunar = true when 'âm lịch' present", () => {
    expect(parseVietnamese("sinh nhật vợ ngày 5 tháng 3 âm lịch").isLunar).toBe(true);
  });

  it("sets isLunar = true for 'am lich' variant", () => {
    expect(parseVietnamese("sinh nhật vợ 5/3 am lich").isLunar).toBe(true);
  });

  it("isLunar defaults to false", () => {
    expect(parseVietnamese("sinh nhật vợ ngày 5 tháng 3").isLunar).toBe(false);
  });
});

// ─── 7. Multi-turn slot merging ──────────────────────────────────────────────

describe("parseVietnamese — multi-turn merge", () => {
  it("turn 1 gets type+name, turn 2 adds date", () => {
    const turn1 = parseVietnamese("sinh nhật vợ");
    expect(turn1.eventType).toBe("birthday");
    expect(turn1.personName).toBe("vợ");
    expect(turn1.day).toBeNull();

    const turn2 = parseVietnamese("ngày 5 tháng 3", turn1);
    expect(turn2.eventType).toBe("birthday");
    expect(turn2.personName).toBe("vợ");
    expect(turn2.day).toBe(5);
    expect(turn2.month).toBe(3);
  });

  it("turn 1 gets date, turn 2 adds type", () => {
    const turn1 = parseVietnamese("ngày 14 tháng 2");
    expect(turn1.eventType).toBeNull();

    const turn2 = parseVietnamese("kỷ niệm ngày cưới", turn1);
    expect(turn2.eventType).toBe("anniversary");
    expect(turn2.day).toBe(14);
    expect(turn2.month).toBe(2);
  });

  it("rawText always reflects latest input", () => {
    const turn1 = parseVietnamese("sinh nhật vợ");
    const turn2 = parseVietnamese("ngày 5 tháng 3", turn1);
    expect(turn2.rawText).toBe("ngày 5 tháng 3");
  });
});

// ─── 8. Correction — overwrite date ─────────────────────────────────────────

describe("parseVietnamese — correction flow", () => {
  it("new date in correction turn overwrites old date", () => {
    const confirmed = parseVietnamese("sinh nhật vợ ngày 5 tháng 3");
    expect(confirmed.day).toBe(5);

    // User says the date was wrong
    const corrected = parseVietnamese("ý tôi là ngày 15 tháng 3", confirmed);
    expect(corrected.day).toBe(15);
    expect(corrected.month).toBe(3);
    // Other slots preserved
    expect(corrected.eventType).toBe("birthday");
    expect(corrected.personName).toBe("vợ");
  });

  it("correction with slash format", () => {
    const confirmed = parseVietnamese("sinh nhật vợ 5/3");
    const corrected = parseVietnamese("sửa lại thành 20/3", confirmed);
    expect(corrected.day).toBe(20);
    expect(corrected.month).toBe(3);
  });
});

// ─── 9. isComplete ───────────────────────────────────────────────────────────

describe("isComplete", () => {
  it("returns true when eventType + day + month all present", () => {
    const e = parseVietnamese("sinh nhật vợ ngày 5 tháng 3");
    expect(isComplete(e)).toBe(true);
  });

  it("returns false when eventType missing", () => {
    const e = parseVietnamese("vợ ngày 5 tháng 3");
    expect(isComplete(e)).toBe(false);
  });

  it("returns false when day missing", () => {
    const e = parseVietnamese("sinh nhật vợ tháng 3");
    expect(isComplete(e)).toBe(false);
  });

  it("returns false when month missing", () => {
    expect(isComplete(EMPTY_PARSED)).toBe(false);
  });

  it("isComplete does NOT require personName or year", () => {
    const e = parseVietnamese("sinh nhật ngày 5 tháng 3");
    // no person name — still complete enough to confirm
    expect(isComplete(e)).toBe(true);
  });
});

// ─── 10. getNextQuestion ─────────────────────────────────────────────────────

describe("getNextQuestion", () => {
  it("asks for event type first when missing", () => {
    const q = getNextQuestion(EMPTY_PARSED);
    expect(q).toMatch(/loại sự kiện/i);
  });

  it("asks for date when type known but date missing", () => {
    const e = parseVietnamese("sinh nhật vợ");
    const q = getNextQuestion(e);
    expect(q).toMatch(/ngày tháng/i);
  });

  it("includes event title in date question", () => {
    const e = parseVietnamese("sinh nhật vợ");
    const q = getNextQuestion(e);
    expect(q).toContain("Sinh nhật vợ");
  });

  it("returns done message when complete", () => {
    const e = parseVietnamese("sinh nhật vợ ngày 5 tháng 3");
    const q = getNextQuestion(e);
    expect(q).toMatch(/đủ thông tin/i);
  });
});

// ─── 11. buildTitle ──────────────────────────────────────────────────────────

describe("buildTitle", () => {
  it("'birthday' + personName → 'Sinh nhật vợ'", () => {
    expect(buildTitle({ eventType: "birthday", personName: "vợ" })).toBe("Sinh nhật vợ");
  });

  it("'anniversary' no name → 'Kỷ niệm'", () => {
    expect(buildTitle({ eventType: "anniversary", personName: null })).toBe("Kỷ niệm");
  });

  it("'memorial' + name → 'Ngày giỗ ông nội'", () => {
    expect(buildTitle({ eventType: "memorial", personName: "ông nội" })).toBe("Ngày giỗ ông nội");
  });

  it("unknown type falls back to 'Sự kiện'", () => {
    expect(buildTitle({ eventType: "other", personName: null })).toBe("Sự kiện");
  });

  it("null eventType falls back to 'Sự kiện'", () => {
    expect(buildTitle({ eventType: null, personName: null })).toBe("Sự kiện");
  });
});

// ─── 12. buildFormData ───────────────────────────────────────────────────────

describe("buildFormData", () => {
  const base: ParsedEvent = {
    eventType: "birthday",
    personName: "vợ",
    day: 5,
    month: 3,
    year: 1990,
    isLunar: false,
    rawText: "Sinh nhật vợ ngày 5 tháng 3 năm 1990",
  };

  it("sets title from buildTitle", () => {
    expect(buildFormData(base).title).toBe("Sinh nhật vợ");
  });

  it("sets correct day and month in eventDate", () => {
    const fd = buildFormData(base);
    expect(fd.eventDate.getDate()).toBe(5);
    expect(fd.eventDate.getMonth() + 1).toBe(3); // month is 0-indexed
  });

  it("sets isLunarCalendar", () => {
    expect(buildFormData(base).isLunarCalendar).toBe(false);
    expect(buildFormData({ ...base, isLunar: true }).isLunarCalendar).toBe(true);
  });

  it("includes tag matching eventType", () => {
    expect(buildFormData(base).tags).toContain("birthday");
  });

  it("remindDaysBefore contains 0, 1, 7", () => {
    expect(buildFormData(base).remindDaysBefore).toEqual(expect.arrayContaining([0, 1, 7]));
  });

  it("isRecurring is true", () => {
    expect(buildFormData(base).isRecurring).toBe(true);
  });

  it("startYear set from year field", () => {
    expect(buildFormData(base).startYear).toBe(1990);
  });

  it("startYear is undefined when year is null", () => {
    expect(buildFormData({ ...base, year: null }).startYear).toBeUndefined();
  });
});

// ─── 13. Flow: happy path (single full sentence) ─────────────────────────────

describe("Flow: happy path", () => {
  it("one sentence → complete → no follow-up needed", () => {
    const result = parseVietnamese("Sinh nhật vợ ngày 5 tháng 3 năm 1990");
    expect(isComplete(result)).toBe(true);
    expect(result.eventType).toBe("birthday");
    expect(result.personName).toBe("vợ");
    expect(result.day).toBe(5);
    expect(result.month).toBe(3);
    expect(result.year).toBe(1990);
  });
});

// ─── 14. Flow: missing type, needs follow-up ─────────────────────────────────

describe("Flow: missing event type", () => {
  it("asks type question, then resolves on turn 2", () => {
    const turn1 = parseVietnamese("vợ ngày 5 tháng 3");
    expect(isComplete(turn1)).toBe(false);
    expect(getNextQuestion(turn1)).toMatch(/loại sự kiện/i);

    const turn2 = parseVietnamese("sinh nhật", turn1);
    expect(isComplete(turn2)).toBe(true);
    expect(turn2.eventType).toBe("birthday");
    expect(turn2.day).toBe(5);
    expect(turn2.month).toBe(3);
  });
});

// ─── 15. Flow: missing date, needs follow-up ─────────────────────────────────

describe("Flow: missing date", () => {
  it("asks date question, then resolves on turn 2", () => {
    const turn1 = parseVietnamese("sinh nhật vợ");
    expect(isComplete(turn1)).toBe(false);
    expect(getNextQuestion(turn1)).toMatch(/ngày tháng/i);

    const turn2 = parseVietnamese("5 tháng 3", turn1);
    expect(isComplete(turn2)).toBe(true);
    expect(turn2.day).toBe(5);
    expect(turn2.month).toBe(3);
  });
});

// ─── 16. Flow: correction at CONFIRM ────────────────────────────────────────

describe("Flow: user corrects info at CONFIRM", () => {
  it("user says date is wrong → corrected date applied, other slots preserved", () => {
    // AI parsed and showed CONFIRM with 5/3
    const confirmed = parseVietnamese("Sinh nhật vợ ngày 5 tháng 3");
    expect(isComplete(confirmed)).toBe(true);

    // User says "sai rồi, là ngày 15 tháng 3"
    const corrected = parseVietnamese("sai rồi, là ngày 15 tháng 3", confirmed);
    expect(corrected.day).toBe(15);
    expect(corrected.month).toBe(3);
    expect(corrected.eventType).toBe("birthday"); // preserved
    expect(corrected.personName).toBe("vợ");      // preserved
    expect(isComplete(corrected)).toBe(true);      // still complete
  });

  it("user corrects person name by re-stating full sentence", () => {
    const confirmed = parseVietnamese("Sinh nhật vợ ngày 5 tháng 3");
    // Full re-statement with different type resets eventType
    const corrected = parseVietnamese("Sinh nhật chồng ngày 5 tháng 3");
    expect(corrected.personName).toBe("chồng");
  });
});

// ─── 17. Flow: garbage / empty input ────────────────────────────────────────

describe("Flow: unrecognised input", () => {
  it("garbage text → all slots null, isComplete false", () => {
    const r = parseVietnamese("xin chào bạn ơi");
    expect(isComplete(r)).toBe(false);
    expect(r.eventType).toBeNull();
    expect(r.day).toBeNull();
    expect(r.month).toBeNull();
  });

  it("empty string → EMPTY_PARSED shape", () => {
    const r = parseVietnamese("");
    expect(isComplete(r)).toBe(false);
  });
});
