export const BOOKINGS_API = 'http://localhost:3007/bookings';

export async function calculateBookingTime(taskerId: number, serviceId: string | number, sqMeters: string) {
  const url = `${BOOKINGS_API}/calculate-time/${taskerId}/${serviceId}?sqMeters=${encodeURIComponent(sqMeters)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to calculate time');
  }
  return response.json();
}

export async function createBooking(bookingRequest: any) {
  const response = await fetch(BOOKINGS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingRequest),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create booking' }));
    throw new Error(errorData.message || 'Failed to create booking');
  }
  return response.json();
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const url = `${BOOKINGS_API}/${bookingId}/status`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update booking status');
  }
  return response.json();
}

export async function getTaskerPendingAcceptedBookings(userId: string) {
  const url = `${BOOKINGS_API}/pending-accepted/tasker/${userId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch tasker bookings');
  }
  return response.json();
}

export async function cancelBooking(bookingId: string) {
  const url = `${BOOKINGS_API}/${bookingId}/cancel`;
  const response = await fetch(url, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to cancel booking');
  }
  return response.json();
}

export async function completeBooking(bookingId: string) {
  const url = `${BOOKINGS_API}/${bookingId}/complete`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to complete booking');
  }
  return response.json();
}