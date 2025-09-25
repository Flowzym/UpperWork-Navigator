export function showToast(msg: string, type: 'info'|'warn'|'error'='info'){
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('toast', { detail: { msg, type } }));
  }
  const log = type==='error'?'error':type==='warn'?'warn':'log';
  console[log]('[toast]', msg);
}