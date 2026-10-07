import { requireUser } from '@/lib/auth.js';
import { Flash } from '@/components/Admin.js';
import TourForm from '../TourForm.js';
export default function NewTour({ searchParams: q }) { requireUser(); return <><Flash q={q} /><h1>Add tour</h1><TourForm /></>; }
