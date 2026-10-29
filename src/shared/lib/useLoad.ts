import { useCallback, useEffect, useRef, useState } from "react"

/** Tiny data loader: { data, error, loading, reload, setData }. Keeps old data while reloading (no flicker). */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const seq = useRef(0)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const reload = useCallback(() => {
    const id = ++seq.current
    setLoading(true)
    return fnRef.current().then((r) => { if (id === seq.current) { setData(r); setError(false) } }).catch(() => { if (id === seq.current) setError(true) }).finally(() => { if (id === seq.current) setLoading(false) })
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void reload() }, deps)
  return { data, error, loading, reload, setData }
}
