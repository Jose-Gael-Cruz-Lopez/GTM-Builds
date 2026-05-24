/** Dev-only axe-core accessibility audit */
export async function initAxeDev() {
  if (!import.meta.env.DEV) return
  try {
    const axe = await import('@axe-core/react')
    const React = await import('react')
    const ReactDOM = await import('react-dom')
    await axe.default(React.default, ReactDOM.default, 1000, {})
  } catch {
    // axe optional in dev
  }
}
