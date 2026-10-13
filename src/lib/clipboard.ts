type Toast = (message: string, tone?: 'success' | 'error' | 'info') => void

/** Copies a course join code, falling back to showing it when the clipboard is blocked. */
export async function copyCode(code: string, toast: Toast) {
  try {
    await navigator.clipboard.writeText(code)
    toast(`Código ${code} copiado`)
  } catch {
    toast(`El código del curso es ${code}`, 'info')
  }
}
