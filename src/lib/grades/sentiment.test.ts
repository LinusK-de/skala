import { sentimentFor } from './sentiment';

describe('sentimentFor', () => {
  it('reads low grades as positive, mid as neutral, high as warning', () => {
    expect(sentimentFor(1.7, 'grades_1_6')).toBe('positive');
    expect(sentimentFor(2.5, 'grades_1_6')).toBe('positive');
    expect(sentimentFor(3.2, 'grades_1_6')).toBe('neutral');
    expect(sentimentFor(4.0, 'grades_1_6')).toBe('neutral');
    expect(sentimentFor(4.8, 'grades_1_6')).toBe('warning');
  });

  it('reads high points as positive, low as warning', () => {
    expect(sentimentFor(12, 'points_0_15')).toBe('positive');
    expect(sentimentFor(7, 'points_0_15')).toBe('neutral');
    expect(sentimentFor(4, 'points_0_15')).toBe('warning');
  });
});
