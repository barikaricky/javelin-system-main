export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#0f172a] px-4">
      <div className="text-center max-w-sm w-full">
        {/* Animated Logo Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute w-16 h-16 border-4 border-green-500 border-b-transparent rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }}></div>
            <div className="absolute w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-[#1e3a8a]">J</span>
            </div>
          </div>
        </div>
        
        {/* Card Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            javelin
          </h1>
          <h2 className="text-lg font-semibold text-white mb-4">
            Management System
          </h2>
          
          <div className="space-y-3 mb-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
          
          <p className="text-sm text-gray-300">
            Initializing your workspace...
          </p>
        </div>
        
        {/* Floating Elements */}
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
