// Illustrated photo placeholder, or the uploaded image when one exists
export default function Art({ hue = 30, label = '', image, scene = 0, priority = false }) {
  if (image) return <div className="ph"><img src={`/uploads/${image}`} alt={label} loading={priority ? 'eager' : 'lazy'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div>;
  const id = `g${hue}x${scene}`;
  return (
    <div className="ph">
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={`hsl(${hue},60%,76%)`} /><stop offset="1" stopColor={`hsl(${hue},50%,93%)`} /></linearGradient></defs>
        <rect width="400" height="200" fill={`url(#${id})`} />
        <circle cx="310" cy="48" r="22" fill={`hsl(${hue},85%,90%)`} />
        {scene % 2 ? <>
          <path d="M0 200v-35l60-10 40 20 70-30 90 25 60-20 80 20v30z" fill={`hsl(${hue},40%,28%)`} />
          <path d="M150 120h100v40H150z M140 120l60-30 60 30z" fill={`hsl(${hue},55%,70%)`} /></> : <>
          <path d="M0 200V120l70-55 60 50 70-80 80 90 50-35 70 60v50z" fill={`hsl(${hue},35%,45%)`} />
          <path d="M0 200v-40l90-30 80 40 90-45 140 50v25z" fill={`hsl(${hue},40%,30%)`} /></>}
      </svg>
    </div>
  );
}
