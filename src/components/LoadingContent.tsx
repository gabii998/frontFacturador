const LoadingContent = () => {
  return (
    <div className="card flex flex-col items-center gap-5 py-12 text-slate-500 animate-pulse">
      {/* círculo central */}
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-inner">
        <div className="h-12 w-12 rounded-full bg-blue-300/50" />
      </div>

      {/* textos simulados */}
      <div className="space-y-2 text-center w-2/3">
        <div className="h-4 bg-slate-300/60 rounded w-1/2 mx-auto" />
        <div className="h-3 bg-slate-200/60 rounded w-4/5 mx-auto" />
        <div className="h-3 bg-slate-200/60 rounded w-3/5 mx-auto" />
      </div>
    </div>
  );
};

export default LoadingContent;