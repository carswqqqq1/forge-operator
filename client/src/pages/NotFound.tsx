import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f6f5f2]">
      <div className="w-full max-w-lg mx-4 bg-white border border-[#e8e4dc] rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#f3f0ea] rounded-xl flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-[#1a1816]" />
          </div>
        </div>

        <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816] mb-2">
          404 - Page Not Found
        </h1>

        <p className="text-[#7a746c] text-[14px] mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex justify-center">
          <button
            onClick={handleGoHome}
            className="bg-[#1a1816] text-white px-6 py-2.5 rounded-xl flex items-center justify-center text-[13px] font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
