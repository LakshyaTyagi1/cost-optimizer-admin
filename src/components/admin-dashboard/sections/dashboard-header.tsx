export function DashboardHeader() {
  return (
    <header className="max-w-3xl">
      <h1
        id="business-dashboard-title"
        className="text-[22px] leading-7 font-semibold tracking-[0.14px] text-[#171717] sm:text-[26px] sm:leading-9.75 sm:tracking-[0.22px]"
      >
        Business Dashboard
      </h1>
      <p className="mt-1 max-w-[34rem] text-[12px] leading-[18px] font-normal tracking-[-0.04px] text-[#86868B] sm:mt-0.5 sm:text-[13px] sm:leading-[19.5px]">
        Overview of every assessment submitted through the Enterprise Cost Optimizer.
      </p>
    </header>
  );
}
