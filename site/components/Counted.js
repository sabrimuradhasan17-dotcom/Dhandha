'use client';
import { useState } from 'react';
export default function Counted({ name, label, max, defaultValue = '', area = false }) {
  const [v, setV] = useState(defaultValue || '');
  const P = area ? 'textarea' : 'input';
  return <div><label htmlFor={name}>{label}</label><P id={name} name={name} value={v} onChange={(e) => setV(e.target.value)} />
    <span className={v.length > max ? 'bad' : 'muted'} style={{ fontSize: 12 }}>{v.length}/{max} {v.length > max ? '(too long for Google)' : ''}</span></div>;
}
