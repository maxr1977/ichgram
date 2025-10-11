export const emitToUsers = (eventName, payload, recipients = []) => {
  if (!recipients || !recipients.length) {
    return;
  }

  const io = global.io;
  if (!io) {
    return;
  }

  const uniqueRecipients = Array.from(
    new Set(
      recipients
        .filter(Boolean)
        .map((id) => id.toString()),
    ),
  );

  uniqueRecipients.forEach((userId) => {
    io.to(userId).emit(eventName, payload);
  });
};

export const emitToUser = (eventName, payload, userId) => {
  if (!userId) return;
  emitToUsers(eventName, payload, [userId]);
};
