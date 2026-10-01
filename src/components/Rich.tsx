// Muestra texto con **negrilla**. Párrafos separados por una línea en blanco.
function bold(text: string) {
  return text.split('**').map((s, i) => (i % 2 ? <b key={i}>{s}</b> : <span key={i}>{s}</span>))
}

export default function Rich({ text, inline }: { text: string; inline?: boolean }) {
  if (inline) return <>{bold(text)}</>
  return <>{text.split(/\n\s*\n/).map((p, i) => <p key={i}>{bold(p)}</p>)}</>
}
