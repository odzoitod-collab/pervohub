import React from 'react';

export const SkeletonPost: React.FC = () => (
  <div className="relative bg-white dark:bg-[#171717] rounded-none md:rounded-2xl p-3 md:p-5 mb-0 md:mb-4 border-x-0 border-t-0 md:border border-b border-[#efefef] dark:border-[#262626] animate-pulse">
    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#efefef] dark:bg-[#262626]" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-[#efefef] dark:bg-[#262626] rounded mb-1" />
        <div className="h-3 w-16 bg-[#efefef] dark:bg-[#262626] rounded" />
      </div>
    </div>
    <div className="h-4 w-full bg-[#efefef] dark:bg-[#262626] rounded mb-2" />
    <div className="h-4 w-3/4 bg-[#efefef] dark:bg-[#262626] rounded mb-3 md:mb-4" />
    <div className="h-48 md:h-64 bg-[#efefef] dark:bg-[#262626] rounded-none md:rounded-xl mb-2 md:mb-3" />
    <div className="flex gap-4 pt-2 md:pt-3 border-t border-[#efefef] dark:border-[#262626]">
      <div className="h-4 w-12 bg-[#efefef] dark:bg-[#262626] rounded" />
      <div className="h-4 w-12 bg-[#efefef] dark:bg-[#262626] rounded" />
    </div>
  </div>
);
