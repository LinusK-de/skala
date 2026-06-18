import { currentSchoolYear, gradeLevels, termLabel } from './school';

describe('currentSchoolYear', () => {
  it('keeps the spring half in the year that started the previous autumn', () => {
    expect(currentSchoolYear(new Date(2026, 5, 18))).toBe('2025/26'); // June 2026
  });
  it('rolls over in August', () => {
    expect(currentSchoolYear(new Date(2025, 7, 1))).toBe('2025/26'); // 1 Aug 2025
    expect(currentSchoolYear(new Date(2025, 6, 31))).toBe('2024/25'); // 31 Jul 2025
  });
  it('pads the short end year', () => {
    expect(currentSchoolYear(new Date(2009, 8, 1))).toBe('2009/10');
  });
});

describe('termLabel', () => {
  it('formats grade/half', () => {
    expect(termLabel(11, 1)).toBe('11/1');
  });
});

describe('gradeLevels', () => {
  it('lists an inclusive range', () => {
    expect(gradeLevels(5, 7)).toEqual([5, 6, 7]);
  });
});
