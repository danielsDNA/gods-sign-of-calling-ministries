import { describe, expect, it } from 'vitest';
import { orderServicesByNextOccurrence } from './service-time-order';

describe('orderServicesByNextOccurrence', () => {
  it('orders weekly services by their next start time, not their configured list order', () => {
    const services = [
      { day: 'Tuesday', time: '9:00 AM', label: 'Tuesday service', location: '' },
      { day: 'Monday', time: '11:00 AM', label: 'Monday service', location: '' },
      { day: 'Monday', time: '9:00 AM', label: 'Earlier service', location: '' },
    ];

    expect(orderServicesByNextOccurrence(services, new Date(2026, 5, 8, 10, 0)).map(service => service.label))
      .toEqual(['Monday service', 'Tuesday service', 'Earlier service']);
  });

  it('handles monthly ordinal weekdays and keeps unparseable schedules after timed services', () => {
    const services = [
      { day: 'Every Sunday', time: '9:00 AM', label: 'Sunday service', location: '' },
      { day: '2nd Friday of every month', time: '6:00 PM', label: 'Monthly service', location: '' },
      { day: 'Any day', time: 'Overnight', label: 'Unscheduled service', location: '' },
    ];

    expect(orderServicesByNextOccurrence(services, new Date(2026, 5, 11, 12, 0)).map(service => service.label))
      .toEqual(['Monthly service', 'Sunday service', 'Unscheduled service']);
  });
});
