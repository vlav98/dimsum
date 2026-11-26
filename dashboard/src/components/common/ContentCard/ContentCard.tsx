import type { ComponentPropsWithoutRef } from 'react';
import './ContentCard.css';

export default function ContentCard({
  className = '',
  children,
  ...props
}: ComponentPropsWithoutRef<'section'>) {
  return (
    <section {...props} className={`content-card ${className}`.trim()}>
      {children}
    </section>
  );
}
