import React from 'react';

export default function FloatingSocialBar() {
  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/joywatersportsvarkala/',
      icon: (
        <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/joywatersports-varkala/',
      icon: (
        <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/channel/UCAWsxntmXJQdkdpGgEGEN_A',
      icon: (
        <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInSidebar {
          0% {
            opacity: 0;
            transform: translateY(-50%) translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
        @keyframes floatSidebar {
          0%, 100% {
            margin-top: 0px;
          }
          50% {
            margin-top: -2px;
          }
        }
        .sidebar-container {
          animation: fadeInSidebar 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards, floatSidebar 3s ease-in-out infinite 0.6s;
        }
      `}</style>
      <aside
        aria-label="Social Media Links"
        className="sidebar-container fixed left-[-4px] sm:left-[-2px] md:left-[0px] top-1/2 -translate-y-1/2 z-50 w-[38px] sm:w-[40px] md:w-[42px] bg-white rounded-r-[24px] rounded-l-[10px] py-7 pl-1 pr-1 flex flex-col items-center justify-center gap-[24px] border border-[#E5E7EB] border-l-0 shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out hover:translate-x-[6px] cursor-pointer"
      >
        {socialLinks.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.name}
            className="text-[#2563EB] hover:text-[#1D4ED8] transition-all duration-300 ease-in-out transform hover:scale-[1.15] flex items-center justify-center cursor-pointer"
          >
            {item.icon}
          </a>
        ))}
      </aside>
    </>
  );
}


