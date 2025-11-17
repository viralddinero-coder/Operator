export const defaultStrings = {
  en: {
    operator: {
      nav: { dashboard: 'Dashboard', profiles: 'Profiles', chats: 'Chats', settings: 'Settings', logout: 'Log out' },
      conversations: 'Conversations', unknownUser: 'Unknown user', noLocation: 'No location',
      emptyConversations: 'No conversations available',
      chatHeader: { user: 'User', online: 'Online', away: 'Away' },
      chatNotes: { title: 'Chat Notes', placeholder: 'Write notes here' },
      input: { placeholder: 'Type a message...', image: 'Image/GIF', send: 'Send' },
      online: { title: 'Online', empty: 'No users online' },
      player: { title: 'Current Player', notes: 'Player Notes', notesPlaceholder: 'Persistent notes for your player' },
    }
  },
  sv: {
    operator: {
      nav: { dashboard: 'Dashboard', profiles: 'Profiler', chats: 'Chattar', settings: 'Inställningar', logout: 'Logga ut' },
      conversations: 'Konversationer', unknownUser: 'Okänd användare', noLocation: 'Ingen plats',
      emptyConversations: 'Inga konversationer tillgängliga',
      chatHeader: { user: 'Användare', online: 'Online', away: 'Frånvarande' },
      chatNotes: { title: 'Anteckning (chatt)', placeholder: 'Skriv anteckningar här' },
      input: { placeholder: 'Skriv ett meddelande...', image: 'Bild/GIF', send: 'Skicka' },
      online: { title: 'Online', empty: 'Inga kunder online' },
      player: { title: 'Aktuell Player', notes: 'Anteckning (player)', notesPlaceholder: 'Beständig anteckning för din kvinnliga profil' },
    }
  }
};

export type Lang = 'en' | 'sv';

export const getStrings = (lang: Lang, overrides?: any) => {
  const base = defaultStrings[lang];
  if (!overrides) return base;
  return JSON.parse(JSON.stringify(base), (key, value) => value);
};
