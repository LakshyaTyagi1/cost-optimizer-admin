export function DashboardHeader() {
  return (
    <header className="max-w-3xl">
      <h1
        id="business-dashboard-title"
        className="text-2xl leading-8 font-semibold tracking-[0.18px] text-[#171717] sm:text-[26px] sm:leading-9.75 sm:tracking-[0.22px]"
      >
        Business Dashboard
      </h1>
      <p className="mt-1 text-[13px] leading-[19.5px] font-normal tracking-[-0.08px] text-[#86868B] sm:mt-0.5">
        Overview of every assessment submitted through the Enterprise Cost Optimizer.
      </p>
    </header>
  );
}
