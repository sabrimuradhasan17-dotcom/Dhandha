import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { tourById } from '@/lib/queries.js';
import { Flash } from '@/components/Admin.js';
import TourForm from '../TourForm.js';
export default function EditTour({ params, searchParams: q }) {
  requireUser(); const t = tourById(Number(params.id)); if (!t) notFound();
  return <><Flash q={q} /><h1>Edit tour</h1>{t.status === 'live' && <p><Link href={`/tours/${t.slug}`} target="_blank">View on website ↗</Link></p>}<TourForm t={t} /></>;
}
