import Link from 'next/link';
export const metadata = { title: 'Page not found', robots: { index: false } };
export default function NotFound() { return <section className="sec wrap"><h1>Page not found</h1><p><Link href="/">Back to home</Link> or <Link href="/tours">browse tours</Link>.</p></section>; }
