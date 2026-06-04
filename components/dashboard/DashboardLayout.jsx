const DashboardLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090d] text-white">

      {/* Background Glow */}
      <div className="absolute inset-0">

        <div className="absolute top-[-200px] left-[-150px] h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-[140px]" />

        <div className="absolute bottom-[-200px] right-[-150px] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />

      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;