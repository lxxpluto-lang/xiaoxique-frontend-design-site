/** H5-only adapter for Uni custom elements. Invokes existing click handlers;
 * it never owns patient data, policy, training, rewards or persistence. */
export function installPrototypeKeyboard(root: HTMLElement, options: { onCarouselKey: (key: string) => void }) {
  const customButtons = 'uni-button,uni-switch,uni-picker,.uni-modal__btn,.uni-picker-action'
  const focusSelector = 'button,a[href],input,textarea,select,[tabindex]'
  let disposed = false, frame = 0, activeDialog: HTMLElement | null = null
  let opener: HTMLElement | null = null, lastTrigger: HTMLElement | null = null
  let spaceTarget: HTMLElement | null = null, keyboardMode = false
  const consumedKeyups = new Set<string>()
  const inerted = new Map<HTMLElement, boolean>()
  let bodyOverflow: string | null = null
  const set = (e: HTMLElement, key: string, value: string) => {
    if (e.getAttribute(key) !== value) e.setAttribute(key, value)
  }
  const disabled = (e: HTMLElement) =>
    (e.hasAttribute('disabled') && e.getAttribute('disabled') !== 'false') || e.getAttribute('aria-disabled') === 'true'
  const rendered = (e: HTMLElement) => {
    if (!e.isConnected || !e.getClientRects().length || e.closest('[hidden],[aria-hidden="true"],[inert]')) return false
    for (let p: HTMLElement | null = e; p; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false
    }
    return true
  }
  const inScope = (e: HTMLElement) => root.contains(e) || !!e.closest('uni-modal,.uni-picker-container')
  const candidates = (scope: HTMLElement) => Array.from(scope.querySelectorAll<HTMLElement>(focusSelector))
    .filter(e => e.tabIndex >= 0 && !disabled(e) && rendered(e))
  const safeDismiss = (dialog: HTMLElement) => dialog.querySelector<HTMLElement>('[data-keyboard-dismiss],.uni-modal__btn_default,.uni-picker-action-cancel')
  const focus = (e: HTMLElement | null) => { if (e && rendered(e)) e.focus({ preventScroll: true }) }
  const unlockBackground = () => {
    for (const [e, wasInert] of inerted) { if (!wasInert) e.removeAttribute('inert') }
    inerted.clear()
    if (bodyOverflow !== null) { document.body.style.overflow = bodyOverflow; bodyOverflow = null }
  }
  const lockBackground = (dialog: HTMLElement) => {
    // Lock sibling branches, not a containing app node that would inert the dialog.
    for (let child: HTMLElement = dialog; child.parentElement && child !== document.body; child = child.parentElement) {
      for (const sibling of Array.from(child.parentElement.children)) {
        if (sibling === child || !(sibling instanceof HTMLElement) || /^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName)) continue
        if (!inerted.has(sibling)) inerted.set(sibling, sibling.hasAttribute('inert'))
        sibling.setAttribute('inert', '')
      }
    }
    bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  const sync = () => {
    if (disposed) return
    for (const e of Array.from(document.querySelectorAll<HTMLElement>(customButtons))) {
      if (!inScope(e)) continue
      const tag = e.tagName.toLowerCase()
      if (tag === 'uni-button' || tag === 'uni-switch' || tag === 'uni-picker') {
        const off = e.hasAttribute('disabled') && e.getAttribute('disabled') !== 'false'
        set(e, 'aria-disabled', String(off))
      }
      if (!e.hasAttribute('role')) set(e, 'role', tag === 'uni-switch' ? 'switch' : 'button')
      const nativeProxy = e.getAttribute('data-keyboard-proxy')
      const proxied = nativeProxy && root.querySelector('[data-testid="' + nativeProxy + '"]')
      if (proxied) set(e, 'aria-hidden', 'true')
      set(e, 'tabindex', disabled(e) || !!e.closest('[aria-hidden="true"]') ? '-1' : '0')
    }
    // Uni forwards aria-label to its wrapper; the actual editable element needs it too.
    for (const wrapper of Array.from(root.querySelectorAll<HTMLElement>('uni-input,uni-textarea'))) {
      const input = wrapper.querySelector<HTMLElement>('input,textarea')
      const label = wrapper.getAttribute('aria-label') || wrapper.closest('uni-label')?.querySelector('uni-text')?.textContent?.trim()
      if (input && label) set(input, 'aria-label', label)
    }
    const dialogs = Array.from(document.querySelectorAll<HTMLElement>('.prototype-shell .modal-mask,uni-modal > .uni-modal,.uni-picker-custom.uni-picker-toggle'))
      // Ignore inert left behind by the previous modal before selecting a new one.
      .filter(e => e.isConnected && e.getClientRects().length && !Array.from(e.closest('uni-modal') ? [e.closest('uni-modal')!] : [e]).some(p => getComputedStyle(p).display === 'none'))
    const next = dialogs[dialogs.length - 1] || null
    if (next !== activeDialog) {
      const previous = activeDialog
      unlockBackground(); activeDialog = next
      if (next) {
        opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : lastTrigger
        if (!next.hasAttribute('role')) set(next, 'role', 'dialog')
        set(next, 'aria-modal', 'true'); set(next, 'tabindex', '-1')
        if (!next.hasAttribute('aria-label')) set(next, 'aria-label', next.querySelector('.uni-modal__title')?.textContent || '选择日期')
        lockBackground(next)
        focus(safeDismiss(next) || candidates(next)[0] || next)
      } else if (previous) {
        const restore = opener; opener = null
        if (restore && rendered(restore) && !disabled(restore)) focus(restore)
        else if (keyboardMode) focus(candidates(root)[0] || null)
      }
    }
    if (keyboardMode && !activeDialog && document.activeElement === document.body && lastTrigger && !lastTrigger.isConnected) {
      focus(candidates(root)[0] || null); lastTrigger = null
    }
    // A Uni modal may initially be opacity:0 during its entrance transition.
    // Retry after transition class mutations instead of leaving focus in inert content.
    if (activeDialog && !activeDialog.contains(document.activeElement)) {
      focus(safeDismiss(activeDialog) || candidates(activeDialog)[0] || activeDialog)
    }
  }
  const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(() => { frame = 0; sync() }) }
  const activate = (target: HTMLElement) => {
    if (!rendered(target) || disabled(target) || (activeDialog && !activeDialog.contains(target))) return
    lastTrigger = target; target.click()
  }
  const keydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
    keyboardMode = true; sync()
    const target = event.target instanceof HTMLElement ? event.target : null
    if (!target || (!inScope(target) && !activeDialog)) return
    if (activeDialog && event.key === 'Escape') {
      consumedKeyups.add('Escape')
      event.preventDefault(); event.stopPropagation()
      const dismiss = safeDismiss(activeDialog)
      if (dismiss) activate(dismiss)
      return
    }
    if (activeDialog && event.key === 'Tab') {
      const list = candidates(activeDialog), index = list.indexOf(document.activeElement as HTMLElement)
      if (!list.length) { event.preventDefault(); focus(activeDialog); return }
      if (index < 0 || (event.shiftKey ? index === 0 : index === list.length - 1)) {
        event.preventDefault(); focus(event.shiftKey ? list[list.length - 1] : list[0])
      }
      return
    }
    // Native form inputs and media retain their native keyboard/confirm behavior.
    if (target.closest('input,textarea,select,video,[contenteditable="true"]')) return
    if (target.matches('[data-keyboard-carousel="prescription"]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      if (activeDialog || !rendered(target)) return
      event.preventDefault(); event.stopPropagation(); options.onCarouselKey(event.key)
      return
    }
    const slider = target.closest<HTMLElement>('uni-slider[role="slider"]')
    if (slider && ['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation()
      if (disabled(slider) || !rendered(slider) || (activeDialog && !activeDialog.contains(slider))) return
      const min = Number(slider.getAttribute('aria-valuemin')), max = Number(slider.getAttribute('aria-valuemax'))
      const current = Number(slider.getAttribute('aria-valuenow') || min), step = Number(slider.getAttribute('data-keyboard-step') || 1)
      const value = event.key === 'Home' ? min : event.key === 'End' ? max : Math.min(max, Math.max(min, current + (['ArrowLeft','ArrowDown'].includes(event.key) ? -step : step)))
      if (![min,max,current,step,value].every(Number.isFinite) || max <= min) return
      // Uni H5's original slider click handler computes value from root width.
      const rect = slider.getBoundingClientRect()
      slider.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.left + rect.width * (value-min)/(max-min), clientY: rect.top + rect.height / 2 }))
      return
    }
    const button = target.closest<HTMLElement>(customButtons)
    if (!button) return
    if (event.key === 'Enter') {
      consumedKeyups.add('Enter')
      event.preventDefault(); event.stopPropagation()
      if (!event.repeat) activate(button)
    } else if (event.key === ' ') {
      event.preventDefault(); event.stopPropagation()
      if (!event.repeat && !disabled(button)) spaceTarget = button
    }
  }
  const keyup = (event: KeyboardEvent) => {
    // Uni usePopup listens to document keyup: the Enter used to OPEN a dialog
    // must not immediately CONFIRM the new dialog when that same key is released.
    if (consumedKeyups.delete(event.key)) {
      event.preventDefault(); event.stopPropagation(); return
    }
    if (event.key !== ' ') return
    const target = spaceTarget; spaceTarget = null
    if (!target) return
    event.preventDefault(); event.stopPropagation()
    if (target === document.activeElement) activate(target)
  }
  const pointerdown = (event: Event) => {
    keyboardMode = false; spaceTarget = null
    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(customButtons) : null
    if (target && inScope(target)) lastTrigger = target
  }
  const focusin = (event: FocusEvent) => {
    if (activeDialog && event.target instanceof HTMLElement && !activeDialog.contains(event.target)) focus(safeDismiss(activeDialog) || candidates(activeDialog)[0] || activeDialog)
  }
  const preventBackgroundScroll = (event: Event) => {
    if (activeDialog && event.target instanceof Node && !activeDialog.contains(event.target)) event.preventDefault()
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled','class','style','aria-hidden','aria-label'] })
  document.addEventListener('keydown', keydown, true); document.addEventListener('keyup', keyup, true)
  document.addEventListener('pointerdown', pointerdown, true); document.addEventListener('focusin', focusin, true)
  document.addEventListener('wheel', preventBackgroundScroll, { capture: true, passive: false })
  document.addEventListener('touchmove', preventBackgroundScroll, { capture: true, passive: false })
  sync()
  return () => {
    disposed = true; observer.disconnect(); cancelAnimationFrame(frame); unlockBackground()
    document.removeEventListener('keydown', keydown, true); document.removeEventListener('keyup', keyup, true)
    document.removeEventListener('pointerdown', pointerdown, true); document.removeEventListener('focusin', focusin, true)
    document.removeEventListener('wheel', preventBackgroundScroll, true); document.removeEventListener('touchmove', preventBackgroundScroll, true)
  }
}
