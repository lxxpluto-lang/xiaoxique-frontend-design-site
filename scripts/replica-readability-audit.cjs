// Runs inside the current browser document. Read-only diagnostics, not WCAG certification.
function auditReadability() {
  const rendered = e => {
    if (!e.getClientRects().length) return false
    for (let p = e; p; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
    }
    return true
  }
  const name = e => {
    const id = e.getAttribute('data-testid')
    if (id) return '[data-testid="' + id + '"]'
    const parts = []
    for (let p = e; p && parts.length < 4; p = p.parentElement) {
      parts.unshift(p.tagName.toLowerCase() + (p.classList.length ? '.' + [...p.classList].join('.') : ''))
      if (p.getAttribute('data-testid')) break
    }
    return parts.join(' > ')
  }
  const rgba = value => {
    const m = value.match(/^rgba?\(([^)]+)\)$/)
    if (!m) return null
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    return parts.length >= 3 && parts.every(Number.isFinite) ? [parts[0],parts[1],parts[2],parts[3] ?? 1] : null
  }
  const blend = (top, bottom) => {
    const a = top[3] + bottom[3] * (1 - top[3])
    return a ? [0,1,2].map(i => (top[i]*top[3]+bottom[i]*bottom[3]*(1-top[3]))/a).concat(a) : [0,0,0,0]
  }
  const luminance = c => c.slice(0,3).map(v => { v /= 255; return v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4 }).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0)
  const plainContrast = e => {
    for (let p = e; p; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (Number(s.opacity) < 1 || s.filter !== 'none') return { reason: 'opacity/filter requires pixel review' }
    }
    let background = [0,0,0,0]
    for (let p = e; p; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (Number(s.opacity) < 1 || s.filter !== 'none') return { reason: 'opacity/filter requires pixel review' }
      if (s.backgroundImage !== 'none') return { reason: 'gradient/image requires pixel review' }
      const color = rgba(s.backgroundColor)
      if (!color) return { reason: 'unsupported background color' }
      background = blend(background,color)
      if (background[3] >= .999) break
    }
    if (background[3] < .999) return { reason: 'no opaque background found' }
    const foreground = rgba(getComputedStyle(e).color)
    if (!foreground) return { reason: 'unsupported text color' }
    const a = luminance(blend(foreground,background)), b = luminance(background)
    return { ratio: (Math.max(a,b)+.05)/(Math.min(a,b)+.05), foreground: getComputedStyle(e).color, background: background.slice(0,3).map(Math.round) }
  }
  const texts = [...document.querySelectorAll('uni-text,uni-button,input,textarea')]
    .filter(rendered).filter(e => e.matches('uni-text,input,textarea') || (!e.querySelector('uni-text') && e.textContent.trim()))
    .map(e => {
      const s = getComputedStyle(e), r = e.getBoundingClientRect()
      const disabled = !!e.closest('[disabled="true"],[disabled=""],[aria-disabled="true"]')
      return { selector: name(e), text: (e.value || e.getAttribute('placeholder') || e.textContent || '').trim().slice(0,120), size: parseFloat(s.fontSize), weight: parseInt(s.fontWeight)||400, disabled, inViewport: r.bottom>0 && r.top<innerHeight && r.right>0 && r.left<innerWidth, contrast: disabled ? {reason:'disabled control excluded'} : plainContrast(e) }
    }).filter(r=>r.text)
  const controls = [...document.querySelectorAll('uni-button,uni-input,uni-textarea,uni-switch,uni-slider')]
    .filter(rendered).filter(e=>!e.matches('[disabled="true"],[disabled=""],[aria-disabled="true"]') && !e.querySelector('input:disabled,textarea:disabled'))
    .map(e=>{const r=e.getBoundingClientRect();return {selector:name(e),label:(e.getAttribute('aria-label')||e.textContent||e.querySelector('input')?.placeholder||'').trim().slice(0,100),width:r.width,height:r.height,inViewport:r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}})
  return {
    version: 2,
    scope: 'Rendered DOM including content below scroll folds; display/visibility hidden nodes excluded. Uni-text internal spans included. No accessibility-tree, keyboard, overlap, raster, native-device or assistive-tech proof.',
    textCount: texts.length, controlCount: controls.length,
    smallText: texts.filter(r=>r.size<11-.01),
    smallTargets: controls.filter(r=>r.width<44-.01||r.height<44-.01),
    lowPlainContrast: texts.filter(r=>r.contrast.ratio && r.contrast.ratio<(r.size>=24||(r.size>=18.66&&r.weight>=700)?3:4.5)),
    unverifiedContrast: texts.filter(r=>!r.contrast.ratio).map(({selector,text,contrast})=>({selector,text,...contrast})),
  }
}
module.exports = { auditReadability }
