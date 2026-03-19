import Link from 'next/link';

type LogoProps = {
  className?: string;
  showText?: boolean;
  compact?: boolean;
  href?: string;
  ariaLabel?: string;
};

export function Logo({
  className = '',
  showText = true,
  compact = false,
  href = '/',
  ariaLabel = 'ForecastFlow',
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path
            d="M4 16.5C4 15.1193 5.11929 14 6.5 14C7.88071 14 9 15.1193 9 16.5C9 17.8807 7.88071 19 6.5 19C5.11929 19 4 17.8807 4 16.5Z"
            fill="currentColor"
          />
          <path
            d="M10 11.5C10 10.1193 11.1193 9 12.5 9C13.8807 9 15 10.1193 15 11.5C15 12.8807 13.8807 14 12.5 14C11.1193 14 10 12.8807 10 11.5Z"
            fill="currentColor"
          />
          <path
            d="M16 7.5C16 6.11929 17.1193 5 18.5 5C19.8807 5 21 6.11929 21 7.5C21 8.88071 19.8807 10 18.5 10C17.1193 10 16 8.88071 16 7.5Z"
            fill="currentColor"
          />
          <path
            d="M4.5 16.5L9.5 12.5L14.5 15.5L19.5 9.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {!compact && showText && (
        <span className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
          ForecastFlow
        </span>
      )}
    </Link>
  );
}
