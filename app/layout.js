export const metadata = {
  title: 'Поиск фильмов',
  description: 'Смотрите фильмы в хорошем качестве с выбором плеера',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}