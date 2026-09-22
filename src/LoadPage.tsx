export const LoadPage = () => {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-sm rounded-xl border border-stone-200 bg-white px-10 py-9 text-center shadow-sm">
        <svg
          className="mx-auto h-10 w-10 text-green-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20v-9" />
          <path d="M12 11c0-4 3-6 7-6-1 4-3 6-7 6Z" />
          <path d="M12 14c0-3-2-5-6-5 1 3 3 5 6 5Z" />
          <path d="M6 20h12" />
        </svg>
        <h1 className="mt-4 text-xl font-semibold text-stone-900">Under construction</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          This page is still a work in progress. Head back to Configuration in the meantime.
        </p>
      </div>
    </div>
  );
};
