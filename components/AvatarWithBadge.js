export default function AvatarWithBadge({ image, name, role, emailVerified, size = 'md' }) {
  const dim = { xs: 'h-6 w-6', sm: 'h-7 w-7', md: 'h-8 w-8', lg: 'h-10 w-10', xl: 'h-16 w-16', '2xl': 'h-20 w-20' };
  const badgeDim = { xs: 'h-2.5 w-2.5', sm: 'h-3 w-3', md: 'h-3.5 w-3.5', lg: 'h-4 w-4', xl: 'h-5 w-5', '2xl': 'h-6 w-6' };
  const textSize = { xs: 'text-[8px]', sm: 'text-[9px]', md: 'text-xs', lg: 'text-sm', xl: 'text-base', '2xl': 'text-xl' };

  const initial = (name || 'U')[0].toUpperCase();
  const isLarge = size === 'xl' || size === '2xl';

  function Badge() {
    if (role === 'admin') return (
      <span className={`absolute -bottom-0.5 -right-0.5 ${badgeDim[size]} rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow`} title="Admin">
        <svg viewBox="0 0 16 16" fill="currentColor" className="text-amber-900 w-full h-full p-px">
          <path d="M8 1l1.5 3.5L13 5l-2.5 2.5.5 3.5L8 9.5 5 11l.5-3.5L3 5l3.5-.5z"/>
        </svg>
      </span>
    );
    if (role === 'staff') return (
      <span className={`absolute -bottom-0.5 -right-0.5 ${badgeDim[size]} rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow`} title="Staff">
        <svg viewBox="0 0 16 16" fill="currentColor" className="text-white w-full h-full p-[1.5px]">
          <path d="M6.5 1a.5.5 0 0 1 .5.5V3h2V1.5a.5.5 0 0 1 1 0V3h1.5A1.5 1.5 0 0 1 13 4.5v1A1.5 1.5 0 0 1 11.5 7H11v1.293l1.854 1.853a.5.5 0 0 1-.708.708L10.5 9.207V11h.5a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.5V9.207L3.854 10.854a.5.5 0 0 1-.708-.708L5 8.293V7h-.5A1.5 1.5 0 0 1 3 5.5v-1A1.5 1.5 0 0 1 4.5 3H6V1.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      </span>
    );
    if (emailVerified) return (
      <span className={`absolute -bottom-0.5 -right-0.5 ${badgeDim[size]} rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow`} title="Verified">
        <svg viewBox="0 0 16 16" fill="currentColor" className="text-white w-full h-full p-px">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
      </span>
    );
    return null;
  }

  return (
    <span className={`relative inline-flex flex-shrink-0 ${isLarge ? '' : ''}`}>
      {image ? (
        <img src={image} alt={name || ''} className={`${dim[size]} rounded-full object-cover`} />
      ) : (
        <span className={`${dim[size]} flex items-center justify-center rounded-full bg-primary ${textSize[size]} font-bold text-white`}>
          {initial}
        </span>
      )}
      <Badge />
    </span>
  );
}
