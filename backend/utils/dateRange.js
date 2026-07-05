export function resolveDateRange(range, from, to) {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const today = startOfDay(now);

  switch (range) {
    case 'today':
      return { from: today, to: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: y, to: endOfDay(y) };
    }
    case 'this-week': {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay());
      return { from: start, to: endOfDay(now) };
    }
    case 'last-week': {
      const end = new Date(today);
      end.setDate(end.getDate() - end.getDay() - 1);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return { from: start, to: endOfDay(end) };
    }
    case 'this-month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    case 'last-month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start, to: endOfDay(end) };
    }
    case '3-months': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case '6-months': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case '1-year': {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case '3-years': {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 3);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case 'lifetime':
      return { from: new Date(0), to: endOfDay(now) };
    case 'custom':
      return {
        from: from ? new Date(from) : new Date(0),
        to: to ? endOfDay(new Date(to)) : endOfDay(now),
      };
    default:
      return { from: new Date(0), to: endOfDay(now) };
  }
}
