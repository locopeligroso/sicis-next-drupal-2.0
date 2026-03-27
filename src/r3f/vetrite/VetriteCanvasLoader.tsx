'use client';

import dynamic from 'next/dynamic';
import type { VetriteCanvasProps } from '@/r3f/vetrite/types';

const VetriteCanvas = dynamic(() => import('@/r3f/vetrite/VetriteCanvas'), {
  ssr: false,
  loading: () => null,
});

export default function VetriteCanvasLoader(props: VetriteCanvasProps) {
  return <VetriteCanvas {...props} />;
}
