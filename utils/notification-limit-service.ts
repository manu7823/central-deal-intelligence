export const NotificationLimitService = {
  async getNotificationLimit(categories: { slug: string; level: number }[]) {
    const res = await fetch(
      'https://automate.voppmann.com/webhook/notification-limit',
      {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(categories)
      }
    );

    if (!res.ok) {
      console.log('Error in getNotificationLimit', { res });

      throw Error(res.statusText);
    }

    const data = await res.json();

    return data.maxDealsPerDay;
  }
};
