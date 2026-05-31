export const formatMessageTime = (iso: string): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatConversationListTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Hôm qua";
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 7) {
    return date.toLocaleDateString("vi-VN", { weekday: "long" });
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const formatMessageDateLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const groupMessagesByDate = <T extends { createdAt: string }>(
  messages: T[],
): { dateLabel: string; messages: T[] }[] => {
  const groups: { dateLabel: string; messages: T[] }[] = [];

  messages.forEach((message) => {
    const label = formatMessageDateLabel(message.createdAt);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.dateLabel === label) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ dateLabel: label, messages: [message] });
    }
  });

  return groups;
};
