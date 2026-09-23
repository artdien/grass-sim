export const NotFoundPage = () => {
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
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 9l-7 6" />
          <path d="M9.5 9l7 6" />
        </svg>
        <h1 className="mt-4 text-xl font-semibold text-stone-900">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          The URL you entered did not match any page.
          <br />
          Use the navbar above to head back to Simulation or Import Settings.
        </p>
      </div>
    </div>
  );
};
