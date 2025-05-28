const AuthLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-[#1F1F1F]">
      {children}
    </div>
  );
};

export default AuthLayout; 